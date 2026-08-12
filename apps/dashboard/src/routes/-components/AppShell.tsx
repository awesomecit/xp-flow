import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAuth } from "../../auth/AuthProvider";
import { useFeatureFlags } from "../../features/FeatureFlagProvider";
import { useT } from "../../i18n/I18nProvider";
import { filterNav, navRegistry } from "../../navigation/registry";
import { usePlatform } from "../../platform/usePlatform";
import { Icon, LabelCaps } from "./ui";

const NAV_ICONS: Record<string, string> = {
  dashboard: "dashboard",
  timeline: "history",
  pipeline: "account_tree",
  retro: "analytics",
};

/**
 * Chrome dell'app: navigation drawer + top bar su desktop-tablet,
 * top bar compatta + bottom-nav sul phone. Voci dal navigation registry.
 */
export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  const { can, formFactor } = { ...useAuth(), ...usePlatform() };
  const { isEnabled } = useFeatureFlags();
  const items = filterNav(navRegistry, { can, isEnabled, formFactor });
  const isPhone = formFactor === "phone";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isPhone && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-outline/60 bg-surface px-4 py-6 lg:flex">
          <div className="mb-8 flex items-center gap-2 px-2">
            <Icon name="terminal" size={20} className="text-primary" />
            <span className="text-lg font-bold tracking-tight">XP Flow</span>
          </div>
          <nav aria-label="Navigazione principale" className="flex-1">
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    activeOptions={{ exact: item.path === "/" }}
                    activeProps={{
                      "aria-current": "page",
                      className:
                        "flex items-center gap-3 rounded-md bg-surface-variant px-3 py-2 text-sm font-semibold text-foreground",
                    }}
                    inactiveProps={{
                      className:
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-variant hover:text-foreground",
                    }}
                  >
                    <Icon name={NAV_ICONS[item.id] ?? "circle"} size={20} />
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex items-center gap-2 border-t border-outline/40 pt-4">
            <span className="size-2 animate-pulse rounded-full bg-ok" />
            <LabelCaps>System online</LabelCaps>
          </div>
        </aside>
      )}

      <div className={isPhone ? "" : "lg:pl-[240px]"}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-outline/60 bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Icon name="terminal" size={20} className="text-primary lg:hidden" />
            <span className="text-base font-bold tracking-tight lg:hidden">XP Flow</span>
            <span className="hidden lg:inline">
              <LabelCaps className="text-foreground">{title}</LabelCaps>
            </span>
            <span className="ml-2 border-l border-outline/60 pl-2 lg:hidden">
              <LabelCaps>{title}</LabelCaps>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isPhone && (
              <nav aria-label="Sezioni" className="hidden gap-4 md:flex lg:hidden">
                <ul className="flex gap-4">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        activeOptions={{ exact: item.path === "/" }}
                        activeProps={{ "aria-current": "page", className: "text-foreground" }}
                        inactiveProps={{ className: "text-muted-foreground" }}
                      >
                        <LabelCaps>{t(item.labelKey)}</LabelCaps>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </header>

        <main className={`p-4 sm:p-6 ${isPhone ? "pb-24" : ""}`}>
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>
      </div>

      {isPhone && (
        <nav
          aria-label="Navigazione principale"
          data-testid="bottom-nav"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-outline/60 bg-surface"
        >
          <ul className="flex">
            {items
              .filter((item) => item.primary)
              .map((item) => (
                <li key={item.id} className="flex-1">
                  <Link
                    to={item.path}
                    activeOptions={{ exact: item.path === "/" }}
                    activeProps={{
                      "aria-current": "page",
                      className:
                        "flex flex-col items-center gap-1 py-3 text-foreground border-t-2 border-primary -mt-px",
                    }}
                    inactiveProps={{
                      className: "flex flex-col items-center gap-1 py-3 text-muted-foreground",
                    }}
                  >
                    <Icon name={NAV_ICONS[item.id] ?? "circle"} size={22} />
                    <LabelCaps>{t(item.labelKey)}</LabelCaps>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
