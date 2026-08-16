import { describe, expect, it } from "vitest";

import { interpolate, lookup, resolveCatalog } from "@/i18n/resolve";

/**
 * Esempio di suite unit con le 4 categorie obbligatorie:
 * positivo / negativo / edge case / non regression.
 */
describe("i18n resolveCatalog", () => {
  // --- positivo ---
  it("[positive] applica l'override del tenant sul locale richiesto", () => {
    const catalog = resolveCatalog("en", "globex");
    expect(catalog.common.appName).toBe("Globex Portal");
  });

  // --- negativo ---
  it("[negative] una chiave inesistente non lancia e restituisce undefined", () => {
    const catalog = resolveCatalog("it", "default");
    expect(lookup(catalog, "non.esiste")).toBeUndefined();
  });

  // --- edge case ---
  it("[edge] senza override del tenant si ricade sul catalogo di locale", () => {
    const catalog = resolveCatalog("en", "globex");
    expect(catalog.common.save).toBe("Save");
  });

  it("[edge] una chiave non tradotta ricade sul locale di default (it)", () => {
    const catalog = resolveCatalog("en", "acme");
    expect(catalog.notifications.title).toBeTruthy();
  });

  // --- non regression ---
  it("[regression] la cache non fa leakare gli override tra tenant diversi", () => {
    resolveCatalog("it", "acme");
    expect(resolveCatalog("it", "default").common.appName).toBe("Piattaforma");
  });
});

describe("i18n interpolate", () => {
  it("[positive] sostituisce i placeholder", () => {
    expect(interpolate("Ciao {name}", { name: "Ada" })).toBe("Ciao Ada");
  });

  it("[negative] lascia intatto un placeholder senza valore", () => {
    expect(interpolate("Ciao {name}")).toBe("Ciao {name}");
  });

  it("[edge] gestisce placeholder ripetuti e valori numerici", () => {
    expect(interpolate("{n}+{n}", { n: 2 })).toBe("2+2");
  });
});
