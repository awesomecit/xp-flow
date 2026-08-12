/**
 * Derivazioni pure sullo stream di eventi: nessun accesso a React, nessuna I/O.
 * I componenti leggono solo il risultato di queste funzioni.
 */
import { sortByTime, type FlowEvent } from "./events";

export type ActiveSprint = {
  issue: number;
  /** Ultimo evento `sprint` con esito `in_corso` per quella issue. */
  startedAt: string;
  lastUpdate: string;
  spEstimated: number;
  spBurned: number;
  /** Ultimo esito registrato sulla issue (utile per stato bloccato/escalation). */
  lastOutcome: FlowEvent["esito"];
  note?: string;
};

export type PendingManualAction = {
  /** ts dell'evento `azione_manuale`: è la chiave usata da `manual_done.ref`. */
  ts: string;
  issue?: number;
  note?: string;
};

export type FlowSummary = {
  activeSprint: ActiveSprint | null;
  pendingManualActions: PendingManualAction[];
  /** `metodo_feedback` registrati dopo l'ultima retro: in attesa di essere discussi. */
  pendingMethodFeedback: number;
  escalations: FlowEvent[];
  blocked: FlowEvent[];
};

/** Issue con un `in_corso` non seguito da un `chiuso`; vince la più recente. */
export function selectActiveSprint(events: FlowEvent[]): ActiveSprint | null {
  const ordered = sortByTime(events);
  let current: ActiveSprint | null = null;

  for (const event of ordered) {
    if (event.issue === undefined) continue;

    if (event.esito === "chiuso") {
      if (current && current.issue === event.issue) current = null;
      continue;
    }

    if (event.cmd === "sprint" && event.esito === "in_corso") {
      if (!current || current.issue !== event.issue) {
        current = {
          issue: event.issue,
          startedAt: event.ts,
          lastUpdate: event.ts,
          spEstimated: 0,
          spBurned: 0,
          lastOutcome: event.esito,
        };
      }
    }

    if (current && current.issue === event.issue) {
      current.lastUpdate = event.ts;
      if (event.esito) current.lastOutcome = event.esito;
      if (event.note !== undefined) current.note = event.note;
    }
  }

  if (!current) return null;

  const issueEvents = ordered.filter((e) => e.issue === current?.issue);
  return {
    ...current,
    spEstimated: estimatedStoryPoints(issueEvents),
    spBurned: burnedStoryPoints(issueEvents, current.startedAt),
  };
}

/** Stima: SP dichiarati in brainstorm; in mancanza, il primo `sp` visto sulla issue. */
export function estimatedStoryPoints(issueEvents: FlowEvent[]): number {
  const ordered = sortByTime(issueEvents);
  const fromBrainstorm = ordered.find((e) => e.cmd === "brainstorm" && e.sp !== undefined);
  if (fromBrainstorm?.sp !== undefined) return fromBrainstorm.sp;
  return ordered.find((e) => e.sp !== undefined)?.sp ?? 0;
}

/** Bruciati: SP dichiarati sugli eventi `sprint` dall'inizio dello sprint attivo. */
export function burnedStoryPoints(issueEvents: FlowEvent[], since?: string): number {
  const from = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;
  return sortByTime(issueEvents)
    .filter((e) => e.cmd === "sprint" && e.sp !== undefined && Date.parse(e.ts) >= from)
    .reduce((total, e) => total + (e.sp ?? 0), 0);
}

/** `azione_manuale` senza un `manual_done` che la referenzia. */
export function selectPendingManualActions(events: FlowEvent[]): PendingManualAction[] {
  const done = new Set(
    events.filter((e) => e.cmd === "manual_done" && e.ref).map((e) => e.ref as string),
  );

  return sortByTime(events)
    .filter((e) => e.esito === "azione_manuale" && !done.has(e.ts))
    .map((e) => {
      const action: PendingManualAction = { ts: e.ts };
      if (e.issue !== undefined) action.issue = e.issue;
      if (e.note !== undefined) action.note = e.note;
      return action;
    });
}

/** Feedback sul metodo registrati dopo l'ultima retro. */
export function countPendingMethodFeedback(events: FlowEvent[]): number {
  const ordered = sortByTime(events);
  const lastRetro = [...ordered].reverse().find((e) => e.cmd === "retro");
  const from = lastRetro ? Date.parse(lastRetro.ts) : Number.NEGATIVE_INFINITY;
  return ordered.filter((e) => e.cmd === "metodo_feedback" && Date.parse(e.ts) > from).length;
}

export function summarizeFlow(events: FlowEvent[]): FlowSummary {
  return {
    activeSprint: selectActiveSprint(events),
    pendingManualActions: selectPendingManualActions(events),
    pendingMethodFeedback: countPendingMethodFeedback(events),
    escalations: sortByTime(events).filter((e) => e.esito === "escalation"),
    blocked: sortByTime(events).filter((e) => e.esito === "bloccato"),
  };
}

/** Timeline: più recente in cima. */
export function selectTimeline(events: FlowEvent[], limit?: number): FlowEvent[] {
  const ordered = [...sortByTime(events)].reverse();
  return limit === undefined ? ordered : ordered.slice(0, limit);
}
