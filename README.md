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
