/**
 * Avvio del worker MSW nel browser. Attivo solo in demo mode.
 * Il file viene importato dinamicamente, così msw non entra nel bundle di produzione.
 */
import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}
