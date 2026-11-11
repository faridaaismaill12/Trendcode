// Make Your Prediction: open forecasts (saved locally, published to
// Supabase when signed in) and a hindsight round scored on the spot.
// To revisit a question later: add dated items to `developments`, and when
// it's decided add `resolved: { outcome: "yes"|"no", date: "YYYY-MM-DD", note }`.
(function () {
  const C = window.tcCommunity;
  const openList = $("#pq-open");
  if (!C || !openList) return;

  const GROUPS = { ai: "AI", quantum: "Quantum & crypto", security: "Security & privacy", emerging: "Emerging tech" };

  const QUESTIONS = [
    {
      id: "ai-agents-work-2030", group: "ai",
      q: "Will AI agents be commonplace in workplaces by 2030?",
      by: "2030-12-31",
      criteria: "<strong>Yes</strong> if a large, reputable survey (Gartner, McKinsey, Pew, Microsoft's Work Trend Index or similar) published by the end of 2030 finds that <strong>most office workers</strong> in the US or EU use an AI agent at least weekly: software that carries out multi-step tasks for them, not just a chatbot that answers questions.",
      developments: [
        ["2024-10", "Anthropic releases “computer use” in beta: Claude can operate a desktop by looking at the screen and moving the cursor."],
        ["2024-11", "Anthropic open-sources the Model Context Protocol (MCP), a standard way to connect AI models to tools and data."],
        ["2025-01", "OpenAI launches Operator, an agent that uses its own web browser to complete tasks like booking and shopping."],
        ["2025-03", "OpenAI adopts MCP, and Google DeepMind confirms Gemini support soon after, so agents can share the same tool connectors."],
        ["2025-04", "Microsoft's Work Trend Index describes the “Frontier Firm”, where employees manage teams of AI agents."],
      ],
    },
    {
      id: "rsa-2048-broken-2035", group: "quantum",
      q: "Will a quantum computer break RSA-2048 before 2036?",
      by: "2035-12-31",
      criteria: "<strong>Yes</strong> if a quantum computer factors a 2048-bit RSA modulus (or recovers an RSA-2048 private key), with the result publicly demonstrated and independently verified, before 1 January 2036.",
      developments: [
        ["2019-05", "Gidney and Ekerå estimate that 20 million noisy qubits could factor RSA-2048 in about 8 hours."],
        ["2024-08", "NIST publishes FIPS 203, 204 and 205, the first finished post-quantum cryptography standards."],
        ["2024-11", "A NIST draft (IR 8547) proposes deprecating RSA and elliptic-curve cryptography by 2030 and disallowing them by 2035."],
        ["2024-12", "Google's 105-qubit Willow chip shows errors falling as its error-correcting code grows, a long-awaited milestone."],
        ["2025-05", "Gidney revises his estimate: fewer than one million noisy qubits, running for under a week."],
      ],
    },
    {
      id: "quantum-useful-advantage-2030", group: "quantum",
      q: "Will a quantum computer beat classical computers on a genuinely useful problem by 2030?",
      by: "2030-12-31",
      criteria: "<strong>Yes</strong> if, by the end of 2030, a quantum computation solves a problem with real scientific or commercial value (chemistry, materials, optimisation…) faster or better than the best known classical method, and the claim survives a year of independent scrutiny.",
      developments: [
        ["2019-10", "Google claims “quantum supremacy” with its Sycamore chip on a contrived task. IBM disputes it, and later classical simulations narrow the gap."],
        ["2023-06", "IBM reports a “utility-scale” physics simulation on a 127-qubit processor, then classical researchers quickly reproduce similar results."],
        ["2024-12", "Willow finishes a benchmark in about five minutes that Google estimates would take a supercomputer 10<sup>25</sup> years. The task itself has no practical use."],
        ["2025-10", "Google reports “Quantum Echoes”, a verifiable algorithm it says runs 13,000 times faster than the best classical approach, aimed at studying molecules."],
      ],
    },
    {
      id: "open-weights-top-2027", group: "ai",
      q: "Will an open-weights AI model be ranked #1 overall on LMArena at any point in 2027?",
      by: "2027-12-31",
      criteria: "<strong>Yes</strong> if a model whose weights anyone can download holds the top spot (ties count) on the LMArena text leaderboard on any day in 2027.",
      developments: [
        ["2024-07", "Meta releases Llama 3.1 405B, the largest open-weights model at the time."],
        ["2025-01", "DeepSeek releases R1, an open-weights reasoning model that rivals OpenAI's o1 on maths and coding. Nvidia's share price drops about 17% in a day."],
        ["2025-08", "OpenAI releases gpt-oss, its first open-weights language models since GPT-2."],
      ],
    },
    {
      id: "passwords-fade-2030", group: "security",
      q: "Will passkeys overtake passwords for consumer sign-ins by 2030?",
      by: "2030-12-31",
      criteria: "<strong>Yes</strong> if the FIDO Alliance, or a comparable large study, reports during 2030 that most sign-ins to major consumer services use passkeys rather than passwords.",
      developments: [
        ["2022-05", "Apple, Google and Microsoft jointly commit to supporting FIDO passkeys across their platforms."],
        ["2023-10", "Google makes passkeys the default sign-in option for personal Google accounts."],
        ["2025-05", "Microsoft makes new Microsoft accounts passwordless by default."],
      ],
    },
    {
      id: "ransomware-under-1b-2028", group: "security",
      q: "Will ransomware victims pay less than $1 billion in 2028?",
      by: "2029-03-31",
      criteria: "<strong>Yes</strong> if Chainalysis's annual crypto crime report (or the best equivalent if it stops) puts total ransomware payments for calendar year 2028 below US$1 billion.",
      developments: [
        ["2024-02", "Chainalysis reports that ransomware payments hit a record of more than $1 billion in 2023."],
        ["2024-02", "Operation Cronos: police from 10 countries take over the LockBit gang's leak site and infrastructure."],
        ["2025-02", "Chainalysis reports that 2024 payments fell about 35%, to roughly $814 million, as more victims refused to pay."],
      ],
    },
    {
      id: "us-privacy-law-2028", group: "security",
      q: "Will the US pass a comprehensive federal privacy law before 2029?",
      by: "2028-12-31",
      criteria: "<strong>Yes</strong> if a federal law giving consumers broad rights over their personal data (in the spirit of GDPR, covering most industries, not just one sector like health or children) is signed before 1 January 2029.",
      developments: [
        ["2022-07", "The American Data Privacy and Protection Act clears a House committee 53–2, then stalls before a floor vote."],
        ["2024-04", "Lawmakers unveil the American Privacy Rights Act draft. It also stalls."],
        ["2025-01", "With no federal law, the patchwork keeps growing: about 20 states now have their own comprehensive privacy laws."],
      ],
    },
    {
      id: "eu-ai-act-fine-2028", group: "ai",
      q: "Will anyone be fined under the EU AI Act before 2028?",
      by: "2027-12-31",
      criteria: "<strong>Yes</strong> if the European Commission or a national authority publicly announces a fine under the AI Act before 1 January 2028.",
      developments: [
        ["2024-08", "The AI Act enters into force, with rules phasing in over several years."],
        ["2025-02", "The first rules apply: bans on practices such as social scoring and manipulative AI."],
        ["2025-08", "Obligations for general-purpose AI model providers begin, alongside a voluntary Code of Practice."],
        ["2025-11", "The Commission proposes a “digital omnibus” package that would push back some high-risk AI deadlines."],
      ],
    },
    {
      id: "fusion-grid-2035", group: "emerging",
      q: "Will a fusion power plant put electricity on the grid before 2036?",
      by: "2035-12-31",
      criteria: "<strong>Yes</strong> if a fusion plant delivers electricity to a commercial power grid, verified independently, before 1 January 2036. The amount doesn't matter; it has to be sustained, not a single pulse.",
      developments: [
        ["2022-12", "The National Ignition Facility achieves ignition: more fusion energy out than laser energy delivered to the fuel."],
        ["2023-05", "Microsoft signs a deal to buy electricity from Helion's planned fusion plant, starting in 2028."],
        ["2024-12", "Commonwealth Fusion Systems picks Virginia for ARC, its first grid-scale plant, targeting the early 2030s."],
        ["2025-06", "Google agrees to buy 200 MW of power from ARC."],
      ],
    },
    {
      id: "bci-approval-2030", group: "emerging",
      q: "Will an implanted brain-computer interface get FDA approval for paralysed patients by 2030?",
      by: "2030-12-31",
      criteria: "<strong>Yes</strong> if the US FDA authorises for sale (PMA, De Novo or 510(k)) a <strong>permanently</strong> implanted BCI that lets people with paralysis control a computer or device, before 1 January 2031.",
      developments: [
        ["2022-07", "Synchron implants its Stentrode, delivered through a blood vessel, in its first US patient."],
        ["2024-01", "Neuralink implants its first human patient, who goes on to play online chess by thought."],
        ["2025-04", "Precision Neuroscience receives FDA clearance for its thin-film brain interface, but only for temporary use of up to 30 days."],
      ],
    },
  ];

  const HINDSIGHT = [
    { id: "h-nist-pqc", asOf: "January 2023", q: "Will NIST publish its final post-quantum encryption standards before the end of 2024?", outcome: "yes", what: "NIST published FIPS 203, 204 and 205 on 13 August 2024." },
    { id: "h-merge", asOf: "June 2021", q: "Will Ethereum switch from proof of work to proof of stake during 2022?", outcome: "yes", what: "“The Merge” happened on 15 September 2022, cutting Ethereum's energy use by more than 99%." },
    { id: "h-1000-qubits", asOf: "January 2023", q: "Will a quantum processor with more than 1,000 qubits be unveiled in 2023?", outcome: "yes", what: "Atom Computing announced a 1,180-site machine in October, and IBM unveiled its 1,121-qubit Condor in December 2023." },
    { id: "h-apple-headset", asOf: "January 2022", q: "Will Apple start selling a mixed-reality headset in 2022?", outcome: "no", what: "Vision Pro was announced in June 2023 and went on sale in February 2024." },
    { id: "h-google-passkeys", asOf: "June 2023", q: "Will Google make passkeys the default sign-in for personal accounts before 2024?", outcome: "yes", what: "Google made passkeys the default option in October 2023." },
    { id: "h-chrome-pq", asOf: "January 2024", q: "Will Chrome turn on post-quantum key exchange by default during 2024?", outcome: "yes", what: "Chrome 124 (April 2024) enabled hybrid Kyber key agreement by default on desktop, and Chrome 131 switched to the final ML-KEM standard." },
    { id: "h-cookies", asOf: "January 2022", q: "Will Chrome block third-party cookies by default before the end of 2024?", outcome: "no", what: "Google delayed the change repeatedly, then in July 2024 dropped the plan to remove them." },
    { id: "h-ai-act", asOf: "January 2024", q: "Will the EU AI Act enter into force during 2024?", outcome: "yes", what: "It entered into force on 1 August 2024." },
    { id: "h-eu-sideload", asOf: "January 2022", q: "Will iPhone users in the EU be able to install apps from alternative app stores by the end of 2024?", outcome: "yes", what: "iOS 17.4 (March 2024) allowed alternative marketplaces in the EU, under the Digital Markets Act." },
    { id: "h-ransom-2024", asOf: "January 2024", q: "Will total ransomware payments in 2024 beat 2023's record?", outcome: "no", what: "Chainalysis found 2024 payments fell about 35%, to roughly $814 million." },
    { id: "h-openai-weights", asOf: "January 2023", q: "Will OpenAI release a new open-weights language model before the end of 2024?", outcome: "no", what: "It didn't happen until August 2025, with gpt-oss." },
    { id: "h-btc-100k", asOf: "January 2024", q: "Will Bitcoin trade above $100,000 at any point in 2024?", outcome: "yes", what: "It crossed $100,000 on 5 December 2024." },
    { id: "h-imo-gold", asOf: "January 2025", q: "Will an AI system reach gold-medal level at the 2025 International Mathematical Olympiad?", outcome: "yes", what: "In July 2025, Google DeepMind's Gemini Deep Think and an experimental OpenAI model both scored 35 out of 42, gold-medal level." },
  ];

  // ---------- local state ----------
  const mine = () => store.get("tc-predictions", {});
  const past = () => store.get("tc-hindsight", {});
  const pYes = (f) => (f.stance === "yes" ? f.confidence : 100 - f.confidence) / 100;
  const score = (f, outcome) => Math.round(100 * (1 - (pYes(f) - (outcome === "yes" ? 1 : 0)) ** 2));
  const confWord = (c) => (c < 58 ? "a toss-up" : c < 70 ? "leaning" : c < 82 ? "fairly sure" : c < 93 ? "very sure" : "near certain");
  const fmtMonth = (ym) => new Date(ym + (ym.length === 7 ? "-01" : "") + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  const fmtDay = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  let acct = null, stats = {}, filter = "all", openId = null;

  // ---------- record strip ----------
  function paintRecord() {
    const m = mine(), h = past();
    const hs = HINDSIGHT.filter((x) => h[x.id]).map((x) => score(h[x.id], x.outcome));
    const resolved = QUESTIONS.filter((q) => q.resolved && m[q.id]);
    const right = HINDSIGHT.filter((x) => h[x.id] && h[x.id].stance === x.outcome).length +
      resolved.filter((q) => m[q.id].stance === q.resolved.outcome).length;
    const decided = hs.length + resolved.length;
    $("#pq-record").innerHTML = `
      <div><b>${Object.keys(m).filter((k) => QUESTIONS.some((q) => q.id === k)).length}<small style="font-size:1rem;color:var(--muted)"> / ${QUESTIONS.length}</small></b><span>open forecasts on record</span></div>
      <div><b>${decided ? `${right}/${decided}` : "–"}</b><span>right calls on decided questions</span></div>
      <div><b>${hs.length ? Math.round(hs.reduce((a, b) => a + b, 0) / hs.length) : "–"}</b><span>hindsight score (75 = coin flip)</span></div>
      <div><b>${Object.values(stats).reduce((a, s) => a + s.yes + s.no, 0) || "–"}</b><span>forecasts by everyone</span></div>`;
  }

  // ---------- open questions ----------
  const crowd = (q) => {
    const s = stats[q.id], f = mine()[q.id];
    const n = s ? s.yes + s.no : 0;
    const you = f ? Math.round(pYes(f) * 100) : null;
    return `<span class="pq-crowd">
      ${n ? `Crowd says <strong>${Math.round(s.avg)}% yes</strong> · ${n} forecast${n === 1 ? "" : "s"}` : "No crowd forecast yet"}
      <span class="pq-meter" aria-hidden="true"><i style="width:${n ? s.avg : 0}%"></i><b style="left:${you ?? 0}%"${you === null ? " hidden" : ""}></b></span>
      ${you !== null ? `You: ${you}% yes` : "&nbsp;"}</span>`;
  };

  function paintFilters() {
    $("#pq-filters").innerHTML = [["all", "All"], ...Object.entries(GROUPS)].map(([k, l]) =>
      `<button type="button" class="chip${filter === k ? " active" : ""}" data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join("");
  }

  function paintOpen() {
    const m = mine();
    const shown = QUESTIONS.filter((q) => filter === "all" || q.group === filter);
    openList.innerHTML = shown.map((q) => {
      const i = QUESTIONS.indexOf(q) + 1, f = m[q.id];
      const sub = [GROUPS[q.group], q.resolved ? `<span class="resolved">Decided: ${q.resolved.outcome}</span>` : `Decides by ${fmtDay(q.by)}`,
        f ? `<span class="yours">Your call: ${f.stance} · ${f.confidence}%</span>` : ""].filter(Boolean);
      return `<li class="pq" id="q-${q.id}">
        <button type="button" class="pq-row" aria-expanded="${openId === q.id}" aria-controls="panel-${q.id}" data-open="${q.id}">
          <span class="pq-num">${String(i).padStart(2, "0")}</span>
          <span><span class="pq-q">${escapeHtml(q.q)}</span><span class="pq-sub">${sub.map((s) => `<span>${s}</span>`).join("")}</span></span>
          ${crowd(q)}
        </button>
        <div class="pq-panel" id="panel-${q.id}" ${openId === q.id ? "" : "hidden"}></div>
      </li>`;
    }).join("");
    if (openId && shown.some((q) => q.id === openId)) paintPanel(QUESTIONS.find((q) => q.id === openId));
  }

  function paintPanel(q) {
    const panel = $(`#panel-${q.id}`);
    if (!panel) return;
    const f = mine()[q.id];
    const since = f ? f.at.slice(0, 7) : null;
    const verdict = q.resolved ? (() => {
      const right = f && f.stance === q.resolved.outcome;
      return `<div class="pq-verdict ${f ? (right ? "right" : "wrong") : ""}">
        <strong class="big">The answer was ${q.resolved.outcome}.</strong>
        <p>${escapeHtml(q.resolved.note || "")} (${fmtDay(q.resolved.date)})</p>
        ${f ? `<p>You said <strong>${f.stance}</strong> at ${f.confidence}% on ${fmtDay(f.at)}. Score: <strong>${score(f, q.resolved.outcome)}</strong>/100.</p>` : "<p>You didn't make a forecast on this one.</p>"}
      </div>`;
    })() : "";

    panel.innerHTML = `
      <div>
        <h3>What counts</h3>
        <p class="pq-criteria">${q.criteria}</p>
        ${verdict}
        ${q.resolved ? "" : `
        <form class="pq-form" data-q="${q.id}">
          <fieldset class="pq-stance"><legend>Will it happen?</legend>
            <label><input type="radio" name="stance" value="yes" ${f && f.stance === "yes" ? "checked" : ""} required /> Yes</label>
            <label><input type="radio" name="stance" value="no" ${f && f.stance === "no" ? "checked" : ""} /> No</label>
          </fieldset>
          <div class="pq-conf">
            <label for="conf-${q.id}">How sure are you? <output id="out-${q.id}">${f ? f.confidence : 65}% · ${confWord(f ? f.confidence : 65)}</output></label>
            <input type="range" id="conf-${q.id}" name="confidence" min="50" max="99" value="${f ? f.confidence : 65}" />
            <span class="scale"><span>50 · coin flip</span><span>99 · certain</span></span>
          </div>
          <label for="why-${q.id}" class="sr-only">Your reasoning</label>
          <textarea id="why-${q.id}" name="reasoning" maxlength="600" placeholder="Why? What would change your mind? (optional, but future-you will thank you)">${f ? escapeHtml(f.reasoning || "") : ""}</textarea>
          <div class="dz-bar"><span class="pq-saved" aria-live="polite">${f ? `Forecast saved ${fmtDay(f.at)}` : ""}</span><button class="btn btn-small" type="submit">${f ? "Update forecast" : "Lock in forecast"}</button></div>
          <p class="dz-err" role="alert"></p>
        </form>
        <p class="pq-note">${acct && acct.user ? "Signed in: your forecast and reasoning are public, under your username." :
          acct && acct.enabled ? `Saved in this browser only. <a href="${C.signInHref("#q-" + q.id)}">Sign in</a> to add it to the crowd forecast and share your reasoning.` : "Saved in this browser."}</p>`}
      </div>
      <div>
        <h3>Developments so far</h3>
        <ol class="pq-timeline">${q.developments.map(([d, t]) =>
          `<li class="${since && d >= since ? "new" : ""}"><time>${fmtMonth(d)}</time>${t}</li>`).join("")}</ol>
        <h3>Why people think what they think</h3>
        <ul class="pq-voices" id="voices-${q.id}"><li><span class="empty">Loading…</span></li></ul>
      </div>
      <div class="pq-wide pq-thread" id="thread-${q.id}"></div>`;

    const form = panel.querySelector(".pq-form");
    if (form) {
      const range = form.querySelector("input[type=range]");
      range.addEventListener("input", () => ($(`#out-${q.id}`).textContent = `${range.value}% · ${confWord(+range.value)}`));
      form.addEventListener("submit", (e) => { e.preventDefault(); save(q, form); });
    }
    loadVoices(q);
    // Keep one live thread per question across repaints (no duplicate subscriptions)
    const slot = $(`#thread-${q.id}`);
    if (threads[q.id]) slot.replaceWith(threads[q.id]);
    else { threads[q.id] = slot; C.mountThread(slot, `predict:${q.id}`, { room: "predictions", intro: "Argue it out. Links to real evidence beat vibes." }); }
  }
  const threads = {};

  async function save(q, form) {
    const fd = new FormData(form);
    const first = !mine()[q.id];
    const f = { stance: fd.get("stance"), confidence: +fd.get("confidence"), reasoning: (fd.get("reasoning") || "").trim().slice(0, 600), at: new Date().toISOString() };
    const all = mine(); all[q.id] = f; store.set("tc-predictions", all);
    document.dispatchEvent(new CustomEvent("tc-progress"));
    if (first) toast(`<div><strong>Forecast locked in</strong><br />${f.stance === "yes" ? "Yes" : "No"} at ${f.confidence}% · +5 XP</div>`);
    if (acct && acct.user) {
      const { error } = await upsert(q.id, f);
      if (error) { form.querySelector(".dz-err").textContent = C.nicerError(error); }
      await loadStats();
    }
    paintOpen(); paintRecord();
  }

  const upsert = (id, f) => acct.client.from("predictions").upsert(
    { user_id: acct.user.id, question_id: id, stance: f.stance, confidence: f.confidence, reasoning: f.reasoning || "" },
    { onConflict: "user_id,question_id" });

  async function loadVoices(q) {
    const box = $(`#voices-${q.id}`);
    if (!box) return;
    if (!acct || !acct.enabled) { box.innerHTML = `<li><span class="empty">Shared reasoning needs the account server.</span></li>`; return; }
    const { data, error } = await acct.client.from("predictions").select(`user_id, stance, confidence, reasoning, updated_at, ${C.AUTHOR}`)
      .eq("question_id", q.id).neq("reasoning", "").order("updated_at", { ascending: false }).limit(12);
    if (!$(`#voices-${q.id}`)) return;
    if (error) { box.innerHTML = `<li><span class="empty">${escapeHtml(C.nicerError(error))}</span></li>`; return; }
    C.remember(data);
    box.innerHTML = data.length ? data.map((r) => {
      const a = C.author(r.user_id);
      return `<li><span class="dz-av" aria-hidden="true">${a.avatar(30)}</span><div>
        <span class="who"><strong>${a.href ? `<a href="${a.href}">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)}</strong><span class="call">${r.stance.toUpperCase()} · ${r.confidence}%</span> · ${C.timeAgo(r.updated_at)}</span>
        <p>${C.format(r.reasoning)}</p></div></li>`;
    }).join("") : `<li><span class="empty">Nobody has explained their forecast yet. Be the first.</span></li>`;
  }

  async function loadStats() {
    if (!acct || !acct.enabled) return;
    const { data, error } = await acct.client.rpc("prediction_stats");
    if (error) return console.warn("prediction_stats:", error.message);
    stats = {};
    data.forEach((r) => (stats[r.question_id] = { yes: +r.yes_count, no: +r.no_count, avg: +r.avg_yes }));
  }

  // Signed in: pull your forecasts down, push any you made while signed out.
  async function syncMine() {
    if (!acct || !acct.user) return;
    const { data, error } = await acct.client.from("predictions").select("question_id, stance, confidence, reasoning, updated_at").eq("user_id", acct.user.id);
    if (error) return console.warn("predictions:", error.message);
    const all = mine(), remote = new Map(data.map((r) => [r.question_id, r]));
    remote.forEach((r, id) => {
      if (!all[id] || Date.parse(r.updated_at) > Date.parse(all[id].at)) all[id] = { stance: r.stance, confidence: r.confidence, reasoning: r.reasoning, at: r.updated_at };
    });
    store.set("tc-predictions", all);
    const toPush = Object.entries(all).filter(([id, f]) => QUESTIONS.some((q) => q.id === id && !q.resolved) &&
      (!remote.has(id) || Date.parse(f.at) > Date.parse(remote.get(id).updated_at) + 1000));
    for (const [id, f] of toPush) await upsert(id, f);
  }

  // ---------- hindsight ----------
  // One question at a time; answered ones collapse into a scored list below.
  function paintPast() {
    const h = past();
    const answered = HINDSIGHT.filter((x) => h[x.id]);
    const next = HINDSIGHT.find((x) => !h[x.id]);
    const n = HINDSIGHT.indexOf(next) + 1;
    const current = next ? `<li class="pq-current">
        <span class="pq-num">${String(n).padStart(2, "0")}</span>
        <div><span class="pq-progress">Question ${answered.length + 1} of ${HINDSIGHT.length} · it's ${next.asOf}</span>
          <span class="pq-q">${escapeHtml(next.q)}</span>
          <form class="pq-form" data-h="${next.id}">
            <fieldset class="pq-stance"><legend>Will it happen?</legend>
              <label><input type="radio" name="stance" value="yes" required /> Yes</label>
              <label><input type="radio" name="stance" value="no" /> No</label>
            </fieldset>
            <div class="pq-conf"><label for="hc-${next.id}">How sure? <output>65% · leaning</output></label>
              <input type="range" id="hc-${next.id}" name="confidence" min="50" max="99" value="65" />
              <span class="scale"><span>50 · coin flip</span><span>99 · certain</span></span></div>
            <div class="dz-bar"><span></span><button class="btn btn-small" type="submit">Reveal what happened</button></div>
          </form></div>
      </li>`
      : `<li class="pq-current"><span></span><div><p class="pq-allset">That's all ${HINDSIGHT.length}. Now try the open questions above, where nobody knows the answer yet.</p>
          <button type="button" class="btn btn-ghost btn-small pq-reset" id="pq-reset">Play the hindsight round again</button></div></li>`;
    const done = answered.slice().reverse().map((x) => {
      const f = h[x.id], right = f.stance === x.outcome;
      return `<li class="pq pq-done"><div class="pq-row">
        <span class="pq-num">${String(HINDSIGHT.indexOf(x) + 1).padStart(2, "0")}</span>
        <span><span class="pq-q">${escapeHtml(x.q)}</span>
          <span class="pq-what"><strong>${x.outcome === "yes" ? "Yes" : "No"}.</strong> ${escapeHtml(x.what)}</span>
          <span class="pq-sub"><span>As of ${x.asOf}</span><span>You said ${f.stance} at ${f.confidence}%</span></span></span>
        <span class="pq-mark ${right ? "right" : "wrong"}"><strong>${score(f, x.outcome)}</strong>${right ? "called it" : "missed"}</span>
      </div></li>`;
    }).join("");
    $("#pq-past").innerHTML = current + done;
  }
  $("#pq-past").addEventListener("click", (e) => {
    if (e.target.id !== "pq-reset") return;
    store.set("tc-hindsight", {});
    document.dispatchEvent(new CustomEvent("tc-progress"));
    paintPast(); paintRecord();
  });
  $("#pq-past").addEventListener("input", (e) => {
    if (e.target.type === "range") e.target.closest(".pq-conf").querySelector("output").textContent = `${e.target.value}% · ${confWord(+e.target.value)}`;
  });
  $("#pq-past").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target), id = e.target.dataset.h;
    const all = past(); all[id] = { stance: fd.get("stance"), confidence: +fd.get("confidence"), at: new Date().toISOString() };
    store.set("tc-hindsight", all);
    document.dispatchEvent(new CustomEvent("tc-progress"));
    paintPast(); paintRecord();
  });

  // ---------- wiring ----------
  $("#pq-filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filter = b.dataset.f; paintFilters(); paintOpen();
  });
  openList.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (!b) return;
    openId = openId === b.dataset.open ? null : b.dataset.open;
    history.replaceState(null, "", openId ? `#q-${openId}` : location.pathname);
    paintOpen();
    if (openId) $(`#q-${openId}`).scrollIntoView({ block: "start", behavior: "smooth" });
  });

  const fromHash = location.hash.match(/^#q-([a-z0-9-]+)/);
  if (fromHash && QUESTIONS.some((q) => q.id === fromHash[1])) openId = fromHash[1];
  paintFilters(); paintOpen(); paintPast(); paintRecord();
  if (openId) setTimeout(() => $(`#q-${openId}`)?.scrollIntoView({ block: "start" }), 50);

  window.tcAccountLoad().then(async (a) => {
    acct = a;
    await syncMine();
    await loadStats();
    paintOpen(); paintRecord();
  });
  document.addEventListener("tc-account", () => { if (acct && acct.user) syncMine().then(loadStats).then(() => { paintOpen(); paintRecord(); }); });
})();
