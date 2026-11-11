// =============================================================
// Trendcode community: shared helpers + the discussion thread that
// mounts under every explainer and Library guide.
// Needs main.js (store, escapeHtml, BASE, tcAccountLoad) and avatar.js.
// Tables live in supabase/schema.sql (comments, chat_messages, predictions).
// =============================================================
(function () {
  const ROOMS = [
    { id: "lobby", name: "lobby", blurb: "Say hello, ask anything, share what you're learning.", topics: [] },
    { id: "crypto", name: "crypto", blurb: "Ciphers, hashes, post-quantum and the maths behind them.", topics: ["pqc", "crypto"], lib: ["crypto"] },
    { id: "ai", name: "ai", blurb: "Models, agents, alignment and AI security.", topics: ["ai", "ml"], lib: ["ai"] },
    { id: "security", name: "security", blurb: "Threats, defences, privacy and staying safe online.", topics: ["websec", "privacy"], lib: ["privacy"] },
    { id: "emerging", name: "emerging", blurb: "Quantum, robotics, BCIs and the next big thing.", topics: ["quantum", "emerging"], lib: ["emerging"] },
    { id: "code-help", name: "code-help", blurb: "Stuck on a lab or the playground? Paste it here.", topics: ["algo", "systems"] },
    { id: "predictions", name: "predictions", blurb: "Argue about the future. Bring receipts.", topics: [] },
  ];
  const roomFor = ({ topic, lib } = {}) =>
    (ROOMS.find((r) => (topic && r.topics.includes(topic)) || (lib && (r.lib || []).includes(lib))) || ROOMS[0]).id;

  // ---------- formatting ----------
  const timeAgo = (iso) => {
    const s = Math.max(1, (Date.now() - Date.parse(iso)) / 1000);
    if (s < 45) return "just now";
    const steps = [[60, "min", 60], [24, "h", 3600], [7, "d", 86400]];
    for (const [limit, unit, size] of steps) { const n = Math.round(s / size); if (n < limit) return `${Math.max(1, n)} ${unit} ago`; }
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: Date.parse(iso) < Date.now() - 300 * 86400000 ? "numeric" : undefined });
  };
  const clock = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  // Escape first, then allow `code`, **bold** and bare https links. Nothing else becomes HTML.
  const format = (text) =>
    escapeHtml(text)
      .replace(/`([^`\n]{1,200})`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]{1,200})\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])(https:\/\/[^\s<)]{3,300})/g, '$1<a href="$2" target="_blank" rel="nofollow ugc noopener noreferrer">$2</a>')
      .replace(/\n/g, "<br />");

  // ---------- authors ----------
  const profiles = new Map(); // user_id -> { username, display_name, character } | null (private)
  const author = (uid, p = profiles.get(uid)) => ({
    name: p ? p.display_name || p.username : "A private learner",
    handle: p ? p.username : "",
    href: p ? `${BASE}profile.html?u=${encodeURIComponent(p.username)}` : "",
    avatar: (size) => TCAvatar.svg({ ...TCAvatar.DEFAULT, ...((p && p.character) || {}) }, size, { noEmblem: true }),
  });
  async function loadProfiles(client, ids) {
    const missing = [...new Set(ids)].filter((id) => id && !profiles.has(id));
    if (!missing.length) return;
    const { data } = await client.from("profiles").select("id, username, display_name, character").in("id", missing);
    missing.forEach((id) => profiles.set(id, null));
    (data || []).forEach((p) => profiles.set(p.id, p));
  }
  const remember = (rows) => rows.forEach((r) => r.profiles !== undefined && profiles.set(r.user_id, r.profiles));
  const AUTHOR = "profiles(username, display_name, character)";

  // Path of this page relative to the site root, for ?next= after sign-in
  const herePath = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    const depth = (document.body.dataset.base || "").split("../").length - 1;
    const rel = parts.slice(-(depth + 1)).join("/") || "index.html";
    return /\.html$/.test(rel) ? rel : rel + ".html"; // clean URLs on Vercel drop the .html; login.html?next= expects it
  };
  const signInHref = (hash = "") => `${BASE}login.html?next=${encodeURIComponent(herePath() + hash)}`;
  const nicerError = (e) => {
    const m = (e && e.message) || String(e);
    if (/violates foreign key/.test(m)) return "Finish setting up your profile first, then try again.";
    if (/relation .* does not exist|schema cache/.test(m)) return "The community tables aren't set up yet. The site owner needs to run supabase/schema.sql.";
    return m;
  };

  // ---------- discussion thread ----------
  // mountThread(el, "post:hashing-explained", { title, room })
  function mountThread(root, thread, opts = {}) {
    root.classList.add("discussion");
    root.innerHTML = `
      <header class="dz-head">
        <h2>Discussion <span class="dz-count" aria-live="polite"></span></h2>
        ${opts.room ? `<a class="dz-room" href="${BASE}chat.html#hq/${opts.room}">Talk live in <b>#${opts.room}</b> →</a>` : ""}
      </header>
      <p class="dz-intro muted">${escapeHtml(opts.intro || "Questions, corrections, a better analogy, a real-world story: add it here. Be kind, be specific.")}</p>
      <div class="dz-compose"><p class="muted dz-loading">Loading the conversation…</p></div>
      <ol class="dz-list"></ol>`;
    const list = root.querySelector(".dz-list");
    const composeBox = root.querySelector(".dz-compose");
    const countEl = root.querySelector(".dz-count");
    let rows = [], acct = null, channel = null;

    const paint = () => {
      const top = rows.filter((r) => !r.parent_id).sort((a, b) => b.created_at.localeCompare(a.created_at));
      const kids = (id) => rows.filter((r) => r.parent_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));
      countEl.textContent = rows.length ? `· ${rows.length}` : "";
      list.innerHTML = top.length
        ? top.map((r) => item(r, kids(r.id))).join("")
        : `<li class="dz-empty">No one has said anything yet. Start it off.</li>`;
    };
    const item = (r, replies = null) => {
      const a = author(r.user_id);
      const mine = acct && acct.user && acct.user.id === r.user_id;
      const who = a.href ? `<a href="${a.href}">${escapeHtml(a.name)}</a>` : escapeHtml(a.name);
      return `<li class="dz-item" data-id="${r.id}" id="c${r.id}">
        <span class="dz-av" aria-hidden="true">${a.avatar(36)}</span>
        <div class="dz-main">
          <p class="dz-meta"><strong>${who}</strong>${a.handle ? ` <span>@${escapeHtml(a.handle)}</span>` : ""} <time datetime="${r.created_at}" title="${new Date(r.created_at).toLocaleString()}">${timeAgo(r.created_at)}</time></p>
          <div class="dz-body">${format(r.body)}</div>
          <p class="dz-actions">
            ${replies && acct && acct.user ? `<button type="button" data-reply="${r.id}">Reply</button>` : ""}
            ${mine ? `<button type="button" data-del="${r.id}">Delete</button>` : ""}
          </p>
          ${replies ? `<ol class="dz-replies">${replies.map((k) => item(k)).join("")}</ol><div class="dz-reply-slot"></div>` : ""}
        </div>
      </li>`;
    };

    const form = (parentId = null) => {
      const f = document.createElement("form");
      f.className = "dz-form";
      f.innerHTML = `
        <span class="dz-av" aria-hidden="true">${TCAvatar.svg(TCAvatar.get(), 36, { noEmblem: true })}</span>
        <div class="dz-field">
          <label class="sr-only" for="dz-${parentId || "new"}">${parentId ? "Your reply" : "Add to the discussion"}</label>
          <textarea id="dz-${parentId || "new"}" rows="${parentId ? 2 : 3}" maxlength="2000" required placeholder="${parentId ? "Write a reply…" : "Add to the discussion…"}"></textarea>
          <div class="dz-bar"><small class="muted">\`code\`, **bold** and https links work · <span class="dz-left">2000</span> left</small>
            <span>${parentId ? `<button type="button" class="btn btn-ghost btn-small dz-cancel">Cancel</button> ` : ""}<button class="btn btn-small" type="submit">${parentId ? "Reply" : "Post"}</button></span></div>
          <p class="dz-err" role="alert"></p>
        </div>`;
      const ta = f.querySelector("textarea");
      ta.addEventListener("input", () => (f.querySelector(".dz-left").textContent = 2000 - ta.value.length));
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) f.requestSubmit(); });
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const body = ta.value.trim();
        if (!body) return;
        const btn = f.querySelector("[type=submit]");
        btn.disabled = true;
        const { data, error } = await acct.client.from("comments")
          .insert({ thread, body, parent_id: parentId, user_id: acct.user.id }).select(`*, ${AUTHOR}`).single();
        btn.disabled = false;
        if (error) { f.querySelector(".dz-err").textContent = nicerError(error); return; }
        remember([data]);
        if (!rows.some((r) => r.id === data.id)) rows.push(data);
        ta.value = "";
        if (parentId) f.remove();
        paint();
        if (typeof opts.onPost === "function") opts.onPost(data);
      });
      return f;
    };

    list.addEventListener("click", async (e) => {
      const rep = e.target.closest("[data-reply]");
      const del = e.target.closest("[data-del]");
      if (rep) {
        const slot = rep.closest(".dz-item").querySelector(".dz-reply-slot");
        if (!slot.firstChild) { const f = form(+rep.dataset.reply); slot.append(f); f.querySelector(".dz-cancel").onclick = () => f.remove(); }
        slot.querySelector("textarea").focus();
      }
      if (del && confirm("Delete this comment? Replies to it go too.")) {
        const id = +del.dataset.del;
        const { error } = await acct.client.from("comments").delete().eq("id", id);
        if (error) return toast(`<div>${escapeHtml(nicerError(error))}</div>`);
        rows = rows.filter((r) => r.id !== id && r.parent_id !== id);
        paint();
      }
    });

    const paintComposer = () => {
      if (!acct || !acct.enabled) {
        composeBox.innerHTML = `<p class="muted">Discussions need the site's account server, which isn't connected on this copy.</p>`;
      } else if (!acct.user) {
        composeBox.innerHTML = `<div class="dz-signin"><p>Sign in to join the discussion. Reading is open to everyone.</p><a class="btn btn-small" href="${signInHref("#discussion")}">Sign in or create an account</a></div>`;
      } else {
        composeBox.innerHTML = "";
        composeBox.append(form());
      }
    };

    async function start() {
      acct = await window.tcAccountLoad();
      paintComposer();
      if (!acct.enabled) { list.innerHTML = ""; return; }
      const { data, error } = await acct.client.from("comments").select(`*, ${AUTHOR}`).eq("thread", thread).order("created_at").limit(500);
      if (error) { list.innerHTML = `<li class="dz-empty">${escapeHtml(nicerError(error))}</li>`; return; }
      rows = data; remember(rows); paint();
      channel = acct.client.channel(`thread:${thread}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `thread=eq.${thread}` }, async ({ new: r }) => {
          if (rows.some((x) => x.id === r.id)) return;
          await loadProfiles(acct.client, [r.user_id]);
          rows.push(r); paint();
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "comments" }, ({ old }) => {
          if (!rows.some((x) => x.id === old.id)) return;
          rows = rows.filter((x) => x.id !== old.id && x.parent_id !== old.id); paint();
        })
        .subscribe();
      document.addEventListener("tc-account", () => { paintComposer(); paint(); });
      if (location.hash.startsWith("#c")) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "center" });
    }
    // Load only when the reader gets near it, so articles stay fast.
    const io = new IntersectionObserver((ents) => { if (ents.some((x) => x.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: "600px" });
    io.observe(root);
    if (location.hash === "#discussion" || location.hash.startsWith("#c")) { io.disconnect(); start(); root.scrollIntoView(); }
    return { stop: () => channel && acct.client.removeChannel(channel) };
  }

  window.tcCommunity = { ROOMS, roomFor, timeAgo, clock, format, author, loadProfiles, remember, AUTHOR, signInHref, nicerError, mountThread };

  // ---------- auto-mount under explainers and Library guides ----------
  const b = document.body.dataset;
  const article = document.querySelector("main article");
  if (article && (b.slug || b.lib)) {
    const post = b.slug && typeof posts !== "undefined" ? posts.find((p) => p.slug === b.slug) : null;
    const libRow = b.lib && typeof libraryIndex !== "undefined" ? libraryIndex.find((l) => l[0] === b.lib) : null;
    const sec = document.createElement("section");
    sec.id = "discussion";
    sec.setAttribute("aria-label", "Discussion");
    article.after(sec);
    mountThread(sec, b.slug ? `post:${b.slug}` : `lib:${b.lib}`, {
      room: roomFor(post ? { topic: post.topic } : { lib: libRow ? libRow[2] : "" }),
    });
  }
})();
