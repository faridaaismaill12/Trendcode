# Trendcode

> Computer science, decoded. Explainers, hands-on browser labs, daily puzzles and games on cryptography, AI security, quantum computing, algorithms and more.

🌐 **Live site:** https://faridaaismaill12.github.io/Trendcode/

A lightweight static website: plain HTML, CSS and JavaScript. No build step and no dependencies.

## Pages

| Page | What it is |
|---|---|
| `index.html` | Homepage: today's challenge, term of the day, "continue your path", previews of everything |
| `posts.html` · `posts/*.html` | All explainers (search, topic filter, sort) and the articles themselves |
| `topics.html` · `topic.html?t=<key>` | Topic index, and one page per topic with its posts, labs, terms, myths and resources |
| `labs/index.html` · `labs/*.html` | 7 interactive labs with missions |
| `activities.html` | Hub for everything below |
| `daily.html` | **Daily Challenge**: one puzzle per day (cipher, binary, Big-O or jargon), streak calendar, practice mode |
| `flashcards.html` | **Flashcards**: every glossary term, Leitner boxes, topic decks, both directions |
| `match.html` | **Jargon Match**: pair 6 terms with meanings against the clock |
| `myths.html` | **Myth or Fact**: 10 random statements per round, with explanations |
| `quiz.html` | Quiz: 5 random questions, optional topic filter |
| `glossary.html` | A–Z glossary with search, topic filter and deep links (`glossary.html#term-slug`) |
| `timeline.html` | Interactive timelines: post-quantum crypto, AI, the internet |
| `resources.html` | Curated external books, courses and tools per topic |
| `paths.html` | Learning paths mixing posts and labs |
| `certificate.html?path=<id>` | Printable certificate when a path is complete |
| `progress.html` | XP, level, badges, activity stats, backup/restore |
| `saved.html` | Reading list (☆ on any post card) |

| `login.html` | Sign in / create account (email + password, GitHub), password reset |
| `profile.html` · `profile.html?u=<username>` | Character builder, class, profile details; public profile pages |

Progress is always saved in the visitor's browser. With accounts switched on (below), signed-in users also get it **synced across devices** and a public profile.

## Accounts (Supabase)

Accounts are optional. Without them, profiles and characters still work locally. To switch them on:

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `profiles` table with Row Level Security.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key into [`assets/js/config.js`](assets/js/config.js). The anon key is meant to be public, because the security rules protect the data. **Never** use the `service_role` key.
4. In **Authentication → URL Configuration**, set the Site URL to `https://faridaaismaill12.github.io/Trendcode/` and add these redirect URLs:
   - `https://faridaaismaill12.github.io/Trendcode/profile.html`
   - `https://faridaaismaill12.github.io/Trendcode/login.html`
   - `http://localhost:8000/profile.html` and `http://localhost:8000/login.html` (for local testing)
5. *(Optional)* GitHub sign-in: create a GitHub OAuth App (callback URL `https://<project>.supabase.co/auth/v1/callback`), then paste its client ID and secret into **Authentication → Providers → GitHub**.

How sync works: on sign-in, the browser's progress is **merged** with the account's (nothing is lost on either side). After that, changes are pushed automatically. The Supabase library only loads on the login and profile pages, or when someone is signed in.

## Threat landscape (`threats.html` + homepage dashboard)

Designed as a **printed field chart** (paper, ink and a serif): hand-drawn contour rings around "you are here" (your systems & data, your people & vendors, the wider world, and a dashed ring for the future). Seven threats are marked with Roman numerals and line-drawn icons: quantum threats, AI-powered attacks, ransomware, phishing, data breaches, supply chain attacks and social engineering. Dashed routes with arrowheads show how each one reaches you, and marker size is an editorial estimate of impact (labelled as such in the figure caption).

- **Click a marker** (or a row in the atlas-style index) to read its field note: what it is, how it unfolds, a case on record, and what helps.
- **Readiness check:** each threat has 5 questions on `threats.html`. At 3 of 5, the marker is hatched over and its route fades. Answers are saved locally and synced for signed-in users.
- Icons are inline SVG line drawings (`THREAT_GLYPHS`). The design deliberately uses no emoji, glow effects or fake "live" data.

All content lives in `THREATS` in [`assets/js/threatmap.js`](assets/js/threatmap.js). Edit it there; both the homepage and the full page update. Deep links such as `threats.html#phishing` open a specific briefing.

## The Library (`library.html`, `library/*.html`)

35 structured guides in 4 categories: quantum & advanced cryptography, artificial intelligence, emerging computing, and privacy & digital security. Every guide has the same eight sections: in plain words, why it matters, how it works, a real-world example, advantages & limitations, security & privacy implications, related technologies, and further reading.

The content lives in **`content/library/*.js`** (one file per category). To add or edit a guide, change the data, then run:

```bash
node tools/build-library.js
```

This regenerates `library.html` and every `library/<slug>.html`, refreshes the search index in `data.js`, and re-stamps the shared header and footer. The build **fails with a clear message** if a guide is missing a section or links to a related guide, post or lab that doesn't exist. Related items use `lib:<slug>`, `post:<slug>`, `lab:<slug>` or plain text. Reading a guide earns 5 XP and counts toward the 🏛️ Librarian badge.

## Code playground (`compiler.html`)

A Monaco (VS Code) editor with 21 languages.

**Runs in the browser, no setup:** Python (Pyodide), JavaScript, TypeScript, Ruby (ruby.wasm), Lua (Fengari), SQL (SQLite via sql.js) and HTML/CSS/JS with a live preview. JS, TS and Python run in a Web Worker, so **Stop** works on infinite loops. Lua stops itself after 8 seconds.

**Runs on a compile server (signed-in users):** C, C++, Java, Go, Rust, C#, Kotlin, PHP, Swift, Bash, R, Haskell, Perl and Scala. These go through the Supabase Edge Function [`supabase/functions/run-code`](supabase/functions/run-code/index.ts), which forwards them to [Judge0](https://judge0.com). To switch them on:

1. Get a Judge0 API key: subscribe to **Judge0 CE** on RapidAPI (it has a free tier), or self-host Judge0.
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from the repo root run:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set JUDGE0_KEY=<your RapidAPI key>
   supabase functions deploy run-code
   ```
   If you self-host, also set `JUDGE0_URL` (and leave `JUDGE0_KEY` empty if your server has no key).
   Optional settings: `ALLOWED_ORIGIN=https://faridaaismaill12.github.io` locks the function to your site, and `RUNS_PER_10_MIN` sets the per-user limit (default 30).

The function only accepts **signed-in users**, caps code at 64 KB, and limits each run to 5 s of CPU time and 256 MB of memory. The Judge0 key stays on the server and is never sent to the browser.

## Characters

`assets/js/avatar.js` draws characters as SVG from a handful of options (hair, colours, eyes, mouth, outfit, accessory, background, class). Some options unlock with progress. Edit `LOCKS` to change the rules, or add options to `OPTIONS` and a drawing branch in `svg()`.

## Homepage terminal

The homepage terminal (`assets/js/pages/home.js`, `CMDS`) understands `help`, `ls`, `learn`, `read`, `lab`, `open`, `daily`, `hash`, `define`, `whoami`, `random`, `theme`, `login`/`logout`, `subscribe` and a few easter eggs. Add a command by adding an entry to `CMDS`.

## Structure

```
assets/
  css/style.css        site + page styles (theme colours are variables at the top)
  css/labs.css         lab widget styles
  img/<slug>.svg       one illustration per post
  js/data.js           ALL content: topics, posts, labs, paths, glossary, quiz, myths, timelines, resources, activities
  js/main.js           shared: header/menu, search palette (Ctrl/⌘+K), progress & badges, cards, post + lab pages
  js/avatar.js         character options, unlocks and SVG renderer
  js/config.js         Supabase URL + anon key (empty = local-only mode)
  js/account.js        sign-in, profile storage, progress sync (loaded on demand)
supabase/schema.sql    database table + security rules for accounts
  js/pages/*.js        one script per section page
  js/labs/*.js         one script per lab
tools/sync-layout.js   stamps the shared header & footer into every page
```

## The shared header & footer

Header and footer markup lives in **one place**: `tools/sync-layout.js`. After changing it, or after adding a page, run:

```bash
node tools/sync-layout.js
```

New pages only need empty placeholders: `<header class="site-header"></header>` and `<footer class="site-footer"></footer>`.

## Adding content

- **Post:** copy a file in `posts/`, set `data-slug` on `<body>`, add `assets/img/<slug>.svg`, add an entry to `posts` in `data.js`, run the sync script.
- **Lab:** copy a page in `labs/`, set `data-lab`, write `assets/js/labs/<slug>.js` using `tcMissions(...)`, add it to `labs` in `data.js`.
- **Term / quiz question / myth / resource / timeline event:** add it to the matching array in `data.js`. Flashcards, Jargon Match, the daily challenge, topic pages and search pick it up automatically.

## Run locally

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Publish (GitHub Pages)

Repo **Settings → Pages → Source: Deploy from a branch → `main` / root**.

## Next ideas

- Connect the subscribe form to a newsletter service (Buttondown, ConvertKit, Mailchimp)
- Add an Arabic version for a regional audience
- Move to a static site generator (Astro, Hugo) once there are many posts
