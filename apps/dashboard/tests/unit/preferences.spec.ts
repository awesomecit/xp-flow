import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { preferencesKey } from "@/app/PreferencesProvider";
import { usePersistedState } from "@/state/usePersistedState";

describe("preferenze persistite", () => {
  beforeEach(() => window.localStorage.clear());

  it("[positive] scrive e rilegge il valore dallo storage", () => {
    const key = preferencesKey("default");
    const { result } = renderHook(() => usePersistedState(key, { locale: "it", theme: "dark" }));
    act(() => result.current[1]({ locale: "en", theme: "light" }));
    expect(JSON.parse(window.localStorage.getItem(key) ?? "{}")).toEqual({
      locale: "en",
      theme: "light",
    });
  });

  it("[positive] la chiave è namespaced per tenant", () => {
    expect(preferencesKey("default")).not.toBe(preferencesKey("acme"));
  });

  it("[edge] il primo render usa i default (SSR-safe), poi idrata dallo storage", () => {
    const key = preferencesKey("default");
    window.localStorage.setItem(key, JSON.stringify({ locale: "en", theme: "light" }));
    const { result } = renderHook(() => usePersistedState(key, { locale: "it", theme: "dark" }));
    expect(result.current[0]).toEqual({ locale: "en", theme: "light" });
  });

  it("[negative] un valore corrotto nello storage non fa crashare l'app", () => {
    const key = preferencesKey("default");
    window.localStorage.setItem(key, "{non-json");
    const { result } = renderHook(() => usePersistedState(key, { locale: "it", theme: "dark" }));
    expect(result.current[0]).toEqual({ locale: "it", theme: "dark" });
  });

  it("[regression] chiavi diverse non si sovrascrivono", () => {
    const { result: a } = renderHook(() => usePersistedState("xp.timeline.cmd", "all"));
    const { result: b } = renderHook(() => usePersistedState("xp.timeline.esito", "all"));
    act(() => a.current[1]("sprint"));
    expect(b.current[0]).toBe("all");
    expect(window.localStorage.getItem("xp.timeline.esito")).toBeNull();
  });
});
