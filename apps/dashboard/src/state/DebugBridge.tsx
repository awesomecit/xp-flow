import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthProvider";
import { useFeatureFlags } from "../features/FeatureFlagProvider";
import { useI18n } from "../i18n/I18nProvider";
import { usePlatform } from "../platform/usePlatform";
import { attachQueryCache, debugLog, installDebugConsole, registerDebugSource } from "./debug";

/**
 * Collega lo stato globale live alla console di investigazione (`window.__APP__`).
 * Non renderizza nulla e non ha effetti in SSR.
 */
export function DebugBridge() {
  const i18n = useI18n();
  const auth = useAuth();
  const flags = useFeatureFlags();
  const platform = usePlatform();
  const queryClient = useQueryClient();

  useEffect(() => {
    installDebugConsole();
    attachQueryCache(queryClient.getQueryCache());
    debugLog("app:mounted");
  }, [queryClient]);

  useEffect(
    () => registerDebugSource("i18n", () => ({ locale: i18n.locale, tenant: i18n.tenant })),
    [i18n],
  );
  useEffect(
    () =>
      registerDebugSource("auth", () => ({
        session: auth.session,
        isAuthenticated: auth.isAuthenticated,
      })),
    [auth],
  );
  useEffect(() => registerDebugSource("flags", () => ({ ...flags.flags })), [flags]);
  useEffect(
    () =>
      registerDebugSource("platform", () => ({
        target: platform.target,
        formFactor: platform.formFactor,
      })),
    [platform],
  );

  return null;
}
