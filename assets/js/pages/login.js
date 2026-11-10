// Login page: sign in / sign up / GitHub / password reset, via tcAccount (Supabase).
(function () {
  const card = $("#auth-card");
  if (!card) return;

  // A little parade of random characters on the left
  const parade = $("#auth-avatars");
  if (parade) parade.innerHTML = Array.from({ length: 5 }, () => TCAvatar.svg(TCAvatar.random(), 64)).join("");

  const next = new URLSearchParams(location.search).get("next") || "profile.html";
  const safeNext = /^[a-z0-9_-]+\.html(\?[\w=&-]*)?$/i.test(next) ? next : "profile.html";
  let mode = "signin";

  const msg = (text, kind = "") => {
    const el = $("#auth-msg", card);
    if (el) { el.className = `auth-msg ${kind}`; el.innerHTML = text; }
  };

  const renderDisabled = () => {
    card.innerHTML = `
      <h2>Accounts aren't switched on yet</h2>
      <p class="muted">This copy of Trendcode isn't connected to an account server, so sign-in is unavailable. You can still create a <strong>local profile</strong> and character. They're saved in this browser.</p>
      <a class="btn" href="profile.html">Create a local profile →</a>
      <details class="owner-note">
        <summary>Are you the site owner?</summary>
        <ol>
          <li>Create a free project at <a class="text-link" href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
          <li>Run <code>supabase/schema.sql</code> in its SQL editor.</li>
          <li>Paste the project URL and anon key into <code>assets/js/config.js</code>.</li>
          <li>Under Authentication → URL Configuration, add your site's <code>profile.html</code> and <code>login.html</code> as redirect URLs.</li>
        </ol>
        <p class="muted small">Full steps are in the README.</p>
      </details>`;
  };

  const renderSignedIn = (acct) => {
    const p = acct.profile || {};
    card.innerHTML = `
      <div class="signed-row">${TCAvatar.svg(TCAvatar.get(), 72)}<div>
        <h2>You're signed in</h2>
        <p class="muted">${escapeHtml(acct.user.email || "")}${p.username ? ` · @${escapeHtml(p.username)}` : ""}</p></div></div>
      <div class="btn-row"><a class="btn" href="profile.html">Go to your profile →</a><button type="button" class="btn btn-ghost" id="signout">Sign out</button></div>`;
    $("#signout", card).addEventListener("click", async () => { await acct.signOut(); render(); });
  };

  const renderRecovery = (acct) => {
    card.innerHTML = `
      <h2>Choose a new password</h2>
      <form class="auth-form" id="recover-form">
        <label class="field"><span>New password</span><input class="input" type="password" id="new-pass" minlength="8" required autocomplete="new-password" /></label>
        <button class="btn" type="submit">Save new password</button>
        <p class="auth-msg" id="auth-msg" role="status"></p>
      </form>`;
    $("#recover-form", card).addEventListener("submit", async (e) => {
      e.preventDefault();
      const { error } = await acct.updatePassword($("#new-pass", card).value);
      if (error) return msg(escapeHtml(error.message), "bad");
      msg("Password updated. Taking you to your profile…", "good");
      setTimeout(() => (location.href = "profile.html"), 900);
    });
  };

  const renderForm = (acct) => {
    const signup = mode === "signup";
    card.innerHTML = `
      <div class="auth-tabs" role="tablist">
        <button type="button" role="tab" class="${!signup ? "active" : ""}" aria-selected="${!signup}" data-mode="signin">Sign in</button>
        <button type="button" role="tab" class="${signup ? "active" : ""}" aria-selected="${signup}" data-mode="signup">Create account</button>
      </div>
      <button type="button" class="btn-github" id="github">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        Continue with GitHub
      </button>
      <div class="or"><span>or with email</span></div>
      <form class="auth-form" id="auth-form" novalidate>
        <label class="field"><span>Email</span><input class="input" type="email" id="email" required autocomplete="email" /></label>
        <label class="field"><span>Password${signup ? " (8+ characters)" : ""}</span>
          <span class="pw-wrap"><input class="input" type="password" id="password" minlength="8" required autocomplete="${signup ? "new-password" : "current-password"}" />
          <button type="button" class="pw-toggle" id="pw-toggle" aria-label="Show password">show</button></span></label>
        <button class="btn" type="submit" id="submit">${signup ? "Create account" : "Sign in"}</button>
        ${signup ? "" : `<button type="button" class="link-btn" id="forgot">Forgot your password?</button>`}
        <p class="auth-msg" id="auth-msg" role="status"></p>
      </form>
      <p class="muted small">${signup ? "Already set up a local profile? It's carried over into your new account automatically." : "New here? Your progress so far is merged into your account when you sign in."}</p>`;

    $$("[data-mode]", card).forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; renderForm(acct); }));
    $("#pw-toggle", card).addEventListener("click", (e) => {
      const p = $("#password", card);
      p.type = p.type === "password" ? "text" : "password";
      e.target.textContent = p.type === "password" ? "show" : "hide";
    });
    $("#github", card).addEventListener("click", async () => {
      const { error } = await acct.signInWithGitHub();
      if (error) msg(escapeHtml(error.message), "bad");
    });
    const forgot = $("#forgot", card);
    if (forgot) forgot.addEventListener("click", async () => {
      const email = $("#email", card).value.trim();
      if (!email) return msg("Type your email above first, then press “Forgot your password?” again.", "bad");
      const { error } = await acct.resetPassword(email);
      msg(error ? escapeHtml(error.message) : "If that email has an account, a reset link is on its way.", error ? "bad" : "good");
    });
    $("#auth-form", card).addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#email", card).value.trim();
      const password = $("#password", card).value;
      if (!/^\S+@\S+\.\S+$/.test(email)) return msg("Please enter a valid email address.", "bad");
      if (password.length < 8) return msg("Passwords need at least 8 characters.", "bad");
      const btn = $("#submit", card);
      btn.disabled = true; btn.textContent = signup ? "Creating…" : "Signing in…";
      const { data, error } = signup ? await acct.signUp(email, password) : await acct.signIn(email, password);
      btn.disabled = false; btn.textContent = signup ? "Create account" : "Sign in";
      if (error) return msg(escapeHtml(error.message), "bad");
      if (signup && !data.session) return msg("Almost there! Check your inbox and click the confirmation link to finish creating your account.", "good");
      msg("Signed in. Loading your profile…", "good");
      await acct.ready;
      setTimeout(() => (location.href = safeNext), 500);
    });
  };

  const render = async () => {
    const acct = await window.tcAccountReady;
    if (!acct.enabled) return renderDisabled();
    if (/type=recovery/.test(location.hash)) return renderRecovery(acct);
    if (acct.user) return renderSignedIn(acct);
    renderForm(acct);
  };
  document.addEventListener("tc-password-recovery", async () => renderRecovery(await window.tcAccountReady));
  document.addEventListener("tc-account", () => { if (window.tcAccount && window.tcAccount.user && !/type=recovery/.test(location.hash)) renderSignedIn(window.tcAccount); });
  render();
})();
