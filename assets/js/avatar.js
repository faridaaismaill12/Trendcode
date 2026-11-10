// =============================================================
// Trendcode characters: options, unlock rules and an SVG renderer.
// Loaded on every page before main.js. Stored locally as "tc-character".
// =============================================================
(function () {
  const OPTIONS = {
    skin: ["#fbe0cd", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#5c3a21"],
    hair: ["short", "long", "bun", "curly", "mohawk", "hijab", "bald"],
    hairColor: ["#1f1a17", "#4a2c1d", "#8b5a2b", "#d6a756", "#e8e2d0", "#b23a48", "#22d3ee", "#a78bfa"],
    eyes: ["dots", "happy", "wink", "sleepy"],
    mouth: ["smile", "grin", "neutral", "open"],
    outfit: ["hoodie", "tee", "labcoat", "suit"],
    outfitColor: ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#334155", "#e5e7eb"],
    accessory: ["none", "glasses", "cap", "headphones", "visor", "crown"],
    bg: ["#0e7490", "#5b21b6", "#065f46", "#92400e", "#9f1239", "#1e293b", "aurora"],
    cls: ["cryptographer", "quantum", "ai", "netrunner", "datasage", "algorithmist"],
  };

  const LABELS = {
    hair: { short: "Short", long: "Long", bun: "Bun", curly: "Curly", mohawk: "Mohawk", hijab: "Hijab", bald: "Bald" },
    eyes: { dots: "Classic", happy: "Happy", wink: "Wink", sleepy: "Sleepy" },
    mouth: { smile: "Smile", grin: "Grin", neutral: "Neutral", open: "Surprised" },
    outfit: { hoodie: "Hoodie", tee: "T-shirt", labcoat: "Lab coat", suit: "Suit" },
    accessory: { none: "None", glasses: "Glasses", cap: "Cap", headphones: "Headphones", visor: "Cyber visor", crown: "Crown" },
  };

  const CLASSES = {
    cryptographer: { name: "Cryptographer", icon: "🔐", blurb: "Keeps secrets. Breaks other people's." },
    quantum: { name: "Quantum Mage", icon: "⚛️", blurb: "Lives in superposition until observed." },
    ai: { name: "AI Whisperer", icon: "🤖", blurb: "Speaks fluent model. Spots injections." },
    netrunner: { name: "Net Runner", icon: "🌐", blurb: "Knows what happens after you press Enter." },
    datasage: { name: "Data Sage", icon: "📊", blurb: "Learns from data, never about you." },
    algorithmist: { name: "Algorithmist", icon: "📈", blurb: "Thinks in O(n log n)." },
  };

  // Some options are earned. Each rule: [test(), "how to unlock"]
  const xp = () => (typeof progress !== "undefined" ? progress.xp() : 0);
  const badgeCount = () => (typeof BADGES !== "undefined" ? BADGES.filter((b) => b[4]()).length : 0);
  const LOCKS = {
    "accessory:headphones": [() => xp() >= 30, "Reach level 2 (30 XP)"],
    "accessory:visor": [() => xp() >= 180, "Reach level 4 (180 XP)"],
    "accessory:crown": [() => badgeCount() >= 6, "Earn 6 badges"],
    "bg:aurora": [() => typeof progress !== "undefined" && progress.labs().length >= 3, "Complete 3 labs"],
    "hairColor:#22d3ee": [() => typeof progress !== "undefined" && progress.streak() >= 2, "Keep a 2-day daily streak"],
    "hairColor:#a78bfa": [() => typeof progress !== "undefined" && progress.read().length >= 3, "Read 3 explainers"],
  };
  const isUnlocked = (key, value) => { const r = LOCKS[`${key}:${value}`]; return !r || r[0](); };
  const lockText = (key, value) => (LOCKS[`${key}:${value}`] || [, ""])[1];

  const DEFAULT = { skin: "#e0ac69", hair: "short", hairColor: "#1f1a17", eyes: "dots", mouth: "smile", outfit: "hoodie", outfitColor: "#22d3ee", accessory: "none", bg: "#1e293b", cls: "cryptographer" };

  const read = () => { try { return JSON.parse(localStorage.getItem("tc-character")) || null; } catch { return null; } };
  const get = () => {
    const c = { ...DEFAULT, ...(read() || {}) };
    // fall back if a saved option was removed or is no longer unlocked
    for (const k of Object.keys(DEFAULT)) if (!OPTIONS[k].includes(c[k]) || !isUnlocked(k, c[k])) c[k] = DEFAULT[k];
    return c;
  };
  const set = (c) => {
    try { localStorage.setItem("tc-character", JSON.stringify(c)); localStorage.setItem("tc-character-at", String(Date.now())); } catch { /* ignore */ }
    document.dispatchEvent(new CustomEvent("tc-character"));
  };
  const random = () => {
    const pick = (k) => { const opts = OPTIONS[k].filter((v) => isUnlocked(k, v)); return opts[Math.floor(Math.random() * opts.length)]; };
    return Object.fromEntries(Object.keys(DEFAULT).map((k) => [k, pick(k)]));
  };

  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("")}`;
  };

  let uid = 0;
  // Render a character as an SVG string. size is in CSS pixels.
  function svg(c = get(), size = 120, opts = {}) {
    c = { ...DEFAULT, ...c };
    const id = `av${++uid}`;
    const skin = c.skin, skinD = shade(skin, -28), hairC = c.hairColor, hairD = shade(hairC, -25);
    const out = c.outfitColor, outD = shade(out, -35);
    const ink = "#1b1d24";
    const bg = c.bg === "aurora"
      ? `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs><rect width="120" height="120" fill="url(#${id}g)"/>`
      : `<rect width="120" height="120" fill="${c.bg}"/>`;

    // ----- hair behind the head -----
    let hairBack = "";
    if (c.hair === "long") hairBack = `<path d="M33 52 C31 30 45 21 60 21 C76 21 90 30 87 52 L90 92 C80 98 40 98 30 92 Z" fill="${hairD}"/>`;
    if (c.hair === "hijab") hairBack = `<path d="M60 18 C84 18 92 38 91 58 C90 76 96 88 104 120 L16 120 C24 88 30 76 29 58 C28 38 36 18 60 18 Z" fill="${hairC}"/><path d="M60 18 C84 18 92 38 91 58 C90 70 86 80 80 86 L40 86 C34 80 30 70 29 58 C28 38 36 18 60 18 Z" fill="${shade(hairC, 18)}" opacity=".35"/>`;
    if (c.hair === "bun") hairBack = `<circle cx="60" cy="19" r="10" fill="${hairC}"/>`;

    // ----- outfit -----
    let body = `<path d="M18 122 C18 96 36 84 60 84 C84 84 102 96 102 122 Z" fill="${out}"/>`;
    if (c.outfit === "hoodie") body += `<path d="M42 86 C46 96 74 96 78 86 C74 90 46 90 42 86 Z" fill="${outD}"/><path d="M54 92 V106 M66 92 V106" stroke="${shade(out, 50)}" stroke-width="2" stroke-linecap="round"/><path d="M44 104 H76 V118 H44 Z" fill="${outD}" opacity=".45" rx="3"/>`;
    if (c.outfit === "tee") body += `<path d="M50 85 L60 96 L70 85" fill="${skin}"/><path d="M50 85 L60 96 L70 85" fill="none" stroke="${outD}" stroke-width="2"/>`;
    if (c.outfit === "labcoat") body = `<path d="M18 122 C18 96 36 84 60 84 C84 84 102 96 102 122 Z" fill="#f4f6f8"/><path d="M50 85 L60 104 L70 85 Z" fill="${out}"/><path d="M50 85 L58 120 M70 85 L62 120" stroke="#cfd6dd" stroke-width="2"/><rect x="72" y="104" width="12" height="8" rx="1.5" fill="none" stroke="#cfd6dd" stroke-width="1.5"/>`;
    if (c.outfit === "suit") body = `<path d="M18 122 C18 96 36 84 60 84 C84 84 102 96 102 122 Z" fill="#1f2937"/><path d="M50 85 L60 100 L70 85 Z" fill="#f4f6f8"/><path d="M58 99 L60 96 L62 99 L61 116 L60 118 L59 116 Z" fill="${out}"/><path d="M50 85 L56 106 L46 98 Z M70 85 L64 106 L74 98 Z" fill="#111827"/>`;
    const cls = CLASSES[c.cls] || CLASSES.cryptographer;
    const emblem = opts.noEmblem ? "" : `<circle cx="80" cy="106" r="7.5" fill="${ink}" opacity=".55"/><text x="80" y="109.5" font-size="9" text-anchor="middle">${cls.icon}</text>`;

    // ----- head -----
    const neck = `<path d="M52 70 H68 V88 C64 92 56 92 52 88 Z" fill="${skinD}"/>`;
    const ears = c.hair === "hijab" ? "" : `<circle cx="36" cy="55" r="5.5" fill="${skin}"/><circle cx="84" cy="55" r="5.5" fill="${skin}"/>`;
    const head = c.hair === "hijab"
      ? `<ellipse cx="60" cy="56" rx="20" ry="23" fill="${skin}"/>`
      : `<ellipse cx="60" cy="53" rx="24" ry="26" fill="${skin}"/>`;

    // ----- hair on top -----
    let hairTop = "";
    const cap = `M36 50 C34 28 47 21 60 21 C74 21 87 28 84 50 C79 39 70 34 60 35 C50 34 41 39 36 50 Z`;
    if (["short", "long", "bun"].includes(c.hair)) hairTop = `<path d="${cap}" fill="${hairC}"/>`;
    if (c.hair === "long") hairTop += `<path d="M36 48 C35 60 36 72 34 84 L40 84 C40 70 40 60 41 50 Z M84 48 C85 60 84 72 86 84 L80 84 C80 70 80 60 79 50 Z" fill="${hairC}"/>`;
    if (c.hair === "curly") hairTop = [[40, 38], [48, 29], [60, 25], [72, 29], [80, 38], [36, 48], [84, 48], [54, 32], [66, 32]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${hairC}"/>`).join("") + `<path d="M40 44 C48 38 72 38 80 44" stroke="${hairD}" stroke-width="2" fill="none" opacity=".5"/>`;
    if (c.hair === "mohawk") hairTop = `<path d="M54 36 C54 22 57 12 60 8 C63 12 66 22 66 36 C63 34 57 34 54 36 Z" fill="${hairC}"/><path d="M38 46 C38 40 42 36 46 35 M82 46 C82 40 78 36 74 35" stroke="${hairD}" stroke-width="3" fill="none" opacity=".5"/>`;
    if (c.hair === "hijab") hairTop = `<path d="M38 52 C38 32 48 26 60 26 C72 26 82 32 82 52 C78 40 70 35 60 35 C50 35 42 40 38 52 Z" fill="${hairC}"/>`;

    // ----- face -----
    const ey = c.hair === "hijab" ? 57 : 55;
    const eyes = {
      dots: `<circle cx="51" cy="${ey}" r="3.2" fill="${ink}"/><circle cx="69" cy="${ey}" r="3.2" fill="${ink}"/><circle cx="52" cy="${ey - 1}" r="1" fill="#fff"/><circle cx="70" cy="${ey - 1}" r="1" fill="#fff"/>`,
      happy: `<path d="M47 ${ey + 1} Q51 ${ey - 4} 55 ${ey + 1} M65 ${ey + 1} Q69 ${ey - 4} 73 ${ey + 1}" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      wink: `<circle cx="51" cy="${ey}" r="3.2" fill="${ink}"/><path d="M65 ${ey} Q69 ${ey + 3} 73 ${ey}" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      sleepy: `<path d="M47 ${ey} H55 M65 ${ey} H73" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`,
    }[c.eyes];
    const my = c.hair === "hijab" ? 68 : 67;
    const mouth = {
      smile: `<path d="M53 ${my} Q60 ${my + 6} 67 ${my}" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
      grin: `<path d="M51 ${my - 1} Q60 ${my + 10} 69 ${my - 1} Z" fill="${ink}"/><path d="M53 ${my} H67 L66 ${my + 2} H54 Z" fill="#fff"/>`,
      neutral: `<path d="M54 ${my + 1} H66" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`,
      open: `<ellipse cx="60" cy="${my + 2}" rx="3.6" ry="4.4" fill="${ink}"/>`,
    }[c.mouth];
    const blush = `<circle cx="45" cy="${ey + 8}" r="4" fill="#f87171" opacity=".18"/><circle cx="75" cy="${ey + 8}" r="4" fill="#f87171" opacity=".18"/>`;

    // ----- accessory -----
    const acc = {
      none: "",
      glasses: `<g fill="none" stroke="${ink}" stroke-width="2.2"><circle cx="51" cy="${ey}" r="7"/><circle cx="69" cy="${ey}" r="7"/><path d="M58 ${ey} H62 M44 ${ey - 1} L37 ${ey - 3} M76 ${ey - 1} L83 ${ey - 3}"/></g>`,
      cap: `<path d="M36 44 C36 26 48 20 60 20 C72 20 84 26 84 44 Z" fill="${outD}"/><path d="M60 44 C72 42 90 42 98 46 C90 49 74 48 60 47 Z" fill="${shade(outD, -15)}"/><circle cx="60" cy="21" r="2.5" fill="${out}"/>`,
      headphones: `<path d="M34 54 C32 26 88 26 86 54" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><rect x="28" y="47" width="11" height="17" rx="5" fill="${out}" stroke="${ink}" stroke-width="2"/><rect x="81" y="47" width="11" height="17" rx="5" fill="${out}" stroke="${ink}" stroke-width="2"/>`,
      visor: `<defs><linearGradient id="${id}v" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect x="38" y="${ey - 7}" width="44" height="13" rx="6.5" fill="url(#${id}v)" opacity=".92"/><rect x="42" y="${ey - 4}" width="18" height="2.5" rx="1.2" fill="#fff" opacity=".7"/>`,
      crown: `<path d="M42 24 L46 10 L53 20 L60 6 L67 20 L74 10 L78 24 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" stroke-linejoin="round"/><circle cx="60" cy="16" r="2" fill="#f87171"/>`,
    }[c.accessory];

    return `<svg class="avatar" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${escapeAttr(opts.label || "Character avatar")}" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="${id}c"><rect width="120" height="120" rx="${opts.square ? 18 : 60}"/></clipPath>
      <g clip-path="url(#${id}c)">${bg}${hairBack}${body}${emblem}${neck}${ears}${head}${hairTop}${blush}${eyes}${mouth}${acc}</g>
    </svg>`;
  }
  const escapeAttr = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  window.TCAvatar = { OPTIONS, LABELS, CLASSES, DEFAULT, get, set, random, svg, isUnlocked, lockText, hasCustom: () => !!read() };
})();
