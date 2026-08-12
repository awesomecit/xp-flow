import { describe, expect, it } from "vitest";

import {
  countPendingMethodFeedback,
  parseFlowLog,
  selectActiveSprint,
  selectPendingManualActions,
  selectTimeline,
  summarizeFlow,
  toFlowEvent,
  type FlowEvent,
} from "@/domain";
import { FLOW_FIXTURE_JSONL, FLOW_FIXTURE_JSONL_WITH_ERRORS } from "@/domain/fixtures";

const base = parseFlowLog(FLOW_FIXTURE_JSONL).events;

describe("parsing eventi", () => {
  it("[positive] legge tutte le righe valide della fixture", () => {
    const result = parseFlowLog(FLOW_FIXTURE_JSONL);
    expect(result.events).toHaveLength(13);
    expect(result.invalidCount).toBe(0);
  });

  it("[positive] ignora i campi extra sconosciuti", () => {
    const event = toFlowEvent({
      ts: "2026-08-13T09:10:00+02:00",
      cmd: "sprint",
      esito: "in_corso",
      pippo: 42,
    });
    expect(event).toEqual({ ts: "2026-08-13T09:10:00+02:00", cmd: "sprint", esito: "in_corso" });
  });

  it("[negative] scarta e conta righe malformate senza lanciare", () => {
    const result = parseFlowLog(FLOW_FIXTURE_JSONL_WITH_ERRORS);
    expect(result.invalidCount).toBe(3);
    expect(result.events).toHaveLength(13);
  });

  it("[negative] rifiuta cmd ed esito fuori catalogo", () => {
    expect(toFlowEvent({ ts: "2026-08-13T09:00:00+02:00", cmd: "teleport" })).toBeNull();
    expect(
      toFlowEvent({ ts: "2026-08-13T09:00:00+02:00", cmd: "sprint", esito: "boh" }),
    ).toBeNull();
  });

  it("[edge] log vuoto o solo righe bianche", () => {
    expect(parseFlowLog("\n \n")).toEqual({ events: [], invalidCount: 0 });
  });
});

describe("sprint attivo", () => {
  it("[positive] individua l'ultima issue in corso e i suoi SP", () => {
    const sprint = selectActiveSprint(base);
    expect(sprint?.issue).toBe(1);
    expect(sprint?.spEstimated).toBe(3);
    expect(sprint?.spBurned).toBe(3);
    expect(sprint?.lastOutcome).toBe("escalation");
  });

  it("[negative] nessuno sprint attivo se l'ultima issue è chiusa", () => {
    const closed: FlowEvent[] = [
      { ts: "2026-08-12T10:00:00+02:00", cmd: "sprint", issue: 7, sp: 2, esito: "in_corso" },
      { ts: "2026-08-12T18:00:00+02:00", cmd: "sprint", issue: 7, esito: "chiuso" },
    ];
    expect(selectActiveSprint(closed)).toBeNull();
  });

  it("[edge] lista vuota non produce sprint", () => {
    expect(selectActiveSprint([])).toBeNull();
  });

  it("[regression] eventi fuori ordine cronologico danno lo stesso risultato", () => {
    const shuffled = [...base].reverse();
    expect(selectActiveSprint(shuffled)).toEqual(selectActiveSprint(base));
  });
});

describe("azioni manuali pendenti", () => {
  it("[positive] restano solo quelle senza manual_done", () => {
    const pending = selectPendingManualActions(base);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.note).toContain("git push");
  });

  it("[negative] un manual_done con ref inesistente non chiude nulla", () => {
    const events: FlowEvent[] = [
      ...base,
      { ts: "2026-08-13T19:00:00+02:00", cmd: "manual_done", ref: "2020-01-01T00:00:00+02:00" },
    ];
    expect(selectPendingManualActions(events)).toHaveLength(1);
  });

  it("[edge] nessuna azione manuale nel log", () => {
    expect(selectPendingManualActions([])).toEqual([]);
  });
});

describe("feedback metodo e riepilogo", () => {
  it("[positive] conta solo i feedback dopo l'ultima retro", () => {
    expect(countPendingMethodFeedback(base)).toBe(2);
  });

  it("[edge] senza retro conta tutti i feedback", () => {
    const events: FlowEvent[] = [{ ts: "2026-08-13T17:00:00+02:00", cmd: "metodo_feedback" }];
    expect(countPendingMethodFeedback(events)).toBe(1);
  });

  it("[positive] il riepilogo espone escalation e blocchi", () => {
    const summary = summarizeFlow(base);
    expect(summary.escalations).toHaveLength(1);
    expect(summary.blocked).toHaveLength(1);
    expect(summary.pendingManualActions).toHaveLength(1);
  });

  it("[regression] le derivazioni non mutano l'array di input", () => {
    const copy = [...base];
    summarizeFlow(base);
    selectTimeline(base, 3);
    expect(base).toEqual(copy);
  });

  it("[edge] la timeline limitata parte dall'evento più recente", () => {
    const timeline = selectTimeline(base, 2);
    expect(timeline).toHaveLength(2);
    expect(timeline[0]?.ts).toBe("2026-08-13T18:05:00+02:00");
  });
});
