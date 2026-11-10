// Glossary page: term of the day, search, topic chips, A–Z jump bar, deep links (#term-slug).
(function () {
  const box = $("#glossary-list");
  if (!box) return;
  const search = $("#glossary-search");
  const chips = $("#glossary-topics");
  const az = $("#az");
  let topic = "all";

  const day = Math.floor(Date.now() / 86400000);
  const [tt, tk, td] = glossary[day % glossary.length];
  $("#term-of-day").innerHTML = `<span class="eyebrow">// term of the day</span><h3>${escapeHtml(tt)}</h3><p>${escapeHtml(td)}</p><span class="g-topic">${topicLabel(tk)}</span>`;

  chips.innerHTML = [["all", "All"], ...Object.entries(TOPICS).map(([k, t]) => [k, t.label])]
    .map(([k, l]) => `<button type="button" class="chip" data-topic="${k}">${l}</button>`).join("");

  const sorted = glossary.slice().sort((a, b) => a[0].localeCompare(b[0]));
  const render = () => {
    const q = search.value.trim().toLowerCase();
    const shown = sorted.filter(([t, k, d]) => (topic === "all" || k === topic) && (!q || `${t} ${d}`.toLowerCase().includes(q)));
    let letter = "";
    box.innerHTML = shown.length
      ? shown.map(([t, k, d]) => {
          const L = t[0].toUpperCase();
          const head = L !== letter ? ((letter = L), `<h3 class="az-letter" id="letter-${L}">${L}</h3>`) : "";
          const rel = posts.filter((p) => p.topic === k).slice(0, 1)[0];
          return `${head}<details id="${slugify(t)}">
            <summary>${escapeHtml(t)}</summary>
            <p><span class="g-topic">${topicLabel(k)}</span><br />${escapeHtml(d)}
            ${rel ? `<br /><a class="text-link small" href="${postUrl(rel)}">Read: ${escapeHtml(rel.title)} →</a>` : ""}</p>
          </details>`;
        }).join("")
      : `<p class="empty">No term matches "${escapeHtml(q)}".</p>`;
    if (q && shown.length <= 3) $$("details", box).forEach((d) => (d.open = true));
    const letters = new Set(shown.map(([t]) => t[0].toUpperCase()));
    az.innerHTML = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((L) =>
      letters.has(L) ? `<a href="#letter-${L}">${L}</a>` : `<span>${L}</span>`).join("");
    $$(".chip", chips).forEach((c) => c.classList.toggle("active", c.dataset.topic === topic));
    $("#glossary-count").textContent = `${shown.length} of ${glossary.length} terms`;
  };
  search.addEventListener("input", render);
  chips.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { topic = b.dataset.topic; render(); } });
  render();

  const openHash = () => {
    const el = location.hash && document.getElementById(location.hash.slice(1));
    if (el && el.tagName === "DETAILS") { el.open = true; el.classList.add("flash"); el.scrollIntoView({ block: "center" }); }
  };
  window.addEventListener("hashchange", openHash);
  openHash();
})();
