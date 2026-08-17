# XP Flow

Laboratorio personale di sviluppo agentico: metodo XP eseguito da agenti
Claude Code (cerimonie come comandi, roster con ruoli, stato su file), con il
**monitor in `apps/dashboard`** come primo prodotto (north-star: 1 incremento
di prodotto spedito a settimana).

## Avvio rapido

```bash
cd ~/dev/xp-flow && claude   # sessione di lavoro (comandi /brainstorm /sprint /pair-review /retro)
pnpm dashboard               # monitor web su localhost:8080, dati da .xpflow/events.jsonl
pnpm test                    # tap (CLI) + vitest (dashboard)
```

Prima volta su una macchina nuova: [docs/installazione.md](docs/installazione.md)
(incluso il trust dei workspace di Claude Code, senza il quale i comandi di
repo non si caricano).

## Mappa: dove vive cosa (una sola fonte per sezione)

| File / cartella | Cosa contiene | Semantica |
|---|---|---|
| `TODO.md` | backlog ordinato, item in SP Fibonacci | il prossimo sprint è la sezione in cima |
| `ROADMAP.md` | fasi, traguardo "Fabbrica semi-auto", kill-list | il "dove vogliamo arrivare e quanto manca" |
| `.xpflow/events.jsonl` | event log **append-only** `{ts, cmd, issue, sp, esito, note}` | fonte di verità operativa; niente si cancella mai. L'evento `retro` fa da **spartiacque**: i `metodo_feedback` successivi sono i "pendenti" della prossima retro; le `azione_manuale` restano aperte finché un `manual_done` (con `ref` al loro `ts`) le chiude |
| `docs/adr/` | decisioni architetturali numerate (MADR) | una decisione = un file, con stato proposta/accettata |
| `docs/retro/` | un file per retrospettiva (`YYYY-WW.md`) | dati, causa radice, max 3 azioni con criterio di verifica |
| `docs/drafts/` | materiale in lavorazione per le retro (audit, bozze) | non è fonte di verità |
| `docs/` (resto) | [comandi](docs/comandi.md) · [metodo](docs/metodo-sviluppo-agentico.md) · [modelli](docs/model-selection.md) · [installazione](docs/installazione.md) | pubblicata via MkDocs |
| `agile/` | diario narrativo, un file per sessione | append-only, mai fonte di verità |
| `features/` | scenari Gherkin BDD della CLI | partenza del TDD top-down |
| `apps/dashboard/` | il monitor (React + TanStack Start), pnpm workspace | il PRODOTTO pilota |
| `.claude/` | comandi del flusso, roster agenti, permessi del repo | file di metodo: si modificano SOLO in `/retro` |

## Governo

- **Metodo modificabile solo in `/retro`** (regola permanente dalla retro #2,
  14/08/2026): fuori dalla retro i difetti si loggano come `metodo_feedback`.
- **Push**: gli agenti possono solo `git push origin feat/*` (ADR 0007);
  `main` si entra esclusivamente via PR con required checks. Rebase, amend e
  reset --hard vietati sempre: sincronizzazione via merge.
- Issue GitHub = contratto dei task; TODO/ROADMAP/issue sempre sincronizzati.
