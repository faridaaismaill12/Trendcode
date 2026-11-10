// =============================================================
// Trendcode — site script (shared by the homepage and post pages)
// =============================================================

// Add new posts here — newest first. They appear on the homepage,
// in the search, in topic filters and as "related posts" automatically.
// `topic` must be one of the keys in TOPICS below.
const posts = [
  {
    slug: "prompt-injection-explained",
    title: "Prompt injection, explained: when an AI can't tell data from orders",
    excerpt: "Why language models can be talked into ignoring their instructions, and the defenses that actually help.",
    date: "2026-11-10",
    topic: "ai",
    readTime: 7,
  },
  {
    slug: "qubits-without-the-mysticism",
    title: "Qubits without the mysticism: what a quantum computer actually does",
    excerpt: "Superposition, entanglement and interference in plain words, plus how to read quantum headlines.",
    date: "2026-11-10",
    topic: "quantum",
    readTime: 7,
  },
  {
    slug: "webassembly-beyond-the-browser",
    title: "WebAssembly is leaving the browser. Here's why that matters.",
    excerpt: "A small, fast, sandboxed unit of code is turning up in servers, edge networks and plugin systems.",
    date: "2026-11-10",
    topic: "emerging",
    readTime: 6,
  },
  {
    slug: "what-is-post-quantum-cryptography",
    title: "What is Post-Quantum Cryptography (and why should you care)?",
    excerpt: "The quantum threat to today's encryption, harvest-now-decrypt-later, and the new NIST standards.",
    date: "2026-11-09",
    topic: "pqc",
    readTime: 6,
  },
];

const TOPICS = {
  pqc: "Post-Quantum",
  ai: "AI Security",
  quantum: "Quantum",
  emerging: "Emerging Tech",
};

const BASE = document.body.dataset.base || "";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// localStorage can be blocked (private mode etc.), so never let it throw.
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const formatDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const postUrl = (p) => `${BASE}posts/${p.slug}.html`;

// ---------- Theme toggle ----------
(function theme() {
  const btn = $("#theme-toggle");
  if (!btn) return;
  const root = document.documentElement;
  const current = () =>
    root.dataset.theme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const paint = () => {
    const t = current();
    btn.textContent = t === "light" ? "☾" : "☀";
    btn.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
  };
  if (!root.dataset.theme) root.dataset.theme = current();
  paint();
  btn.addEventListener("click", () => {
    root.dataset.theme = current() === "light" ? "dark" : "light";
    try { localStorage.setItem("tc-theme", root.dataset.theme); } catch { /* ignore */ }
    paint();
  });
})();

// ---------- Footer year ----------
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

// ---------- Back-to-top button ----------
const toTop = $("#to-top");
if (toTop) {
  window.addEventListener("scroll", () => toTop.classList.toggle("show", window.scrollY > 600), { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));
}

// ---------- Scroll reveal ----------
(function reveal() {
  const items = $$(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
})();

// =============================================================
// HOMEPAGE
// =============================================================

// ---------- Rotating headline ----------
(function rotator() {
  const el = $("#rotator");
  if (!el || reduceMotion) return;
  const words = ["post-quantum crypto", "AI security", "quantum computing", "WebAssembly", "tomorrow's tech"];
  let w = 0, i = words[0].length, deleting = true;
  const tick = () => {
    const word = words[w];
    i += deleting ? -1 : 1;
    el.textContent = word.slice(0, i);
    let delay = deleting ? 40 : 75;
    if (!deleting && i === word.length) { deleting = true; delay = 2200; }
    else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2200);
})();

// ---------- Animated terminal ----------
(function terminal() {
  const el = $("#terminal-body");
  if (!el) return;
  const lines = [
    ["cmd", "$ trendcode scan --crypto ./my-app"],
    ["", "  found RSA-2048   (TLS key exchange)"],
    ["", "  found ECDSA P-256 (code signing)"],
    ["warn", "  ⚠ 2 algorithms vulnerable to Shor's algorithm"],
    ["cmd", "$ trendcode suggest"],
    ["ok", "  → key exchange: ML-KEM-768  (FIPS 203)"],
    ["ok", "  → signatures:   ML-DSA-65   (FIPS 204)"],
    ["", "  tip: run hybrid mode during migration"],
    ["cmd", "$ trendcode explain --plain-english"],
    ["ok", "  ✓ 4 explainers ready. Scroll down ↓"],
  ];
  const render = (n, partial = "") =>
    lines.slice(0, n).map(([cls, txt]) => `<span class="t-${cls}">${escapeHtml(txt)}</span>`).join("\n") +
    (partial ? (n ? "\n" : "") + `<span class="t-cmd">${escapeHtml(partial)}</span>` : "");

  if (reduceMotion) { el.innerHTML = render(lines.length); return; }

  let line = 0;
  const next = () => {
    if (line >= lines.length) { setTimeout(() => { line = 0; el.innerHTML = ""; next(); }, 6000); return; }
    const [cls, txt] = lines[line];
    if (cls === "cmd") {
      let c = 0;
      const type = () => {
        c++;
        el.innerHTML = render(line, txt.slice(0, c));
        if (c < txt.length) setTimeout(type, 35);
        else { line++; setTimeout(next, 400); }
      };
      type();
    } else {
      line++;
      el.innerHTML = render(line);
      setTimeout(next, 260);
    }
  };
  next();
})();

// ---------- Count-up stats ----------
(function stats() {
  const nums = $$("[data-count]");
  if (!nums.length) return;
  // Keep the first two stats in sync with the data.
  const avg = Math.round(posts.reduce((s, p) => s + p.readTime, 0) / posts.length);
  const values = [posts.length, Object.keys(TOPICS).length, avg];
  nums.forEach((el, i) => { if (values[i] !== undefined) el.dataset.count = values[i]; });
  const run = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / 900);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  nums.forEach(run);
})();

// ---------- Post list with search + topic filter ----------
(function postList() {
  const list = $("#post-list");
  if (!list) return;
  const search = $("#post-search");
  const chips = $("#topic-chips");
  const empty = $("#post-empty");
  const read = store.get("tc-read", []);

  const params = new URLSearchParams(location.search);
  let topic = TOPICS[params.get("topic")] ? params.get("topic") : "all";
  let query = "";

  // Post counts on the topic cards
  $$("[data-count-topic]").forEach((el) => {
    const n = posts.filter((p) => p.topic === el.dataset.countTopic).length;
    el.textContent = n ? `${n} post${n > 1 ? "s" : ""} →` : "coming soon";
  });

  chips.innerHTML = [["all", "All"], ...Object.entries(TOPICS)]
    .map(([k, label]) => `<button type="button" class="chip" data-topic="${k}">${label}</button>`)
    .join("");

  const render = () => {
    const q = query.trim().toLowerCase();
    const shown = posts.filter(
      (p) =>
        (topic === "all" || p.topic === topic) &&
        (!q || `${p.title} ${p.excerpt} ${TOPICS[p.topic]}`.toLowerCase().includes(q))
    );
    list.innerHTML = shown
      .map(
        (p) => `
        <li>
          <a href="${postUrl(p)}">
            <span class="post-meta"><span class="badge">${TOPICS[p.topic]}</span> · ${formatDate(p.date)} · ${p.readTime} min${
              read.includes(p.slug) ? ' · <span class="read-mark">✓ read</span>' : ""
            }</span>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.excerpt)}</p>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        </li>`
      )
      .join("");
    empty.hidden = shown.length > 0;
    $$(".chip", chips).forEach((c) => c.classList.toggle("active", c.dataset.topic === topic));
    $$(".topic-card").forEach((c) => c.classList.toggle("active", c.dataset.topic === topic));
  };

  const setTopic = (t) => {
    topic = t;
    const url = new URL(location.href);
    if (t === "all") url.searchParams.delete("topic"); else url.searchParams.set("topic", t);
    history.replaceState(null, "", url);
    render();
  };

  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) setTopic(b.dataset.topic);
  });
  $$(".topic-card").forEach((card) =>
    card.addEventListener("click", () => {
      setTopic(topic === card.dataset.topic ? "all" : card.dataset.topic);
      $("#latest").scrollIntoView();
    })
  );
  search.addEventListener("input", () => { query = search.value; render(); });

  // Press "/" anywhere to jump to search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      search.focus();
    }
  });

  render();
})();

// ---------- Interactive timeline ----------
(function timeline() {
  const box = $("#timeline-list");
  if (!box) return;
  const events = [
    ["1994", "Shor's algorithm", "Peter Shor shows that a large quantum computer could factor numbers and compute discrete logarithms efficiently, which is the maths behind RSA and elliptic-curve cryptography. The threat is born decades before the hardware."],
    ["2016", "NIST opens the call", "The US National Institute of Standards and Technology launches a public competition for quantum-resistant algorithms. Cryptographers worldwide submit 69 first-round candidates and spend years attacking each other's designs."],
    ["2022", "Winners announced", "NIST selects CRYSTALS-Kyber for key exchange and CRYSTALS-Dilithium, Falcon and SPHINCS+ for signatures. The same year, one promising candidate (SIKE) is broken on an ordinary laptop, a reminder of why public scrutiny matters."],
    ["2024", "First standards final", "FIPS 203 (ML-KEM), FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) are published. Browsers and messaging apps begin shipping hybrid post-quantum key exchange to everyday users."],
    ["2025", "A backup is picked", "NIST selects HQC, a code-based key-exchange scheme, as a second option built on different maths from ML-KEM, so the world isn't relying on a single family of problems."],
    ["2030–35", "Phase-out targets", "Under NIST's proposed transition plan, quantum-vulnerable algorithms like RSA and ECC are deprecated around 2030 and disallowed by 2035. Large migrations take years, which is why organizations are starting now."],
  ];
  box.innerHTML = events
    .map(([y, t], i) =>
      `<button type="button" class="tl-item" data-i="${i}" aria-expanded="false"><span class="tl-year">${y}</span><span class="tl-title">${t}</span></button>`)
    .join("");
  const detail = document.createElement("div");
  detail.className = "tl-detail";
  detail.setAttribute("aria-live", "polite");
  box.after(detail);
  const select = (i) => {
    $$(".tl-item", box).forEach((b, j) => {
      b.classList.toggle("active", i === j);
      b.setAttribute("aria-expanded", String(i === j));
    });
    detail.innerHTML = `<strong>${events[i][0]} · ${events[i][1]}</strong><br />${events[i][2]}`;
  };
  box.addEventListener("click", (e) => {
    const b = e.target.closest(".tl-item");
    if (b) select(+b.dataset.i);
  });
  select(0);
})();

// ---------- Quiz ----------
(function quiz() {
  const box = $("#quiz-box");
  if (!box) return;
  const questions = [
    {
      q: "What does \"harvest now, decrypt later\" describe?",
      options: [
        "Mining cryptocurrency during off-peak hours",
        "Stealing encrypted data today to unlock it once quantum computers can",
        "Backing up keys before rotating them",
        "Training AI models on scraped data",
      ],
      a: 1,
      why: "Attackers can store encrypted traffic now and wait. Data that must stay secret for years is already at risk.",
      post: "what-is-post-quantum-cryptography",
    },
    {
      q: "Which NIST standard is used for exchanging keys?",
      options: ["ML-DSA (FIPS 204)", "SLH-DSA (FIPS 205)", "ML-KEM (FIPS 203)", "SHA-3 (FIPS 202)"],
      a: 2,
      why: "ML-KEM is the key-encapsulation mechanism. ML-DSA and SLH-DSA are for digital signatures.",
      post: "what-is-post-quantum-cryptography",
    },
    {
      q: "Why is indirect prompt injection especially dangerous?",
      options: [
        "It only works on very old models",
        "It requires physical access to the server",
        "The attacker hides instructions in content the AI reads later, so the user did nothing wrong",
        "It makes models respond more slowly",
      ],
      a: 2,
      why: "The malicious text lives in a web page, email or document. The victim is the innocent user whose assistant reads it.",
      post: "prompt-injection-explained",
    },
    {
      q: "What is the real source of a quantum computer's speed-up?",
      options: [
        "It literally tries every answer and reports them all",
        "Interference that cancels wrong answers and reinforces right ones",
        "Faster clock speeds than classical chips",
        "Storing more data per transistor",
      ],
      a: 1,
      why: "Measuring gives you just one result, so algorithms are choreographed so wrong answers' amplitudes cancel out.",
      post: "qubits-without-the-mysticism",
    },
    {
      q: "What can a WebAssembly module access by default?",
      options: [
        "Only its own memory, nothing else unless the host grants it",
        "The full file system",
        "The network, but not files",
        "Everything the browser can access",
      ],
      a: 0,
      why: "Wasm is deny-by-default: files, clocks and sockets must be explicitly handed over, for example through WASI.",
      post: "webassembly-beyond-the-browser",
    },
  ];
  let idx = 0, score = 0;
  const best = () => store.get("tc-quiz-best", 0);

  const show = () => {
    if (idx >= questions.length) return finish();
    const item = questions[idx];
    box.innerHTML = `
      <p class="quiz-progress">Question ${idx + 1} of ${questions.length} · score ${score}</p>
      <div class="quiz-bar"><span style="width:${(idx / questions.length) * 100}%"></span></div>
      <h3>${escapeHtml(item.q)}</h3>
      <div class="quiz-options">
        ${item.options.map((o, i) => `<button type="button" class="quiz-option" data-i="${i}">${escapeHtml(o)}</button>`).join("")}
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
    const prev = best();
    if (score > prev) store.set("tc-quiz-best", score);
    const verdict =
      score === questions.length ? "Fully decoded. You could write these posts." :
      score >= 3 ? "Nicely done. A couple of explainers will fill the gaps." :
      "Great place to start. The posts above cover every answer.";
    box.innerHTML = `
      <p class="quiz-progress">Finished</p>
      <p class="quiz-score">${score}/${questions.length}</p>
      <h3>${verdict}</h3>
      <p class="muted">Your best: ${Math.max(score, prev)}/${questions.length}</p>
      <div class="quiz-actions">
        <button type="button" class="btn" data-restart>Try again</button>
        <a class="btn btn-ghost" href="#latest">Read the posts</a>
      </div>`;
  };

  box.addEventListener("click", (e) => {
    const opt = e.target.closest(".quiz-option");
    if (opt && !opt.disabled) return answer(+opt.dataset.i);
    if (e.target.closest("[data-next]")) { idx++; show(); }
    if (e.target.closest("[data-restart]")) { idx = 0; score = 0; show(); }
  });
  show();
})();

// ---------- Glossary ----------
(function glossary() {
  const box = $("#glossary-list");
  if (!box) return;
  const search = $("#glossary-search");
  const terms = [
    ["Agent", "ai", "An AI system that can take actions, like browsing, running code or sending email, rather than only producing text."],
    ["Component Model", "emerging", "A WebAssembly standard that lets modules written in different languages describe their interfaces and plug into each other."],
    ["Crypto-agility", "pqc", "Designing systems so cryptographic algorithms can be swapped without rebuilding everything. Essential for the post-quantum migration."],
    ["Decoherence", "quantum", "When a qubit's fragile quantum state is disturbed by its environment, introducing errors into the computation."],
    ["Entanglement", "quantum", "A link between qubits that makes their measurement outcomes correlated in ways independent bits can't reproduce."],
    ["Grover's algorithm", "quantum", "A quantum search algorithm with a quadratic speed-up. It weakens symmetric keys somewhat, which is why AES-256 is recommended."],
    ["Harvest now, decrypt later", "pqc", "Collecting encrypted data today in order to decrypt it once a capable quantum computer exists."],
    ["Hybrid mode", "pqc", "Combining a classical algorithm with a post-quantum one, so a connection stays secure as long as either one holds."],
    ["Jailbreak", "ai", "A direct attempt by a user to talk a model out of its safety rules, often through role-play or clever framing."],
    ["Lattice cryptography", "pqc", "Cryptography based on hard problems involving grids of points in many dimensions. The basis of ML-KEM and ML-DSA."],
    ["Logical qubit", "quantum", "A reliable qubit built from many noisy physical qubits using error correction."],
    ["ML-KEM", "pqc", "Module-Lattice Key-Encapsulation Mechanism (FIPS 203), formerly Kyber. The main post-quantum standard for exchanging keys."],
    ["ML-DSA", "pqc", "Module-Lattice Digital Signature Algorithm (FIPS 204), formerly Dilithium. The main post-quantum signature standard."],
    ["Prompt injection", "ai", "Getting a language model to follow attacker-written instructions by placing them in text the model processes."],
    ["Qubit", "quantum", "The basic unit of quantum information, described by amplitudes for 0 and 1 and read out as a single classical bit."],
    ["Sandbox", "emerging", "An isolated environment where code runs with only the permissions it has been explicitly given."],
    ["Shor's algorithm", "quantum", "A quantum algorithm that factors large numbers efficiently, threatening RSA, ECC and Diffie-Hellman."],
    ["Superposition", "quantum", "A qubit state where the amplitudes for both 0 and 1 matter during computation, until measurement."],
    ["WASI", "emerging", "The WebAssembly System Interface: standard APIs that let Wasm modules use files, clocks and sockets outside a browser."],
    ["WebAssembly (Wasm)", "emerging", "A portable, fast, sandboxed binary format that many languages compile to, running in browsers and beyond."],
  ];
  const render = () => {
    const q = (search.value || "").trim().toLowerCase();
    const shown = terms.filter(([t, , d]) => !q || `${t} ${d}`.toLowerCase().includes(q));
    box.innerHTML = shown.length
      ? shown.map(([t, k, d]) => `
          <details>
            <summary>${escapeHtml(t)}</summary>
            <p><span class="g-topic">${TOPICS[k]}</span><br />${escapeHtml(d)}</p>
          </details>`).join("")
      : `<p class="empty">No term matches "${escapeHtml(q)}".</p>`;
    if (q && shown.length <= 3) $$("details", box).forEach((d) => (d.open = true));
  };
  search.addEventListener("input", render);
  render();
})();

// ---------- Subscribe (placeholder) ----------
// Connect to Buttondown, ConvertKit, Mailchimp etc. to make this real.
(function subscribe() {
  const form = $("#subscribe-form");
  if (!form) return;
  const note = $("#form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("input").value;
    note.textContent = `Thanks! ${email} is on the list. (Connect a newsletter service to make this real.)`;
    form.reset();
  });
})();

// =============================================================
// POST PAGES
// =============================================================
(function postPage() {
  const article = $(".article");
  const slug = document.body.dataset.slug;
  if (!article || !slug) return;

  // Remember that this post was read (shown as ✓ on the homepage)
  const read = store.get("tc-read", []);
  if (!read.includes(slug)) store.set("tc-read", [...read, slug]);

  // Reading progress bar
  const bar = document.createElement("div");
  bar.className = "progress";
  document.body.prepend(bar);
  const update = () => {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const pct = total > 0 ? Math.min(100, Math.max(0, (-rect.top / total) * 100)) : 100;
    bar.style.width = pct + "%";
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  // Table of contents from the h2 headings
  const heads = $$("h2", article);
  if (heads.length >= 3) {
    heads.forEach((h) => {
      if (!h.id) h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    });
    const toc = document.createElement("div");
    toc.className = "toc";
    toc.setAttribute("role", "navigation");
    toc.setAttribute("aria-label", "In this post");
    toc.innerHTML = `<strong>In this post</strong><ol>${heads
      .map((h) => `<li><a href="#${h.id}">${escapeHtml(h.textContent)}</a></li>`)
      .join("")}</ol>`;
    const date = $(".article-date", article) || $("h1", article);
    date.after(toc);
  }

  // Share links + related posts
  const extras = $("#post-extras");
  if (!extras) return;
  extras.className = "post-extras";
  const current = posts.find((p) => p.slug === slug);
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(current ? current.title : document.title);
  const related = posts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => (b.topic === current?.topic) - (a.topic === current?.topic))
    .slice(0, 2);

  extras.innerHTML = `
    <div class="share">
      <span>Share:</span>
      <a class="chip" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">LinkedIn</a>
      <a class="chip" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=${url}&text=${title}">X / Twitter</a>
      <button type="button" class="chip" id="copy-link">Copy link</button>
    </div>
    <div class="related">
      <h3>Keep reading</h3>
      <ul class="post-list">
        ${related.map((p) => `
          <li><a href="${postUrl(p)}">
            <span class="post-meta"><span class="badge">${TOPICS[p.topic]}</span> · ${p.readTime} min</span>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.excerpt)}</p>
            <span class="arrow" aria-hidden="true">→</span>
          </a></li>`).join("")}
      </ul>
    </div>`;

  $("#copy-link").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(location.href);
      e.target.textContent = "Copied ✓";
    } catch {
      e.target.textContent = "Copy failed";
    }
    setTimeout(() => (e.target.textContent = "Copy link"), 2000);
  });
})();
