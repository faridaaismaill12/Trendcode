// =============================================================
// Code playground: Monaco editor + runners.
//   Browser (WebAssembly / JS): javascript, typescript, python, ruby, lua, sql, web
//   Server (Supabase Edge Function "run-code" → Judge0): c, cpp, java, go, rust, …
// =============================================================
(function () {
  const CDN = {
    monaco: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs",
    pyodideBase: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    ts: "https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.js",
    sqljs: "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/",
    fengari: "https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js",
    rubyEsm: "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.6.2/dist/browser/+esm",
    rubyWasm: "https://cdn.jsdelivr.net/npm/@ruby/3.3-wasm-wasi@2.6.2/dist/ruby+stdlib.wasm",
  };

  // ---------- Languages ----------
  // where: "local" runs in the browser, "remote" uses the code runner
  const L = (key, label, where, monaco, file, template) => ({ key, label, where, monaco, file, template });
  const LANGS = [
    L("python", "Python 3", "local", "python", "main.py",
`# Python runs right here in your browser (Pyodide / WebAssembly).
def caesar(text, shift):
    out = []
    for ch in text:
        if ch.isalpha():
            base = ord('A') if ch.isupper() else ord('a')
            out.append(chr((ord(ch) - base + shift) % 26 + base))
        else:
            out.append(ch)
    return "".join(out)

secret = caesar("Hello, Trendcode!", 3)
print("encrypted:", secret)
print("decrypted:", caesar(secret, -3))

name = input("What's your name? ")   # reads from the stdin box
print(f"Nice to meet you, {name or 'stranger'} 👋")
`),
    L("javascript", "JavaScript", "local", "javascript", "main.js",
`// JavaScript runs in a sandboxed worker in your browser.
// console.log prints, top-level await works, readline() reads a line of stdin.
const text = "hello world";
const bytes = new TextEncoder().encode(text);
const digest = await crypto.subtle.digest("SHA-256", bytes);
const hex = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
console.log(\`sha256("\${text}") = \${hex}\`);

const fib = n => (n < 2 ? n : fib(n - 1) + fib(n - 2));
console.log("first 10 Fibonacci numbers:", [...Array(10).keys()].map(fib));
`),
    L("typescript", "TypeScript", "local", "typescript", "main.ts",
`// TypeScript is compiled in your browser, then run.
interface Qubit { alpha: number; beta: number }

const H = ({ alpha, beta }: Qubit): Qubit => ({
  alpha: (alpha + beta) / Math.SQRT2,
  beta: (alpha - beta) / Math.SQRT2,
});

let q: Qubit = { alpha: 1, beta: 0 };
q = H(q);
console.log("after H:   ", q, "P(1) =", (q.beta ** 2).toFixed(2));
q = H(q);
console.log("after H·H: ", q, "back to |0⟩ (interference!)");
`),
    L("ruby", "Ruby 3.3", "local", "ruby", "main.rb",
`# Ruby runs in your browser via ruby.wasm (first run downloads the interpreter).
words = %w[hash qubit lattice passkey wasm]
words.each_with_index do |w, i|
  puts "#{i + 1}. #{w.ljust(8)} #{w.reverse}"
end

name = gets&.strip
puts "Hi, #{name.nil? || name.empty? ? 'stranger' : name}!"
`),
    L("lua", "Lua 5.3", "local", "lua", "main.lua",
`-- Lua runs in your browser (Fengari).
local function is_prime(n)
  if n < 2 then return false end
  for i = 2, math.floor(math.sqrt(n)) do
    if n % i == 0 then return false end
  end
  return true
end

local primes = {}
for n = 1, 50 do
  if is_prime(n) then primes[#primes + 1] = n end
end
print("primes up to 50: " .. table.concat(primes, ", "))
`),
    L("sql", "SQL (SQLite)", "local", "sql", "query.sql",
`-- A fresh SQLite database is created for every run (sql.js / WebAssembly).
CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, topic TEXT, minutes INTEGER);
INSERT INTO posts (title, topic, minutes) VALUES
  ('Hashing, explained', 'crypto', 6),
  ('Prompt injection, explained', 'ai', 7),
  ('Qubits without the mysticism', 'quantum', 7),
  ('Big-O notation', 'algo', 6);

SELECT topic, COUNT(*) AS posts, SUM(minutes) AS total_minutes
FROM posts GROUP BY topic ORDER BY total_minutes DESC;
`),
    L("web", "HTML / CSS / JS", "local", "html", "index.html",
`<!doctype html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center; height: 100vh; margin: 0;
           background: linear-gradient(135deg, #0e7490, #5b21b6); color: white; }
    button { font-size: 1.2rem; padding: .7rem 1.4rem; border-radius: 999px; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <div style="text-align:center">
    <h1 id="msg">Hello, web! 👋</h1>
    <button onclick="flip()">Flip a qubit</button>
  </div>
  <script>
    function flip() {
      const r = Math.random() < 0.5 ? 0 : 1;
      document.getElementById("msg").textContent = "Measured |" + r + "⟩";
      console.log("measured", r);
    }
  </script>
</body>
</html>
`),
    L("c", "C", "remote", "c", "main.c",
`#include <stdio.h>

int main(void) {
    char name[64] = "stranger";
    printf("Hello from C!\\n");
    if (scanf("%63s", name) != 1) {}
    printf("Nice to meet you, %s\\n", name);
    return 0;
}
`),
    L("cpp", "C++", "remote", "cpp", "main.cpp",
`#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> v = {5, 3, 8, 1, 9, 2};
    std::sort(v.begin(), v.end());          // O(n log n)
    std::cout << "sorted:";
    for (int x : v) std::cout << ' ' << x;
    std::cout << "\\nHello from C++!" << std::endl;
}
`),
    L("java", "Java", "remote", "java", "Main.java",
`import java.util.Scanner;

public class Main {   // the class must be called Main
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        Scanner in = new Scanner(System.in);
        String name = in.hasNextLine() ? in.nextLine() : "stranger";
        System.out.println("Nice to meet you, " + name);
    }
}
`),
    L("go", "Go", "remote", "go", "main.go",
`package main

import "fmt"

func main() {
	squares := make([]int, 0, 5)
	for i := 1; i <= 5; i++ {
		squares = append(squares, i*i)
	}
	fmt.Println("Hello from Go!", squares)
}
`),
    L("rust", "Rust", "remote", "rust", "main.rs",
`fn main() {
    let words = vec!["hash", "qubit", "lattice"];
    for (i, w) in words.iter().enumerate() {
        println!("{}: {} has {} letters", i + 1, w, w.len());
    }
    println!("Hello from Rust! 🦀");
}
`),
    L("csharp", "C#", "remote", "csharp", "Main.cs",
`using System;
using System.Linq;

class Program {
    static void Main() {
        var evens = Enumerable.Range(1, 10).Where(n => n % 2 == 0);
        Console.WriteLine("Hello from C#! Evens: " + string.Join(", ", evens));
    }
}
`),
    L("kotlin", "Kotlin", "remote", "kotlin", "Main.kt",
`fun main() {
    val topics = listOf("crypto", "ai", "quantum")
    topics.forEachIndexed { i, t -> println("\${i + 1}. \${t.uppercase()}") }
    println("Hello from Kotlin!")
}
`),
    L("php", "PHP", "remote", "php", "main.php",
`<?php
$langs = ["PHP", "Python", "Rust"];
foreach ($langs as $i => $lang) {
    echo ($i + 1) . ". " . strtoupper($lang) . PHP_EOL;
}
echo "Hello from PHP!" . PHP_EOL;
`),
    L("swift", "Swift", "remote", "swift", "main.swift",
`let numbers = [3, 1, 4, 1, 5, 9, 2, 6]
let total = numbers.reduce(0, +)
print("Hello from Swift! Sum = \\(total), max = \\(numbers.max()!)")
`),
    L("bash", "Bash", "remote", "shell", "main.sh",
`#!/bin/bash
echo "Hello from Bash!"
for i in 1 2 3; do
  echo "line $i: $(echo "trendcode" | rev)"
done
`),
    L("r", "R", "remote", "r", "main.r",
`x <- c(2, 4, 4, 4, 5, 5, 7, 9)
cat("Hello from R!\\n")
cat("mean:", mean(x), " sd:", round(sd(x), 3), "\\n")
`),
    L("haskell", "Haskell", "remote", "plaintext", "main.hs",
`main :: IO ()
main = do
  putStrLn "Hello from Haskell!"
  print (take 10 [x * x | x <- [1 ..]])
`),
    L("perl", "Perl", "remote", "perl", "main.pl",
`use strict; use warnings;
my @words = qw(hash qubit lattice);
print "Hello from Perl!\\n";
print join(", ", map { scalar reverse $_ } @words), "\\n";
`),
    L("scala", "Scala", "remote", "scala", "Main.scala",
`object Main extends App {
  val squares = (1 to 5).map(n => n * n)
  println(s"Hello from Scala! $squares")
}
`),
  ];
  const byKey = Object.fromEntries(LANGS.map((l) => [l.key, l]));

  // ---------- DOM ----------
  const langSel = $("#lang");
  const badge = $("#engine-badge");
  const fileTab = $("#file-tab");
  const consoleEl = $("#console");
  const preview = $("#preview");
  const stdinEl = $("#stdin");
  const runBtn = $("#btn-run");
  const stopBtn = $("#btn-stop");
  const runMeta = $("#run-meta");
  const outTitle = $("#out-title");

  langSel.innerHTML =
    `<optgroup label="Runs in your browser">${LANGS.filter((l) => l.where === "local").map((l) => `<option value="${l.key}">${l.label}</option>`).join("")}</optgroup>` +
    `<optgroup label="Runs on the compile server (sign in)">${LANGS.filter((l) => l.where === "remote").map((l) => `<option value="${l.key}">${l.label}</option>`).join("")}</optgroup>`;

  // ---------- Console helpers ----------
  const write = (text, cls = "c-out") => {
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text;
    consoleEl.append(span);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  };
  const writeHtml = (html) => { consoleEl.insertAdjacentHTML("beforeend", html); consoleEl.scrollTop = consoleEl.scrollHeight; };
  const clearConsole = () => { consoleEl.innerHTML = ""; runMeta.textContent = ""; };
  let statusEl = null;
  const status = (text) => {
    if (!statusEl) { statusEl = document.createElement("div"); statusEl.className = "c-info"; consoleEl.prepend(statusEl); }
    statusEl.innerHTML = text ? `<span class="spinner"></span>${escapeHtml(text)}` : "";
    if (!text) { statusEl.remove(); statusEl = null; }
  };

  // ---------- Editor (Monaco, with a textarea fallback) ----------
  let editor = null, monacoRef = null, fallback = null;
  const getCode = () => (editor ? editor.getValue() : fallback ? fallback.value : "");
  const setCode = (code, lang) => {
    if (editor) {
      const model = editor.getModel();
      monacoRef.editor.setModelLanguage(model, lang.monaco);
      editor.setValue(code);
    } else if (fallback) fallback.value = code;
  };
  const monacoTheme = () => (document.documentElement.dataset.theme === "light" ? "vs" : "tc-dark");

  const startFallback = () => {
    const box = $("#editor");
    box.innerHTML = `<textarea class="fallback-editor" spellcheck="false" aria-label="Code editor"></textarea>`;
    fallback = $("textarea", box);
    fallback.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const s = fallback.selectionStart;
        fallback.setRangeText("    ", s, fallback.selectionEnd, "end");
      }
    });
    fallback.addEventListener("input", save);
  };

  const loadMonaco = () => new Promise((resolve, reject) => {
    const box = $("#editor");
    box.innerHTML = `<div class="editor-loading">loading editor…</div>`;
    let gaveUp = false;
    const timer = setTimeout(() => { gaveUp = true; reject(new Error("editor timeout")); }, 30000);
    // Let the Supabase library finish loading as a normal global before the AMD loader appears
    Promise.resolve(window.tcAccountReady).catch(() => {}).then(() => loadScript(`${CDN.monaco}/loader.min.js`)).then(() => {
      // Workers must be same-origin, so bootstrap them from a data: URL
      window.MonacoEnvironment = {
        getWorkerUrl: () => `data:text/javascript;charset=utf-8,${encodeURIComponent(
          `self.MonacoEnvironment={baseUrl:"${CDN.monaco.replace(/vs$/, "")}"};importScripts("${CDN.monaco}/base/worker/workerMain.js");`)}`,
      };
      window.require.config({ paths: { vs: CDN.monaco } });
      window.require(["vs/editor/editor.main"], (monaco) => {
        clearTimeout(timer);
        if (gaveUp) return; // the textarea fallback already took over
        monacoRef = monaco;
        monaco.editor.defineTheme("tc-dark", {
          base: "vs-dark", inherit: true, rules: [],
          colors: { "editor.background": "#0b0f17", "editor.lineHighlightBackground": "#121826", "editorLineNumber.foreground": "#3b4556" },
        });
        box.innerHTML = "";
        editor = monaco.editor.create(box, {
          value: "", language: "python", theme: monacoTheme(), automaticLayout: true,
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace', fontSize: 14, minimap: { enabled: false },
          scrollBeyondLastLine: false, tabSize: 4, padding: { top: 12 }, smoothScrolling: true, fontLigatures: true,
        });
        editor.onDidChangeModelContent(save);
        editor.onDidChangeCursorPosition((e) => ($("#cursor-pos").textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`));
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => run());
        document.addEventListener("tc-theme", () => monaco.editor.setTheme(monacoTheme()));
        resolve();
      }, reject);
    }).catch(reject);
  });

  // ---------- State: current language, autosave, share links ----------
  let lang = byKey[store.get("tc-code-lang", "python")] || byKey.python;
  let saveTimer = 0, applying = false;
  function save() {
    if (applying) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set(`tc-code-${lang.key}`, getCode()), 300);
  }
  const b64e = (s) => {
    const bytes = new TextEncoder().encode(s);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  // Monaco's AMD loader defines window.define, which makes UMD libraries register as
  // AMD modules instead of globals. Hide it while loading those libraries.
  const loadGlobal = async (src) => {
    const d = window.define;
    window.define = undefined;
    try { await loadScript(src); } finally { window.define = d; }
  };
  const b64d = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

  const applyLang = (key, code) => {
    lang = byKey[key] || byKey.python;
    store.set("tc-code-lang", lang.key);
    langSel.value = lang.key;
    fileTab.textContent = lang.file;
    badge.textContent = lang.where === "local" ? "● runs in your browser" : "☁ runs on the compile server";
    badge.className = `engine-badge ${lang.where}`;
    applying = true;
    setCode(code ?? store.get(`tc-code-${lang.key}`, null) ?? lang.template, lang);
    applying = false;
    const web = lang.key === "web";
    preview.hidden = !web;
    consoleEl.hidden = web;
    outTitle.textContent = web ? "preview" : "output";
    $(".stdin-panel").style.opacity = web || lang.key === "sql" ? 0.5 : 1;
    if (web) runPreview();
  };

  langSel.addEventListener("change", () => {
    store.set(`tc-code-${lang.key}`, getCode());
    applyLang(langSel.value);
    if (lang.key !== "web") clearConsole();
  });
  $("#btn-reset").addEventListener("click", () => {
    if (getCode() !== lang.template && !confirm(`Replace your ${lang.label} code with the example?`)) return;
    setCode(lang.template, lang);
    store.set(`tc-code-${lang.key}`, lang.template);
  });
  $("#btn-share").addEventListener("click", async (e) => {
    const url = `${location.origin}${location.pathname}#l=${lang.key}&c=${b64e(getCode())}`;
    try { await navigator.clipboard.writeText(url); e.target.textContent = "✓ Link copied"; }
    catch { prompt("Copy this link:", url); }
    setTimeout(() => (e.target.textContent = "🔗 Share"), 2000);
  });
  $("#btn-download").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([getCode()], { type: "text/plain" }));
    a.download = lang.file;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#btn-clear").addEventListener("click", clearConsole);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !editor) { e.preventDefault(); run(); }
  });

  // =============================================================
  // RUNNERS
  // =============================================================
  let running = false, worker = null, startedAt = 0;
  const setRunning = (on) => {
    running = on;
    runBtn.disabled = on;
    runBtn.textContent = on ? "Running…" : "▶ Run";
    stopBtn.hidden = !on;
  };
  const finish = (ok = true, extra = "") => {
    status("");
    const ms = Math.round(performance.now() - startedAt);
    runMeta.innerHTML = `${ok ? '<span class="c-ok">✓</span>' : '<span class="c-err">✗</span>'} ${ms < 1000 ? ms + " ms" : (ms / 1000).toFixed(2) + " s"}${extra}`;
    if (!consoleEl.textContent.trim()) write("(no output)", "c-empty");
    setRunning(false);
  };

  // ---------- JS / TS / Python in a Web Worker (so Stop works) ----------
  const WORKER_SRC = `
    let pyodide = null, tsReady = false;
    const send = (type, text) => postMessage({ type, text });
    const fmt = (args) => args.map((x) => {
      if (typeof x === "string") return x;
      if (x instanceof Error) return x.stack || x.message;
      try { return JSON.stringify(x, (k, v) => (typeof v === "bigint" ? v + "n" : v), 2) ?? String(x); } catch { return String(x); }
    }).join(" ");
    self.console = {
      log: (...a) => send("out", fmt(a) + "\\n"), info: (...a) => send("out", fmt(a) + "\\n"),
      debug: (...a) => send("out", fmt(a) + "\\n"), warn: (...a) => send("warn", fmt(a) + "\\n"),
      error: (...a) => send("err", fmt(a) + "\\n"), table: (t) => send("out", fmt([t]) + "\\n"),
    };
    onmessage = async (e) => {
      const { lang, code, stdin, cdn } = e.data;
      const lines = stdin.length ? stdin.replace(/\\n$/, "").split("\\n") : [];
      try {
        if (lang === "python") {
          if (!pyodide) {
            send("status", "Loading Python (first run downloads ~10 MB)…");
            importScripts(cdn.pyodideBase + "pyodide.js");
            pyodide = await loadPyodide({ indexURL: cdn.pyodideBase });
          }
          let fed = false;
          pyodide.setStdin({ stdin: () => { if (fed || !stdin) return null; fed = true; return stdin.endsWith("\\n") ? stdin : stdin + "\\n"; } });
          pyodide.setStdout({ batched: (s) => send("out", s + "\\n") });
          pyodide.setStderr({ batched: (s) => send("err", s + "\\n") });
          send("status", "Running…");
          await pyodide.loadPackagesFromImports(code, { messageCallback: (m) => send("status", m) });
          send("status", "");
          await pyodide.runPythonAsync(code);
        } else {
          let js = code;
          if (lang === "typescript") {
            if (!tsReady) { send("status", "Loading the TypeScript compiler…"); importScripts(cdn.ts); tsReady = true; }
            const r = ts.transpileModule(code, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } });
            for (const d of r.diagnostics || []) send("warn", "TS: " + ts.flattenDiagnosticMessageText(d.messageText, "\\n") + "\\n");
            js = r.outputText;
          }
          send("status", "");
          self.readline = self.prompt = () => (lines.length ? lines.shift() : null);
          const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
          await new AsyncFunction(js)();
        }
        postMessage({ type: "done", ok: true });
      } catch (err) {
        const msg = err && err.message ? (lang === "python" ? err.message : (err.name || "Error") + ": " + err.message) : String(err);
        send("err", msg + "\\n");
        postMessage({ type: "done", ok: false });
      }
    };`;
  const workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
  const getWorker = () => {
    if (worker) return worker;
    worker = new Worker(workerUrl);
    worker.onmessage = (e) => {
      const { type, text, ok } = e.data;
      if (type === "out") write(text);
      else if (type === "err") write(text, "c-err");
      else if (type === "warn") write(text, "c-warn");
      else if (type === "status") status(text);
      else if (type === "done") finish(ok);
    };
    worker.onerror = (e) => { write(`${e.message}\n`, "c-err"); finish(false); };
    return worker;
  };
  const runInWorker = (key, code) => getWorker().postMessage({ lang: key, code, stdin: stdinEl.value, cdn: CDN });

  // ---------- Lua (Fengari) on the main thread with a time limit ----------
  async function runLua(code) {
    if (!window.fengari) { status("Loading Lua…"); await loadGlobal(CDN.fengari); }
    status("");
    const { lua, lauxlib, lualib, to_luastring, to_jsstring } = window.fengari;
    const Ls = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(Ls);
    const lines = stdinEl.value ? stdinEl.value.replace(/\n$/, "").split("\n") : [];
    const toStr = (S, i) => { const s = to_jsstring(lauxlib.luaL_tolstring(S, i)); lua.lua_pop(S, 1); return s; };
    lua.lua_pushcfunction(Ls, (S) => {
      const n = lua.lua_gettop(S), parts = [];
      for (let i = 1; i <= n; i++) parts.push(toStr(S, i));
      write(parts.join("\t") + "\n");
      return 0;
    });
    lua.lua_setglobal(Ls, to_luastring("print"));
    lua.lua_pushcfunction(Ls, (S) => {
      const n = lua.lua_gettop(S), parts = [];
      for (let i = 1; i <= n; i++) parts.push(toStr(S, i));
      write(parts.join(""));
      return 0;
    });
    lua.lua_setglobal(Ls, to_luastring("__tc_write"));
    lua.lua_pushcfunction(Ls, (S) => {
      if (lines.length) lua.lua_pushstring(S, to_luastring(lines.shift())); else lua.lua_pushnil(S);
      return 1;
    });
    lua.lua_setglobal(Ls, to_luastring("__tc_read"));
    const prelude = `io.write = function(...) __tc_write(...) return io end
      io.read = function(fmt) local l = __tc_read() if l and (fmt == "n" or fmt == "*n") then return tonumber(l) end return l end`;
    lauxlib.luaL_dostring(Ls, to_luastring(prelude));
    const started = performance.now();
    lua.lua_sethook(Ls, (S) => {
      if (performance.now() - started > 8000) lauxlib.luaL_error(S, to_luastring("stopped: ran longer than 8 seconds"));
    }, lua.LUA_MASKCOUNT, 10000);
    const buf = to_luastring(code);
    const st = lauxlib.luaL_loadbuffer(Ls, buf, buf.length, to_luastring("main.lua")) || lua.lua_pcall(Ls, 0, 0, 0);
    if (st !== lua.LUA_OK) { write(to_jsstring(lua.lua_tostring(Ls, -1)) + "\n", "c-err"); return false; }
    return true;
  }

  // ---------- SQL (sql.js) ----------
  let SQL = null;
  async function runSql(code) {
    if (!SQL) {
      status("Loading SQLite…");
      await loadGlobal(CDN.sqljs + "sql-wasm.js");
      SQL = await window.initSqlJs({ locateFile: (f) => CDN.sqljs + f });
    }
    status("");
    const db = new SQL.Database();
    try {
      const results = db.exec(code);
      if (!results.length) write(`✓ Ran successfully. ${db.getRowsModified()} row(s) changed, no rows returned.\n`, "c-ok");
      results.forEach((r, i) => {
        writeHtml(`<span class="c-head">result ${i + 1} · ${r.values.length} row${r.values.length === 1 ? "" : "s"}</span>` +
          `<table><thead><tr>${r.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${
            r.values.slice(0, 500).map((row) => `<tr>${row.map((v) => (v === null ? `<td class="null">NULL</td>` : `<td>${escapeHtml(String(v))}</td>`)).join("")}</tr>`).join("")
          }</tbody></table>`);
      });
      return true;
    } catch (e) { write(`SQL error: ${e.message}\n`, "c-err"); return false; }
    finally { db.close(); }
  }

  // ---------- Ruby (ruby.wasm) ----------
  let rubyModule = null, rubyVmFactory = null;
  async function runRuby(code) {
    if (!rubyModule) {
      status("Loading Ruby (first run downloads ~25 MB)…");
      const mod = await import(CDN.rubyEsm);
      rubyVmFactory = mod.DefaultRubyVM;
      rubyModule = await WebAssembly.compileStreaming(fetch(CDN.rubyWasm));
    }
    status("Starting Ruby…");
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = (...a) => write(a.join(" ").replace(/\n?$/, "\n"));
    console.warn = console.error = (...a) => write(a.join(" ").replace(/\n?$/, "\n"), "c-err");
    try {
      const { vm } = await rubyVmFactory(rubyModule);
      status("");
      const stdinLit = JSON.stringify(stdinEl.value).replace(/#/g, "\\#");
      vm.eval(`require "stringio"; $stdin = StringIO.new(${stdinLit}); $stdout.sync = true`);
      vm.eval(code);
      vm.eval("$stdout.flush");
      return true;
    } catch (e) {
      write(String(e.message || e).replace(/\n?$/, "\n"), "c-err");
      return false;
    } finally { Object.assign(console, orig); }
  }

  // ---------- HTML / CSS / JS preview ----------
  let previewTimer = 0;
  function runPreview() {
    const html = getCode();
    // forward console.log from the preview into nothing visible; keep it simple and sandboxed
    preview.srcdoc = html;
  }

  // ---------- Remote languages ----------
  async function runRemote(code) {
    status("Connecting to the compile server…");
    const acct = await window.tcAccountReady;
    const live = window.tcAccount || acct;
    if (!live.enabled) {
      status("");
      writeHtml(`<span class="c-warn">${escapeHtml(lang.label)} needs the compile server, and accounts aren't switched on for this site.</span>\n<span class="c-info">Browser languages (Python, JavaScript, TypeScript, Ruby, Lua, SQL, HTML) work without it.</span>`);
      return false;
    }
    if (!live.user) {
      status("");
      writeHtml(`<span class="c-warn">Sign in to run ${escapeHtml(lang.label)}.</span>\n<span class="c-info">Compiled languages run on a shared server, so they're for signed-in learners. It's free.</span>\n<a class="btn btn-small c-cta" href="login.html?next=compiler.html">Sign in →</a>`);
      return false;
    }
    status(`Compiling and running ${lang.label}…`);
    const { data, error } = await live.client.functions.invoke("run-code", { body: { language: lang.key, code, stdin: stdinEl.value } });
    status("");
    if (error) {
      let msg = error.message, code404 = false;
      try {
        if (error.context && typeof error.context.json === "function") {
          code404 = error.context.status === 404;
          const body = await error.context.json();
          msg = body.error || body.message || msg;
        }
      } catch { /* keep default */ }
      if (code404 || /not found|Failed to send/i.test(msg)) {
        writeHtml(`<span class="c-warn">The compile server isn't set up yet.</span>\n<span class="c-info">Site owner: deploy supabase/functions/run-code (see the README). Browser languages work right now.</span>`);
      } else write(msg + "\n", "c-err");
      return false;
    }
    if (data.compileOutput) { writeHtml(`<span class="c-head">compiler</span>`); write(data.compileOutput.replace(/\n?$/, "\n"), data.statusId === 6 ? "c-err" : "c-warn"); }
    if (data.stdout) write(data.stdout);
    if (data.stderr) write(data.stderr, "c-err");
    if (data.message && !data.compileOutput) write(data.message.replace(/\n?$/, "\n"), "c-info");
    const ok = data.statusId === 3;
    if (!ok) write(`\n${data.status}\n`, "c-err");
    runMeta.dataset.extra = data.time ? ` · cpu ${data.time}s${data.memory ? ` · ${Math.round(data.memory / 1024)} MB` : ""}` : "";
    return ok;
  }

  // ---------- Run / Stop ----------
  async function run() {
    if (lang.key === "web") { runPreview(); return; }
    if (running) return;
    clearConsole();
    setRunning(true);
    startedAt = performance.now();
    const code = getCode();
    store.set(`tc-code-${lang.key}`, code);
    runMeta.dataset.extra = "";
    if (["javascript", "typescript", "python"].includes(lang.key)) { runInWorker(lang.key, code); return; }
    let ok = false;
    try {
      if (lang.key === "lua") ok = await runLua(code);
      else if (lang.key === "sql") ok = await runSql(code);
      else if (lang.key === "ruby") ok = await runRuby(code);
      else ok = await runRemote(code);
    } catch (e) { write(`${e.message || e}\n`, "c-err"); }
    finish(ok, runMeta.dataset.extra || "");
  }
  runBtn.addEventListener("click", run);
  stopBtn.addEventListener("click", () => {
    if (worker) { worker.terminate(); worker = null; }
    write("\n■ Stopped.\n", "c-warn");
    finish(false);
  });

  // live preview for web: re-render shortly after typing
  const onEdit = () => { if (lang.key === "web") { clearTimeout(previewTimer); previewTimer = setTimeout(runPreview, 600); } };

  // ---------- Boot ----------
  const fromHash = () => {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get("l") && byKey[h.get("l")] && h.get("c")) {
      try { return { key: h.get("l"), code: b64d(h.get("c")) }; } catch { /* bad link */ }
    }
    return null;
  };
  const shared = fromHash();
  const boot = () => {
    if (shared) { applyLang(shared.key, shared.code); history.replaceState(null, "", location.pathname); }
    else applyLang(lang.key);
    if (editor) editor.onDidChangeModelContent(onEdit); else if (fallback) fallback.addEventListener("input", onEdit);
    if (lang.key !== "web") write("Ready. Press ▶ Run (or Ctrl + Enter).\n", "c-info");
  };
  loadMonaco().then(boot).catch(() => { startFallback(); boot(); });
})();
