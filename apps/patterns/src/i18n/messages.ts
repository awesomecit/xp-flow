/**
 * Modulo i18n minimale per la landing del catalogo pattern (issue #6).
 * Nessuna stringa visibile all'utente va hardcodata nei componenti: tutte
 * passano da qui. Locale di default `it`, `en` sempre disponibile (regola
 * 7 della costituzione di stile). Nessun provider/selettore di lingua:
 * fuori scope per questa slice (YAGNI), i componenti leggono direttamente
 * `messages[DEFAULT_LOCALE]`.
 */

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
    },
  },
};
