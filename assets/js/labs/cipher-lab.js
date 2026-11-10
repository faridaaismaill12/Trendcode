// Crack the Cipher lab: Caesar cipher, brute force, frequency analysis.
(function () {
  const missions = tcMissions("cipher-lab", [
    { id: "encrypt", text: "Encrypt your own message with a shift other than 0." },
    { id: "brute", text: "Brute-force a ciphertext by trying all 25 keys." },
    { id: "crack", text: "Crack the intercepted message yourself by lining up the letter frequencies." },
    { id: "auto", text: "See how statistics (a chi-squared test) cracks it automatically." },
  ]);

  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // Typical English letter frequencies (%)
  const ENG = [8.2, 1.5, 2.8, 4.3, 12.7, 2.2, 2.0, 6.1, 7.0, 0.15, 0.77, 4.0, 2.4, 6.7, 7.5, 1.9, 0.095, 6.0, 6.3, 9.1, 2.8, 0.98, 2.4, 0.15, 2.0, 0.074];
  const MESSAGES = [
    "Frequency analysis was first described by the Arab scholar Al-Kindi in the ninth century, and it broke simple substitution ciphers for hundreds of years after that.",
    "A good cipher hides the patterns of the language underneath it, while a weak cipher leaves the most common letters standing out like footprints in fresh snow.",
    "Every organization should start planning its move to post-quantum cryptography today, because replacing the encryption inside large systems takes many years.",
    "The strength of a modern cipher does not come from keeping the method secret. It comes from a key so large that trying every possibility would take longer than the age of the universe.",
  ];

  const shift = (text, k) =>
    text.replace(/[a-z]/gi, (c) => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + k + 26) % 26) + base);
    });
  const counts = (text) => {
    const c = new Array(26).fill(0);
    for (const ch of text.toUpperCase()) { const i = A.indexOf(ch); if (i >= 0) c[i]++; }
    return c;
  };

  // ---------- 1. Encrypt ----------
  const plain = document.getElementById("plain");
  const shiftEl = document.getElementById("shift");
  const shiftOut = document.getElementById("shift-out");
  const cipherOut = document.getElementById("cipher-out");
  const alphabet = document.getElementById("alphabet");
  let touched = false;

  const renderEncrypt = () => {
    const k = +shiftEl.value;
    shiftOut.textContent = k;
    cipherOut.textContent = shift(plain.value, k) || " ";
    alphabet.innerHTML =
      `<div class="alpha-row">${[...A].map((c) => `<span>${c}</span>`).join("")}</div>` +
      `<div class="alpha-row cipher">${[...A].map((_, i) => `<span>${A[(i + k) % 26]}</span>`).join("")}</div>`;
    if (touched && k !== 0 && plain.value.trim()) missions.complete("encrypt");
  };
  plain.addEventListener("input", () => { touched = true; renderEncrypt(); });
  shiftEl.addEventListener("input", () => { touched = true; renderEncrypt(); });
  renderEncrypt();

  // ---------- 2. Brute force ----------
  const bruteIn = document.getElementById("brute-in");
  const bruteList = document.getElementById("brute-list");
  document.getElementById("brute-copy").addEventListener("click", () => { bruteIn.value = cipherOut.textContent; });
  document.getElementById("brute-go").addEventListener("click", () => {
    const text = bruteIn.value;
    if (!/[a-z]/i.test(text)) { bruteList.innerHTML = "<li>Type some ciphertext first.</li>"; return; }
    bruteList.innerHTML = Array.from({ length: 25 }, (_, i) => i + 1)
      .map((k) => `<li><span class="k">key ${String(k).padStart(2, " ")}</span>${escapeHtml(shift(text, -k))}</li>`)
      .join("");
    missions.complete("brute");
  });

  // ---------- 3. Frequency analysis ----------
  const secretEl = document.getElementById("secret");
  const guess = document.getElementById("guess");
  const guessOut = document.getElementById("guess-out");
  const freq = document.getElementById("freq");
  const attempt = document.getElementById("attempt");
  const result = document.getElementById("crack-result");
  let secretKey = 0, cipherText = "", msgIndex = -1, solvedByHand = false;

  const newMessage = () => {
    msgIndex = (msgIndex + 1 + Math.floor(Math.random() * (MESSAGES.length - 1))) % MESSAGES.length;
    secretKey = 3 + Math.floor(Math.random() * 21); // 3..23
    cipherText = shift(MESSAGES[msgIndex], secretKey).toUpperCase();
    secretEl.textContent = cipherText;
    guess.value = 0;
    solvedByHand = false;
    result.innerHTML = "";
    renderCrack();
  };

  const renderCrack = () => {
    const g = +guess.value;
    guessOut.textContent = g;
    const c = counts(cipherText);
    const total = c.reduce((a, b) => a + b, 0) || 1;
    const max = 16;
    freq.innerHTML = [...A].map((letter, i) => {
      const obs = (c[i] / total) * 100;
      const exp = ENG[(i - g + 26) % 26];
      return `<div class="freq-col">
        <div class="freq-track">
          <div class="freq-bar" style="height:${Math.min(100, (obs / max) * 100)}%"></div>
          <div class="freq-mark" style="bottom:${Math.min(100, (exp / max) * 100)}%"></div>
        </div>
        <span>${letter}</span>
      </div>`;
    }).join("");
    attempt.textContent = shift(cipherText, -g);
    if (g === secretKey && !solvedByHand) {
      solvedByHand = true;
      result.innerHTML = `<div class="result-banner good"><strong class="success">Cracked!</strong> The key was ${secretKey}. Notice how the tallest cyan bar now sits on <b>E</b>, and the peaks line up with the markers.</div>`;
      missions.complete("crack");
    }
  };
  guess.addEventListener("input", renderCrack);
  document.getElementById("new-msg").addEventListener("click", newMessage);

  document.getElementById("auto").addEventListener("click", () => {
    const c = counts(cipherText);
    const total = c.reduce((a, b) => a + b, 0);
    // Chi-squared score for each candidate key: lower = closer to English
    const scores = Array.from({ length: 26 }, (_, k) => {
      let chi = 0;
      for (let i = 0; i < 26; i++) {
        const expected = (ENG[i] / 100) * total;
        const observed = c[(i + k) % 26];
        chi += ((observed - expected) ** 2) / expected;
      }
      return { k, chi };
    }).sort((a, b) => a.chi - b.chi);
    const best = scores[0];
    guess.value = best.k;
    solvedByHand = true; // don't award the manual mission for the automatic answer
    renderCrack();
    result.innerHTML = `<div class="result-banner good">
      <strong>The statistics say the key is ${best.k}.</strong> For each of the 26 possible keys, the computer measured how far the decrypted letter counts are from normal English (a <em>chi-squared</em> score, lower is better):
      <div class="stat-row">${scores.slice(0, 4).map((s, i) =>
        `<div class="mini-stat"><small>${i === 0 ? "best · " : ""}key ${s.k}</small><strong>${s.chi.toFixed(0)}</strong></div>`).join("")}</div>
      The right key wins by a mile. That's why letter-for-letter ciphers are dead.</div>`;
    missions.complete("auto");
  });

  newMessage();
})();
