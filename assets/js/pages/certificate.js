// Certificates: printable completion certificate for a finished learning path (?path=id).
(function () {
  const box = $("#cert-box");
  if (!box) return;
  const id = new URLSearchParams(location.search).get("path");
  const path = paths.find((p) => p.id === id);

  if (!path) {
    box.innerHTML = `<div class="cert-list">${paths.map((p) => {
      const pc = progress.pathPct(p);
      return `<a class="cert-chip${pc === 100 ? " earned" : ""}" href="?path=${p.id}">
        <span>${pc === 100 ? "🎓" : "🔒"}</span><strong>${escapeHtml(p.title)}</strong>
        <small>${pc === 100 ? "Earned · view & print" : `${pc}% complete`}</small>
        <div class="path-bar"><span style="width:${pc}%"></span></div></a>`;
    }).join("")}</div>`;
    return;
  }

  const pct = progress.pathPct(path);
  const itemOf = ([kind, slug]) => (kind === "post" ? posts.find((p) => p.slug === slug) : labs.find((l) => l.slug === slug));

  if (pct < 100) {
    box.innerHTML = `
      <div class="panel">
        <h2>🔒 ${escapeHtml(path.title)}: ${pct}% complete</h2>
        <p class="muted">Finish every step to unlock your certificate. Here's what's left:</p>
        <ol class="path-steps">${path.steps.map((s) => {
          const it = itemOf(s);
          return `<li class="${progress.stepDone(s) ? "done" : ""}"><a href="${s[0] === "post" ? postUrl(it) : labUrl(it)}"><span class="step-kind">${s[0] === "post" ? "📖 Read" : "🧪 Lab"}</span>${escapeHtml(it.title)}</a></li>`;
        }).join("")}</ol>
        <p><a class="text-link" href="?">← All certificates</a></p>
      </div>`;
    return;
  }

  const dates = store.get("tc-cert-dates", {});
  if (!dates[path.id]) { dates[path.id] = todayKey(); store.set("tc-cert-dates", dates); }
  const date = new Date(dates[path.id] + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const serial = (path.id + dates[path.id]).split("").reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 7).toString(36).toUpperCase().slice(0, 6);

  box.innerHTML = `
    <div class="cert-controls">
      <label class="field"><span>Name on the certificate</span><input type="text" id="cert-name" maxlength="60" placeholder="Your name" value="${escapeHtml(store.get("tc-name", ""))}" /></label>
      <div class="btn-row"><button type="button" class="btn" id="print">🖨 Print or save as PDF</button><a class="btn btn-ghost" href="?">All certificates</a></div>
    </div>
    <div class="certificate path-${path.color}">
      <div class="cert-inner">
        <p class="cert-logo">trend<span>code</span><b>_</b></p>
        <p class="cert-kicker">Certificate of completion</p>
        <p class="cert-small">This certifies that</p>
        <h2 class="cert-name" id="cert-name-out">Your name</h2>
        <p class="cert-small">has completed the learning path</p>
        <h3 class="cert-path">${escapeHtml(path.title)}</h3>
        <p class="cert-desc">${escapeHtml(path.blurb)}</p>
        <ul class="cert-steps">${path.steps.map((s) => `<li>${s[0] === "post" ? "📖" : "🧪"} ${escapeHtml(itemOf(s).title)}</li>`).join("")}</ul>
        <div class="cert-foot">
          <div><strong>${date}</strong><small>Date completed</small></div>
          <div class="cert-seal">🎓</div>
          <div><strong>TC-${serial}</strong><small>Certificate ID</small></div>
        </div>
        <p class="cert-note">Self-paced learning on Trendcode. Progress recorded in the learner's browser.</p>
      </div>
    </div>`;

  const input = $("#cert-name"), out = $("#cert-name-out");
  const paint = () => (out.textContent = input.value.trim() || "Your name");
  input.addEventListener("input", () => { store.set("tc-name", input.value); paint(); });
  paint();
  $("#print").addEventListener("click", () => window.print());
})();
