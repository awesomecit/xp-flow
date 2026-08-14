import { describe, expect, it } from "vitest";

import { filterNav, type NavItem } from "@/navigation/registry";

const items: NavItem[] = [
  { id: "home", path: "/", labelKey: "common.appName", primary: true },
  {
    id: "billing",
    path: "/billing",
    labelKey: "common.save",
    permissions: ["settings.manage"],
    flag: "billing",
  },
  {
    id: "admin",
    path: "/admin",
    labelKey: "common.cancel",
    permissions: ["tenant.admin"],
    formFactors: ["desktop"],
  },
];

const ctx = (over: Partial<Parameters<typeof filterNav>[1]> = {}) => ({
  can: () => true,
  isEnabled: () => true,
  formFactor: "desktop" as const,
  ...over,
});

describe("navigation filterNav", () => {
  it("[positive] mostra tutte le voci se permessi, flag e form factor combaciano", () => {
    expect(filterNav(items, ctx()).map((i) => i.id)).toEqual(["home", "billing", "admin"]);
  });

  it("[negative] nasconde le voci senza permesso", () => {
    const visible = filterNav(items, ctx({ can: (p) => p === "settings.manage" }));
    expect(visible.map((i) => i.id)).toEqual(["home", "billing"]);
  });

  it("[negative] nasconde le voci con feature flag spento", () => {
    const visible = filterNav(items, ctx({ isEnabled: () => false }));
    expect(visible.map((i) => i.id)).toEqual(["home", "admin"]);
  });

  it("[edge] su phone cade la voce desktop-only", () => {
    const visible = filterNav(items, ctx({ formFactor: "phone" }));
    expect(visible.map((i) => i.id)).toEqual(["home", "billing"]);
  });

  it("[edge] un registry vuoto restituisce lista vuota", () => {
    expect(filterNav([], ctx())).toEqual([]);
  });

  it("[regression] filterNav non muta il registry originale", () => {
    const before = items.length;
    filterNav(items, ctx({ can: () => false }));
    expect(items).toHaveLength(before);
  });
});
