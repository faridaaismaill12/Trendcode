// Myth or Fact: 10 random statements per round, keyboard M / F.
(function () {
  const box = $("#myth-box");
  if (!box) return;
  const ROUND = 10;
  let round = [], idx = 0, score = 0, answered = false, log = [];

  const start = () => {
    round = shuffle(myths).slice(0, ROUND);
    idx = 0; score = 0; log = [];
    show();
  };

  const show = () => {
    answered = false;
    if (idx >= round.length) return finish();
    const [s, , , k] = round[idx];
    box.innerHTML = `
      <p class="quiz-progress">Statement ${idx + 1} of ${round.length} · score ${score} · <span class="badge">${topicLabel(k)}</span></p>
      <div class="quiz-bar"><span style="width:${(idx / round.length) * 100}%"></span></div>
      <blockquote class="myth-statement">“${escapeHtml(s)}”</blockquote>
      <div class="myth-buttons">
        <button type="button" class="myth-btn myth" data-a="0">🙅 Myth <kbd>M</kbd></button>
        <button type="button" class="myth-btn fact" data-a="1">✅ Fact <kbd>F</kbd></button>
      </div>
      <div class="myth-feedback" aria-live="polite"></div>`;
  };

  const answer = (saidFact) => {
    if (answered) return;
    answered = true;
    const [s, fact, why, , slug] = round[idx];
    const right = saidFact === fact;
    if (right) score++;
    log.push([s, fact, right]);
    $$(".myth-btn", box).forEach((b) => {
      b.disabled = true;
      if ((b.dataset.a === "1") === fact) b.classList.add("correct");
      else if ((b.dataset.a === "1") === saidFact) b.classList.add("wrong");
    });
    const p = posts.find((x) => x.slug === slug);
    $(".myth-feedback", box).innerHTML = `
      <p class="quiz-explain"><strong>${right ? "✓ Right" : "✗ Wrong"}: it's a ${fact ? "fact" : "myth"}.</strong> ${escapeHtml(why)}
      ${p ? ` <a href="${postUrl(p)}">Read more →</a>` : ""}</p>
      <div class="quiz-actions"><button type="button" class="btn" data-next>${idx + 1 < round.length ? "Next →" : "See my score"}</button></div>`;
    $("[data-next]", box).focus();
  };

  const finish = () => {
    const prev = progress.mythsBest();
    if (score > prev) awardAndAnnounce(() => store.set("tc-myths-best", score));
    const verdict = score === 10 ? "Perfect. Nobody's fooling you." : score >= 7 ? "Sharp! Just a couple slipped past." : "These catch almost everyone. Now you know.";
    box.innerHTML = `
      <p class="quiz-progress">Round complete</p>
      <p class="quiz-score">${score}/${round.length}</p>
      <h3>${verdict}</h3>
      <p class="muted">Best: ${Math.max(score, prev)}/10 · ${myths.length} statements in the pool.</p>
      <ul class="myth-review">${log.map(([s, fact, right]) =>
        `<li class="${right ? "ok" : "bad"}"><span>${right ? "✓" : "✗"}</span>${escapeHtml(s)} <em>${fact ? "Fact" : "Myth"}</em></li>`).join("")}</ul>
      <div class="quiz-actions"><button type="button" class="btn" data-restart>Play again</button><a class="btn btn-ghost" href="${pageUrl("quiz")}">Take the quiz</a></div>`;
  };

  box.addEventListener("click", (e) => {
    const b = e.target.closest(".myth-btn");
    if (b && !b.disabled) return answer(b.dataset.a === "1");
    if (e.target.closest("[data-next]")) { idx++; show(); }
    if (e.target.closest("[data-restart]")) start();
  });
  document.addEventListener("keydown", (e) => {
    if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
    if (e.key.toLowerCase() === "m") answer(false);
    if (e.key.toLowerCase() === "f") answer(true);
  });
  start();
})();
