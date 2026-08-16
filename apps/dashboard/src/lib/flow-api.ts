/**
 * Backend reale locale per le risorse REST del monitor (slice 1, sola lettura).
 *
 * Implementa lo STESSO contratto del backend simulato (`src/mocks/handlers.ts`):
 * stesse funzioni del motore di dominio (`src/domain/resources.ts`), stesso
 * envelope, stessi parametri. Cambia solo la sorgente: l'event log VERO della
 * fabbrica, letto da disco a ogni richiesta (append-only, niente cache).
 *
 * Il path del log è configurabile con la variabile server `XPFLOW_EVENTS_FILE`;
 * default: primo `.xpflow/events.jsonl` trovato risalendo le directory dalla
 * cwd — la dashboard vive in `apps/dashboard` dello stesso monorepo del log,
 * quindi la risalita si ferma alla radice del repo.
 * File assente → log vuoto: la UI mostra l'empty state, mai un errore.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseFlowLog } from "../domain/events";
import {
  buildSummary,
  queryAttention,
  queryBlockers,
  queryEstimates,
  queryEvents,
  queryFeedback,
  queryManualActions,
  readListParams,
} from "../domain/resources";

const FLOW_API_PREFIX = "/api/flow/";

const EVENTS_FILE_RELATIVE = path.join(".xpflow", "events.jsonl");

/**
 * Risolve il path dell'event log. Pura e iniettabile per i test:
 * `env` vince sempre; altrimenti si risale da `startDir` verso la radice del
 * filesystem cercando `.xpflow/events.jsonl`. Se non c'è da nessuna parte,
 * torna il default sotto `startDir` (file assente → empty state a valle).
 */
export function resolveEventsFile(
  env: Record<string, string | undefined>,
  startDir: string,
): string {
  const explicit = env["XPFLOW_EVENTS_FILE"];
  if (explicit) return explicit;

  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, EVENTS_FILE_RELATIVE);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(path.resolve(startDir), EVENTS_FILE_RELATIVE);
}

async function readLog(): Promise<string> {
  try {
    return await readFile(resolveEventsFile(process.env, process.cwd()), "utf8");
  } catch {
    return "";
  }
}

function ok(data: unknown, discardedRows: number): Response {
  return Response.json({ success: true, data, meta: { discardedRows } });
}

function fail(status: number, message: string): Response {
  return Response.json({ success: false, message, data: null }, { status });
}

export function isFlowApiRequest(request: Request): boolean {
  return request.method === "GET" && new URL(request.url).pathname.startsWith(FLOW_API_PREFIX);
}

export async function handleFlowApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const resource = url.pathname.slice(FLOW_API_PREFIX.length);

  const params = readListParams(url.searchParams);
  if (!params.ok) return fail(400, params.message);

  const parsed = parseFlowLog(await readLog());
  const { events, invalidCount } = parsed;

  switch (resource) {
    case "summary":
      return ok(buildSummary(parsed), invalidCount);
    case "events": {
      const result = queryEvents(events, params.value, {
        cmd: url.searchParams.get("cmd"),
        esito: url.searchParams.get("esito"),
      });
      return result.ok ? ok(result.value, invalidCount) : fail(400, result.message);
    }
    case "attention":
      return ok(queryAttention(events, params.value), invalidCount);
    case "manual-actions":
      return ok(queryManualActions(events, params.value), invalidCount);
    case "blockers": {
      const result = queryBlockers(events, params.value, url.searchParams.get("kind"));
      return result.ok ? ok(result.value, invalidCount) : fail(400, result.message);
    }
    case "feedback":
      return ok(queryFeedback(events, params.value), invalidCount);
    case "estimates":
      return ok(queryEstimates(events, params.value), invalidCount);
    default:
      return fail(404, `Risorsa flow sconosciuta: ${resource}`);
  }
}
