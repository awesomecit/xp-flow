# 6. Monorepo pnpm e estrazione della dashboard in apps/dashboard

Data: 2026-08-13 · Stato: proposta

## Contesto
La dashboard (prodotto pilota north-star, issue #2) vive in universal-canvas sul
branch `feat/storia-c-dati-reali`, un repo col doppio ruolo template+monitor:
zavorra Lovable (vite config delegato a `@lovable.dev/vite-tanstack-config`,
45/46 componenti shadcn mai importati, ~30 dipendenze orfane) e accoppiamento
fragile col log della fabbrica (`path.resolve(cwd, "../xp-flow/.xpflow/events.jsonl")`,
funziona solo perché i repo sono fratelli in `~/dev`). Le decisioni già registrate
convergono: ROADMAP ("scaffold da universal-canvas come `apps/dashboard` del
monorepo"), diario 12/08 ("universal-canvas resta template; pnpm vincerà allo
scaffold nel monorepo"), ADR 0002 accettata ("dentro un monorepo → `workspace:*`
di pnpm").

## Decisione
1. **xp-flow diventa monorepo pnpm** (`pnpm-workspace.yaml`, `packages: [apps/*]`):
   esegue il livello 1 dell'ADR 0002. Package manager unico del repo: pnpm
   (corepack, campo `packageManager`), Node 22 ovunque (`.nvmrc`, engines, CI).
2. **La UI del monitor si estrae in `apps/dashboard`** portando solo la chiusura
   transitiva degli import dalle 5 route (nucleo sano ~2500 righe: domain, api,
   viste, token bridge M3, test unit+BDD). La zavorra resta fuori per sottrazione:
   preset Lovable sostituito da un vite config scritto a mano.
3. **universal-canvas torna template puro Lovable-driven**: non si ripulisce in
   place, si tagga per scaffold come da ADR 0002; il suo branch
   `feat/storia-c-dati-reali` resta com'è (decisione sul merge parcheggiata).
4. **La CLI resta nel package root** (KISS): spostamento in `packages/cli` solo
   quando nascerà `packages/events` (trigger: estrazione del parser eventi oggi
   duplicato tra CLI e dashboard).
5. **Release flow minimale**: bump semver e CHANGELOG generati da git-cliff sui
   Conventional Commits, tag locale, mai push automatico (gate umano).

## Alternative scartate
- **Cleanup di universal-canvas in place**: mantiene il doppio ruolo
  template+monitor, rompe il round-trip Lovable per i giri di design, e la
  migrazione a monorepo resterebbe in backlog pagandosi due volte.
- **Monorepo nuovo dedicato alla UI**: terzo repo da mantenere, contraddice
  "la dashboard vive accanto al log che legge".
- **bun come package manager**: già in uso su universal-canvas, ma l'ADR 0002
  nomina pnpm per i workspace e i workflow CI template sono già pnpm; superarla
  richiederebbe una nuova ADR senza beneficio concreto.

## Conseguenze
- La dashboard legge `<repoRoot>/.xpflow/events.jsonl` per risalita dalla cwd:
  sparisce il path fratello, `XPFLOW_EVENTS_FILE` resta l'override documentato.
- Gli shared-hooks husky globali (`~/.claude/shared-hooks/`) imparano pnpm
  (modifica additiva, bun/npm invariati per gli altri repo).
- Gli script root orchestrano i workspace (`pnpm -r --if-present run …`): i gate
  di pre-commit coprono CLI e dashboard con un solo comando.
- I doc che dicono "universal-canvas è la sua UI" (`~/dev/CLAUDE.md`,
  `docs/installazione.md`) diventano stantii: congelati fino alla retro #2,
  segnalati con evento `metodo_feedback`.
- Il tag `v0.1.0` di universal-canvas registra la versione del template da cui
  la dashboard è nata; i futuri scaffold (foundation) partiranno dal template
  ripulito, decisione separata.
