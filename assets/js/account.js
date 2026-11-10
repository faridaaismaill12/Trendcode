// =============================================================
// Trendcode accounts (Supabase): sign-in, profile storage and progress sync.
// Requires: config.js, @supabase/supabase-js (UMD), main.js already loaded.
// Exposes window.tcAccount. Fires "tc-account" on document when state changes.
// =============================================================
(function () {
  if (window.tcAccount && window.tcAccount.enabled && !window.tcAccount.lazy) return;
  const cfg = window.TC_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    window.tcAccount = { enabled: false };
    document.dispatchEvent(new CustomEvent("tc-account"));
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  // ---------- progress <-> localStorage ----------
  const ARRAY_KEYS = ["tc-read", "tc-labs", "tc-daily", "tc-saved"];
  const MAX_KEYS = ["tc-quiz-best", "tc-myths-best"];
  const missionKeys = () => labs.map((l) => "tc-m-" + l.slug);

  const collect = () => {
    const p = {};
    [...ARRAY_KEYS, ...missionKeys()].forEach((k) => { const v = store.get(k, null); if (v) p[k] = v; });
    MAX_KEYS.forEach((k) => { const v = store.get(k, null); if (v !== null) p[k] = v; });
    ["tc-match-best", "tc-cards", "tc-cert-dates"].forEach((k) => { const v = store.get(k, null); if (v !== null) p[k] = v; });
    return p;
  };

  // Merge remote progress into local without ever losing either side's work.
  const merge = (remote = {}) => {
    [...ARRAY_KEYS, ...missionKeys()].forEach((k) => {
      const a = store.get(k, []), b = Array.isArray(remote[k]) ? remote[k] : [];
      if (b.length) store.set(k, [...new Set([...a, ...b])]);
    });
    MAX_KEYS.forEach((k) => { if (typeof remote[k] === "number") store.set(k, Math.max(store.get(k, 0), remote[k])); });
    if (typeof remote["tc-match-best"] === "number") {
      const l = store.get("tc-match-best", null);
      store.set("tc-match-best", l ? Math.min(l, remote["tc-match-best"]) : remote["tc-match-best"]);
    }
    if (remote["tc-cards"] && typeof remote["tc-cards"] === "object") {
      const l = store.get("tc-cards", {});
      Object.entries(remote["tc-cards"]).forEach(([t, b]) => { l[t] = Math.max(l[t] || 0, +b || 0); });
      store.set("tc-cards", l);
    }
    if (remote["tc-cert-dates"] && typeof remote["tc-cert-dates"] === "object") {
      const l = store.get("tc-cert-dates", {});
      Object.entries(remote["tc-cert-dates"]).forEach(([id, d]) => { if (!l[id] || d < l[id]) l[id] = d; });
      store.set("tc-cert-dates", l);
    }
  };

  const sanitizeUsername = (s) => (s || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);

  let user = null, profile = null, pushTimer = 0, syncing = false;

  const cache = () => {
    if (user && profile) store.set("tc-account", { id: user.id, email: user.email, username: profile.username, displayName: profile.display_name });
    else store.remove("tc-account");
  };
  const announce = () => { cache(); document.dispatchEvent(new CustomEvent("tc-account")); };

  async function loadOrCreateProfile() {
    const { data, error } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw error;
    const local = store.get("tc-profile", {});
    if (data) {
      profile = data;
      merge(data.progress);
      // Character: newest edit wins
      const localAt = +store.get("tc-character-at", 0);
      const remoteAt = Date.parse(data.updated_at || 0);
      if (data.character && Object.keys(data.character).length && (!TCAvatar.hasCustom() || remoteAt > localAt)) {
        store.set("tc-character", data.character);
      }
      store.set("tc-profile", { displayName: data.display_name, username: data.username, bio: data.bio, isPublic: data.is_public });
      await push(true);
      return;
    }
    // First sign-in: create a profile from whatever the visitor set up locally.
    const base = sanitizeUsername(local.username) || sanitizeUsername((user.user_metadata && (user.user_metadata.user_name || user.user_metadata.preferred_username)) || (user.email || "").split("@")[0]) || "learner";
    let username = base.length >= 3 ? base : base + "_tc";
    for (let attempt = 0; attempt < 5; attempt++) {
      const row = {
        id: user.id,
        username,
        display_name: (local.displayName || (user.user_metadata && user.user_metadata.full_name) || username).slice(0, 40),
        bio: (local.bio || "").slice(0, 200),
        is_public: local.isPublic !== false,
        character: TCAvatar.get(),
        progress: collect(),
      };
      const { data: created, error: e2 } = await client.from("profiles").insert(row).select().single();
      if (!e2) { profile = created; store.set("tc-profile", { displayName: created.display_name, username: created.username, bio: created.bio, isPublic: created.is_public }); return; }
      if (e2.code !== "23505") throw e2; // not a duplicate username
      username = (base.slice(0, 15) + "_" + Math.floor(Math.random() * 9000 + 1000)).slice(0, 20);
    }
    throw new Error("Couldn't pick a free username. Please set one on your profile.");
  }

  async function push(now = false) {
    if (!user || !profile) return;
    clearTimeout(pushTimer);
    const run = async () => {
      const { error } = await client.from("profiles").update({ progress: collect(), character: TCAvatar.get() }).eq("id", user.id);
      if (error) console.warn("Trendcode sync failed:", error.message);
    };
    if (now) return run();
    pushTimer = setTimeout(run, 1500);
  }

  async function onSession(session) {
    const next = session ? session.user : null;
    if ((next && next.id) === (user && user.id) && profile) return;
    user = next;
    profile = null;
    if (user && !syncing) {
      syncing = true;
      try {
        await loadOrCreateProfile();
        document.dispatchEvent(new CustomEvent("tc-progress"));
      } catch (e) {
        console.warn("Trendcode profile load failed:", e.message);
      } finally { syncing = false; }
    }
    announce();
  }

  const ready = client.auth.getSession().then(({ data }) => onSession(data.session));
  client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") document.dispatchEvent(new CustomEvent("tc-password-recovery"));
    setTimeout(() => onSession(session), 0); // never await Supabase calls inside this callback
  });

  // Push local changes up (debounced)
  document.addEventListener("tc-progress", () => push());
  document.addEventListener("tc-character", () => push());

  const here = (page) => new URL(page, location.href.split("#")[0]).href;

  window.tcAccount = {
    enabled: true,
    client,
    ready,
    get user() { return user; },
    get profile() { return profile; },
    signUp: (email, password) => client.auth.signUp({ email, password, options: { emailRedirectTo: here("profile.html") } }),
    signIn: (email, password) => client.auth.signInWithPassword({ email, password }),
    signInWithGitHub: () => client.auth.signInWithOAuth({ provider: "github", options: { redirectTo: here("profile.html") } }),
    resetPassword: (email) => client.auth.resetPasswordForEmail(email, { redirectTo: here("login.html") }),
    updatePassword: (password) => client.auth.updateUser({ password }),
    async signOut() { await client.auth.signOut(); user = null; profile = null; announce(); },
    async saveProfile(fields) {
      if (!user) throw new Error("Not signed in");
      const patch = {
        username: sanitizeUsername(fields.username),
        display_name: (fields.displayName || "").slice(0, 40),
        bio: (fields.bio || "").slice(0, 200),
        is_public: !!fields.isPublic,
        character: TCAvatar.get(),
        progress: collect(),
      };
      const { data, error } = await client.from("profiles").update(patch).eq("id", user.id).select().single();
      if (error) {
        if (error.code === "23505") throw new Error("That username is taken. Try another.");
        throw new Error(error.message);
      }
      profile = data;
      announce();
      return data;
    },
    async fetchPublic(username) {
      const { data, error } = await client.from("profiles")
        .select("username, display_name, bio, character, progress, created_at, is_public")
        .eq("username", sanitizeUsername(username)).maybeSingle();
      if (error) throw error;
      return data;
    },
    async deleteAccountData() {
      if (!user) return;
      await client.from("profiles").delete().eq("id", user.id);
      await client.auth.signOut();
      user = null; profile = null; announce();
    },
    syncNow: () => push(true),
  };
  document.dispatchEvent(new CustomEvent("tc-account"));
})();
