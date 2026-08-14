import type { FlagMap } from "../features/FeatureFlagProvider";
import type { Locale, TenantId } from "../i18n/types";

/**
 * Configurazione per tenant: white-label senza fork di codice.
 * Le traduzioni per tenant vivono in src/i18n/catalogs/tenants.ts,
 * qui stanno branding, locale di default e feature attive.
 */
export type TenantConfig = {
  id: TenantId;
  /** Host usati per risolvere il tenant lato server. */
  hosts: string[];
  defaultLocale: Locale;
  supportedLocales: Locale[];
  flags: Partial<FlagMap>;
  branding: {
    logoUrl: string | null;
    /** Token tema: applicato in seguito, oggi nessuno stile. */
    themeId: string;
  };
};

export const tenantRegistry: Record<TenantId, TenantConfig> = {
  default: {
    id: "default",
    hosts: [],
    defaultLocale: "it",
    supportedLocales: ["it", "en"],
    flags: {},
    branding: { logoUrl: null, themeId: "base" },
  },
  acme: {
    id: "acme",
    hosts: ["acme.example.com"],
    defaultLocale: "en",
    supportedLocales: ["it", "en"],
    flags: { billing: true, betaUi: true },
    branding: { logoUrl: null, themeId: "acme" },
  },
  globex: {
    id: "globex",
    hosts: ["globex.example.com"],
    defaultLocale: "it",
    supportedLocales: ["it"],
    flags: { analytics: false },
    branding: { logoUrl: null, themeId: "globex" },
  },
};

export function resolveTenantByHost(host: string | undefined): TenantConfig {
  if (!host) return tenantRegistry.default;
  const match = Object.values(tenantRegistry).find((t) => t.hosts.includes(host));
  return match ?? tenantRegistry.default;
}
