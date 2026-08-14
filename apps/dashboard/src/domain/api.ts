/**
 * Client REST del dominio XP Flow. Slice 1: sola lettura.
 *
 * Una funzione per endpoint, ognuna con:
 * - query tipizzata (page/pageSize/order/filtri);
 * - validazione zod della risposta contro il contratto (`contracts.ts`);
 * - `AppError` con codice stabile quando il contratto è violato.
 *
 * Nessuna derivazione lato client: i dati arrivano già calcolati e paginati
 * dal server (MSW in demo, backend reale in produzione).
 */
import { apiGet, apiList } from "../api";
import type { ApiMeta, Paginated } from "../api";
import { createAppError } from "../errors/AppError";
import {
  attentionItemSchema,
  estimateAccuracySchema,
  flowSummarySchema,
  manualActionSchema,
  paginatedSchema,
  type AttentionItemDto,
  type EstimateAccuracyDto,
  type FlowSummaryDto,
  type ManualActionDto,
} from "./contracts";
import { isFlowDemoScenario, type FlowDemoScenario } from "./fixtures";
import { flowEventSchema, type FlowEvent } from "./schema";

export type Source = "network" | "demo" | "fallback";

/** Risultato di lettura: dati + provenienza, per la diagnostica in Impostazioni. */
export type Read<T> = {
  data: T;
  source: Source;
  meta: ApiMeta;
  fetchedAt: number;
};

export type ListArgs = {
  page?: number;
  pageSize?: number;
  order?: "asc" | "desc";
};

export type EventsArgs = ListArgs & { cmd?: string; esito?: string; kind?: string };

const BASE = "/flow";

export const flowQueryKeys = {
  all: (scenario: string) => ["flow", scenario] as const,
  summary: (scenario: string) => ["flow", scenario, "summary"] as const,
  events: (scenario: string, args: EventsArgs) => ["flow", scenario, "events", args] as const,
  attention: (scenario: string, args: ListArgs) => ["flow", scenario, "attention", args] as const,
  manualActions: (scenario: string, args: ListArgs) =>
    ["flow", scenario, "manual-actions", args] as const,
  blockers: (scenario: string, args: ListArgs) => ["flow", scenario, "blockers", args] as const,
  feedback: (scenario: string, args: ListArgs) => ["flow", scenario, "feedback", args] as const,
  estimates: (scenario: string, args: ListArgs) => ["flow", scenario, "estimates", args] as const,
};

/**
 * Scenario demo attivo: `?demo=healthy|no-sprint|bulk|error|contract|slow`.
 * Serve agli scenari E2E deterministici (nessun test flaky su dati random).
 */
export function currentDemoScenario(): string {
  if (typeof window === "undefined") return "default";
  return new URLSearchParams(window.location.search).get("demo") ?? "default";
}

export function isDomainScenario(value: string): value is FlowDemoScenario {
  return isFlowDemoScenario(value);
}

function query(scenario: string, args: EventsArgs = {}): Record<string, string | number> {
  const out: Record<string, string | number> = { demo: scenario };
  if (args.page !== undefined) out["page"] = args.page;
  if (args.pageSize !== undefined) out["pageSize"] = args.pageSize;
  if (args.order !== undefined) out["order"] = args.order;
  if (args.cmd !== undefined && args.cmd !== "all") out["cmd"] = args.cmd;
  if (args.esito !== undefined && args.esito !== "all") out["esito"] = args.esito;
  if (args.kind !== undefined && args.kind !== "all") out["kind"] = args.kind;
  return out;
}

function contractError(path: string, issues: unknown): never {
  throw createAppError("validation", `Risposta di ${path} non conforme al contratto`, {
    code: "contract.invalid",
    status: 422,
    context: { path, issues },
  });
}

export async function fetchFlowSummary(
  scenario: string,
  signal?: AbortSignal,
): Promise<Read<FlowSummaryDto>> {
  const path = `${BASE}/summary`;
  const result = await apiGet<unknown>(path, query(scenario), signal);
  const parsed = flowSummarySchema.safeParse(result.data);
  if (!parsed.success) contractError(path, parsed.error.issues);
  return { data: parsed.data, source: result.source, meta: result.meta, fetchedAt: Date.now() };
}

async function fetchPage<T>(
  path: string,
  schema: ReturnType<typeof paginatedSchema>,
  scenario: string,
  args: EventsArgs,
  signal?: AbortSignal,
): Promise<Read<Paginated<T>>> {
  const result = await apiList<unknown>(path, query(scenario, args), signal);
  const parsed = schema.safeParse(result.data);
  if (!parsed.success) contractError(path, parsed.error.issues);
  return {
    data: parsed.data as Paginated<T>,
    source: result.source,
    meta: result.meta,
    fetchedAt: Date.now(),
  };
}

export function fetchFlowEvents(
  scenario: string,
  args: EventsArgs,
  signal?: AbortSignal,
): Promise<Read<Paginated<FlowEvent>>> {
  return fetchPage<FlowEvent>(
    `${BASE}/events`,
    paginatedSchema(flowEventSchema),
    scenario,
    args,
    signal,
  );
}

export function fetchAttention(
  scenario: string,
  args: ListArgs,
  signal?: AbortSignal,
): Promise<Read<Paginated<AttentionItemDto>>> {
  return fetchPage<AttentionItemDto>(
    `${BASE}/attention`,
    paginatedSchema(attentionItemSchema),
    scenario,
    args,
    signal,
  );
}

export function fetchManualActions(
  scenario: string,
  args: ListArgs,
  signal?: AbortSignal,
): Promise<Read<Paginated<ManualActionDto>>> {
  return fetchPage<ManualActionDto>(
    `${BASE}/manual-actions`,
    paginatedSchema(manualActionSchema),
    scenario,
    args,
    signal,
  );
}

export type BlockersArgs = ListArgs & { kind?: "bloccato" | "escalation" | "all" };

export function fetchBlockers(
  scenario: string,
  args: BlockersArgs,
  signal?: AbortSignal,
): Promise<Read<Paginated<FlowEvent>>> {
  return fetchPage<FlowEvent>(
    `${BASE}/blockers`,
    paginatedSchema(flowEventSchema),
    scenario,
    args,
    signal,
  );
}

export function fetchFeedback(
  scenario: string,
  args: ListArgs,
  signal?: AbortSignal,
): Promise<Read<Paginated<FlowEvent>>> {
  return fetchPage<FlowEvent>(
    `${BASE}/feedback`,
    paginatedSchema(flowEventSchema),
    scenario,
    args,
    signal,
  );
}

export function fetchEstimates(
  scenario: string,
  args: ListArgs,
  signal?: AbortSignal,
): Promise<Read<Paginated<EstimateAccuracyDto>>> {
  return fetchPage<EstimateAccuracyDto>(
    `${BASE}/estimates`,
    paginatedSchema(estimateAccuracySchema),
    scenario,
    args,
    signal,
  );
}

type Ctx = { signal?: AbortSignal };

export function flowSummaryQueryOptions(scenario: string) {
  return {
    queryKey: flowQueryKeys.summary(scenario),
    queryFn: ({ signal }: Ctx) => fetchFlowSummary(scenario, signal),
  };
}

export function flowEventsQueryOptions(scenario: string, args: EventsArgs) {
  return {
    queryKey: flowQueryKeys.events(scenario, args),
    queryFn: ({ signal }: Ctx) => fetchFlowEvents(scenario, args, signal),
  };
}

export function attentionQueryOptions(scenario: string, args: ListArgs) {
  return {
    queryKey: flowQueryKeys.attention(scenario, args),
    queryFn: ({ signal }: Ctx) => fetchAttention(scenario, args, signal),
  };
}

export function manualActionsQueryOptions(scenario: string, args: ListArgs) {
  return {
    queryKey: flowQueryKeys.manualActions(scenario, args),
    queryFn: ({ signal }: Ctx) => fetchManualActions(scenario, args, signal),
  };
}

export function blockersQueryOptions(scenario: string, args: BlockersArgs) {
  return {
    queryKey: flowQueryKeys.blockers(scenario, args),
    queryFn: ({ signal }: Ctx) => fetchBlockers(scenario, args, signal),
  };
}

export function feedbackQueryOptions(scenario: string, args: ListArgs) {
  return {
    queryKey: flowQueryKeys.feedback(scenario, args),
    queryFn: ({ signal }: Ctx) => fetchFeedback(scenario, args, signal),
  };
}

export function estimatesQueryOptions(scenario: string, args: ListArgs) {
  return {
    queryKey: flowQueryKeys.estimates(scenario, args),
    queryFn: ({ signal }: Ctx) => fetchEstimates(scenario, args, signal),
  };
}
