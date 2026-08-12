# 2026-08-12 — Brief mockup dashboard XP Flow (Google Stitch)

> Input per i mockup su Google Stitch. Rientrerà nel flusso via `/brainstorm`
> come issue "dashboard di controllo" (dopo la #1, che ne costruisce la fonte dati).

## Vincolo fondante (da ripetere a Stitch in ogni prompt)
Ogni widget deve essere derivabile da UNA sola fonte dati: `.xpflow/events.jsonl`,
righe JSON append-only con schema:

```json
{"ts":"2026-08-25T09:30:00+02:00","cmd":"sprint","issue":1,"sp":3,"esito":"in_corso","note":"scenario 2/3"}
```

- `cmd`: brainstorm · sprint · pair-review · retro · manual_done · metodo_feedback
- `esito`: in_corso · chiuso · azione_manuale · escalation · bloccato
- ⚠️ Schema PROVVISORIO: sarà validato dal solution-architect nell'ADR della
  issue #1 — mockup flessibili sui nomi dei campi.
- Niente widget che richiedono dati non presenti nel log.

## Utente e contesto d'uso
Una sola persona, ruolo stakeholder/product owner: non esegue, supervisiona e
sblocca gate. Consultazione rapida 2-3 volte al giorno, anche da mobile.
Domanda a cui rispondere in 5 secondi: "a che punto siamo e serve qualcosa da me?"

## Schermata unica (priorità 1) — 5 zone

```text
┌─────────────────────────────────────────────────┐
│ A. SPRINT ATTIVO (hero)                         │
│    issue #1 · timebox 2gg (countdown) ·         │
│    scenari 2/3 · burndown SP 2/3 bruciati       │
├────────────────────────┬────────────────────────┤
│ B. SERVE DA TE 🔴      │ C. PIPELINE DEL FLUSSO │
│    azioni manuali      │    brainstorm→sprint→  │
│    pendenti, con       │    pair-review→retro   │
│    istruzione precisa  │    (stato per fase,    │
│    (vuoto = verde)     │    review pending)     │
├────────────────────────┴────────────────────────┤
│ D. NORTH-STAR: incrementi prodotto/settimana    │
│    (contatore + streak + countdown 30/09)       │
├─────────────────────────────────────────────────┤
│ E. TIMELINE EVENTI (feed filtrabile per cmd/    │
│    esito, ordinato per ts desc)                 │
└─────────────────────────────────────────────────┘
```

- **A — Sprint attivo**: issue, SP stimati vs bruciati (mini burndown), scenario
  corrente da `note`. Empty state OBBLIGATORIO: "nessuno sprint attivo"
  (caso Gherkin negativo della issue #1).
- **B — Serve da te**: la zona visivamente più forte. Eventi `azione_manuale`
  senza `manual_done` corrispondente; ogni card = istruzione precisa + da quanto
  pende. Unico punto in cui la dashboard "chiama" l'utente.
- **C — Pipeline**: le 4 fasi del ciclo con stato (fatta/in corso/in attesa);
  evidenza per pair-review pending e obiezioni bloccanti aperte.
- **D — North-star**: 1 incremento di prodotto/settimana; contatore settimana,
  streak, countdown al 30/09. Distinzione visiva prodotto vs infrastruttura
  (solo il prodotto conta).
- **E — Timeline**: feed grezzo filtrabile, badge warning per righe corrotte
  ignorate (edge case issue #1).

## Schermata secondaria (priorità 2) — Retro & metodo
- Eventi `metodo_feedback` accumulati (count + lista): carburante della prossima retro.
- Accuratezza stime: SP stimati vs effettivi per issue chiusa, scostamento per tipo di task.
- Escalation di modello loggati (regola → task → esito, dalle 5 regole della
  Model Routing Policy).

## Cosa NON mockuppare (già coperto altrove — buy-vs-build)
- Consumo token/costi per modello, sessioni → Grafana + OTel (Fase 3).
- Board delle issue → GitHub Issues è la fonte di verità.
- Metriche qualità codice (lint, complessità) → escono dal pre-push, non dal log.

## Dati di esempio realistici

```json
{"ts":"2026-08-13T09:10:00+02:00","cmd":"brainstorm","issue":1,"sp":3,"esito":"chiuso","note":"4 scenari Gherkin, stima 3 SP"}
{"ts":"2026-08-13T11:30:00+02:00","cmd":"sprint","issue":1,"sp":3,"esito":"in_corso","note":"scenario 1/4: stato con sprint attivo"}
{"ts":"2026-08-13T14:05:00+02:00","cmd":"pair-review","issue":1,"esito":"bloccato","note":"obiezione bloccante: test dipende dall'ordine"}
{"ts":"2026-08-13T15:00:00+02:00","cmd":"sprint","issue":1,"esito":"azione_manuale","note":"configurare secret TELEGRAM_TOKEN nel repo"}
{"ts":"2026-08-13T16:20:00+02:00","cmd":"sprint","issue":1,"esito":"escalation","note":"regola 1: 2 fallimenti test su sonnet → opus"}
{"ts":"2026-08-13T17:00:00+02:00","cmd":"metodo_feedback","note":"markdownlint in conflitto coi doc del kit (MD022/MD032)"}
```

## Stile
Sobrio, denso di dati, zero decorazione. Light + dark. Mobile: solo zone A+B
impilate (il resto è da desktop).
