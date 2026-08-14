import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { interpolate, lookup, resolveCatalog } from "./resolve";
import type { Messages } from "./catalogs/base.it";
import {
  DEFAULT_LOCALE,
  DEFAULT_TENANT,
  type Locale,
  type PathsOf,
  type TenantId,
  type TranslateParams,
} from "./types";

export type MessageKey = PathsOf<Messages>;

type I18nContextValue = {
  locale: Locale;
  tenant: TenantId;
  setLocale: (locale: Locale) => void;
  setTenant: (tenant: TenantId) => void;
  t: (key: MessageKey, params?: TranslateParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  initialTenant = DEFAULT_TENANT,
}: {
  children: ReactNode;
  initialLocale?: Locale;
  initialTenant?: TenantId;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [tenant, setTenant] = useState<TenantId>(initialTenant);

  const value = useMemo<I18nContextValue>(() => {
    const catalog = resolveCatalog(locale, tenant);
    return {
      locale,
      tenant,
      setLocale,
      setTenant,
      t: (key, params) => interpolate(lookup(catalog, key) ?? key, params),
    };
  }, [locale, tenant]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
