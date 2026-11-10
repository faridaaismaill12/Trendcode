# Trendcode

> Computer science, decoded. Clear explainers plus hands-on browser labs on cryptography, AI security, quantum computing, algorithms and more.

🌐 **Live site:** https://faridaaismaill12.github.io/Trendcode/

A lightweight static website: plain HTML, CSS and JavaScript. No build step and no dependencies.

## What's inside

- **10 explainers** across 10 topics, each with its own illustration
- **7 interactive labs** that run in the browser, each with missions:
  Crack the Cipher · Hash Avalanche & Mining · Qubit Playground · Prompt Injection Lab · Sorting Race · Train a Neuron · Password Cracking Clock
- **Learning paths** that mix reading and labs, with progress tracking
- **XP, levels and badges**, saved in the visitor's browser (no accounts)
- **Command palette** (Ctrl/⌘ + K) to search posts, labs, topics and glossary terms
- Random-question quiz, searchable glossary with a term of the day, post-quantum timeline, light/dark theme

## Structure

```
trendcode/
├── index.html                 # Homepage
├── posts/<slug>.html          # One page per explainer
├── labs/index.html            # Labs hub
├── labs/<slug>.html           # One page per lab
├── assets/
│   ├── css/style.css          # Site styles (theme colours are variables at the top)
│   ├── css/labs.css           # Lab widget styles
│   ├── img/<slug>.svg         # Article illustrations (one per post)
│   ├── js/data.js             # ALL content data: topics, posts, labs, paths, glossary, quiz
│   ├── js/main.js             # Shared UI: homepage, post pages, progress, search
│   └── js/labs/<slug>.js      # Logic for each lab
└── README.md
```

## Run locally

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

(Opening `index.html` directly also works. The hash lab needs `http://localhost` or https for the Web Crypto API in some browsers.)

## Add a new post

1. Copy any file in `posts/` to `posts/your-slug.html`, edit the content and set `data-slug="your-slug"` on `<body>`.
2. Add an illustration at `assets/img/your-slug.svg` (1200×600).
3. Add an entry to `posts` in `assets/js/data.js`. Set `lab` to link a lab; it then appears as a "Try it yourself" card.

The homepage grid, search, topic counts, related posts and command palette update automatically.

## Add a new lab

1. Copy a page in `labs/`, set `data-lab="your-lab"` on `<body>`, and point the last `<script>` to `assets/js/labs/your-lab.js`.
2. In your script, declare missions and complete them when the learner does something:
   ```js
   const missions = tcMissions("your-lab", [{ id: "a", text: "Do the thing" }]);
   missions.complete("a"); // completing all missions completes the lab (+25 XP)
   ```
3. Add the lab to `labs` in `assets/js/data.js` (and optionally to a learning path in `paths`).

## Add a topic, glossary term or quiz question

Edit `TOPICS`, `glossary` or `quizPool` in `assets/js/data.js`. Topic icons are 24×24 SVG path strings.

## Publish (GitHub Pages)

Repo **Settings → Pages → Source: Deploy from a branch → `main` / root**.

## Next ideas

- Connect the subscribe form to a newsletter service (Buttondown, ConvertKit, Mailchimp)
- Add an Arabic version for a regional audience
- Move to a static site generator (Astro, Hugo) once there are many posts
