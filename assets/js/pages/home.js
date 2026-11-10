// Homepage: hero animations, Trendcode OS (a typeable terminal) and the live SHA-256 box.
(function () {
  // =============================================================
  // HERO
  // =============================================================
  const rot = $("#rotator");
  if (rot && !reduceMotion) {
    const words = ["post-quantum crypto", "AI security", "quantum computing", "machine learning", "web security", "algorithms", "tomorrow's tech"];
    let w = 0, i = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      i += deleting ? -1 : 1;
      rot.textContent = word.slice(0, i);
      let delay = deleting ? 40 : 75;
      if (!deleting && i === word.length) { deleting = true; delay = 2200; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2200);
  }

  const term = $("#terminal-body");
  if (term) {
    const lines = [
      ["cmd", "$ trendcode scan --crypto ./my-app"],
      ["", "  found RSA-2048   (TLS key exchange)"],
      ["warn", "  ⚠ vulnerable to Shor's algorithm"],
      ["cmd", "$ trendcode suggest"],
      ["ok", "  → key exchange: ML-KEM-768  (FIPS 203)"],
      ["cmd", "$ trendcode learn --hands-on"],
      ["ok", `  ✓ ${posts.length} explainers · ${labs.length} labs`],
      ["ok", `  ✓ ${activities.length} activities · ${glossary.length} terms`],
      ["", "  your turn, scroll down ↓"],
    ];
    const render = (n, partial = "") =>
      lines.slice(0, n).map(([cls, txt]) => `<span class="t-${cls}">${escapeHtml(txt)}</span>`).join("\n") +
      (partial ? (n ? "\n" : "") + `<span class="t-cmd">${escapeHtml(partial)}</span>` : "");
    if (reduceMotion) term.innerHTML = render(lines.length);
    else {
      let line = 0;
      const next = () => {
        if (line >= lines.length) { setTimeout(() => { line = 0; term.innerHTML = ""; next(); }, 6000); return; }
        const [cls, txt] = lines[line];
        if (cls === "cmd") {
          let c = 0;
          const type = () => {
            c++;
            term.innerHTML = render(line, txt.slice(0, c));
            if (c < txt.length) setTimeout(type, 35);
            else { line++; setTimeout(next, 400); }
          };
          type();
        } else { line++; term.innerHTML = render(line); setTimeout(next, 260); }
      };
      next();
    }
  }

  const values = { posts: posts.length, labs: labs.length, activities: activities.length, terms: glossary.length };
  $$("[data-stat]").forEach((el) => {
    const target = values[el.dataset.stat] || 0;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / 900);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  // =============================================================
  // SHA-256 helper (shared by the hash box and the `hash` command)
  // =============================================================
  const subtle = window.crypto && window.crypto.subtle;
  const sha256 = async (text) => {
    const buf = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // =============================================================
  // TRENDCODE OS
  // =============================================================
  const out = $("#os-out");
  const form = $("#os-form");
  const input = $("#os-in");
  const body = $("#os-body");
  if (out && form && input) {
    const user = () => {
      const a = store.get("tc-account", null), p = store.get("tc-profile", {});
      return (a && a.username) || p.username || "guest";
    };
    const paintPrompt = () => {
      const u = user();
      $("#os-ps1").textContent = `${u}@trendcode:~$`;
      $("#os-title-bar").textContent = `${u}@trendcode: ~`;
    };
    paintPrompt();
    document.addEventListener("tc-account", paintPrompt);

    // ---- output helpers ----
    const print = (html, cls = "") => {
      const div = document.createElement("div");
      div.className = `os-line ${cls}`;
      div.innerHTML = html;
      out.append(div);
      body.scrollTop = body.scrollHeight;
      return div;
    };
    const c = (cmd, label = cmd) => `<button type="button" class="os-link" data-cmd="${escapeHtml(cmd)}">${escapeHtml(label)}</button>`;
    const dim = (s) => `<span class="os-dim">${s}</span>`;
    const go = (url, label) => {
      print(`${dim("→")} opening <span class="os-hl">${escapeHtml(label)}</span>…`);
      setTimeout(() => (location.href = url), 450);
    };
    const table = (rows) => `<div class="os-table">${rows.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join("")}</div>`;

    // ---- fuzzy finders ----
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const findTopic = (q) => {
      q = norm(q);
      if (!q) return null;
      return Object.keys(TOPICS).find((k) => k === q) ||
        Object.keys(TOPICS).find((k) => norm(TOPICS[k].label).includes(q) || norm(TOPICS[k].blurb).split(" ").includes(q)) ||
        ({ crypto: "crypto", cryptography: "crypto", quantum: "quantum", ai: "ai", security: "websec", web: "websec", ml: "ml", ai_: "ai", privacy: "privacy", data: "privacy", algorithms: "algo", algo: "algo", network: "systems", networks: "systems", cloud: "systems", wasm: "emerging", pqc: "pqc", postquantum: "pqc", "post quantum": "pqc" })[q] || null;
    };
    const findIn = (list, q) => {
      if (/^\d+$/.test(q)) return list[+q - 1] || null;
      const n = norm(q);
      return list.find((x) => x.slug === q) || list.find((x) => norm(x.title).includes(n)) ||
        list.find((x) => norm(`${x.short || ""} ${x.slug}`).includes(n)) || null;
    };
    const PAGES = {
      home: "index.html", explainers: "posts.html", posts: "posts.html", topics: "topics.html", labs: "labs/index.html",
      activities: "activities.html", paths: "paths.html", progress: "progress.html", profile: "profile.html", login: "login.html",
      glossary: "glossary.html", timeline: "timeline.html", timelines: "timeline.html", quiz: "quiz.html", flashcards: "flashcards.html",
      match: "match.html", myths: "myths.html", daily: "daily.html", resources: "resources.html", saved: "saved.html",
      "reading-list": "saved.html", certificate: "certificate.html", certificates: "certificate.html",
    };
    const lev = (a, b) => {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      return d[a.length][b.length];
    };

    // ---- commands ----
    const CMDS = {
      help: {
        desc: "list every command",
        run() {
          print(`<span class="os-hl">Trendcode OS</span> ${dim("· everything here is clickable, too")}`);
          print(table(Object.entries(CMDS).filter(([, v]) => !v.hidden).map(([k, v]) => [c(k + (v.arg ? " " : ""), k) + (v.arg ? ` ${dim(v.arg)}` : ""), dim(v.desc)])));
        },
      },
      ls: {
        desc: "list posts, labs, topics, activities or paths", arg: "[what]",
        complete: () => ["posts", "labs", "topics", "activities", "paths"],
        run([what]) {
          const read = progress.read(), done = progress.labs();
          if (!what) return print(["posts/", "labs/", "topics/", "activities/", "paths/"].map((d) => c(`ls ${d.slice(0, -1)}`, d)).join("  "));
          what = what.replace(/\/$/, "");
          if (/^(posts?|explainers?)$/.test(what)) return print(posts.map((p, i) =>
            `${dim(String(i + 1).padStart(2, "0"))}  ${c(`read ${i + 1}`, p.title)} ${dim(`· ${topicLabel(p.topic)} · ${p.readTime}m`)}${read.includes(p.slug) ? ' <span class="os-ok">✓</span>' : ""}`).join("<br>"));
          if (/^labs?$/.test(what)) return print(labs.map((l, i) =>
            `${dim(String(i + 1).padStart(2, "0"))}  ${c(`lab ${i + 1}`, l.title)} ${dim(`· ${l.level} · ${l.minutes}m`)}${done.includes(l.slug) ? ' <span class="os-ok">✓</span>' : ""}`).join("<br>"));
          if (/^topics?$/.test(what)) return print(Object.entries(TOPICS).map(([k, t]) => `${c(`learn ${k}`, k.padEnd(9, " "))} ${dim(t.label)}`).join("<br>"));
          if (/^activit(y|ies)$/.test(what)) return print(activities.map((a) => `${c(`open ${a.slug}`, a.slug.padEnd(12, " "))} ${dim(a.title)}`).join("<br>"));
          if (/^paths?$/.test(what)) return print(paths.map((p) => `${c("open paths", p.title)} ${dim(`${progress.pathPct(p)}%`)}`).join("<br>"));
          print(`ls: ${escapeHtml(what)}: no such directory. Try ${c("ls")}`, "os-err");
        },
      },
      learn: {
        desc: "everything about one topic", arg: "<topic>",
        complete: () => Object.keys(TOPICS),
        run(args) {
          const k = findTopic(args.join(" "));
          if (!k) return print(`learn: which topic? ${Object.keys(TOPICS).map((t) => c(`learn ${t}`, t)).join(" ")}`);
          const t = TOPICS[k];
          print(`<span class="os-hl">${t.label}</span>: ${escapeHtml(t.blurb)}`);
          const ps = posts.filter((p) => p.topic === k), ls = labs.filter((l) => l.topic === k);
          print(ps.map((p) => `  📖 ${c(`read ${posts.indexOf(p) + 1}`, p.title)}`).join("<br>") +
            (ls.length ? "<br>" + ls.map((l) => `  🧪 ${c(`lab ${labs.indexOf(l) + 1}`, l.title)}`).join("<br>") : "") +
            `<br>  🃏 ${c(`open flashcards`, `flashcards: ${glossary.filter((g) => g[1] === k).length} terms`)}  ${dim("·")}  ${c(`open topic ${k}`, "topic page →")}`);
        },
      },
      read: {
        desc: "open an explainer by number or name", arg: "<n|name>",
        complete: () => posts.map((p) => p.slug),
        run(args) {
          const p = findIn(posts, args.join(" "));
          if (!p) return print(`read: not found. ${c("ls posts")} to see them all.`, "os-err");
          go(postUrl(p), p.title);
        },
      },
      lab: {
        desc: "start a lab by number or name", arg: "<n|name>",
        complete: () => labs.map((l) => l.slug),
        run(args) {
          const l = findIn(labs, args.join(" "));
          if (!l) return print(`lab: not found. ${c("ls labs")} to see them all.`, "os-err");
          go(labUrl(l), l.title);
        },
      },
      open: {
        desc: "go to any page", arg: "<page>",
        complete: () => Object.keys(PAGES),
        run([page = "", ...rest]) {
          if (page === "topic" && TOPICS[rest[0]]) return go(topicUrl(rest[0]), TOPICS[rest[0]].label);
          const key = Object.keys(PAGES).find((k) => k === page) || Object.keys(PAGES).find((k) => k.startsWith(page) && page);
          if (!key) return print(`open: where? ${Object.keys(PAGES).slice(0, 12).map((k) => c(`open ${k}`, k)).join(" ")} …`);
          go(BASE + PAGES[key], key);
        },
      },
      cd: { desc: "same as open", hidden: true, complete: () => Object.keys(PAGES), run: (a) => (a[0] === ".." || a[0] === "~" ? print(dim("you're already home.")) : CMDS.open.run(a)) },
      daily: {
        desc: "today's puzzle and your streak",
        run() {
          const solved = progress.daily().includes(todayKey());
          print(`📅 ${solved ? '<span class="os-ok">solved today ✓</span>' : "today's puzzle is waiting"} ${dim("·")} 🔥 streak: <span class="os-hl">${progress.streak()}</span> ${dim("·")} ${c("open daily", solved ? "see the countdown →" : "play now →")}`);
        },
      },
      hash: {
        desc: "SHA-256 of any text", arg: "<text>",
        async run(args, raw) {
          const text = raw.replace(/^\s*hash\s?/, "");
          if (!subtle) return print("hash: needs https (or localhost) for the Web Crypto API.", "os-err");
          const h = await sha256(text);
          print(`${dim("sha256(")}"${escapeHtml(text)}"${dim(")")} =<br><span class="os-hash">${h}</span><br>${dim("change one letter and run it again ·")} ${c("lab hash", "hash lab →")}`);
        },
      },
      define: {
        desc: "look up a term in the glossary", arg: "<term>",
        complete: () => glossary.map((g) => slugify(g[0])),
        run(args) {
          const q = norm(args.join(" "));
          if (!q) return print(`define: what? e.g. ${c("define qubit")} ${c("define passkey")}`);
          const hits = glossary.filter(([t]) => norm(t) === q).concat(glossary.filter(([t]) => norm(t) !== q && norm(t).includes(q)));
          if (!hits.length) return print(`define: no term matches “${escapeHtml(args.join(" "))}”. ${c("open glossary")}`, "os-err");
          const [t, k, d] = hits[0];
          print(`<span class="os-hl">${escapeHtml(t)}</span> ${dim(`(${topicLabel(k)})`)}<br>${escapeHtml(d)}` +
            (hits.length > 1 ? `<br>${dim("also:")} ${hits.slice(1, 5).map(([x]) => c(`define ${x}`, x)).join(" ")}` : ""));
        },
      },
      whoami: {
        desc: "your character, level and stats",
        run() {
          const ch = TCAvatar.get(), cls = TCAvatar.CLASSES[ch.cls];
          const prof = store.get("tc-profile", {}), acct = store.get("tc-account", null);
          const xp = progress.xp(), lvl = levelFor(xp);
          const bar = (n, w = 18) => "█".repeat(Math.round(n * w)) + "░".repeat(w - Math.round(n * w));
          const pct = lvl.next ? (xp - lvl.min) / (lvl.next - lvl.min) : 1;
          print(`<div class="os-who">${TCAvatar.svg(ch, 104)}<div>
            <span class="os-hl">${escapeHtml(prof.displayName || user())}</span> ${dim(acct ? "· signed in" : "· local profile")}<br>
            ${cls.icon} ${cls.name} ${dim("·")} Lv ${lvl.index + 1} ${lvl.name}<br>
            <span class="os-meter">${bar(pct)}</span> ${xp} XP<br>
            ${dim(`read ${progress.read().length}/${posts.length} · labs ${progress.labs().length}/${labs.length} · streak ${progress.streak()} · badges ${BADGES.filter((b) => b[4]()).length}/${BADGES.length}`)}<br>
            ${c("open profile", "customise character →")} ${acct ? "" : c("login", "sign in to sync →")}</div></div>`);
        },
      },
      stats: { desc: "your progress in numbers", run: () => CMDS.whoami.run() },
      random: {
        desc: "surprise me",
        run() {
          const unread = posts.filter((p) => !progress.read().includes(p.slug));
          const p = (unread.length ? unread : posts)[Math.floor(Math.random() * (unread.length || posts.length))];
          print(`🎲 ${c(`read ${posts.indexOf(p) + 1}`, p.title)} ${dim(`· ${p.readTime} min · ${topicLabel(p.topic)}`)}`);
        },
      },
      theme: {
        desc: "switch light / dark", arg: "[light|dark]",
        complete: () => ["light", "dark"],
        run([mode]) {
          const cur = document.documentElement.dataset.theme || "dark";
          if ((mode && mode !== cur) || !mode) $("#theme-toggle").click();
          print(dim(`theme: ${document.documentElement.dataset.theme}`));
        },
      },
      login: { desc: "sign in or create an account", run: () => go(BASE + "login.html", "sign in") },
      logout: {
        desc: "sign out",
        async run() {
          const a = await window.tcAccountReady;
          if (!a.enabled || !a.user) return print(dim("you're not signed in."));
          await a.signOut(); print('<span class="os-ok">signed out.</span>');
        },
      },
      subscribe: {
        desc: "get one trend, decoded, every week", arg: "<email>",
        async run([email]) {
          if (!email || !/^\S+@\S+\.\S+$/.test(email)) return print(`usage: subscribe ${dim("you@example.com")}`);
          await window.tcAccountReady;
          const c = window.TC_CONFIG || {};
          if (!c.supabaseUrl || !c.supabaseAnonKey) return print(dim("subscriptions aren't switched on yet."));
          print(dim(`subscribing ${escapeHtml(email)}…`));
          try {
            const res = await fetch(`${c.supabaseUrl}/rest/v1/subscribers`, {
              method: "POST",
              headers: { apikey: c.supabaseAnonKey, Authorization: `Bearer ${c.supabaseAnonKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ email: email.trim() }),
            });
            if (res.ok) return print(`<span class="os-ok">✓ subscribed:</span> ${escapeHtml(email)} ${dim("— one trend, decoded, every week.")}`);
            const err = await res.json().catch(() => ({}));
            if (err.code === "23505") return print(`<span class="os-ok">✓</span> ${escapeHtml(email)} ${dim("is already on the list.")}`);
            if (err.code === "23514") return print("that doesn't look like a valid email.", "os-err");
            print("couldn't subscribe right now, try again later.", "os-err");
          } catch (e) {
            print("network error, check your connection and try again.", "os-err");
          }
        },
      },
      history: { desc: "commands you've run", run: () => print(hist.map((h, i) => `${dim(String(i + 1).padStart(3, " "))}  ${c(h)}`).join("<br>") || dim("no history yet.")) },
      clear: { desc: "clear the screen", run: () => { out.innerHTML = ""; } },
      date: { desc: "today's date", hidden: true, run: () => print(new Date().toString()) },
      echo: { desc: "print text", hidden: true, run: (a, raw) => print(escapeHtml(raw.replace(/^\s*echo\s?/, ""))) },
      about: { desc: "what is this?", run: () => print(`Trendcode explains where computing is heading, then lets you poke it. ${c("ls posts", "read")} · ${c("ls labs", "try")} · ${c("open activities", "practise")}`) },
      sudo: { hidden: true, run: () => print("sudo: permission denied. Nice try 😄 There's no root here, everything runs in your browser.", "os-err") },
      rm: { hidden: true, run: () => print("rm: refusing. This is a learning environment, not a crime scene.", "os-err") },
      exit: { hidden: true, run: () => print(`there is no exit. there is only ${c("random")}.`) },
      hello: { hidden: true, run: () => print(`hi ${escapeHtml(user())} 👋 try ${c("whoami")}`) },
      coffee: { hidden: true, run: () => print(`<pre class="os-pre">   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   \`----'</pre>${dim("brewing… 418 I'm a teapot.")}`) },
    };
    CMDS.hi = CMDS.hello;
    CMDS.man = CMDS.help;

    // ---- history ----
    let hist = [];
    try { hist = JSON.parse(sessionStorage.getItem("tc-os-history") || "[]"); } catch { hist = []; }
    let hIdx = hist.length;

    const run = async (raw) => {
      raw = raw.trim();
      print(`<span class="os-ps1-echo">${escapeHtml(user())}@trendcode:~$</span> ${escapeHtml(raw)}`, "os-echo");
      if (!raw) return;
      if (hist[hist.length - 1] !== raw) hist.push(raw);
      hist = hist.slice(-50);
      hIdx = hist.length;
      try { sessionStorage.setItem("tc-os-history", JSON.stringify(hist)); } catch { /* ignore */ }
      const [name, ...args] = raw.split(/\s+/);
      const cmd = CMDS[name.toLowerCase()];
      if (!cmd) {
        const best = Object.keys(CMDS).filter((k) => !CMDS[k].hidden).map((k) => [k, lev(name.toLowerCase(), k)]).sort((a, b) => a[1] - b[1])[0];
        return print(`command not found: ${escapeHtml(name)}${best && best[1] <= 2 ? `. Did you mean ${c(best[0] + (args.length ? " " + args.join(" ") : ""), best[0])}?` : `. Type ${c("help")}.`}`, "os-err");
      }
      try { await cmd.run(args, raw); } catch (e) { print(`error: ${escapeHtml(e.message)}`, "os-err"); }
    };

    form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; run(v); });

    // clickable output, intro links and dock
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cmd]");
      if (!b || !b.closest("#os, .os-intro")) return;
      const cmd = b.dataset.cmd;
      if (cmd.endsWith(" ")) { input.value = cmd; input.focus(); return; }
      run(cmd);
    });
    // focus the prompt when clicking the terminal (but not when selecting text)
    body.addEventListener("mouseup", () => { if (!String(window.getSelection())) input.focus({ preventScroll: true }); });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); if (hIdx > 0) input.value = hist[--hIdx]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); hIdx = Math.min(hist.length, hIdx + 1); input.value = hist[hIdx] || ""; }
      else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); out.innerHTML = ""; }
      else if (e.key === "Tab") {
        e.preventDefault();
        const val = input.value;
        const parts = val.split(/\s+/);
        if (parts.length <= 1) {
          const opts = Object.keys(CMDS).filter((k) => !CMDS[k].hidden && k.startsWith(parts[0]));
          if (opts.length === 1) input.value = opts[0] + " ";
          else if (opts.length) print(opts.map((o) => c(o + " ", o)).join("  "), "os-dimline");
        } else {
          const cmd = CMDS[parts[0]];
          const cands = (cmd && cmd.complete ? cmd.complete() : []).filter((x) => x.startsWith(parts[parts.length - 1]));
          if (cands.length === 1) { parts[parts.length - 1] = cands[0]; input.value = parts.join(" ") + " "; }
          else if (cands.length) print(cands.slice(0, 24).map((o) => c(`${parts.slice(0, -1).join(" ")} ${o}`, o)).join("  "), "os-dimline");
        }
      }
    });

    // dock of quick commands
    const DOCK = [["help", "?"], ["ls posts", "📖"], ["ls labs", "🧪"], ["learn quantum", "⚛️"], ["daily", "📅"], ["hash hello world", "#"], ["define qubit", "📚"], ["whoami", "👤"], ["random", "🎲"]];
    $("#os-dock").innerHTML = DOCK.map(([cmd, ico]) => `<button type="button" class="dock-btn" data-cmd="${cmd}"><span>${ico}</span>${escapeHtml(cmd)}</button>`).join("");

    // boot message
    const prof = store.get("tc-profile", {});
    const name = prof.displayName || (user() !== "guest" ? user() : "");
    const last = store.get("tc-last-visit", null);
    store.set("tc-last-visit", Date.now());
    print(`${dim(`Trendcode OS 1.0 · ${posts.length} explainers · ${labs.length} labs · ${glossary.length} terms`)}`);
    if (last) print(dim(`Last login: ${new Date(last).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} from this browser`));
    print(`${name ? `Welcome back, <span class="os-hl">${escapeHtml(name)}</span>.` : "Welcome, guest."} ${progress.daily().includes(todayKey()) ? "Today's puzzle: solved ✓" : `Today's puzzle is waiting: ${c("daily")}`}`);
    print(`Type ${c("help")} or tap a command below.${name ? "" : ` New here? ${c("open profile", "make a character")}.`}`);

    if (location.hash === "#subscribe") { input.value = "subscribe "; input.focus(); $("#os").scrollIntoView(); }
  }

  // =============================================================
  // SHA-256 BOX
  // =============================================================
  const hin = $("#hash-in");
  const hout = $("#hash-out");
  const cap = $("#hash-caption");
  if (hin && hout) {
    let prev = "", seq = 0;
    const paint = (hex) => {
      let changed = 0;
      hout.innerHTML = [...hex].map((ch, i) => {
        const diff = prev && ch !== prev[i];
        if (diff) changed++;
        return `<span class="${diff ? "flip" : ""}" style="--d:${(i % 16) * 12}ms">${ch}</span>`;
      }).join("");
      if (prev) cap.innerHTML = `<strong>${changed} of 64</strong> characters changed. ${changed > 50
        ? "One keystroke, a completely different fingerprint. That's the avalanche effect."
        : changed === 0 ? "Same input, same hash, every time. Hashes are deterministic." : "Keep typing…"} <a class="text-link" href="labs/hash-lab.html">Go deeper in the hash lab →</a>`;
      prev = hex;
    };
    const update = async () => {
      const mine = ++seq;
      if (!subtle) { hout.textContent = "Open the site over https to enable live hashing."; return; }
      const hex = await sha256(hin.value);
      if (mine === seq) paint(hex);
    };
    hin.addEventListener("input", update);
    update();
  }
})();
