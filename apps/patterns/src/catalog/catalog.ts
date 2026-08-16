/**
 * Catalogo dei pattern architetturali FE del workspace (issue #6, ADR 0009).
 * Modulo "solo dati": nessuna dipendenza da React o da altre infrastrutture.
 * Censimento 16/08/2026 su universal-canvas (template) e apps/dashboard
 * (adozione reale in xp-flow). Le invarianti di forma sono blindate da
 * tests/unit/catalog.spec.ts; qui vive solo l'elenco, che cresce nel tempo.
 */

/** Categorie ammesse per una voce del catalogo. */
export const CATEGORIES = [
  "architecture",
  "data",
  "ui",
  "state",
  "errors",
  "platform",
  "i18n",
  "testing",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Repository sorgente in cui vive l'implementazione del pattern. */
export type SourceRepo = "universal-canvas" | "xp-flow";

/**
 * Stato di adozione del pattern:
 * - `available-in-template`: esiste in universal-canvas, non ancora adottato.
 * - `used-in-dashboard`: già in produzione in apps/dashboard.
 * - `to-extract`: identificato ma non ancora estratto/formalizzato.
 */
export type PatternStatus = "available-in-template" | "used-in-dashboard" | "to-extract";

/** Voce del catalogo: tipo usato sia dai dati sia dai componenti UI. */
export type PatternView = {
  id: string;
  name: string;
  description: { it: string; en: string };
  category: Category;
  source: { repo: SourceRepo; path: string };
  status: PatternStatus;
};

export const catalog: readonly PatternView[] = [
  {
    id: "provider-composition",
    name: "Provider Composition",
    description: {
      it: "Composizione ordinata dei provider React (query, tema, auth...) in un unico punto.",
      en: "Ordered composition of React providers (query, theme, auth...) in a single entry point.",
    },
    category: "architecture",
    source: { repo: "xp-flow", path: "apps/dashboard/src/app/AppProviders.tsx" },
    status: "used-in-dashboard",
  },
  {
    id: "query-state-gate",
    name: "Query State Gate",
    description: {
      it: "Gestisce loading/errore/vuoto di una query in una zona di UI dedicata.",
      en: "Handles loading/error/empty states of a query in a dedicated UI zone.",
    },
    category: "data",
    source: { repo: "xp-flow", path: "apps/dashboard/src/routes/-components/FlowGate.tsx" },
    status: "used-in-dashboard",
  },
  {
    id: "typed-http-client",
    name: "Typed HTTP Client",
    description: {
      it: "Client HTTP tipizzato con envelope, retry e AbortController.",
      en: "Typed HTTP client with envelope, retry and AbortController.",
    },
    category: "data",
    source: { repo: "xp-flow", path: "apps/dashboard/src/api/http.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "unified-error-model",
    name: "Unified Error Model",
    description: {
      it: "Modello di errore unico con boundary React e notifica centralizzata.",
      en: "Single error model with a React boundary and centralized notification.",
    },
    category: "errors",
    source: { repo: "xp-flow", path: "apps/dashboard/src/errors/AppError.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "stateful-msw-scenarios",
    name: "Stateful MSW Scenarios",
    description: {
      it: "Mock HTTP stateful selezionabili a scenario (query ?demo=).",
      en: "Stateful HTTP mocks selectable by scenario (?demo= query).",
    },
    category: "testing",
    source: { repo: "xp-flow", path: "apps/dashboard/src/mocks/handlers.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "zod-contract-validation",
    name: "Zod Contract Validation",
    description: {
      it: "Validazione dei contratti dati con zod a runtime.",
      en: "Runtime data contract validation with zod.",
    },
    category: "data",
    source: { repo: "xp-flow", path: "apps/dashboard/src/domain/contracts.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "responsive-pagination",
    name: "Responsive Pagination",
    description: {
      it: "Paginazione server e client con adattamento responsive.",
      en: "Server and client pagination with responsive adaptation.",
    },
    category: "ui",
    source: { repo: "xp-flow", path: "apps/dashboard/src/routes/-components/usePagination.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "persisted-filter",
    name: "Persisted Filter",
    description: {
      it: "Filtro persistito in URL e storage tra le sessioni.",
      en: "Filter persisted in URL and storage across sessions.",
    },
    category: "state",
    source: {
      repo: "xp-flow",
      path: "apps/dashboard/src/routes/-components/usePersistedFilter.ts",
    },
    status: "used-in-dashboard",
  },
  {
    id: "navigation-registry",
    name: "Navigation Registry",
    description: {
      it: "Registry dichiarativo delle voci di navigazione dell'app.",
      en: "Declarative registry of the app's navigation entries.",
    },
    category: "architecture",
    source: { repo: "xp-flow", path: "apps/dashboard/src/navigation/registry.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "role-based-access-matrix",
    name: "Role-based Access Matrix",
    description: {
      it: "Controllo accessi basato su una matrice ruoli-permessi.",
      en: "Access control based on a roles-permissions matrix.",
    },
    category: "architecture",
    source: { repo: "xp-flow", path: "apps/dashboard/src/auth/roles.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "typed-feature-flags",
    name: "Typed Feature Flags",
    description: {
      it: "Feature flag tipizzati con provider React dedicato.",
      en: "Typed feature flags with a dedicated React provider.",
    },
    category: "architecture",
    source: { repo: "xp-flow", path: "apps/dashboard/src/features/FeatureFlagProvider.tsx" },
    status: "used-in-dashboard",
  },
  {
    id: "multi-tenant-white-label",
    name: "Multi-tenant White-label",
    description: {
      it: "Registry multi-tenant per personalizzare brand e testi per cliente.",
      en: "Multi-tenant registry to customize brand and copy per client.",
    },
    category: "architecture",
    source: { repo: "xp-flow", path: "apps/dashboard/src/tenant/registry.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "typed-i18n-without-library",
    name: "Typed i18n Without a Library",
    description: {
      it: "Internazionalizzazione tipizzata senza libreria esterna.",
      en: "Typed internationalization without an external library.",
    },
    category: "i18n",
    source: { repo: "xp-flow", path: "apps/dashboard/src/i18n/I18nProvider.tsx" },
    status: "used-in-dashboard",
  },
  {
    id: "cloudevents-like-event-bus",
    name: "CloudEvents-like Event Bus",
    description: {
      it: "Event bus in stile CloudEvents con trasporti intercambiabili.",
      en: "CloudEvents-style event bus with interchangeable transports.",
    },
    category: "data",
    source: { repo: "xp-flow", path: "apps/dashboard/src/domain/events.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "console-debug-bridge",
    name: "Console Debug Bridge",
    description: {
      it: "Ponte di debug che espone stato interno alla console del browser.",
      en: "Debug bridge exposing internal state to the browser console.",
    },
    category: "state",
    source: { repo: "xp-flow", path: "apps/dashboard/src/state/debug.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "centralized-query-client",
    name: "Centralized Query Client",
    description: {
      it: "Istanza unica e configurata del query client condivisa dall'app.",
      en: "Single configured query client instance shared across the app.",
    },
    category: "state",
    source: { repo: "xp-flow", path: "apps/dashboard/src/state/queryClient.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "oklch-design-tokens",
    name: "OKLCH Design Tokens",
    description: {
      it: "Token di design in OKLCH con temi dark e light.",
      en: "OKLCH design tokens with dark and light themes.",
    },
    category: "ui",
    source: { repo: "xp-flow", path: "apps/dashboard/src/styles.css" },
    status: "used-in-dashboard",
  },
  {
    id: "custom-design-system-primitives",
    name: "Custom Design System Primitives",
    description: {
      it: "Primitive di design system proprie (pannelli, chip, misuratori).",
      en: "Home-grown design system primitives (panels, chips, meters).",
    },
    category: "ui",
    source: { repo: "xp-flow", path: "apps/dashboard/src/routes/-components/ui.tsx" },
    status: "used-in-dashboard",
  },
  {
    id: "adaptive-app-shell",
    name: "Adaptive App Shell",
    description: {
      it: "Layout applicativo che si adatta a desktop e mobile.",
      en: "Application layout that adapts to desktop and mobile.",
    },
    category: "ui",
    source: { repo: "xp-flow", path: "apps/dashboard/src/routes/-components/AppShell.tsx" },
    status: "used-in-dashboard",
  },
  {
    id: "runtime-form-factor-detection",
    name: "Runtime Form Factor Detection",
    description: {
      it: "Rilevamento a runtime del form factor del dispositivo.",
      en: "Runtime detection of the device's form factor.",
    },
    category: "platform",
    source: { repo: "xp-flow", path: "apps/dashboard/src/platform/platform.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "accessible-tooltip",
    name: "Accessible Tooltip",
    description: {
      it: "Tooltip accessibile per suggerimenti contestuali.",
      en: "Accessible tooltip for contextual hints.",
    },
    category: "ui",
    source: { repo: "universal-canvas", path: "src/components/Hint.tsx" },
    status: "available-in-template",
  },
  {
    id: "bdd-e2e-shared-world",
    name: "BDD E2E Shared World",
    description: {
      it: "Test e2e BDD con un world condiviso tra gli step.",
      en: "BDD e2e tests with a world shared across steps.",
    },
    category: "testing",
    source: { repo: "xp-flow", path: "apps/dashboard/tests/e2e/fixtures.ts" },
    status: "used-in-dashboard",
  },
  {
    id: "mock-service-worker-gate",
    name: "Mock Service Worker Gate",
    description: {
      it: "Gate che attiva il mock worker prima del render dell'app.",
      en: "Gate that starts the mock worker before the app renders.",
    },
    category: "platform",
    source: { repo: "xp-flow", path: "apps/dashboard/src/app/MockGate.tsx" },
    status: "used-in-dashboard",
  },
  {
    id: "monorepo-view-scaffold",
    name: "Monorepo View Scaffold",
    description: {
      it: "Convenzioni per aggiungere una nuova vista al monorepo.",
      en: "Conventions for adding a new view to the monorepo.",
    },
    category: "architecture",
    source: { repo: "xp-flow", path: "apps/dashboard/src/routes/README.md" },
    status: "used-in-dashboard",
  },
];
