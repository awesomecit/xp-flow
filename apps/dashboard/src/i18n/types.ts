/**
 * i18n contract.
 *
 * The base catalog (it) is the single source of truth for the shape of the
 * message tree. Every other locale must match it exactly (`Messages`), while
 * tenant overrides are partial by design (`MessagesOverride`).
 */

export const LOCALES = ["it", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "it";

export const TENANTS = ["default", "acme", "globex"] as const;
export type TenantId = (typeof TENANTS)[number];
export const DEFAULT_TENANT: TenantId = "default";

/** Recursive message tree: leaves are strings (optionally with {placeholders}). */
export type MessageTree = { [key: string]: string | MessageTree };

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** Dot-notation keys derived from the base catalog, e.g. "common.appName". */
export type PathsOf<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${PathsOf<T[K]>}`;
}[keyof T & string];

export type TranslateParams = Record<string, string | number>;
