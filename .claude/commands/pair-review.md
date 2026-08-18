---
description: Fase 2.3 — Review adversarial in pair dei test per ridurre i flaky
argument-hint: [path dei test o scenario, opzionale]
---

# Pair review adversarial dei test

Target: $ARGUMENTS (se vuoto: i test toccati nell'ultimo ciclo)

**Precondizione** (ordine delle fasi, retro #3): esiste uno scenario in
lavorazione nello sprint aperto (`sprint/avviato` nel log senza `chiuso`
successivo). Se manca, FERMATI e segnala: la review certifica lavoro di
sprint, non lavoro fuori ciclo.

Usa il Task tool per lanciare un **subagente reviewer indipendente** (ruolo adversarial) con questo mandato:

1. Cerca attivamente motivi per cui ogni test potrebbe essere **flaky**: dipendenze da timing/sleep, ordine di esecuzione, stato condiviso tra test, rete o servizi reali non mockati, date/random non controllati, race condition.
2. Verifica che i test testino il **comportamento** (acceptance criteria Gherkin), non l'implementazione.
3. Controlla la copertura dei casi: positivi, negativi, edge, non regressione. Segnala i buchi.
4. Verifica che i mock MSW siano **stateful** e coerenti con lo stato del sistema.
5. Prova a proporre almeno un input/scenario che romperebbe il codice ma che nessun test copre.

L'agente implementatore risponde punto per punto: accetta e corregge, oppure motiva il rigetto.
Chiusura solo quando il reviewer non ha più obiezioni bloccanti. Riporta il verdetto finale in chat: obiezioni trovate, corrette, rigettate (con motivo).

**Il verdetto lascia SEMPRE traccia nel log** (vocabolario canonico, retro #3) —
approvata: `{"ts":"...","cmd":"pair-review","issue":...,"esito":"chiuso","note":"round N: ..."}` ·
bocciata: `{"ts":"...","cmd":"pair-review","issue":...,"esito":"bloccato","note":"round N, bloccanti: ..."}`.
