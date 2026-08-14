/**
 * Modello d'errore unico dell'applicazione.
 *
 * Qualunque errore (fetch, HTTP, throw applicativo, errore sconosciuto) viene
 * normalizzato in `AppError` prima di essere loggato, notificato o mostrato.
 * I componenti non ispezionano mai `unknown`.
 */
export type ErrorKind =
  | "network" // rete assente / DNS / CORS
  | "timeout" // AbortController scaduto
  | "auth" // 401 / 403
  | "notFound" // 404
  | "validation" // 422 / input non valido
  | "server" // 5xx
  | "unknown";

export type AppError = {
  kind: ErrorKind;
  /** Codice stabile usato come chiave i18n: `errors.<code>`. */
  code: string;
  /** Messaggio tecnico, per log e debug console. Mai mostrato grezzo all'utente. */
  message: string;
  status: number;
  cause?: unknown;
  context?: Record<string, unknown>;
};

export function createAppError(
  kind: ErrorKind,
  message: string,
  extra: Partial<AppError> = {},
): AppError {
  return { kind, code: extra.code ?? kind, message, status: extra.status ?? 0, ...extra };
}

function kindFromStatus(status: number): ErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "notFound";
  if (status === 422 || status === 400) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

export function httpError(
  status: number,
  message?: string,
  context?: Record<string, unknown>,
): AppError {
  const kind = kindFromStatus(status);
  const base: AppError = {
    kind,
    code: `http.${status}`,
    message: message ?? `HTTP ${status}`,
    status,
  };
  return context ? { ...base, context } : base;
}

/** Punto unico di conversione da `unknown` ad `AppError`. */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof DOMException && error.name === "AbortError") {
    return createAppError("timeout", "Request aborted / timeout", {
      code: "timeout",
      cause: error,
    });
  }

  if (error instanceof TypeError) {
    return createAppError("network", error.message, { code: "network", cause: error });
  }

  if (error instanceof Error) {
    const match = /HTTP (\d{3})/.exec(error.message);
    if (match) return { ...httpError(Number(match[1]), error.message), cause: error };
    return createAppError("unknown", error.message, { cause: error });
  }

  return createAppError("unknown", String(error), { cause: error });
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    "code" in value &&
    "status" in value
  );
}

/** Chiave i18n suggerita per il messaggio utente; il fallback è `errors.unknown`. */
export function errorMessageKey(error: AppError): string {
  return `errors.${error.kind}`;
}
