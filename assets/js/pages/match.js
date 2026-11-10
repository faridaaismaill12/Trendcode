// Jargon Match: pair 6 terms with their meanings against the clock.
(function () {
  const board = $("#match-board");
  if (!board) return;
  const timerEl = $("#match-timer");
  const missEl = $("#match-misses");
  const pairsEl = $("#match-pairs");
  const result = $("#match-result");
  const topicSel = $("#match-topic");
  const PAIRS = 6;

  topicSel.innerHTML = `<option value="all">All topics</option>` + Object.entries(TOPICS)
    .filter(([k]) => glossary.filter(([, tk]) => tk === k).length >= PAIRS - 2)
    .map(([k, t]) => `<option value="${k}">${t.label}</option>`).join("");

  const shortDef = (d) => {
    const first = d.split(/(?<=[.!?])\s/)[0];
    return first.length > 110 ? first.slice(0, 107).replace(/\s+\S*$/, "") + "…" : first;
  };

  let round = [], selected = null, matched = 0, misses = 0, start = 0, timer = 0, locked = false;

  const newRound = () => {
    clearInterval(timer);
    const pool = glossary.filter(([, k]) => topicSel.value === "all" || k === topicSel.value);
    round = shuffle(pool).slice(0, Math.min(PAIRS, pool.length)).map(([t, , d], i) => ({ id: i, term: t, def: shortDef(d) }));
    selected = null; matched = 0; misses = 0; start = 0; locked = false;
    timerEl.textContent = "0.0s";
    missEl.textContent = "0";
    pairsEl.textContent = `0/${round.length}`;
    result.innerHTML = "";
    const terms = shuffle(round), defs = shuffle(round);
    board.innerHTML = `
      <div class="match-col">${terms.map((r) => `<button type="button" class="match-tile term" data-id="${r.id}" data-side="t">${escapeHtml(r.term)}</button>`).join("")}</div>
      <div class="match-col">${defs.map((r) => `<button type="button" class="match-tile def" data-id="${r.id}" data-side="d">${escapeHtml(r.def)}</button>`).join("")}</div>`;
  };

  const elapsed = () => (performance.now() - start) / 1000;

  board.addEventListener("click", (e) => {
    const tile = e.target.closest(".match-tile");
    if (!tile || tile.disabled || locked) return;
    if (!start) {
      start = performance.now();
      timer = setInterval(() => (timerEl.textContent = elapsed().toFixed(1) + "s"), 100);
    }
    if (!selected) { selected = tile; tile.classList.add("sel"); return; }
    if (selected === tile) { tile.classList.remove("sel"); selected = null; return; }
    if (selected.dataset.side === tile.dataset.side) { selected.classList.remove("sel"); selected = tile; tile.classList.add("sel"); return; }

    const a = selected, b = tile;
    selected = null;
    a.classList.remove("sel");
    if (a.dataset.id === b.dataset.id) {
      [a, b].forEach((t) => { t.classList.add("ok"); t.disabled = true; });
      matched++;
      pairsEl.textContent = `${matched}/${round.length}`;
      if (matched === round.length) finish();
    } else {
      misses++;
      missEl.textContent = misses;
      locked = true;
      [a, b].forEach((t) => t.classList.add("bad"));
      setTimeout(() => { [a, b].forEach((t) => t.classList.remove("bad")); locked = false; }, 500);
    }
  });

  const finish = () => {
    clearInterval(timer);
    const secs = elapsed();
    timerEl.textContent = secs.toFixed(1) + "s";
    const full = round.length === PAIRS;
    const prev = progress.matchBest();
    const isBest = full && (!prev || secs < prev);
    if (isBest) awardAndAnnounce(() => store.set("tc-match-best", +secs.toFixed(1)));
    const stars = misses === 0 ? "⭐⭐⭐" : misses <= 2 ? "⭐⭐" : "⭐";
    result.innerHTML = `<div class="result-banner good">
      <strong class="success">All matched in ${secs.toFixed(1)}s</strong> with ${misses} miss${misses === 1 ? "" : "es"} ${stars}
      ${isBest ? "<br />🏆 New personal best!" : prev ? `<br />Your best: ${prev.toFixed(1)}s` : ""}
      ${secs < 45 ? "" : "<br />Tip: under 45 seconds unlocks the ⚡ Quick matcher badge."}
      <div class="btn-row"><button type="button" class="btn btn-sm" id="again">Play again</button><a class="btn btn-ghost btn-sm" href="${pageUrl("flashcards")}">Study with flashcards</a></div>
    </div>`;
    $("#again").addEventListener("click", newRound);
  };

  $("#new-round").addEventListener("click", newRound);
  topicSel.addEventListener("change", newRound);
  const best = progress.matchBest();
  $("#match-best").textContent = best ? best.toFixed(1) + "s" : "–";
  document.addEventListener("tc-progress", () => { const b = progress.matchBest(); $("#match-best").textContent = b ? b.toFixed(1) + "s" : "–"; });
  newRound();
})();
