/**
 * Motore di query lato risorsa: trasforma l'event log in DTO REST.
 *
 * Vive nel dominio (non nei mock) perché è il comportamento CONTRATTUALE degli
 * endpoint: filtri, ordinamento e paginazione sono definiti qui una volta sola,
 * sono puri e quindi testabili, e li usa il backend simulato (MSW) esattamente
 * come li userà il backend reale. Il client NON ripete nulla di tutto questo.
 */
import type { Paginated } from "../api/types";
import {
  burnedStoryPoints,
  countPendingMethodFeedback,
  estimatedStoryPoints,
  selectActiveSprint,
  selectPendingManualActions,
} from "./derive";
import { sortByTime, type FlowEvent } from "./events";
import type { ParseResult } from "./events";
import { FLOW_COMMANDS, FLOW_OUTCOMES } from "./schema";
import type {
  ActiveSprintDto,
  AttentionItemDto,
  EstimateAccuracyDto,
  FlowSummaryDto,
  ManualActionDto,
  PipelineStageDto,
  PipelineStatus,
} from "./contracts";
import { PIPELINE_STAGES } from "./views";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export type ListParams = {
  page: number;
  pageSize: number;
  order: "asc" | "desc";
};

export type ParamsResult<T> = { ok: true; value: T } | { ok: false; message: string };

/** Validazione dei parametri di lista: input fuori contratto = 400, non silenzio. */
export function readListParams(search: URLSearchParams): ParamsResult<ListParams> {
  const page = readInt(search.get("page"), 1);
  const pageSize = readInt(search.get("pageSize"), DEFAULT_PAGE_SIZE);
  const order = search.get("order") ?? "desc";

  if (page === null || page < 1) return { ok: false, message: "Parametro 'page' non valido" };
  if (pageSize === null || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    return { ok: false, message: `Parametro 'pageSize' non valido (1..${MAX_PAGE_SIZE})` };
  }
  if (order !== "asc" && order !== "desc") {
    return { ok: false, message: "Parametro 'order' non valido (asc|desc)" };
  }
  return { ok: true, value: { page, pageSize, order } };
}

function readInt(raw: string | null, fallback: number): number | null {
  if (raw === null || raw === "") return fallback;
  if (!/^-?\d+$/.test(raw)) return null;
  return Number.parseInt(raw, 10);
}

/** Taglio della pagina: il server decide, il client mostra. */
export function paginateItems<T>(items: readonly T[], params: ListParams): Paginated<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, pageCount);
  const start = (page - 1) * params.pageSize;
  return {
    items: items.slice(start, start + params.pageSize),
    page,
    pageSize: params.pageSize,
    total,
    pageCount,
  };
}

function ordered(events: FlowEvent[], order: ListParams["order"]): FlowEvent[] {
  const asc = sortByTime(events);
  return order === "asc" ? asc : asc.reverse();
}

function toActiveSprintDto(events: FlowEvent[]): ActiveSprintDto | null {
  const active = selectActiveSprint(events);
  if (!active) return null;
  return {
    issue: active.issue,
    startedAt: active.startedAt,
    lastUpdate: active.lastUpdate,
    spEstimated: active.spEstimated,
    spBurned: active.spBurned,
    ...(active.lastOutcome !== undefined ? { lastOutcome: active.lastOutcome } : {}),
    ...(active.note !== undefined ? { note: active.note } : {}),
  };
}

function toStageDtos(events: FlowEvent[], issue?: number): PipelineStageDto[] {
  const scoped = sortByTime(events).filter((e) => issue === undefined || e.issue === issue);

  return PIPELINE_STAGES.map((cmd) => {
    const stageEvents = scoped.filter((e) => e.cmd === cmd);
    const last = stageEvents[stageEvents.length - 1];
    if (!last) return { cmd, status: "todo" as PipelineStatus };
    const status: PipelineStatus =
      last.esito === "bloccato" || last.esito === "escalation"
        ? "bloccato"
        : last.esito === "chiuso"
          ? "chiuso"
          : "in_corso";
    return {
      cmd,
      status,
      ...(last.esito !== undefined ? { lastOutcome: last.esito } : {}),
      ...(last.note !== undefined ? { note: last.note } : {}),
    };
  });
}

/** Righe di accuratezza stima, una per issue con dati sufficienti. */
export function buildEstimates(events: FlowEvent[]): EstimateAccuracyDto[] {
  const issues = [
    ...new Set(events.map((e) => e.issue).filter((i): i is number => i !== undefined)),
  ];
  return issues
    .map((issue) => {
      const issueEvents = events.filter((e) => e.issue === issue);
      const estimated = estimatedStoryPoints(issueEvents);
      const burned = burnedStoryPoints(issueEvents);
      const accuracy =
        estimated > 0 && burned > 0 ? Math.min(estimated, burned) / Math.max(estimated, burned) : 0;
      return { issue, estimated, burned, accuracy };
    })
    .sort((a, b) => a.issue - b.issue);
}

function averageAccuracy(rows: EstimateAccuracyDto[]): number {
  const known = rows.filter((r) => r.accuracy > 0);
  if (known.length === 0) return 0;
  return known.reduce((total, r) => total + r.accuracy, 0) / known.length;
}

export function selectBlockerEvents(events: FlowEvent[]): FlowEvent[] {
  return events.filter((e) => e.esito === "bloccato" || e.esito === "escalation");
}

/** `metodo_feedback` successivi all'ultima retro. */
export function selectFeedbackEvents(events: FlowEvent[]): FlowEvent[] {
  const asc = sortByTime(events);
  const lastRetro = [...asc].reverse().find((e) => e.cmd === "retro");
  const from = lastRetro ? Date.parse(lastRetro.ts) : Number.NEGATIVE_INFINITY;
  return asc.filter((e) => e.cmd === "metodo_feedback" && Date.parse(e.ts) > from);
}

function closedIssues(events: FlowEvent[]): number[] {
  return [
    ...new Set(
      events
        .filter((e) => e.esito === "chiuso" && e.issue !== undefined)
        .map((e) => e.issue as number),
    ),
  ];
}

/** Risorsa `summary`: tutto ciò che la dashboard mostra senza liste. */
export function buildSummary(parsed: ParseResult): FlowSummaryDto {
  const { events, invalidCount } = parsed;
  const activeSprint = toActiveSprintDto(events);
  const estimates = buildEstimates(events);

  return {
    activeSprint,
    stages: toStageDtos(events, activeSprint?.issue),
    counts: {
      events: events.length,
      discardedRows: invalidCount,
      manualActions: selectPendingManualActions(events).length,
      blockers: selectBlockerEvents(events).length,
      escalations: events.filter((e) => e.esito === "escalation").length,
      blocked: events.filter((e) => e.esito === "bloccato").length,
      methodFeedback: countPendingMethodFeedback(events),
      closedIssues: closedIssues(events).length,
    },
    estimateAccuracy: averageAccuracy(estimates),
  };
}

export type EventFilters = { cmd?: string | null; esito?: string | null };

/** Risorsa `events`: filtri per comando/esito applicati dal server. */
export function queryEvents(
  events: FlowEvent[],
  params: ListParams,
  filters: EventFilters = {},
): ParamsResult<Paginated<FlowEvent>> {
  const { cmd, esito } = filters;
  if (cmd && cmd !== "all" && !(FLOW_COMMANDS as readonly string[]).includes(cmd)) {
    return { ok: false, message: "Parametro 'cmd' non valido" };
  }
  if (esito && esito !== "all" && !(FLOW_OUTCOMES as readonly string[]).includes(esito)) {
    return { ok: false, message: "Parametro 'esito' non valido" };
  }

  const filtered = events.filter(
    (event) =>
      (!cmd || cmd === "all" || event.cmd === cmd) &&
      (!esito || esito === "all" || event.esito === esito),
  );
  return { ok: true, value: paginateItems(ordered(filtered, params.order), params) };
}

/**
 * Risorsa `attention` ("Serve da te"): un'unica lista ordinata per urgenza
 * (azioni manuali -> bloccati -> escalation). Sta lato server perché la
 * paginazione non deve mai spezzare la semantica dell'ordinamento.
 */
export function buildAttention(events: FlowEvent[]): AttentionItemDto[] {
  const manual: AttentionItemDto[] = selectPendingManualActions(events).map((action) => ({
    kind: "manual" as const,
    ts: action.ts,
    ...(action.issue !== undefined ? { issue: action.issue } : {}),
    ...(action.note !== undefined ? { note: action.note } : {}),
  }));

  const fromEvents = (esito: "bloccato" | "escalation", kind: "blocked" | "escalation") =>
    sortByTime(events)
      .filter((e) => e.esito === esito)
      .map((e) => ({
        kind,
        ts: e.ts,
        cmd: e.cmd,
        ...(e.issue !== undefined ? { issue: e.issue } : {}),
        ...(e.note !== undefined ? { note: e.note } : {}),
      }));

  return [
    ...manual,
    ...fromEvents("bloccato", "blocked"),
    ...fromEvents("escalation", "escalation"),
  ];
}

export function queryAttention(
  events: FlowEvent[],
  params: ListParams,
): Paginated<AttentionItemDto> {
  return paginateItems(buildAttention(events), params);
}

export function queryManualActions(
  events: FlowEvent[],
  params: ListParams,
): Paginated<ManualActionDto> {
  const items = selectPendingManualActions(events);
  return paginateItems(params.order === "asc" ? items : [...items].reverse(), params);
}

export function queryBlockers(
  events: FlowEvent[],
  params: ListParams,
  kind?: string | null,
): ParamsResult<Paginated<FlowEvent>> {
  if (kind && kind !== "all" && kind !== "bloccato" && kind !== "escalation") {
    return { ok: false, message: "Parametro 'kind' non valido (bloccato|escalation)" };
  }
  const all = selectBlockerEvents(events);
  const filtered = !kind || kind === "all" ? all : all.filter((e) => e.esito === kind);
  return { ok: true, value: paginateItems(ordered(filtered, params.order), params) };
}

export function queryFeedback(events: FlowEvent[], params: ListParams): Paginated<FlowEvent> {
  return paginateItems(ordered(selectFeedbackEvents(events), params.order), params);
}

export function queryEstimates(
  events: FlowEvent[],
  params: ListParams,
): Paginated<EstimateAccuracyDto> {
  return paginateItems(buildEstimates(events), params);
}
