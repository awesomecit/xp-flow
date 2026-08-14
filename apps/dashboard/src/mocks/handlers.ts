/**
 * Backend simulato (MSW) per le risorse REST del monitor.
 *
 * Non è "un mock di comodo": implementa lo stesso contratto del backend reale
 * usando il motore di query del dominio (`src/domain/resources.ts`). L'app fa
 * fetch vere (URL, query string, header, status HTTP, envelope) e la
 * paginazione avviene qui, lato server.
 *
 * Scenari pilotabili con `?demo=`:
 * - `default` | `healthy` | `no-sprint` | `bulk` : dataset di dominio
 * - `error`    : 500 su ogni risorsa (scenari @negative)
 * - `contract` : payload fuori contratto (validazione client)
 * - `slow`     : risposta lenta (stati di caricamento)
 */
import { http, HttpResponse, delay } from "msw";

import { parseFlowLog, type ParseResult } from "../domain/events";
import { FLOW_DEMO_DATASETS, isFlowDemoScenario } from "../domain/fixtures";
import {
  buildSummary,
  queryAttention,
  queryBlockers,
  queryEstimates,
  queryEvents,
  queryFeedback,
  queryManualActions,
  readListParams,
  type ListParams,
} from "../domain/resources";

export const MOCK_SCENARIOS = ["error", "contract", "slow"] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function isMockScenario(value: string | null): value is MockScenario {
  return value !== null && (MOCK_SCENARIOS as readonly string[]).includes(value);
}

type Ctx = {
  scenario: string | null;
  parsed: ParseResult;
  params: ListParams;
  search: URLSearchParams;
};

function ok(data: unknown, parsed: ParseResult): Response {
  return HttpResponse.json({
    success: true,
    data,
    meta: { discardedRows: parsed.invalidCount },
  });
}

function fail(status: number, message: string): Response {
  return HttpResponse.json({ success: false, message, data: null }, { status });
}

/**
 * Pipeline comune a tutte le risorse: scenari speciali, dataset, parametri.
 * Ritorna una Response quando la richiesta è già conclusa (errore/scenario).
 */
async function prepare(request: Request): Promise<Ctx | Response> {
  const search = new URL(request.url).searchParams;
  const scenario = search.get("demo");

  if (scenario === "error") return fail(500, "boom");
  if (scenario === "slow") await delay(1500);

  const params = readListParams(search);
  if (!params.ok) return fail(400, params.message);

  const dataset = isFlowDemoScenario(scenario) ? scenario : "default";
  return {
    scenario,
    parsed: parseFlowLog(FLOW_DEMO_DATASETS[dataset]),
    params: params.value,
    search,
  };
}

export const handlers = [
  http.get("*/api/flow/summary", async ({ request }) => {
    const ctx = await prepare(request);
    if (ctx instanceof Response) return ctx;
    if (ctx.scenario === "contract") {
      return HttpResponse.json({ success: true, data: { unexpected: true } });
    }
    return ok(buildSummary(ctx.parsed), ctx.parsed);
  }),

  http.get("*/api/flow/events", async ({ request }) => {
    const ctx = await prepare(request);
    if (ctx instanceof Response) return ctx;
    if (ctx.scenario === "contract") {
      return HttpResponse.json({ success: true, data: { items: [{ broken: true }] } });
    }
    const result = queryEvents(ctx.parsed.events, ctx.params, {
      cmd: ctx.search.get("cmd"),
      esito: ctx.search.get("esito"),
    });
    if (!result.ok) return fail(400, result.message);
    return ok(result.value, ctx.parsed);
  }),

  http.get("*/api/flow/attention", async ({ request }) => {
    const ctx = await prepare(request);
    if (ctx instanceof Response) return ctx;
    return ok(queryAttention(ctx.parsed.events, ctx.params), ctx.parsed);
  }),

  http.get("*/api/flow/manual-actions", async ({ request }) => {
    const ctx = await prepare(request);
    if (ctx instanceof Response) return ctx;
    return ok(queryManualActions(ctx.parsed.events, ctx.params), ctx.parsed);
  }),

  http.get("*/api/flow/blockers", async ({ request }) => {
    const ctx = await prepare(request);
    if (ctx instanceof Response) return ctx;
    const result = queryBlockers(ctx.parsed.events, ctx.params, ctx.search.get("kind"));
    if (!result.ok) return fail(400, result.message);
    return ok(result.value, ctx.parsed);
  }),

  http.get("*/api/flow/feedback", async ({ request }) => {
    const ctx = await prepare(request);
    if (ctx instanceof Response) return ctx;
    return ok(queryFeedback(ctx.parsed.events, ctx.params), ctx.parsed);
  }),

  http.get("*/api/flow/estimates", async ({ request }) => {
    const ctx = await prepare(request);
    if (ctx instanceof Response) return ctx;
    return ok(queryEstimates(ctx.parsed.events, ctx.params), ctx.parsed);
  }),
];
