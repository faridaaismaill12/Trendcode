# Trendcode

> Computer science, decoded. Clear explainers on post-quantum cryptography, AI security, quantum computing and emerging tech.

🌐 **Live site:** https://faridaaismaill12.github.io/Trendcode/

A lightweight static website: plain HTML, CSS and JavaScript. No build step and no dependencies.

## Structure

```
trendcode/
├── index.html              # Homepage (hero, topics, latest posts, subscribe)
├── posts/                  # One HTML file per article
│   └── what-is-post-quantum-cryptography.html
├── assets/
│   ├── css/style.css       # All styles (colors are variables at the top)
│   └── js/main.js          # Post list + subscribe form
└── README.md
```

## Run locally

Open `index.html` in your browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Add a new post

1. Copy `posts/what-is-post-quantum-cryptography.html` to `posts/your-post-slug.html` and edit the content.
2. Add an entry at the top of the `posts` array in `assets/js/main.js`.

## Push to GitHub

```bash
git remote add origin https://github.com/faridaaismaill12/Trendcode.git
git branch -M main
git push -u origin main
```

## Publish for free (GitHub Pages)

Repo **Settings → Pages → Source: Deploy from a branch → `main` / root**. The site goes live at `https://faridaaismaill12.github.io/Trendcode/`. You can add a custom domain like `trendcode.dev` later.

## Next ideas

- Connect the subscribe form to a newsletter service (Buttondown, ConvertKit, Mailchimp)
- Add an Arabic version for a regional audience
- Move to a static site generator (Astro, Hugo) once there are many posts
