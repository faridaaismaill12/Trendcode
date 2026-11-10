// Small pages: activities hub, reading list, resources.
(function () {
  // ---------- Activities hub ----------
  const acts = $("#activities-grid");
  if (acts) {
    acts.innerHTML = activities.map(activityCard).join("");
    const labsBox = $("#activities-labs");
    if (labsBox) labsBox.innerHTML = labs.slice(0, 3).map((l) => labCard(l)).join("");
  }

  // ---------- Reading list ----------
  const saved = $("#saved-grid");
  if (saved) {
    const render = () => {
      const list = progress.saved().map((s) => posts.find((p) => p.slug === s)).filter(Boolean);
      const unread = list.filter((p) => !progress.read().includes(p.slug));
      $("#saved-summary").innerHTML = `<span class="pill">${list.length} saved</span><span class="pill">${unread.length} unread</span>`;
      saved.innerHTML = list.length
        ? list.map((p) => postCard(p)).join("")
        : `<div class="empty-state"><span>🔖</span><h3>Your reading list is empty</h3>
            <p>Tap the ☆ on any explainer to save it here for later.</p>
            <a class="btn" href="${pageUrl("posts")}">Browse explainers →</a></div>`;
      const sugg = $("#saved-suggest");
      const picks = posts.filter((p) => !progress.saved().includes(p.slug) && !progress.read().includes(p.slug)).slice(0, 3);
      sugg.innerHTML = picks.length ? `<h2 class="sub-h">You might like</h2><div class="post-grid compact">${picks.map((p) => postCard(p)).join("")}</div>` : "";
    };
    render();
    document.addEventListener("tc-progress", () => setTimeout(render, 0));
  }

  // ---------- Resources ----------
  const res = $("#resource-list");
  if (res) {
    const chips = $("#resource-topics");
    const used = Object.keys(TOPICS).filter((k) => resources.some((r) => r[3] === k));
    let topic = "all";
    chips.innerHTML = [["all", "All"], ...used.map((k) => [k, topicLabel(k)])]
      .map(([k, l]) => `<button type="button" class="chip" data-topic="${k}">${l}</button>`).join("");
    const render = () => {
      const groups = (topic === "all" ? used : [topic]).map((k) => {
        const items = resources.filter((r) => r[3] === k);
        return `<section class="res-group"><h2 class="sub-h">${icon(k, "inline-icon")} ${topicLabel(k)}</h2>
          <div class="resource-grid">${items.map(resourceCard).join("")}</div></section>`;
      });
      res.innerHTML = groups.join("");
      $$(".chip", chips).forEach((c) => c.classList.toggle("active", c.dataset.topic === topic));
    };
    chips.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { topic = b.dataset.topic; render(); } });
    render();
  }
})();
