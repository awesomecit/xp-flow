import type { DeepPartial, Locale, TenantId } from "../types";
import type { Messages } from "./base.it";

/**
 * Tenant overrides are partial: a tenant declares only the keys it changes,
 * per locale. Anything missing falls back to the base catalog.
 */
export type TenantOverrides = Partial<Record<Locale, DeepPartial<Messages>>>;

export const tenantOverrides: Record<TenantId, TenantOverrides> = {
  default: {},
  acme: {
    it: { common: { appName: "ACME Suite" } },
    en: { common: { appName: "ACME Suite" } },
  },
  globex: {
    it: { common: { appName: "Globex Portal", greeting: "Buongiorno {name}" } },
    en: { common: { appName: "Globex Portal", greeting: "Good morning {name}" } },
  },
};
