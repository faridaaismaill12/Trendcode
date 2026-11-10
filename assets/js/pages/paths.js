// Learning paths page.
(function () {
  const box = $("#paths-list");
  if (!box) return;
  const render = () => {
    box.innerHTML = paths.map((p) => pathCard(p)).join("");
    const total = paths.reduce((s, p) => s + p.steps.length, 0);
    const done = paths.reduce((s, p) => s + p.steps.filter((x) => progress.stepDone(x)).length, 0);
    const sum = $("#paths-summary");
    if (sum) sum.innerHTML = `<span class="pill">${paths.length} paths</span><span class="pill">${done}/${total} steps done</span><span class="pill">${paths.filter((p) => progress.pathPct(p) === 100).length} certificates earned</span>`;
  };
  render();
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) { el.classList.add("flash"); el.scrollIntoView(); } }
})();
