# TODO — XP Flow

> Fonte di verità operativa insieme a issue GitHub e .xpflow/events.jsonl. Item stimati in SP Fibonacci.

## Prossimo sprint (2 giorni)
- [ ] #2 Dashboard di controllo slice 1: web read-only su events.jsonl — 12 SP da /pianifica (PRODOTTO PILOTA: north-star; dipende da #1 ✅)
  - Epica operativa: [universal-canvas#1](https://github.com/awesomecit/universal-canvas/issues/1) — A token bridge 3 SP · B stile viste 5 SP · C dati reali 3 SP · D cleanup 1 SP
  - ⏸️ in attesa: fine giro Lovable + pull, poi si parte da A

## In coda
- [ ] Setup docs-as-code Fase 1 (mkdocs + Action + Pages) — 2 SP
- [ ] Import tecniche brainstorming BMAD in /brainstorm — 2 SP
- [ ] Regole dependency-cruiser boundary DDD — 3 SP
- [ ] Tech debt #1 — sprint mai chiuso: aggiungere evento `sprint/chiuso` e resettare `sprintAttivo` di conseguenza — 1 SP
- [ ] Tech debt #2 — `reviewPending` sempre vuoto: implementare o rimuovere il campo da SprintStatus — 1 SP
- [ ] Tech debt #3 — `appendFileSync` non thread-safe con più agenti in parallelo: valutare lock o stream — 2 SP
- [ ] Tech debt #4 — nessun comando CLI che appende `sprint/avviato`: oggi va scritto a mano — 1 SP
- [ ] Tech debt #5 — `pino` installato ma non usato: rimuovere o usare per logging CLI — 1 SP
- [ ] Metodo — gap mid-sprint: valutare comando `/nota` o campo `tech_debt` nell'event log (candidato retro #2)

## Fatto
- [x] #1 Event log JSONL + comando `xpflow status` — 3 SP ✅

## Deprecato
- ~~Life Quest slice 1: cron 21:45 controllo giornata + notifica Telegram~~ (pilota cambiato)
