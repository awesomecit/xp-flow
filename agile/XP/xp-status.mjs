#!/usr/bin/env node
// XP — estrattore del flusso agentico. Fonte: frontmatter .ai/tasks/ + storia git.
// Genera out/{events.jsonl, status.json, dashboard.html}. Contratto: events.schema.json.
// Scope da $XP_SCOPE (default: personal). Uso: node XP/xp-status.mjs

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = join(here, "..", "..");
const out = join(here, "out");
mkdirSync(out, { recursive: true });

const SCOPE = process.env.XP_SCOPE ?? "personal";
const REPOS = [
  { name: "citycat.app", dir: join(workspace, "tech-citizen", "citycat.app") },
  { name: "common", dir: join(workspace, "tech-citizen", "common") },
];
const ACTIVE = ["claimed", "red", "green", "refactor"];

const git = (dir, ...args) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const [k, ...v] = line.split(":");
    if (!k || v.length === 0) continue;
    let val = v.join(":").trim();
    if (val.startsWith("[")) val = val.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (val === "null") val = null;
    fm[k.trim()] = val;
  }
  return fm;
}
// compatibilità con la storia git pre-migrazione (chiavi italiane nei vecchi commit)
const norm = (fm) => fm && {
  id: fm.id,
  status: fm.status ?? fm.stato,
  agent: fm.agent ?? fm.agente ?? null,
  type: { epica: "epic", storia: "story" }[fm.type ?? fm.tipo] ?? (fm.type ?? fm.tipo ?? "task"),
  depends_on: fm.depends_on ?? fm.dipende_da ?? [],
  sp: Number(fm.sp) || null,
  milestone: fm.milestone ?? null,
};

function extractRepo({ name, dir }) {
  const base = existsSync(join(dir, ".ai", "tasks")) ? "" : "foundation/";
  const tasksDir = join(dir, base, ".ai", "tasks");
  const events = [];

  // 1) storia: parsing a stato — il marcatore @@ distingue le testate dai nomi file
  const logLines = git(dir, "log", "--reverse", "--format=@@%h|%cI|%s", "--name-only", "--", `${base}.ai/tasks/`).split("\n");
  const prevStatus = new Map();
  let current = null;
  for (const line of logLines) {
    if (line.startsWith("@@")) {
      const [hash, ts, ...msg] = line.slice(2).split("|");
      current = { hash, ts, message: msg.join("|") };
      continue;
    }
    const f = line.trim();
    if (!current || !f.endsWith(".md")) continue;
    let fm;
    try { fm = norm(parseFrontmatter(git(dir, "show", `${current.hash}:${f}`))); } catch { continue; }
    if (!fm?.id) continue;
    const prev = prevStatus.get(fm.id);
    const common = { scope: SCOPE, agent: fm.agent, sp: fm.sp, milestone: fm.milestone, flow: null, commit: current.hash, message: current.message, payload: null };
    if (prev === undefined) {
      events.push({ ts: current.ts, repo: name, type: "creation", task: fm.id, from: null, to: fm.status, ...common });
    } else if (prev !== fm.status) {
      events.push({ ts: current.ts, repo: name, type: "transition", task: fm.id, from: prev, to: fm.status, ...common });
    }
    prevStatus.set(fm.id, fm.status);
  }

  // 2) commit di lavoro (non board) — ultimi 30 giorni
  for (const r of git(dir, "log", "--since=30 days ago", "--format=%h|%cI|%s").split("\n").filter(Boolean)) {
    const [hash, ts, ...msg] = r.split("|");
    const m = msg.join("|");
    if (!m.startsWith("chore(board)"))
      events.push({ ts, scope: SCOPE, repo: name, type: "commit", task: null, from: null, to: null, agent: null, sp: null, milestone: null, flow: null, commit: hash, message: m, payload: null });
  }

  // 3) snapshot corrente della board
  const tasks = readdirSync(tasksDir).filter((f) => f.endsWith(".md"))
    .map((f) => norm(parseFrontmatter(readFileSync(join(tasksDir, f), "utf8")))).filter((t) => t?.id);
  const byStatus = {};
  for (const t of tasks) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  const byMilestone = {};
  for (const t of tasks) {
    const ms = t.milestone ?? "—";
    byMilestone[ms] ??= { sp_done: 0, sp_total: 0, items: 0 };
    byMilestone[ms].items++;
    byMilestone[ms].sp_total += t.sp || 0;
    if (t.status === "done") byMilestone[ms].sp_done += t.sp || 0;
  }
  const doneIds = new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));
  const claimable = tasks
    .filter((t) => t.type !== "epic" && t.status === "todo" && t.depends_on.every((d) => doneIds.has(d)))
    .map((t) => t.id).sort();

  // 4) metriche dagli eventi
  const week = Date.now() - 7 * 86_400_000;
  const doneRecent = events.filter((e) => e.to === "done" && new Date(e.ts) > week).length;
  const commits7d = events.filter((e) => e.type === "commit" && new Date(e.ts) > week).length;
  const cycles = [];
  for (const id of new Set(events.filter((e) => e.to === "done").map((e) => e.task))) {
    const claim = events.find((e) => e.task === id && e.to === "claimed");
    const done = events.find((e) => e.task === id && e.to === "done");
    if (claim && done) cycles.push((new Date(done.ts) - new Date(claim.ts)) / 3_600_000);
  }

  return {
    events,
    status: {
      name, by_status: byStatus, by_milestone: byMilestone,
      wip: tasks.filter((t) => ACTIVE.includes(t.status)).length,
      claimable,
      avg_cycle_time_hours: cycles.length ? +(cycles.reduce((a, b) => a + b) / cycles.length).toFixed(1) : null,
      throughput_7d: doneRecent, commits_7d: commits7d,
      last_event: events.at(-1) ?? null,
    },
  };
}

const results = REPOS.map(extractRepo);
const events = results.flatMap((r) => r.events).sort((a, b) => a.ts.localeCompare(b.ts));
const status = {
  generated_at: new Date().toISOString(),
  scope: SCOPE,
  repos: results.map((r) => r.status),
  recent_events: [...events].reverse().slice(0, 25),
};

writeFileSync(join(out, "events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
writeFileSync(join(out, "status.json"), JSON.stringify(status, null, 2) + "\n");

// 5) dashboard statica per il monitor (dati embedded, auto-refresh; copy in italiano)
const esc = (s) => String(s ?? "—").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
const card = (t, v, sub = "") => `<div class="card"><div class="k">${t}</div><div class="v">${v}</div><div class="s">${sub}</div></div>`;
const repoHtml = status.repos.map((r) => {
  const ms = Object.entries(r.by_milestone).sort()
    .map(([m, x]) => `<tr><td>${esc(m)}</td><td>${x.items}</td><td>${x.sp_done}/${x.sp_total} SP</td><td><div class="bar"><i style="width:${x.sp_total ? Math.round((100 * x.sp_done) / x.sp_total) : 0}%"></i></div></td></tr>`).join("");
  return `<section><h2>${esc(r.name)}</h2><div class="cards">
    ${card("WIP", r.wip, "claimed+red+green+refactor")}
    ${card("Claimabili", r.claimable.length ? esc(r.claimable.join(" · ")) : "0")}
    ${card("Done 7g", r.throughput_7d, "throughput")}
    ${card("Commit 7g", r.commits_7d)}
    ${card("Cycle time", r.avg_cycle_time_hours == null ? "n/d" : r.avg_cycle_time_hours + "h", "media claim→done")}
  </div><table><tr><th>Milestone</th><th>Voci</th><th>Avanzamento</th><th></th></tr>${ms}</table></section>`;
}).join("");
const feed = status.recent_events.map((e) => {
  const what = e.type === "transition" ? `<b>${esc(e.task)}</b> ${esc(e.from)} → <b>${esc(e.to)}</b>`
    : e.type === "creation" ? `<b>${esc(e.task)}</b> in board (${esc(e.to)})`
    : esc(e.message);
  return `<li><time>${esc(e.ts.slice(0, 16).replace("T", " "))}</time> <span class="repo">${esc(e.repo)}</span> ${what}</li>`;
}).join("");
writeFileSync(join(out, "dashboard.html"), `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="120"><title>XP Monitor — tech-citizen</title><style>
body{background:#0d1117;color:#e6edf3;font:16px/1.5 -apple-system,system-ui,sans-serif;margin:24px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;border-bottom:1px solid #30363d;padding-bottom:4px}
.gen{color:#8b949e;font-size:13px}.cards{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:10px 16px;min-width:110px}
.k{color:#8b949e;font-size:12px;text-transform:uppercase}.v{font-size:26px;font-weight:700}.s{color:#8b949e;font-size:11px}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:4px 10px 4px 0}
.bar{background:#21262d;border-radius:4px;height:8px;width:160px}.bar i{display:block;background:#2ea043;height:8px;border-radius:4px}
ul{list-style:none;padding:0;font-size:14px}li{padding:3px 0;border-bottom:1px solid #161b22}
time{color:#8b949e;margin-right:8px;font-variant-numeric:tabular-nums}.repo{color:#58a6ff;margin-right:6px}
main{display:grid;grid-template-columns:1fr 1fr;gap:28px}@media(max-width:1100px){main{grid-template-columns:1fr}}
</style></head><body>
<h1>XP Monitor — tech-citizen <span class="gen">scope ${esc(status.scope)} · generato ${esc(status.generated_at.slice(0, 19).replace("T", " "))} · refresh 120s</span></h1>
<main><div>${repoHtml}</div><div><h2>Hit recenti</h2><ul>${feed}</ul></div></main></body></html>\n`);

console.log(`XP: ${events.length} eventi (scope=${SCOPE}), ${status.repos.length} repo → out/{events.jsonl,status.json,dashboard.html}`);
