// Explainers page: search, topic chips, sort.
(function () {
  const grid = $("#post-grid");
  const search = $("#post-search");
  const chips = $("#topic-chips");
  const sort = $("#post-sort");
  const empty = $("#post-empty");
  const count = $("#post-count");
  const read = progress.read();

  const params = new URLSearchParams(location.search);
  let topic = TOPICS[params.get("topic")] ? params.get("topic") : "all";
  let query = params.get("q") || "";
  search.value = query;

  chips.innerHTML = [["all", "All"], ...Object.entries(TOPICS).map(([k, t]) => [k, t.label])]
    .map(([k, label]) => `<button type="button" class="chip" data-topic="${k}">${label}</button>`).join("");

  const render = () => {
    const q = query.trim().toLowerCase();
    let shown = posts.filter((p) =>
      (topic === "all" || p.topic === topic) &&
      (!q || `${p.title} ${p.excerpt} ${topicLabel(p.topic)}`.toLowerCase().includes(q)));
    if (sort.value === "short") shown = shown.slice().sort((a, b) => a.readTime - b.readTime);
    if (sort.value === "unread") shown = shown.slice().sort((a, b) => read.includes(a.slug) - read.includes(b.slug));
    if (sort.value === "lab") shown = shown.slice().sort((a, b) => !!b.lab - !!a.lab);
    grid.innerHTML = shown.map((p) => postCard(p, read)).join("");
    empty.hidden = shown.length > 0;
    count.textContent = `${shown.length} of ${posts.length} explainers · ${read.length} read`;
    $$(".chip", chips).forEach((c) => c.classList.toggle("active", c.dataset.topic === topic));
  };
  const syncUrl = () => {
    const url = new URL(location.href);
    topic === "all" ? url.searchParams.delete("topic") : url.searchParams.set("topic", topic);
    query ? url.searchParams.set("q", query) : url.searchParams.delete("q");
    history.replaceState(null, "", url);
  };

  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) { topic = b.dataset.topic; syncUrl(); render(); }
  });
  search.addEventListener("input", () => { query = search.value; syncUrl(); render(); });
  sort.addEventListener("change", render);
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
  });
  render();
})();
