/**
 * Client HTTP tipizzato del boilerplate (fetch nativo: web, SSR, WebView Android).
 *
 * Responsabilità:
 * - costruzione URL e query string;
 * - header standard di piattaforma (tenant, lingua, correlazione);
 * - timeout con AbortController;
 * - retry con backoff esponenziale sugli errori transitori (rete, 408, 429, 5xx);
 * - normalizzazione di OGNI errore in `AppError`;
 * - lettura dell'envelope `{ data, success, message, meta }`.
 *
 * Non contiene logica di dominio: gli endpoint sono descritti in `src/domain`.
 */
import { env } from "../config/env";
import { createAppError, httpError, normalizeError, type AppError } from "../errors/AppError";
import { getApiContext, newRequestId } from "./context";
import type { ApiMeta, ApiResponse, ApiResult, Paginated, RequestOptions } from "./types";

const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const BASE_BACKOFF_MS = 150;

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = env.apiBaseUrl.replace(/\/$/, "");
  const url = `${base}/${path.replace(/^\//, "")}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function isRetryable(error: AppError): boolean {
  if (error.kind === "network" || error.kind === "timeout") return true;
  return RETRY_STATUS.has(error.status);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readError(response: Response, requestId: string): Promise<AppError> {
  let message = `HTTP ${response.status}`;
  try {
    const payload = (await response.json()) as { message?: string; code?: string } | null;
    if (payload?.message) message = payload.message;
  } catch {
    // corpo non JSON: resta il messaggio di default
  }
  return httpError(response.status, message, { requestId, url: response.url });
}

async function once<T>(options: RequestOptions, requestId: string): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);
  const { tenant, locale } = getApiContext();

  // Il segnale del chiamante (React Query) annulla anche il nostro timeout.
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(buildUrl(options.path, options.query), {
      method: options.method ?? "GET",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "accept-language": locale,
        "x-tenant": tenant,
        "x-request-id": requestId,
        ...options.headers,
      },
      body: options.body === undefined ? null : JSON.stringify(options.body),
      signal: controller.signal,
    });

    if (!response.ok) throw await readError(response, requestId);

    const payload = (await response.json()) as ApiResponse<T> | T;
    const envelope = payload as ApiResponse<T>;
    const hasEnvelope =
      typeof payload === "object" && payload !== null && "data" in (payload as object);

    if (hasEnvelope && envelope.success === false) {
      throw createAppError("server", envelope.message ?? "Risposta non valida", {
        code: "api.unsuccessful",
        status: 500,
        context: { requestId, path: options.path },
      });
    }

    const meta: ApiMeta = { requestId, ...(hasEnvelope ? (envelope.meta ?? {}) : {}) };
    return {
      data: hasEnvelope ? envelope.data : (payload as T),
      source: "network",
      meta,
    };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Esegue la richiesta con retry/backoff. Lancia sempre `AppError`.
 * `fallback` (opzionale) è la rete di sicurezza demo: se tutti i tentativi
 * falliscono il chiamante riceve dati coerenti invece di una schermata vuota.
 */
export async function apiRequest<T>(options: RequestOptions, fallback?: T): Promise<ApiResult<T>> {
  const requestId = newRequestId();
  const attempts = Math.max(0, options.retries ?? 2);
  let lastError: AppError = createAppError("unknown", "Nessun tentativo eseguito");

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await once<T>(options, requestId);
    } catch (error) {
      lastError = normalizeError(error);
      // L'annullamento esplicito del chiamante non è un errore da ritentare.
      if (options.signal?.aborted) break;
      if (attempt === attempts || !isRetryable(lastError)) break;
      await wait(BASE_BACKOFF_MS * 2 ** attempt);
    }
  }

  if (fallback !== undefined) {
    return { data: fallback, source: "fallback", meta: { requestId, error: lastError.code } };
  }
  throw lastError;
}

/** GET di una singola risorsa. */
export function apiGet<T>(
  path: string,
  query?: RequestOptions["query"],
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  return apiRequest<T>({ path, ...(query ? { query } : {}), ...(signal ? { signal } : {}) });
}

/**
 * GET di una collection paginata lato server.
 * Il client non taglia nulla: `page`/`pageSize` viaggiano nella query string e
 * la risposta contiene già `items`, `total` e `pageCount`.
 */
export async function apiList<T>(
  path: string,
  query?: RequestOptions["query"],
  signal?: AbortSignal,
): Promise<ApiResult<Paginated<T>>> {
  return apiGet<Paginated<T>>(path, query, signal);
}
