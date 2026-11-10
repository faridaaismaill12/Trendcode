// Flashcards: Leitner-style boxes (0 new → 3 mastered), topic decks, two directions, keyboard shortcuts.
(function () {
  const stage = $("#card-stage");
  if (!stage) return;
  const deckSel = $("#deck");
  const dirSel = $("#direction");
  const statsBox = $("#deck-stats");
  const param = new URLSearchParams(location.search).get("topic");

  deckSel.innerHTML = `<option value="all">All topics (${glossary.length})</option>` +
    Object.entries(TOPICS).map(([k, t]) => `<option value="${k}">${t.label} (${glossary.filter(([, tk]) => tk === k).length})</option>`).join("");
  if (TOPICS[param]) deckSel.value = param;

  let queue = [], current = null, flipped = false, session = { seen: 0, known: 0 };
  const boxes = () => progress.cards();
  const deck = () => glossary.filter(([, k]) => deckSel.value === "all" || k === deckSel.value);

  const buildQueue = (includeMastered = false) => {
    const b = boxes();
    const cards = deck().filter(([t]) => includeMastered || (b[t] || 0) < 3);
    // lower boxes first, shuffled within each box
    queue = shuffle(cards).sort((x, y) => (b[x[0]] || 0) - (b[y[0]] || 0));
    session = { seen: 0, known: 0 };
    next();
  };

  const renderStats = () => {
    const b = boxes();
    const d = deck();
    const counts = [0, 0, 0, 0];
    d.forEach(([t]) => counts[Math.min(3, b[t] || 0)]++);
    const labels = ["New", "Learning", "Almost", "Mastered"];
    statsBox.innerHTML = `
      <div class="box-bars">${counts.map((c, i) => `
        <div class="box-col b${i}"><div class="box-bar"><span style="height:${d.length ? (c / d.length) * 100 : 0}%"></span></div><strong>${c}</strong><small>${labels[i]}</small></div>`).join("")}</div>
      <p class="muted small">Each “Got it” moves a card up one box. Three in a row and it's mastered (+2 XP). “Still learning” sends it back to box 1.</p>`;
  };

  const next = () => {
    renderStats();
    current = queue.shift() || null;
    flipped = false;
    if (!current) {
      const allMastered = deck().every(([t]) => (boxes()[t] || 0) >= 3);
      stage.innerHTML = `<div class="empty-state">
        <span>${allMastered ? "🏆" : "🎉"}</span>
        <h3>${allMastered ? "Every card in this deck is mastered!" : "Session complete"}</h3>
        <p>${session.seen ? `You reviewed ${session.seen} cards and knew ${session.known}.` : ""} ${allMastered ? "Review them all again any time." : "Come back later to keep them fresh."}</p>
        <div class="btn-row center"><button type="button" class="btn" data-again>Keep studying</button><button type="button" class="btn btn-ghost" data-review>Review all, including mastered</button></div>
      </div>`;
      return;
    }
    renderCard();
  };

  const renderCard = () => {
    const [term, k, def] = current;
    const reverse = dirSel.value === "def";
    const front = reverse ? `<p class="fc-def">${escapeHtml(def)}</p>` : `<h2 class="fc-term">${escapeHtml(term)}</h2>`;
    const back = reverse ? `<h2 class="fc-term">${escapeHtml(term)}</h2>` : `<p class="fc-def">${escapeHtml(def)}</p>`;
    const box = boxes()[term] || 0;
    stage.innerHTML = `
      <p class="fc-meta"><span class="badge">${topicLabel(k)}</span> · box ${box}/3 · ${queue.length + 1} left in session</p>
      <button type="button" class="flashcard${flipped ? " flipped" : ""}" aria-label="Flashcard. Press to flip.">
        <span class="fc-face fc-front">${front}<small>${reverse ? "Which term is this?" : "What does it mean?"} · tap or Space to flip</small></span>
        <span class="fc-face fc-back">${back}<small>${reverse ? "" : `<a href="${termUrl(term)}">glossary ↗</a>`}</small></span>
      </button>
      <div class="fc-actions" ${flipped ? "" : "hidden"}>
        <button type="button" class="btn btn-ghost" data-grade="0">😕 Still learning <kbd>1</kbd></button>
        <button type="button" class="btn" data-grade="1">😎 Got it <kbd>2</kbd></button>
      </div>`;
  };

  const flip = () => {
    if (!current) return;
    flipped = !flipped;
    $(".flashcard", stage).classList.toggle("flipped", flipped);
    $(".fc-actions", stage).hidden = !flipped;
  };
  const grade = (knew) => {
    if (!current || !flipped) return;
    const term = current[0];
    const b = boxes();
    const before = b[term] || 0;
    const after = knew ? Math.min(3, before + 1) : 1;
    session.seen++;
    if (knew) session.known++;
    awardAndAnnounce(() => store.set("tc-cards", { ...b, [term]: after }));
    if (after === 3 && before < 3) toast(`<span class="toast-icon">🃏</span><div><strong>Mastered: ${escapeHtml(term)}</strong><br />+2 XP</div>`);
    if (!knew) queue.splice(Math.min(3, queue.length), 0, current); // see it again soon
    next();
  };

  stage.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    if (e.target.closest(".flashcard")) return flip();
    const g = e.target.closest("[data-grade]");
    if (g) return grade(g.dataset.grade === "1");
    if (e.target.closest("[data-again]")) buildQueue(false);
    if (e.target.closest("[data-review]")) buildQueue(true);
  });
  document.addEventListener("keydown", (e) => {
    if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
    const onOtherControl = document.activeElement.matches && document.activeElement.matches("a, button:not(.flashcard)");
    if ((e.key === " " || e.key === "Enter") && !onOtherControl) { if (current) { e.preventDefault(); flip(); } }
    if (e.key === "1") grade(false);
    if (e.key === "2") grade(true);
  });
  deckSel.addEventListener("change", () => {
    const url = new URL(location.href);
    deckSel.value === "all" ? url.searchParams.delete("topic") : url.searchParams.set("topic", deckSel.value);
    history.replaceState(null, "", url);
    buildQueue();
  });
  dirSel.addEventListener("change", () => current && renderCard());
  $("#reset-deck").addEventListener("click", () => {
    if (!confirm("Reset progress for every card in this deck?")) return;
    const b = boxes();
    deck().forEach(([t]) => delete b[t]);
    store.set("tc-cards", b);
    document.dispatchEvent(new CustomEvent("tc-progress"));
    buildQueue();
  });
  buildQueue();
})();
