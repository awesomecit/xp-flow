---
description: Retrospettiva automatizzata di fine settimana (dopo 2 sprint da 2 giorni)
argument-hint: [intervallo, default ultimi 7 giorni]
---

# Retrospettiva automatizzata

Periodo: $ARGUMENTS (default: ultimi 7 giorni)

## Raccolta dati (automatica)
1. `git log` del periodo: commit, frequenza, dimensione media, revert/fix.
2. Issue GitHub: aperte/chiuse nel periodo, SP stimati vs effettivi (dai riferimenti nei commit).
3. `TODO.md` e `ROADMAP.md`: item pianificati vs completati, slittamenti.
4. Test: numero, eventuali flaky segnalati nelle `/pair-review`, tempo di esecuzione.
5. Metriche qualità disponibili (complessità cognitiva dal pre-push, esiti lint).

## Analisi
6. **Prima di tutto, la north-star**: quanti incrementi di PRODOTTO sono stati rilasciati questa settimana? (infrastruttura della fabbrica non conta). Se zero per 2 settimane consecutive: proponi tagli dalla Kill-list in ROADMAP.md, non estensioni.
7. Rivedi gli eventi `metodo_feedback` accumulati: la retro è l'UNICO momento in cui il metodo si può modificare.
8. Cosa è andato bene / cosa no / cosa mi ha sorpreso (dati alla mano, non impressioni).
9. Accuratezza delle stime Fibonacci: pattern di sotto/sovrastima per tipo di task.
10. Una sola causa radice prioritaria da attaccare (non una lista della spesa).

## Output
11. Scrivi `docs/retro/YYYY-WW.md` con: dati, analisi, **massimo 3 azioni concrete** per la settimana successiva, ciascuna con criterio di verifica.
12. Aggiorna la memoria di progetto (CLAUDE.md o memoria agente) se emergono regole nuove stabili.
13. Riporta in `TODO.md` le azioni della retro come item del prossimo sprint e appendi l'evento retro a `.xpflow/events.jsonl`.
14. Sezione finale "⚠️ Azioni manuali richieste": elenca gli eventi `azione_manuale` pendenti e da quanto tempo lo sono; se qualcuno è pendente da >1 settimana, proponilo come primo item del prossimo sprint.
