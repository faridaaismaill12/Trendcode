#!/usr/bin/env node
// Stamps the shared header and footer into every HTML page so they never drift apart.
// Usage (from the repo root):  node tools/sync-layout.js
// Edit the templates below, run the script, commit the result.

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

// Which top-level nav item each page belongs to
const SECTIONS = {
  learn: ["posts.html", "posts/", "library.html", "library/", "labs/", "compiler.html", "paths.html", "topics.html", "topic.html", "resources.html"],
  practice: ["activities.html", "daily.html", "flashcards.html", "match.html", "myths.html", "quiz.html", "glossary.html", "timeline.html", "certificate.html"],
  threats: ["threats.html"],
  predict: ["predict.html"],
  chat: ["chat.html"],
  progress: ["progress.html", "saved.html", "profile.html", "login.html"],
};
const sectionOf = (rel) =>
  Object.keys(SECTIONS).find((s) => SECTIONS[s].some((m) => (m.endsWith("/") ? rel.startsWith(m) : rel === m))) || "";

const MENUS = {
  learn: [
    ["posts.html", "Explainers", "Plain-English deep dives"],
    ["library.html", "The Library", "35 structured guides"],
    ["labs/index.html", "Labs", "Hands-on experiments"],
    ["compiler.html", "Code playground", "Run code in 10+ languages"],
    ["paths.html", "Learning paths", "Step-by-step tracks"],
    ["topics.html", "Topics", "Browse by subject"],
  ],
  practice: [
    ["daily.html", "Daily challenge", "A new puzzle every day"],
    ["quiz.html", "Quiz", "Five quick questions"],
    ["flashcards.html", "Flashcards", "Master the jargon"],
    ["match.html", "Jargon Match", "Race the clock"],
    ["myths.html", "Myth or Fact", "Ten things you've heard"],
    ["activities.html", "All activities", "Glossary, timelines and more"],
  ],
};
const CHEVRON = `<svg class="nav-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

const header = (p, sec, rel) => {
  const cur = (href) => (href === rel || (href === "labs/index.html" && rel.startsWith("labs/")) ? ' aria-current="page"' : "");
  const group = (key, label) => `<div class="nav-group${sec === key ? " is-current" : ""}">
        <button type="button" class="nav-top" aria-expanded="false" aria-controls="menu-${key}">${label}${CHEVRON}</button>
        <div class="nav-menu" id="menu-${key}">
          ${MENUS[key].map(([href, title, sub]) => `<a href="${p}${href}"${cur(href)}><b>${title}</b><small>${sub}</small></a>`).join("\n          ")}
        </div>
      </div>`;
  const top = (href, key, label, extra = "") =>
    `<a class="nav-top${extra}" href="${p}${href}"${sec === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site-header">
    <a href="${p}index.html" class="logo">trend<span>code</span><b>_</b></a>
    <nav id="site-nav" aria-label="Main">
      ${group("learn", "Learn")}
      ${group("practice", "Practice")}
      ${top("threats.html", "threats", "Threats")}
      ${top("predict.html", "predict", "Predict")}
      ${top("progress.html", "progress", "Progress", " nav-xp")}
    </nav>
    <div class="header-tools">
      <a class="chat-btn" href="${p}chat.html"${sec === "chat" ? ' aria-current="page"' : ""}><span class="live-dot" aria-hidden="true"></span>Chat</a>
      <button type="button" class="search-btn" id="search-btn" aria-label="Search the site"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M20 20l-4-4"/></svg><kbd>Ctrl K</kbd></button>
      <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Switch colour theme"></button>
      <a class="account-btn" id="account-btn" href="${p}login.html"><span class="account-name">Sign in</span></a>
      <button type="button" class="menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>
    </div>
  </header>`;
};

const footer = (p) => `<footer class="site-footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="${p}index.html" class="logo">trend<span>code</span><b>_</b></a>
        <p class="muted">Don&#39;t just follow the future. Decode it.</p>
        <a href="${p}index.html#subscribe" class="btn btn-small">Get the weekly email <span aria-hidden="true">→</span></a>
      </div>
      <div>
        <h4>Learn</h4>
        <a href="${p}posts.html">Explainers</a>
        <a href="${p}library.html">The Library</a>
        <a href="${p}topics.html">Topics</a>
        <a href="${p}labs/index.html">Labs</a>
        <a href="${p}compiler.html">Code playground</a>
        <a href="${p}paths.html">Learning paths</a>
        <a href="${p}resources.html">Resources</a>
      </div>
      <div>
        <h4>Practise</h4>
        <a href="${p}daily.html">Daily challenge</a>
        <a href="${p}flashcards.html">Flashcards</a>
        <a href="${p}match.html">Jargon Match</a>
        <a href="${p}myths.html">Myth or Fact</a>
        <a href="${p}quiz.html">Quiz</a>
      </div>
      <div>
        <h4>Explore</h4>
        <a href="${p}threats.html">Threat landscape</a>
        <a href="${p}glossary.html">Glossary</a>
        <a href="${p}timeline.html">Timelines</a>
        <a href="${p}progress.html">Your progress</a>
        <a href="${p}saved.html">Reading list</a>
        <a href="${p}certificate.html">Certificates</a>
      </div>
      <div>
        <h4>Community</h4>
        <a href="${p}predict.html">Make a prediction</a>
        <a href="${p}chat.html">Chat servers</a>
        <a href="https://github.com/faridaaismaill12/Trendcode/issues/new?template=post-idea.md">Suggest a post</a>
        <a href="https://github.com/faridaaismaill12/Trendcode/issues/new?template=bug-report.md">Report a problem</a>
        <a href="https://github.com/faridaaismaill12/Trendcode">Source on GitHub</a>
      </div>
    </div>
    <p class="copyright">© <span id="year">2026</span> Trendcode.</p>
  </footer>`;

const files = [
  ...fs.readdirSync(root).filter((f) => f.endsWith(".html")),
  ...["posts", "labs", "library"].filter((d) => fs.existsSync(path.join(root, d))).flatMap((d) => fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith(".html")).map((f) => `${d}/${f}`)),
].filter((f) => !path.basename(f).startsWith("_"));

let changed = 0;
for (const rel of files) {
  const file = path.join(root, rel);
  const src = fs.readFileSync(file, "utf8");
  const prefix = rel === "404.html" ? "/" : rel.includes("/") ? "../" : "";
  let out = src
    .replace(/<header class="site-header">[\s\S]*?<\/header>/, header(prefix, sectionOf(rel), rel))
    .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer(prefix));
  // Every page needs the character renderer, loaded right before main.js
  const mainTag = `<script src="${prefix}assets/js/main.js"></script>`;
  const avatarTag = `<script src="${prefix}assets/js/avatar.js"></script>`;
  if (out.includes(mainTag) && !out.includes(avatarTag)) out = out.replace(mainTag, `${avatarTag}\n  ${mainTag}`);
  // Explainers and Library guides get a discussion thread under the article
  if (/^(posts|library)\/(?!index\.html$).+\.html$/.test(rel)) {
    const styleTag = `<link rel="stylesheet" href="${prefix}assets/css/style.css" />`;
    const cssTag = `<link rel="stylesheet" href="${prefix}assets/css/community.css" />`;
    const jsTag = `<script src="${prefix}assets/js/community.js"></script>`;
    if (!out.includes(cssTag)) out = out.replace(styleTag, `${styleTag}\n  ${cssTag}`);
    if (!out.includes(jsTag)) out = out.replace(mainTag, `${mainTag}\n  ${jsTag}`);
  }
  if (out !== src) { fs.writeFileSync(file, out); changed++; }
  if (!/<header class="site-header">/.test(src)) console.warn(`! no header placeholder in ${rel}`);
}
console.log(`sync-layout: ${changed} of ${files.length} pages updated`);
