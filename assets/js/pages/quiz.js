// Quiz page: 5 random questions, optionally filtered by topic (?topic=key).
(function () {
  const box = $("#quiz-box");
  const chipsBox = $("#quiz-topics");
  if (!box) return;
  const topicOf = (q) => (posts.find((p) => p.slug === q.post) || {}).topic;
  const available = Object.keys(TOPICS).filter((k) => quizPool.some((q) => topicOf(q) === k));
  const param = new URLSearchParams(location.search).get("topic");
  let topic = available.includes(param) ? param : "all";
  let questions = [], idx = 0, score = 0;

  const renderChips = () => {
    chipsBox.innerHTML = [["all", "All topics"], ...available.map((k) => [k, topicLabel(k)])]
      .map(([k, l]) => `<button type="button" class="chip${k === topic ? " active" : ""}" data-topic="${k}">${l}</button>`).join("");
  };
  chipsBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-topic]");
    if (!b) return;
    topic = b.dataset.topic;
    renderChips();
    start();
  });

  const start = () => {
    const pool = topic === "all" ? quizPool : quizPool.filter((q) => topicOf(q) === topic);
    questions = shuffle(pool).slice(0, 5);
    idx = 0; score = 0;
    show();
  };

  const show = () => {
    if (idx >= questions.length) return finish();
    const item = questions[idx];
    box.innerHTML = `
      <p class="quiz-progress">Question ${idx + 1} of ${questions.length} · score ${score} · <span class="badge">${topicLabel(topicOf(item))}</span></p>
      <div class="quiz-bar"><span style="width:${(idx / questions.length) * 100}%"></span></div>
      <h3>${escapeHtml(item.q)}</h3>
      <div class="quiz-options">
        ${item.options.map((o, i) => `<button type="button" class="quiz-option" data-i="${i}"><span class="opt-key">${"ABCD"[i]}</span>${escapeHtml(o)}</button>`).join("")}
      </div>
      <div class="quiz-feedback" aria-live="polite"></div>`;
  };

  const answer = (i) => {
    const item = questions[idx];
    const right = i === item.a;
    if (right) score++;
    $$(".quiz-option", box).forEach((b, j) => {
      b.disabled = true;
      if (j === item.a) b.classList.add("correct");
      else if (j === i) b.classList.add("wrong");
    });
    const p = posts.find((x) => x.slug === item.post);
    $(".quiz-feedback", box).innerHTML = `
      <p class="quiz-explain"><strong>${right ? "✓ Correct." : "✗ Not quite."}</strong> ${escapeHtml(item.why)}
      ${p ? ` <a href="${postUrl(p)}">Read more →</a>` : ""}</p>
      <div class="quiz-actions"><button type="button" class="btn" data-next>${idx + 1 < questions.length ? "Next question →" : "See my score"}</button></div>`;
    $("[data-next]", box).focus();
  };

  const finish = () => {
    const prev = progress.quizBest();
    // Only full 5-question rounds count toward the best score
    if (questions.length === 5 && score > prev) awardAndAnnounce(() => store.set("tc-quiz-best", score));
    const n = questions.length;
    const verdict = score === n ? "Fully decoded. You could write these posts." :
      score >= Math.ceil(n * 0.6) ? "Nicely done. A couple of explainers will fill the gaps." :
      "Great place to start. The explainers cover every answer.";
    box.innerHTML = `
      <p class="quiz-progress">Finished</p>
      <p class="quiz-score">${score}/${n}</p>
      <h3>${verdict}</h3>
      <p class="muted">Best full round: ${Math.max(questions.length === 5 ? score : 0, prev)}/5 · ${quizPool.length} questions in the pool.${n < 5 ? " Short topic rounds don't count toward your best score." : ""}</p>
      <div class="quiz-actions">
        <button type="button" class="btn" data-restart>New round</button>
        <a class="btn btn-ghost" href="${pageUrl("myths")}">Try Myth or Fact</a>
      </div>`;
  };

  box.addEventListener("click", (e) => {
    const opt = e.target.closest(".quiz-option");
    if (opt && !opt.disabled) return answer(+opt.dataset.i);
    if (e.target.closest("[data-next]")) { idx++; show(); }
    if (e.target.closest("[data-restart]")) start();
  });
  document.addEventListener("keydown", (e) => {
    if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
    const k = "abcd".indexOf(e.key.toLowerCase());
    const opts = $$(".quiz-option:not(:disabled)", box);
    if (k >= 0 && opts[k]) answer(k);
  });
  renderChips();
  start();
})();
