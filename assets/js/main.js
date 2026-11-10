// =============================================================
// Trendcode — site script (homepage, post pages, lab pages)
// Content lives in data.js, which must be loaded first.
// =============================================================

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
const labUrl = (l) => `${BASE}labs/${l.slug}.html`;
const imgUrl = (slug) => `${BASE}assets/img/${slug}.svg`;
const topicLabel = (k) => (TOPICS[k] ? TOPICS[k].label : k);
const icon = (k, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${TOPICS[k] ? TOPICS[k].icon : ""}"/></svg>`;

// =============================================================
// PROGRESS: XP, levels, badges
// =============================================================
const progress = {
  read: () => store.get("tc-read", []),
  labs: () => store.get("tc-labs", []),
  quizBest: () => store.get("tc-quiz-best", 0),
  stepDone([kind, slug]) {
    return kind === "post" ? this.read().includes(slug) : this.labs().includes(slug);
  },
  xp() {
    return this.read().filter((s) => posts.some((p) => p.slug === s)).length * 10 +
      this.labs().filter((s) => labs.some((l) => l.slug === s)).length * 25 +
      this.quizBest() * 5;
  },
};

const LEVELS = [
  [0, "Newcomer"], [30, "Explorer"], [80, "Builder"], [150, "Engineer"], [230, "Decoder"],
];
const levelFor = (xp) => {
  let i = 0;
  LEVELS.forEach(([min], j) => { if (xp >= min) i = j; });
  return { index: i, name: LEVELS[i][1], min: LEVELS[i][0], next: LEVELS[i + 1] ? LEVELS[i + 1][0] : null };
};

const BADGES = [
  ["first-read", "📖", "First read", "Read your first explainer", () => progress.read().length >= 1],
  ["bookworm", "📚", "Bookworm", "Read 5 explainers", () => progress.read().length >= 5],
  ["first-lab", "🧪", "Hands-on", "Complete your first lab", () => progress.labs().length >= 1],
  ["lab-rat", "🔬", "Lab rat", "Complete every lab", () => labs.every((l) => progress.labs().includes(l.slug))],
  ["quiz-whiz", "🎯", "Quiz whiz", "Score 5/5 on the quiz", () => progress.quizBest() >= 5],
  ["pathfinder", "🧭", "Pathfinder", "Finish a learning path", () => paths.some((p) => p.steps.every((s) => progress.stepDone(s)))],
  ["polymath", "🌐", "Polymath", "Read a post in 6 different topics", () =>
    new Set(posts.filter((p) => progress.read().includes(p.slug)).map((p) => p.topic)).size >= 6],
  ["completionist", "🏆", "Completionist", "Read every explainer", () => posts.every((p) => progress.read().includes(p.slug))],
];

// ---------- Toasts ----------
function toast(html) {
  let wrap = $(".toasts");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toasts";
    wrap.setAttribute("aria-live", "polite");
    document.body.append(wrap);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = html;
  wrap.append(t);
  setTimeout(() => t.classList.add("out"), 3800);
  setTimeout(() => t.remove(), 4300);
}

// Called by lab scripts when the learner finishes a lab's challenge.
function awardAndAnnounce(update) {
  const beforeBadges = BADGES.filter((b) => b[4]()).map((b) => b[0]);
  const beforeLevel = levelFor(progress.xp()).index;
  update();
  const lvl = levelFor(progress.xp());
  BADGES.filter((b) => b[4]() && !beforeBadges.includes(b[0])).forEach((b) =>
    toast(`<span class="toast-icon">${b[1]}</span><div><strong>Badge unlocked: ${b[2]}</strong><br />${b[3]}</div>`));
  if (lvl.index > beforeLevel)
    toast(`<span class="toast-icon">⬆️</span><div><strong>Level up!</strong><br />You're now a ${lvl.name}.</div>`);
}

window.tcCompleteLab = function (slug) {
  if (progress.labs().includes(slug)) return;
  awardAndAnnounce(() => store.set("tc-labs", [...progress.labs(), slug]));
  const lab = labs.find((l) => l.slug === slug);
  toast(`<span class="toast-icon">✅</span><div><strong>Lab complete: ${escapeHtml(lab ? lab.title : slug)}</strong><br />+25 XP</div>`);
  $$(".lab-status").forEach((el) => { el.textContent = "✓ Completed"; el.classList.add("done"); });
};

// Mission checklist for lab pages. Completing every mission completes the lab.
// Usage: const m = tcMissions("hash-lab", [{ id: "a", text: "Do a thing" }, …]); m.complete("a");
window.tcMissions = function (slug, list) {
  const box = $("#missions");
  const key = "tc-m-" + slug;
  let done = store.get(key, []).filter((id) => list.some((m) => m.id === id));
  const render = () => {
    if (!box) return;
    box.innerHTML = `
      <div class="missions-head"><h2>Missions</h2><span class="missions-count">${done.length}/${list.length}</span></div>
      <div class="path-bar"><span style="width:${(done.length / list.length) * 100}%"></span></div>
      <ol class="mission-list">${list.map((m) =>
        `<li class="${done.includes(m.id) ? "done" : ""}"><span class="check" aria-hidden="true">${done.includes(m.id) ? "✓" : ""}</span><span>${m.text}</span></li>`).join("")}</ol>`;
  };
  render();
  return {
    isDone: (id) => done.includes(id),
    complete(id) {
      if (done.includes(id)) return;
      done = [...done, id];
      store.set(key, done);
      render();
      const m = list.find((x) => x.id === id);
      if (done.length < list.length) toast(`<span class="toast-icon">🎯</span><div><strong>Mission complete</strong><br />${m ? m.text : ""}</div>`);
      else window.tcCompleteLab(slug);
    },
  };
};

// =============================================================
// SHARED UI
// =============================================================

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
    document.dispatchEvent(new CustomEvent("tc-theme"));
  });
})();

// ---------- Footer year ----------
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

// ---------- Back-to-top button ----------
(function backToTop() {
  let btn = $("#to-top");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button"; btn.className = "to-top"; btn.id = "to-top";
    btn.setAttribute("aria-label", "Back to top"); btn.textContent = "↑";
    document.body.append(btn);
  }
  window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 600), { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0 }));
})();

// ---------- Scroll reveal ----------
function observeReveal(root = document) {
  const items = $$(".reveal:not(.visible)", root);
  if (!items.length) return;
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    }),
    { threshold: 0, rootMargin: "0px 0px -60px 0px" }
  );
  items.forEach((el) => io.observe(el));
}
observeReveal();

// ---------- Command palette (Ctrl/⌘ + K) ----------
(function palette() {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  $$(".search-btn kbd").forEach((k) => (k.textContent = isMac ? "⌘K" : "Ctrl K"));

  const items = [
    ...posts.map((p) => ({ kind: "Post", title: p.title, sub: topicLabel(p.topic), href: postUrl(p), text: p.excerpt })),
    ...labs.map((l) => ({ kind: "Lab", title: l.title, sub: `${l.level} · ${l.minutes} min`, href: labUrl(l), text: l.blurb })),
    ...Object.entries(TOPICS).map(([k, t]) => ({ kind: "Topic", title: t.label, sub: "Filter posts", href: `${BASE}index.html?topic=${k}#latest`, text: t.blurb })),
    ...paths.map((p) => ({ kind: "Path", title: p.title, sub: `${p.steps.length} steps`, href: `${BASE}index.html#paths`, text: p.blurb })),
    ...glossary.map(([t, k, d]) => ({ kind: "Term", title: t, sub: topicLabel(k), text: d })),
    { kind: "Page", title: "Take the quiz", sub: "5 random questions", href: `${BASE}index.html#quiz`, text: "quiz test knowledge" },
    { kind: "Page", title: "Your progress", sub: "XP, level and badges", href: `${BASE}index.html#progress`, text: "xp badges level stats" },
    { kind: "Page", title: "All labs", sub: "Hands-on, in your browser", href: `${BASE}labs/index.html`, text: "labs interactive" },
  ];

  const overlay = document.createElement("div");
  overlay.className = "palette";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="palette-box" role="dialog" aria-modal="true" aria-label="Search Trendcode">
      <input type="search" class="palette-input" placeholder="Search posts, labs, terms…" aria-label="Search" />
      <ul class="palette-list" role="listbox"></ul>
      <p class="palette-hint"><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close</p>
    </div>`;
  document.body.append(overlay);
  const input = $(".palette-input", overlay);
  const list = $(".palette-list", overlay);
  let shown = [], active = 0, lastFocus = null;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = !q
      ? items.filter((i) => i.kind !== "Term").slice(0, 8)
      : items
          .map((i) => {
            const t = i.title.toLowerCase();
            const score = t.startsWith(q) ? 3 : t.includes(q) ? 2 : `${i.sub} ${i.text}`.toLowerCase().includes(q) ? 1 : 0;
            return { i, score };
          })
          .filter((x) => x.score)
          .sort((a, b) => b.score - a.score)
          .slice(0, 9)
          .map((x) => x.i);
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length
      ? shown.map((i, n) => `
        <li role="option" aria-selected="${n === active}" class="${n === active ? "active" : ""}" data-n="${n}">
          <span class="palette-kind">${i.kind}</span>
          <span class="palette-title">${escapeHtml(i.title)}<small>${escapeHtml(i.sub)}</small></span>
          ${i.kind === "Term" && n === active ? `<p class="palette-def">${escapeHtml(i.text)}</p>` : ""}
        </li>`).join("")
      : `<li class="palette-empty">Nothing found for “${escapeHtml(input.value)}”.</li>`;
  };
  const open = () => {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    input.value = ""; active = 0; render(); input.focus();
  };
  const close = () => {
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  };
  const go = (n) => {
    const i = shown[n];
    if (!i) return;
    if (i.href) { close(); location.href = i.href; }
    else { active = n; render(); }
  };

  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); render(); }
    if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); render(); }
    if (e.key === "Enter") { e.preventDefault(); go(active); }
  });
  list.addEventListener("click", (e) => { const li = e.target.closest("[data-n]"); if (li) go(+li.dataset.n); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); overlay.hidden ? open() : close(); }
    else if (e.key === "Escape" && !overlay.hidden) close();
  });
  $$(".search-btn").forEach((b) => b.addEventListener("click", open));
})();

// ---------- Shared card renderers ----------
const postCard = (p, read = progress.read()) => `
  <a class="post-card" href="${postUrl(p)}">
    <div class="post-thumb"><img src="${imgUrl(p.slug)}" alt="" loading="lazy" width="1200" height="600" /></div>
    <div class="post-body">
      <span class="post-meta"><span class="badge">${topicLabel(p.topic)}</span> · ${p.readTime} min${
        read.includes(p.slug) ? ' · <span class="read-mark">✓ read</span>' : ""}${p.lab ? ' · <span class="lab-mark">🧪 lab</span>' : ""}</span>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.excerpt)}</p>
    </div>
  </a>`;

const labCard = (l, done = progress.labs()) => `
  <a class="lab-card${done.includes(l.slug) ? " done" : ""}" href="${labUrl(l)}">
    <div class="lab-card-top">
      ${icon(l.topic, "lab-icon")}
      <span class="lab-level">${l.level} · ${l.minutes} min</span>
    </div>
    <h3>${escapeHtml(l.title)}</h3>
    <p>${escapeHtml(l.blurb)}</p>
    <span class="lab-cta">${done.includes(l.slug) ? "✓ Completed · play again" : "Start lab →"}</span>
  </a>`;

// =============================================================
// HOMEPAGE
// =============================================================

// ---------- Rotating headline ----------
(function rotator() {
  const el = $("#rotator");
  if (!el || reduceMotion) return;
  const words = ["post-quantum crypto", "AI security", "quantum computing", "machine learning", "web security", "algorithms", "tomorrow's tech"];
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
    ["cmd", "$ trendcode learn --hands-on"],
    ["ok", `  ✓ ${posts.length} explainers · ${labs.length} labs · ${Object.keys(TOPICS).length} topics`],
    ["", "  scroll down to start ↓"],
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
  const nums = $$("[data-stat]");
  if (!nums.length) return;
  const values = { posts: posts.length, labs: labs.length, topics: Object.keys(TOPICS).length, terms: glossary.length };
  nums.forEach((el) => {
    const target = values[el.dataset.stat] || 0;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / 900);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
})();

// ---------- Topics + post grid with search and filter ----------
(function postList() {
  const grid = $("#post-grid");
  const topicGrid = $("#topic-grid");
  if (!grid) return;
  const search = $("#post-search");
  const chips = $("#topic-chips");
  const empty = $("#post-empty");
  const read = progress.read();

  const params = new URLSearchParams(location.search);
  let topic = TOPICS[params.get("topic")] ? params.get("topic") : "all";
  let query = "";

  if (topicGrid) {
    topicGrid.innerHTML = Object.entries(TOPICS).map(([k, t], i) => {
      const np = posts.filter((p) => p.topic === k).length;
      const nl = labs.filter((l) => l.topic === k).length;
      return `
        <button class="topic-card" data-topic="${k}" type="button">
          <span class="topic-top">${icon(k, "topic-icon")}<span class="tag">${String(i + 1).padStart(2, "0")}</span></span>
          <h3>${t.label}</h3>
          <p>${t.blurb}</p>
          <span class="card-count">${np} post${np === 1 ? "" : "s"}${nl ? ` · ${nl} lab${nl === 1 ? "" : "s"}` : ""} →</span>
        </button>`;
    }).join("");
  }

  chips.innerHTML = [["all", "All"], ...Object.entries(TOPICS).map(([k, t]) => [k, t.label])]
    .map(([k, label]) => `<button type="button" class="chip" data-topic="${k}">${label}</button>`)
    .join("");

  const render = () => {
    const q = query.trim().toLowerCase();
    const shown = posts.filter(
      (p) =>
        (topic === "all" || p.topic === topic) &&
        (!q || `${p.title} ${p.excerpt} ${topicLabel(p.topic)}`.toLowerCase().includes(q))
    );
    grid.innerHTML = shown.map((p) => postCard(p, read)).join("");
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
  if (topicGrid) topicGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".topic-card");
    if (!card) return;
    setTopic(topic === card.dataset.topic ? "all" : card.dataset.topic);
    $("#latest").scrollIntoView();
  });
  search.addEventListener("input", () => { query = search.value; render(); });

  // Press "/" anywhere to jump to the post search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      search.focus();
    }
  });

  render();
})();

// ---------- Labs grid (homepage + labs hub) ----------
(function labsGrid() {
  const box = $("#labs-grid");
  if (!box) return;
  const limit = +box.dataset.limit || labs.length;
  box.innerHTML = labs.slice(0, limit).map((l) => labCard(l)).join("");
})();

// ---------- Learning paths ----------
(function learningPaths() {
  const box = $("#paths-list");
  if (!box) return;
  box.innerHTML = paths.map((path) => {
    const done = path.steps.filter((s) => progress.stepDone(s)).length;
    const pct = Math.round((done / path.steps.length) * 100);
    const nextStep = path.steps.find((s) => !progress.stepDone(s));
    const steps = path.steps.map((s) => {
      const [kind, slug] = s;
      const item = kind === "post" ? posts.find((p) => p.slug === slug) : labs.find((l) => l.slug === slug);
      if (!item) return "";
      const href = kind === "post" ? postUrl(item) : labUrl(item);
      return `<li class="${progress.stepDone(s) ? "done" : ""}${s === nextStep ? " next" : ""}">
        <a href="${href}"><span class="step-kind">${kind === "post" ? "📖 Read" : "🧪 Lab"}</span>${escapeHtml(item.title)}</a></li>`;
    }).join("");
    let cta = "";
    if (nextStep) {
      const [kind, slug] = nextStep;
      const item = kind === "post" ? posts.find((p) => p.slug === slug) : labs.find((l) => l.slug === slug);
      cta = `<a class="btn btn-small" href="${kind === "post" ? postUrl(item) : labUrl(item)}">${done ? "Continue" : "Start path"} →</a>`;
    } else {
      cta = `<span class="path-complete">🏁 Path complete</span>`;
    }
    return `
      <article class="path-card path-${path.color}">
        <div class="path-head">
          <h3>${escapeHtml(path.title)}</h3>
          <span class="path-pct">${pct}%</span>
        </div>
        <p>${escapeHtml(path.blurb)}</p>
        <div class="path-bar"><span style="width:${pct}%"></span></div>
        <ol class="path-steps">${steps}</ol>
        ${cta}
      </article>`;
  }).join("");
})();

// ---------- Progress dashboard ----------
(function dashboard() {
  const box = $("#progress-box");
  if (!box) return;
  const render = () => {
    const xp = progress.xp();
    const lvl = levelFor(xp);
    const pct = lvl.next ? Math.round(((xp - lvl.min) / (lvl.next - lvl.min)) * 100) : 100;
    const readN = progress.read().filter((s) => posts.some((p) => p.slug === s)).length;
    const labN = progress.labs().filter((s) => labs.some((l) => l.slug === s)).length;
    box.innerHTML = `
      <div class="xp-card">
        <div class="xp-ring" style="--pct:${pct}"><span>${xp}<small>XP</small></span></div>
        <div>
          <p class="eyebrow">// level ${lvl.index + 1}</p>
          <h3>${lvl.name}</h3>
          <p class="muted">${lvl.next ? `${lvl.next - xp} XP to ${LEVELS[lvl.index + 1][1]}` : "Max level. You've decoded it all."}</p>
          <ul class="xp-stats">
            <li><strong>${readN}/${posts.length}</strong> posts read</li>
            <li><strong>${labN}/${labs.length}</strong> labs done</li>
            <li><strong>${progress.quizBest()}/5</strong> best quiz</li>
          </ul>
          <p class="xp-rules">+10 XP per post · +25 per lab · +5 per quiz point</p>
        </div>
      </div>
      <div class="badges">
        ${BADGES.map(([id, emoji, name, desc, test]) => {
          const got = test();
          return `<div class="badge-tile${got ? " got" : ""}" title="${escapeHtml(desc)}">
            <span class="badge-emoji">${got ? emoji : "🔒"}</span>
            <strong>${name}</strong><small>${desc}</small></div>`;
        }).join("")}
      </div>
      <button type="button" class="link-btn" id="reset-progress">Reset my progress</button>`;
    $("#reset-progress", box).addEventListener("click", () => {
      if (!confirm("Reset all your reading, lab and quiz progress on this device?")) return;
      ["tc-read", "tc-labs", "tc-quiz-best"].forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
      location.reload();
    });
  };
  render();
  document.addEventListener("tc-progress", render);
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

// ---------- Quiz (5 random questions from the pool) ----------
(function quiz() {
  const box = $("#quiz-box");
  if (!box) return;
  const ROUND = 5;
  let questions = [], idx = 0, score = 0;
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

  const start = () => { questions = shuffle(quizPool).slice(0, ROUND); idx = 0; score = 0; show(); };

  const show = () => {
    if (idx >= questions.length) return finish();
    const item = questions[idx];
    box.innerHTML = `
      <p class="quiz-progress">Question ${idx + 1} of ${questions.length} · score ${score}</p>
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
    if (score > prev) {
      awardAndAnnounce(() => store.set("tc-quiz-best", score));
      document.dispatchEvent(new CustomEvent("tc-progress"));
    }
    const verdict =
      score === questions.length ? "Fully decoded. You could write these posts." :
      score >= 3 ? "Nicely done. A couple of explainers will fill the gaps." :
      "Great place to start. The posts above cover every answer.";
    box.innerHTML = `
      <p class="quiz-progress">Finished</p>
      <p class="quiz-score">${score}/${questions.length}</p>
      <h3>${verdict}</h3>
      <p class="muted">Your best: ${Math.max(score, prev)}/${questions.length} · ${quizPool.length} questions in the pool, so every round is different.</p>
      <div class="quiz-actions">
        <button type="button" class="btn" data-restart>New round</button>
        <a class="btn btn-ghost" href="#latest">Read the posts</a>
      </div>`;
  };

  box.addEventListener("click", (e) => {
    const opt = e.target.closest(".quiz-option");
    if (opt && !opt.disabled) return answer(+opt.dataset.i);
    if (e.target.closest("[data-next]")) { idx++; show(); }
    if (e.target.closest("[data-restart]")) start();
  });
  box.addEventListener("keydown", (e) => {
    const k = "abcd".indexOf(e.key.toLowerCase());
    const opts = $$(".quiz-option:not(:disabled)", box);
    if (k >= 0 && opts[k]) answer(k);
  });
  start();
})();

// ---------- Glossary + term of the day ----------
(function glossaryList() {
  const box = $("#glossary-list");
  if (!box) return;
  const search = $("#glossary-search");
  const tod = $("#term-of-day");
  if (tod) {
    const day = Math.floor(Date.now() / 86400000);
    const [t, k, d] = glossary[day % glossary.length];
    tod.innerHTML = `<span class="eyebrow">// term of the day</span><h3>${escapeHtml(t)}</h3><p>${escapeHtml(d)}</p><span class="g-topic">${topicLabel(k)}</span>`;
  }
  const render = () => {
    const q = (search.value || "").trim().toLowerCase();
    const shown = glossary.filter(([t, , d]) => !q || `${t} ${d}`.toLowerCase().includes(q));
    box.innerHTML = shown.length
      ? shown.map(([t, k, d]) => `
          <details>
            <summary>${escapeHtml(t)}</summary>
            <p><span class="g-topic">${topicLabel(k)}</span><br />${escapeHtml(d)}</p>
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
  const current = posts.find((p) => p.slug === slug);

  // Mark as read (and announce new badges / levels)
  if (!progress.read().includes(slug)) {
    setTimeout(() => awardAndAnnounce(() => store.set("tc-read", [...progress.read(), slug])), 1200);
  }

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
    const anchor = $(".post-hero", article) || $(".article-date", article) || $("h1", article);
    anchor.after(toc);
  }

  const extras = $("#post-extras");
  if (!extras) return;
  extras.className = "post-extras";
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(current ? current.title : document.title);
  const lab = current && current.lab ? labs.find((l) => l.slug === current.lab) : null;
  const inPaths = paths.filter((p) => p.steps.some(([, s]) => s === slug));
  const related = posts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => (b.topic === current?.topic) - (a.topic === current?.topic) ||
      (inPaths.some((pa) => pa.steps.some(([, s]) => s === b.slug)) - inPaths.some((pa) => pa.steps.some(([, s]) => s === a.slug))))
    .slice(0, 3);

  extras.innerHTML = `
    ${lab ? `
      <a class="try-lab" href="${labUrl(lab)}">
        ${icon(lab.topic, "lab-icon")}
        <div><span class="eyebrow">// try it yourself · ${lab.minutes} min lab</span>
        <strong>${escapeHtml(lab.title)}</strong><p>${escapeHtml(lab.blurb)}</p></div>
        <span class="arrow" aria-hidden="true">→</span>
      </a>` : ""}
    ${inPaths.length ? `<p class="in-path">Part of the learning path${inPaths.length > 1 ? "s" : ""}: ${inPaths
      .map((p) => `<a href="${BASE}index.html#paths">${escapeHtml(p.title)}</a>`).join(", ")}</p>` : ""}
    <div class="share">
      <span>Share:</span>
      <a class="chip" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">LinkedIn</a>
      <a class="chip" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=${url}&text=${title}">X / Twitter</a>
      <button type="button" class="chip" id="copy-link">Copy link</button>
    </div>
    <div class="related">
      <h3>Keep reading</h3>
      <div class="post-grid compact">${related.map((p) => postCard(p)).join("")}</div>
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

// =============================================================
// LAB PAGES
// =============================================================
(function labPage() {
  const slug = document.body.dataset.lab;
  if (!slug) return;
  const lab = labs.find((l) => l.slug === slug);
  const status = $(".lab-status");
  if (status && progress.labs().includes(slug)) { status.textContent = "✓ Completed"; status.classList.add("done"); }
  const extras = $("#lab-extras");
  if (!extras || !lab) return;
  const readFirst = posts.filter((p) => p.lab === slug);
  const others = labs.filter((l) => l.slug !== slug);
  const nextLab = others.find((l) => !progress.labs().includes(l.slug)) || others[0];
  extras.innerHTML = `
    ${readFirst.length ? `<h3>Read the explainer</h3><div class="post-grid compact">${readFirst.map((p) => postCard(p)).join("")}</div>` : ""}
    <h3>Next lab</h3>
    <div class="lab-grid single">${labCard(nextLab)}</div>`;
})();
