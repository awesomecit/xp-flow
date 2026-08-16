import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Moduli non ancora esistenti: fase RED del TDD (issue #6, ADR 0009).
// L'implementatore crea src/components/CatalogList.tsx, src/components/HelloWorld.tsx
// e src/i18n/messages.ts con i contratti fissati da questo file.
import { CatalogList } from "../../src/components/CatalogList";
import { HelloWorld } from "../../src/components/HelloWorld";
import { DEFAULT_LOCALE, messages } from "../../src/i18n/messages";

/**
 * Fixture inline (componente puro, nessuna dipendenza dal catalogo reale).
 * Forma allineata al contratto Pattern dell'issue #6 (ADR 0009).
 */
type PatternFixture = {
  id: string;
  name: string;
  description: { it: string; en: string };
  category: string;
  source: { repo: "universal-canvas" | "xp-flow"; path: string };
  status: "available-in-template" | "used-in-dashboard" | "to-extract";
};

const FIXTURE: PatternFixture[] = [
  {
    id: "error-boundary",
    name: "Error Boundary",
    description: {
      it: "Cattura errori di rendering e mostra un fallback",
      en: "Catches render errors and shows a fallback",
    },
    category: "error-handling",
    source: { repo: "universal-canvas", path: "src/components/ErrorBoundary.tsx" },
    status: "available-in-template",
  },
  {
    id: "persisted-filters",
    name: "Persisted Filters",
    description: {
      it: "Filtri che ricordano la scelta dell'utente",
      en: "Filters that remember the user's choice",
    },
    category: "filters",
    source: { repo: "xp-flow", path: "apps/dashboard/src/state/usePersistedState.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "paginated-list",
    name: "Paginated List",
    description: {
      it: "Lista con paginazione lato client",
      en: "Client-side paginated list",
    },
    category: "lists",
    source: { repo: "xp-flow", path: "apps/dashboard/src/routes/-components/usePagination.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "role-based-login",
    name: "Role-based Login",
    description: {
      it: "Login con ruoli e permessi",
      en: "Login with roles and permissions",
    },
    category: "auth",
    source: { repo: "universal-canvas", path: "src/features/auth/RoleGuard.tsx" },
    status: "to-extract",
  },
];

/**
 * Contratto UI fissato da questi test (CatalogList è un componente puro):
 * - una card per voce, data-testid="pattern-card", con name e status visibili;
 * - un <select data-testid="category-filter"> con opzioni valorizzate con le
 *   categorie grezze della fixture più il sentinel "all" (nessun filtro);
 * - un <select data-testid="status-filter"> analogo sugli status, sentinel "all";
 * - nessun risultato -> data-testid="empty-state", zero "pattern-card", nessun crash.
 */
describe("CatalogList — lista e filtri", () => {
  // --- positivo ---
  it("[positive] renderizza una card per ogni pattern, con nome e stato visibili", () => {
    render(<CatalogList patterns={FIXTURE} />);

    const cards = screen.getAllByTestId("pattern-card");
    expect(cards).toHaveLength(FIXTURE.length);

    for (const pattern of FIXTURE) {
      const card = cards.find((el) => el.textContent?.includes(pattern.name));
      expect(card, `manca la card per "${pattern.name}"`).toBeTruthy();
      expect(card).toHaveTextContent(pattern.status);
    }
  });

  it("[positive] selezionando una categoria restano solo le card di quella categoria", () => {
    render(<CatalogList patterns={FIXTURE} />);

    fireEvent.change(screen.getByTestId("category-filter"), { target: { value: "filters" } });

    const cards = screen.getAllByTestId("pattern-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Persisted Filters");
  });

  // --- negativo / edge ---
  it("[negative] una combinazione di filtri senza corrispondenze mostra uno stato vuoto esplicito, senza errori", () => {
    render(<CatalogList patterns={FIXTURE} />);

    // categoria "auth" nella fixture esiste solo con status "to-extract":
    // incrociarla con "used-in-dashboard" non produce risultati.
    fireEvent.change(screen.getByTestId("category-filter"), { target: { value: "auth" } });
    fireEvent.change(screen.getByTestId("status-filter"), {
      target: { value: "used-in-dashboard" },
    });

    expect(screen.queryAllByTestId("pattern-card")).toHaveLength(0);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("[edge] tornando al sentinel 'all' il filtro categoria si azzera e tornano tutte le card", () => {
    render(<CatalogList patterns={FIXTURE} />);
    const categoryFilter = screen.getByTestId("category-filter");

    fireEvent.change(categoryFilter, { target: { value: "filters" } });
    expect(screen.getAllByTestId("pattern-card")).toHaveLength(1);

    fireEvent.change(categoryFilter, { target: { value: "all" } });
    expect(screen.getAllByTestId("pattern-card")).toHaveLength(FIXTURE.length);
  });

  // --- non regressione ---
  it("[regression] filtrare non muta l'array di pattern ricevuto in prop (componente puro)", () => {
    const snapshot = JSON.parse(JSON.stringify(FIXTURE)) as PatternFixture[];

    render(<CatalogList patterns={FIXTURE} />);
    fireEvent.change(screen.getByTestId("category-filter"), { target: { value: "filters" } });

    expect(FIXTURE).toEqual(snapshot);
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
