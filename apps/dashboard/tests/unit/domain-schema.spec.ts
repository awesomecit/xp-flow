import { describe, expect, it } from "vitest";

import { flowEventSchema, flowEventsPayloadSchema } from "@/domain/schema";
import { parseFlowEvents, toFlowEvent } from "@/domain/events";

const valid = {
  ts: "2026-08-25T09:30:00+02:00",
  cmd: "sprint",
  issue: 1,
  sp: 3,
  esito: "in_corso",
  note: "scenario 2/3",
};

describe("contratto eventi (zod)", () => {
  it("[positive] accetta un evento conforme", () => {
    expect(flowEventSchema.parse(valid)).toMatchObject({ cmd: "sprint", issue: 1 });
  });

  it("[positive] ignora i campi extra sconosciuti", () => {
    const event = toFlowEvent({ ...valid, extra: "boh", nested: { a: 1 } });
    expect(event).not.toBeNull();
    expect(event).not.toHaveProperty("extra");
  });

  it("[negative] rifiuta timestamp non parsabili", () => {
    expect(toFlowEvent({ ...valid, ts: "non-una-data" })).toBeNull();
  });

  it("[negative] rifiuta cmd fuori catalogo", () => {
    expect(toFlowEvent({ ...valid, cmd: "teleport" })).toBeNull();
  });

  it("[negative] rifiuta esito fuori catalogo", () => {
    expect(toFlowEvent({ ...valid, esito: "forse" })).toBeNull();
  });

  it("[edge] i campi opzionali con tipo sbagliato vengono ignorati, non invalidano la riga", () => {
    const event = toFlowEvent({ ...valid, issue: "1", sp: null, note: "" });
    expect(event).not.toBeNull();
    expect(event?.issue).toBeUndefined();
    expect(event?.sp).toBeUndefined();
    expect(event?.note).toBeUndefined();
  });

  it("[positive] il payload accetta sia array nudo sia envelope { data }", () => {
    expect(flowEventsPayloadSchema.parse([valid])).toHaveLength(1);
    expect(flowEventsPayloadSchema.parse({ data: [valid] })).toHaveLength(1);
  });

  it("[negative] un payload non conforme non passa il contratto", () => {
    expect(flowEventsPayloadSchema.safeParse({ unexpected: true }).success).toBe(false);
  });

  it("[edge] le righe non valide dentro un payload valido vengono contate", () => {
    const result = parseFlowEvents({ data: [valid, { cmd: "sprint" }, 42] });
    expect(result.events).toHaveLength(1);
    expect(result.invalidCount).toBe(2);
  });

  it("[regression] il parsing non muta l'input", () => {
    const input = { ...valid };
    toFlowEvent(input);
    expect(input).toEqual(valid);
  });
});
