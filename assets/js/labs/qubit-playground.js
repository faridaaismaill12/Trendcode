// Qubit playground: single-qubit simulator with real amplitudes (H, X, Z, measure).
(function () {
  const missions = tcMissions("qubit-playground", [
    { id: "super", text: "Put the qubit into an equal 50/50 superposition." },
    { id: "interfere", text: "Apply H twice in a row and watch interference undo the superposition." },
    { id: "hz", text: "Puzzle: reach |1⟩ (100% chance of measuring 1) using <em>only</em> H and Z gates." },
    { id: "minus", text: "Puzzle: prepare |−⟩ = (|0⟩ − |1⟩) / √2, a 50/50 state with a negative sign." },
  ]);

  const R = Math.SQRT1_2;
  const EPS = 1e-9;
  const GATES = {
    H: ([a, b]) => [(a + b) * R, (a - b) * R],
    X: ([a, b]) => [b, a],
    Z: ([a, b]) => [a, -b],
  };
  // history entries: { g: "H" } or { g: "M", r: 0|1 }
  let history = [];

  const stateOf = (hist) =>
    hist.reduce((s, step) => (step.g === "M" ? (step.r ? [0, 1] : [1, 0]) : GATES[step.g](s)), [1, 0]);
  const clean = (x) => (Math.abs(x) < EPS ? 0 : x);
  const fmt = (x) => {
    x = clean(x);
    if (Math.abs(Math.abs(x) - R) < 1e-6) return (x < 0 ? "−" : "+") + "1/√2";
    if (Math.abs(Math.abs(x) - 1) < 1e-6) return x < 0 ? "−1" : "+1";
    if (x === 0) return "0";
    return (x < 0 ? "−" : "+") + Math.abs(x).toFixed(3);
  };
  const named = ([a, b]) => {
    const near = (x, y) => Math.abs(x - y) < 1e-6;
    if (near(a, 1) && near(b, 0)) return "|0⟩";
    if (near(a, 0) && near(b, 1)) return "|1⟩";
    if (near(a, -1) && near(b, 0)) return "−|0⟩";
    if (near(a, 0) && near(b, -1)) return "−|1⟩";
    if (near(a, R) && near(b, R)) return "|+⟩";
    if (near(a, R) && near(b, -R)) return "|−⟩";
    if (near(a, -R) && near(b, R)) return "−|−⟩";
    if (near(a, -R) && near(b, -R)) return "−|+⟩";
    return null;
  };

  const circuit = document.getElementById("circuit");
  const svg = document.getElementById("state-svg");
  const amps = document.getElementById("amps");
  const note = document.getElementById("gate-note");
  const shotsOut = document.getElementById("shots-out");

  const drawCircle = ([a, b]) => {
    const cx = 160, cy = 160, r = 112;
    const x = cx + r * a, y = cy - r * b;
    const labels = [
      [cx + r + 10, cy + 5, "|0⟩", "start"], [cx - 4, cy - r - 12, "|1⟩", "middle"],
      [cx - r - 10, cy + 5, "−|0⟩", "end"], [cx, cy + r + 24, "−|1⟩", "middle"],
      [cx + r * R + 8, cy - r * R - 6, "|+⟩", "start"], [cx + r * R + 8, cy + r * R + 16, "|−⟩", "start"],
    ];
    svg.innerHTML = `
      <circle cx="${cx}" cy="${cy}" r="${r}" class="sc-ring" />
      <line x1="${cx - r - 6}" y1="${cy}" x2="${cx + r + 6}" y2="${cy}" class="sc-axis" />
      <line x1="${cx}" y1="${cy - r - 6}" x2="${cx}" y2="${cy + r + 6}" class="sc-axis" />
      <line x1="${cx - r * R}" y1="${cy + r * R}" x2="${cx + r * R}" y2="${cy - r * R}" class="sc-diag" />
      <line x1="${cx - r * R}" y1="${cy - r * R}" x2="${cx + r * R}" y2="${cy + r * R}" class="sc-diag" />
      ${labels.map(([lx, ly, t, anchor]) => `<text x="${lx}" y="${ly}" text-anchor="${anchor}" class="sc-label">${t}</text>`).join("")}
      <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="sc-vec" />
      <circle cx="${x}" cy="${y}" r="9" class="sc-dot" />
      <line x1="${x}" y1="${y}" x2="${x}" y2="${cy}" class="sc-proj" />
      <line x1="${x}" y1="${y}" x2="${cx}" y2="${y}" class="sc-proj" />`;
  };

  const drawAmps = ([a, b]) => {
    const row = (label, amp, cls) => {
      const p = amp * amp;
      const w = Math.abs(amp) * 50;
      return `<div class="amp-row">
        <span class="amp-label">${label}</span>
        <div class="amp-track"><span class="amp-zero"></span><span class="amp-bar ${cls}${amp < 0 ? " neg" : ""}" style="width:${w}%;${amp < 0 ? `right:50%` : `left:50%`}"></span></div>
        <span class="amp-val">${fmt(amp)}</span>
        <span class="amp-prob">${(p * 100).toFixed(0)}%</span>
      </div>`;
    };
    const n = named([a, b]);
    amps.innerHTML = `<div class="amp-head"><span></span><span>amplitude</span><span></span><span>P(measure)</span></div>` +
      row("|0⟩", clean(a), "c0") + row("|1⟩", clean(b), "c1") +
      `<p class="state-eq">|ψ⟩ = ${fmt(a)}·|0⟩ ${clean(b) === 0 ? "+0" : fmt(b)}·|1⟩${n ? ` <span class="pill">${n}</span>` : ""}</p>`;
  };

  const drawCircuit = () => {
    circuit.innerHTML = `<span class="wire-start">|0⟩</span><div class="wire">${history
      .map((s) => s.g === "M"
        ? `<span class="chip-gate m" title="Measured ${s.r}">M<sub>${s.r}</sub></span>`
        : `<span class="chip-gate">${s.g}</span>`)
      .join("") || `<span class="wire-empty">add a gate below</span>`}</div><span class="wire-end">${named(stateOf(history)) || "ψ"}</span>`;
  };

  const check = () => {
    const [a, b] = stateOf(history);
    const gates = history.map((s) => s.g);
    if (Math.abs(a * a - 0.5) < 1e-6) missions.complete("super");
    const n = gates.length;
    if (n >= 2 && gates[n - 1] === "H" && gates[n - 2] === "H") {
      missions.complete("interfere");
      note.innerHTML = "<strong>Interference!</strong> The second H split each amplitude again. The two routes to one outcome had opposite signs and cancelled, so the qubit is back where it started.";
    }
    if (n && gates.every((g) => g === "H" || g === "Z") && Math.abs(b * b - 1) < 1e-6) {
      missions.complete("hz");
      note.innerHTML = "<strong>Solved: H Z H = X.</strong> Z flipped a sign you couldn't see, and the final H turned that hidden sign into a definite 1.";
    }
    if (Math.abs(a - R) < 1e-6 && Math.abs(b + R) < 1e-6) missions.complete("minus");
  };

  const render = () => {
    const s = stateOf(history);
    drawCircle(s);
    drawAmps(s);
    drawCircuit();
  };

  document.querySelectorAll(".gate[data-gate]").forEach((btn) =>
    btn.addEventListener("click", () => {
      history.push({ g: btn.dataset.gate });
      const g = btn.dataset.gate;
      note.textContent = g === "H" ? "H mixes the amplitudes: (a+b)/√2 and (a−b)/√2."
        : g === "X" ? "X swaps the two amplitudes, like a classical NOT."
        : "Z flips the sign of the |1⟩ amplitude. The probabilities don't change. Or do they, later?";
      render();
      check();
    }));

  document.getElementById("measure-once").addEventListener("click", () => {
    const [a] = stateOf(history);
    const r = Math.random() < a * a ? 0 : 1;
    history.push({ g: "M", r });
    note.innerHTML = `<strong>Measured ${r}.</strong> The superposition collapsed: the qubit is now definitely |${r}⟩, and the old amplitudes are gone for good.`;
    render();
  });
  document.getElementById("undo").addEventListener("click", () => { history.pop(); render(); });
  document.getElementById("reset").addEventListener("click", () => { history = []; shotsOut.innerHTML = ""; note.textContent = "Back to |0⟩."; render(); });

  document.getElementById("shots").addEventListener("click", () => {
    const [a] = stateOf(history);
    let zeros = 0;
    for (let i = 0; i < 100; i++) if (Math.random() < a * a) zeros++;
    const ones = 100 - zeros;
    shotsOut.innerHTML = `
      <div class="shot-row"><span>0</span><div class="shot-track"><span class="c0" style="width:${zeros}%"></span></div><b>${zeros}</b></div>
      <div class="shot-row"><span>1</span><div class="shot-track"><span class="c1" style="width:${ones}%"></span></div><b>${ones}</b></div>`;
  });

  render();
})();
