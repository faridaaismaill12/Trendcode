// =============================================================
// Trendcode threat landscape: data + interactive attack-surface map.
// Used by the homepage dashboard and threats.html. Needs main.js first.
// =============================================================
const THREATS = [
  {
    id: "quantum", name: "Quantum threats", color: "#a78bfa",
    ring: 3, angle: -58, impact: 5, horizon: "future", trend: "approaching",
    tagline: "Tomorrow's computers, today's secrets.",
    what: "A large, error-corrected quantum computer running Shor's algorithm could break the public-key cryptography (RSA, elliptic curves) that protects almost every secure connection, software update and digital signature today. Such a machine doesn't exist yet, but data stolen now can be decrypted later.",
    chain: ["Attacker records encrypted traffic today", "Stores it cheaply for years", "Quantum computer matures", "Shor's algorithm recovers the keys", "Old secrets are exposed"],
    example: { title: "The race to migrate first", year: "2022–2035", text: "No quantum computer has broken real-world encryption yet, but governments are acting as if one will. In 2022 the US NSA published CNSA 2.0, requiring national-security systems to move to quantum-resistant algorithms on deadlines running from 2025 to 2033. NIST published the first post-quantum standards in 2024, and estimates of the qubits needed to break RSA-2048 have fallen from about 20 million (2019) to under a million (2025)." },
    defenses: ["Inventory where RSA and elliptic-curve cryptography are used", "Prioritise data that must stay secret for years", "Adopt hybrid post-quantum key exchange (X25519 + ML-KEM)", "Build crypto-agility so algorithms can be swapped quickly", "Ask vendors for their post-quantum roadmap"],
    checks: ["My devices and browsers are kept up to date (they already use hybrid post-quantum TLS)", "I know which of my systems rely on RSA or elliptic-curve keys", "Data that must stay secret for 10+ years has been identified", "There's a plan to swap cryptographic algorithms without rewriting systems", "Key vendors have been asked about post-quantum support"],
    related: [["post", "what-is-post-quantum-cryptography", "What is post-quantum cryptography?"], ["lib", "hybrid-key-exchange", "Hybrid key exchange"], ["lib", "cryptographic-agility", "Cryptographic agility"], ["lab", "qubit-playground", "Qubit Playground"]],
  },
  {
    id: "ai", name: "AI-powered attacks", color: "#22d3ee",
    ring: 3, angle: 196, impact: 4, horizon: "now", trend: "rising fast",
    tagline: "Scams that sound exactly like your boss.",
    what: "Attackers use AI to scale and sharpen old tricks: flawless phishing emails in any language, cloned voices, deepfake video calls, automated vulnerability hunting, and malicious instructions hidden in content that AI assistants read (prompt injection).",
    chain: ["Scrape public audio, video and writing", "Generate a convincing clone or message", "Contact the target urgently", "Pressure them to pay or share access", "Funds or data disappear"],
    example: { title: "The deepfake video call", year: "2024", text: "An employee in the Hong Kong office of engineering firm Arup joined a video call with what appeared to be the company's CFO and several colleagues. Every other participant was a deepfake. Convinced, the employee made a series of transfers totalling about HK$200 million (roughly US$25 million) to the fraudsters." },
    defenses: ["Verify unusual requests on a second, known channel", "Require two-person approval for payments and access changes", "Agree family or team code words for emergencies", "Limit the permissions of AI agents and treat their inputs as untrusted", "Train people that voices and faces can now be faked"],
    checks: ["I'd call back on a known number before acting on an urgent voice or video request", "Payments or access changes need approval from two people", "My family or team has a code word for emergencies", "AI assistants I use can't send email or money without asking me", "I know that voices and video can be convincingly faked"],
    related: [["post", "prompt-injection-explained", "Prompt injection, explained"], ["lab", "injection-lab", "Prompt Injection Lab"], ["lib", "adversarial-machine-learning", "Adversarial machine learning"], ["lib", "ai-model-security", "AI model security"]],
  },
  {
    id: "ransomware", name: "Ransomware", color: "#f87171",
    ring: 1, angle: -24, impact: 5, horizon: "now", trend: "persistent",
    tagline: "Your files, held hostage.",
    what: "Ransomware is malware that encrypts an organisation's files and systems, then demands payment for the key. Modern gangs also steal data first and threaten to leak it (“double extortion”), and many operate as businesses that rent their tools to affiliates.",
    chain: ["Initial access: phishing, stolen password or unpatched server", "Escalate privileges and move across the network", "Steal sensitive data", "Delete backups and encrypt everything", "Ransom note and leak threat"],
    example: { title: "Colonial Pipeline", year: "2021", text: "In May 2021 the DarkSide ransomware group got into Colonial Pipeline, which carries about 45% of the fuel on the US East Coast, reportedly through an old VPN account protected only by a password. The company shut the pipeline down for several days, causing fuel shortages, and paid a ransom of about US$4.4 million, part of which the FBI later recovered." },
    defenses: ["Keep offline or immutable backups, and test restoring them", "Patch internet-facing systems quickly", "Use phishing-resistant MFA, especially for remote access", "Segment networks so one breach can't reach everything", "Rehearse an incident-response plan"],
    checks: ["My important files are backed up somewhere ransomware can't reach (offline or versioned)", "I've actually tested restoring from that backup", "Remote access and admin accounts use MFA", "Systems and apps install security updates automatically", "There's a written plan for what to do if files get encrypted"],
    related: [["lib", "zero-trust-architecture", "Zero trust architecture"], ["lib", "secure-software-development", "Secure software development"], ["post", "how-passkeys-work", "How passkeys work"]],
  },
  {
    id: "phishing", name: "Phishing", color: "#fbbf24",
    ring: 2, angle: 22, impact: 4, horizon: "now", trend: "most common",
    tagline: "One click is all it takes.",
    what: "Phishing uses fake emails, texts or websites that imitate someone you trust (your bank, a delivery company, your IT team) to trick you into entering a password, paying an invoice or opening malware. It's the most common first step in cyberattacks.",
    chain: ["Attacker registers a lookalike domain", "Sends an urgent, believable message", "Victim clicks and lands on a fake login page", "Credentials or payment captured", "Account takeover or fraud"],
    example: { title: "The US$100 million fake invoices", year: "2013–2015", text: "A Lithuanian man set up a company named after a real Taiwanese hardware supplier and emailed fake invoices to Google and Facebook staff. Over two years the companies wired more than US$100 million before the fraud was discovered. He was later sentenced to five years in prison. If it can happen to tech giants, it can happen to anyone." },
    defenses: ["Use passkeys or security keys, which phishing sites can't steal", "Check the real domain before entering a password", "Verify payment-detail changes by phone", "Turn on email authentication (SPF, DKIM, DMARC) for your domains", "Make reporting suspicious messages quick and blame-free"],
    checks: ["My most important accounts use passkeys or a security key", "I use a password manager (it won't autofill on fake sites)", "I check the sender's real address and the link's real domain before clicking", "Changes to bank details are always confirmed by phone", "I know how to report a suspicious email"],
    related: [["post", "how-passkeys-work", "How passkeys work"], ["lab", "password-lab", "Password Cracking Clock"], ["lib", "digital-identity", "Digital identity"], ["lab", "injection-lab", "Prompt Injection Lab"]],
  },
  {
    id: "breach", name: "Data breaches", color: "#38bdf8",
    ring: 1, angle: 152, impact: 4, horizon: "now", trend: "persistent",
    tagline: "When your data walks out the door.",
    what: "A data breach is any incident where personal or confidential data is accessed or exposed without permission: hackers exploiting a vulnerability, a misconfigured cloud bucket, a lost laptop or an insider. Stolen data fuels identity theft, fraud and further attacks.",
    chain: ["Find a weakness: unpatched app, exposed database, stolen login", "Get in and look around quietly", "Locate valuable data", "Copy it out slowly to avoid alarms", "Sell, leak or exploit it"],
    example: { title: "Equifax", year: "2017", text: "Attackers exploited a known vulnerability in the Apache Struts web framework on an Equifax dispute portal. A patch had been available for about two months. Over several weeks they took personal data, including Social Security numbers, of roughly 147 million people. The breach became a textbook case for patching and data minimisation." },
    defenses: ["Patch quickly, starting with internet-facing systems", "Collect and keep less data", "Encrypt sensitive data at rest and in transit", "Grant least-privilege access and monitor for unusual exports", "Have a breach-response and notification plan"],
    checks: ["I use a different password for every account (a password manager helps)", "I'd find out if my email appeared in a breach (for example via a breach-alert service)", "My devices are encrypted and lock automatically", "Old accounts and data I no longer need get deleted", "Cloud storage and shared links are private by default"],
    related: [["lib", "data-anonymization", "Data anonymization"], ["lib", "differential-privacy", "Differential privacy"], ["post", "hashing-explained", "Hashing, explained"], ["lib", "zero-trust-architecture", "Zero trust architecture"]],
  },
  {
    id: "supply", name: "Supply chain attacks", color: "#34d399",
    ring: 2, angle: -112, impact: 5, horizon: "now", trend: "rising",
    tagline: "Trusted delivery, hidden payload.",
    what: "Instead of attacking you directly, attackers compromise something you already trust, such as a software vendor, an open-source library, a build system or an IT provider, so the attack arrives signed and through official updates.",
    chain: ["Compromise a vendor, library or build pipeline", "Insert malicious code into a legitimate product", "Product is signed and shipped as normal", "Thousands of customers install the update", "Attacker gains quiet access to many targets at once"],
    example: { title: "SolarWinds and the xz backdoor", year: "2020 & 2024", text: "In 2020 attackers broke into SolarWinds' build system and hid a backdoor in updates to its Orion software, which around 18,000 customers installed, including US government agencies. In 2024 a backdoor patiently planted over years in the open-source xz compression library was caught just before it spread, by an engineer investigating a half-second slowdown in SSH logins." },
    defenses: ["Keep a software bill of materials (SBOM)", "Pin and verify dependencies with checksums and signatures", "Harden and isolate build pipelines", "Give vendor software least privilege and monitor its behaviour", "Have a plan to respond when a supplier is compromised"],
    checks: ["I only install software and extensions from official sources", "Dependencies in my projects are pinned and scanned for known vulnerabilities", "Our build pipeline's secrets and signing keys are tightly protected", "We know which suppliers have access to our systems", "Browser extensions and apps are reviewed and pruned regularly"],
    related: [["lib", "supply-chain-security", "Supply chain security"], ["lib", "digital-signatures", "Digital signatures"], ["lib", "secure-software-development", "Secure software development"], ["post", "hashing-explained", "Hashing, explained"]],
  },
  {
    id: "social", name: "Social engineering", color: "#fb7185",
    ring: 2, angle: 92, impact: 4, horizon: "now", trend: "evergreen",
    tagline: "Hacking humans, not machines.",
    what: "Social engineering manipulates people into breaking security: a phone call pretending to be IT support, a stranger tailgating through a door, a fake recruiter, a “friend” in trouble. It exploits trust, helpfulness, urgency and fear rather than technical flaws.",
    chain: ["Research the target on LinkedIn and social media", "Build a believable pretext", "Contact the help desk or an employee", "Use urgency or authority to bypass checks", "Get a password reset, MFA change or physical access"],
    example: { title: "MGM Resorts", year: "2023", text: "Attackers found an MGM Resorts employee on LinkedIn, then called the IT help desk pretending to be them and persuaded staff to reset their credentials. That foothold led to a ransomware attack that disrupted hotel systems, slot machines and room keys for days. MGM estimated the hit at around US$100 million." },
    defenses: ["Strict identity checks for help-desk resets and MFA changes", "A culture where it's always fine to say “let me call you back”", "Limit what staff share publicly about internal roles and systems", "Phishing-resistant MFA that a phone call can't bypass", "Regular, realistic awareness training"],
    checks: ["I'd hang up and call back on an official number if someone claiming to be IT or my bank called me", "I'm careful about what I share publicly about my job and routines", "I never share one-time codes, even with “support”", "At work, password resets require proper identity checks", "I feel comfortable saying no to urgent requests until they're verified"],
    related: [["lib", "digital-identity", "Digital identity"], ["lib", "zero-trust-architecture", "Zero trust architecture"], ["post", "how-passkeys-work", "How passkeys work"], ["lab", "password-lab", "Password Cracking Clock"]],
  },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// Single-stroke line glyphs, drawn on a 24×24 grid (no emoji)
const THREAT_GLYPHS = {
  quantum: '<ellipse cx="12" cy="12" rx="9.5" ry="3.6"/><ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(-60 12 12)"/><circle cx="12" cy="12" r="1.4" class="g-fill"/>',
  ai: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/><path d="M9.5 14.5l1.6-5h1.8l1.6 5M10.2 12.6h3.6"/>',
  ransomware: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.2v2.6"/>',
  phishing: '<path d="M12 2.5v9.5a4.5 4.5 0 1 1-9 0"/><path d="M3 12l-1.6-1.8M3 12l1.9-1.3"/><circle cx="12" cy="2.5" r="0.9" class="g-fill"/><path d="M15.5 8.5c2.2.4 4 1.6 5.2 3.5-1.2 1.9-3 3.1-5.2 3.5"/>',
  breach: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v9c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-9M5 10c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/><path d="M16 17.5c0 1-.9 2.7-1.6 3.8-.7-1.1-1.6-2.8-1.6-3.8a1.6 1.6 0 0 1 3.2 0z"/>',
  supply: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/><path d="M7.5 5.2l9 4.6"/>',
  social: '<path d="M2.5 9.5c2-2 5-2.6 9.5-.8 4.5-1.8 7.5-1.2 9.5.8-.4 3.6-2.6 6-5.6 6-1.6 0-2.8-1-3.9-2.4-1.1 1.4-2.3 2.4-3.9 2.4-3 0-5.2-2.4-5.6-6z"/><path d="M7 10.8c.8-.5 1.8-.5 2.6 0M14.4 10.8c.8-.5 1.8-.5 2.6 0"/>',
};
const threatGlyph = (id, size = 22, cls = "glyph") =>
  `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${THREAT_GLYPHS[id] || ""}</svg>`;

// Concentric bands, labelled like the contours on a chart
const RINGS = [
  { r: 96, label: "your systems & data" },
  { r: 176, label: "your people & vendors" },
  { r: 256, label: "the wider world" },
];

// Self-check state: { threatId: [indexes ticked] }
const threatChecks = {
  get: () => store.get("tc-threat-checks", {}),
  readiness(id) {
    const t = THREATS.find((x) => x.id === id);
    const done = (this.get()[id] || []).filter((i) => i < t.checks.length).length;
    return { done, total: t.checks.length, pct: Math.round((done / t.checks.length) * 100) };
  },
  overall() {
    const all = THREATS.reduce((s, t) => s + t.checks.length, 0);
    const done = THREATS.reduce((s, t) => s + this.readiness(t.id).done, 0);
    return { done, total: all, pct: Math.round((done / all) * 100) };
  },
  toggle(id, i) {
    const s = this.get();
    const list = new Set(s[id] || []);
    list.has(i) ? list.delete(i) : list.add(i);
    s[id] = [...list].sort((a, b) => a - b);
    store.set("tc-threat-checks", s);
    document.dispatchEvent(new CustomEvent("tc-threats"));
    document.dispatchEvent(new CustomEvent("tc-progress"));
  },
};

// Hand-drawn feeling: a closed, slightly wobbly loop through n points, smoothed with Catmull-Rom curves.
function wobblyRing(cx, cy, r, seed) {
  const n = 28, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.035 * Math.sin(3 * a + seed) + 0.022 * Math.sin(5 * a + seed * 1.7) + 0.012 * Math.sin(9 * a + seed * 2.3);
    pts.push([cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

// ---------- the chart ----------
function renderThreatMap(svg, { onSelect, selected } = {}) {
  const W = 760, H = 600, cx = 380, cy = 300;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const pos = (t) => {
    const r = t.ring === 3 ? 262 : RINGS[t.ring - 1].r + (t.ring === 1 ? 18 : 10);
    const a = (t.angle * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const items = THREATS.map((t, i) => {
    const [x, y] = pos(t);
    const mx = (x + cx) / 2, my = (y + cy) / 2;
    const nx = -(y - cy), ny = x - cx, len = Math.hypot(nx, ny) || 1;
    // stop the route just outside the centre marker
    const back = 30 / Math.hypot(x - cx, y - cy);
    const ex = cx + (x - cx) * back, ey = cy + (y - cy) * back;
    const r = 14 + t.impact * 2.6;
    const sx = x + ((cx - x) / Math.hypot(cx - x, cy - y)) * (r + 4), sy = y + ((cy - y) / Math.hypot(cx - x, cy - y)) * (r + 4);
    return { t, i, x, y, r, d: `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${(mx + (nx / len) * 34).toFixed(1)} ${(my + (ny / len) * 34).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}` };
  });

  svg.innerHTML = `
    <defs>
      <marker id="tm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" class="tm-arrowhead"/></marker>
      <marker id="tm-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" class="tm-arrowhead hot"/></marker>
      <pattern id="tm-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" class="tm-hatchline"/></pattern>
    </defs>

    <g class="tm-contours">
      ${[56, 136, 216, 296].map((r, i) => `<path class="tm-contour minor" d="${wobblyRing(cx, cy, r, i * 1.3 + 0.4)}"/>`).join("")}
      ${RINGS.map((r, i) => `<path class="tm-contour" id="tm-ring-${i}" d="${wobblyRing(cx, cy, r.r, i * 2.1 + 1)}"/>`).join("")}
      <path class="tm-contour future" d="${wobblyRing(cx, cy, 286, 7)}"/>
    </g>
    ${RINGS.map((r, i) => `<text class="tm-ring-label" x="${cx}" y="${cy - r.r - 6}" text-anchor="middle">${r.label}</text>`).join("")}
    <text class="tm-ring-label future" x="${cx + 214}" y="${cy + 222}" text-anchor="start" transform="rotate(-38 ${cx + 214} ${cy + 222})">the future</text>

    <g class="tm-compass" transform="translate(${W - 58} 62)">
      <circle r="24"/><path d="M0 -30V30M-30 0H30" class="thin"/>
      <path d="M0 -22L5 0L0 22L-5 0Z" class="needle"/><text y="-34" text-anchor="middle">N</text>
    </g>

    <g class="tm-routes">
      ${items.map(({ t, d }) => {
        const ready = threatChecks.readiness(t.id).pct >= 60;
        return `<path id="tm-p-${t.id}" class="tm-route${ready ? " prepared" : ""}" d="${d}" marker-end="url(#tm-arrow)"/>`;
      }).join("")}
    </g>

    <g class="tm-centre">
      <circle cx="${cx}" cy="${cy}" r="22" class="tm-centre-disc"/>
      <circle cx="${cx}" cy="${cy}" r="4" class="tm-centre-dot"/>
      <path d="M${cx - 32} ${cy}H${cx - 12}M${cx + 12} ${cy}H${cx + 32}M${cx} ${cy - 32}V${cy - 12}M${cx} ${cy + 12}V${cy + 32}" class="tm-crosshair"/>
      <text x="${cx + 26}" y="${cy + 38}" class="tm-you">you are here</text>
    </g>

    <g class="tm-markers">
      ${items.map(({ t, i, x, y, r }) => {
        const ready = threatChecks.readiness(t.id).pct >= 60;
        const labelBelow = y > cy + 120 || (t.ring === 1 && y > cy);
        const ly = labelBelow ? y + r + 20 : y - r - 12;
        return `<g class="tm-marker${selected === t.id ? " on" : ""}${ready ? " prepared" : ""}" data-id="${t.id}" tabindex="0" role="button" aria-label="${ROMAN[i]}. ${t.name}. Impact ${t.impact} of 5${ready ? ", you're prepared" : ""}. Open briefing">
          <circle class="tm-hit" cx="${x}" cy="${y}" r="${r + 16}"/>
          <circle class="tm-disc" cx="${x}" cy="${y}" r="${r}"/>
          ${ready ? `<circle class="tm-hatchfill" cx="${x}" cy="${y}" r="${r}"/>` : ""}
          <circle class="tm-disc-ring" cx="${x}" cy="${y}" r="${r + 4}"/>
          <g transform="translate(${x - 11} ${y - 11})" class="tm-glyph">${THREAT_GLYPHS[t.id]}</g>
          <text class="tm-numeral" x="${x}" y="${ly}" text-anchor="middle"><tspan class="n">${ROMAN[i]}.</tspan> ${t.name}</text>
        </g>`;
      }).join("")}
    </g>

    <g class="tm-legend" transform="translate(18 ${H - 112})">
      <rect width="190" height="96" rx="2"/>
      <text x="12" y="20" class="lg-title">Key</text>
      <circle cx="22" cy="40" r="6" class="tm-disc"/><circle cx="40" cy="40" r="9" class="tm-disc"/><text x="58" y="44">marker size: impact</text>
      <path d="M14 62H44" class="tm-route" marker-end="url(#tm-arrow)"/><text x="58" y="66">route to you</text>
      <circle cx="29" cy="84" r="8" class="tm-disc"/><circle cx="29" cy="84" r="8" class="tm-hatchfill"/><text x="58" y="88">hatched: you're prepared</text>
    </g>`;

  const pick = (id) => {
    $$(".tm-marker", svg).forEach((n) => n.classList.toggle("on", n.dataset.id === id));
    $$(".tm-route", svg).forEach((p) => {
      const hot = p.id === `tm-p-${id}`;
      p.classList.toggle("hot", hot);
      if (p.id) p.setAttribute("marker-end", hot ? "url(#tm-arrow-hot)" : "url(#tm-arrow)");
    });
    if (onSelect) onSelect(id);
  };
  svg.addEventListener("click", (e) => { const n = e.target.closest(".tm-marker"); if (n) pick(n.dataset.id); });
  svg.addEventListener("keydown", (e) => {
    const n = e.target.closest(".tm-marker");
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(n.dataset.id); }
  });
  if (selected) pick(selected);
  return { pick };
}

const impactScale = (n) => `<span class="impact-scale" aria-label="impact ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
const relatedHref = ([kind, slug]) =>
  kind === "post" ? `${BASE}posts/${slug}.html` : kind === "lab" ? `${BASE}labs/${slug}.html` : `${BASE}library/${slug}.html`;
const relatedKind = (k) => (k === "post" ? "Explainer" : k === "lab" ? "Lab" : "Library");

// ---------- chart + field note + index ----------
function initThreatDashboard({ map, brief, index, fullPage = false }) {
  if (!map) return null;
  const fromHash = THREATS.find((t) => location.hash === `#${t.id}`);
  let current = (fromHash || THREATS[2]).id;

  const renderBrief = (id) => {
    if (!brief) return;
    const i = THREATS.findIndex((x) => x.id === id);
    const t = THREATS[i];
    const r = threatChecks.readiness(id);
    brief.innerHTML = `
      <p class="fn-kicker">Plate ${ROMAN[i]} · field note</p>
      <div class="fn-head">${threatGlyph(t.id, 40, "fn-glyph")}<h3>${t.name}</h3></div>
      <p class="fn-tag">${t.tagline}</p>
      <dl class="fn-facts">
        <div><dt>Impact</dt><dd>${impactScale(t.impact)}</dd></div>
        <div><dt>Outlook</dt><dd>${t.trend}</dd></div>
        <div><dt>You</dt><dd>${r.done} of ${r.total} defences</dd></div>
      </dl>
      <p class="fn-what">${t.what}</p>
      <h4>How it unfolds</h4>
      <ol class="fn-chain">${t.chain.map((s) => `<li>${s}</li>`).join("")}</ol>
      <h4>On record, ${t.example.year}</h4>
      <p class="fn-case"><em>${t.example.title}.</em> ${t.example.text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")}</p>
      <h4>What helps</h4>
      <ul class="fn-def">${t.defenses.slice(0, 3).map((d) => `<li>${d}</li>`).join("")}</ul>
      <a class="fn-cta" href="${fullPage ? `#${t.id}-brief` : `${BASE}threats.html#${t.id}`}">${fullPage ? "Read the full briefing below" : "Read the full briefing"} <span aria-hidden="true">→</span></a>`;
  };

  const renderIndex = () => {
    if (!index) return;
    const o = threatChecks.overall();
    index.innerHTML = `
      <p class="ix-title">Index of threats</p>
      <ol class="ix-list">${THREATS.map((t, i) => {
        const r = threatChecks.readiness(t.id);
        return `<li><button type="button" class="ix-row${t.id === current ? " on" : ""}" data-id="${t.id}">
          <span class="ix-n">${ROMAN[i]}.</span><span class="ix-name">${t.name}</span><span class="ix-dots" aria-hidden="true"></span>
          ${impactScale(t.impact)}<span class="ix-ready${r.pct >= 60 ? " ok" : ""}">${r.done}/${r.total}</span>
        </button></li>`;
      }).join("")}</ol>
      <p class="ix-foot">You have ${o.done} of ${o.total} defences in place. <a href="${BASE}threats.html#self-check">${o.done ? "Continue" : "Take"} the self-check</a>.</p>`;
  };

  let api = null;
  const select = (id) => {
    current = id;
    renderBrief(id);
    if (index) $$(".ix-row", index).forEach((b) => b.classList.toggle("on", b.dataset.id === id));
  };
  const draw = () => {
    const fresh = map.cloneNode(false);
    map.replaceWith(fresh);
    map = fresh;
    api = renderThreatMap(map, { onSelect: select, selected: current });
  };
  draw();
  renderIndex();
  if (index) index.addEventListener("click", (e) => { const b = e.target.closest(".ix-row"); if (b) api.pick(b.dataset.id); });
  document.addEventListener("tc-threats", () => { draw(); renderIndex(); });
  return { select: (id) => api.pick(id) };
}
