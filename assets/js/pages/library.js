// Library index: search, category filter, read marks.
(function () {
  const search = $("#lib-search");
  const cats = $("#lib-cats");
  const empty = $("#lib-empty");
  if (!search) return;
  const read = new Set(progress.lib());
  $$(".lib-item").forEach((li) => li.classList.toggle("read", read.has(li.dataset.slug)));
  const prog = $("#lib-progress");
  if (prog) prog.innerHTML = `<strong>${read.size}</strong> read`;

  let cat = location.hash && LIBRARY_CATS[location.hash.slice(1)] ? location.hash.slice(1) : "all";
  const render = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    $$(".lib-cat").forEach((sec) => {
      const inCat = cat === "all" || sec.dataset.cat === cat;
      let n = 0;
      $$(".lib-item", sec).forEach((li) => {
        const ok = inCat && (!q || li.dataset.search.includes(q));
        li.hidden = !ok;
        if (ok) n++;
      });
      sec.hidden = n === 0;
      shown += n;
    });
    empty.hidden = shown > 0;
    $$(".chip", cats).forEach((c) => c.classList.toggle("active", c.dataset.cat === cat));
  };
  cats.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    cat = b.dataset.cat;
    history.replaceState(null, "", cat === "all" ? location.pathname : "#" + cat);
    render();
  });
  search.addEventListener("input", render);
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
  });
  render();
})();
