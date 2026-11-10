// Hash lab: SHA-256 avalanche visualiser + proof-of-work miner.
(function () {
  const missions = tcMissions("hash-lab", [
    { id: "one-char", text: "Make the inputs differ by exactly one character and count the flipped bits." },
    { id: "same", text: "Make both inputs identical and confirm the hashes match (hashes are deterministic)." },
    { id: "mine3", text: "Mine a block at difficulty 3 or higher." },
  ]);

  const enc = new TextEncoder();
  const subtle = window.crypto && window.crypto.subtle;
  const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const sha256 = async (text) => toHex(await subtle.digest("SHA-256", enc.encode(text)));

  if (!subtle) {
    document.querySelector(".lab-section").insertAdjacentHTML("afterbegin",
      `<div class="result-banner bad">Your browser blocked the Web Crypto API on this page. Open the site over https (for example the live GitHub Pages site) to use this lab.</div>`);
    return;
  }

  // One-edit check: same length with one changed char, or one inserted/deleted char.
  const oneEdit = (a, b) => {
    if (a === b) return false;
    if (Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) return [...a].filter((c, i) => c !== b[i]).length === 1;
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    for (let i = 0; i < l.length; i++) if (l.slice(0, i) + l.slice(i + 1) === s) return true;
    return false;
  };

  // ---------- Avalanche ----------
  const inA = document.getElementById("in-a");
  const inB = document.getElementById("in-b");
  const hashA = document.getElementById("hash-a");
  const hashB = document.getElementById("hash-b");
  const bits = document.getElementById("bits");
  const diffCount = document.getElementById("diff-count");
  const diffNote = document.getElementById("diff-note");
  bits.innerHTML = Array.from({ length: 256 }, () => "<i></i>").join("");
  const cells = [...bits.children];
  let interacted = false;

  const toBits = (hex) => [...hex].flatMap((h) => parseInt(h, 16).toString(2).padStart(4, "0").split("").map(Number));

  const updateAvalanche = async () => {
    const [a, b] = [inA.value, inB.value];
    const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
    if (a !== inA.value || b !== inB.value) return; // stale result
    hashA.textContent = ha;
    hashB.innerHTML = [...hb].map((c, i) => (c === ha[i] ? c : `<mark>${c}</mark>`)).join("");
    const ba = toBits(ha), bb = toBits(hb);
    let n = 0;
    cells.forEach((cell, i) => {
      const d = ba[i] !== bb[i];
      if (d) n++;
      cell.className = d ? "diff" : ba[i] ? "one" : "";
    });
    diffCount.textContent = n;
    if (a === b) {
      diffNote.innerHTML = "<strong>Identical inputs, identical hashes.</strong> A hash is deterministic, which is what makes it useful as a fingerprint.";
      if (interacted) missions.complete("same");
    } else if (oneEdit(a, b)) {
      diffNote.innerHTML = `<strong>One character changed → ${((n / 256) * 100).toFixed(0)}% of bits flipped.</strong> A perfect avalanche averages 50%.`;
      if (interacted) missions.complete("one-char");
    } else {
      diffNote.textContent = "Random-looking inputs give about 128 different bits, and so do nearly identical ones. That's the point.";
    }
  };
  [inA, inB].forEach((el) => el.addEventListener("input", () => { interacted = true; updateAvalanche(); }));
  updateAvalanche();

  // ---------- Mining ----------
  const block = document.getElementById("block");
  const difficulty = document.getElementById("difficulty");
  const diffOut = document.getElementById("diff-out");
  const expect = document.getElementById("expect");
  const mineBtn = document.getElementById("mine");
  const nonceEl = document.getElementById("nonce");
  const rateEl = document.getElementById("rate");
  const elapsedEl = document.getElementById("elapsed");
  const mineHash = document.getElementById("mine-hash");
  const mineResult = document.getElementById("mine-result");
  let mining = false;

  const showExpect = () => {
    const d = +difficulty.value;
    diffOut.textContent = d;
    expect.textContent = `≈ ${(16 ** d).toLocaleString("en-US")} tries on average`;
  };
  difficulty.addEventListener("input", showExpect);
  showExpect();

  mineBtn.addEventListener("click", async () => {
    if (mining) { mining = false; return; }
    mining = true;
    mineBtn.textContent = "■ Stop";
    mineResult.innerHTML = "";
    const d = +difficulty.value;
    const target = "0".repeat(d);
    const data = block.value;
    const start = performance.now();
    let nonce = 0, found = null, lastPaint = 0;
    while (mining) {
      // Hash a batch in parallel, then yield to keep the page responsive
      const batch = await Promise.all(Array.from({ length: 256 }, (_, i) => sha256(`${data}${nonce + i}`)));
      const hit = batch.findIndex((h) => h.startsWith(target));
      if (hit >= 0) { found = { nonce: nonce + hit, hash: batch[hit] }; nonce += hit + 1; break; }
      nonce += batch.length;
      const now = performance.now();
      if (now - lastPaint > 80) {
        lastPaint = now;
        nonceEl.textContent = nonce.toLocaleString("en-US");
        rateEl.textContent = Math.round(nonce / ((now - start) / 1000)).toLocaleString("en-US");
        elapsedEl.textContent = ((now - start) / 1000).toFixed(1) + "s";
        mineHash.textContent = batch[batch.length - 1];
      }
    }
    const secs = (performance.now() - start) / 1000;
    mining = false;
    mineBtn.textContent = "⛏ Start mining";
    if (!found) { mineResult.innerHTML = `<p class="note">Stopped after ${nonce.toLocaleString("en-US")} tries.</p>`; return; }
    nonceEl.textContent = found.nonce.toLocaleString("en-US");
    elapsedEl.textContent = secs.toFixed(1) + "s";
    rateEl.textContent = Math.round(nonce / Math.max(secs, 0.001)).toLocaleString("en-US");
    mineHash.innerHTML = `<mark>${found.hash.slice(0, d)}</mark>${found.hash.slice(d)}`;
    mineResult.innerHTML = `<div class="result-banner good"><strong class="success">Block mined!</strong>
      SHA-256("${escapeHtml(data)}${found.nonce}") starts with ${d} zero${d > 1 ? "s" : ""}.
      It took ${nonce.toLocaleString("en-US")} tries to find, and one hash for anyone to verify.</div>`;
    if (d >= 3) missions.complete("mine3");
  });
})();
