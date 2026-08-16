/**
 * Unica porta d'accesso alle variabili d'ambiente.
 * Nessun altro file legge `import.meta.env` (eccetto platform.ts per il build target).
 */
export const env = {
  apiBaseUrl: (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "/api",
  demoMode: import.meta.env["VITE_DEMO_MODE"] === "true",
  defaultTenant: (import.meta.env["VITE_DEFAULT_TENANT"] as string | undefined) ?? "default",
  requestTimeoutMs: Number(import.meta.env["VITE_API_TIMEOUT_MS"] ?? 10_000),
  /** WebSocket eventi/notifiche. Vuoto = trasporto mock (demo, msw, test). */
  eventsUrl: (import.meta.env["VITE_EVENTS_WS_URL"] as string | undefined) ?? "",
} as const;
