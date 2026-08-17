/**
 * Modulo i18n minimale per la landing del catalogo pattern (issue #6).
 * Nessuna stringa visibile all'utente va hardcodata nei componenti: tutte
 * passano da qui. Locale di default `it`, `en` sempre disponibile (regola
 * 7 della costituzione di stile). Nessun provider/selettore di lingua:
 * fuori scope per questa slice (YAGNI), i componenti leggono direttamente
 * `messages[DEFAULT_LOCALE]`.
 *
 * `catalog.category`/`catalog.status` sono `Record` completi sulle union
 * chiuse `Category`/`PatternStatus` del catalogo (rilievo 1, pair-review
 * round 1, bloccante): se una categoria o uno stato viene aggiunto al
 * catalogo senza la relativa etichetta, il file smette di compilare invece
 * di renderizzare uno slug grezzo a runtime.
 */
import type { Category, PatternStatus } from "../catalog/catalog";

export const LOCALES = ["it", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "it";

export type Messages = {
  landing: {
    title: string;
    subtitle: string;
  };
  catalog: {
    categoryFilterLabel: string;
    statusFilterLabel: string;
    allOption: string;
    emptyState: string;
    category: Record<Category, string>;
    status: Record<PatternStatus, string>;
  };
};

export const messages: Record<Locale, Messages> = {
  it: {
    landing: {
      title: "Catalogo pattern FE",
      subtitle: "I pattern architetturali riusabili del workspace, in un unico posto.",
    },
    catalog: {
      categoryFilterLabel: "Categoria",
      statusFilterLabel: "Stato",
      allOption: "Tutte",
      emptyState: "Nessun pattern corrisponde ai filtri selezionati.",
      category: {
        architecture: "Architettura",
        data: "Dati",
        ui: "UI",
        state: "Stato",
        errors: "Errori",
        platform: "Piattaforma",
        i18n: "i18n",
        testing: "Test",
      },
      status: {
        "available-in-template": "Disponibile nel template",
        "used-in-dashboard": "In uso nella dashboard",
        "to-extract": "Da estrarre",
      },
    },
  },
  en: {
    landing: {
      title: "FE Pattern Catalog",
      subtitle: "The workspace's reusable architectural patterns, in one place.",
    },
    catalog: {
      categoryFilterLabel: "Category",
      statusFilterLabel: "Status",
      allOption: "All",
      emptyState: "No pattern matches the selected filters.",
      category: {
        architecture: "Architecture",
        data: "Data",
        ui: "UI",
        state: "State",
        errors: "Errors",
        platform: "Platform",
        i18n: "i18n",
        testing: "Testing",
      },
      status: {
        "available-in-template": "Available in template",
        "used-in-dashboard": "Used in dashboard",
        "to-extract": "To extract",
      },
    },
  },
};
