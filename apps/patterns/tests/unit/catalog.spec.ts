import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { catalog } from "../../src/catalog/catalog";

/**
 * Invarianti del contratto dati del catalogo pattern (issue #6, ADR 0009).
 * Round 2 (pair-review round 1 bocciata): rimossi i test sulla appartenenza
 * a CATEGORIES/enum status/repo noto — irraggiungibili per tsc, dato che
 * `category: Category`, `status: PatternStatus` e `source.repo: SourceRepo`
 * sono union chiuse: se il file compila, quelle invarianti valgono già
 * (rilievo 6). Il catalogo è "solo dati": qui blindiamo la FORMA delle voci
 * e la presenza reale dei sorgenti, non la distribuzione degli status (che
 * la review ha trovato in parte sbagliata: resta compito dell'implementatore
 * + della prossima review, non di questo file).
 */

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("catalogo pattern — invarianti di contratto", () => {
  // --- positivo ---
  it("[positive] il catalogo ha esattamente 24 voci (censimento 16/08/2026 — inventario: se cambia, il test cambia consapevolmente)", () => {
    expect(catalog.length).toBe(24);
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

// Radice del worktree (contiene apps/dashboard, apps/patterns, docs/...):
// da tests/unit/ si risale di 4 livelli. Usata per risolvere i source.path
// dei pattern con repo "xp-flow" (rilievo 4, pair-review round 1).
const here = dirname(fileURLToPath(import.meta.url));
const WORKTREE_ROOT = resolve(here, "../../../../");

/**
 * Rilievo 4 (pair-review round 1, maggiore): un source.path che punta a un
 * file inesistente è un catalogo bugiardo. Presidiato solo per repo
 * "xp-flow" (dentro questo worktree, path risolto dalla sua radice);
 * "universal-canvas" è un repo separato non checked-out qui (vedi CLAUDE.md
 * di dev/, sezione "gerarchia" / lab xp-flow): skip esplicito e commentato
 * invece di un buco silenzioso nella copertura.
 */
describe("catalogo pattern — source.path presidiati su disco", () => {
  for (const pattern of catalog) {
    if (pattern.source.repo === "universal-canvas") {
      it.skip(`[positive] ${pattern.id}: source.path esiste (repo universal-canvas, fuori da questo worktree)`, () => {});
      continue;
    }

    it(`[positive] ${pattern.id}: source.path esiste su disco (repo xp-flow)`, () => {
      const absolutePath = resolve(WORKTREE_ROOT, pattern.source.path);
      expect(existsSync(absolutePath), `manca ${pattern.source.path}`).toBe(true);
    });
  }
});
