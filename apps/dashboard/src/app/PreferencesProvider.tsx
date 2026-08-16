import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";

import { useI18n } from "../i18n/I18nProvider";
import { DEFAULT_LOCALE, type Locale, type TenantId } from "../i18n/types";
import { usePersistedState } from "../state/usePersistedState";

/**
 * Preferenze locali dell'utente (device-local, nessuna scrittura verso il backend:
 * la slice 1 è sola lettura). Persistite con `usePersistedState`, quindi SSR-safe:
 * il primo render usa i default e la lettura dello storage avviene dopo l'idratazione.
 *
 * Le chiavi sono namespaced per tenant: profili diversi non si sovrascrivono.
 */
export type Theme = "dark" | "light";

export type Preferences = {
  locale: Locale;
  theme: Theme;
};

const DEFAULT_PREFERENCES: Preferences = { locale: DEFAULT_LOCALE, theme: "dark" };

export function preferencesKey(tenant: TenantId): string {
  return `xp.prefs.${tenant}`;
}

type PreferencesContextValue = Preferences & {
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { tenant, locale, setLocale: applyLocale } = useI18n();
  const [prefs, setPrefs] = usePersistedState<Preferences>(
    preferencesKey(tenant),
    DEFAULT_PREFERENCES,
  );

  // La lingua persistita vince su quella di default del tenant.
  useEffect(() => {
    if (prefs.locale !== locale) applyLocale(prefs.locale);
  }, [prefs.locale, locale, applyLocale]);

  // Il tema è a token: basta la classe sull'elemento root.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", prefs.theme === "dark");
    root.dataset["theme"] = prefs.theme;
  }, [prefs.theme]);

  const setLocale = useCallback(
    (next: Locale) => setPrefs({ ...prefs, locale: next }),
    [prefs, setPrefs],
  );
  const setTheme = useCallback(
    (next: Theme) => setPrefs({ ...prefs, theme: next }),
    [prefs, setPrefs],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ ...prefs, setLocale, setTheme }),
    [prefs, setLocale, setTheme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return ctx;
}
