import { createFileRoute } from "@tanstack/react-router";

import { usePreferences } from "../app/PreferencesProvider";
import { env } from "../config/env";
import { useFeatureFlags } from "../features/FeatureFlagProvider";
import { useI18n, useT } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/types";
import { usePlatform } from "../platform/usePlatform";
import { tenantRegistry } from "../tenant/registry";
import { AppShell } from "./-components/AppShell";
import { Chip, LabelCaps, Panel } from "./-components/ui";

export const Route = createFileRoute("/impostazioni")({
  head: () => ({
    meta: [
      { title: "Impostazioni — XP Flow Monitor" },
      {
        name: "description",
        content:
          "Preferenze locali del cruscotto: lingua, tema, tenant e pannello diagnostico con piattaforma e feature attive.",
      },
      { property: "og:title", content: "Impostazioni — XP Flow Monitor" },
      {
        property: "og:description",
        content: "Lingua, tema e diagnostica del cruscotto XP Flow Monitor.",
      },
    ],
  }),
  component: SettingsPage,
});

const SELECT_CLASS =
  "rounded-sm border border-outline/60 bg-background px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline/20 py-3 last:border-0">
      <LabelCaps>{label}</LabelCaps>
      {children}
    </div>
  );
}

function SettingsPage() {
  const t = useT();
  const { locale, tenant } = useI18n();
  const { theme, setLocale, setTheme } = usePreferences();
  const { flags } = useFeatureFlags();
  const { formFactor, target } = usePlatform();

  const tenantConfig = tenantRegistry[tenant];
  const activeFlags = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  return (
    <AppShell title={t("xp.settingsTitle")}>
      <div className="flex flex-col gap-3" data-testid="settings">
        <Panel title={t("xp.settingsPreferences")} icon="tune">
          <Row label={t("xp.settingsLanguage")}>
            <select
              aria-label={t("xp.settingsLanguage")}
              className={SELECT_CLASS}
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              {tenantConfig.supportedLocales.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Row>
          <Row label={t("xp.settingsTheme")}>
            <select
              aria-label={t("xp.settingsTheme")}
              className={SELECT_CLASS}
              value={theme}
              onChange={(e) => setTheme(e.target.value === "light" ? "light" : "dark")}
            >
              <option value="dark">{t("xp.settingsThemeDark")}</option>
              <option value="light">{t("xp.settingsThemeLight")}</option>
            </select>
          </Row>
          <Row label={t("xp.settingsTenant")}>
            <Chip>{tenant}</Chip>
          </Row>
        </Panel>

        <Panel title={t("xp.settingsDiagnostics")} icon="bug_report">
          <Row label={t("xp.settingsPlatform")}>
            <Chip>{`${target} / ${formFactor}`}</Chip>
          </Row>
          <Row label={t("xp.settingsDemoMode")}>
            <Chip>{env.demoMode ? "on" : "off"}</Chip>
          </Row>
          <Row label={t("xp.settingsFlags")}>
            <span className="flex flex-wrap gap-1">
              {activeFlags.length === 0 ? (
                <Chip>—</Chip>
              ) : (
                activeFlags.map((flag) => <Chip key={flag}>{flag}</Chip>)
              )}
            </span>
          </Row>
          <p className="pt-3 font-mono text-xs text-muted-foreground">
            {t("xp.settingsDebugHint")}
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
