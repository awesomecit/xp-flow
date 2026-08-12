/**
 * Modalità investigazione: ispezione dello stato dalla console del browser.
 *
 * Attivazione (persistente su localStorage):
 *   ?debug=1  oppure  window.__APP__.enable()
 * Disattivazione: window.__APP__.disable()
 *
 * API console (namespace unico `window.__APP__`):
 *   __APP__.state()            snapshot di tutte le sorgenti registrate
 *   __APP__.state("i18n")      snapshot di una sola sorgente
 *   __APP__.sources()          elenco sorgenti registrate
 *   __APP__.cache()            chiavi/stato della cache TanStack Query
 *   __APP__.log()              ultimi eventi tracciati (ring buffer)
 *   __APP__.clear()            svuota il buffer eventi
 *   __APP__.enable()/.disable()
 */
export type DebugSnapshot = Record<string, unknown>;
export type DebugSource = () => DebugSnapshot;

const sources = new Map<string, DebugSource>();
const RING_SIZE = 200;
const events: Array<{ ts: string; type: string; payload: unknown }> = [];

const STORAGE_KEY = "app.debug";

export function isDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("debug") === "1") return true;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Registra una sorgente di stato; ritorna la funzione di deregistrazione. */
export function registerDebugSource(name: string, source: DebugSource): () => void {
  sources.set(name, source);
  return () => sources.delete(name);
}

export function snapshot(name?: string): DebugSnapshot {
  if (name) return sources.get(name)?.() ?? { error: `source "${name}" not registered` };
  const out: DebugSnapshot = {};
  for (const [key, fn] of sources) {
    try {
      out[key] = fn();
    } catch (error) {
      out[key] = { error: String(error) };
    }
  }
  return out;
}

/** Traccia un evento nel ring buffer; stampa in console solo se debug attivo. */
export function debugLog(type: string, payload?: unknown): void {
  events.push({ ts: new Date().toISOString(), type, payload });
  if (events.length > RING_SIZE) events.shift();
  if (isDebugEnabled() && typeof console !== "undefined") {
    console.debug(`[app:${type}]`, payload);
  }
}

type QueryCacheLike = {
  getAll: () => Array<{
    queryKey: unknown;
    state: { status: string; dataUpdatedAt: number; error: unknown; fetchStatus: string };
  }>;
};

let queryCacheRef: QueryCacheLike | null = null;
export function attachQueryCache(cache: QueryCacheLike): void {
  queryCacheRef = cache;
}

function cacheSnapshot() {
  if (!queryCacheRef) return [];
  return queryCacheRef.getAll().map((q) => ({
    key: q.queryKey,
    status: q.state.status,
    fetchStatus: q.state.fetchStatus,
    updatedAt: new Date(q.state.dataUpdatedAt).toISOString(),
    error: q.state.error ? String(q.state.error) : null,
  }));
}

/** Installa `window.__APP__`. Idempotente, no-op in SSR. */
export function installDebugConsole(): void {
  if (typeof window === "undefined") return;
  const api = {
    version: 1,
    state: snapshot,
    sources: () => [...sources.keys()],
    cache: cacheSnapshot,
    log: () => [...events],
    clear: () => {
      events.length = 0;
    },
    enable: () => {
      window.localStorage.setItem(STORAGE_KEY, "1");
      return "debug ON";
    },
    disable: () => {
      window.localStorage.removeItem(STORAGE_KEY);
      return "debug OFF";
    },
    enabled: isDebugEnabled,
  };
  (window as unknown as Record<string, unknown>)["__APP__"] = api;
}
