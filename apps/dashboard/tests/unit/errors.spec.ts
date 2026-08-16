import { describe, expect, it, vi } from "vitest";

import { errorMessageKey, httpError, isAppError, normalizeError } from "../../src/errors/AppError";
import { setNotifier, notifyError, userMessage } from "../../src/errors/notify";
import { debugLog, registerDebugSource, snapshot } from "../../src/state/debug";

describe("AppError @positive", () => {
  it("mappa gli stati HTTP sul kind corretto", () => {
    expect(httpError(401).kind).toBe("auth");
    expect(httpError(404).kind).toBe("notFound");
    expect(httpError(422).kind).toBe("validation");
    expect(httpError(503).kind).toBe("server");
  });

  it("normalizza un Error con codice HTTP nel messaggio", () => {
    const err = normalizeError(new Error("HTTP 500"));
    expect(err.status).toBe(500);
    expect(err.kind).toBe("server");
  });
});

describe("AppError @negative", () => {
  it("classifica TypeError come errore di rete", () => {
    expect(normalizeError(new TypeError("Failed to fetch")).kind).toBe("network");
  });

  it("classifica AbortError come timeout", () => {
    expect(normalizeError(new DOMException("aborted", "AbortError")).kind).toBe("timeout");
  });
});

describe("AppError @edge", () => {
  it("gestisce valori non-Error", () => {
    const err = normalizeError("boom");
    expect(err.kind).toBe("unknown");
    expect(err.message).toBe("boom");
  });

  it("è idempotente su un AppError già normalizzato", () => {
    const once = normalizeError(new Error("x"));
    expect(normalizeError(once)).toBe(once);
    expect(isAppError(once)).toBe(true);
  });
});

describe("Errori @regression", () => {
  it("ogni kind ha un messaggio utente e una chiave i18n", () => {
    for (const status of [401, 404, 422, 500]) {
      const err = httpError(status);
      expect(userMessage(err).length).toBeGreaterThan(0);
      expect(errorMessageKey(err)).toBe(`errors.${err.kind}`);
    }
  });

  it("il notifier è sostituibile e riceve un AppError normalizzato", () => {
    const spy = vi.fn();
    setNotifier(spy);
    notifyError(new Error("HTTP 404"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0].kind).toBe("notFound");
  });
});

describe("Debug console @positive", () => {
  it("registra e legge una sorgente di stato", () => {
    const off = registerDebugSource("test", () => ({ a: 1 }));
    expect(snapshot("test")).toEqual({ a: 1 });
    expect(snapshot()).toHaveProperty("test");
    off();
    expect(snapshot("test")).toHaveProperty("error");
  });

  it("il ring buffer non esplode e le sorgenti che lanciano non rompono lo snapshot", () => {
    const off = registerDebugSource("bad", () => {
      throw new Error("nope");
    });
    for (let i = 0; i < 250; i += 1) debugLog("noise", i);
    expect(snapshot()["bad"]).toHaveProperty("error");
    off();
  });
});
