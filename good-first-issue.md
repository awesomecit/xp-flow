# Good first issue #1 — Event log + comando `xpflow status`

> Da creare con:
> `gh issue create --title "Event log JSONL + comando xpflow status" --label "good first issue,feature" --body-file good-first-issue.md`

## Problema (linguaggio profano)
Quando lavoro con il team di agenti non ho un posto unico dove vedere "a che punto siamo": quale sprint è attivo, quali scenari sono chiusi, quali review sono in sospeso, quanti story point ho bruciato. Le informazioni esistono ma sono sparse tra chat, TODO e issue.

## MVP desiderato
Ogni comando del flusso (/brainstorm, /sprint, /pair-review, /retro) appende una riga JSON a `.xpflow/events.jsonl`. Un comando `xpflow status` legge il file e stampa lo stato corrente in terminale, incluse le azioni manuali pendenti (eventi `azione_manuale` senza `manual_done`). Questo file sarà anche la sorgente dati della futura dashboard di controllo.

## Formato evento
```json
{"ts":"2026-08-25T09:30:00+02:00","cmd":"sprint","issue":1,"sp":3,"esito":"in_corso","note":"scenario 2/3"}
```

## Acceptance criteria (bozza Gherkin — da raffinare in /brainstorm)
```gherkin
Funzionalità: Stato del flusso di sviluppo
  Come sviluppatore
  Voglio vedere lo stato corrente di sprint, scenari e review
  Per capire subito dove sono e cosa è bloccato

  Scenario: stato con sprint attivo (positivo)
    Dato un event log con uno sprint aperto sull'issue 1 e 2 scenari chiusi su 3
    Quando eseguo "xpflow status"
    Allora vedo l'issue attiva, gli scenari 2/3 e gli SP bruciati vs stimati

  Scenario: nessun evento (negativo)
    Dato un event log assente o vuoto
    Quando eseguo "xpflow status"
    Allora vedo "nessuno sprint attivo" e il comando esce con codice 0

  Scenario: riga corrotta nel log (edge)
    Dato un event log con una riga JSON non valida
    Quando eseguo "xpflow status"
    Allora la riga corrotta viene ignorata con un avviso e lo stato si calcola sulle righe valide

  Scenario: non regressione sul formato
    Dato un evento con campi extra sconosciuti
    Quando eseguo "xpflow status"
    Allora i campi extra vengono ignorati senza errori
```

## Definition of Ready
- [ ] Scenari Gherkin raffinati e stimati (proposta: 3 SP)
- [ ] Formato evento validato dal solution-architect (ADR breve)
- [ ] E2E rossi scritti dal test-writer

## Definition of Done
- [ ] TDD top-down completato, test verdi, lint ok
- [ ] Pair-review adversarial superata senza obiezioni bloccanti
- [ ] Changelog per-task compilato, PR con `Closes #1`
- [ ] Evento di chiusura presente nel log (il comando traccia se stesso)

## Perché è la prima issue giusta
Attraversa l'intero flusso (brainstorm → spec → E2E → TDD → pair-review → merge → retro) su un dominio piccolo (3 SP), non ha dipendenze esterne, e produce l'infrastruttura dati che serve a tutto il resto (dashboard, retro automatizzata).
