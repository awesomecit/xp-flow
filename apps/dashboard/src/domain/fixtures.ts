/**
 * Dataset demo dello slice 1: alimenta il client API in demo mode.
 * Sostituibile in blocco quando arriva `GET /api/events`.
 */
export const FLOW_FIXTURE_JSONL = `
{"ts":"2026-08-13T09:10:00+02:00","cmd":"brainstorm","issue":1,"sp":3,"esito":"chiuso","note":"4 scenari Gherkin, stima 3 SP"}
{"ts":"2026-08-13T11:30:00+02:00","cmd":"sprint","issue":1,"sp":3,"esito":"in_corso","note":"scenario 2/4: stato con sprint attivo"}
{"ts":"2026-08-13T14:05:00+02:00","cmd":"pair-review","issue":1,"esito":"bloccato","note":"obiezione bloccante: test dipende dall'ordine"}
{"ts":"2026-08-13T15:00:00+02:00","cmd":"sprint","issue":1,"esito":"azione_manuale","note":"configurare secret TELEGRAM_TOKEN nel repo"}
{"ts":"2026-08-13T15:40:00+02:00","cmd":"sprint","issue":1,"esito":"azione_manuale","note":"eseguire git push dei commit locali (7)"}
{"ts":"2026-08-13T16:20:00+02:00","cmd":"sprint","issue":1,"esito":"escalation","note":"regola 1: 2 fallimenti test su sonnet → opus"}
{"ts":"2026-08-13T17:00:00+02:00","cmd":"metodo_feedback","note":"markdownlint in conflitto coi doc del kit"}
{"ts":"2026-08-13T17:30:00+02:00","cmd":"manual_done","ref":"2026-08-13T15:00:00+02:00"}
{"ts":"2026-08-12T09:00:00+02:00","cmd":"brainstorm","issue":0,"sp":2,"esito":"chiuso","note":"setup boilerplate: 3 scenari"}
{"ts":"2026-08-12T10:15:00+02:00","cmd":"sprint","issue":0,"sp":2,"esito":"in_corso","note":"scaffolding i18n e navigazione"}
{"ts":"2026-08-12T16:45:00+02:00","cmd":"sprint","issue":0,"esito":"chiuso","note":"issue 0 chiusa, 2 SP bruciati"}
{"ts":"2026-08-12T17:10:00+02:00","cmd":"retro","note":"retro issue 0: feedback metodo assorbiti"}
{"ts":"2026-08-13T18:05:00+02:00","cmd":"metodo_feedback","note":"serve un comando per rigenerare le fixture"}
`.trim();

/** Righe volutamente rotte per lo scenario @negative: JSON invalido e cmd fuori catalogo. */
export const FLOW_FIXTURE_JSONL_WITH_ERRORS = `${FLOW_FIXTURE_JSONL}
{"ts":"2026-08-13T18:30:00+02:00","cmd":"sprint"
{"ts":"2026-08-13T18:40:00+02:00","cmd":"teleport","issue":1}
{"cmd":"sprint","issue":1,"esito":"in_corso"}`;

/** Scenario "flusso sano": nessun blocco, nessuna escalation, nessuna azione pendente. */
export const FLOW_FIXTURE_HEALTHY = `
{"ts":"2026-08-13T09:10:00+02:00","cmd":"brainstorm","issue":1,"sp":3,"esito":"chiuso","note":"3 scenari Gherkin, stima 3 SP"}
{"ts":"2026-08-13T11:30:00+02:00","cmd":"sprint","issue":1,"sp":3,"esito":"in_corso","note":"scenario 2/3 in corso"}
{"ts":"2026-08-13T14:05:00+02:00","cmd":"pair-review","issue":1,"esito":"chiuso","note":"nessuna obiezione"}
`.trim();

/** Scenario "nessuno sprint attivo": tutto chiuso, in attesa di un nuovo brainstorm. */
export const FLOW_FIXTURE_NO_SPRINT = `
{"ts":"2026-08-12T09:00:00+02:00","cmd":"brainstorm","issue":0,"sp":2,"esito":"chiuso","note":"setup boilerplate"}
{"ts":"2026-08-12T10:15:00+02:00","cmd":"sprint","issue":0,"sp":2,"esito":"in_corso","note":"scaffolding"}
{"ts":"2026-08-12T16:45:00+02:00","cmd":"sprint","issue":0,"esito":"chiuso","note":"issue 0 chiusa"}
{"ts":"2026-08-12T17:10:00+02:00","cmd":"retro","note":"retro issue 0"}
`.trim();

/**
 * Dataset "volume": abbastanza eventi da superare la soglia di paginazione
 * in ogni lista (timeline, serve-da-te, blocchi, feedback, escalation).
 */
export const FLOW_FIXTURE_BULK = Array.from({ length: 12 }, (_, i) => {
  const day = 10 + Math.floor(i / 6);
  const hour = 8 + (i % 6) * 2;
  const ts = `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+02:00`;
  return [
    `{"ts":"${ts}","cmd":"sprint","issue":${i + 10},"sp":2,"esito":"azione_manuale","note":"azione manuale #${i + 1}"}`,
    `{"ts":"${ts.replace(":00:00", ":15:00")}","cmd":"pair-review","issue":${i + 10},"esito":"bloccato","note":"obiezione bloccante #${i + 1}"}`,
    `{"ts":"${ts.replace(":00:00", ":30:00")}","cmd":"sprint","issue":${i + 10},"esito":"escalation","note":"escalation #${i + 1}"}`,
    `{"ts":"${ts.replace(":00:00", ":45:00")}","cmd":"metodo_feedback","note":"feedback metodo #${i + 1}"}`,
  ].join("\n");
}).join("\n");

/** Dataset selezionabili in demo mode (usati dagli scenari E2E deterministici). */
export const FLOW_DEMO_DATASETS = {
  default: FLOW_FIXTURE_JSONL_WITH_ERRORS,
  healthy: FLOW_FIXTURE_HEALTHY,
  "no-sprint": FLOW_FIXTURE_NO_SPRINT,
  bulk: FLOW_FIXTURE_BULK,
} as const;

export type FlowDemoScenario = keyof typeof FLOW_DEMO_DATASETS;

export function isFlowDemoScenario(value: string | null | undefined): value is FlowDemoScenario {
  return value !== null && value !== undefined && value in FLOW_DEMO_DATASETS;
}
