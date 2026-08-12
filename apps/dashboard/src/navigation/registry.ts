import type { FeatureFlag } from "../features/FeatureFlagProvider";
import type { Permission } from "../auth/roles";
import type { MessageKey } from "../i18n/I18nProvider";
import type { FormFactor } from "../platform/platform";

/**
 * Registro di navigazione dichiarativo: una sola definizione consumata da
 * sidebar desktop e bottom-nav mobile, filtrata per permessi, feature flag e
 * form factor. Niente menu duplicati per piattaforma.
 */
export type NavItem = {
  id: string;
  path: string;
  labelKey: MessageKey;
  /** Visibile solo se l'utente ha almeno uno di questi permessi (vuoto = sempre). */
  permissions?: Permission[];
  /** Visibile solo se la feature è attiva. */
  flag?: FeatureFlag;
  /** Form factor su cui mostrare la voce (default: tutti). */
  formFactors?: FormFactor[];
  /** Solo le prime N voci finiscono nella bottom-nav Android. */
  primary?: boolean;
};

export const navRegistry: NavItem[] = [
  { id: "dashboard", path: "/", labelKey: "xp.navDashboard", primary: true },
  { id: "timeline", path: "/timeline", labelKey: "xp.navTimeline", primary: true },
  {
    id: "pipeline",
    path: "/pipeline",
    labelKey: "xp.navPipeline",
    formFactors: ["tablet", "desktop"],
  },
  { id: "retro", path: "/retro", labelKey: "xp.navRetro", formFactors: ["tablet", "desktop"] },
  {
    id: "settings",
    path: "/impostazioni",
    labelKey: "xp.navSettings",
    formFactors: ["tablet", "desktop"],
  },
];

export function filterNav(
  items: NavItem[],
  ctx: {
    can: (permission: Permission) => boolean;
    isEnabled: (flag: FeatureFlag) => boolean;
    formFactor: FormFactor;
  },
): NavItem[] {
  return items.filter((item) => {
    if (item.flag && !ctx.isEnabled(item.flag)) return false;
    if (item.permissions?.length && !item.permissions.some(ctx.can)) return false;
    if (item.formFactors && !item.formFactors.includes(ctx.formFactor)) return false;
    return true;
  });
}
