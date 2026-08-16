import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PAGE_SIZE, paginate, usePagination } from "@/routes/-components/usePagination";

const list = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("paginate (pura)", () => {
  it("[positive] taglia la prima pagina", () => {
    const r = paginate(list(25), 1);
    expect(r.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.pageCount).toBe(3);
    expect(r.total).toBe(25);
  });

  it("[positive] l'ultima pagina contiene il resto", () => {
    expect(paginate(list(25), 3).items).toEqual([21, 22, 23, 24, 25]);
  });

  it("[negative] una pagina oltre i limiti viene riportata sull'ultima", () => {
    expect(paginate(list(25), 99).page).toBe(3);
  });

  it("[negative] una pagina non valida (0, negativa, NaN) vale 1", () => {
    expect(paginate(list(25), 0).page).toBe(1);
    expect(paginate(list(25), -4).page).toBe(1);
    expect(paginate(list(25), Number.NaN).page).toBe(1);
  });

  it("[edge] lista vuota: una pagina, nessun elemento", () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
  });

  it("[edge] lista esattamente a soglia: una sola pagina", () => {
    expect(paginate(list(PAGE_SIZE), 1).pageCount).toBe(1);
  });
});

describe("usePagination", () => {
  it("[edge] sotto soglia la paginazione è disattivata e mostra tutto", () => {
    const { result } = renderHook(() => usePagination(list(PAGE_SIZE)));
    expect(result.current.enabled).toBe(false);
    expect(result.current.items).toHaveLength(PAGE_SIZE);
  });

  it("[positive] naviga avanti e indietro fra le pagine", () => {
    const { result } = renderHook(() => usePagination(list(25)));
    expect(result.current.items[0]).toBe(1);
    act(() => result.current.next());
    expect(result.current.page).toBe(2);
    expect(result.current.items[0]).toBe(11);
    act(() => result.current.prev());
    expect(result.current.page).toBe(1);
  });

  it("[negative] non si va prima della prima né oltre l'ultima pagina", () => {
    const { result } = renderHook(() => usePagination(list(15)));
    act(() => result.current.prev());
    expect(result.current.page).toBe(1);
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.page).toBe(2);
    expect(result.current.hasNext).toBe(false);
  });

  it("[regression] cambiando filtro (resetKey) si torna a pagina 1", () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => usePagination(list(25), { resetKey: key }),
      { initialProps: { key: "all" } },
    );
    act(() => result.current.next());
    expect(result.current.page).toBe(2);
    rerender({ key: "sprint" });
    expect(result.current.page).toBe(1);
  });

  it("[regression] cambiando la lunghezza dei dati si torna a pagina 1", () => {
    const { result, rerender } = renderHook(({ n }: { n: number }) => usePagination(list(n)), {
      initialProps: { n: 25 },
    });
    act(() => result.current.next());
    expect(result.current.page).toBe(2);
    rerender({ n: 40 });
    expect(result.current.page).toBe(1);
  });
});
