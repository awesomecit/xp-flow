# ADR 0009 — `apps/patterns`: catalogo dei pattern FE come dati, non codice

- Stato: accettata (16/08/2026, piano approvato in sessione — issue #6)
- Decisori: utente + sessione Claude
- Correlate: ADR 0006 (monorepo pnpm), ADR 0005 (multi-tenant, condizionata),
  0008 riservata al verdetto spike beads (retro #2, azione A1)

## Contesto

Il workspace ha già un patrimonio di pattern architetturali FE collaudati
(universal-canvas come template dichiarato, `apps/dashboard` come prodotto
spedito), ma nessun censimento consultabile: chi parte con una nuova app non
sa cosa esiste già. L'utente vuole `apps/` come area di template
architetturali con feature abilitabili, più spazi futuri per i domini
applicativi che li compongono, configurano e deployano.

## Decisione

1. Nasce `apps/patterns`: landing hello-world (React 19 + Tailwind v4,
   Vite SPA minimale, porta dev 8090) che espone il **catalogo dei pattern**.
2. Il catalogo è **solo dati** (`src/catalog/catalog.ts`, modulo TypeScript
   puro tipizzato): ogni voce punta al sorgente reale
   (`source: { repo, path }`) con uno `status` esplicito
   (`available-in-template` / `used-in-dashboard` / `to-extract`).
   **Nessuna copia di implementazioni** cross-repo.
3. L'estrazione vera di un pattern in `packages/` avviene SOLO con trigger
   reale (regola ADR 0006), voce per voce, aggiornando lo `status`.
4. Gli "spazi per dominio" restano fuori da questa slice: nessuna directory
   vuota; quando un dominio nascerà, sarà una nuova app in `apps/` che
   compone i pattern via configurazione (feature flags), con propria ADR.
5. Lo stile di implementazione è fissato in
   `docs/architecture/code-constitution.md` (fonte unica nel repo).

## Conseguenze

- Positivo: zero duplicazione oggi, inventario verificabile dai test
  (invarianti su id, sorgenti, stati), punto d'atterraggio unico per i nuovi
  progetti; la CI cresce solo di un build (`pnpm --filter patterns build`).
- Negativo/accettato: i dati possono invecchiare rispetto a universal-canvas;
  mitigazione slice future (drift check), non ora (YAGNI).
- Alternativa scartata: landing in universal-canvas (vetrina nel template,
  zero duplicazione) — l'utente ha scelto xp-flow `apps/` come area template;
  il vincolo "dati, non codice" ne contiene il costo.
