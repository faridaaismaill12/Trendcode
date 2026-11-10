// Timelines page: tabbed, clickable milestones. Arrow keys step through events.
(function () {
  const tabs = $("#timeline-tabs");
  const box = $("#timeline-list");
  const detail = $("#timeline-detail");
  if (!box) return;
  const keys = Object.keys(timelines);
  let key = keys.includes(location.hash.slice(1)) ? location.hash.slice(1) : keys[0];
  let sel = 0;

  const renderTabs = () => {
    tabs.innerHTML = keys.map((k) =>
      `<button type="button" role="tab" class="chip${k === key ? " active" : ""}" aria-selected="${k === key}" data-k="${k}">${timelines[k].title}</button>`).join("");
  };
  const select = (i) => {
    const ev = timelines[key].events;
    sel = Math.max(0, Math.min(ev.length - 1, i));
    $$(".tl-item", box).forEach((b, j) => { b.classList.toggle("active", j === sel); b.setAttribute("aria-expanded", String(j === sel)); });
    const [y, t, d] = ev[sel];
    detail.innerHTML = `<span class="tl-step">${sel + 1} / ${ev.length}</span><strong>${y} · ${t}</strong><p>${d}</p>
      <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-move="-1" ${sel === 0 ? "disabled" : ""}>← Earlier</button>
      <button type="button" class="btn btn-ghost btn-sm" data-move="1" ${sel === ev.length - 1 ? "disabled" : ""}>Later →</button></div>`;
  };
  const render = () => {
    renderTabs();
    box.innerHTML = timelines[key].events.map(([y, t], i) =>
      `<button type="button" class="tl-item" data-i="${i}" aria-expanded="false"><span class="tl-year">${y}</span><span class="tl-title">${t}</span></button>`).join("");
    select(0);
  };
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    key = b.dataset.k;
    history.replaceState(null, "", "#" + key);
    render();
  });
  box.addEventListener("click", (e) => { const b = e.target.closest(".tl-item"); if (b) select(+b.dataset.i); });
  detail.addEventListener("click", (e) => { const b = e.target.closest("[data-move]"); if (b) select(sel + +b.dataset.move); });
  document.addEventListener("keydown", (e) => {
    if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") select(sel + 1);
    if (e.key === "ArrowLeft") select(sel - 1);
  });
  render();
})();
