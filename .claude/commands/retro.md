---
description: Retrospettiva di processo (dopo la /chiusura) — come abbiamo lavorato, causa radice, max 3 azioni
argument-hint: [intervallo, default dalla retro precedente]
---

# Retrospettiva (guarda al PROCESSO)

Periodo: $ARGUMENTS (default: dalla retro precedente in `docs/retro/`)

> Domanda della cerimonia: **"come possiamo lavorare meglio?"**
> Il prodotto NON si discute qui: acceptance, demo e velocity arrivano
> già verificati dalla `/chiusura`. Se la chiusura non è stata fatta,
> falla prima — fondere le due cerimonie fa mangiare alla discussione
> di prodotto il tempo della riflessione di processo.

## Raccolta dati (automatica)
1. Output della `/chiusura`: storie accettate/respinte, velocity reale
   vs stimata (eventi `sprint/chiuso` nel log).
2. `git log` del periodo: commit, frequenza, dimensione media, revert/fix.
3. Esito delle azioni della retro precedente (da `docs/retro/` più
   recente): fatte/non fatte, coi criteri di verifica dichiarati.
4. Eventi `metodo_feedback` accumulati: la retro è l'UNICO momento in
   cui il metodo si può modificare.
5. Test/quality: flaky segnalati nelle `/pair-review`, esiti lint,
   attriti con hook e permessi.

## Analisi
6. **Prima di tutto, la north-star** (dato dalla /chiusura): quanti
   incrementi di PRODOTTO rilasciati? Se zero per 2 settimane
   consecutive: proponi tagli dalla Kill-list in ROADMAP.md, non
   estensioni.
7. Cosa continuare / cosa smettere / cosa provare — dati alla mano, non
   impressioni.
8. Accuratezza delle stime Fibonacci: pattern di sotto/sovrastima.
9. **Una sola causa radice prioritaria** da attaccare (non una lista
   della spesa).

## Output
10. Scrivi `docs/retro/YYYY-WW.md` con: dati, analisi, decisioni
    dell'utente (via domande esplicite, con opzioni e trade-off),
    **massimo 3 azioni concrete** ciascuna con criterio di verifica.
11. Regole nuove stabili → promosse nel CLAUDE.md del repo (solo qui si
    possono toccare i file di metodo).
12. Riporta in `TODO.md` le azioni come item del prossimo sprint e
    appendi l'evento `retro` a `.xpflow/events.jsonl`.
13. Sezione finale "⚠️ Azioni manuali richieste": pendenti e loro età;
    se qualcuna è pendente da >1 settimana, proponila come primo item
    del prossimo sprint.

## Dopo
14. Planning game della nuova iterazione, informato da velocity
    (/chiusura) e azioni (/retro): si sceglie il contenuto dello sprint
    e si appende `sprint/avviato`.
