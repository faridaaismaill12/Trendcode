// =============================================================
// Trendcode — shared site script (every page loads this)
// Content lives in data.js (loaded first). Page-specific code lives
// in assets/js/pages/*.js and assets/js/labs/*.js (loaded after).
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
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const formatDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const postUrl = (p) => `${BASE}posts/${p.slug}.html`;
const labUrl = (l) => `${BASE}labs/${l.slug}.html`;
const pageUrl = (name) => `${BASE}${name}.html`;
const imgUrl = (slug) => `${BASE}assets/img/${slug}.svg`;
const topicUrl = (k) => `${BASE}topic.html?t=${k}`;
const termUrl = (t) => `${BASE}glossary.html#${slugify(t)}`;
const topicLabel = (k) => (TOPICS[k] ? TOPICS[k].label : k);
const icon = (k, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${TOPICS[k] ? TOPICS[k].icon : ""}"/></svg>`;

// =============================================================
// PROGRESS: XP, levels, badges (all stored in this browser)
// =============================================================
const progress = {
  read: () => store.get("tc-read", []).filter((s) => posts.some((p) => p.slug === s)),
  labs: () => store.get("tc-labs", []).filter((s) => labs.some((l) => l.slug === s)),
  quizBest: () => store.get("tc-quiz-best", 0),
  daily: () => store.get("tc-daily", []),
  cards: () => store.get("tc-cards", {}),
  mythsBest: () => store.get("tc-myths-best", 0),
  matchBest: () => store.get("tc-match-best", null),
  saved: () => store.get("tc-saved", []).filter((s) => posts.some((p) => p.slug === s)),
  mastered() { return Object.values(this.cards()).filter((b) => b >= 3).length; },
  streak() {
    const days = new Set(this.daily());
    const d = new Date();
    if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1); // streak still alive if yesterday was done
    let n = 0;
    while (days.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },
  stepDone([kind, slug]) {
    return kind === "post" ? this.read().includes(slug) : this.labs().includes(slug);
  },
  pathPct(path) { return Math.round((path.steps.filter((s) => this.stepDone(s)).length / path.steps.length) * 100); },
  xp() {
    return this.read().length * 10 + this.labs().length * 25 + this.quizBest() * 5 +
      this.daily().length * 5 + this.mastered() * 2 + this.mythsBest() * 2 + (this.matchBest() ? 10 : 0);
  },
};

const LEVELS = [
  [0, "Newcomer"], [30, "Explorer"], [90, "Builder"], [180, "Engineer"], [300, "Architect"], [450, "Decoder"],
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
  ["streak", "🔥", "On fire", "Keep a 3-day Daily Challenge streak", () => progress.streak() >= 3],
  ["card-shark", "🃏", "Card shark", "Master 20 flashcards", () => progress.mastered() >= 20],
  ["myth-buster", "🧠", "Myth buster", "Score 10/10 on Myth or Fact", () => progress.mythsBest() >= 10],
  ["quick", "⚡", "Quick matcher", "Finish Jargon Match in under 45 seconds", () => (progress.matchBest() || Infinity) < 45],
  ["curator", "🔖", "Curator", "Save 3 posts to your reading list", () => progress.saved().length >= 3],
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

// Wrap any progress change: announces new badges and level-ups, refreshes XP displays.
function awardAndAnnounce(update) {
  const beforeBadges = BADGES.filter((b) => b[4]()).map((b) => b[0]);
  const beforeLevel = levelFor(progress.xp()).index;
  update();
  const lvl = levelFor(progress.xp());
  BADGES.filter((b) => b[4]() && !beforeBadges.includes(b[0])).forEach((b) =>
    toast(`<span class="toast-icon">${b[1]}</span><div><strong>Badge unlocked: ${b[2]}</strong><br />${b[3]}</div>`));
  if (lvl.index > beforeLevel)
    toast(`<span class="toast-icon">⬆️</span><div><strong>Level up!</strong><br />You're now a ${lvl.name}.</div>`);
  document.dispatchEvent(new CustomEvent("tc-progress"));
}

window.tcCompleteLab = function (slug) {
  if (progress.labs().includes(slug)) return;
  awardAndAnnounce(() => store.set("tc-labs", [...store.get("tc-labs", []), slug]));
  const lab = labs.find((l) => l.slug === slug);
  toast(`<span class="toast-icon">✅</span><div><strong>Lab complete: ${escapeHtml(lab ? lab.title : slug)}</strong><br />+25 XP</div>`);
  $$(".lab-status").forEach((el) => { el.textContent = "✓ Completed"; el.classList.add("done"); });
};

// Mission checklist for lab pages. Completing every mission completes the lab.
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

// ---------- Reading list (bookmarks) ----------
const bookmarks = {
  has: (slug) => progress.saved().includes(slug),
  toggle(slug) {
    const on = !this.has(slug);
    awardAndAnnounce(() => store.set("tc-saved", on ? [...progress.saved(), slug] : progress.saved().filter((s) => s !== slug)));
    toast(`<span class="toast-icon">🔖</span><div><strong>${on ? "Saved to your reading list" : "Removed from your reading list"}</strong>${on ? `<br /><a href="${pageUrl("saved")}">View reading list →</a>` : ""}</div>`);
    $$(`[data-save="${slug}"]`).forEach(paintSave);
    return on;
  },
};
function paintSave(btn) {
  const on = bookmarks.has(btn.dataset.save);
  btn.classList.toggle("on", on);
  btn.setAttribute("aria-pressed", String(on));
  btn.setAttribute("aria-label", on ? "Remove from reading list" : "Save to reading list");
  btn.innerHTML = btn.classList.contains("save-wide") ? (on ? "🔖 Saved" : "🔖 Save for later") : (on ? "★" : "☆");
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-save]");
  if (!b) return;
  e.preventDefault();
  bookmarks.toggle(b.dataset.save);
});

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

// ---------- Mobile menu ----------
(function menu() {
  const btn = $("#menu-btn");
  const nav = $("#site-nav");
  if (!btn || !nav) return;
  const set = (open) => {
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  btn.addEventListener("click", () => set(!document.body.classList.contains("menu-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
})();

// ---------- XP badge in the nav ----------
function paintNavXp() {
  $$(".nav-xp").forEach((a) => {
    const xp = progress.xp();
    let b = $(".xp-pill", a);
    if (!b) { b = document.createElement("span"); b.className = "xp-pill"; a.append(b); }
    b.textContent = `${xp} XP`;
  });
}
paintNavXp();
document.addEventListener("tc-progress", paintNavXp);

// ---------- Account: header button + on-demand loading of Supabase ----------
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some((s) => s.src && s.src.endsWith(src.replace(/^\.\.\//, "")))) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.append(s);
  });
}
// Resolves to window.tcAccount ({ enabled:false } when Supabase isn't configured)
window.tcAccountReady = (async () => {
  try {
    if (!window.TC_CONFIG) await loadScript(`${BASE}assets/js/config.js`);
    const c = window.TC_CONFIG || {};
    if (!c.supabaseUrl || !c.supabaseAnonKey) return (window.tcAccount = { enabled: false });
    // Only pull in the Supabase library when it's needed: someone is signed in,
    // we're on the login/profile pages, or we're returning from a sign-in redirect.
    const needed = store.get("tc-account", null) || document.body.dataset.auth ||
      /access_token|refresh_token|[?&]code=|type=recovery/.test(location.href);
    if (!needed) return (window.tcAccount = { enabled: true, lazy: true, user: null });
    if (!window.supabase) await loadScript(SUPABASE_CDN);
    if (!window.tcAccount || !window.tcAccount.enabled || window.tcAccount.lazy) await loadScript(`${BASE}assets/js/account.js`);
    await window.tcAccount.ready;
    return window.tcAccount;
  } catch (e) {
    console.warn(e.message);
    return (window.tcAccount = { enabled: false });
  }
})();

function paintAccountButton() {
  const btn = $("#account-btn");
  if (!btn || !window.TCAvatar) return;
  const acct = store.get("tc-account", null);
  const prof = store.get("tc-profile", {});
  const name = acct ? (acct.displayName || acct.username) : prof.displayName || "";
  btn.innerHTML = `<span class="account-av">${TCAvatar.svg(TCAvatar.get(), 30, { noEmblem: true })}</span><span class="account-name">${escapeHtml(name || "Sign in")}</span>`;
  btn.href = acct || prof.displayName ? `${BASE}profile.html` : `${BASE}login.html`;
  btn.setAttribute("aria-label", acct ? `Your profile (${name})` : name ? "Your profile" : "Sign in or create a profile");
  btn.classList.toggle("signed-in", !!acct);
}
paintAccountButton();
["tc-account", "tc-character", "tc-progress"].forEach((ev) => document.addEventListener(ev, paintAccountButton));

// ---------- Footer year ----------
$$("#year").forEach((y) => (y.textContent = new Date().getFullYear()));

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
// Run after page scripts have rendered their content
window.addEventListener("DOMContentLoaded", () => observeReveal());

// ---------- Command palette (Ctrl/⌘ + K) ----------
(function palette() {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  $$(".search-btn kbd").forEach((k) => (k.textContent = isMac ? "⌘K" : "Ctrl K"));

  const items = [
    ...posts.map((p) => ({ kind: "Post", title: p.title, sub: topicLabel(p.topic), href: postUrl(p), text: p.excerpt })),
    ...labs.map((l) => ({ kind: "Lab", title: l.title, sub: `${l.level} · ${l.minutes} min`, href: labUrl(l), text: l.blurb })),
    ...activities.map((a) => ({ kind: "Activity", title: a.title, sub: a.blurb, href: pageUrl(a.slug), text: a.blurb })),
    ...Object.entries(TOPICS).map(([k, t]) => ({ kind: "Topic", title: t.label, sub: "Posts, labs & terms", href: topicUrl(k), text: t.blurb })),
    ...paths.map((p) => ({ kind: "Path", title: p.title, sub: `${p.steps.length} steps`, href: pageUrl("paths") + "#" + p.id, text: p.blurb })),
    ...glossary.map(([t, k, d]) => ({ kind: "Term", title: t, sub: topicLabel(k), href: termUrl(t), text: d })),
    { kind: "Page", title: "Your progress", sub: "XP, level, badges, certificates", href: pageUrl("progress"), text: "xp badges level stats" },
    { kind: "Page", title: "Your profile & character", sub: "Customise your avatar and class", href: pageUrl("profile"), text: "profile character avatar customise class username" },
    { kind: "Page", title: "Sign in", sub: "Sync progress across devices", href: pageUrl("login"), text: "login sign in account register sign up" },
    { kind: "Page", title: "All explainers", sub: "Search and filter every post", href: pageUrl("posts"), text: "posts articles explainers" },
    { kind: "Page", title: "All labs", sub: "Hands-on, in your browser", href: `${BASE}labs/index.html`, text: "labs interactive" },
  ];

  const overlay = document.createElement("div");
  overlay.className = "palette";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="palette-box" role="dialog" aria-modal="true" aria-label="Search Trendcode">
      <input type="search" class="palette-input" placeholder="Search posts, labs, activities, terms…" aria-label="Search" />
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
      ? [...items.filter((i) => i.kind === "Activity").slice(0, 4), ...items.filter((i) => i.kind === "Post").slice(0, 3), ...items.filter((i) => i.kind === "Lab").slice(0, 2)]
      : items
          .map((i) => {
            const t = i.title.toLowerCase();
            const score = t.startsWith(q) ? 3 : t.includes(q) ? 2 : `${i.sub} ${i.text}`.toLowerCase().includes(q) ? 1 : 0;
            return { i, score };
          })
          .filter((x) => x.score)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
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
    close();
    location.href = i.href;
  };

  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); render(); }
    if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); render(); }
    if (e.key === "Enter") { e.preventDefault(); go(active); }
  });
  list.addEventListener("click", (e) => { const li = e.target.closest("[data-n]"); if (li) go(+li.dataset.n); });
  list.addEventListener("mousemove", (e) => {
    const li = e.target.closest("[data-n]");
    if (li && +li.dataset.n !== active) { active = +li.dataset.n; render(); }
  });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); overlay.hidden ? open() : close(); }
    else if (e.key === "Escape" && !overlay.hidden) close();
  });
  $$(".search-btn").forEach((b) => b.addEventListener("click", open));
})();

// ---------- Shared card renderers ----------
const postCard = (p, read = progress.read()) => `
  <article class="post-card">
    <a class="post-link" href="${postUrl(p)}">
      <div class="post-thumb"><img src="${imgUrl(p.slug)}" alt="" loading="lazy" width="1200" height="600" /></div>
      <div class="post-body">
        <span class="post-meta"><span class="badge">${topicLabel(p.topic)}</span> · ${p.readTime} min${
          read.includes(p.slug) ? ' · <span class="read-mark">✓ read</span>' : ""}${p.lab ? ' · <span class="lab-mark">🧪 lab</span>' : ""}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.excerpt)}</p>
      </div>
    </a>
    <button type="button" class="save-btn${bookmarks.has(p.slug) ? " on" : ""}" data-save="${p.slug}" aria-pressed="${bookmarks.has(p.slug)}" aria-label="${bookmarks.has(p.slug) ? "Remove from" : "Save to"} reading list">${bookmarks.has(p.slug) ? "★" : "☆"}</button>
  </article>`;

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

const activityStat = (slug) => {
  switch (slug) {
    case "daily": { const s = progress.streak(); return s ? `🔥 ${s}-day streak` : "Today's puzzle is waiting"; }
    case "flashcards": return `${progress.mastered()}/${glossary.length} mastered`;
    case "match": return progress.matchBest() ? `Best: ${progress.matchBest().toFixed(1)}s` : "No best time yet";
    case "myths": return progress.mythsBest() ? `Best: ${progress.mythsBest()}/10` : "Not played yet";
    case "quiz": return progress.quizBest() ? `Best: ${progress.quizBest()}/5` : "Not taken yet";
    case "timeline": return `${Object.keys(timelines).length} timelines`;
    case "glossary": return `${glossary.length} terms`;
    case "resources": return `${resources.length} picks`;
    case "certificate": { const n = paths.filter((p) => progress.pathPct(p) === 100).length; return `${n}/${paths.length} earned`; }
    case "saved": { const n = progress.saved().length; return n ? `${n} saved` : "Nothing saved yet"; }
    default: return "";
  }
};
const activityCard = (a) => `
  <a class="activity-card" href="${pageUrl(a.slug)}">
    <span class="activity-emoji" aria-hidden="true">${a.emoji}</span>
    <h3>${escapeHtml(a.title)}</h3>
    <p>${escapeHtml(a.blurb)}</p>
    <span class="activity-stat">${activityStat(a.slug)}</span>
  </a>`;

const pathCard = (path, compact = false) => {
  const done = path.steps.filter((s) => progress.stepDone(s)).length;
  const pct = progress.pathPct(path);
  const nextStep = path.steps.find((s) => !progress.stepDone(s));
  const itemOf = ([kind, slug]) => (kind === "post" ? posts.find((p) => p.slug === slug) : labs.find((l) => l.slug === slug));
  const hrefOf = (s) => (s[0] === "post" ? postUrl(itemOf(s)) : labUrl(itemOf(s)));
  const steps = compact ? "" : `<ol class="path-steps">${path.steps.map((s) => {
    const item = itemOf(s);
    if (!item) return "";
    return `<li class="${progress.stepDone(s) ? "done" : ""}${s === nextStep ? " next" : ""}">
      <a href="${hrefOf(s)}"><span class="step-kind">${s[0] === "post" ? "📖 Read" : "🧪 Lab"}</span>${escapeHtml(item.title)}</a></li>`;
  }).join("")}</ol>`;
  const cta = nextStep
    ? `<a class="btn btn-small" href="${hrefOf(nextStep)}">${done ? "Continue" : "Start path"} →</a>`
    : `<a class="btn btn-small" href="${pageUrl("certificate")}?path=${path.id}">🎓 Get certificate</a>`;
  return `
    <article class="path-card path-${path.color}" id="${path.id}">
      <div class="path-head"><h3>${escapeHtml(path.title)}</h3><span class="path-pct">${pct}%</span></div>
      <p>${escapeHtml(path.blurb)}</p>
      <div class="path-bar"><span style="width:${pct}%"></span></div>
      ${compact ? `<p class="path-meta">${done}/${path.steps.length} steps done</p>` : steps}
      ${cta}
    </article>`;
};

function resourceCard([title, url, desc, topic, kind]) {
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
  return `<a class="resource-card" href="${url}" target="_blank" rel="noopener">
    <span class="resource-kind">${kind}</span>
    <h3>${escapeHtml(title)} <span aria-hidden="true">↗</span></h3>
    <p>${escapeHtml(desc)}</p>
    <span class="resource-host">${host} · ${topicLabel(topic)}</span>
  </a>`;
}

// ---------- Labs grid (homepage + labs hub) ----------
(function labsGrid() {
  const box = $("#labs-grid");
  if (!box) return;
  const limit = +box.dataset.limit || labs.length;
  box.innerHTML = labs.slice(0, limit).map((l) => labCard(l)).join("");
})();

// =============================================================
// POST PAGES
// =============================================================
(function postPage() {
  const article = $(".article");
  const slug = document.body.dataset.slug;
  if (!article || !slug) return;
  const current = posts.find((p) => p.slug === slug);

  if (!progress.read().includes(slug)) {
    setTimeout(() => awardAndAnnounce(() => store.set("tc-read", [...store.get("tc-read", []), slug])), 1200);
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

  // Save button under the date
  const date = $(".article-date", article);
  if (date) date.insertAdjacentHTML("beforeend", ` <button type="button" class="chip save-wide" data-save="${slug}"></button>`);
  $$(".save-wide", article).forEach(paintSave);

  // Table of contents from the h2 headings
  const heads = $$("h2", article);
  if (heads.length >= 3) {
    heads.forEach((h) => { if (!h.id) h.id = slugify(h.textContent); });
    const toc = document.createElement("div");
    toc.className = "toc";
    toc.setAttribute("role", "navigation");
    toc.setAttribute("aria-label", "In this post");
    toc.innerHTML = `<strong>In this post</strong><ol>${heads
      .map((h) => `<li><a href="#${h.id}">${escapeHtml(h.textContent)}</a></li>`).join("")}</ol>`;
    ($(".post-hero", article) || date || $("h1", article)).after(toc);
  }

  const extras = $("#post-extras");
  if (!extras) return;
  extras.className = "post-extras";
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(current ? current.title : document.title);
  const lab = current && current.lab ? labs.find((l) => l.slug === current.lab) : null;
  const inPaths = paths.filter((p) => p.steps.some(([, s]) => s === slug));
  const topicTerms = current ? glossary.filter(([, k]) => k === current.topic).length : 0;
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
    <div class="next-steps">
      <a href="${pageUrl("flashcards")}?topic=${current?.topic || ""}">🃏 Practise ${topicTerms} ${topicLabel(current?.topic)} terms with flashcards</a>
      <a href="${pageUrl("myths")}">🧠 Myth or Fact: test what you just read</a>
      <a href="${topicUrl(current?.topic)}">${icon(current?.topic, "inline-icon")} More on ${topicLabel(current?.topic)}</a>
    </div>
    ${inPaths.length ? `<p class="in-path">Part of the learning path${inPaths.length > 1 ? "s" : ""}: ${inPaths
      .map((p) => `<a href="${pageUrl("paths")}#${p.id}">${escapeHtml(p.title)}</a>`).join(", ")}</p>` : ""}
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
