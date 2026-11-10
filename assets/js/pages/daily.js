// Daily Challenge: one deterministic puzzle per calendar day, streak tracking, unlimited practice.
(function () {
  const box = $("#daily-box");
  if (!box) return;

  const now = new Date();
  const dayIndex = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const rshuffle = (rng, arr) => arr.map((x) => [rng(), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

  const PHRASES = ["HASHES ARE ONE WAY", "NEVER REUSE PASSWORDS", "QUBITS CAN INTERFERE", "TRUST BUT VERIFY",
    "ALWAYS USE HTTPS", "PASSKEYS BEAT PHISHING", "DATA IS NOT AN ORDER", "SORTING TAKES N LOG N", "NOISE PROTECTS PRIVACY",
    "SHOR BREAKS RSA", "KEEP KEYS SECRET", "LENGTH BEATS SYMBOLS"];
  const SNIPPETS = [
    ["for item in items:\n    print(item)", "O(n)", "One pass over the list: the work grows in step with n."],
    ["for a in items:\n    for b in items:\n        compare(a, b)", "O(n²)", "Every item is paired with every item: n × n comparisons."],
    ["return items[0]", "O(1)", "Reading one position takes the same time however long the list is."],
    ["lo, hi = 0, len(items) - 1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    # discard half the range\n    ...", "O(log n)", "Binary search halves the range each step, so a million items need about 20 steps."],
    ["items.sort()\nfor item in items:\n    print(item)", "O(n log n)", "The sort dominates: O(n log n) plus O(n) is still O(n log n)."],
    ["for i in range(n):\n    for j in range(10):\n        work(i, j)", "O(n)", "The inner loop always runs 10 times, a constant, so it's 10n → O(n)."],
    ["while n > 1:\n    n = n // 2", "O(log n)", "Halving until you reach 1 takes log₂(n) steps."],
    ["for i in range(n):\n    for j in range(i, n):\n        work(i, j)", "O(n²)", "About n²/2 pairs. Big-O drops the ½, so it's O(n²)."],
    ["seen = set()\nfor x in items:\n    if x in seen: return True\n    seen.add(x)", "O(n)", "Set lookups are O(1) on average, so one pass is O(n) overall."],
    ["total = n * (n + 1) // 2", "O(1)", "A formula instead of a loop: one calculation, whatever n is."],
  ];
  const CLASSES = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"];
  const shiftText = (s, k) => s.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k + 26) % 26) + 65));
  const maskTerm = (def, term) => {
    const core = term.replace(/\s*\(.*?\)\s*/g, "").trim();
    return def.replace(new RegExp(core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "▢▢▢");
  };

  const TYPES = {
    term(rng) {
      const pool = rshuffle(rng, glossary);
      const [term, k, def] = pool[0];
      const options = rshuffle(rng, [term, pool[1][0], pool[2][0], pool[3][0]]);
      return {
        kind: "Name that term", emoji: "📖", ui: "options", options, answer: term,
        prompt: `<p class="daily-q">Which term matches this definition?</p><blockquote>${escapeHtml(maskTerm(def, term))}</blockquote>`,
        explain: `<strong>${escapeHtml(term)}</strong> (${topicLabel(k)}). <a href="${termUrl(term)}">See it in the glossary →</a>`,
      };
    },
    binary(rng) {
      const n = 5 + Math.floor(rng() * 250);
      const bits = n.toString(2);
      const breakdown = [...bits].map((b, i) => `${b}×${2 ** (bits.length - 1 - i)}`).join(" + ");
      const toBin = rng() < 0.5;
      return {
        kind: toBin ? "Decimal → binary" : "Binary → decimal", emoji: "🔢", ui: "input",
        prompt: toBin
          ? `<p class="daily-q">Write <strong class="big-inline">${n}</strong> in binary.</p><p class="muted">Hint: the place values are 128, 64, 32, 16, 8, 4, 2, 1.</p>`
          : `<p class="daily-q">What is this binary number in decimal?</p><p class="big-inline mono">${bits}</p><p class="muted">Hint: each place is worth double the one to its right.</p>`,
        placeholder: toBin ? "e.g. 101101" : "e.g. 45",
        check: (v) => {
          v = v.trim().replace(/^0b/i, "").replace(/\s+/g, "");
          return toBin ? /^[01]+$/.test(v) && parseInt(v, 2) === n : /^\d+$/.test(v) && +v === n;
        },
        answer: toBin ? bits : String(n),
        explain: `${bits} = ${breakdown} = ${n}`,
      };
    },
    cipher(rng) {
      const plain = pick(rng, PHRASES);
      const key = 1 + Math.floor(rng() * 25);
      return {
        kind: "Crack the cipher", emoji: "🔐", ui: "cipher", key, cipher: shiftText(plain, key), plain,
        prompt: `<p class="daily-q">This message was encrypted with a Caesar cipher. Slide to find the shift that reveals it.</p>`,
        answer: `shift ${key}: ${plain}`,
        explain: `Shift ${key} turns “${shiftText(plain, key)}” back into “${plain}”. <a href="${BASE}labs/cipher-lab.html">Practise in the cipher lab →</a>`,
      };
    },
    bigo(rng) {
      const [code, ans, why] = pick(rng, SNIPPETS);
      return {
        kind: "Spot the Big-O", emoji: "📈", ui: "options", options: CLASSES, answer: ans,
        prompt: `<p class="daily-q">What's the time complexity of this code, as <code>items</code> (size n) grows?</p><pre class="code">${escapeHtml(code)}</pre>`,
        explain: `<strong>${ans}</strong>: ${why} <a href="${BASE}posts/big-o-notation.html">Read the Big-O explainer →</a>`,
      };
    },
  };
  const ORDER = ["term", "binary", "cipher", "bigo"];

  const build = (seed, typeKey) => TYPES[typeKey](mulberry(seed));
  let mode = "daily";
  let challenge = build(dayIndex * 7919, ORDER[dayIndex % ORDER.length]);

  const solvedToday = () => progress.daily().includes(todayKey());

  const onSolved = () => {
    if (mode === "daily" && !solvedToday()) {
      awardAndAnnounce(() => store.set("tc-daily", [...progress.daily(), todayKey()]));
      toast(`<span class="toast-icon">📅</span><div><strong>Daily challenge solved!</strong><br />+5 XP · 🔥 ${progress.streak()}-day streak</div>`);
      renderStreak();
    }
  };

  const feedback = (ok, extra = "") => {
    const fb = $(".daily-feedback", box);
    fb.innerHTML = ok
      ? `<div class="result-banner good"><strong class="success">✓ Correct!</strong> ${challenge.explain}${extra}</div>`
      : `<div class="result-banner bad"><strong class="danger">Not quite.</strong> Try again, or <button type="button" class="link-btn inline" data-reveal>reveal the answer</button> (no XP).</div>`;
    if (ok) { onSolved(); $$("button[data-opt], .daily-input, .daily-submit", box).forEach((b) => (b.disabled = true)); }
  };

  const render = () => {
    const c = challenge;
    const already = mode === "daily" && solvedToday();
    let ui = "";
    if (c.ui === "options") ui = `<div class="quiz-options">${c.options.map((o, i) =>
      `<button type="button" class="quiz-option" data-opt="${escapeHtml(o)}"><span class="opt-key">${"ABCDE"[i]}</span>${escapeHtml(o)}</button>`).join("")}</div>`;
    if (c.ui === "input") ui = `<form class="daily-form"><input class="input daily-input" type="text" inputmode="numeric" autocomplete="off" placeholder="${c.placeholder}" aria-label="Your answer" /><button class="btn daily-submit">Check</button></form>`;
    if (c.ui === "cipher") ui = `
      <div class="mono-out secret">${c.cipher}</div>
      <label class="field"><span>Try shift: <b class="shift-out">0</b></span><input type="range" class="shift" min="0" max="25" value="0" /></label>
      <div class="mono-out preview">${c.cipher}</div>
      <div class="btn-row"><button type="button" class="btn daily-submit">That's the message!</button></div>`;
    box.innerHTML = `
      <div class="daily-head">
        <span class="daily-emoji">${c.emoji}</span>
        <div><span class="eyebrow">// ${mode === "daily" ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "practice round"}</span>
        <h2>${c.kind}</h2></div>
        ${mode === "practice" ? `<span class="pill">no XP</span>` : already ? `<span class="pill ok">✓ solved</span>` : `<span class="pill">+5 XP</span>`}
      </div>
      ${c.prompt}
      ${ui}
      <div class="daily-feedback" aria-live="polite">${already ? `<div class="result-banner good"><strong class="success">✓ You've solved today's challenge.</strong> ${c.explain}</div>` : ""}</div>`;
    if (already) $$("button[data-opt], .daily-input, .daily-submit", box).forEach((b) => (b.disabled = true));

    if (c.ui === "cipher") {
      const s = $(".shift", box), out = $(".shift-out", box), prev = $(".preview", box);
      s.addEventListener("input", () => { out.textContent = s.value; prev.textContent = shiftText(c.cipher, -s.value); });
      $(".daily-submit", box).addEventListener("click", () => feedback(+s.value === c.key));
    }
    if (c.ui === "input") {
      $(".daily-form", box).addEventListener("submit", (e) => { e.preventDefault(); feedback(c.check($(".daily-input", box).value)); });
    }
  };

  box.addEventListener("click", (e) => {
    const opt = e.target.closest("[data-opt]");
    if (opt && !opt.disabled) {
      const ok = opt.dataset.opt === challenge.answer;
      opt.classList.add(ok ? "correct" : "wrong");
      if (ok) $$("[data-opt]", box).forEach((b) => (b.disabled = true));
      else opt.disabled = true;
      feedback(ok);
    }
    if (e.target.closest("[data-reveal]")) {
      $(".daily-feedback", box).innerHTML = `<div class="result-banner"><strong>Answer:</strong> ${escapeHtml(challenge.answer)}<br />${challenge.explain}</div>`;
      $$("button[data-opt], .daily-input, .daily-submit", box).forEach((b) => (b.disabled = true));
    }
  });

  $("#practice").addEventListener("click", () => {
    mode = "practice";
    challenge = build(Math.floor(Math.random() * 1e9), ORDER[Math.floor(Math.random() * ORDER.length)]);
    render();
    $("#back-today").hidden = false;
  });
  $("#back-today").addEventListener("click", () => {
    mode = "daily";
    challenge = build(dayIndex * 7919, ORDER[dayIndex % ORDER.length]);
    render();
    $("#back-today").hidden = true;
  });

  // ---------- Streak calendar + countdown ----------
  const renderStreak = () => {
    const done = new Set(progress.daily());
    const cells = [];
    for (let i = 20; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = todayKey(d);
      cells.push(`<span class="cal-day${done.has(k) ? " done" : ""}${i === 0 ? " today" : ""}" title="${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${done.has(k) ? " ✓" : ""}">${d.getDate()}</span>`);
    }
    $("#streak-box").innerHTML = `
      <div class="streak-num"><span>🔥</span><strong>${progress.streak()}</strong><small>day streak</small></div>
      <div><p class="muted small">Last 3 weeks · ${progress.daily().length} solved in total</p><div class="cal">${cells.join("")}</div></div>`;
  };
  const tickCountdown = () => {
    const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
    const s = Math.floor((m - n) / 1000);
    $("#countdown").textContent = `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  setInterval(tickCountdown, 1000);
  tickCountdown();
  renderStreak();
  render();
})();
