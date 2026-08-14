/**
 * Contesto di richiesta condiviso da tutte le chiamate HTTP.
 *
 * Non è React state: il client API è una funzione pura di modulo e non può
 * usare hook. I provider (i18n, tenant, preferenze) aggiornano qui i valori,
 * il client li legge al momento della richiesta e li invia come header
 * standard (`x-tenant`, `accept-language`, `x-request-id`).
 */
import { env } from "../config/env";

export type ApiContext = {
  tenant: string;
  locale: string;
};

let context: ApiContext = { tenant: env.defaultTenant, locale: "it" };

export function getApiContext(): ApiContext {
  return context;
}

export function setApiContext(patch: Partial<ApiContext>): void {
  context = { ...context, ...patch };
}

/** Id di correlazione per log e diagnostica (uno per richiesta). */
export function newRequestId(): string {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
