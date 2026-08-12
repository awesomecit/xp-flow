/**
 * Build target + runtime form factor.
 *
 * `BUILD_TARGET` is injected at build time (VITE_BUILD_TARGET) so the same
 * codebase produces a web bundle and an Android (Capacitor) bundle.
 */
export type BuildTarget = "web" | "android";
export type FormFactor = "phone" | "tablet" | "desktop";

export const BUILD_TARGET: BuildTarget =
  (import.meta.env["VITE_BUILD_TARGET"] as BuildTarget | undefined) ?? "web";

export const TABLET_MIN_WIDTH = 600;
export const DESKTOP_MIN_WIDTH = 1024;

/** Form factor usato nel primo render (server e client) per evitare hydration mismatch. */
export const SSR_FORM_FACTOR: FormFactor = BUILD_TARGET === "android" ? "phone" : "desktop";

/** SSR-safe: returns "desktop" on the server, refine after hydration. */
export function detectFormFactor(width?: number): FormFactor {
  const w = width ?? (typeof window === "undefined" ? undefined : window.innerWidth);
  if (w === undefined) return BUILD_TARGET === "android" ? "phone" : "desktop";
  if (w < TABLET_MIN_WIDTH) return "phone";
  if (w < DESKTOP_MIN_WIDTH) return BUILD_TARGET === "android" ? "tablet" : "tablet";
  return BUILD_TARGET === "android" ? "tablet" : "desktop";
}
