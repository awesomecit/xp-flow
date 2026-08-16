import type { ReactNode } from "react";

import { Pager } from "./Pager";
import type { Pagination } from "./usePagination";

type Props<T> = {
  /** Stato di paginazione già risolto (client o server). */
  state: Pagination<T>;
  /** Etichetta usata per l'aria-label dei controlli. */
  label: string;
  children: (item: T, index: number) => ReactNode;
  as?: "ul" | "ol";
  className?: string;
  testId?: string;
  /** Classi del contenitore dei controlli (padding coerente col pannello). */
  pagerClassName?: string;
};

/**
 * Lista paginata "muta": riceve la pagina corrente e i controlli già calcolati.
 * Usata con `useServerPagination`, quindi non conosce il totale dei dati né
 * esegue tagli: mostra ciò che il server ha restituito.
 */
export function RemoteList<T>({
  state,
  label,
  children,
  as = "ul",
  className,
  testId,
  pagerClassName,
}: Props<T>) {
  const List = as;
  return (
    <>
      <List className={className} data-testid={testId}>
        {state.items.map((item, index) => children(item, index))}
      </List>
      <div className={pagerClassName}>
        <Pager state={state} label={label} />
      </div>
    </>
  );
}
