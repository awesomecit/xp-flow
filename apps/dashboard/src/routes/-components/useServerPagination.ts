import { useCallback, useEffect, useRef, useState } from "react";

import { usePlatform } from "../../platform/usePlatform";
import type { Paginated } from "../../api";
import type { Pagination } from "./usePagination";
import { PAGE_SIZE } from "./usePagination";

type Options = {
  pageSize?: number;
  /** Query param per rendere la pagina condivisibile (solo dove serve). */
  param?: string;
  /** Cambiando (es. filtri) si torna a pagina 1. */
  resetKey?: string;
};

export type ServerPagination<T> = {
  /** Argomenti da passare alla query REST: il taglio lo fa il server. */
  args: { page: number; pageSize: number };
  /** Adatta la risposta del server ai controlli condivisi (`Pager`). */
  bind: (page: Paginated<T> | undefined) => Pagination<T>;
};

/**
 * Paginazione **lato server**: qui non si taglia nulla, si decide solo cosa
 * chiedere.
 * - desktop/tablet: pagine numerate (`page` cresce, `pageSize` fisso);
 * - phone: "mostra altri" incrementale, chiedendo una finestra più ampia
 *   (`pageSize` cresce) così la lista già vista non sparisce.
 */
export function useServerPagination<T>(options: Options = {}): ServerPagination<T> {
  const { pageSize = PAGE_SIZE, param, resetKey } = options;
  const { formFactor } = usePlatform();
  const mode = formFactor === "phone" ? "more" : "pages";

  const [page, setPage] = useState(1);
  const [chunks, setChunks] = useState(1);
  const urlRead = useRef(false);

  // La pagina iniziale può arrivare dall'URL: rende gli scenari e2e deterministici.
  useEffect(() => {
    if (!param || urlRead.current || typeof window === "undefined") return;
    urlRead.current = true;
    const raw = new URLSearchParams(window.location.search).get(param);
    const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 1) setPage(parsed);
  }, [param]);

  // Cambio filtri: si riparte dall'inizio, mai su una pagina fantasma.
  useEffect(() => {
    setPage(1);
    setChunks(1);
  }, [resetKey]);

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

  const args = mode === "more" ? { page: 1, pageSize: pageSize * chunks } : { page, pageSize };

  const bind = (result: Paginated<T> | undefined): Pagination<T> => {
    const items = result?.items ?? [];
    const total = result?.total ?? 0;
    const enabled = total > pageSize;

    if (mode === "more") {
      return {
        items,
        page: 1,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        total,
        mode: "more",
        pageSize,
        enabled,
        hasPrev: false,
        hasNext: items.length < total,
        next: () => setChunks((c) => c + 1),
        prev: () => {},
        showMore: () => setChunks((c) => c + 1),
        reset: () => setChunks(1),
      };
    }

    const pageCount = result?.pageCount ?? 1;
    const current = result?.page ?? page;
    const go = (next: number) => {
      const clamped = Math.min(Math.max(1, next), pageCount);
      setPage(clamped);
      syncUrl(clamped);
    };

    return {
      items,
      page: current,
      pageCount,
      total,
      mode: "pages",
      pageSize,
      enabled,
      hasPrev: current > 1,
      hasNext: current < pageCount,
      next: () => go(current + 1),
      prev: () => go(current - 1),
      showMore: () => go(current + 1),
      reset: () => go(1),
    };
  };

  return { args, bind };
}
