// Password lab: rough entropy estimate, crack-time table and a passphrase generator.
(function () {
  const missions = tcMissions("password-lab", [
    { id: "common", text: "Test a common password with “clever” substitutions (like P@ssw0rd) and see how fast it falls." },
    { id: "strong", text: "Make a password with an estimated 70+ bits of entropy." },
    { id: "phrase", text: "Generate a passphrase with 60+ bits of entropy." },
  ]);

  const COMMON = ["password", "123456", "123456789", "12345678", "12345", "qwerty", "abc123", "password1", "111111", "iloveyou",
    "admin", "welcome", "monkey", "dragon", "letmein", "football", "baseball", "sunshine", "princess", "trustno1", "starwars",
    "superman", "master", "shadow", "654321", "000000", "qwerty123", "1q2w3e4r", "hello", "freedom", "whatever", "login",
    "michael", "charlie", "secret", "summer", "winter", "computer", "internet", "pokemon", "batman", "soccer", "hockey"];

  // ~280 short, common words → about 8.1 bits per randomly chosen word
  const WORDS = ("acid acorn actor adapt agent alarm album alien alley amber ample angle ankle apple april apron arena armor arrow " +
    "atlas attic audio aunt award bacon badge bagel baker banjo barn basil batch beach beard bench berry bike bingo birch " +
    "blade blank blaze blend blimp bloom board boat bolt bonus booth brain brave bread brick bride brook broom brush bunny " +
    "cabin cable cactus camel candy canoe cargo carol cedar chalk charm chess chief chili choir cider cinema clamp cliff " +
    "cloud clown coach cobra comet coral couch crane crate crisp crown cube curry daisy dance delta denim diary diner disco " +
    "dock dolphin donut dove dragon drum eagle easel echo elbow ember envoy fable falcon fern ferry fiber field flame flute " +
    "foam forest fox frost fudge gecko ghost giant ginger glass globe glove gnome goose grape gravy guitar habit hammer " +
    "harbor hazel heron hiker honey hornet hotel igloo index ivory jacket jelly jewel joker juice kayak kettle kiwi koala " +
    "ladder lagoon lamp laser lemon lilac lime lobster locket lunar magnet mango maple marble meadow melon meteor mint " +
    "mirror mocha moose mosaic motor mural nectar needle nest noodle novel oasis ocean olive omega onion opera orbit otter " +
    "owl paddle panda paper parrot pasta peach pebble pepper piano pickle pilot pixel planet plum polar pony poppy prism " +
    "puzzle quail quartz quill rabbit radar radio raven razor relay ribbon river robin rocket rose ruby saddle salsa " +
    "sapphire scarf scout shadow shark shell silver sketch sloth snack solar sonic spice spoon squid stamp storm sugar sunny " +
    "swan syrup table tango tiger toast topaz torch tower trail tulip tundra turtle umbrella unicorn valley velvet violin " +
    "volcano wagon walnut walrus water whale willow window wizard yacht yodel yogurt zebra zephyr zigzag").split(" ");

  const RATES = [
    ["🐢 Online login, rate-limited", "100 guesses/hour", 100 / 3600],
    ["🐌 Stolen DB, slow hash (bcrypt/Argon2)", "10 thousand/sec", 1e4],
    ["⚡ Stolen DB, fast hash (MD5) on a GPU rig", "100 billion/sec", 1e11],
  ];

  const LEET = { "@": "a", "4": "a", "0": "o", "1": "i", "!": "i", "3": "e", "$": "s", "5": "s", "7": "t", "+": "t" };
  const unleet = (s) => s.toLowerCase().replace(/[@4013!$57+]/g, (c) => LEET[c]);

  const charsetSize = (s) => {
    let n = 0;
    if (/[a-z]/.test(s)) n += 26;
    if (/[A-Z]/.test(s)) n += 26;
    if (/[0-9]/.test(s)) n += 10;
    if (/[^a-zA-Z0-9]/.test(s)) n += 33;
    return n;
  };

  // A deliberately simple estimator: recognises common passwords, dictionary words,
  // sequences and repeats, then counts the rest as random characters.
  const estimate = (pw) => {
    const findings = [];
    if (!pw) return { bits: 0, findings };
    const lower = pw.toLowerCase();
    const base = unleet(pw).replace(/[^a-z]+$/, "").replace(/^[^a-z]+/, "");
    const stripped = lower.replace(/[^a-z0-9]+$/, "").replace(/\d+$/, "");
    if (COMMON.includes(lower) || COMMON.includes(unleet(pw)) || COMMON.includes(base) || COMMON.includes(stripped)) {
      const subs = pw !== lower || /[@4013!$57+]/.test(pw);
      findings.push(["bad", `On every cracking list: it's (a variation of) one of the most common passwords${subs ? ". Swapping letters for symbols doesn't fool anyone" : ""}.`]);
      return { bits: 6 + (subs ? 4 : 0) + Math.min(4, pw.length - base.length), findings, common: true, subs };
    }
    let bits = 0;
    let rest = unleet(pw);
    const words = [...WORDS, ...COMMON, "love", "cat", "dog", "sun", "moon", "star", "blue", "red", "green", "king", "queen", "home", "life", "money", "baby", "angel", "happy"]
      .filter((x) => x.length >= 3)
      .sort((a, b) => b.length - a.length);
    const found = [];
    for (const word of words) {
      while (rest.includes(word)) { found.push(word); rest = rest.replace(word, " "); }
    }
    if (found.length) {
      // Words from this lab's own word list are worth ~8 bits (assume the attacker knows the list);
      // other dictionary words ~15 bits (one pick from a ~30,000-word dictionary).
      const listBits = Math.log2(WORDS.length);
      bits += found.reduce((s, x) => s + (WORDS.includes(x) ? listBits : 15), 0);
      findings.push(["warn", `Contains dictionary word${found.length > 1 ? "s" : ""} (${found.map(escapeHtml).join(", ")}). A word counts as one pick from a dictionary, not ${found[0].length} random letters.`]);
      if (found.length >= 4) findings.push(["good", "Several random words make a passphrase: the strength comes from how many there are."]);
    }
    const seqs = rest.match(/(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|wert|asdf|zxcv)\w*/g) || [];
    if (seqs.length) { bits += seqs.length * 6; rest = rest.replace(/(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|wert|asdf|zxcv)\w*/g, " "); findings.push(["warn", "Keyboard or number sequences are among the first patterns crackers try."]); }
    const reps = rest.match(/(.)\1{2,}/g) || [];
    if (reps.length) { bits += reps.length * 4; rest = rest.replace(/(.)\1{2,}/g, " "); findings.push(["warn", "Repeated characters add almost no strength."]); }
    const remaining = rest.replace(/ /g, "");
    const pool = charsetSize(pw);
    bits += remaining.length * Math.log2(Math.max(pool, 10));
    if (/^[A-Z]/.test(pw) && /[a-z]/.test(pw)) bits += 1;
    if (/\d{1,4}$/.test(pw) && found.length) findings.push(["warn", "Numbers tacked onto the end (like a year) are an extremely common pattern."]);
    if (pw.length >= 16) findings.push(["good", "Length is your friend: 16+ characters is a great start."]);
    if (!findings.length) findings.push(["good", "No obvious patterns found."]);
    return { bits: Math.max(0, bits), findings };
  };

  const human = (secs) => {
    if (secs < 1) return "instantly";
    const units = [["second", 60], ["minute", 60], ["hour", 24], ["day", 365], ["year", 1000], ["thousand years", 1000], ["million years", 1000], ["billion years", Infinity]];
    let v = secs;
    for (const [u, n] of units) {
      if (v < n) return `${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString("en-US")} ${u}${u.endsWith("s") || v < 2 ? "" : "s"}`;
      v /= n;
    }
    return "longer than the universe has existed";
  };

  const pw = document.getElementById("pw");
  const bar = document.getElementById("meter-bar");
  const bitsEl = document.getElementById("bits");
  const verdictEl = document.getElementById("verdict");
  const findingsEl = document.getElementById("findings");
  const table = document.getElementById("crack-table");

  const render = () => {
    const r = estimate(pw.value);
    const bits = r.bits;
    bitsEl.textContent = `${Math.round(bits)} bits`;
    const level = bits < 28 ? 0 : bits < 45 ? 1 : bits < 60 ? 2 : bits < 75 ? 3 : 4;
    const verdicts = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];
    verdictEl.textContent = pw.value ? verdicts[level] : "–";
    bar.style.width = Math.min(100, (bits / 90) * 100) + "%";
    bar.className = "lvl" + level;
    findingsEl.innerHTML = r.findings.map(([k, t]) => `<li class="${k}">${t}</li>`).join("");
    table.innerHTML = RATES.map(([label, rateTxt, rate]) => {
      const secs = pw.value ? Math.pow(2, Math.max(0, bits - 1)) / rate : 0;
      return `<div class="crack-row"><span>${label}<small>${rateTxt}</small></span><strong class="${secs < 86400 ? "danger" : secs > 3.15e9 ? "success" : ""}">${pw.value ? human(secs) : "–"}</strong></div>`;
    }).join("");
    if (r.common && r.subs) missions.complete("common");
    if (bits >= 70) missions.complete("strong");
  };
  pw.addEventListener("input", render);
  render();

  // ---------- Passphrase generator ----------
  const wordsEl = document.getElementById("words");
  const wordsOut = document.getElementById("words-out");
  const addNum = document.getElementById("add-num");
  const out = document.getElementById("passphrase");
  const ppBits = document.getElementById("pp-bits");
  let current = "";

  const randInt = (n) => {
    // Rejection sampling for an unbiased index
    const max = Math.floor(0xffffffff / n) * n;
    const buf = new Uint32Array(1);
    do crypto.getRandomValues(buf); while (buf[0] >= max);
    return buf[0] % n;
  };
  const generate = () => {
    const n = +wordsEl.value;
    const words = Array.from({ length: n }, () => WORDS[randInt(WORDS.length)]);
    if (addNum.checked) words.splice(randInt(n + 1), 0, String(randInt(100)).padStart(2, "0"));
    current = words.join("-");
    const bits = n * Math.log2(WORDS.length) + (addNum.checked ? Math.log2(100) + Math.log2(n + 1) : 0);
    out.innerHTML = words.map((w) => `<span>${w}</span>`).join('<i>-</i>');
    ppBits.textContent = `${bits.toFixed(1)} bits: ${n} words × ${Math.log2(WORDS.length).toFixed(1)} bits each${addNum.checked ? " + number" : ""}. (Real lists like the EFF's 7,776 words give 12.9 bits per word.)`;
    if (bits >= 60) missions.complete("phrase");
  };
  wordsEl.addEventListener("input", () => { wordsOut.textContent = wordsEl.value; generate(); });
  addNum.addEventListener("change", generate);
  document.getElementById("gen").addEventListener("click", generate);
  document.getElementById("try-it").addEventListener("click", () => { pw.value = current; render(); pw.scrollIntoView({ block: "center" }); });
  generate();
})();
