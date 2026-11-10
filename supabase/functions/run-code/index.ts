// =============================================================
// Trendcode code runner: Supabase Edge Function.
// Runs compiled/server languages (C, C++, Java, Go, Rust, …) for the
// /compiler.html page by forwarding them to a Judge0 instance.
//
// Deploy:   supabase functions deploy run-code
// Secrets:  supabase secrets set JUDGE0_KEY=<your RapidAPI key>
//           (optional) JUDGE0_URL, JUDGE0_HOST, ALLOWED_ORIGIN, RUNS_PER_10_MIN
//
// Only signed-in Trendcode users can run code, which keeps your quota safe.
// =============================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const JUDGE0_URL = (Deno.env.get("JUDGE0_URL") ?? "https://judge0-ce.p.rapidapi.com").replace(/\/$/, "");
const JUDGE0_KEY = Deno.env.get("JUDGE0_KEY") ?? "";
const JUDGE0_HOST = Deno.env.get("JUDGE0_HOST") ?? "judge0-ce.p.rapidapi.com";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const RUNS_PER_10_MIN = Number(Deno.env.get("RUNS_PER_10_MIN") ?? "30");

const MAX_CODE = 64 * 1024;
const MAX_STDIN = 16 * 1024;

// Trendcode language key → pattern matched against Judge0's language names.
// The newest matching version (highest id) is used.
const LANGUAGES: Record<string, RegExp> = {
  c: /^C \(GCC/,
  cpp: /^C\+\+ \(GCC/,
  java: /^Java \(/,
  go: /^Go \(/,
  rust: /^Rust \(/,
  csharp: /^C# \(Mono/,
  kotlin: /^Kotlin \(/,
  php: /^PHP \(/,
  swift: /^Swift \(/,
  bash: /^Bash \(/,
  r: /^R \(/,
  haskell: /^Haskell \(/,
  perl: /^Perl \(/,
  scala: /^Scala \(/,
};

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const judgeHeaders = (): HeadersInit => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (JUDGE0_KEY) { h["X-RapidAPI-Key"] = JUDGE0_KEY; h["X-RapidAPI-Host"] = JUDGE0_HOST; }
  return h;
};

// UTF-8 safe base64
const b64encode = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64decode = (s: string | null) => {
  if (!s) return "";
  const bin = atob(s);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

// Cache Judge0's language list for the life of this function instance
let languageIds: Record<string, number> | null = null;
async function resolveLanguage(key: string): Promise<number | null> {
  if (!languageIds) {
    const res = await fetch(`${JUDGE0_URL}/languages`, { headers: judgeHeaders() });
    if (!res.ok) throw new Error(`Judge0 /languages failed (${res.status})`);
    const list: { id: number; name: string }[] = await res.json();
    languageIds = {};
    for (const [k, re] of Object.entries(LANGUAGES)) {
      const hits = list.filter((l) => re.test(l.name)).sort((a, b) => b.id - a.id);
      if (hits.length) languageIds[k] = hits[0].id;
    }
  }
  return languageIds[key] ?? null;
}

// Tiny per-user rate limit (per function instance; good enough to stop accidents)
const recent = new Map<string, number[]>();
const allowed = (userId: string) => {
  const now = Date.now(), windowMs = 10 * 60 * 1000;
  const list = (recent.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= RUNS_PER_10_MIN) return false;
  list.push(now);
  recent.set(userId, list);
  return true;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  // Must be a signed-in Trendcode user (the anon key alone is not enough)
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Sign in to run compiled languages." }, 401);
  if (!allowed(user.id)) return json({ error: `Slow down: up to ${RUNS_PER_10_MIN} runs per 10 minutes.` }, 429);

  let body: { language?: string; code?: string; stdin?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body." }, 400); }
  const { language = "", code = "", stdin = "" } = body;
  if (!LANGUAGES[language]) return json({ error: `Unsupported language: ${language}` }, 400);
  if (typeof code !== "string" || !code.trim()) return json({ error: "No code to run." }, 400);
  if (code.length > MAX_CODE) return json({ error: "Code is too long (64 KB max)." }, 413);
  if (typeof stdin !== "string" || stdin.length > MAX_STDIN) return json({ error: "Input is too long (16 KB max)." }, 413);

  try {
    const languageId = await resolveLanguage(language);
    if (!languageId) return json({ error: `This Judge0 server doesn't offer ${language}.` }, 400);
    const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: judgeHeaders(),
      body: JSON.stringify({
        language_id: languageId,
        source_code: b64encode(code),
        stdin: b64encode(stdin),
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
      }),
    });
    if (!res.ok) return json({ error: `The compile server answered ${res.status}. Try again in a moment.` }, 502);
    const r = await res.json();
    return json({
      status: r.status?.description ?? "Unknown",
      statusId: r.status?.id ?? 0,
      stdout: b64decode(r.stdout),
      stderr: b64decode(r.stderr),
      compileOutput: b64decode(r.compile_output),
      message: b64decode(r.message),
      time: r.time,
      memory: r.memory,
    });
  } catch (e) {
    return json({ error: `Runner error: ${(e as Error).message}` }, 500);
  }
});
