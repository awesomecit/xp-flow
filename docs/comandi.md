# Mappa dei comandi — quale uso e quando

> Cheat-sheet funzionale. Due famiglie: **cerimonie/utility** (scope utente,
> `~/.claude/commands/`, valgono in ogni chat) e **flusso XP** (scope repo,
> `.claude/commands/` di xp-flow, valgono nelle sessioni aperte da qui).

## "Voglio essere aggiornato" — cerimonie e utility (li lancio io, utente)

| Domanda che ho in testa | Comando | Cosa ottengo |
|---|---|---|
| Standup del mattino: che si fa oggi? | `/standup` | fatto ieri · oggi · blocchi · **serve da te** (solo gate) |
| A che punto siamo? (al volo) | `/stato` | TL;DR ≤15 righe: focus, repo, pendenze, prossimo passo |
| Aggiornamento completo con roadmap | `/stato deep` | + Gantt/diagrammi, scoperte, decisioni, deprecati, rischi, north-star |
| Cosa succede adesso, in concreto? | `/next` | UN passo: cosa fa Claude, e l'eventuale gate che tocca a me |

Ogni output viene anche salvato nel diario `~/dev/personal/agile/YYYY-MM-DD-<comando>.md`.

## "Si lavora" — flusso XP (li orchestra Claude, dentro una sessione xp-flow)

| Fase | Comando | Chi lavora |
|---|---|---|
| Idea → specifica Gherkin + E2E rossi + stime SP | `/brainstorm <idea o #issue>` | problem-explorer, test-writer |
| Sviluppo TDD top-down, timebox 2 giorni | `/sprint` | implementatore (+ escalation da policy) |
| Review adversarial, obbligatoria per chiudere uno scenario | `/pair-review` | adversarial-reviewer vs implementatore |
| Retrospettiva di fine settimana — UNICO momento in cui il metodo si può cambiare | `/retro` | retro-analyst + analisi nel main |

## Gate umani (l'unica cosa che eseguo io)

`git push` · secret/token · pagamenti · verifiche in-app · scritture su DB.
Vengono sempre elencati in "serve da te" (standup/stato) e tracciati come eventi
`azione_manuale` nell'event log finché non li chiudo.

## Giornata tipo

```mermaid
flowchart LR
    A["/standup<br/>(mattina, 2 min)"] --> B["Claude lavora:<br/>brainstorm → sprint → pair-review"]
    B --> C{"gate umano?"}
    C -- "sì" --> D["chiudo il gate<br/>(push, secret, ...)"] --> B
    C -- "no" --> E["/stato o /next<br/>quando voglio (on demand)"]
    E --> B
    B --> F["/retro<br/>(venerdì)"]
```

## Dove vivono (per modificarli o aggiungerne)

- Cerimonie/utility: `~/.claude/commands/{standup,stato,next}.md` — modificabili liberamente, NON coperti dal freeze.
- Flusso XP: `.claude/commands/{brainstorm,sprint,pair-review,retro}.md` in questo repo — **congelati fino alla 2ª retro** (modifiche solo da `/retro`).
- Candidati non ancora creati (si aggiungono solo se serve, YAGNI): `/pendenze` (solo gate aperti), `/riprendi` (ripartenza a inizio sessione).
