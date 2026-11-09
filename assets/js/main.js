// Add new posts here — newest first. They appear on the homepage automatically.
const posts = [
  {
    title: "What is Post-Quantum Cryptography (and why should you care)?",
    url: "posts/what-is-post-quantum-cryptography.html",
    date: "2026-11-09",
    topic: "Post-Quantum",
    readTime: "6 min",
  },
];

const list = document.getElementById("post-list");
if (list) {
  list.innerHTML = posts
    .map(
      (p) => `
      <li>
        <a href="${p.url}">
          <span class="post-meta">${p.date} · ${p.topic} · ${p.readTime}</span>
          <h3>${p.title}</h3>
        </a>
      </li>`
    )
    .join("");
}

// Placeholder subscribe handler — connect to Mailchimp, Buttondown, ConvertKit, etc.
const form = document.getElementById("subscribe-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("form-note").textContent =
      "Thanks! You're on the list. (Connect a newsletter service to make this real.)";
    form.reset();
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
