import { describe, expect, it } from "vitest";

// Modulo non ancora esistente: fase RED del TDD (issue #6, ADR 0009).
// L'implementatore crea src/catalog/catalog.ts con questo contratto.
import { CATEGORIES, catalog } from "../../src/catalog/catalog";

/**
 * Invarianti del contratto dati del catalogo pattern.
 * Il catalogo è "solo dati" (ADR 0009): qui blindiamo la FORMA delle voci,
 * non l'elenco esatto, che cresce con nuovi censimenti.
 */

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VALID_REPOS = new Set(["universal-canvas", "xp-flow"]);
const VALID_STATUSES = new Set(["available-in-template", "used-in-dashboard", "to-extract"]);

describe("catalogo pattern — invarianti di contratto", () => {
  // --- positivo ---
  it("[positive] il catalogo ha almeno 20 voci", () => {
    expect(catalog.length).toBeGreaterThanOrEqual(20);
  });

  it("[positive] ogni voce ha nome e descrizione it/en non vuoti", () => {
    const incomplete = catalog.filter(
      (pattern) =>
        pattern.name.trim() === "" ||
        pattern.description.it.trim() === "" ||
        pattern.description.en.trim() === "",
    );
    expect(incomplete).toEqual([]);
  });

  it("[positive] ogni voce appartiene a una categoria dichiarata in CATEGORIES", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    const known = new Set<string>(CATEGORIES);
    const orphan = catalog.filter((pattern) => !known.has(pattern.category));
    expect(orphan).toEqual([]);
  });

  // --- negativo (nessun valore fuori dal contratto ammesso) ---
  it("[negative] nessuna voce ha uno status fuori dall'enum ammesso", () => {
    const invalid = catalog.filter((pattern) => !VALID_STATUSES.has(pattern.status));
    expect(invalid).toEqual([]);
  });

  it("[negative] nessuna voce punta a un repo sorgente sconosciuto", () => {
    const invalid = catalog.filter((pattern) => !VALID_REPOS.has(pattern.source.repo));
    expect(invalid).toEqual([]);
  });

  // --- edge ---
  it("[edge] nessuna voce ha un source.path vuoto o solo spazi", () => {
    const empty = catalog.filter((pattern) => pattern.source.path.trim() === "");
    expect(empty).toEqual([]);
  });

  it("[edge] ogni id è kebab-case (minuscolo, trattini, nessuno spazio)", () => {
    const malformed = catalog.filter((pattern) => !KEBAB_CASE.test(pattern.id));
    expect(malformed).toEqual([]);
  });

  // --- non regressione ---
  it("[regression] gli id sono univoci: un duplicato da copia-incolla non passa inosservato", () => {
    const ids = catalog.map((pattern) => pattern.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
