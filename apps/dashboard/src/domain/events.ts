/**
 * Parsing del log eventi (JSONL append-only, una riga = un evento).
 * La validazione vive nel contratto zod (`schema.ts`): qui c'è solo la
 * tolleranza ai formati (righe vuote, JSON rotto, payload API).
 */
import { flowEventSchema, flowEventsPayloadSchema } from "./schema";
import type { FlowEvent } from "./schema";

export { FLOW_COMMANDS, FLOW_OUTCOMES, flowEventSchema, flowEventsPayloadSchema } from "./schema";
export type { FlowCommand, FlowOutcome, FlowEvent } from "./schema";

export type ParseResult = {
  events: FlowEvent[];
  /** Righe scartate perché malformate: mostrato in UI come warning, mai crash. */
  invalidCount: number;
};

/**
 * Valida un record sconosciuto contro il contratto.
 * Ritorna `null` se la riga non è un evento valido.
 */
export function toFlowEvent(input: unknown): FlowEvent | null {
  const parsed = flowEventSchema.safeParse(input);
  if (!parsed.success) return null;
  // Le chiavi con valore undefined non devono comparire nell'oggetto
  // (exactOptionalPropertyTypes): si ricostruisce senza di esse.
  const event = parsed.data;
  const out: FlowEvent = { ts: event.ts, cmd: event.cmd };
  if (event.issue !== undefined) out.issue = event.issue;
  if (event.sp !== undefined) out.sp = event.sp;
  if (event.esito !== undefined) out.esito = event.esito;
  if (event.note !== undefined) out.note = event.note;
  if (event.ref !== undefined) out.ref = event.ref;
  return out;
}

/** Parsing di un log JSONL: righe vuote ignorate, righe rotte contate. */
export function parseFlowLog(source: string): ParseResult {
  const events: FlowEvent[] = [];
  let invalidCount = 0;

  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    try {
      const event = toFlowEvent(JSON.parse(trimmed));
      if (event) events.push(event);
      else invalidCount += 1;
    } catch {
      invalidCount += 1;
    }
  }

  return { events, invalidCount };
}

/** Parsing di un payload API (array nudo o envelope `{ data }`). */
export function parseFlowEvents(input: unknown): ParseResult {
  const payload = flowEventsPayloadSchema.safeParse(input);
  if (!payload.success) return { events: [], invalidCount: 0 };

  const events: FlowEvent[] = [];
  let invalidCount = 0;
  for (const item of payload.data) {
    const event = toFlowEvent(item);
    if (event) events.push(event);
    else invalidCount += 1;
  }
  return { events, invalidCount };
}

/** True se il payload non rispetta il contratto (né array né envelope). */
export function isValidFlowPayload(input: unknown): boolean {
  return flowEventsPayloadSchema.safeParse(input).success;
}

/** Ordinamento cronologico crescente stabile (non muta l'input). */
export function sortByTime(events: FlowEvent[]): FlowEvent[] {
  return [...events].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
}
