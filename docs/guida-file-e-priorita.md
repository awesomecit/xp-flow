# Guida: quali file governano una sessione, in che ordine, con che priorità

> La domanda a cui risponde: "quando apro `claude` in xp-flow, cosa viene
> caricato, da dove, e chi vince quando due regole si contraddicono?"
> Le fonti restano dove sono ([comandi](comandi.md), [metodo](metodo-sviluppo-agentico.md),
> [installazione](installazione.md), README): qui c'è solo la meccanica.

## 1. Cosa carica Claude Code all'avvio

```mermaid
flowchart TD
    A["claude lanciato in ~/dev/xp-flow"] --> B{"il path è trusted?"}
    B -- "no" --> C["⚠️ settings e comandi DI PROGETTO ignorati<br/>(quelli utente restano) — vedi installazione.md"]
    B -- "sì" --> D["CLAUDE.md concatenati, dal generale allo specifico:<br/>~/.claude/CLAUDE.md → ~/dev/CLAUDE.md → xp-flow/CLAUDE.md"]
    D --> E["settings fusi (vedi §2)"]
    E --> F["comandi: ~/.claude/commands/ (utente, ovunque)<br/>+ .claude/commands/ del repo (namespace per sottocartelle)"]
    F --> G["agenti: ~/.claude/agents/ + .claude/agents/<br/>(a parità di nome vince il repo)"]
    G --> H["hook registrati DA settings.json per path<br/>(la cartella hooks/ da sola non fa nulla)"]
    H --> I["sessione pronta"]
```

Punti che sorprendono sempre:
- I **CLAUDE.md si sommano**, non si sovrascrivono: il repo *specializza* il
  workspace che specializza l'utente. Per questo vanno tenuti corti — viaggiano
  in ogni chiamata.
- Il **trust è legato al path assoluto**: dopo un clone o uno spostamento va
  ridato, altrimenti i comandi del flusso "spariscono" in silenzio.
- I comandi di repo esistono **solo nelle sessioni lanciate dentro il repo**:
  da `~/dev` non vedi `/sprint` di xp-flow.

## 2. Priorità delle regole (chi vince)

```mermaid
flowchart LR
    subgraph S["settings: dal più forte al più debole"]
        M["managed<br/>(enterprise)"] --> CLI["flag CLI"] --> L[".claude/<br/>settings.local.json"] --> P[".claude/<br/>settings.json"] --> U["~/.claude/<br/>settings.json"]
    end
    S --> R{"per ogni azione"}
    R --> DENY["deny — vince SEMPRE,<br/>da qualunque file venga"]
    R --> ASK["ask — chiede all'umano"]
    R --> ALLOW["allow — procede"]
    DENY -.-> H2["+ hook PreToolUse:<br/>exit 2 = blocco con feedback<br/>(ultima parola operativa)"]
```

Regole pratiche del laboratorio:
- **`deny` batte `allow` sempre** — è il fail-closed su cui poggiano i gate
  (secrets, `--force`, `reset --hard`).
- Push: gli agenti hanno allow SOLO su `git push origin feat/*` (ADR 0007);
  `main` è raggiungibile unicamente via PR con required checks.
- Gli hook si sommano da tutti i livelli; un hook che esce con codice 2
  blocca l'azione e rimanda il motivo all'agente.

## 3. Dove vive lo stato del metodo (e come si promuove)

```mermaid
flowchart TD
    subgraph EF["effimero"]
        AI[".ai/ — scratch<br/>(checkpoint pre-compact, board legacy)"]
    end
    subgraph OP["operativo (si aggiorna liberamente)"]
        EV[".xpflow/events.jsonl<br/>append-only; l'evento retro fa da spartiacque"]
        TD["TODO.md — backlog ordinato"]
        RM["ROADMAP.md — fasi e traguardi"]
        GH["issue GitHub — contratto dei task"]
    end
    subgraph DU["durevole (decisioni e conoscenza)"]
        ADR["docs/adr/ — decisioni (stato: proposta/accettata)"]
        RETRO["docs/retro/ — una per settimana, max 3 azioni"]
        DOCS["docs/ — guide e dominio (MkDocs)"]
    end
    subgraph ME["metodo (si modifica SOLO in /retro)"]
        CM["CLAUDE.md (3 livelli) · .claude/commands · .claude/agents · policy"]
    end
    AI -- "se conta, si promuove" --> EV
    EV -- "pattern ricorrenti" --> RETRO
    TD <--> GH
    RETRO -- "decisioni" --> ADR
    RETRO -- "regole stabili" --> CM
    EV -- "letto da" --> DASH["apps/dashboard (monitor)"]
```

La freccia importante è la **promozione**: niente nasce direttamente come
regola. Un attrito diventa evento (`metodo_feedback`), gli eventi diventano
analisi in retro, la retro produce al massimo 3 azioni e le regole stabili
salgono nei CLAUDE.md. In discesa vale il contrario: se un doc sparisse senza
che nessuno debba rifare una ricerca, era da archiviare (regola una-fonte).

## 4. Chi può toccare cosa

| Cosa | Chi/quando |
|---|---|
| TODO, ROADMAP, events.jsonl, issue | agenti e umano, liberamente (sempre sincronizzati) |
| docs/, ADR (contenuto nuovo) | liberamente; lo **stato** di una ADR cambia solo per decisione |
| CLAUDE.md, comandi, agenti, policy | **solo in `/retro`** (regola permanente dalla retro #2, 14/08/2026) |
| push | agenti solo `feat/*`; `main` solo via PR; tag/release e secret restano umani |
| `.ai/` | gli hook; contenuto sacrificabile per definizione |

Per il "cosa faccio adesso": [comandi.md](comandi.md) (cheat-sheet e giornata
tipo). Per il "perché è fatto così": [metodo](metodo-sviluppo-agentico.md) e
le ADR. Per il "da zero su una macchina nuova": [installazione](installazione.md).
