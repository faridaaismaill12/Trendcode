// =============================================================
// Trendcode chat: Discord-style servers, channels, roles, invites,
// reactions, replies, polls and slash-command games, live over
// Supabase Realtime. Tables + rules: supabase/schema.sql.
// =============================================================
(function () {
  const C = window.tcCommunity;
  const app = $("#dc");
  if (!C || !app) return;

  const HQ = "00000000-0000-4000-8000-000000000001";
  const PAGE = 50;
  const EMOJI = ["👍", "❤️", "😂", "🔥", "🤯", "👀", "🎉", "🤔", "✅", "💯", "🧠", "🚀", "😭", "🙏", "👏", "💀", "⭐", "🤝"];
  const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#f87171", "#fbbf24", "#f472b6", "#60a5fa", "#fb923c", "#94a3b8"];
  const BANNERS = ["circuit", "grid", "dots", "waves", "rings", "stripes", "plain"];
  const TEMPLATES = {
    study: { label: "Study group", blurb: "Homework help, notes and exam panic.", icon: "SG", channels: [["homework-help", "Stuck? Post the question and what you tried."], ["notes", "Share summaries and cheat sheets."], ["off-topic", "Anything goes (within reason)."]] },
    hangout: { label: "Hangout", blurb: "Friends, memes and late-night debates.", icon: "HQ", channels: [["memes", "Quality not guaranteed."], ["games", "Try /roll, /flip and /8ball."], ["music", "What are you listening to?"]] },
    project: { label: "Project team", blurb: "Ship something together.", icon: "PT", channels: [["standup", "Yesterday, today, blockers."], ["code-review", "Paste diffs, get feedback."], ["ideas", "No bad ideas. Some bad ideas."]] },
    ctf: { label: "CTF team", blurb: "Capture-the-flag practice and writeups.", icon: "CTF", channels: [["challenges", "Current challenges and who's on them."], ["writeups", "How you solved it, step by step."], ["tools", "Scripts, wordlists and links."]] },
    blank: { label: "Start from scratch", blurb: "Just a #general channel.", icon: "", channels: [] },
  };
  const EIGHT = ["It compiles. Ship it.", "Undefined behaviour.", "Ask again after a git pull.", "Signs point to yes.", "Segmentation fault. Try again.",
    "404: answer not found.", "The tests say yes.", "Merge conflict. Unclear.", "Absolutely, in production.", "It's always DNS.",
    "My sources (Stack Overflow) say no.", "Without a doubt.", "Very doubtful.", "Works on my machine.", "Reply hazy, clear your cache.", "Yes, but only on Fridays."];
  const COMMANDS = [
    ["roll", "[NdM]", "Roll dice, e.g. /roll 2d6"], ["flip", "", "Flip a coin"], ["8ball", "question", "Ask the magic 8-ball"],
    ["poll", "question | option | option", "Start a poll (2 to 6 options)"], ["quiz", "", "Post a random Trendcode quiz question"],
    ["hash", "text", "SHA-256 any text"], ["caesar", "shift text", "Caesar-shift a message"], ["rot13", "text", "ROT13 a message"],
    ["binary", "text", "Text to binary"], ["base64", "text", "Text to Base64"], ["me", "action", "Describe an action"],
    ["spoiler", "text", "Hide text until clicked"], ["shrug", "[text]", "Append ¯\\_(ツ)_/¯"], ["tableflip", "[text]", "(╯°□°)╯︵ ┻━┻"],
    ["unflip", "[text]", "┬─┬ノ( º _ ºノ)"], ["nick", "name", "Set your nickname in this server"], ["topic", "text", "Set this channel's topic (admins)"],
  ];
  const ICONS = {
    hash: "M5 9h14M5 15h14M10 4 8 20M16 4l-2 16",
    announce: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12",
    plus: "M12 5v14M5 12h14", compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    down: "m6 9 6 6 6-6", reply: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v4", smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", x: "M18 6 6 18M6 6l12 12",
    menu: "M4 6h16M4 12h16M4 18h16", link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
    up: "m18 15-6-6-6 6", downsm: "m6 9 6 6 6-6", slash: "M15 4 9 20", leave: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  };
  const ic = (k, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[k]}"/></svg>`;

  // ---------- state ----------
  const S = {
    acct: null, client: null, me: null,
    servers: new Map(), mine: new Map(), activity: new Map(), mentions: new Map(),
    server: null, channels: [], channel: null, members: [], msgs: [], noMore: false,
    reacts: new Map(), votes: new Map(), rt: null, online: new Set(), typing: new Map(),
    reply: null, editing: null, view: "chat", lastTyped: 0, guestKey: "guest-" + Math.random().toString(36).slice(2, 10),
  };
  const readMap = () => store.get("tc-chat-read", {});
  const markRead = (chId, at = new Date().toISOString()) => { const r = readMap(); if (!r[chId] || r[chId] < at) { r[chId] = at; store.set("tc-chat-read", r); } };
  const isUnread = (chId) => { const last = S.activity.get(chId); return last && (!readMap()[chId] || readMap()[chId] < last) && (!S.channel || S.channel.id !== chId); };
  const myRole = (sid = S.server && S.server.id) => (S.mine.get(sid) || {}).role || null;
  const isAdmin = () => ["owner", "admin"].includes(myRole());
  const myName = () => { const p = S.acct && S.acct.profile; return p ? p.display_name || p.username : ""; };
  const myHandle = () => (S.acct && S.acct.profile ? S.acct.profile.username : "");
  const member = (uid) => S.members.find((m) => m.user_id === uid);
  const nameOf = (uid) => { const m = member(uid); return (m && m.nickname) || C.author(uid).name; };
  const roleOf = (uid) => (member(uid) || {}).role || "";
  const initials = (name) => name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase() || "?";
  const srvIcon = (s, extra = "") => `<span class="srv-icon ${extra}" style="--c:${s.color}">${escapeHtml(s.icon || initials(s.name))}</span>`;
  const banner = (s, cls = "") => `<span class="bn bn-${s.banner || "grid"} ${cls}" style="--srv:${s.color}"></span>`;
  const avatar = (uid, size) => C.author(uid).avatar(size);
  const err = (e) => C.nicerError(e);
  const $main = $("#dc-main"), $side = $("#dc-side"), $rail = $("#dc-rail"), $mem = $("#dc-members"), $pop = $("#dc-pop"), $modal = $("#dc-modal");

  // ---------- message formatting ----------
  function fmt(text) {
    const blocks = [];
    let t = String(text).replace(/```(?:[a-z0-9]*\n)?([\s\S]*?)```/g, (_, code) => `\u0000${blocks.push(code.replace(/\n$/, "")) - 1}\u0000`);
    t = escapeHtml(t)
      .replace(/`([^`\n]{1,300})`/g, "<code>$1</code>")
      .replace(/\|\|([^|\n]{1,300})\|\|/g, '<span class="spoiler" tabindex="0" role="button" aria-label="Spoiler, click to reveal">$1</span>')
      .replace(/\*\*([^*\n]{1,300})\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\n]{1,300})\*(?!\w)/g, "$1<em>$2</em>")
      .replace(/~~([^~\n]{1,300})~~/g, "<s>$1</s>")
      .replace(/(^|[\s(])(https:\/\/[^\s<)]{3,300})/g, '$1<a href="$2" target="_blank" rel="nofollow ugc noopener noreferrer">$2</a>')
      .replace(/(^|[\s(])@([a-z0-9_]{3,20}|everyone)\b/g, '$1<span class="mention-tag">@$2</span>')
      .split("\n").map((l) => (l.startsWith("&gt; ") ? `<blockquote>${l.slice(5)}</blockquote>` : l)).join("<br />")
      .replace(/<\/blockquote><br \/>/g, "</blockquote>");
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<pre><code>${escapeHtml(blocks[i])}</code></pre>`);
  }
  const mentionsMe = (m) => !!myHandle() && m.user_id !== (S.me && S.me.id) &&
    (new RegExp(`(^|\\W)@(${myHandle()}|everyone)\\b`).test(m.body || "") || (m.reply_to && (S.msgs.find((x) => x.id === m.reply_to) || {}).user_id === S.me.id));

  // ---------- slash commands ----------
  const sha256 = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const caesar = (s, k) => s.replace(/[a-z]/gi, (c) => { const b = c <= "Z" ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - b + k) % 26 + 26) % 26 + b); });
  async function parseCommand(raw) {
    const m = raw.match(/^\/(\w+)\s*([\s\S]*)$/);
    if (!m) return { kind: "text", body: raw };
    const [, cmd, arg] = m, a = arg.trim();
    switch (cmd.toLowerCase()) {
      case "roll": {
        const d = (a || "1d6").match(/^(\d{1,2})?d(\d{1,4})$/i);
        if (!d) throw new Error("Try /roll 2d6 (up to 20 dice, up to d1000).");
        const n = Math.min(20, Math.max(1, +(d[1] || 1))), sides = Math.min(1000, Math.max(2, +d[2]));
        const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides));
        return { kind: "roll", body: `${n}d${sides}`, meta: { n, sides, rolls, total: rolls.reduce((x, y) => x + y, 0) } };
      }
      case "flip": return { kind: "flip", body: "", meta: { side: Math.random() < 0.5 ? "heads" : "tails" } };
      case "8ball": if (!a) throw new Error("Ask it something: /8ball will my code work?");
        return { kind: "8ball", body: a, meta: { answer: EIGHT[Math.floor(Math.random() * EIGHT.length)] } };
      case "poll": {
        const parts = a.split("|").map((x) => x.trim()).filter(Boolean);
        if (parts.length < 3 || parts.length > 7) throw new Error("Use /poll Question | Option A | Option B (2 to 6 options).");
        return { kind: "poll", body: parts[0].slice(0, 200), meta: { options: parts.slice(1).map((o) => o.slice(0, 80)) } };
      }
      case "quiz": { const i = Math.floor(Math.random() * quizPool.length); return { kind: "quiz", body: quizPool[i].q, meta: { i } }; }
      case "hash": if (!a) throw new Error("Give it some text: /hash hello world");
        return { kind: "hash", body: a.slice(0, 500), meta: { digest: await sha256(a.slice(0, 500)) } };
      case "caesar": { const c = a.match(/^(-?\d{1,2})\s+([\s\S]+)$/); if (!c) throw new Error("Use /caesar 3 attack at dawn");
        return { kind: "cipher", body: c[2].slice(0, 500), meta: { algo: `Caesar ${+c[1] >= 0 ? "+" : ""}${+c[1]}`, out: caesar(c[2].slice(0, 500), +c[1]) } }; }
      case "rot13": if (!a) throw new Error("Use /rot13 some text");
        return { kind: "cipher", body: a.slice(0, 500), meta: { algo: "ROT13", out: caesar(a.slice(0, 500), 13) } };
      case "binary": if (!a) throw new Error("Use /binary hi");
        return { kind: "cipher", body: a.slice(0, 80), meta: { algo: "Binary (UTF-8)", out: [...new TextEncoder().encode(a.slice(0, 80))].map((b) => b.toString(2).padStart(8, "0")).join(" ") } };
      case "base64": if (!a) throw new Error("Use /base64 hello");
        return { kind: "cipher", body: a.slice(0, 500), meta: { algo: "Base64", out: btoa(String.fromCharCode(...new TextEncoder().encode(a.slice(0, 500)))) } };
      case "me": if (!a) throw new Error("Use /me waves"); return { kind: "me", body: a };
      case "spoiler": if (!a) throw new Error("Use /spoiler the ending"); return { kind: "text", body: `||${a}||` };
      case "shrug": return { kind: "text", body: `${a} ¯\\\\_(ツ)_/¯`.trim() };
      case "tableflip": return { kind: "text", body: `${a} (╯°□°)╯︵ ┻━┻`.trim() };
      case "unflip": return { kind: "text", body: `${a} ┬─┬ノ( º _ ºノ)`.trim() };
      case "nick": {
        const { error } = await S.client.from("server_members").update({ nickname: a.slice(0, 32) }).eq("server_id", S.server.id).eq("user_id", S.me.id);
        if (error) throw new Error(err(error));
        toast(`<div>${a ? `Your nickname here is now <strong>${escapeHtml(a)}</strong>` : "Nickname cleared"}</div>`);
        await loadMembers(); return null;
      }
      case "topic": {
        if (!isAdmin()) throw new Error("Only admins can change the topic.");
        const { error } = await S.client.from("channels").update({ topic: a.slice(0, 120) }).eq("id", S.channel.id);
        if (error) throw new Error(err(error));
        return null;
      }
      default: throw new Error(`Unknown command /${cmd}. Type / to see them all.`);
    }
  }

  // ---------- data loading ----------
  async function loadMyServers() {
    S.mine.clear();
    if (S.me) {
      const { data, error } = await S.client.from("server_members").select("server_id, role, nickname, joined_at, servers(*)").eq("user_id", S.me.id).order("joined_at");
      if (error) throw error;
      data.forEach((r) => { if (r.servers) { S.mine.set(r.server_id, r); S.servers.set(r.server_id, r.servers); } });
    }
    if (!S.servers.has(HQ)) {
      const { data } = await S.client.from("servers").select("*").eq("id", HQ).maybeSingle();
      if (data) S.servers.set(HQ, data);
    }
  }
  async function loadServer(sid) {
    if (S.servers.has(sid)) return S.servers.get(sid);
    const { data } = await S.client.from("servers").select("*").eq("id", sid).maybeSingle();
    if (data) S.servers.set(sid, data);
    return data;
  }
  async function loadChannels() {
    const { data, error } = await S.client.from("channels").select("*").eq("server_id", S.server.id).order("position").order("created_at");
    if (error) throw error;
    S.channels = data;
  }
  async function loadMembers() {
    const { data } = await S.client.from("server_members").select(`user_id, role, nickname, joined_at, ${C.AUTHOR}`).eq("server_id", S.server.id).order("joined_at").limit(500);
    S.members = data || [];
    C.remember(S.members);
    const mine = S.me && S.members.find((m) => m.user_id === S.me.id);
    if (mine) S.mine.set(S.server.id, { ...(S.mine.get(S.server.id) || {}), ...mine, servers: S.server });
    renderMembers();
  }
  async function loadActivity(sid) {
    const { data } = await S.client.rpc("channel_activity", { s: sid });
    (data || []).forEach((r) => S.activity.set(r.channel_id, r.last_at));
  }
  async function loadExtras(ids) {
    if (!ids.length) return;
    const [{ data: rs }, { data: vs }] = await Promise.all([
      S.client.from("reactions").select("message_id, user_id, emoji, created_at").in("message_id", ids).order("created_at"),
      S.client.from("poll_votes").select("message_id, user_id, option").in("message_id", ids),
    ]);
    (rs || []).forEach(addReact);
    (vs || []).forEach((v) => { if (!S.votes.has(v.message_id)) S.votes.set(v.message_id, new Map()); S.votes.get(v.message_id).set(v.user_id, v.option); });
  }
  function addReact(r) {
    if (!S.reacts.has(r.message_id)) S.reacts.set(r.message_id, new Map());
    const m = S.reacts.get(r.message_id);
    if (!m.has(r.emoji)) m.set(r.emoji, new Set());
    m.get(r.emoji).add(r.user_id);
  }
  function dropReact(r) {
    const m = S.reacts.get(r.message_id);
    if (!m || !m.has(r.emoji)) return;
    m.get(r.emoji).delete(r.user_id);
    if (!m.get(r.emoji).size) m.delete(r.emoji);
  }
  async function loadMessages(before) {
    let q = S.client.from("messages").select(`*, ${C.AUTHOR}`).eq("channel_id", S.channel.id).order("created_at", { ascending: false }).limit(PAGE);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error) throw error;
    C.remember(data);
    const replyIds = data.map((m) => m.reply_to).filter((id) => id && !data.some((x) => x.id === id) && !S.msgs.some((x) => x.id === id));
    if (replyIds.length) {
      const { data: refs } = await S.client.from("messages").select(`id, user_id, body, kind, ${C.AUTHOR}`).in("id", replyIds);
      C.remember(refs || []);
      (refs || []).forEach((r) => S.refCache.set(r.id, r));
    }
    await loadExtras(data.map((m) => m.id));
    return data.reverse();
  }
  S.refCache = new Map();

  // ---------- realtime for the open server ----------
  function subscribe(sid) {
    if (S.rt) S.client.removeChannel(S.rt);
    S.online = new Set(); S.typing.clear();
    const f = `server_id=eq.${sid}`;
    S.rt = S.client.channel(`srv:${sid}`, { config: { presence: { key: S.me ? S.me.id : S.guestKey }, broadcast: { self: false } } })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: f }, ({ new: m }) => onNewMessage(m))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: f }, ({ new: m }) => {
        const i = S.msgs.findIndex((x) => x.id === m.id);
        if (i >= 0) { S.msgs[i] = { ...S.msgs[i], ...m }; renderFeed({ keep: true }); }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, ({ old }) => {
        if (!S.msgs.some((x) => x.id === old.id)) return;
        S.msgs = S.msgs.filter((x) => x.id !== old.id); renderFeed({ keep: true });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions", filter: f }, ({ new: r }) => {
        if (!S.msgs.some((x) => x.id === r.message_id)) return;
        addReact(r); renderFeed({ keep: true, popped: `${r.message_id}|${r.emoji}` });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "reactions" }, ({ old }) => {
        if (!S.msgs.some((x) => x.id === old.message_id)) return;
        dropReact(old); renderFeed({ keep: true });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, ({ eventType, new: v, old }) => {
        const row = eventType === "DELETE" ? old : v;
        if (!S.msgs.some((x) => x.id === row.message_id)) return;
        if (!S.votes.has(row.message_id)) S.votes.set(row.message_id, new Map());
        if (eventType === "DELETE") S.votes.get(row.message_id).delete(row.user_id);
        else S.votes.get(row.message_id).set(row.user_id, row.option);
        renderFeed({ keep: true });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "channels", filter: f }, async () => {
        await loadChannels();
        if (S.channel && !S.channels.some((c) => c.id === S.channel.id)) return go(S.server.id);
        S.channel = S.channels.find((c) => c.id === S.channel.id) || S.channel;
        renderSide(); renderTop();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "server_members", filter: f }, () => loadMembers().then(() => { renderSide(); renderCompose(); }))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "server_members" }, ({ old }) => {
        if (old.server_id !== sid) return;
        if (S.me && old.user_id === S.me.id) { S.mine.delete(sid); toast("<div>You're no longer a member of this server.</div>"); renderRail(); renderCompose(); }
        loadMembers();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "servers", filter: `id=eq.${sid}` }, ({ new: s }) => {
        S.server = { ...S.server, ...s }; S.servers.set(sid, S.server); paintServerTheme(); renderRail(); renderSide();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "servers" }, ({ old }) => {
        if (old.id !== sid) return;
        S.servers.delete(sid); S.mine.delete(sid); toast("<div>This server was deleted.</div>"); go(HQ);
      })
      .on("presence", { event: "sync" }, () => {
        S.online = new Set(Object.values(S.rt.presenceState()).map((m) => m[0] && m[0].uid).filter(Boolean));
        renderMembers();
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.ch !== (S.channel && S.channel.id) || (S.me && payload.uid === S.me.id)) return;
        S.typing.set(payload.uid, { name: payload.name, until: Date.now() + 4000 });
        renderTyping();
      })
      .subscribe(async (status) => { if (status === "SUBSCRIBED" && S.me) await S.rt.track({ uid: S.me.id }); });
  }

  async function onNewMessage(m) {
    S.activity.set(m.channel_id, m.created_at);
    if (S.channel && m.channel_id === S.channel.id) {
      if (S.msgs.some((x) => x.id === m.id)) return;
      await C.loadProfiles(S.client, [m.user_id]);
      S.typing.delete(m.user_id);
      const stick = nearBottom();
      S.msgs.push(m);
      renderFeed({ bottom: stick || (S.me && m.user_id === S.me.id), keep: !stick });
      renderTyping();
      if (document.visibilityState === "visible") markRead(m.channel_id, m.created_at);
    } else {
      if (mentionsMe(m)) S.mentions.set(m.channel_id, (S.mentions.get(m.channel_id) || 0) + 1);
      renderSide();
    }
  }

  // ---------- navigation ----------
  // #hq/lobby · #<serverId>/<channel-name> · #explore
  function parseHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === "explore") return { explore: true };
    const [s, ch] = h.split("/");
    return { sid: !s || s === "hq" ? HQ : s, chName: ch || "" };
  }
  const go = (sid, chName = "") => { location.hash = `${sid === HQ ? "hq" : sid}${chName ? "/" + chName : ""}`; };
  let routing = 0;
  async function route() {
    const r = parseHash(), token = ++routing;
    closePop(); app.classList.remove("side-open");
    if (r.explore) return openExplore();
    S.view = "chat";
    try {
      if (!S.server || S.server.id !== r.sid) {
        const s = await loadServer(r.sid);
        if (token !== routing) return;
        if (!s) { toast("<div>That server doesn't exist or is private.</div>"); return go(HQ); }
        S.server = s; S.channel = null; S.members = []; S.mentions.clear();
        paintServerTheme(); renderRail(); renderSide(); $main.innerHTML = `<p class="loading">Loading ${escapeHtml(s.name)}…</p>`;
        await Promise.all([loadChannels(), loadActivity(s.id)]);
        if (token !== routing) return;
        subscribe(s.id);
        loadMembers();
      }
      const ch = S.channels.find((c) => c.name === r.chName) ||
        S.channels.find((c) => c.name === store.get("tc-chat-last", {})[S.server.id]) ||
        S.channels.find((c) => ["lobby", "general"].includes(c.name)) || S.channels[0];
      if (!ch) { renderSide(); $main.innerHTML = `<p class="loading">This server has no channels yet.</p>`; return; }
      if (!S.channel || S.channel.id !== ch.id) await openChannel(ch, token);
      else { renderSide(); }
    } catch (e) {
      $main.innerHTML = `<p class="loading">${escapeHtml(err(e))}</p>`;
    }
  }
  async function openChannel(ch, token) {
    S.channel = ch; S.msgs = []; S.reply = null; S.editing = null; S.typing.clear();
    S.mentions.delete(ch.id);
    const last = store.get("tc-chat-last", {}); last[S.server.id] = ch.name; store.set("tc-chat-last", last);
    document.title = `#${ch.name} · ${S.server.name} — Trendcode`;
    renderSide(); renderMainShell();
    const msgs = await loadMessages();
    if (token !== routing || S.channel.id !== ch.id) return;
    S.msgs = msgs; S.noMore = msgs.length < PAGE;
    renderFeed({ bottom: true });
    markRead(ch.id, S.activity.get(ch.id));
    renderRail();
  }

  // ---------- rendering: rail ----------
  function paintServerTheme() { if (S.server) app.style.setProperty("--srv", S.server.color); }
  function renderRail() {
    const list = [S.servers.get(HQ), ...[...S.mine.keys()].filter((id) => id !== HQ).map((id) => S.servers.get(id))].filter(Boolean);
    const viewingOther = S.server && !list.some((s) => s.id === S.server.id) && S.view === "chat";
    if (viewingOther) list.push(S.server);
    $rail.innerHTML = list.map((s, i) => `${i === 1 ? "<hr />" : ""}
        <a class="rail-item${S.view === "chat" && S.server && S.server.id === s.id ? " on" : ""}" href="#${s.id === HQ ? "hq" : s.id}" data-tip="${escapeHtml(s.name)}" aria-label="${escapeHtml(s.name)}">${srvIcon(s)}</a>`).join("") +
      `<hr />` +
      (S.me ? `<button type="button" class="rail-item" data-act="create" data-tip="Add a server" aria-label="Add a server"><span class="srv-icon tool">${ic("plus")}</span></button>` : "") +
      `<a class="rail-item${S.view === "explore" ? " on" : ""}" href="#explore" data-tip="Explore servers" aria-label="Explore servers"><span class="srv-icon tool">${ic("compass")}</span></a>`;
  }

  // ---------- rendering: channel sidebar ----------
  function renderSide() {
    if (S.view === "explore") {
      $side.innerHTML = `<div class="side-head" style="cursor:default"><div class="side-title"><span>Explore</span></div></div>
        <div class="side-list"><a class="ch on" href="#explore">${ic("compass")}<span>Public servers</span></a>
        ${S.me ? `<button type="button" class="ch" style="width:100%;background:none;border:0;cursor:pointer" data-act="create">${ic("plus")}<span>Create or join a server</span></button>` : ""}</div>${sideMe()}`;
      return;
    }
    const s = S.server;
    if (!s) return;
    const groups = [["announce", "Announcements"], ["text", "Text channels"]];
    $side.innerHTML = `
      <button type="button" class="side-head" data-act="server-menu" aria-haspopup="menu">
        ${banner(s, "side-banner")}
        <div class="side-title"><span>${escapeHtml(s.name)}</span>${ic("down")}</div>
      </button>
      <div class="side-list">
        ${groups.map(([kind, label]) => {
          const chs = S.channels.filter((c) => c.kind === kind);
          if (!chs.length && !(kind === "text" && isAdmin())) return "";
          return `<div class="side-group"><span>${label}</span>${isAdmin() && kind === "text" ? `<button type="button" data-act="new-channel" aria-label="Create channel">${ic("plus")}</button>` : ""}</div>` +
            chs.map((c) => {
              const ping = S.mentions.get(c.id);
              return `<a class="ch${S.channel && S.channel.id === c.id ? " on" : ""}${isUnread(c.id) ? " unread" : ""}" href="#${s.id === HQ ? "hq" : s.id}/${c.name}" title="${escapeHtml(c.topic)}">
                ${ic(c.kind === "announce" ? "announce" : "hash")}<span>${escapeHtml(c.name)}</span>${ping ? `<b class="ping">${ping}</b>` : ""}</a>`;
            }).join("");
        }).join("")}
      </div>${sideMe()}`;
  }
  function sideMe() {
    if (!S.me || !S.acct.profile) {
      return `<div class="side-me"><div><strong>Reading as a guest</strong><small>Sign in to chat</small></div><a class="btn btn-small" href="${C.signInHref(location.hash)}">Sign in</a></div>`;
    }
    const m = S.server && member(S.me.id);
    return `<div class="side-me"><span class="av"><span>${TCAvatar.svg(TCAvatar.get(), 32, { noEmblem: true })}</span><i class="dot on"></i></span>
      <div><strong>${escapeHtml((m && m.nickname) || myName())}</strong><small>@${escapeHtml(myHandle())}</small></div>
      <a class="icon-btn" href="${BASE}profile.html" title="Edit your profile and character" aria-label="Edit your profile">${ic("gear")}</a></div>`;
  }

  // ---------- rendering: main ----------
  function renderMainShell() {
    $main.innerHTML = `
      <div class="main-top" id="main-top"></div>
      <div class="feed" id="feed" role="log" aria-live="polite" aria-label="Messages"></div>
      <div class="compose" id="compose"></div>`;
    renderTop(); renderCompose();
    $("#feed").addEventListener("scroll", onFeedScroll, { passive: true });
  }
  function renderTop() {
    const top = $("#main-top");
    if (!top || !S.channel) return;
    top.innerHTML = `
      <button type="button" class="icon-btn only-narrow" data-act="toggle-side" aria-label="Show channels">${ic("menu")}</button>
      <h2>${ic(S.channel.kind === "announce" ? "announce" : "hash")}${escapeHtml(S.channel.name)}</h2>
      <span class="topic">${S.channel.topic ? fmt(S.channel.topic) : ""}</span>
      <span class="tools">
        ${S.me && myRole() ? `<button type="button" class="icon-btn" data-act="invite" title="Invite people" aria-label="Invite people">${ic("link")}</button>` : ""}
        <button type="button" class="icon-btn" data-act="toggle-members" title="Member list" aria-label="Toggle member list" aria-pressed="${!app.classList.contains("no-members")}">${ic("users")}</button>
      </span>`;
  }
  const nearBottom = () => { const f = $("#feed"); return !f || f.scrollHeight - f.scrollTop - f.clientHeight < 140; };

  function renderFeed({ bottom = false, keep = false, popped = "" } = {}) {
    const feed = $("#feed");
    if (!feed) return;
    const fromBottom = feed.scrollHeight - feed.scrollTop;
    const ch = S.channel;
    let html = S.noMore
      ? `<div class="feed-start"><span class="big">${ic(ch.kind === "announce" ? "announce" : "hash")}</span><h3>Welcome to #${escapeHtml(ch.name)}</h3><p>This is the start of the #${escapeHtml(ch.name)} channel.${ch.topic ? " " + fmt(ch.topic) : ""}</p></div>`
      : `<button type="button" class="btn btn-ghost btn-small feed-more" data-act="older">Load earlier messages</button>`;
    let lastDay = "", prev = null;
    for (const m of S.msgs) {
      const day = new Date(m.created_at).toDateString();
      if (day !== lastDay) { html += `<p class="day">${dayLabel(m.created_at)}</p>`; lastDay = day; prev = null; }
      const cont = prev && prev.user_id === m.user_id && !m.reply_to && m.kind === "text" && prev.kind === "text" &&
        Date.parse(m.created_at) - Date.parse(prev.created_at) < 7 * 60000;
      html += messageHtml(m, cont, popped);
      prev = m;
    }
    feed.innerHTML = html;
    if (bottom) feed.scrollTop = feed.scrollHeight;
    else if (keep) feed.scrollTop = feed.scrollHeight - fromBottom;
  }
  const dayLabel = (iso) => {
    const d = new Date(iso), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Today";
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: d.getFullYear() === t.getFullYear() ? undefined : "numeric" });
  };

  function messageHtml(m, cont, popped) {
    const mine = S.me && m.user_id === S.me.id;
    const role = roleOf(m.user_id);
    const time = new Date(m.created_at);
    const name = escapeHtml(nameOf(m.user_id));
    let ref = "";
    if (m.reply_to) {
      const r = S.msgs.find((x) => x.id === m.reply_to) || S.refCache.get(m.reply_to);
      ref = r ? `<div class="m-reply" data-jump="${r.id}"><span class="av-xs">${avatar(r.user_id, 16)}</span><b>${escapeHtml(nameOf(r.user_id))}</b><span>${escapeHtml(snippet(r))}</span></div>`
        : `<div class="m-reply"><span>Original message was deleted</span></div>`;
    }
    const reacts = S.reacts.get(m.id);
    const rx = reacts && reacts.size ? `<div class="reacts">${[...reacts].map(([e, set]) =>
      `<button type="button" class="react${S.me && set.has(S.me.id) ? " me" : ""}${popped === `${m.id}|${e}` ? " pop" : ""}" data-react="${m.id}" data-emoji="${e}" title="${escapeHtml([...set].map(nameOf).slice(0, 8).join(", "))}">${e}<b>${set.size}</b></button>`).join("")}</div>` : "";
    const canDelete = mine || isAdmin();
    const tools = S.me && myRole() ? `<div class="m-tools">
        <button type="button" data-act="pick" data-id="${m.id}" aria-label="Add reaction" title="Add reaction">${ic("smile")}</button>
        <button type="button" data-act="reply" data-id="${m.id}" aria-label="Reply" title="Reply">${ic("reply")}</button>
        ${mine && ["text", "me"].includes(m.kind) ? `<button type="button" data-act="edit" data-id="${m.id}" aria-label="Edit" title="Edit">${ic("edit")}</button>` : ""}
        ${canDelete ? `<button type="button" class="danger" data-act="delete" data-id="${m.id}" aria-label="Delete" title="Delete">${ic("trash")}</button>` : ""}
      </div>` : "";
    return `<div class="m${cont ? " cont" : ""}${mentionsMe(m) ? " mention" : ""}" data-id="${m.id}" id="m${m.id}">
      ${ref}
      <span class="m-av" data-user="${m.user_id}">${avatar(m.user_id, 40)}</span>
      ${cont ? `<span class="m-hover-time">${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>` : `<div class="m-head"><span class="m-name role-${role}" data-user="${m.user_id}">${name}</span>${role === "owner" ? '<span class="m-tag">Owner</span>' : role === "admin" ? '<span class="m-tag">Admin</span>' : ""}<span class="m-time" title="${time.toLocaleString()}">${C.timeAgo(m.created_at) === "just now" ? "just now" : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>`}
      ${bodyHtml(m, name)}
      ${rx}${tools}
    </div>`;
  }
  const snippet = (r) => ({ poll: `Poll: ${r.body}`, roll: `rolled ${r.body}`, flip: "flipped a coin", "8ball": `asked the 8-ball: ${r.body}`, hash: `hashed “${r.body}”`, cipher: `encoded “${r.body}”`, quiz: `Quiz: ${r.body}` }[r.kind] || r.body || "").slice(0, 120);

  function bodyHtml(m, name) {
    const meta = m.meta || {};
    const edited = m.edited_at ? `<span class="m-edited" title="${new Date(m.edited_at).toLocaleString()}">(edited)</span>` : "";
    switch (m.kind) {
      case "me": return `<div class="m-body"><span class="m-me">${name} ${fmt(m.body)}</span>${edited}</div>`;
      case "roll": return `<div class="card-k"><h4><span>Rolled ${escapeHtml(m.body)}</span></h4><div class="dice">${(meta.rolls || []).map((r) => `<span class="die">${+r}</span>`).join("")}<span class="total">= ${+meta.total || 0}</span></div></div>`;
      case "flip": return `<div class="card-k"><h4><span>Coin flip</span></h4><div class="coin-row"><span class="coin">${meta.side === "heads" ? "H" : "T"}</span><strong>${meta.side === "heads" ? "Heads" : "Tails"}</strong></div></div>`;
      case "8ball": return `<div class="card-k"><h4><span>The magic 8-ball</span></h4><p class="q">${fmt(m.body)}</p><div class="ball-row"><span class="ball"><span>8</span></span><p>${escapeHtml(meta.answer || "")}</p></div></div>`;
      case "hash": return `<div class="card-k"><h4><span>SHA-256</span><a href="${BASE}posts/hashing-explained.html" style="text-transform:none;letter-spacing:0">What's a hash?</a></h4><p class="mono-in">${escapeHtml(m.body)}</p><p class="mono-out">${escapeHtml(meta.digest || "")}</p></div>`;
      case "cipher": return `<div class="card-k"><h4><span>${escapeHtml(meta.algo || "Cipher")}</span></h4><p class="mono-in">${escapeHtml(m.body)}</p><p class="mono-out">${escapeHtml(meta.out || "")}</p></div>`;
      case "poll": {
        const votes = S.votes.get(m.id) || new Map(), total = votes.size, mineV = S.me ? votes.get(S.me.id) : undefined;
        const opts = (meta.options || []).map((o, i) => {
          const n = [...votes.values()].filter((v) => v === i).length, pct = total ? Math.round((n / total) * 100) : 0;
          return `<button type="button" class="opt${mineV === i ? " mine" : ""}" data-vote="${m.id}" data-opt="${i}" ${S.me && myRole() ? "" : "disabled"}><i style="width:${pct}%"></i><span>${escapeHtml(o)}</span><b>${n} · ${pct}%</b></button>`;
        }).join("");
        return `<div class="card-k"><h4><span>Poll</span><span>${total} vote${total === 1 ? "" : "s"}</span></h4><p class="q">${fmt(m.body)}</p>${opts}<p class="foot">${mineV !== undefined ? "Click your choice again to take your vote back." : S.me && myRole() ? "Click to vote." : "Join the server to vote."}</p></div>`;
      }
      case "quiz": {
        const qz = quizPool[meta.i];
        if (!qz) return `<div class="m-body">${fmt(m.body)}</div>`;
        const ans = store.get("tc-chat-quiz", {})[m.id];
        const opts = qz.options.map((o, i) => {
          const cls = ans === undefined ? "" : i === qz.a ? " right" : i === ans ? " wrong" : "";
          return `<button type="button" class="opt${cls}" data-quiz="${m.id}" data-opt="${i}" ${ans !== undefined ? "disabled" : ""}><span>${escapeHtml(o)}</span></button>`;
        }).join("");
        return `<div class="card-k"><h4><span>Quiz</span>${qz.post ? `<a href="${BASE}posts/${qz.post}.html" style="text-transform:none;letter-spacing:0">Read the explainer</a>` : ""}</h4><p class="q">${escapeHtml(qz.q)}</p>${opts}${ans !== undefined ? `<p class="why"><strong>${ans === qz.a ? "Correct." : "Not quite."}</strong> ${escapeHtml(qz.why)}</p>` : `<p class="foot">Your answer is only shown to you.</p>`}</div>`;
      }
      default: return `<div class="m-body">${fmt(m.body)}${edited}</div>`;
    }
  }

  function renderTyping() {
    const el = $("#typing");
    if (!el) return;
    const now = Date.now();
    for (const [k, v] of S.typing) if (v.until < now) S.typing.delete(k);
    const names = [...S.typing.values()].map((v) => v.name);
    el.innerHTML = names.length ? `<span class="dots"><i></i><i></i><i></i></span><span><strong>${escapeHtml(names.slice(0, 3).join(", "))}</strong> ${names.length > 3 ? "and others are" : names.length > 1 ? "are" : "is"} typing…</span>` : "";
  }
  setInterval(renderTyping, 1500);

  // ---------- composer ----------
  function renderCompose() {
    const box = $("#compose");
    if (!box || !S.channel) return;
    if (!S.me || !S.acct.profile) {
      box.innerHTML = `<div class="compose-note"><p>You're reading as a guest. Sign in to chat, react and vote.</p><a class="btn btn-small" href="${C.signInHref(location.hash)}">Sign in</a></div>`;
      return;
    }
    if (!myRole()) {
      box.innerHTML = `<div class="compose-note"><p>You're previewing <strong>${escapeHtml(S.server.name)}</strong>. Join to start chatting.</p><button type="button" class="btn btn-small" data-act="join">Join server</button></div>`;
      return;
    }
    if (S.channel.kind === "announce" && !isAdmin()) {
      box.innerHTML = `<div class="compose-note"><p>Only admins can post in #${escapeHtml(S.channel.name)}. You can still react.</p></div>`;
      return;
    }
    const bar = S.editing ? `<div class="compose-bar"><span>Editing a message · <b>Esc</b> to cancel</span><button type="button" class="icon-btn" data-act="cancel-bar" aria-label="Cancel">${ic("x")}</button></div>`
      : S.reply ? `<div class="compose-bar"><span>Replying to <b>${escapeHtml(nameOf(S.reply.user_id))}</b></span><button type="button" class="icon-btn" data-act="cancel-bar" aria-label="Cancel reply">${ic("x")}</button></div>` : "";
    const keepText = $("#msg-in") ? $("#msg-in").value : "";
    box.innerHTML = `<div class="cmds" id="cmds" hidden></div>${bar}
      <form class="compose-box" id="msg-form">
        <button type="button" class="icon-btn" data-act="show-cmds" title="Commands and games" aria-label="Commands and games">${ic("slash")}</button>
        <label class="sr-only" for="msg-in">Message #${escapeHtml(S.channel.name)}</label>
        <textarea id="msg-in" rows="1" maxlength="2000" placeholder="Message #${escapeHtml(S.channel.name)}  ·  type / for commands" autocomplete="off"></textarea>
        <button type="button" class="icon-btn" data-act="pick-compose" title="Emoji" aria-label="Insert emoji">${ic("smile")}</button>
      </form>
      <div class="typing" id="typing"></div>`;
    const ta = $("#msg-in");
    ta.value = S.editing ? S.editing.body : keepText;
    grow(ta);
    ta.addEventListener("input", () => { grow(ta); showCmds(); sendTyping(); });
    ta.addEventListener("keydown", onComposeKey);
    $("#msg-form").addEventListener("submit", (e) => { e.preventDefault(); send(); });
    renderTyping();
  }
  const grow = (ta) => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, window.innerHeight * 0.4) + "px"; };
  function sendTyping() {
    if (!S.rt || Date.now() - S.lastTyped < 2500) return;
    S.lastTyped = Date.now();
    S.rt.send({ type: "broadcast", event: "typing", payload: { ch: S.channel.id, uid: S.me.id, name: nameOf(S.me.id) || myName() } });
  }
  let cmdIndex = 0;
  function showCmds(force = false) {
    const ta = $("#msg-in"), box = $("#cmds");
    if (!ta || !box) return;
    const m = ta.value.match(/^\/(\w*)$/);
    if (!m && !force) { box.hidden = true; return; }
    const q = m ? m[1].toLowerCase() : "";
    const list = COMMANDS.filter(([c]) => c.startsWith(q));
    if (!list.length) { box.hidden = true; return; }
    cmdIndex = Math.min(cmdIndex, list.length - 1);
    box.hidden = false;
    box.innerHTML = `<h5>Commands${q ? ` matching /${escapeHtml(q)}` : ""}</h5>` + list.map(([c, args, d], i) =>
      `<div class="cmd${i === cmdIndex ? " on" : ""}" data-cmd="${c}"><b>/${c}</b><code>${escapeHtml(args)}</code><span>${escapeHtml(d)}</span></div>`).join("");
  }
  function pickCmd(c) {
    const ta = $("#msg-in");
    ta.value = `/${c} `; ta.focus(); $("#cmds").hidden = true; cmdIndex = 0;
    if (c === "flip" || c === "quiz") send();
  }
  function onComposeKey(e) {
    const box = $("#cmds"), ta = e.target;
    if (box && !box.hidden) {
      const items = [...box.querySelectorAll(".cmd")];
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); cmdIndex = (cmdIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; showCmds(true); return; }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && /^\/\w*$/.test(ta.value))) { e.preventDefault(); pickCmd(items[cmdIndex].dataset.cmd); return; }
      if (e.key === "Escape") { box.hidden = true; return; }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); return; }
    if (e.key === "Escape" && (S.reply || S.editing)) { S.reply = null; S.editing = null; renderCompose(); return; }
    if (e.key === "ArrowUp" && !ta.value) {
      const last = [...S.msgs].reverse().find((m) => m.user_id === S.me.id && ["text", "me"].includes(m.kind));
      if (last) { e.preventDefault(); startEdit(last.id); }
    }
  }
  let sending = false;
  async function send() {
    const ta = $("#msg-in");
    if (!ta || sending) return;
    const raw = ta.value.trim();
    if (!raw) return;
    sending = true;
    try {
      if (S.editing) {
        const { error } = await S.client.from("messages").update({ body: raw }).eq("id", S.editing.id);
        if (error) throw error;
        const m = S.msgs.find((x) => x.id === S.editing.id);
        if (m) { m.body = raw; m.edited_at = new Date().toISOString(); }
        S.editing = null; ta.value = ""; renderCompose(); renderFeed({ keep: true });
        return;
      }
      const cmd = await parseCommand(raw);
      ta.value = ""; grow(ta); $("#cmds").hidden = true;
      if (!cmd) return;
      const row = { channel_id: S.channel.id, user_id: S.me.id, kind: cmd.kind, body: cmd.body, meta: cmd.meta || {}, reply_to: S.reply ? S.reply.id : null };
      const { data, error } = await S.client.from("messages").insert(row).select().single();
      if (error) { ta.value = raw; throw error; }
      S.reply = null;
      if (!S.msgs.some((x) => x.id === data.id)) { S.msgs.push(data); renderFeed({ bottom: true }); }
      markRead(S.channel.id, data.created_at);
      if (cmd.kind !== "text") renderCompose();
      else if ($(".compose-bar")) renderCompose();
    } catch (e) {
      toast(`<div>${escapeHtml(err(e))}</div>`);
    } finally {
      sending = false;
      $("#msg-in") && $("#msg-in").focus();
    }
  }
  function startEdit(id) {
    const m = S.msgs.find((x) => x.id === id);
    if (!m) return;
    S.editing = { id, body: m.body }; S.reply = null; renderCompose();
    const ta = $("#msg-in"); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  // ---------- members ----------
  function renderMembers() {
    if (!S.server || S.view !== "chat") { $mem.innerHTML = ""; return; }
    const on = (m) => S.online.has(m.user_id);
    const sorted = [...S.members].sort((a, b) => (on(b) - on(a)) || nameOf(a.user_id).localeCompare(nameOf(b.user_id)));
    const groups = [["owner", "Owner"], ["admin", "Admins"], ["member", "Members"]];
    const row = (m) => {
      const a = C.author(m.user_id);
      return `<button type="button" class="mem${on(m) ? "" : " off"}" data-user="${m.user_id}">
        <span class="av"><span>${a.avatar(32)}</span><i class="dot${on(m) ? " on" : ""}"></i></span>
        <div><strong class="role-${m.role}">${escapeHtml(m.nickname || a.name)}</strong>${a.handle ? `<small>@${escapeHtml(a.handle)}</small>` : ""}</div></button>`;
    };
    const online = S.members.filter(on).length;
    $mem.innerHTML = `<p class="mem-group" style="padding-top:0.3rem">${online} online · ${S.members.length} member${S.members.length === 1 ? "" : "s"}</p>` +
      groups.map(([r, label]) => {
        const list = sorted.filter((m) => m.role === r);
        return list.length ? `<p class="mem-group">${label} · ${list.length}</p>${list.map(row).join("")}` : "";
      }).join("") || `<p class="mem-group">No members yet</p>`;
  }

  // ---------- popovers ----------
  function openPop(anchor, html, { align = "left", above = false } = {}) {
    $pop.className = "dc-pop"; $pop.style.width = "";
    $pop.innerHTML = html; $pop.hidden = false;
    const r = anchor.getBoundingClientRect(), w = $pop.offsetWidth, h = $pop.offsetHeight;
    let x = align === "right" ? r.right - w : r.left, y = above || r.bottom + h + 8 > innerHeight ? r.top - h - 6 : r.bottom + 6;
    x = Math.max(8, Math.min(x, innerWidth - w - 8)); y = Math.max(8, Math.min(y, innerHeight - h - 8));
    $pop.style.left = x + "px"; $pop.style.top = y + "px";
  }
  function closePop() { $pop.hidden = true; $pop.innerHTML = ""; $pop.dataset.for = ""; }
  const emojiGrid = (target) => `<div class="emoji-grid" data-target="${target}">${EMOJI.map((e) => `<button type="button" data-emoji="${e}" aria-label="${e}">${e}</button>`).join("")}</div>`;
  function userCard(uid, anchor) {
    const a = C.author(uid), m = member(uid);
    const s = S.server || { color: "#22d3ee", banner: "grid" };
    openPop(anchor, `<div class="card-pop">${banner({ ...s, banner: s.banner })}<div class="body">
      <div class="big-av">${a.avatar(80)}</div>
      <h4>${escapeHtml((m && m.nickname) || a.name)}</h4>
      ${a.handle ? `<p>@${escapeHtml(a.handle)}${m && m.nickname ? ` · ${escapeHtml(a.name)}` : ""}</p>` : ""}
      ${m ? `<p>${m.role === "owner" ? "Server owner" : m.role === "admin" ? "Admin" : "Member"} · joined ${new Date(m.joined_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>` : ""}
      <p>${S.online.has(uid) ? "Online now" : "Offline"}</p>
      ${a.href ? `<a class="btn btn-small" href="${a.href}">View profile</a>` : ""}
    </div></div>`);
    $pop.classList.add("card-pop");
  }
  function serverMenu(anchor) {
    const role = myRole(), s = S.server;
    const items = [];
    if (S.me && role) items.push(`<button type="button" data-act="invite">Invite people ${ic("link")}</button>`);
    if (["owner", "admin"].includes(role)) items.push(`<button type="button" data-act="settings">Server settings ${ic("gear")}</button>`, `<button type="button" data-act="new-channel">Create channel ${ic("plus")}</button>`);
    if (S.me && role) items.push(`<button type="button" data-act="nick">Change nickname ${ic("edit")}</button>`);
    if (S.me && !role) items.push(`<button type="button" data-act="join">Join ${escapeHtml(s.name)} ${ic("plus")}</button>`);
    if (S.me && role && role !== "owner") items.push(`<hr /><button type="button" class="danger" data-act="leave">Leave server ${ic("leave")}</button>`);
    if (!S.me) items.push(`<a href="${C.signInHref(location.hash)}">Sign in to join ${ic("leave")}</a>`);
    openPop(anchor, `<div class="menu" role="menu">${items.join("")}</div>`);
    $pop.style.width = anchor.offsetWidth - 16 + "px"; $pop.style.left = anchor.getBoundingClientRect().left + 8 + "px";
  }

  // ---------- modals ----------
  function modal(html, wide = false) {
    $modal.innerHTML = `<div class="dc-dialog${wide ? " wide" : ""}" role="dialog" aria-modal="true" style="--srv:${S.server ? S.server.color : "var(--accent)"}">${html}</div>`;
    $modal.hidden = false;
    const f = $modal.querySelector("input, textarea, button:not(.dlg-x)");
    f && f.focus();
    return $modal.firstElementChild;
  }
  const closeModal = () => { $modal.hidden = true; $modal.innerHTML = ""; };
  $modal.addEventListener("mousedown", (e) => { if (e.target === $modal) closeModal(); });
  const head = (title, sub = "") => `<div class="dlg-head"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}<button type="button" class="icon-btn dlg-x" data-close aria-label="Close">${ic("x")}</button></div>`;
  $modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });

  const styleFields = (s) => `
    <div class="fld"><span>Colour</span><div class="swatches">${COLORS.map((c) => `<label style="--c:${c}" title="${c}"><input type="radio" name="color" value="${c}" ${s.color === c ? "checked" : ""} /></label>`).join("")}
      <input type="color" name="custom" value="${s.color}" aria-label="Custom colour" title="Pick any colour" /></div></div>
    <div class="fld"><span>Banner</span><div class="tiles">${BANNERS.map((b) => `<label class="tile"><input type="radio" name="banner" value="${b}" ${s.banner === b ? "checked" : ""} />${banner({ ...s, banner: b })}<small>${b}</small></label>`).join("")}</div></div>`;
  const previewCard = (s) => `<div class="preview" id="srv-preview">${banner(s)}<div class="row">${srvIcon(s)}<div><strong>${escapeHtml(s.name || "Your server")}</strong><small>${escapeHtml(s.description || "A new Trendcode server")}</small></div></div></div>`;
  function readStyle(form, base) {
    const fd = new FormData(form);
    const picked = fd.get("color"), custom = fd.get("custom");
    return {
      ...base,
      name: (fd.get("name") ?? base.name ?? "").toString().slice(0, 40),
      icon: (fd.get("icon") ?? base.icon ?? "").toString().trim().slice(0, 3),
      description: (fd.get("description") ?? base.description ?? "").toString().slice(0, 200),
      color: form.dataset.customPicked === "1" ? custom : picked || base.color,
      banner: fd.get("banner") || base.banner,
    };
  }
  function liveStyle(form, base) {
    const upd = () => {
      const s = readStyle(form, base);
      $("#srv-preview", form).outerHTML = previewCard(s);
      form.closest(".dc-dialog").style.setProperty("--srv", s.color);
      form.querySelectorAll(".tile .bn").forEach((el) => el.style.setProperty("--srv", s.color));
    };
    form.addEventListener("input", (e) => {
      if (e.target.name === "custom") { form.dataset.customPicked = "1"; form.querySelectorAll('input[name="color"]').forEach((r) => (r.checked = false)); }
      if (e.target.name === "color") form.dataset.customPicked = "0";
      upd();
    });
    upd();
  }

  function openCreate() {
    if (!S.me) return (location.href = C.signInHref("#explore"));
    const base = { name: "", icon: "", description: "", color: COLORS[Math.floor(Math.random() * COLORS.length)], banner: BANNERS[Math.floor(Math.random() * 6)] };
    const dlg = modal(`${head("Create a server", "Your own space with its own channels, colours and rules. You'll be the owner.")}
      <form id="create-form"><div class="dlg-body">
        <div class="fld"><span>Start from a template</span><div class="tpl">${Object.entries(TEMPLATES).map(([k, t], i) =>
          `<label><input type="radio" name="tpl" value="${k}" ${i === 0 ? "checked" : ""} /><div><b>${t.label}</b><small>${t.blurb}${t.channels.length ? ` #${t.channels.map((c) => c[0]).join(", #")}` : ""}</small></div></label>`).join("")}</div></div>
        ${previewCard(base)}
        <div class="fld-row"><label class="fld"><span>Server name</span><input type="text" name="name" maxlength="40" required placeholder="e.g. Midnight Hackers" /></label>
          <label class="fld"><span>Icon text</span><input type="text" name="icon" maxlength="3" placeholder="Auto" /></label></div>
        <label class="fld"><span>Description</span><textarea name="description" maxlength="200" rows="2" placeholder="What's this server about?"></textarea></label>
        ${styleFields(base)}
        <label class="toggle"><span><b>Public server</b><small>Listed in Explore so anyone can find and join it. Private servers need an invite.</small></span><input type="checkbox" name="public" checked /></label>
        <p class="err" id="create-err" role="alert"></p>
      </div>
      <div class="dlg-foot"><button type="button" class="btn btn-ghost btn-small" data-act="join-code">I have an invite</button><button class="btn btn-small" type="submit">Create server</button></div></form>`);
    const form = $("#create-form", dlg);
    liveStyle(form, base);
    form.addEventListener("change", (e) => {
      if (e.target.name === "tpl" && !form.name.value) { /* keep name empty */ }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const s = readStyle(form, base), tpl = TEMPLATES[new FormData(form).get("tpl")];
      const btn = form.querySelector("[type=submit]"); btn.disabled = true;
      const { data, error } = await S.client.from("servers").insert({
        name: s.name.trim(), icon: s.icon || initials(s.name), description: s.description.trim(), color: s.color, banner: s.banner,
        is_public: form.public.checked, owner_id: S.me.id,
      }).select().single();
      if (error) { btn.disabled = false; $("#create-err").textContent = err(error); return; }
      if (tpl.channels.length) await S.client.from("channels").insert(tpl.channels.map(([name, topic], i) => ({ server_id: data.id, name, topic, position: i + 1 })));
      S.servers.set(data.id, data);
      S.mine.set(data.id, { server_id: data.id, role: "owner", nickname: "", servers: data });
      closeModal();
      toast(`<div><strong>${escapeHtml(data.name)}</strong> is live. Invite some people!</div>`);
      go(data.id, "general");
    });
  }
  function openJoinCode() {
    const dlg = modal(`${head("Join a server", "Paste an invite link or code from a friend.")}
      <form id="join-form"><div class="dlg-body"><label class="fld"><span>Invite</span><input type="text" name="code" required placeholder="chat.html?invite=k3x9q2ab  or  k3x9q2ab" /></label><p class="err" id="join-err" role="alert"></p></div>
      <div class="dlg-foot"><span></span><button class="btn btn-small" type="submit">Find server</button></div></form>`);
    $("#join-form", dlg).addEventListener("submit", (e) => {
      e.preventDefault();
      const v = e.target.code.value.trim(), m = v.match(/invite=([a-z0-9]+)/i);
      openInvite(m ? m[1] : v.split("/").pop());
    });
  }
  async function openInvite(code) {
    const { data, error } = await S.client.rpc("server_preview", { code });
    const s = data && data[0];
    if (error || !s) {
      modal(`${head("That invite didn't work")}<div class="dlg-body"><p class="muted">The code is wrong, or the server's owner reset it. Ask for a fresh link.</p></div><div class="dlg-foot"><span></span><button type="button" class="btn btn-small" data-close>OK</button></div>`);
      return;
    }
    const joined = S.mine.has(s.id);
    const dlg = modal(`${head("You've been invited")}<div class="dlg-body">${previewCard(s)}<p class="muted">${s.members} member${+s.members === 1 ? "" : "s"}</p><p class="err" id="inv-err" role="alert"></p></div>
      <div class="dlg-foot"><span></span>${!S.me ? `<a class="btn btn-small" href="${C.signInHref("")}">Sign in to join</a>` : `<button type="button" class="btn btn-small" id="inv-join">${joined ? "Open server" : `Join ${escapeHtml(s.name)}`}</button>`}</div>`);
    dlg.style.setProperty("--srv", s.color);
    const b = $("#inv-join", dlg);
    if (b) b.onclick = async () => {
      if (!joined) {
        const { error: e2 } = await S.client.rpc("join_server", { code });
        if (e2) { $("#inv-err").textContent = err(e2); return; }
        await loadMyServers();
      }
      closeModal();
      history.replaceState(null, "", location.pathname + location.hash);
      if (S.server && S.server.id === s.id) { S.server = null; } // force reload with membership
      go(s.id);
      route();
    };
  }
  async function openInviteShare() {
    const s = S.server;
    const link = () => `${location.origin}${location.pathname}?invite=${s.invite_code}`;
    const dlg = modal(`${head(`Invite friends to ${escapeHtml(s.name)}`, s.is_public ? "This server is public, so people can also find it in Explore." : "This server is private: only people with this link can join.")}
      <div class="dlg-body"><div class="invite-box"><code id="inv-link">${escapeHtml(link())}</code><button type="button" class="btn btn-small" id="inv-copy">Copy</button></div>
      ${isAdmin() ? `<p class="pq-note"><button type="button" class="btn btn-ghost btn-small" id="inv-reset">Reset link</button> Resetting stops the old link working.</p>` : ""}</div>`);
    $("#inv-copy", dlg).onclick = async (e) => { try { await navigator.clipboard.writeText(link()); e.target.textContent = "Copied"; } catch { e.target.textContent = "Select and copy"; } };
    const r = $("#inv-reset", dlg);
    if (r) r.onclick = async () => {
      const { data, error } = await S.client.rpc("regenerate_invite", { s: s.id });
      if (error) return toast(`<div>${escapeHtml(err(error))}</div>`);
      s.invite_code = data; $("#inv-link", dlg).textContent = link();
    };
  }

  function openSettings(tab = "overview") {
    const s = S.server, owner = myRole() === "owner";
    const tabs = [["overview", "Overview"], ["channels", "Channels"], ["members", "Members"], ["invites", "Invites"]];
    const dlg = modal(`<div class="settings"><nav aria-label="Settings sections"><h3>${escapeHtml(s.name)}</h3>
        ${tabs.map(([k, l]) => `<button type="button" data-tab="${k}" aria-current="${k === tab}">${l}</button>`).join("")}
        ${owner ? `<button type="button" data-tab="danger" class="danger" aria-current="${tab === "danger"}">Delete server</button>` : ""}
      </nav><div class="pane" id="set-pane"></div></div>`, true);
    dlg.addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t) openSettings(t.dataset.tab); });
    const pane = $("#set-pane", dlg);
    pane.innerHTML = `<button type="button" class="icon-btn dlg-x" data-close aria-label="Close">${ic("x")}</button>`;
    if (tab === "overview") {
      pane.insertAdjacentHTML("beforeend", `<h3>Server overview</h3><form id="ov-form">${previewCard(s)}
        <div class="fld-row"><label class="fld"><span>Server name</span><input type="text" name="name" maxlength="40" required value="${escapeHtml(s.name)}" /></label>
          <label class="fld"><span>Icon text</span><input type="text" name="icon" maxlength="3" value="${escapeHtml(s.icon)}" /></label></div>
        <label class="fld"><span>Description</span><textarea name="description" maxlength="200" rows="2">${escapeHtml(s.description)}</textarea></label>
        ${styleFields(s)}
        <label class="toggle"><span><b>Public server</b><small>Show in Explore and let anyone join.</small></span><input type="checkbox" name="public" ${s.is_public ? "checked" : ""} /></label>
        <p class="err" id="ov-err" role="alert"></p>
        <button class="btn btn-small" type="submit">Save changes</button></form>`);
      const form = $("#ov-form", pane);
      liveStyle(form, s);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const v = readStyle(form, s);
        const patch = { name: v.name.trim(), icon: v.icon || initials(v.name), description: v.description.trim(), color: v.color, banner: v.banner, is_public: form.public.checked };
        const { data, error } = await S.client.from("servers").update(patch).eq("id", s.id).select().single();
        if (error) { $("#ov-err").textContent = err(error); return; }
        S.server = { ...S.server, ...data }; S.servers.set(s.id, S.server);
        paintServerTheme(); renderRail(); renderSide();
        toast("<div>Server updated</div>");
      });
    } else if (tab === "channels") {
      pane.insertAdjacentHTML("beforeend", `<h3>Channels</h3>
        <div id="ch-rows">${S.channels.map((c, i) => `<div class="chrow" data-ch="${c.id}">
            ${ic(c.kind === "announce" ? "announce" : "hash")}
            <input type="text" value="${escapeHtml(c.name)}" data-f="name" maxlength="30" aria-label="Channel name" />
            <input type="text" class="topic-in" value="${escapeHtml(c.topic)}" data-f="topic" maxlength="120" placeholder="Topic" aria-label="Topic" />
            <span class="moves"><button type="button" class="icon-btn" data-move="-1" ${i === 0 ? "disabled" : ""} aria-label="Move up">${ic("up")}</button><button type="button" class="icon-btn" data-move="1" ${i === S.channels.length - 1 ? "disabled" : ""} aria-label="Move down">${ic("downsm")}</button></span>
            <button type="button" class="icon-btn" data-del-ch aria-label="Delete channel">${ic("trash")}</button>
            <select data-f="kind" aria-label="Who can post"><option value="text" ${c.kind === "text" ? "selected" : ""}>Everyone can post</option><option value="announce" ${c.kind === "announce" ? "selected" : ""}>Announcements: admins only</option></select>
          </div>`).join("")}</div>
        <p class="err" id="ch-err" role="alert"></p>
        <form class="inline-form" id="ch-add" style="margin-top:1rem"><input type="text" name="name" maxlength="30" placeholder="new-channel-name" required aria-label="New channel name" /><button class="btn btn-small" type="submit">Add channel</button></form>
        <p class="pq-note">Channel names use lowercase letters, numbers and dashes. Changes save as you go.</p>`);
      const fail = (e) => ($("#ch-err").textContent = err(e));
      pane.addEventListener("change", async (e) => {
        const row = e.target.closest("[data-ch]"); if (!row || !e.target.dataset.f) return;
        let v = e.target.value; if (e.target.dataset.f === "name") v = e.target.value = slugName(v);
        const { error } = await S.client.from("channels").update({ [e.target.dataset.f]: v }).eq("id", row.dataset.ch);
        if (error) return fail(error);
        await loadChannels(); renderSide(); renderTop();
      });
      pane.addEventListener("click", async (e) => {
        const row = e.target.closest("[data-ch]");
        if (e.target.closest("[data-del-ch]") && row) {
          if (S.channels.length <= 1) return fail({ message: "A server needs at least one channel." });
          if (!confirm("Delete this channel and all its messages?")) return;
          const { error } = await S.client.from("channels").delete().eq("id", row.dataset.ch);
          if (error) return fail(error);
          await loadChannels(); renderSide(); openSettings("channels");
          if (S.channel && S.channel.id === row.dataset.ch) go(S.server.id);
        }
        const mv = e.target.closest("[data-move]");
        if (mv && row) {
          const i = S.channels.findIndex((c) => c.id === row.dataset.ch), j = i + +mv.dataset.move;
          const list = [...S.channels]; [list[i], list[j]] = [list[j], list[i]];
          await Promise.all(list.map((c, k) => S.client.from("channels").update({ position: k }).eq("id", c.id)));
          await loadChannels(); renderSide(); openSettings("channels");
        }
      });
      $("#ch-add", pane).addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = slugName(e.target.name.value);
        const { error } = await S.client.from("channels").insert({ server_id: s.id, name, position: S.channels.length });
        if (error) return fail(error.code === "23505" ? { message: "There's already a channel with that name." } : error);
        await loadChannels(); renderSide(); openSettings("channels");
      });
    } else if (tab === "members") {
      const me = S.me.id;
      pane.insertAdjacentHTML("beforeend", `<h3>Members · ${S.members.length}</h3>${S.members.map((m) => {
        const a = C.author(m.user_id);
        const canKick = m.role !== "owner" && m.user_id !== me && (owner || m.role === "member");
        return `<div class="memrow" data-u="${m.user_id}"><span class="av"><span>${a.avatar(32)}</span></span>
          <div><strong class="role-${m.role}">${escapeHtml(m.nickname || a.name)}</strong><small>${a.handle ? "@" + escapeHtml(a.handle) + " · " : ""}joined ${new Date(m.joined_at).toLocaleDateString("en-GB")}</small></div>
          ${m.role === "owner" ? `<small>Owner</small>` : owner ? `<select data-role aria-label="Role"><option value="member" ${m.role === "member" ? "selected" : ""}>Member</option><option value="admin" ${m.role === "admin" ? "selected" : ""}>Admin</option></select>` : `<small>${m.role === "admin" ? "Admin" : "Member"}</small>`}
          ${canKick ? `<button type="button" class="btn btn-ghost btn-small" data-kick>Kick</button>` : ""}</div>`;
      }).join("")}<p class="err" id="mem-err" role="alert"></p>
      <p class="pq-note">Admins can manage channels, customise the server, remove messages and kick members. Only the owner can appoint admins.</p>`);
      pane.addEventListener("change", async (e) => {
        if (!e.target.matches("[data-role]")) return;
        const { error } = await S.client.rpc("set_member_role", { s: s.id, u: e.target.closest("[data-u]").dataset.u, r: e.target.value });
        if (error) return ($("#mem-err").textContent = err(error));
        await loadMembers(); toast("<div>Role updated</div>");
      });
      pane.addEventListener("click", async (e) => {
        if (!e.target.matches("[data-kick]")) return;
        const u = e.target.closest("[data-u]").dataset.u;
        if (!confirm(`Kick ${nameOf(u)} from ${s.name}?`)) return;
        const { error } = await S.client.from("server_members").delete().eq("server_id", s.id).eq("user_id", u);
        if (error) return ($("#mem-err").textContent = err(error));
        await loadMembers(); openSettings("members");
      });
    } else if (tab === "invites") {
      closeModal(); openInviteShare();
    } else if (tab === "danger") {
      pane.insertAdjacentHTML("beforeend", `<h3>Delete ${escapeHtml(s.name)}</h3><p class="muted">This deletes every channel and message, for everyone. It can't be undone.</p>
        <form id="del-form"><label class="fld"><span>Type the server name to confirm</span><input type="text" name="confirm" required /></label><p class="err" id="del-err" role="alert"></p>
        <button class="btn btn-small" style="background:var(--bad);border-color:var(--bad)" type="submit">Delete server</button></form>`);
      $("#del-form", pane).addEventListener("submit", async (e) => {
        e.preventDefault();
        if (e.target.confirm.value.trim() !== s.name) return ($("#del-err").textContent = "The name doesn't match.");
        const { error } = await S.client.from("servers").delete().eq("id", s.id);
        if (error) return ($("#del-err").textContent = err(error));
        S.servers.delete(s.id); S.mine.delete(s.id); S.server = null; closeModal(); go(HQ);
      });
    }
  }
  const slugName = (v) => v.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/^-+/, "").slice(0, 30) || "channel";

  async function openNewChannel() {
    const dlg = modal(`${head("Create channel", `in ${escapeHtml(S.server.name)}`)}<form id="nc-form"><div class="dlg-body">
      <label class="fld"><span>Channel name</span><input type="text" name="name" maxlength="30" required placeholder="new-channel" /></label>
      <label class="fld"><span>Topic</span><input type="text" name="topic" maxlength="120" placeholder="What's it for? (optional)" /></label>
      <label class="toggle"><span><b>Announcement channel</b><small>Only admins can post; everyone can read and react.</small></span><input type="checkbox" name="announce" /></label>
      <p class="err" id="nc-err" role="alert"></p></div>
      <div class="dlg-foot"><span></span><button class="btn btn-small" type="submit">Create channel</button></div></form>`);
    const f = $("#nc-form", dlg);
    f.name.addEventListener("input", () => (f.name.value = f.name.value.toLowerCase().replace(/\s/g, "-").replace(/[^a-z0-9-]/g, "")));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = slugName(f.name.value);
      const { error } = await S.client.from("channels").insert({ server_id: S.server.id, name, topic: f.topic.value.trim(), kind: f.announce.checked ? "announce" : "text", position: S.channels.length });
      if (error) return ($("#nc-err").textContent = error.code === "23505" ? "There's already a channel with that name." : err(error));
      await loadChannels(); closeModal(); go(S.server.id, name);
    });
  }

  // ---------- explore ----------
  async function openExplore() {
    S.view = "explore";
    if (S.rt) { S.client.removeChannel(S.rt); S.rt = null; }
    S.server = null; S.channel = null;
    app.style.setProperty("--srv", "var(--accent-2)");
    document.title = "Explore servers — Trendcode";
    renderRail(); renderSide(); renderMembers();
    $main.innerHTML = `<div class="main-top"><button type="button" class="icon-btn only-narrow" data-act="toggle-side" aria-label="Show menu">${ic("menu")}</button><h2>${ic("compass")}Explore</h2></div>
      <div class="explore">
        <div class="explore-hero bn bn-circuit"><h2>Find your people</h2><p>Public servers made by Trendcode learners. Jump in, or start your own and invite your friends.</p>
          <form class="inline-form" id="ex-code"><input type="text" name="code" placeholder="Got an invite code?" aria-label="Invite code" /><button class="btn btn-small" type="submit">Join</button></form></div>
        <div class="srv-cards" id="ex-list"><p class="loading">Loading servers…</p></div>
      </div>`;
    $("#ex-code").addEventListener("submit", (e) => { e.preventDefault(); const v = e.target.code.value.trim(); if (v) openInvite((v.match(/invite=([a-z0-9]+)/i) || [])[1] || v); });
    const { data, error } = await S.client.rpc("public_servers");
    if (S.view !== "explore") return;
    const list = $("#ex-list");
    if (error) { list.innerHTML = `<p class="empty-note">${escapeHtml(err(error))}</p>`; return; }
    list.innerHTML = data.map((s) => `<button type="button" class="srv-card" data-open="${s.id}" style="--srv:${s.color}">
        ${banner(s)}${srvIcon(s)}<div class="body"><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description || "No description yet.")}</p>
        <small>${s.members} member${+s.members === 1 ? "" : "s"}${S.mine.has(s.id) ? " · joined" : ""}</small></div></button>`).join("") +
      (S.me ? `<button type="button" class="srv-card" data-act="create" style="--srv:var(--good)"><span class="bn bn-dots"></span><span class="srv-icon tool">${ic("plus")}</span><div class="body"><h3>Start your own</h3><p>Pick a template, a colour and a banner. Takes ten seconds.</p></div></button>` : "");
  }

  async function joinCurrent() {
    if (!S.me) return (location.href = C.signInHref(location.hash));
    const { error } = await S.client.from("server_members").insert({ server_id: S.server.id, user_id: S.me.id });
    if (error && error.code !== "23505") return toast(`<div>${escapeHtml(err(error))}</div>`);
    await loadMyServers(); await loadMembers();
    renderRail(); renderSide(); renderCompose(); renderTop(); renderFeed({ keep: true });
    toast(`<div>Welcome to <strong>${escapeHtml(S.server.name)}</strong></div>`);
  }

  // ---------- events ----------
  function onFeedScroll(e) {
    const f = e.target;
    if (f.scrollTop < 60 && !S.noMore && !S.loadingOlder && S.msgs.length) loadOlder();
  }
  async function loadOlder() {
    S.loadingOlder = true;
    try {
      const older = await loadMessages(S.msgs[0].created_at);
      S.noMore = older.length < PAGE;
      S.msgs = [...older, ...S.msgs];
      renderFeed({ keep: true });
    } finally { S.loadingOlder = false; }
  }

  app.addEventListener("click", async (e) => {
    const t = e.target;
    const act = t.closest("[data-act]");
    const a = act && act.dataset.act;
    if (t.closest(".spoiler")) { t.closest(".spoiler").classList.add("shown"); return; }
    if (a === "create") return openCreate();
    if (a === "server-menu") return serverMenu(act);
    if (a === "toggle-members") { app.classList.toggle("no-members"); store.set("tc-chat-members", !app.classList.contains("no-members")); return renderTop(); }
    if (a === "toggle-side") return app.classList.toggle("side-open");
    if (a === "invite") return openInviteShare();
    if (a === "new-channel") return openNewChannel();
    if (a === "join") return joinCurrent();
    if (a === "older") return loadOlder();
    if (a === "show-cmds") { const ta = $("#msg-in"); if (!ta.value) ta.value = "/"; ta.focus(); return showCmds(true); }
    if (a === "pick-compose") { openPop(act, emojiGrid("compose"), { align: "right", above: true }); return; }
    if (a === "cancel-bar") { S.reply = null; S.editing = null; return renderCompose(); }
    if (a === "pick") { openPop(act, emojiGrid(act.dataset.id), { align: "right" }); return; }
    if (a === "reply") { S.reply = S.msgs.find((m) => m.id === +act.dataset.id); S.editing = null; renderCompose(); $("#msg-in").focus(); return; }
    if (a === "edit") return startEdit(+act.dataset.id);
    if (a === "delete") {
      if (!e.shiftKey && !confirm("Delete this message? (Tip: hold Shift to skip this.)")) return;
      const id = +act.dataset.id;
      const { error } = await S.client.from("messages").delete().eq("id", id);
      if (error) return toast(`<div>${escapeHtml(err(error))}</div>`);
      S.msgs = S.msgs.filter((m) => m.id !== id); renderFeed({ keep: true });
      return;
    }
    const cmd = t.closest("[data-cmd]");
    if (cmd) return pickCmd(cmd.dataset.cmd);
    const rx = t.closest("[data-react]");
    if (rx) return toggleReact(+rx.dataset.react, rx.dataset.emoji);
    const vote = t.closest("[data-vote]");
    if (vote && !vote.disabled) return castVote(+vote.dataset.vote, +vote.dataset.opt);
    const qz = t.closest("[data-quiz]");
    if (qz && !qz.disabled) {
      const all = store.get("tc-chat-quiz", {}); all[qz.dataset.quiz] = +qz.dataset.opt; store.set("tc-chat-quiz", all);
      return renderFeed({ keep: true });
    }
    const jump = t.closest("[data-jump]");
    if (jump) { const el = $(`#m${jump.dataset.jump}`); if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); } return; }
    const u = t.closest("[data-user]");
    if (u) return userCard(u.dataset.user, u);
    const open = t.closest("[data-open]");
    if (open) return go(open.dataset.open);
  });
  app.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("spoiler")) e.target.classList.add("shown"); });

  // Rail tooltips
  let tip;
  $rail.addEventListener("mouseover", (e) => {
    const it = e.target.closest("[data-tip]");
    if (!it) return;
    tip = tip || document.body.appendChild(Object.assign(document.createElement("div"), { className: "rail-tip" }));
    tip.textContent = it.dataset.tip; tip.hidden = false;
    const r = it.getBoundingClientRect();
    tip.style.left = r.right + 12 + "px"; tip.style.top = r.top + r.height / 2 - tip.offsetHeight / 2 + "px";
  });
  $rail.addEventListener("mouseout", () => tip && (tip.hidden = true));
  $rail.addEventListener("click", () => tip && (tip.hidden = true));

  // Popover actions (menu items, emoji)
  $pop.addEventListener("click", async (e) => {
    const em = e.target.closest("[data-emoji]");
    if (em) {
      const target = em.closest("[data-target]").dataset.target;
      closePop();
      if (target === "compose") { const ta = $("#msg-in"); const p = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, p) + em.dataset.emoji + ta.value.slice(p); ta.focus(); return; }
      return toggleReact(+target, em.dataset.emoji);
    }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    closePop();
    const a = act.dataset.act;
    if (a === "invite") openInviteShare();
    else if (a === "settings") openSettings();
    else if (a === "new-channel") openNewChannel();
    else if (a === "join") joinCurrent();
    else if (a === "nick") {
      const cur = (member(S.me.id) || {}).nickname || "";
      const v = prompt(`Your nickname in ${S.server.name} (leave empty to use your display name):`, cur);
      if (v === null) return;
      const { error } = await S.client.from("server_members").update({ nickname: v.trim().slice(0, 32) }).eq("server_id", S.server.id).eq("user_id", S.me.id);
      if (error) return toast(`<div>${escapeHtml(err(error))}</div>`);
      await loadMembers(); renderSide(); renderFeed({ keep: true });
    } else if (a === "leave") {
      if (!confirm(`Leave ${S.server.name}?`)) return;
      const { error } = await S.client.from("server_members").delete().eq("server_id", S.server.id).eq("user_id", S.me.id);
      if (error) return toast(`<div>${escapeHtml(err(error))}</div>`);
      S.mine.delete(S.server.id); S.server = null; go(HQ);
    }
  });
  $modal.addEventListener("click", (e) => { if (e.target.closest('[data-act="join-code"]')) openJoinCode(); });
  document.addEventListener("mousedown", (e) => { if (!$pop.hidden && !$pop.contains(e.target) && !e.target.closest("[data-act=pick],[data-act=pick-compose],[data-act=server-menu],[data-user]")) closePop(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$modal.hidden) closeModal(); else if (!$pop.hidden) closePop(); else app.classList.remove("side-open");
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.channel) { markRead(S.channel.id, S.activity.get(S.channel.id)); } });

  async function toggleReact(mid, emoji) {
    if (!S.me || !myRole()) return toast("<div>Join the server to react.</div>");
    const set = S.reacts.get(mid) && S.reacts.get(mid).get(emoji);
    const had = set && set.has(S.me.id);
    const row = { message_id: mid, user_id: S.me.id, emoji };
    had ? dropReact(row) : addReact(row);
    renderFeed({ keep: true, popped: had ? "" : `${mid}|${emoji}` });
    const { error } = had
      ? await S.client.from("reactions").delete().match(row)
      : await S.client.from("reactions").insert(row);
    if (error && error.code !== "23505") { had ? addReact(row) : dropReact(row); renderFeed({ keep: true }); toast(`<div>${escapeHtml(err(error))}</div>`); }
  }
  async function castVote(mid, opt) {
    if (!S.me || !myRole()) return;
    if (!S.votes.has(mid)) S.votes.set(mid, new Map());
    const votes = S.votes.get(mid), cur = votes.get(S.me.id);
    let error;
    if (cur === opt) { votes.delete(S.me.id); renderFeed({ keep: true }); ({ error } = await S.client.from("poll_votes").delete().eq("message_id", mid).eq("user_id", S.me.id)); }
    else { votes.set(S.me.id, opt); renderFeed({ keep: true }); ({ error } = await S.client.from("poll_votes").upsert({ message_id: mid, user_id: S.me.id, option: opt }, { onConflict: "message_id,user_id" })); }
    if (error) toast(`<div>${escapeHtml(err(error))}</div>`);
  }

  // ---------- boot ----------
  if (store.get("tc-chat-members", true) === false || innerWidth <= 1100) app.classList.add("no-members");
  $main.innerHTML = `<p class="loading">Connecting…</p>`;
  window.tcAccountLoad().then(async (acct) => {
    S.acct = acct;
    if (!acct.enabled) {
      $main.innerHTML = `<p class="loading">Chat needs the site's account server, which isn't connected on this copy.</p>`;
      return;
    }
    S.client = acct.client; S.me = acct.user;
    try {
      await loadMyServers();
      if (S.me && acct.profile && !S.mine.has(HQ) && S.servers.has(HQ)) {
        await S.client.from("server_members").insert({ server_id: HQ, user_id: S.me.id });
        await loadMyServers();
      }
    } catch (e) {
      $main.innerHTML = `<p class="loading">${escapeHtml(err(e))}</p>`;
      $side.innerHTML = sideMe();
      return;
    }
    renderRail();
    const invite = new URLSearchParams(location.search).get("invite");
    await route();
    if (invite) openInvite(invite);
  });
  window.addEventListener("hashchange", route);
  document.addEventListener("tc-account", () => {
    if (!S.acct || !S.acct.enabled) return;
    const u = S.acct.user;
    if ((u && u.id) !== (S.me && S.me.id)) location.reload();
  });
})();
