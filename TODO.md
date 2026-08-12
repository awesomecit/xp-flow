# TODO — XP Flow

> Fonte di verità operativa insieme a issue GitHub e .xpflow/events.jsonl. Item stimati in SP Fibonacci.

## Prossimo sprint (2 giorni)
- [ ] #1 Event log JSONL + comando `xpflow status` — **3 SP** (good first issue)
  - [ ] `src/events.ts`: appendEvent con pino → .xpflow/events.jsonl — 1 SP
  - [ ] `src/status.ts` + `bin/xpflow.ts`: lettura, aggregazione, output CLI — 2 SP

## In coda
- [ ] #2 Dashboard di controllo slice 1: web read-only su events.jsonl (sprint attivo, serve-da-te, timeline) — ~5-8 SP, stima in /brainstorm (PRODOTTO PILOTA: north-star; dipende da #1)
- [ ] Setup docs-as-code Fase 1 (mkdocs + Action + Pages) — 2 SP
- [ ] Import tecniche brainstorming BMAD in /brainstorm — 2 SP
- [ ] Regole dependency-cruiser boundary DDD — 3 SP

## Fatto
(vuoto — si popola dal flusso)

## Deprecato
- ~~#2 Life Quest slice 1: cron 21:45 controllo giornata + notifica Telegram — 5 SP~~ (pilota cambiato)
