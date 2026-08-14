import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { server } from "@/mocks/node";
import { fetchFlowEvents, fetchFlowSummary } from "@/domain/api";
import { isAppError } from "@/errors/AppError";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("risorse REST /api/flow via MSW", () => {
  it("[positive] la fetch reale restituisce eventi paginati validati", async () => {
    const snapshot = await fetchFlowEvents("default", { page: 1, pageSize: 10 });
    expect(snapshot.data.items.length).toBeGreaterThan(0);
    expect(snapshot.source).toBe("network");
  });

  it("[positive] lo scenario healthy non contiene blocchi né escalation", async () => {
    const snapshot = await fetchFlowEvents("healthy", { page: 1, pageSize: 50 });
    expect(snapshot.data.items.some((e) => e.esito === "bloccato")).toBe(false);
    expect(snapshot.data.items.some((e) => e.esito === "escalation")).toBe(false);
  });

  it("[edge] le righe malformate del log vengono contate in meta.discardedRows", async () => {
    const snapshot = await fetchFlowEvents("default", { page: 1, pageSize: 10 });
    expect(snapshot.meta.discardedRows ?? 0).toBeGreaterThan(0);
  });

  it("[negative] un 500 del backend diventa un AppError di tipo server", async () => {
    await expect(fetchFlowEvents("error", {})).rejects.toSatisfy(
      (e: unknown) => isAppError(e) && e.kind === "server",
    );
  });

  it("[negative] un payload fuori contratto è un errore distinto dalla rete", async () => {
    await expect(fetchFlowEvents("contract", {})).rejects.toSatisfy(
      (e: unknown) => isAppError(e) && e.kind === "validation" && e.code === "contract.invalid",
    );
  });

  it("[regression] lo scenario no-sprint non ha sprint in corso", async () => {
    const snapshot = await fetchFlowSummary("no-sprint");
    expect(snapshot.data.activeSprint).toBeNull();
  });
});
