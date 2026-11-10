// Progress page: XP ring, stats, badges, certificates, reset.
(function () {
  const box = $("#progress-box");
  if (!box) return;
  const render = () => {
    const xp = progress.xp();
    const lvl = levelFor(xp);
    const pct = lvl.next ? Math.round(((xp - lvl.min) / (lvl.next - lvl.min)) * 100) : 100;
    const got = BADGES.filter((b) => b[4]()).length;
    box.innerHTML = `
      <div class="xp-card">
        <div class="xp-ring" style="--pct:${pct}"><span>${xp}<small>XP</small></span></div>
        <div>
          <p class="eyebrow">// level ${lvl.index + 1} of ${LEVELS.length}</p>
          <h3>${lvl.name}</h3>
          <p class="muted">${lvl.next ? `${lvl.next - xp} XP to ${LEVELS[lvl.index + 1][1]}` : "Max level. You've decoded it all."}</p>
          <div class="level-track">${LEVELS.map(([min, name], i) =>
            `<span class="${i <= lvl.index ? "on" : ""}" title="${name}: ${min} XP"></span>`).join("")}</div>
        </div>
      </div>

      <div class="stat-tiles">
        ${[
          ["📖", `${progress.read().length}/${posts.length}`, "explainers read", "+10 XP each", pageUrl("posts")],
          ["🧪", `${progress.labs().length}/${labs.length}`, "labs completed", "+25 XP each", `${BASE}labs/index.html`],
          ["🏛️", `${progress.lib().length}/${typeof libraryIndex !== "undefined" ? libraryIndex.length : 0}`, "library guides read", "+5 XP each", pageUrl("library")],
          ["📅", `${progress.daily().length}`, `daily challenges · 🔥 ${progress.streak()} streak`, "+5 XP each", pageUrl("daily")],
          ["🃏", `${progress.mastered()}/${glossary.length}`, "flashcards mastered", "+2 XP each", pageUrl("flashcards")],
          ["🎯", `${progress.quizBest()}/5`, "best quiz score", "+5 XP per point", pageUrl("quiz")],
          ["🧠", `${progress.mythsBest()}/10`, "best Myth or Fact", "+2 XP per point", pageUrl("myths")],
          ["🧩", progress.matchBest() ? `${progress.matchBest().toFixed(1)}s` : "–", "best Jargon Match", "+10 XP once", pageUrl("match")],
          ["🔖", `${progress.saved().length}`, "posts saved", "Reading list", pageUrl("saved")],
        ].map(([e, v, l, x, href]) => `<a class="stat-tile" href="${href}"><span>${e}</span><strong>${v}</strong><small>${l}</small><em>${x}</em></a>`).join("")}
      </div>

      <h2 class="sub-h">Badges <span class="muted">${got}/${BADGES.length}</span></h2>
      <div class="badges">
        ${BADGES.map(([id, emoji, name, desc, test]) => {
          const ok = test();
          return `<div class="badge-tile${ok ? " got" : ""}" title="${escapeHtml(desc)}">
            <span class="badge-emoji">${ok ? emoji : "🔒"}</span><strong>${name}</strong><small>${desc}</small></div>`;
        }).join("")}
      </div>

      <h2 class="sub-h">Certificates</h2>
      <div class="cert-row">${paths.map((p) => {
        const pc = progress.pathPct(p);
        return `<a class="cert-chip${pc === 100 ? " earned" : ""}" href="${pageUrl("certificate")}?path=${p.id}">
          <span>${pc === 100 ? "🎓" : "🔒"}</span><strong>${escapeHtml(p.title)}</strong><small>${pc === 100 ? "Earned · view & print" : `${pc}% complete`}</small></a>`;
      }).join("")}</div>

      <div class="danger-zone">
        <div><strong>Your data stays here.</strong> <span class="muted">Progress is stored only in this browser. Clearing site data or switching devices starts fresh.</span></div>
        <div class="btn-row">
          <button type="button" class="btn btn-ghost btn-sm" id="export-progress">Download backup</button>
          <label class="btn btn-ghost btn-sm file-btn">Restore backup<input type="file" id="import-progress" accept="application/json" /></label>
          <button type="button" class="btn btn-ghost btn-sm danger-btn" id="reset-progress">Reset everything</button>
        </div>
      </div>`;

    const KEYS = ["tc-read", "tc-labs", "tc-quiz-best", "tc-daily", "tc-cards", "tc-myths-best", "tc-match-best", "tc-saved", "tc-lib", "tc-threat-checks", "tc-name", "tc-cert-dates",
      ...labs.map((l) => "tc-m-" + l.slug)];
    const BACKUP_EXTRA = ["tc-character", "tc-profile"]; // backed up, but kept on reset
    $("#reset-progress").addEventListener("click", () => {
      if (!confirm("Reset all your reading, lab, activity and quiz progress on this device? This can't be undone.")) return;
      KEYS.forEach((k) => store.remove(k));
      location.reload();
    });
    $("#export-progress").addEventListener("click", () => {
      const data = {};
      [...KEYS, ...BACKUP_EXTRA].forEach((k) => { const v = store.get(k, null); if (v !== null) data[k] = v; });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ trendcode: 1, data }, null, 2)], { type: "application/json" }));
      a.download = `trendcode-progress-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $("#import-progress").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const json = JSON.parse(await file.text());
        if (!json || json.trendcode !== 1 || typeof json.data !== "object") throw new Error("bad");
        Object.entries(json.data).forEach(([k, v]) => { if (KEYS.includes(k) || BACKUP_EXTRA.includes(k)) store.set(k, v); });
        location.reload();
      } catch { toast(`<span class="toast-icon">⚠️</span><div><strong>That file isn't a Trendcode backup.</strong></div>`); }
    });
  };
  render();
})();
