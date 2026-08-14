import { useEffect, useState, type ReactNode } from "react";

import { env } from "../config/env";
import { debugLog } from "../state/debug";

/**
 * Gate del mock: in demo mode avvia il worker MSW PRIMA di montare l'app,
 * così nessuna query parte verso un endpoint non ancora intercettato.
 * Fuori dalla demo (o in SSR) è un passthrough a costo zero.
 */
export function MockGate({ children }: { children: ReactNode }) {
  // In demo mode il gate DEVE valere anche in SSR: se il server renderizza
  // l'app e il primo render client è null, l'idratazione fallisce e React
  // duplica l'albero (guscio SSR morto + app viva). env.demoMode è identico
  // sui due lati, quindi il primo render coincide sempre.
  const needsWorker = env.demoMode;
  const [ready, setReady] = useState(!needsWorker);

  useEffect(() => {
    if (!needsWorker || ready) return;
    let cancelled = false;
    void import("../mocks/browser")
      .then((m) => m.startMockWorker())
      .catch((error) => debugLog("mocks:start-error", { error: String(error) }))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [needsWorker, ready]);

  if (!ready) return null;
  return <>{children}</>;
}
