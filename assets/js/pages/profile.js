// Profile page: character builder + profile details (editable), or a public profile (?u=username).
(function () {
  const root = $("#profile-root");
  if (!root) return;
  const A = TCAvatar;
  const params = new URLSearchParams(location.search);
  const viewing = params.get("u");

  // Stats from a progress object (same rules as progress.xp(), but for any profile)
  const statsFrom = (p = {}) => {
    const arr = (k) => (Array.isArray(p[k]) ? p[k] : []);
    const read = arr("tc-read").filter((s) => posts.some((x) => x.slug === s)).length;
    const labN = arr("tc-labs").filter((s) => labs.some((x) => x.slug === s)).length;
    const daily = arr("tc-daily").length;
    const mastered = Object.values(p["tc-cards"] || {}).filter((b) => b >= 3).length;
    const quiz = +p["tc-quiz-best"] || 0, myth = +p["tc-myths-best"] || 0;
    const libN = arr("tc-lib").length;
    const xp = read * 10 + labN * 25 + quiz * 5 + daily * 5 + mastered * 2 + myth * 2 + (p["tc-match-best"] ? 10 : 0) + libN * 5;
    return { read, labN, daily, mastered, quiz, myth, xp };
  };

  // =============================================================
  // PUBLIC PROFILE VIEW
  // =============================================================
  const renderPublic = async () => {
    const acct = await window.tcAccountReady;
    if (!acct.enabled) {
      root.innerHTML = `<section class="page-hero"><h1>Public profiles are off</h1><p class="lead">This site isn't connected to an account server yet. <a class="text-link" href="profile.html">Build your own character →</a></p></section>`;
      return;
    }
    let p = null;
    try { p = await acct.fetchPublic(viewing); } catch { /* treated as not found */ }
    if (!p) {
      root.innerHTML = `<section class="page-hero"><p class="eyebrow">// profile</p><h1>No one here (yet)</h1><p class="lead">There's no public profile called <strong>@${escapeHtml(viewing)}</strong>. <a class="text-link" href="profile.html">Make yours →</a></p></section>`;
      return;
    }
    const s = statsFrom(p.progress);
    const lvl = levelFor(s.xp);
    const cls = A.CLASSES[(p.character || {}).cls] || A.CLASSES.cryptographer;
    const mine = acct.profile && acct.profile.username === p.username;
    document.title = `${p.display_name || p.username} (@${p.username}) — Trendcode`;
    root.innerHTML = `
      <section class="public-card">
        <div class="public-av">${A.svg(p.character || {}, 220, { label: `${p.display_name || p.username}'s character` })}</div>
        <div class="public-info">
          <p class="eyebrow">// level ${lvl.index + 1} · ${lvl.name}</p>
          <h1>${escapeHtml(p.display_name || p.username)}</h1>
          <p class="handle">@${escapeHtml(p.username)} · <span>${cls.icon} ${cls.name}</span></p>
          ${p.bio ? `<p class="bio">${escapeHtml(p.bio)}</p>` : ""}
          <div class="public-stats">
            <div><strong>${s.xp}</strong><small>XP</small></div>
            <div><strong>${s.read}</strong><small>explainers read</small></div>
            <div><strong>${s.labN}</strong><small>labs done</small></div>
            <div><strong>${s.daily}</strong><small>daily puzzles</small></div>
            <div><strong>${s.mastered}</strong><small>cards mastered</small></div>
          </div>
          <p class="muted small">Learning on Trendcode since ${new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          <div class="btn-row">
            <button type="button" class="btn btn-ghost btn-sm" id="copy-profile">Copy profile link</button>
            ${mine ? `<a class="btn btn-sm" href="profile.html">Edit my profile</a>` : `<a class="btn btn-sm" href="profile.html">Build your own character →</a>`}
          </div>
        </div>
      </section>`;
    $("#copy-profile").addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(location.href); e.target.textContent = "Copied ✓"; } catch { e.target.textContent = location.href; }
    });
  };

  // =============================================================
  // EDIT MODE: character builder + details
  // =============================================================
  let char = A.get();
  let history = [];

  const GROUPS = [
    { key: "hair", title: "Hair", kind: "shape" },
    { key: "hairColor", title: "Hair colour", kind: "color" },
    { key: "skin", title: "Skin tone", kind: "color" },
    { key: "eyes", title: "Eyes", kind: "shape" },
    { key: "mouth", title: "Mouth", kind: "shape" },
    { key: "outfit", title: "Outfit", kind: "shape" },
    { key: "outfitColor", title: "Outfit colour", kind: "color" },
    { key: "accessory", title: "Accessory", kind: "shape" },
    { key: "bg", title: "Background", kind: "color" },
  ];

  const renderShell = () => {
    root.innerHTML = `
      <section class="page-hero compact">
        <p class="eyebrow">// your profile</p>
        <h1>Make it <em>yours</em>.</h1>
        <p class="lead">Build your character, pick a class and tell people who you are. Some items unlock as you learn.</p>
      </section>
      <div class="profile-grid">
        <aside class="preview-col">
          <div class="preview-card" id="preview"></div>
          <div class="account-panel" id="account-panel"></div>
        </aside>
        <div class="builder-col">
          <section class="builder-section">
            <h2>Class</h2>
            <div class="class-grid" id="class-grid"></div>
          </section>
          <section class="builder-section">
            <div class="builder-head"><h2>Look</h2>
              <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" id="undo" disabled>↶ Undo</button><button type="button" class="btn btn-ghost btn-sm" id="randomise">🎲 Randomise</button></div></div>
            <div id="builder"></div>
          </section>
          <section class="builder-section">
            <h2>Details</h2>
            <form class="details-form" id="details-form" novalidate>
              <label class="field"><span>Display name</span><input class="input" id="f-name" maxlength="40" autocomplete="nickname" placeholder="What should we call you?" /></label>
              <label class="field"><span>Username <small class="muted">(3–20: a–z, 0–9, _)</small></span><span class="at-wrap"><b>@</b><input class="input" id="f-user" maxlength="20" autocomplete="username" placeholder="your_handle" /></span></label>
              <label class="field"><span>Bio <small class="muted" id="bio-count">0/200</small></span><textarea class="input" id="f-bio" maxlength="200" rows="3" placeholder="Learning post-quantum crypto one explainer at a time."></textarea></label>
              <label class="toggle compact"><input type="checkbox" id="f-public" /><span class="switch" aria-hidden="true"></span><span><strong>Public profile</strong><small>Anyone with your link can see your character, bio and stats (never your email).</small></span></label>
              <div class="btn-row"><button class="btn" type="submit" id="save-details">Save profile</button><span class="auth-msg" id="details-msg" role="status"></span></div>
            </form>
          </section>
        </div>
      </div>`;
  };

  const renderPreview = () => {
    const prof = store.get("tc-profile", {});
    const xp = progress.xp(), lvl = levelFor(xp);
    const pct = lvl.next ? Math.round(((xp - lvl.min) / (lvl.next - lvl.min)) * 100) : 100;
    const cls = A.CLASSES[char.cls];
    $("#preview").innerHTML = `
      <div class="preview-av">${A.svg(char, 220, { label: "Your character" })}</div>
      <h3>${escapeHtml(prof.displayName || "Unnamed learner")}</h3>
      <p class="handle">${prof.username ? "@" + escapeHtml(prof.username) : "no username yet"}</p>
      <p class="class-line">${cls.icon} ${cls.name}</p>
      <div class="lvl-line"><span>Lv ${lvl.index + 1} · ${lvl.name}</span><span>${xp} XP</span></div>
      <div class="path-bar"><span style="width:${pct}%"></span></div>
      <p class="muted small">${lvl.next ? `${lvl.next - xp} XP to ${LEVELS[lvl.index + 1][1]}` : "Max level"} · <a class="text-link" href="progress.html">stats</a></p>`;
  };

  const renderClasses = () => {
    $("#class-grid").innerHTML = Object.entries(A.CLASSES).map(([k, c]) => `
      <button type="button" class="class-opt${char.cls === k ? " on" : ""}" data-key="cls" data-val="${k}" aria-pressed="${char.cls === k}">
        <span class="class-icon">${c.icon}</span><strong>${c.name}</strong><small>${c.blurb}</small>
      </button>`).join("");
  };

  const renderBuilder = () => {
    $("#builder").innerHTML = GROUPS.map((g) => {
      const opts = A.OPTIONS[g.key].map((v) => {
        const unlocked = A.isUnlocked(g.key, v);
        const on = char[g.key] === v;
        const lock = unlocked ? "" : `<span class="lock" aria-hidden="true">🔒</span>`;
        const title = unlocked ? (A.LABELS[g.key] ? A.LABELS[g.key][v] : v) : `Locked: ${A.lockText(g.key, v)}`;
        if (g.kind === "color") {
          const fill = v === "aurora" ? "linear-gradient(135deg,#22d3ee,#a78bfa,#34d399)" : v;
          return `<button type="button" class="swatch${on ? " on" : ""}${unlocked ? "" : " locked"}" data-key="${g.key}" data-val="${v}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" aria-pressed="${on}" ${unlocked ? "" : "aria-disabled=\"true\""} style="background:${fill}">${lock}</button>`;
        }
        return `<button type="button" class="shape${on ? " on" : ""}${unlocked ? "" : " locked"}" data-key="${g.key}" data-val="${v}" title="${escapeHtml(title)}" aria-pressed="${on}" ${unlocked ? "" : "aria-disabled=\"true\""}>
          ${A.svg({ ...char, [g.key]: v }, 64, { noEmblem: true, square: true })}${lock}
          <small>${escapeHtml(A.LABELS[g.key] ? A.LABELS[g.key][v] : v)}</small></button>`;
      }).join("");
      return `<div class="opt-group"><h3>${g.title}</h3><div class="opt-row kind-${g.kind}">${opts}</div></div>`;
    }).join("");
  };

  const renderAll = () => { renderPreview(); renderClasses(); renderBuilder(); $("#undo").disabled = !history.length; };

  const change = (key, val) => {
    if (!A.isUnlocked(key, val)) {
      toast(`<span class="toast-icon">🔒</span><div><strong>Locked</strong><br />${escapeHtml(A.lockText(key, val))} to unlock this.</div>`);
      return;
    }
    if (char[key] === val) return;
    history.push({ ...char });
    if (history.length > 30) history.shift();
    char = { ...char, [key]: val };
    A.set(char);
    renderAll();
  };

  const renderAccount = async () => {
    const box = $("#account-panel");
    const acct = await window.tcAccountReady;
    const live = window.tcAccount || acct;
    if (!live.enabled) {
      box.innerHTML = `<p><strong>Local profile</strong></p><p class="muted small">Saved in this browser only. Accounts aren't switched on for this site yet, so there's no syncing or public page.</p>`;
      return;
    }
    if (!live.user) {
      box.innerHTML = `<p><strong>Not signed in</strong></p><p class="muted small">Your character is saved in this browser. Sign in to sync it everywhere and get a public profile page.</p><a class="btn btn-sm" href="login.html">Sign in or create an account</a>`;
      return;
    }
    const p = live.profile || {};
    box.innerHTML = `
      <p><strong>✓ Signed in &amp; syncing</strong></p>
      <p class="muted small">${escapeHtml(live.user.email || "")}</p>
      ${p.username && p.is_public ? `<a class="text-link small" href="profile.html?u=${encodeURIComponent(p.username)}">View public profile →</a>` : `<p class="muted small">Your profile is private.</p>`}
      <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" id="sign-out">Sign out</button><button type="button" class="link-btn small" id="delete-data">Delete my profile data</button></div>`;
    $("#sign-out").addEventListener("click", async () => { await live.signOut(); renderAccount(); });
    $("#delete-data").addEventListener("click", async () => {
      if (!confirm("Delete your profile and synced progress from the server and sign out? Progress in this browser is kept.")) return;
      await live.deleteAccountData();
      renderAccount();
    });
  };

  const fillDetails = () => {
    const prof = store.get("tc-profile", {});
    $("#f-name").value = prof.displayName || "";
    $("#f-user").value = prof.username || "";
    $("#f-bio").value = prof.bio || "";
    $("#f-public").checked = prof.isPublic !== false;
    $("#bio-count").textContent = `${$("#f-bio").value.length}/200`;
  };

  const bindEdit = () => {
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-key]");
      if (b) change(b.dataset.key, b.dataset.val);
    });
    $("#randomise").addEventListener("click", () => { history.push({ ...char }); char = A.random(); A.set(char); renderAll(); });
    $("#undo").addEventListener("click", () => { if (!history.length) return; char = history.pop(); A.set(char); renderAll(); });
    $("#f-bio").addEventListener("input", (e) => ($("#bio-count").textContent = `${e.target.value.length}/200`));
    $("#f-user").addEventListener("input", (e) => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""); });
    $("#details-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = $("#details-msg");
      const fields = { displayName: $("#f-name").value.trim(), username: $("#f-user").value.trim(), bio: $("#f-bio").value.trim(), isPublic: $("#f-public").checked };
      if (fields.username && !/^[a-z0-9_]{3,20}$/.test(fields.username)) { out.className = "auth-msg bad"; out.textContent = "Usernames need 3–20 letters, numbers or underscores."; return; }
      const prev = store.get("tc-profile", {});
      store.set("tc-profile", { ...prev, ...fields });
      const live = window.tcAccount;
      if (live && live.enabled && live.user) {
        if (!fields.username) { out.className = "auth-msg bad"; out.textContent = "Signed-in profiles need a username."; return; }
        try { await live.saveProfile(fields); out.className = "auth-msg good"; out.textContent = "Saved and synced ✓"; }
        catch (err) { store.set("tc-profile", prev); out.className = "auth-msg bad"; out.textContent = err.message; return; }
      } else { out.className = "auth-msg good"; out.textContent = "Saved in this browser ✓"; }
      document.dispatchEvent(new CustomEvent("tc-account"));
      renderPreview();
      renderAccount();
    });
    document.addEventListener("tc-account", () => { char = A.get(); fillDetails(); renderAll(); renderAccount(); });
    document.addEventListener("tc-progress", () => renderPreview());
  };

  if (viewing) renderPublic();
  else { renderShell(); renderAll(); fillDetails(); bindEdit(); renderAccount(); }
})();
