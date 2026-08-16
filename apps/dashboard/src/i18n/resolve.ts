import { en } from "./catalogs/base.en";
import { it, type Messages } from "./catalogs/base.it";
import { tenantOverrides } from "./catalogs/tenants";
import {
  DEFAULT_LOCALE,
  type Locale,
  type MessageTree,
  type TenantId,
  type TranslateParams,
} from "./types";

const baseCatalogs: Record<Locale, Messages> = { it: it as unknown as Messages, en };

function deepMerge<T extends MessageTree>(base: T, patch: MessageTree | undefined): T {
  if (!patch) return base;
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = out[key];
    out[key] =
      typeof value === "object" && value !== null && typeof current === "object"
        ? deepMerge(current as MessageTree, value)
        : value;
  }
  return out as T;
}

const cache = new Map<string, Messages>();

/** Resolution order: base(DEFAULT_LOCALE) < base(locale) < tenant(locale). */
export function resolveCatalog(locale: Locale, tenant: TenantId): Messages {
  const cacheKey = `${locale}::${tenant}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const merged = deepMerge(
    deepMerge(
      baseCatalogs[DEFAULT_LOCALE] as unknown as MessageTree,
      baseCatalogs[locale] as unknown as MessageTree,
    ),
    tenantOverrides[tenant]?.[locale] as MessageTree | undefined,
  ) as unknown as Messages;

  cache.set(cacheKey, merged);
  return merged;
}

export function lookup(catalog: Messages, path: string): string | undefined {
  const value = path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        typeof acc === "object" && acc !== null ? (acc as MessageTree)[part] : undefined,
      catalog,
    );
  return typeof value === "string" ? value : undefined;
}

export function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
