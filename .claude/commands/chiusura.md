---
description: Chiusura dell'iterazione (review di prodotto) — storie vs acceptance, demo verificata, velocity, evento sprint/chiuso
argument-hint: [issue/sprint da chiudere, opzionale]
---

# Chiusura iterazione (Sprint Review — guarda al PRODOTTO)

Focus: $ARGUMENTS (se vuoto: lo sprint aperto in `.xpflow/events.jsonl`
e le issue in lavorazione in `TODO.md`)

> Domanda della cerimonia: **"cosa abbiamo costruito e va bene?"**
> Il processo NON si discute qui: ogni osservazione su come abbiamo
> lavorato si logga come `metodo_feedback` e si porta in `/retro`.

## Verifica delle storie (30–60 min)
1. Per ogni storia dell'iterazione: confronta il risultato coi criteri di
   acceptance (Gherkin della spec). Test di acceptance verdi = storia
   accettata; rossi o assenti = storia respinta, torna nel backlog con
   causa scritta.
2. **Demo dal punto di vista dell'utente, davvero**: esegui le istruzioni
   di avvio del README da ambiente pulito (install compreso) e percorri
   il flusso utente principale. Un README che non funziona respinge la
   storia quanto un test rosso (lezione del 17/08: `apps/patterns` ok in
   CI, rotto seguendo il README).
3. Stato esplicito per ogni storia: accettata ✅ / respinta ❌ con causa.

## Velocity e tracking
4. Misura la velocity reale: SP accettati nell'iterazione (i respinti non
   contano). Confrontala con la stima del planning: servirà al prossimo
   planning game.
5. Aggiorna `TODO.md` (Fatto/respinti), `ROADMAP.md` e le issue GitHub.

## Chiusura formale
6. Appendi a `.xpflow/events.jsonl` l'evento di chiusura:
   `{"ts":"...","cmd":"sprint","esito":"chiuso","issue":...,"sp":<SP accettati>,"note":"..."}`.
7. Chiudi gli `azione_manuale` eseguiti con i relativi `manual_done`
   (`ref` = ts dell'evento aperto).
8. Sezione finale "⚠️ Azioni manuali richieste": pendenti e loro età.

## Dopo
9. `/retro` (processo) — poi il planning game apre l'iterazione
   successiva. Tre momenti separati, mai un meeting-fiume.
