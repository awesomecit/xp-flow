/**
 * Lista filtrabile del catalogo pattern (issue #6).
 * Componente puro e disaccoppiato dal modulo dati (src/catalog/catalog.ts):
 * accetta `PatternView`, il tipo reale delle voci del catalogo, cosa che
 * permette al chiamante di passare sia il catalogo reale sia una fixture di
 * test con categorie/stati diversi (ma sempre validi per tsc — le union
 * sono chiuse, rilievo 2 pair-review round 1).
 * Filtro per categoria e per stato, entrambi con sentinel "all" (nessun
 * filtro, stato interno `null`); nessuna corrispondenza -> stato vuoto
 * esplicito, mai un crash. Etichette sempre tradotte da messages, mai lo
 * slug grezzo di categoria/stato (rilievo 1, bloccante).
 * Sotto-componente privato PatternCard nello stesso file (regola 4 della
 * costituzione di stile).
 */
import { useState } from "react";
import { DEFAULT_LOCALE, messages } from "../i18n/messages";
import type { Category, PatternStatus, PatternView } from "../catalog/catalog";

const ALL = "all";

type CatalogListProps = {
  patterns: readonly PatternView[];
};

/** Valori distinti presenti nelle voci, ordinati alfabeticamente (locale 'en'). */
function distinctValues<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "en"));
}

function PatternCard({ pattern }: { pattern: PatternView }) {
  const t = messages[DEFAULT_LOCALE].catalog;

  return (
    <article
      data-testid="pattern-card"
      className="flex flex-col gap-2 rounded-lg border border-foreground/10 bg-surface p-4 text-surface-foreground"
    >
      <h3 className="text-base font-semibold">{pattern.name}</h3>
      <p className="text-sm text-surface-foreground/70">{pattern.description[DEFAULT_LOCALE]}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
          {t.category[pattern.category]}
        </span>
        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground/80">
          {t.status[pattern.status]}
        </span>
      </div>
    </article>
  );
}

export function CatalogList({ patterns }: CatalogListProps) {
  const t = messages[DEFAULT_LOCALE].catalog;
  const [category, setCategory] = useState<Category | null>(null);
  const [status, setStatus] = useState<PatternStatus | null>(null);

  const categories = distinctValues(patterns.map((pattern) => pattern.category));
  const statuses = distinctValues(patterns.map((pattern) => pattern.status));

  const filtered = patterns.filter(
    (pattern) =>
      (category === null || pattern.category === category) &&
      (status === null || pattern.status === status),
  );

  const selectClassName =
    "rounded-md border border-foreground/15 bg-surface px-3 py-2 text-sm text-surface-foreground";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">{t.categoryFilterLabel}</span>
          <select
            data-testid="category-filter"
            className={selectClassName}
            value={category ?? ALL}
            onChange={(event) => {
              const value = event.target.value;
              setCategory(value === ALL ? null : (value as Category));
            }}
          >
            <option value={ALL}>{t.allOption}</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {t.category[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">{t.statusFilterLabel}</span>
          <select
            data-testid="status-filter"
            className={selectClassName}
            value={status ?? ALL}
            onChange={(event) => {
              const value = event.target.value;
              setStatus(value === ALL ? null : (value as PatternStatus));
            }}
          >
            <option value={ALL}>{t.allOption}</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {t.status[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length === 0 ? (
        <p
          data-testid="empty-state"
          className="rounded-md border border-foreground/10 bg-surface/40 px-4 py-6 text-center text-foreground/70"
        >
          {t.emptyState}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  );
}
