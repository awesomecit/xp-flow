import { QueryCache, MutationCache, QueryClient } from "@tanstack/react-query";

import { normalizeError } from "../errors/AppError";
import { notifyError } from "../errors/notify";
import { debugLog } from "./debug";

/**
 * Cache server-state condivisa (TanStack Query).
 *
 * Convenzioni:
 * - `staleTime` 30s: le query non rifanno fetch a ogni mount/navigazione.
 * - `gcTime` 5min: i dati restano in cache anche senza observer attivi.
 * - retry 1 sola volta, mai su errori 4xx (vedi `shouldRetry`).
 * - ogni errore passa da `normalizeError` e viene notificato una volta sola,
 *   a livello di cache, non nei singoli componenti.
 */
export const QUERY_DEFAULTS = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
} as const;

function shouldRetry(failureCount: number, error: unknown): boolean {
  const app = normalizeError(error);
  if (app.status >= 400 && app.status < 500) return false;
  return failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { ...QUERY_DEFAULTS, retry: shouldRetry },
      mutations: { retry: 0 },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        const app = normalizeError(error);
        debugLog("query:error", { key: query.queryKey, error: app });
        notifyError(app);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        const app = normalizeError(error);
        debugLog("mutation:error", { key: mutation.options.mutationKey, error: app });
        notifyError(app);
      },
    }),
  });
}

/** Chiavi query centralizzate: nessuna stringa libera nei componenti. */
export const queryKeys = {
  all: ["app"] as const,
  session: () => [...queryKeys.all, "session"] as const,
  list: (resource: string, params?: Record<string, unknown>) =>
    [...queryKeys.all, resource, "list", params ?? {}] as const,
  detail: (resource: string, id: string) => [...queryKeys.all, resource, "detail", id] as const,
};
