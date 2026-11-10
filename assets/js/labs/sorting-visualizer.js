// Sorting race: two algorithms on identical data, one comparison or write per tick.
(function () {
  const missions = tcMissions("sorting-visualizer", [
    { id: "race", text: "Race an O(n²) algorithm against an O(n log n) one with at least 50 items." },
    { id: "insertion-wins", text: "Find starting data where insertion sort beats merge sort." },
    { id: "quick-worst", text: "Push quick sort into its worst case: more than n²/4 comparisons." },
  ]);

  // Each algorithm is a generator yielding steps:
  //   ["cmp", i, j]   compare positions i and j
  //   ["swap", i, j]  swap positions i and j
  //   ["set", i, v]   write value v at position i (merge sort)
  const ALGOS = {
    bubble: {
      name: "Bubble sort", big: "O(n²)", quad: true,
      *run(a) {
        for (let end = a.length - 1; end > 0; end--) {
          let swapped = false;
          for (let i = 0; i < end; i++) {
            yield ["cmp", i, i + 1];
            if (a[i] > a[i + 1]) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; swapped = true; yield ["swap", i, i + 1]; }
          }
          if (!swapped) return;
        }
      },
    },
    selection: {
      name: "Selection sort", big: "O(n²)", quad: true,
      *run(a) {
        for (let i = 0; i < a.length - 1; i++) {
          let m = i;
          for (let j = i + 1; j < a.length; j++) { yield ["cmp", m, j]; if (a[j] < a[m]) m = j; }
          if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; yield ["swap", i, m]; }
        }
      },
    },
    insertion: {
      name: "Insertion sort", big: "O(n²)", quad: true,
      *run(a) {
        for (let i = 1; i < a.length; i++) {
          for (let j = i; j > 0; j--) {
            yield ["cmp", j - 1, j];
            if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; yield ["swap", j - 1, j]; }
            else break;
          }
        }
      },
    },
    merge: {
      name: "Merge sort", big: "O(n log n)", quad: false,
      *run(a) {
        function* sort(lo, hi) {
          if (hi - lo < 2) return;
          const mid = (lo + hi) >> 1;
          yield* sort(lo, mid);
          yield* sort(mid, hi);
          const left = a.slice(lo, mid), right = a.slice(mid, hi);
          let i = 0, j = 0, k = lo;
          while (i < left.length && j < right.length) {
            yield ["cmp", lo + i, mid + j];
            a[k] = left[i] <= right[j] ? left[i++] : right[j++];
            yield ["set", k, a[k]]; k++;
          }
          while (i < left.length) { a[k] = left[i++]; yield ["set", k, a[k]]; k++; }
          while (j < right.length) { a[k] = right[j++]; yield ["set", k, a[k]]; k++; }
        }
        yield* sort(0, a.length);
      },
    },
    quick: {
      name: "Quick sort", big: "O(n log n)*", quad: false,
      *run(a) {
        function* qs(lo, hi) {
          if (lo >= hi) return;
          const pivot = a[hi];
          let i = lo;
          for (let j = lo; j < hi; j++) {
            yield ["cmp", j, hi];
            if (a[j] < pivot) { if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; yield ["swap", i, j]; } i++; }
          }
          if (i !== hi) { [a[i], a[hi]] = [a[hi], a[i]]; yield ["swap", i, hi]; }
          yield* qs(lo, i - 1);
          yield* qs(i + 1, hi);
        }
        yield* qs(0, a.length - 1);
      },
    },
  };

  const nEl = document.getElementById("n");
  const nOut = document.getElementById("n-out");
  const pattern = document.getElementById("pattern");
  const speed = document.getElementById("speed");
  const speedOut = document.getElementById("speed-out");
  const result = document.getElementById("race-result");
  const raceBtn = document.getElementById("race");
  const SPEEDS = [1, 2, 4, 8, 16, 32, 64];

  const lanes = ["lane-a", "lane-b"].map((id, idx) => {
    const el = document.getElementById(id);
    const select = el.querySelector(".algo");
    select.innerHTML = Object.entries(ALGOS).map(([k, a]) => `<option value="${k}">${a.name} · ${a.big}</option>`).join("");
    select.value = idx === 0 ? "bubble" : "merge";
    select.setAttribute("aria-label", `Algorithm for lane ${idx + 1}`);
    return { el, select, bars: el.querySelector(".bars"), stats: el.querySelector(".lane-stats") };
  });

  let base = [], running = false, raf = 0;

  const makeData = () => {
    const n = +nEl.value;
    const a = Array.from({ length: n }, (_, i) => i + 1);
    const p = pattern.value;
    if (p === "random" || p === "nearly") {
      if (p === "random") for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      else for (let s = 0; s < Math.max(1, Math.round(n / 20)); s++) { const i = Math.floor(Math.random() * (n - 1)); [a[i], a[i + 1]] = [a[i + 1], a[i]]; }
    } else if (p === "reversed") a.reverse();
    base = a;
  };

  const drawLane = (lane, arr, hi = [], cls = "") => {
    const n = arr.length;
    if (lane.bars.children.length !== n) lane.bars.innerHTML = Array.from({ length: n }, () => "<span></span>").join("");
    [...lane.bars.children].forEach((b, i) => {
      b.style.height = (arr[i] / n) * 100 + "%";
      b.className = hi.includes(i) ? cls : "";
    });
  };
  const drawStats = (lane, s, done) =>
    (lane.stats.innerHTML = `${s.cmp.toLocaleString("en-US")} comparisons · ${s.writes.toLocaleString("en-US")} writes${done ? ` · <b>done in ${s.ticks.toLocaleString("en-US")} ticks</b>` : ""}`);

  const reset = () => {
    cancelAnimationFrame(raf);
    running = false;
    raceBtn.textContent = "▶ Race!";
    lanes.forEach((l) => { drawLane(l, base); drawStats(l, { cmp: 0, writes: 0, ticks: 0 }, false); l.el.classList.remove("winner"); });
    result.innerHTML = "";
  };

  const race = () => {
    if (running) { reset(); return; }
    running = true;
    raceBtn.textContent = "■ Stop";
    result.innerHTML = "";
    const n = base.length;
    const runs = lanes.map((l) => {
      const arr = base.slice();
      const key = l.select.value;
      return { lane: l, key, arr, gen: ALGOS[key].run(arr), s: { cmp: 0, writes: 0, ticks: 0 }, done: false };
    });
    const frame = () => {
      const steps = SPEEDS[+speed.value - 1];
      for (const r of runs) {
        if (r.done) continue;
        let last = null;
        for (let k = 0; k < steps; k++) {
          const { value, done } = r.gen.next();
          if (done) { r.done = true; break; }
          r.s.ticks++;
          if (value[0] === "cmp") r.s.cmp++; else r.s.writes++;
          last = value;
        }
        drawLane(r.lane, r.arr, last ? (last[0] === "set" ? [last[1]] : [last[1], last[2]]) : [], last ? last[0] : "");
        drawStats(r.lane, r.s, r.done);
        if (r.done) drawLane(r.lane, r.arr, r.arr.map((_, i) => i), "sorted");
      }
      if (runs.every((r) => r.done)) return finish(runs, n);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };

  const finish = (runs, n) => {
    running = false;
    raceBtn.textContent = "▶ Race again";
    const [a, b] = runs;
    const winner = a.s.ticks === b.s.ticks ? null : a.s.ticks < b.s.ticks ? a : b;
    if (winner) winner.lane.el.classList.add("winner");
    const name = (r) => ALGOS[r.key].name;
    const ratio = winner ? (Math.max(a.s.ticks, b.s.ticks) / Math.max(1, Math.min(a.s.ticks, b.s.ticks))).toFixed(1) : "1.0";
    result.innerHTML = `<div class="result-banner good">${winner
      ? `<strong>🏁 ${name(winner)} wins</strong>, ${ratio}× fewer steps on ${n} items.`
      : "<strong>🏁 Dead heat!</strong>"}
      For reference, n² = ${(n * n).toLocaleString("en-US")} and n·log₂n ≈ ${Math.round(n * Math.log2(n)).toLocaleString("en-US")}.</div>`;

    const algos = runs.map((r) => ALGOS[r.key]);
    if (n >= 50 && algos.some((x) => x.quad) && algos.some((x) => !x.quad)) missions.complete("race");
    const ins = runs.find((r) => r.key === "insertion"), mer = runs.find((r) => r.key === "merge");
    if (ins && mer && ins.s.ticks < mer.s.ticks) {
      missions.complete("insertion-wins");
      result.insertAdjacentHTML("beforeend", `<p class="note"><strong>Why?</strong> Insertion sort only moves items that are out of place. On nearly-sorted data that's almost nothing, close to O(n), while merge sort always does its full O(n log n) work.</p>`);
    }
    const q = runs.find((r) => r.key === "quick");
    if (q && q.s.cmp > (n * n) / 4) {
      missions.complete("quick-worst");
      result.insertAdjacentHTML("beforeend", `<p class="note"><strong>Worst case triggered:</strong> ${q.s.cmp.toLocaleString("en-US")} comparisons. With the last element as pivot, sorted input splits into 0 and n−1 items every time, so quick sort turns quadratic.</p>`);
    }
  };

  nEl.addEventListener("input", () => { nOut.textContent = nEl.value; makeData(); reset(); });
  pattern.addEventListener("change", () => { makeData(); reset(); });
  speed.addEventListener("input", () => { speedOut.textContent = "×" + SPEEDS[+speed.value - 1]; });
  lanes.forEach((l) => l.select.addEventListener("change", reset));
  document.getElementById("shuffle").addEventListener("click", () => { makeData(); reset(); });
  raceBtn.addEventListener("click", race);

  speedOut.textContent = "×" + SPEEDS[+speed.value - 1];
  makeData();
  reset();
})();
