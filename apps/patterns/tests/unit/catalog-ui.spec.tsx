import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { CatalogList } from "../../src/components/CatalogList";
import { HelloWorld } from "../../src/components/HelloWorld";
import { CATEGORIES, catalog } from "../../src/catalog/catalog";
import { DEFAULT_LOCALE, messages } from "../../src/i18n/messages";
// PatternView non esiste ancora in src/catalog/catalog.ts: è il contratto
// fissato dal rilievo 2 della pair-review round 1 (CatalogList deve accettare
// il tipo REALE del catalogo, categoria come union chiusa — niente più
// fixture con categorie/stati inventati). Import type-only: a runtime viene
// eliso da esbuild, quindi non rompe l'esecuzione di vitest; il typecheck
// (ora esteso a tests/**, rilievo 7) resta rosso finché l'implementatore non
// lo esporta — è la parte attesa del RED di questo round.
import type { Category, PatternStatus, PatternView } from "../../src/catalog/catalog";

/**
 * Round 2 (pair-review round 1 bocciata, issue #6). Contratti fissati qui:
 * - CatalogList accetta PatternView (tipo reale del catalogo, non più una
 *   forma inline duplicata) — rilievo 2;
 * - le card e le option dei filtri mostrano ETICHETTE TRADOTTE lette da
 *   messages[DEFAULT_LOCALE].catalog.category/status, mai lo slug grezzo di
 *   `category`/`status` — rilievo 1 (bloccante);
 * - le fixture usano SOLO categorie/stati reali (CATEGORIES / PatternStatus
 *   del catalogo) — rilievo 2. Questo chiude anche la vecchia collisione
 *   potenziale col sentinel "all": "all" non è (e non può più essere, per
 *   tipo) una categoria reale, quindi non serve più testarla a runtime, la
 *   garantisce tsc;
 * - un test di integrazione col catalogo VERO (24 voci, option categoria =
 *   CATEGORIES) — rilievo 3.
 * `makeFixture()` sostituisce la vecchia FIXTURE condivisa mutabile: ogni
 * test parte da un array fresco (rilievo 5).
 */

function makeFixture(): PatternView[] {
  return [
    {
      id: "fixture-error-boundary",
      name: "Error Boundary (fixture)",
      description: {
        it: "Cattura errori di rendering e mostra un fallback",
        en: "Catches render errors and shows a fallback",
      },
      category: "errors",
      source: { repo: "universal-canvas", path: "src/errors/ExampleBoundary.tsx" },
      status: "available-in-template",
    },
    {
      id: "fixture-persisted-filter",
      name: "Persisted Filter (fixture)",
      description: {
        it: "Filtro che ricorda la scelta dell'utente",
        en: "Filter that remembers the user's choice",
      },
      category: "state",
      source: { repo: "xp-flow", path: "apps/dashboard/src/state/useExampleFilter.ts" },
      status: "used-in-dashboard",
    },
    {
      id: "fixture-paginated-list",
      name: "Paginated List (fixture)",
      description: {
        it: "Lista con paginazione lato client",
        en: "Client-side paginated list",
      },
      category: "ui",
      source: {
        repo: "xp-flow",
        path: "apps/dashboard/src/routes/-components/useExamplePagination.ts",
      },
      status: "used-in-dashboard",
    },
    {
      id: "fixture-role-guard",
      name: "Role Guard (fixture)",
      description: {
        it: "Guardia di accesso basata sui ruoli",
        en: "Access guard based on roles",
      },
      category: "platform",
      source: { repo: "universal-canvas", path: "src/features/auth/ExampleRoleGuard.tsx" },
      status: "to-extract",
    },
  ];
}

/** Vista parziale delle mappe i18n attese (non ancora presenti in src/i18n/messages.ts). */
type CatalogLabelMaps = {
  category: Partial<Record<Category, string>>;
  status: Partial<Record<PatternStatus, string>>;
};

function catalogMessages(): Partial<CatalogLabelMaps> {
  return messages[DEFAULT_LOCALE].catalog as unknown as Partial<CatalogLabelMaps>;
}

/**
 * Etichetta tradotta attesa per una categoria. Se la mappa non esiste ancora
 * in messages (contratto nuovo, non implementato), torna un marcatore
 * chiaramente diverso dallo slug grezzo: il test resta rosso con un diff
 * leggibile invece di esplodere con un TypeError su undefined.
 */
function expectedCategoryLabel(category: Category): string {
  return (
    catalogMessages().category?.[category] ?? `[[i18n mancante: catalog.category.${category}]]`
  );
}

function expectedStatusLabel(status: PatternStatus): string {
  return catalogMessages().status?.[status] ?? `[[i18n mancante: catalog.status.${status}]]`;
}

function findCardByName(cards: HTMLElement[], name: string): HTMLElement {
  const card = cards.find((el) => el.textContent?.includes(name));
  if (!card) {
    throw new Error(`manca la card per "${name}"`);
  }
  return card;
}

/**
 * Contratto UI fissato da questi test (CatalogList è un componente puro):
 * - una card per voce, data-testid="pattern-card", con nome ed etichette
 *   TRADOTTE di categoria/stato visibili (mai lo slug grezzo);
 * - un <select data-testid="category-filter"> con value = categoria grezza
 *   (serve al filtro) ma testo visibile = etichetta tradotta, più il
 *   sentinel "all" (nessun filtro);
 * - un <select data-testid="status-filter"> analogo sugli status;
 * - nessun risultato -> data-testid="empty-state", zero "pattern-card", nessun crash.
 */
describe("CatalogList — lista e filtri (fixture controllata)", () => {
  // --- positivo ---
  it("[positive] renderizza una card per ogni pattern, con nome ed etichette tradotte di categoria/stato", () => {
    const fixture = makeFixture();
    render(<CatalogList patterns={fixture} />);

    const cards = screen.getAllByTestId("pattern-card");
    expect(cards).toHaveLength(fixture.length);

    for (const pattern of fixture) {
      const card = findCardByName(cards, pattern.name);

      // guardia esplicita anti-slug-grezzo (bloccante rilievo 1)
      expect(
        card.textContent,
        `la card di "${pattern.name}" mostra lo status grezzo, non un'etichetta tradotta`,
      ).not.toContain(pattern.status);
      expect(
        card.textContent,
        `la card di "${pattern.name}" mostra la categoria grezza, non un'etichetta tradotta`,
      ).not.toContain(pattern.category);

      expect(card).toHaveTextContent(expectedStatusLabel(pattern.status));
      expect(card).toHaveTextContent(expectedCategoryLabel(pattern.category));
    }
  });

  it("[positive] selezionando una categoria restano solo le card di quella categoria", () => {
    const fixture = makeFixture();
    render(<CatalogList patterns={fixture} />);

    fireEvent.change(screen.getByTestId("category-filter"), { target: { value: "state" } });

    const cards = screen.getAllByTestId("pattern-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Persisted Filter (fixture)");
  });

  // --- negativo / edge ---
  it("[negative] una combinazione di filtri senza corrispondenze mostra uno stato vuoto esplicito, senza errori", () => {
    const fixture = makeFixture();
    render(<CatalogList patterns={fixture} />);

    // categoria "platform" nella fixture esiste solo con status "to-extract":
    // incrociarla con "used-in-dashboard" non produce risultati.
    fireEvent.change(screen.getByTestId("category-filter"), { target: { value: "platform" } });
    fireEvent.change(screen.getByTestId("status-filter"), {
      target: { value: "used-in-dashboard" },
    });

    expect(screen.queryAllByTestId("pattern-card")).toHaveLength(0);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("[edge] tornando al sentinel 'all' il filtro categoria si azzera e tornano tutte le card", () => {
    const fixture = makeFixture();
    render(<CatalogList patterns={fixture} />);
    const categoryFilter = screen.getByTestId("category-filter");

    fireEvent.change(categoryFilter, { target: { value: "state" } });
    expect(screen.getAllByTestId("pattern-card")).toHaveLength(1);

    fireEvent.change(categoryFilter, { target: { value: "all" } });
    expect(screen.getAllByTestId("pattern-card")).toHaveLength(fixture.length);
  });

  // --- non regressione ---
  it("[regression] filtrare non muta l'array di pattern ricevuto in prop (componente puro)", () => {
    const fixture = makeFixture();
    const snapshot = JSON.parse(JSON.stringify(fixture)) as PatternView[];

    render(<CatalogList patterns={fixture} />);
    fireEvent.change(screen.getByTestId("category-filter"), { target: { value: "state" } });

    expect(fixture).toEqual(snapshot);
  });
});

describe("CatalogList — etichette tradotte nelle option dei filtri (fixture controllata)", () => {
  it("[positive] le option del filtro categoria mostrano l'etichetta tradotta, non lo slug grezzo", () => {
    const fixture = makeFixture();
    render(<CatalogList patterns={fixture} />);

    const options = within(screen.getByTestId("category-filter")).getAllByRole("option");
    const realOptions = options.filter((option) => (option as HTMLOptionElement).value !== "all");
    expect(realOptions.length).toBeGreaterThan(0);

    for (const option of realOptions) {
      const category = (option as HTMLOptionElement).value as Category;
      expect(
        option.textContent,
        `l'option categoria "${category}" mostra lo slug grezzo invece dell'etichetta tradotta`,
      ).not.toBe(category);
      expect(option.textContent).toBe(expectedCategoryLabel(category));
    }
  });

  it("[positive] le option del filtro stato mostrano l'etichetta tradotta, non lo slug grezzo", () => {
    const fixture = makeFixture();
    render(<CatalogList patterns={fixture} />);

    const options = within(screen.getByTestId("status-filter")).getAllByRole("option");
    const realOptions = options.filter((option) => (option as HTMLOptionElement).value !== "all");
    expect(realOptions.length).toBeGreaterThan(0);

    for (const option of realOptions) {
      const status = (option as HTMLOptionElement).value as PatternStatus;
      expect(
        option.textContent,
        `l'option stato "${status}" mostra lo slug grezzo invece dell'etichetta tradotta`,
      ).not.toBe(status);
      expect(option.textContent).toBe(expectedStatusLabel(status));
    }
  });
});

/**
 * Rilievo 3 (pair-review round 1, maggiore): nessun test copriva il catalogo
 * vero. Si asserisce solo ciò che è stabile — il totale delle voci e
 * l'insieme delle option di categoria — non la distribuzione degli status:
 * la review ha accertato status sbagliati per alcune voci (da correggere
 * nell'implementazione), quindi i numeri per status non vanno fissati qui.
 */
describe("CatalogList — integrazione con il catalogo reale", () => {
  it("[positive] renderizza esattamente le voci del catalogo reale (24, censimento 16/08/2026)", () => {
    render(<CatalogList patterns={catalog} />);

    expect(catalog.length).toBe(24);
    expect(screen.getAllByTestId("pattern-card")).toHaveLength(catalog.length);
  });

  it("[positive] le option del filtro categoria coprono esattamente CATEGORIES, più il sentinel 'all'", () => {
    render(<CatalogList patterns={catalog} />);

    const options = within(screen.getByTestId("category-filter")).getAllByRole("option");
    const values = options.map((option) => (option as HTMLOptionElement).value);

    expect(values[0]).toBe("all");
    expect(values).toHaveLength(CATEGORIES.length + 1);
    // L'ordine di rendering è un dettaglio d'implementazione (oggi alfabetico):
    // si verifica l'insieme dei valori disponibili, non l'ordine.
    expect(new Set(values.slice(1))).toEqual(new Set(CATEGORIES));
  });
});

describe("HelloWorld — titolo della landing", () => {
  it("[positive] mostra il titolo della landing preso dal modulo i18n (locale di default 'it')", () => {
    render(<HelloWorld />);

    expect(
      screen.getByRole("heading", { name: messages[DEFAULT_LOCALE].landing.title }),
    ).toBeInTheDocument();
  });
});
