import { useCallback, useEffect, useRef, useState } from "react";

import { usePersistedState } from "../../state/usePersistedState";

/**
 * Filtro di vista con doppia memoria:
 * - URL (`?cmd=sprint`): rende la vista condivisibile e i test deterministici;
 * - storage locale: al ritorno sulla pagina il filtro è quello che avevi lasciato.
 *
 * Precedenza: URL > valore persistito > default. SSR-safe (nessuna lettura di
 * window/storage durante il primo render).
 */
export function usePersistedFilter<T extends string>(
  param: string,
  storageKey: string,
  initial: T,
  isValid: (value: string) => value is T,
): [T, (value: T) => void] {
  const [persisted, setPersisted] = usePersistedState<T>(storageKey, initial);
  const [value, setValue] = useState<T>(initial);
  const urlApplied = useRef(false);

  // 1) allinea allo stato persistito (arriva dopo l'idratazione)
  useEffect(() => {
    if (!urlApplied.current) setValue(persisted);
  }, [persisted]);

  // 2) l'URL, se presente, vince
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get(param);
    if (fromUrl !== null && isValid(fromUrl)) {
      urlApplied.current = true;
      setValue(fromUrl);
    }
    // isValid è stabile per costruzione (predicato di modulo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      setPersisted(next);
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (next === initial) url.searchParams.delete(param);
      else url.searchParams.set(param, next);
      window.history.replaceState(window.history.state, "", url.toString());
    },
    [initial, param, setPersisted],
  );

  return [value, update];
}
