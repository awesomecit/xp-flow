import { useCallback, useEffect, useRef, useState } from "react";

import { usePlatform } from "../../platform/usePlatform";

/** Dimensione pagina e soglia oltre la quale i controlli diventano visibili. */
export const PAGE_SIZE = 10;

export type PageSlice<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
};

/**
 * Taglio puro di una lista (nessun React): base testabile della paginazione.
 * La pagina è 1-based e viene sempre riportata dentro i limiti.
 */
export function paginate<T>(items: readonly T[], page: number, pageSize = PAGE_SIZE): PageSlice<T> {
  const total = items.length;
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (safePage - 1) * size;
  return { items: items.slice(start, start + size), page: safePage, pageCount, total };
}

export type PaginationMode = "pages" | "more";

export type Pagination<T> = PageSlice<T> & {
  mode: PaginationMode;
  pageSize: number;
  /** true solo sopra soglia: sotto, la lista si mostra intera senza controlli. */
  enabled: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  next: () => void;
  prev: () => void;
  showMore: () => void;
  reset: () => void;
};

type Options = {
  pageSize?: number;
  /** Nome del query param per rendere la pagina condivisibile (solo Timeline). */
  param?: string;
  /** Cambiando questo valore (es. filtri attivi) si torna a pagina 1. */
  resetKey?: string;
};

/**
 * Paginazione client-side su dati già in cache.
 * - desktop/tablet: pagine numerate;
 * - phone: "mostra altri" incrementale (più adatto al pollice).
 */
export function usePagination<T>(items: readonly T[], options: Options = {}): Pagination<T> {
  const { pageSize = PAGE_SIZE, param, resetKey } = options;
  const { formFactor } = usePlatform();
  const mode: PaginationMode = formFactor === "phone" ? "more" : "pages";

  const [page, setPage] = useState(1);
  const [visible, setVisible] = useState(pageSize);
  const urlRead = useRef(false);

  // La pagina iniziale può arrivare dall'URL: rende gli scenari e2e deterministici.
  useEffect(() => {
    if (!param || urlRead.current || typeof window === "undefined") return;
    urlRead.current = true;
    const raw = new URLSearchParams(window.location.search).get(param);
    const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 1) setPage(parsed);
  }, [param]);

  // Cambio filtri o dataset: si riparte dall'inizio, mai su una pagina fantasma.
  useEffect(() => {
    setPage(1);
    setVisible(pageSize);
  }, [resetKey, items.length, pageSize]);

  const syncUrl = useCallback(
    (next: number) => {
      if (!param || typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (next <= 1) url.searchParams.delete(param);
      else url.searchParams.set(param, String(next));
      window.history.replaceState(window.history.state, "", url.toString());
    },
    [param],
  );

  const total = items.length;
  const enabled = total > pageSize;

  if (mode === "more") {
    const shown = enabled ? Math.min(visible, total) : total;
    return {
      items: items.slice(0, shown),
      page: Math.max(1, Math.ceil(shown / pageSize)),
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      total,
      mode,
      pageSize,
      enabled,
      hasPrev: false,
      hasNext: shown < total,
      next: () => setVisible((v) => v + pageSize),
      prev: () => {},
      showMore: () => setVisible((v) => v + pageSize),
      reset: () => setVisible(pageSize),
    };
  }

  const slice = enabled ? paginate(items, page, pageSize) : paginate(items, 1, Math.max(1, total));
  const go = (next: number) => {
    const clamped = Math.min(Math.max(1, next), slice.pageCount);
    setPage(clamped);
    syncUrl(clamped);
  };

  return {
    ...slice,
    mode,
    pageSize,
    enabled,
    hasPrev: slice.page > 1,
    hasNext: slice.page < slice.pageCount,
    next: () => go(slice.page + 1),
    prev: () => go(slice.page - 1),
    showMore: () => go(slice.page + 1),
    reset: () => go(1),
  };
}
