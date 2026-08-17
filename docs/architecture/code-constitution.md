# Costituzione di stile del codice — xp-flow

> Fonte unica nel repo per lo stile di implementazione (decisa il 16/08/2026,
> issue #6). Visibile anche agli agenti headless/CI che vedono solo il repo.
> La promozione di queste regole nel CLAUDE.md del repo e la loro
> trasformazione in gate eseguibili (dependency-cruiser, sonarjs, jscpd)
> restano un item in TODO da ratificare in /retro.

## Architettura

1. **Dipendenze sempre verso l'interno**: il dominio/business logic non
   importa mai driver o SDK infrastrutturali (client HTTP, storage,
   framework UI). Le dipendenze esterne entrano tramite interfacce/porte
   definite internamente; l'infrastruttura implementa adapter.
   Esempio vivo: `apps/dashboard/src/domain/` è puro, zero React.
2. **Directory e file rispecchiano l'architettura**: organizzazione per
   capability (`catalog/`, `components/`, `i18n/`, `domain/`, `api/`…), non
   per tipo tecnico. Se la struttura non racconta il design, è sbagliata.
3. **SOLID e clean code dove servono**: leggibile prima che "furbo";
   funzioni piccole, superfici ridotte, contratti espliciti. Niente
   astrazioni preventive: KISS/YAGNI vincono, la complessità richiede un
   trigger registrato (ADR).
4. **Componenti UI a file singolo**: un export nominale principale,
   sotto-componenti privati nello stesso file, commento-doc in italiano in
   testa che dichiara responsabilità e regole. Niente barrel per i
   componenti; barrel `index.ts` solo per moduli di dominio/infra.

## Lingua e naming

5. **Inglese** per: identificatori (variabili, funzioni, tipi, componenti),
   nomi di cartelle e file, path/route UI visibili nel browser, campi dati.
   Convenzioni idiomatiche dello stack (camelCase, PascalCase per
   componenti/tipi, kebab-case per file non-componente e per gli id dati).
6. **Italiano** per: commenti nel codice, descrizioni di comandi/agenti,
   commit (Conventional Commits), documentazione e ADR.
7. **i18n sempre, di default**: nessuna stringa visibile all'utente
   hardcodata nei componenti; testi via modulo i18n tipizzato (locale
   default `it`, almeno `en` disponibile). Vale anche per le app minime:
   il costo è basso all'inizio e altissimo dopo.

## Qualità

8. **TypeScript strict, ESM**, mai CommonJS.
9. **TDD top-down**: test fallimentare prima; l'implementatore non modifica
   i test esistenti; pair-review adversarial prima di chiudere.
10. **Mai dichiarare completato senza stato esplicito**: test, lint,
    typecheck, tracking sincronizzato, evento loggato.
