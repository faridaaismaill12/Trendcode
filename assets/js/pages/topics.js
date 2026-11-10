// Topics index (topics.html) and single-topic page (topic.html?t=key).
(function () {
  // ---------- Index ----------
  const grid = $("#topic-grid");
  if (grid) {
    const read = progress.read();
    grid.innerHTML = Object.entries(TOPICS).map(([k, t], i) => {
      const tp = posts.filter((p) => p.topic === k);
      const nl = labs.filter((l) => l.topic === k).length;
      const nt = glossary.filter(([, tk]) => tk === k).length;
      const nread = tp.filter((p) => read.includes(p.slug)).length;
      return `
        <a class="topic-card" href="${topicUrl(k)}">
          <span class="topic-top">${icon(k, "topic-icon")}<span class="tag">${String(i + 1).padStart(2, "0")}</span></span>
          <h3>${t.label}</h3>
          <p>${t.blurb}</p>
          <span class="card-count">${tp.length} post${tp.length === 1 ? "" : "s"}${nl ? ` · ${nl} lab${nl === 1 ? "" : "s"}` : ""} · ${nt} terms${nread ? ` · ✓ ${nread} read` : ""}</span>
        </a>`;
    }).join("");
  }

  // ---------- Single topic ----------
  const page = $("#topic-page");
  if (!page) return;
  const k = new URLSearchParams(location.search).get("t");
  const t = TOPICS[k];
  if (!t) {
    page.innerHTML = `<section class="lab-hero"><h1>Topic not found</h1><p class="lead">Pick one from the <a class="text-link" href="${pageUrl("topics")}">topics page</a>.</p></section>`;
    return;
  }
  document.title = `${t.label} — Trendcode`;
  const tp = posts.filter((p) => p.topic === k);
  const tl = labs.filter((l) => l.topic === k);
  const tt = glossary.filter(([, tk]) => tk === k);
  const tm = myths.filter((m) => m[3] === k);
  const tr = resources.filter((r) => r[3] === k);
  const keys = Object.keys(TOPICS);
  const idx = keys.indexOf(k);
  const prev = keys[(idx - 1 + keys.length) % keys.length], next = keys[(idx + 1) % keys.length];

  page.innerHTML = `
    <section class="topic-hero">
      ${icon(k, "topic-icon big")}
      <div>
        <p class="eyebrow">// <a href="${pageUrl("topics")}">topics</a> · ${String(idx + 1).padStart(2, "0")}</p>
        <h1>${t.label}</h1>
        <p class="lead">${t.blurb}</p>
        <div class="lab-meta">
          <span class="pill">${tp.length} explainer${tp.length === 1 ? "" : "s"}</span>
          ${tl.length ? `<span class="pill">${tl.length} lab${tl.length === 1 ? "" : "s"}</span>` : ""}
          <span class="pill">${tt.length} terms</span>
          ${tm.length ? `<span class="pill">${tm.length} myths</span>` : ""}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Explainers</h2><a class="text-link" href="${pageUrl("posts")}?topic=${k}">Open in explainers →</a></div>
      <div class="post-grid">${tp.map((p) => postCard(p)).join("")}</div>
    </section>

    ${tl.length ? `<section class="section"><div class="section-head"><h2>Labs</h2></div>
      <div class="lab-grid">${tl.map((l) => labCard(l)).join("")}</div></section>` : ""}

    <section class="section">
      <div class="section-head"><h2>Practise</h2></div>
      <div class="activity-grid">
        <a class="activity-card" href="${pageUrl("flashcards")}?topic=${k}"><span class="activity-emoji">🃏</span><h3>Flashcards</h3><p>Drill the ${tt.length} ${t.label} terms until they stick.</p><span class="activity-stat">${tt.filter(([term]) => (progress.cards()[term] || 0) >= 3).length}/${tt.length} mastered</span></a>
        <a class="activity-card" href="${pageUrl("quiz")}?topic=${k}"><span class="activity-emoji">🎯</span><h3>Topic quiz</h3><p>Questions drawn from the ${t.label} explainers.</p><span class="activity-stat">${quizPool.filter((q) => (posts.find((p) => p.slug === q.post) || {}).topic === k).length} questions</span></a>
        <a class="activity-card" href="${pageUrl("myths")}"><span class="activity-emoji">🧠</span><h3>Myth or Fact</h3><p>Ten quick true-or-false calls across every topic.</p><span class="activity-stat">${activityStat("myths")}</span></a>
      </div>
    </section>

    ${tm.length ? `<section class="section"><div class="section-head"><h2>Myths &amp; facts</h2><p class="muted">Tap to reveal.</p></div>
      <div class="glossary">${tm.map(([s, fact, why]) => `
        <details><summary>${escapeHtml(s)}</summary><p><span class="verdict ${fact ? "fact" : "myth"}">${fact ? "Fact" : "Myth"}</span> ${escapeHtml(why)}</p></details>`).join("")}</div></section>` : ""}

    <section class="section">
      <div class="section-head"><h2>Key terms</h2><a class="text-link" href="${pageUrl("glossary")}">Full glossary →</a></div>
      <div class="glossary">${tt.map(([term, , d]) => `
        <details id="${slugify(term)}"><summary>${escapeHtml(term)}</summary><p>${escapeHtml(d)}</p></details>`).join("")}</div>
    </section>

    ${tr.length ? `<section class="section"><div class="section-head"><h2>Go deeper</h2><a class="text-link" href="${pageUrl("resources")}">All resources →</a></div>
      <div class="resource-grid">${tr.map(resourceCard).join("")}</div></section>` : ""}

    <nav class="topic-nav" aria-label="Other topics">
      <a href="${topicUrl(prev)}">← ${TOPICS[prev].label}</a>
      <a href="${topicUrl(next)}">${TOPICS[next].label} →</a>
    </nav>`;
})();
