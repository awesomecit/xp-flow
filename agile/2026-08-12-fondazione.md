# 2026-08-12 — Fondazione: nascita della fabbrica e del primo prodotto

> Consolidato il 18/08 (pulizia post-retro #3) dai tre file del 12/08:
> `2026-08-12.md`, `-end-session.md`, `-end-session-2.md` — originali in
> `archive/` (gitignorata). Un file per giornata, duplicati potati.

## TL;DR

Montata la fabbrica (repo xp-flow su GitHub, permessi, gh+SSH, comandi
cerimonia, estensioni): Fase 0 setup completa. Il flusso è partito
davvero: `/brainstorm #1` chiuso con test RED verificati e primi eventi
nel log. Pilota di prodotto cambiato: non più Life Quest ma la
**Dashboard di controllo** (issue #2), con design pronto (19 mockup
Stitch), boilerplate template (`universal-canvas` v0.1.0) e strategia di
riuso formalizzata (ADR 0002).

## History di sviluppo (commit del giorno)

- **xp-flow** (nato oggi): scaffold kit → settings+hook → config VS
  Code/markdownlint → spunte ROADMAP → mockup Stitch → promozione pilota
  #2 → ADR 0002 riuso/versioning. La sessione sprint ha prodotto
  `package.json`, `Dockerfile`, `features/`, `test/`,
  `.xpflow/events.jsonl`, `.nvmrc→22` (stack: tap v18 nativo TS, pino,
  Node 22). Issue #1 chiusa in giornata. Sessione 2: infra Husky +
  eslint + Node 22 su main.
- **universal-canvas**: fix CI npm→bun (`e6e7ddb`), tag `v0.1.0`,
  marcato template repository; branch `feat/storia-c-dati-reali` aperto;
  UI verificata con backend reale (dev server 8080, `/api/flow/summary`
  legge events.jsonl vero). Brief Lovable consolidato come commento su
  universal-canvas#1.
- **personal** (repo nato oggi): diario+toolchain versionati.

## Decisioni (perché in una riga; dettagli negli ADR/ROADMAP)

1. **Pilota = Dashboard di controllo** (issue #2, 3 slice: read-only →
   interazione → Telegram): dichiarata PRODOTTO per la north-star pur
   servendo la fabbrica.
2. **Riuso a 3 livelli** (ADR 0002): workspace pnpm nel monorepo · git
   tag semver tra repo pre-prod (MAI branch) · GitHub Packages dal primo
   deploy prod.
3. **universal-canvas resta template** (non si sposta, non si rinomina):
   il monitor nasce per duplicazione del progetto Lovable.
4. **CI del boilerplate su bun** finché è Lovable-driven; pnpm vincerà
   allo scaffold nel monorepo.
5. **Vincolo trasversale cloud-ready** in ROADMAP: logging strutturato
   GKE-compatible, healthz, SIGTERM, config via env — dal primo servizio.
6. Identity personale ovunque: **Cit / awesome.cit.dev@gmail.com**, push
   via alias SSH `github-antonio`, gh loggato come awesomecit.
7. **Test framework per scopo, non uno per tutti**: tentato vitest su
   xp-flow (CLI Node) per errore, revertito — tap funzionava (30/30).
   Regola: vitest per UI/React, tap per CLI Node puro (promossa nel
   CLAUDE.md globale).

## Scoperte e lezioni

- Setup SSH personale a metà dal 30/07: chiave mai registrata su GitHub.
  Lezione: verificare l'handshake (`ssh -T`), non l'esistenza dei file.
- "Server accepts key" + Permission denied = passphrase non sbloccabile
  in shell non interattiva → agent/keychain, non un'altra chiave.
- **Posizione repo**: xp-flow e universal-canvas sono in `~/dev/`, NON
  in `~/dev/personal/` — file Husky creati nella dir sbagliata per
  un'assunzione sul path. Correzione promossa nel CLAUDE.md globale:
  mai assumere il path, verificare prima di cd.
- **Node 22 obbligatorio** per jsdom ^30 (undici ^8 →
  `v8.markAsUncloneable`); happy-dom testato e scartato. Nel CLAUDE.md
  globale.
- **Husky multi-repo via shared-hooks** (`~/.claude/shared-hooks/`): i
  git hook non ereditano né nvm né il PATH locale — lo shared hook li
  attiva da sé. Nel CLAUDE.md globale.
- markdownlint in conflitto con lo stile del kit: risolto come config di
  tooling a 2 livelli, fuori dal perimetro del freeze.
- **metodo_feedback dal flusso**: brainstorm con `t.todo` + `import
  type` non produce test RED (skippati) — il fix è import di valore da
  moduli inesistenti; /brainstorm deve verificare exit code 1.
- Gli export Stitch includono i token colore completi: la fedeltà di
  stile in Lovable si ottiene installando i token come tema PRIMA delle
  viste.
- **fe-developer bloccato dalla freeze rule**: bisogno emerso prima
  della retro, interim con implementatore+test-writer, candidato retro.
- **Gap mid-sprint**: nessun percorso strutturato per scoperte/tech-debt
  durante l'implementazione (candidato `/nota`) — in TODO.
- **5 tech debt nel parser eventi** (issue #1), tutti in TODO "In coda":
  chiusura sprint, `reviewPending`, `appendFileSync` non thread-safe,
  nessun comando per `sprint/avviato`, pino inutilizzato.
- xp-flow CLAUDE.md congelato fuori da /retro: decisioni tech loggata
  nel diario/TODO, non nel file di metodo.

## Deprecato (cosa → perché → sostituto)

- **Life Quest come pilota** → cambio di priorità → Dashboard (#2).
- **Identity antonio.cittadino23@gmail.com** → repo personali su account
  Cit → commit iniziali rifatti su branch orphan.
- **`gh repo create --push`** (dal README del kit) → violava "mai push
  automatico" → repo creati da web/gh, push umano.
- **CI npm su universal-canvas** → lockfile bun.lock, run rossi → CI bun.
- **settings-permessi.json come file attivo** → è documentazione → il
  vero è `.claude/settings.json`.
- **Brief/prompt operativi Stitch e Lovable** (i tre file `-brief-*` e
  `-prompt-*` del 12/08) → superati dagli eventi: la dashboard è stata
  costruita e vive in `apps/dashboard` (ADR 0006), il giro Lovable è
  rimasto al template → in `archive/` (pulizia post-retro #3, 18/08).

## Pendenze dell'epoca (storiche — poi chiuse nei giorni successivi)

Push xp-flow e universal-canvas, tag, duplicazione progetto Lovable,
rotazione passphrase SSH candidata. Ripartenza prevista: chiudere #1,
poi `/brainstorm #2` — andata esattamente così (v. event log e retro
2026-33).
