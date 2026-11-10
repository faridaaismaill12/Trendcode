#!/usr/bin/env node
// Builds the Library from content/library/*.js:
//   library.html (index) + library/<slug>.html (one page per topic)
//   and refreshes the small `libraryIndex` block in assets/js/data.js (used by search).
// Usage (from the repo root):  node tools/build-library.js
// Then the shared header/footer are stamped in by tools/sync-layout.js (run automatically).

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const out = (p) => path.join(root, p);

const CATS = [
  { key: "crypto", file: "crypto", title: "Quantum & advanced cryptography", short: "Cryptography", icon: "🔐",
    blurb: "The maths and physics protecting secrets in a world with quantum computers." },
  { key: "ai", file: "ai", title: "Artificial intelligence", short: "AI", icon: "🤖",
    blurb: "How modern AI systems act, retrieve, learn and fail, and how they're governed." },
  { key: "emerging", file: "emerging", title: "Emerging computing", short: "Emerging", icon: "⚡",
    blurb: "New kinds of computers and interfaces, from brain-like chips to DNA." },
  { key: "privacy", file: "privacy", title: "Privacy & digital security", short: "Privacy", icon: "🛡️",
    blurb: "Identity, trust, privacy and the practices that keep software and people safe." },
];

// ---------- load + validate ----------
const entries = [];
for (const c of CATS) {
  const list = require(path.join(root, "content", "library", c.file + ".js"));
  list.forEach((e) => entries.push({ ...e, cat: c.key }));
}
const bySlug = Object.fromEntries(entries.map((e) => [e.slug, e]));
const dataJs = fs.readFileSync(out("assets/js/data.js"), "utf8");
const postSlugs = new Set([...dataJs.matchAll(/slug: "([a-z0-9-]+)", short/g)].map((m) => m[1]));
const postTitles = Object.fromEntries([...dataJs.matchAll(/slug: "([a-z0-9-]+)", short: "[^"]*",\s*title: "([^"]+)"/g)].map((m) => [m[1], m[2]]));
const labFiles = new Set(fs.readdirSync(out("labs")).map((f) => f.replace(/\.html$/, "")));

const problems = [];
const REQUIRED = ["slug", "title", "level", "summary", "beginner", "why", "how", "example", "pros", "cons", "security", "related", "reading"];
const seen = new Set();
for (const e of entries) {
  if (seen.has(e.slug)) problems.push(`duplicate slug ${e.slug}`);
  seen.add(e.slug);
  for (const k of REQUIRED) if (!e[k] || (Array.isArray(e[k]) && !e[k].length)) problems.push(`${e.slug}: missing ${k}`);
  for (const r of e.related || []) {
    const [kind, ref] = r.includes(":") ? r.split(":") : [null, r];
    if (kind === "lib" && !bySlug[ref]) problems.push(`${e.slug}: related lib:${ref} not found`);
    if (kind === "post" && !postSlugs.has(ref)) problems.push(`${e.slug}: related post:${ref} not found`);
    if (kind === "lab" && !labFiles.has(ref)) problems.push(`${e.slug}: related lab:${ref} not found`);
  }
  for (const [t, u] of e.reading || []) if (!/^https:\/\//.test(u)) problems.push(`${e.slug}: reading link must be https: ${t}`);
}
if (problems.length) { console.error("Library content problems:\n - " + problems.join("\n - ")); process.exit(1); }

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (s) => String(s).replace(/<[^>]+>/g, "");
const words = (e) => strip([e.beginner, e.why, ...e.how, e.example.text, ...e.pros, ...e.cons, ...e.security].join(" ")).split(/\s+/).length;
const minutes = (e) => Math.max(3, Math.round(words(e) / 220));
const catOf = (k) => CATS.find((c) => c.key === k);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

const relatedChip = (r, prefix) => {
  if (!r.includes(":")) return `<span class="lib-chip plain">${esc(r)}</span>`;
  const [kind, ref] = r.split(":");
  if (kind === "lib") return `<a class="lib-chip" href="${prefix}library/${ref}.html"><small>library</small>${esc(bySlug[ref].title)}</a>`;
  if (kind === "post") return `<a class="lib-chip post" href="${prefix}posts/${ref}.html"><small>explainer</small>${esc(postTitles[ref] || ref)}</a>`;
  if (kind === "lab") return `<a class="lib-chip lab" href="${prefix}labs/${ref}.html"><small>lab</small>${esc(ref.replace(/-/g, " "))}</a>`;
  return `<span class="lib-chip plain">${esc(ref)}</span>`;
};

const head = (title, desc, prefix, extraCss = "") => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} — Trendcode</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml" />
  <script>try{var t=localStorage.getItem("tc-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
  <link rel="stylesheet" href="${prefix}assets/css/style.css" />
  <link rel="stylesheet" href="${prefix}assets/css/library.css" />${extraCss}
</head>`;
const scripts = (prefix, page) => `
  <script src="${prefix}assets/js/data.js"></script>
  <script src="${prefix}assets/js/avatar.js"></script>
  <script src="${prefix}assets/js/main.js"></script>${page ? `\n  <script src="${prefix}assets/js/pages/${page}.js"></script>` : ""}`;

// ---------- topic pages ----------
fs.mkdirSync(out("library"), { recursive: true });
for (const c of CATS) {
  const list = entries.filter((e) => e.cat === c.key);
  list.forEach((e, i) => {
    const prev = list[i - 1], next = list[i + 1];
    const p = "../";
    const html = `${head(e.title, e.summary, p)}
<body data-base="../" data-lib="${e.slug}">
  <header class="site-header"></header>

  <main>
    <article class="article lib-article">
      <p class="eyebrow">// <a href="../library.html">library</a> · <a href="../library.html#${c.key}">${esc(c.title.toLowerCase())}</a></p>
      <h1>${esc(e.title)}</h1>
      <p class="lib-summary">${esc(e.summary)}</p>
      <div class="lib-meta">
        <span class="pill">${c.icon} ${esc(c.short)}</span>
        <span class="pill lvl-${e.level.toLowerCase()}">${esc(e.level)}</span>
        <span class="pill">${minutes(e)} min read</span>
        <span class="lib-read-state" id="lib-read-state"></span>
      </div>

      <section class="lib-sec" id="in-plain-words">
        <h2 data-label="In plain words"><span class="sec-no">01</span>In plain words</h2>
        <p class="lib-lede">${e.beginner}</p>
      </section>

      <section class="lib-sec" id="why-it-matters">
        <h2 data-label="Why it matters"><span class="sec-no">02</span>Why it matters</h2>
        <p>${e.why}</p>
      </section>

      <section class="lib-sec" id="how-it-works">
        <h2 data-label="How it works"><span class="sec-no">03</span>How it works</h2>
        <ol class="lib-steps">
          ${e.how.map((s) => `<li>${s}</li>`).join("\n          ")}
        </ol>
      </section>

      <section class="lib-sec" id="real-world-example">
        <h2 data-label="Real-world example"><span class="sec-no">04</span>Real-world example</h2>
        <div class="lib-example">
          <h3>${esc(e.example.title)}</h3>
          <p>${e.example.text}</p>
        </div>
      </section>

      <section class="lib-sec" id="advantages-and-limitations">
        <h2 data-label="Advantages & limitations"><span class="sec-no">05</span>Advantages &amp; limitations</h2>
        <div class="lib-pc">
          <div class="lib-pros"><h3>Advantages</h3><ul>${e.pros.map((x) => `<li>${x}</li>`).join("")}</ul></div>
          <div class="lib-cons"><h3>Limitations</h3><ul>${e.cons.map((x) => `<li>${x}</li>`).join("")}</ul></div>
        </div>
      </section>

      <section class="lib-sec" id="security-and-privacy">
        <h2 data-label="Security & privacy"><span class="sec-no">06</span>Security &amp; privacy implications</h2>
        <ul class="lib-security">${e.security.map((x) => `<li>${x}</li>`).join("")}</ul>
      </section>

      <section class="lib-sec" id="related-technologies">
        <h2 data-label="Related technologies"><span class="sec-no">07</span>Related technologies</h2>
        <div class="lib-related">${e.related.map((r) => relatedChip(r, p)).join("")}</div>
      </section>

      <section class="lib-sec" id="further-reading">
        <h2 data-label="Further reading"><span class="sec-no">08</span>Further reading</h2>
        <ul class="lib-reading">${e.reading.map(([t, u, src]) =>
          `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} <span aria-hidden="true">↗</span></a><span>${esc(src || host(u))}</span></li>`).join("")}</ul>
      </section>

      <nav class="lib-pager" aria-label="More in ${esc(c.title)}">
        ${prev ? `<a href="${prev.slug}.html"><small>← previous</small>${esc(prev.title)}</a>` : `<a href="../library.html"><small>← back to</small>The Library</a>`}
        ${next ? `<a href="${next.slug}.html" class="next"><small>next →</small>${esc(next.title)}</a>` : `<a href="../library.html" class="next"><small>back to →</small>The Library</a>`}
      </nav>
    </article>
  </main>

  <footer class="site-footer"></footer>
${scripts(p)}
</body>
</html>
`;
    fs.writeFileSync(out(`library/${e.slug}.html`), html);
  });
}

// ---------- index page ----------
const totalMin = entries.reduce((s, e) => s + minutes(e), 0);
const indexHtml = `${head("The Library", "A structured library of plain-language guides to quantum cryptography, AI, emerging computing and digital privacy: how each works, why it matters, real examples, trade-offs and further reading.", "")}
<body data-base="" class="lib-index">
  <header class="site-header"></header>

  <main class="page">
    <section class="page-hero lib-hero">
      <p class="eyebrow">// the library</p>
      <h1>${entries.length} technologies, <em>explained properly.</em></h1>
      <p class="lead">Every guide follows the same eight steps: plain-words explanation, why it matters, how it works, a real example, trade-offs, security &amp; privacy, related tech and further reading. Start anywhere.</p>
      <div class="lib-stats">
        <span><strong>${entries.length}</strong> guides</span>
        <span><strong>${CATS.length}</strong> categories</span>
        <span><strong>~${Math.round(totalMin / 60)} h</strong> of reading</span>
        <span id="lib-progress"><strong>0</strong> read</span>
      </div>
    </section>

    <div class="lib-tools">
      <input type="search" class="input" id="lib-search" placeholder="Search the library…  e.g. “privacy”, “quantum”, “agents”" aria-label="Search the library" />
      <div class="chips" id="lib-cats" role="group" aria-label="Category">
        <button type="button" class="chip active" data-cat="all">All</button>
        ${CATS.map((c) => `<button type="button" class="chip" data-cat="${c.key}">${c.icon} ${esc(c.short)}</button>`).join("\n        ")}
      </div>
    </div>

    ${CATS.map((c) => {
      const list = entries.filter((e) => e.cat === c.key);
      return `<section class="lib-cat" id="${c.key}" data-cat="${c.key}">
      <header class="lib-cat-head">
        <span class="lib-cat-icon" aria-hidden="true">${c.icon}</span>
        <div><h2>${esc(c.title)}</h2><p class="muted">${esc(c.blurb)}</p></div>
        <span class="lib-cat-count">${list.length} guides</span>
      </header>
      <ol class="lib-list">
        ${list.map((e, i) => `<li class="lib-item" data-slug="${e.slug}" data-search="${esc((e.title + " " + e.summary + " " + c.title + " " + strip(e.beginner)).toLowerCase())}">
          <a href="library/${e.slug}.html">
            <span class="lib-no">${String(i + 1).padStart(2, "0")}</span>
            <span class="lib-main"><strong>${esc(e.title)}</strong><span>${esc(e.summary)}</span></span>
            <span class="lib-side"><span class="lvl lvl-${e.level.toLowerCase()}">${esc(e.level)}</span><span>${minutes(e)} min</span><span class="lib-done" aria-label="read"></span></span>
          </a>
        </li>`).join("\n        ")}
      </ol>
    </section>`;
    }).join("\n\n    ")}

    <p class="empty" id="lib-empty" hidden>Nothing matches that yet. <a class="text-link" href="https://github.com/faridaaismaill12/Trendcode/issues/new?template=post-idea.md">Suggest a topic →</a></p>
  </main>

  <footer class="site-footer"></footer>
${scripts("", "library")}
</body>
</html>
`;
fs.writeFileSync(out("library.html"), indexHtml);

// ---------- search index block in data.js ----------
const block = `// <library-index> (generated by tools/build-library.js, do not edit by hand)
const LIBRARY_CATS = ${JSON.stringify(Object.fromEntries(CATS.map((c) => [c.key, c.title])))};
const libraryIndex = ${JSON.stringify(entries.map((e) => [e.slug, e.title, e.cat, e.summary]), null, 0).replace(/\],\[/g, "],\n  [")};
// </library-index>`;
let data = fs.readFileSync(out("assets/js/data.js"), "utf8");
data = /\/\/ <library-index>[\s\S]*?\/\/ <\/library-index>/.test(data)
  ? data.replace(/\/\/ <library-index>[\s\S]*?\/\/ <\/library-index>/, block)
  : data.trimEnd() + "\n\n" + block + "\n";
fs.writeFileSync(out("assets/js/data.js"), data);

console.log(`build-library: ${entries.length} guides in ${CATS.length} categories, ~${totalMin} min of reading`);
require("./sync-layout.js");
