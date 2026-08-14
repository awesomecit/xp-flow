import type { ReactNode } from "react";

import { AuthProvider } from "../auth/AuthProvider";
import { FeatureFlagProvider } from "../features/FeatureFlagProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import { PreferencesProvider } from "./PreferencesProvider";
import { MockGate } from "./MockGate";
import { env } from "../config/env";
import { tenantRegistry, type TenantConfig } from "../tenant/registry";
import type { TenantId } from "../i18n/types";

function resolveInitialTenant(tenantId?: TenantId): TenantConfig {
  if (tenantId) return tenantRegistry[tenantId];
  return tenantRegistry[env.defaultTenant as TenantId] ?? tenantRegistry.default;
}

/**
 * Composizione unica dei provider applicativi.
 * Ordine: tenant (config) -> feature flags -> i18n -> preferenze -> auth
 * -> mock gate (in demo mode monta l'app solo a worker MSW pronto).
 * Il tenant può essere risolto lato server (host/sessione) e passato qui.
 */
export function AppProviders({ children, tenantId }: { children: ReactNode; tenantId?: TenantId }) {
  const tenant = resolveInitialTenant(tenantId);

  return (
    <FeatureFlagProvider initialFlags={tenant.flags}>
      <I18nProvider initialLocale={tenant.defaultLocale} initialTenant={tenant.id}>
        <PreferencesProvider>
          <AuthProvider>
            <MockGate>{children}</MockGate>
          </AuthProvider>
        </PreferencesProvider>
      </I18nProvider>
    </FeatureFlagProvider>
  );
}
