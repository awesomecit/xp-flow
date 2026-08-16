/**
 * Lista filtrabile del catalogo pattern (issue #6).
 * Componente puro e disaccoppiato dal modulo dati (src/catalog/catalog.ts):
 * accetta qualunque array di voci con la forma minima richiesta, cosa che
 * permette al chiamante di passare sia il catalogo reale sia una fixture
 * di test con categorie/stati diversi da quelli del catalogo reale.
 * Filtro per categoria e per stato, entrambi con sentinel "all" (nessun
 * filtro); nessuna corrispondenza -> stato vuoto esplicito, mai un crash.
 * Sotto-componente privato PatternCard nello stesso file (regola 4 della
 * costituzione di stile).
 */
import { useState } from "react";
import { DEFAULT_LOCALE, messages } from "../i18n/messages";

const ALL = "all";

type PatternEntry = {
  id: string;
  name: string;
  description: { it: string; en: string };
  category: string;
  source: { repo: "universal-canvas" | "xp-flow"; path: string };
  status: "available-in-template" | "used-in-dashboard" | "to-extract";
};

type CatalogListProps = {
  patterns: readonly PatternEntry[];
};

/** Valori distinti presenti nelle voci, ordinati alfabeticamente. */
function distinctValues(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function PatternCard({ pattern }: { pattern: PatternEntry }) {
  return (
    <article data-testid="pattern-card">
      <h3>{pattern.name}</h3>
      <p>{pattern.description[DEFAULT_LOCALE]}</p>
      <span>{pattern.category}</span>
      <span>{pattern.status}</span>
    </article>
  );
}

export function CatalogList({ patterns }: CatalogListProps) {
  const t = messages[DEFAULT_LOCALE].catalog;
  const [category, setCategory] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);

  const categories = distinctValues(patterns.map((pattern) => pattern.category));
  const statuses = distinctValues(patterns.map((pattern) => pattern.status));

  const filtered = patterns.filter(
    (pattern) =>
      (category === ALL || pattern.category === category) &&
      (status === ALL || pattern.status === status),
  );

  return (
    <div>
      <label>
        {t.categoryFilterLabel}
        <select
          data-testid="category-filter"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value={ALL}>{t.allOption}</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.statusFilterLabel}
        <select
          data-testid="status-filter"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value={ALL}>{t.allOption}</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      {filtered.length === 0 ? (
        <p data-testid="empty-state">{t.emptyState}</p>
      ) : (
        <div>
          {filtered.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  );
}
