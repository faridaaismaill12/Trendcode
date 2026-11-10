// Train a Neuron: logistic-regression "neuron" trained by full-batch gradient descent on a canvas.
(function () {
  const missions = tcMissions("perceptron-playground", [
    { id: "fit", text: "Train the neuron to 100% accuracy on at least 6 points (2+ of each class), with no extra features." },
    { id: "xor-fail", text: "Train on the XOR dataset for 300+ epochs without extra features, and watch it fail." },
    { id: "xor-fix", text: "Fix XOR: turn on extra features and reach 100% accuracy." },
  ]);

  const canvas = document.getElementById("nn-canvas");
  const ctx = canvas.getContext("2d");
  const preset = document.getElementById("preset");
  const lrEl = document.getElementById("lr");
  const lrOut = document.getElementById("lr-out");
  const featEl = document.getElementById("features");
  const trainBtn = document.getElementById("train");
  const epochEl = document.getElementById("epoch");
  const lossEl = document.getElementById("loss");
  const accEl = document.getElementById("acc");
  const chart = document.getElementById("loss-chart");
  const weightsEl = document.getElementById("weights");
  const note = document.getElementById("nn-note");

  let points = [], cls = 0, w = [], b = 0, epoch = 0, training = false, raf = 0;
  let lossHistory = [], datasetName = "blobs", modified = false;

  // Seeded random numbers so presets look the same every time
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const jitter = (s) => (rand() - 0.5) * 2 * s;

  const PRESETS = {
    blobs: () => [
      ...Array.from({ length: 9 }, () => ({ x: -0.45 + jitter(0.3), y: -0.35 + jitter(0.3), c: 0 })),
      ...Array.from({ length: 9 }, () => ({ x: 0.45 + jitter(0.3), y: 0.4 + jitter(0.3), c: 1 })),
    ],
    xor: () => [[-0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 1], [0.5, -0.5, 1]].flatMap(([cx, cy, c]) =>
      Array.from({ length: 6 }, () => ({ x: cx + jitter(0.2), y: cy + jitter(0.2), c }))),
    ring: () => [
      ...Array.from({ length: 12 }, () => { const a = rand() * Math.PI * 2, r = rand() * 0.3; return { x: r * Math.cos(a), y: r * Math.sin(a), c: 0 }; }),
      ...Array.from({ length: 18 }, () => { const a = rand() * Math.PI * 2, r = 0.62 + rand() * 0.25; return { x: r * Math.cos(a), y: r * Math.sin(a), c: 1 }; }),
    ],
    clear: () => [],
  };

  const feats = (p) => (featEl.checked ? [p.x, p.y, p.x * p.y, p.x * p.x, p.y * p.y] : [p.x, p.y]);
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));
  const predict = (p) => sigmoid(feats(p).reduce((s, f, i) => s + f * w[i], b));
  const lr = () => Math.pow(10, +lrEl.value);

  const initWeights = () => {
    const n = featEl.checked ? 5 : 2;
    w = Array.from({ length: n }, () => (Math.random() - 0.5) * 0.5);
    b = 0; epoch = 0; lossHistory = [];
  };

  const metrics = () => {
    if (!points.length) return { loss: null, acc: null };
    let loss = 0, right = 0;
    for (const p of points) {
      const s = Math.min(1 - 1e-9, Math.max(1e-9, predict(p)));
      loss += -(p.c ? Math.log(s) : Math.log(1 - s));
      if ((s > 0.5 ? 1 : 0) === p.c) right++;
    }
    return { loss: loss / points.length, acc: right / points.length };
  };

  const step = () => {
    if (!points.length) return;
    const gw = new Array(w.length).fill(0);
    let gb = 0;
    for (const p of points) {
      const f = feats(p);
      const err = predict(p) - p.c; // derivative of cross-entropy w.r.t. z
      f.forEach((v, i) => (gw[i] += err * v));
      gb += err;
    }
    const n = points.length, r = lr();
    w = w.map((wi, i) => wi - (r * gw[i]) / n);
    b -= (r * gb) / n;
    epoch++;
    if (epoch % 2 === 0 || lossHistory.length < 2) lossHistory.push(metrics().loss);
    if (lossHistory.length > 300) lossHistory = lossHistory.filter((_, i) => i % 2 === 0);
  };

  // ---------- Drawing ----------
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const hexToRgb = (h) => {
    const m = h.replace("#", "");
    const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  const draw = () => {
    const size = canvas.clientWidth;
    const c0 = hexToRgb(css("--accent")), c1 = hexToRgb(css("--accent-2"));
    ctx.fillStyle = css("--bg");
    ctx.fillRect(0, 0, size, size);
    // probability heat map
    const cells = 50, cs = size / cells;
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const x = ((i + 0.5) / cells) * 2 - 1, y = 1 - ((j + 0.5) / cells) * 2;
        const s = predict({ x, y });
        const c = s > 0.5 ? c1 : c0;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(Math.abs(s - 0.5) * 0.55).toFixed(3)})`;
        ctx.fillRect(i * cs, j * cs, cs + 0.5, cs + 0.5);
      }
    }
    // axes
    ctx.strokeStyle = css("--border");
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke();
    // points
    for (const p of points) {
      const px = ((p.x + 1) / 2) * size, py = ((1 - p.y) / 2) * size;
      const c = p.c ? c1 : c0;
      const wrong = points.length && (predict(p) > 0.5 ? 1 : 0) !== p.c && epoch > 0;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fill();
      ctx.lineWidth = wrong ? 3 : 2;
      ctx.strokeStyle = wrong ? css("--bad") : css("--surface");
      ctx.stroke();
    }
  };

  const drawStats = () => {
    const m = metrics();
    epochEl.textContent = epoch;
    lossEl.textContent = m.loss == null ? "–" : m.loss.toFixed(3);
    accEl.textContent = m.acc == null ? "–" : Math.round(m.acc * 100) + "%";
    const names = featEl.checked ? ["x", "y", "x·y", "x²", "y²"] : ["x", "y"];
    weightsEl.innerHTML = `<span class="muted small">weights</span> ` +
      names.map((n, i) => `<span class="pill">w<sub>${n}</sub> ${w[i].toFixed(2)}</span>`).join("") +
      `<span class="pill">b ${b.toFixed(2)}</span>`;
    if (lossHistory.length > 1) {
      const max = Math.max(...lossHistory, 0.01);
      const pts = lossHistory.map((l, i) => `${(i / (lossHistory.length - 1)) * 300},${78 - (l / max) * 74}`).join(" ");
      chart.innerHTML = `<polyline points="${pts}" class="loss-line" />`;
    } else chart.innerHTML = "";
    return m;
  };

  const checkMissions = (m) => {
    if (m.acc == null) return;
    const n0 = points.filter((p) => p.c === 0).length, n1 = points.length - n0;
    if (!featEl.checked && m.acc === 1 && points.length >= 6 && n0 >= 2 && n1 >= 2 && datasetName !== "xor") missions.complete("fit");
    if (datasetName === "xor" && !modified && !featEl.checked && epoch >= 300 && m.acc < 1) {
      if (!missions.isDone("xor-fail")) note.innerHTML = "<strong>Stuck!</strong> No straight line can put both A corners on one side and both B corners on the other. The neuron is doing its best, and its best is a coin flip. Now switch on extra features.";
      missions.complete("xor-fail");
    }
    if (datasetName === "xor" && !modified && featEl.checked && m.acc === 1) {
      note.innerHTML = "<strong>Solved.</strong> With x·y as an input, XOR becomes easy: the sign of x·y alone separates the classes. Hidden layers in deep networks learn features like this automatically.";
      missions.complete("xor-fix");
    }
  };

  const tick = () => {
    for (let k = 0; k < 5; k++) step();
    draw();
    checkMissions(drawStats());
    if (training) raf = requestAnimationFrame(tick);
  };

  const setTraining = (v) => {
    training = v;
    trainBtn.textContent = v ? "■ Pause" : "▶ Train";
    cancelAnimationFrame(raf);
    if (v) raf = requestAnimationFrame(tick);
  };

  const loadPreset = () => {
    datasetName = preset.value;
    seed = 7;
    points = PRESETS[datasetName]();
    modified = false;
    initWeights();
    note.textContent = datasetName === "clear" ? "Click the canvas to add points. Put class A on one side and class B on the other, then train." : "";
    setTraining(false);
    draw(); drawStats();
  };

  // ---------- Events ----------
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = 1 - ((e.clientY - r.top) / r.height) * 2;
    points.push({ x, y, c: e.shiftKey ? 1 - cls : cls });
    modified = true;
    draw(); drawStats();
  });
  document.querySelectorAll("[data-class]").forEach((btn) =>
    btn.addEventListener("click", () => {
      cls = +btn.dataset.class;
      document.querySelectorAll("[data-class]").forEach((b2) => b2.classList.toggle("on", b2 === btn));
    }));
  preset.addEventListener("change", loadPreset);
  lrEl.addEventListener("input", () => {
    lrOut.textContent = lr().toFixed(lr() < 0.1 ? 3 : 2);
    if (lr() > 5) note.innerHTML = "<strong>Big steps!</strong> With a high learning rate, the weights jump around instead of settling. Watch the loss line.";
  });
  featEl.addEventListener("change", () => { initWeights(); draw(); drawStats(); });
  trainBtn.addEventListener("click", () => setTraining(!training));
  document.getElementById("step").addEventListener("click", () => { step(); draw(); checkMissions(drawStats()); });
  document.getElementById("reinit").addEventListener("click", () => { initWeights(); draw(); drawStats(); });
  document.getElementById("undo-pt").addEventListener("click", () => { points.pop(); modified = true; draw(); drawStats(); });
  window.addEventListener("resize", resize);
  document.addEventListener("tc-theme", draw);

  lrOut.textContent = lr().toFixed(2);
  loadPreset();
  resize();
})();
