# End session — 2026-08-12 sessione 2 (universal-canvas + xp-flow)

## Repo toccati
- `~/dev/universal-canvas` — branch `feat/storia-c-dati-reali` aperto, infra Node 22 + Husky
- `~/dev/xp-flow` — infra Husky + eslint + Node 22 aggiunta (main)
- `~/dev/personal/xp-flow` — **errore di sessione**: file Husky creati nella dir sbagliata
  (la repo reale è in `~/dev/xp-flow`, non in `~/dev/personal/xp-flow`)

## Scoperte e decisioni

### Posizione corretta delle repo personali
Le repo xp-flow e universal-canvas sono in `~/dev/`, NON in `~/dev/personal/`.
La shell CWD si resettava, causando comandi eseguiti nella directory sbagliata.
**Correzione CLAUDE.md globale**: non fare mai assunzioni sul path delle repo;
sempre verificare con `find` o path assoluto prima di cd.

### Node 22 obbligatorio per jsdom ^30
jsdom 30 usa undici ^8 che richiede `v8.markAsUncloneable` (Node 22+).
Soluzione intermedia testata (happy-dom) ma scartata: Node 22 era già installato.
**Salvato in CLAUDE.md globale.**

### Husky multi-repo via shared-hooks
Pattern: ogni repo delega a `~/.claude/shared-hooks/` invece di replicare la logica.
Lo shared hook deve attivare nvm e aggiungere `node_modules/.bin` al PATH —
git hooks non ereditano né nvm né il PATH locale.
**Salvato in CLAUDE.md globale.**

### Test framework: per scopo, non uno solo per tutti
Tentato vitest in xp-flow (CLI Node) per errore di interpretazione richiesta.
Revertito: tap funzionava (30/30), vitest avrebbe aggiunto dipendenze senza valore.
Regola: vitest per UI/React, tap (o test runner nativo) per CLI Node puro.
**Salvato in CLAUDE.md globale.**

### xp-flow CLAUDE.md congelato
Non modificabile fuori da `/retro` (freeze metodo). Decisioni su tech stack
(tap rimane, eslint aggiunto) vanno loggati qui, non nel CLAUDE.md del repo.
Candidato retro #2: aggiungere regola "framework test per scopo" al CLAUDE.md xp-flow.

### universal-canvas UI funzionante con backend reale
- Dev server: porta 8080, risponde 200
- `/api/flow/summary`: legge events.jsonl reale, risponde `{success: true, data: {...}}`
- Eslint `react-refresh/only-export-components` disabilitata (Provider pattern legittimo SSR)
**Salvato in universal-canvas/CLAUDE.md (nuovo file creato).**

## Prossima sessione
- Continuare su `feat/storia-c-dati-reali` in universal-canvas
- Story A (token bridge 3 SP) e Story B (viste 5 SP) ancora da fare
- Entry point: `/stato light` + `/next` da `~/dev/universal-canvas`
