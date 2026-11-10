// Threat landscape page: chart + one full briefing per threat with a readiness check.
(function () {
  $("#plate-date").textContent = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const dash = initThreatDashboard({ map: $("#threat-map"), brief: $("#tl-brief"), index: $("#tl-index"), fullPage: true });

  const box = $("#briefings");
  const render = () => {
    const checks = threatChecks.get();
    box.innerHTML = THREATS.map((t, n) => {
      const r = threatChecks.readiness(t.id);
      const mine = new Set(checks[t.id] || []);
      return `
      <article class="entry" id="${t.id}-brief">
        <header class="entry-head">
          <span class="entry-n">${ROMAN[n]}</span>
          ${threatGlyph(t.id, 44, "entry-glyph")}
          <div class="entry-title">
            <h3>${t.name}</h3>
            <p class="entry-tag">${t.tagline}</p>
          </div>
          <dl class="entry-facts">
            <div><dt>Impact</dt><dd>${impactScale(t.impact)}</dd></div>
            <div><dt>Outlook</dt><dd>${t.trend}</dd></div>
          </dl>
        </header>

        <div class="entry-body">
          <div class="entry-col">
            <h4>What it is</h4>
            <p>${t.what}</p>
            <h4>How an attack unfolds</h4>
            <ol class="entry-chain">${t.chain.map((s) => `<li>${s}</li>`).join("")}</ol>
          </div>
          <div class="entry-col">
            <h4>On record, ${t.example.year}</h4>
            <blockquote class="entry-case"><p><em>${t.example.title}.</em> ${t.example.text}</p></blockquote>
            <h4>What helps</h4>
            <ul class="entry-def">${t.defenses.map((d) => `<li>${d}</li>`).join("")}</ul>
          </div>
        </div>

        <fieldset class="entry-check">
          <legend>Readiness check <span class="entry-score${r.pct >= 60 ? " ok" : ""}">${r.done} of ${r.total}${r.pct >= 60 ? ", prepared" : ""}</span></legend>
          <ul>${t.checks.map((c, i) => `
            <li><label><input type="checkbox" data-threat="${t.id}" data-i="${i}" ${mine.has(i) ? "checked" : ""} /><span class="box" aria-hidden="true"></span><span>${c}</span></label></li>`).join("")}
          </ul>
        </fieldset>

        <footer class="entry-foot">
          <span>Further reading:</span>
          ${t.related.map((rel) => `<a href="${relatedHref(rel)}"><small>${relatedKind(rel[0])}</small> ${rel[2]}</a>`).join("")}
          <button type="button" class="entry-locate" data-show="${t.id}">Locate on chart ↑</button>
        </footer>
      </article>`;
    }).join("");
  };
  render();

  box.addEventListener("change", (e) => {
    const c = e.target.closest("input[data-threat]");
    if (!c) return;
    const before = threatChecks.readiness(c.dataset.threat).pct;
    threatChecks.toggle(c.dataset.threat, +c.dataset.i);
    const after = threatChecks.readiness(c.dataset.threat);
    if (before < 60 && after.pct >= 60) {
      const t = THREATS.find((x) => x.id === c.dataset.threat);
      toast(`<div><strong>${t.name}: marked prepared</strong><br />It's now hatched over on the chart.</div>`);
    }
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  });
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-show]");
    if (!b) return;
    dash.select(b.dataset.show);
    $("#threat-map").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });

  const id = location.hash.replace(/^#/, "").replace(/-brief$/, "");
  if (THREATS.some((t) => t.id === id)) {
    dash.select(id);
    setTimeout(() => document.getElementById(`${id}-brief`).scrollIntoView(), 60);
  }
})();
