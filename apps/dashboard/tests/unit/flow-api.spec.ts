/**
 * Backend reale su events.jsonl (storia C, slice 1 sola lettura).
 *
 * `resolveEventsFile` è pura e iniettabile (env + dir di partenza): niente
 * mock del filesystem, si usa l'albero fixture `fixtures/fakerepo/`.
 * `handleFlowApiRequest` si testa end-to-end in-memory puntando
 * XPFLOW_EVENTS_FILE alla fixture (vi.stubEnv).
 */
import os from "node:os";
import path from "node:path";

import { handleFlowApiRequest, resolveEventsFile } from "@/lib/flow-api";

// vitest esegue dalla dir del package (apps/dashboard): path fixture stabile.
const fakeRepo = path.resolve(process.cwd(), "tests/unit/fixtures/fakerepo");
const fixtureLog = path.join(fakeRepo, ".xpflow", "events.jsonl");

describe("resolveEventsFile", () => {
  it("XPFLOW_EVENTS_FILE vince sempre sul default", () => {
    const explicit = "/tmp/altrove/events.jsonl";
    expect(resolveEventsFile({ XPFLOW_EVENTS_FILE: explicit }, fakeRepo)).toBe(explicit);
  });

  it("risale le directory dalla cwd fino a trovare .xpflow/events.jsonl", () => {
    const startDir = path.join(fakeRepo, "apps", "dashboard");
    expect(resolveEventsFile({}, startDir)).toBe(fixtureLog);
  });

  it("senza log negli antenati usa il default sotto la dir di partenza", () => {
    const startDir = os.tmpdir();
    expect(resolveEventsFile({}, startDir)).toBe(path.join(startDir, ".xpflow", "events.jsonl"));
  });
});

describe("handleFlowApiRequest sul log reale (fixture)", () => {
  beforeEach(() => {
    vi.stubEnv("XPFLOW_EVENTS_FILE", fixtureLog);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("summary: envelope di successo e righe corrotte conteggiate", async () => {
    const res = await handleFlowApiRequest(new Request("http://localhost/api/flow/summary"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.meta.discardedRows).toBe(1);
  });

  it("events: filtra per cmd e pagina i risultati", async () => {
    const res = await handleFlowApiRequest(
      new Request("http://localhost/api/flow/events?cmd=sprint"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(2);
  });

  it("events: 400 su parametro page non valido", async () => {
    const res = await handleFlowApiRequest(
      new Request("http://localhost/api/flow/events?page=abc"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("risorsa sconosciuta: 404", async () => {
    const res = await handleFlowApiRequest(new Request("http://localhost/api/flow/inesistente"));
    expect(res.status).toBe(404);
  });

  it("file assente: empty state senza errore, mai un 500", async () => {
    vi.stubEnv("XPFLOW_EVENTS_FILE", path.join(os.tmpdir(), "xpflow-inesistente.jsonl"));
    const res = await handleFlowApiRequest(new Request("http://localhost/api/flow/summary"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.meta.discardedRows).toBe(0);
  });
});
