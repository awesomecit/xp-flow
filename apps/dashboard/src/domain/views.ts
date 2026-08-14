/**
 * Derivazioni di vista (pure): pipeline, retro e north-star.
 * Nessuna I/O, nessun React: consumate direttamente dalle rotte.
 */
import { sortByTime, type FlowCommand, type FlowEvent, type FlowOutcome } from "./events";
import { burnedStoryPoints, estimatedStoryPoints } from "./derive";

export const PIPELINE_STAGES: FlowCommand[] = ["brainstorm", "sprint", "pair-review", "retro"];

export type PipelineStage = {
  cmd: FlowCommand;
  /** Ultimo esito visto per lo stage (undefined = mai attraversato). */
  lastOutcome?: FlowOutcome;
  status: "todo" | "in_corso" | "bloccato" | "chiuso";
  events: FlowEvent[];
};

export function selectPipeline(events: FlowEvent[], issue?: number): PipelineStage[] {
  const scoped = sortByTime(events).filter((e) => issue === undefined || e.issue === issue);

  return PIPELINE_STAGES.map((cmd) => {
    const stageEvents = scoped.filter((e) => e.cmd === cmd);
    const last = stageEvents[stageEvents.length - 1];
    const stage: PipelineStage = { cmd, status: "todo", events: stageEvents };
    if (!last) return stage;
    if (last.esito) stage.lastOutcome = last.esito;
    stage.status =
      last.esito === "bloccato" || last.esito === "escalation"
        ? "bloccato"
        : last.esito === "chiuso"
          ? "chiuso"
          : "in_corso";
    return stage;
  });
}

/** Eventi che rappresentano un blocco del flusso (bloccato o escalation). */
export function selectBlockers(events: FlowEvent[]): FlowEvent[] {
  return sortByTime(events)
    .filter((e) => e.esito === "bloccato" || e.esito === "escalation")
    .reverse();
}

export type EstimateAccuracyRow = {
  issue: number;
  estimated: number;
  burned: number;
  /** 1 = stima perfetta; 0 quando non ci sono dati sufficienti. */
  accuracy: number;
};

export function selectEstimateAccuracy(events: FlowEvent[]): EstimateAccuracyRow[] {
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

/** Media delle accuratezze note (0 quando non calcolabile). */
export function averageEstimateAccuracy(events: FlowEvent[]): number {
  const rows = selectEstimateAccuracy(events).filter((r) => r.accuracy > 0);
  if (rows.length === 0) return 0;
  return rows.reduce((total, r) => total + r.accuracy, 0) / rows.length;
}

export function selectClosedIssues(events: FlowEvent[]): number[] {
  return [
    ...new Set(
      events
        .filter((e) => e.esito === "chiuso" && e.issue !== undefined)
        .map((e) => e.issue as number),
    ),
  ].sort((a, b) => a - b);
}

/** `metodo_feedback` dopo l'ultima retro, dal più recente. */
export function selectMethodFeedback(events: FlowEvent[]): FlowEvent[] {
  const ordered = sortByTime(events);
  const lastRetro = [...ordered].reverse().find((e) => e.cmd === "retro");
  const from = lastRetro ? Date.parse(lastRetro.ts) : Number.NEGATIVE_INFINITY;
  return ordered.filter((e) => e.cmd === "metodo_feedback" && Date.parse(e.ts) > from).reverse();
}
