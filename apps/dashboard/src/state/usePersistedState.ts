import { useCallback, useEffect, useState } from "react";

import { debugLog } from "./debug";

/**
 * Stato locale persistente (preferenze UI: lingua scelta, tema, filtri, ecc.).
 *
 * SSR-safe: il primo render usa sempre `initial`; la lettura dello storage
 * avviene in `useEffect` dopo l'idratazione, quindi niente hydration mismatch.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  storage: "local" | "session" = "local",
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window[`${storage}Storage`].getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch (error) {
      debugLog("persisted:read-error", { key, error: String(error) });
    }
  }, [key, storage]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      if (typeof window === "undefined") return;
      try {
        window[`${storage}Storage`].setItem(key, JSON.stringify(next));
        debugLog("persisted:write", { key, next });
      } catch (error) {
        debugLog("persisted:write-error", { key, error: String(error) });
      }
    },
    [key, storage],
  );

  return [value, update];
}
