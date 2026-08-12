# 2. Riuso e versioning dei pacchetti tra progetti

Data: 2026-08-12 · Stato: accettata

## Contesto
Più progetti personali (xp-flow, xp-flow-monitor, futuri prodotti) devono condividere
codice (es. `packages/events`) e un template UI (`universal-canvas`). Non siamo in
produzione: un registry dedicato oggi è overhead non giustificato (KISS/YAGNI),
ma senza regole il riuso informale degenera in dipendenze non riproducibili.

## Decisione
Riuso a tre livelli, dal più semplice che copre il caso:
1. **Dentro un monorepo** → `workspace:*` di pnpm. Nessuna pubblicazione.
2. **Tra repo separati, pre-prod** → dipendenze da **git tag semver**
   (`git+ssh://…#semver:^x.y`). Regola non negoziabile: **mai dipendere da un
   branch** (`#main` vietato) — solo tag. I tag li produce il flusso (bump
   semver da Conventional Commits, git-cliff), non si creano a mano.
3. **Da primo deploy in produzione** → **GitHub Packages** (registry npm privato
   dell'account): trigger esplicito, migrazione = cambio di una riga di dependency.

I **template** (universal-canvas) non si consumano come pacchetti ma per scaffold;
si taggano comunque (`v0.x.y`) così ogni app registra la versione del template da
cui è nata.

## Alternative scartate
- **Registry da subito (GitHub Packages/Verdaccio)**: infrastruttura e auth token
  per un solo consumatore — costo senza beneficio oggi.
- **Dipendenze da branch git**: zero setup ma build non riproducibili; è la
  bad practice che questa ADR vieta esplicitamente.

## Conseguenze
- I pacchetti condivisi devono buildarsi all'install (script `prepare`); in un
  monorepo i tag di package sono prefissati (`events-v0.2.0`).
- La CI dei consumatori richiede accesso SSH ai repo privati finché si è al livello 2.
- Al passaggio in prod la migrazione al registry è pianificata, non subita.
