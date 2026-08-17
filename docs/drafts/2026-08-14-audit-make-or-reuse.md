# Audit make-or-reuse della fabbrica semi-auto — dossier per la retro #2

> Bozza (docs/drafts, canale sanzionato dal freeze). Origine: paura esplicita
> del 14/08 "quello che stiamo facendo potrebbe già esistere → lavoro inutile",
> gestita con la regola workspace "configure-over-build". Ricerca web 14/08 con
> due agenti (panorama tool + ecosistema Claude Code). Da consolidare in ADR
> 0008 alla retro.

## North-star UX (criterio di accettazione della fabbrica)

Dichiarata dall'utente il 14/08, è la definizione di "fatto" del traguardo
Fabbrica semi-auto:

> **Scrivo spec strutturate → avvio uno sprint → torno a fine timebox →
> faccio review da TL/PO per vedere se è tutto ok.**

Ogni decisione della retro va misurata contro questo loop: lo avvicina o no?

## Griglia adotta / integra / costruisci

| Blocco | Candidato migliore | Verdetto | Motivo |
|---|---|---|---|
| Macchina a stati + `xpflow next` | [beads](https://github.com/steveyegge/beads) (Yegge, ~26k stelle, MIT, `bd setup claude`; **`bd ready` = esattamente il nostro `next`**: lavoro pronto senza blocker, deterministico, transizioni indietro, audit trail). Alternativa leggera markdown-first: [Backlog.md](https://github.com/MrLesk/Backlog.md) (~6,5k, MIT, web UI + MCP) | **DECISIONE RETRO: adotta-o-costruisci** | beads sostituirebbe stati+ready-work in toto, MA porta binario Go + backend Dolt (attrito con as-code/KISS: il nostro JSONL è diffabile in git). `events.jsonl` sopravvive comunque per la telemetria di metodo (metodo_feedback, materiale retro), che NESSUN tracker copre |
| Catena PR review+auto-merge | [claude-code-action](https://github.com/anthropics/claude-code-action) (ufficiale; [docs code-review](https://code.claude.com/docs/en/code-review) con auto-merge) | **adotta — GIÀ FATTO** | ADR 0007 è configurazione del tool standard, non codice: nessuno spreco. La catena è commodity 2026 (anche Copilot coding agent, CodeRabbit, Greptile). Costruire altro qui = spreco puro |
| Quality gate per agenti | Hooks nativi Claude Code (31 eventi, exit code 2 = blocco con feedback all'agente) | **adotta** | "refactor solo con test/lint verdi" diventa meccanico invece che prosa; entra nella costituzione di codice (TODO 14/08) |
| Runner headless stop-on-red | Claude Agent SDK ([Python](https://github.com/anthropics/claude-agent-sdk-python)/TS) + hooks ≈ 80% nativo; CCPM ([automazeio](https://github.com/automazeio/ccpm), ~8,3k, GH-Issues-first) è parallel-first, non equivalente | **costruisci sottile** | non esiste come prodotto; poche decine di righe sopra l'SDK — giusto costruirlo perché è sottile. Errore da evitare: scrivere orchestrazione da zero ignorando SDK/hook |
| Spec / DoR (story file) | [spec-kit](https://github.com/github/spec-kit) (GitHub, ~128k stelle, MIT, constitution→specify→plan→tasks→implement, supporta Claude Code) | **integra** | rubare la struttura specify/plan/tasks dentro /brainstorm e /sprint. Aggiorna la Fase 2: meglio di un import BMAD pieno ([BMAD v6](https://github.com/bmad-code-org/BMAD-METHOD) è agile-a-documenti, non XP) |
| Cerimonie XP (red-green-refactor come gate, implementatore che non tocca i test, review avversariale) | nessuno (BMAD non-XP; SuperClaude generico; agent-os solo standards-injection) | **costruisci** | è il layer identitario della fabbrica: nessuno lo vende |
| Dashboard monitor | [vibe-kanban](https://github.com/BloopAI/vibe-kanban) (~28k ma **Bloop chiusa 04/2026**, manutenzione a rischio); web UI di Backlog.md generica | **costruisci** | è il PRODOTTO pilota north-star; il custom si giustifica con le viste specifiche del metodo (timeline eventi, serve-da-te, red/green) |
| Multi-agente con task list condivisa | Agent Teams nativo Claude Code (task list condivisa, plan approval del lead) | **valutare (spike)** | potrebbe sostituire parte dell'orchestrazione dello sprint; da provare prima di investirci |

## Sintesi

- **La paura era fondata su UN blocco**: la macchina a stati — beads esiste ed
  è maturo. L'audit è arrivato prima di spendere gli SP: nessun danno.
- **Già evitato lo spreco altrove**: ADR 0007 = configurazione di tool standard;
  runner pianificato sottile sopra l'SDK.
- **Il lavoro identitario non ha equivalenti**: cerimonie XP col nostro rigore,
  dashboard-prodotto, e la colla metodologica (cerimonia → stato → next →
  runner → gate umano). Il valore della fabbrica sta lì.
- Claude Code nativo copre ~70% dell'infrastruttura (Agent Teams, hooks,
  Sessions, SDK headless, workflows): la fabbrica deve essere un layer sottile
  e opinionated sopra il nativo, mai un motore parallelo.

## Decisione principale per la retro: beads vs attuazione A

| | A. Adottare beads | B. Costruire (attuazione A in CLI) |
|---|---|---|
| Copertura | stati, dipendenze, `ready` subito | ~6 SP di lavoro, vocabolario nostro |
| Filosofia | binario Go + Dolt, meno as-code | JSONL diffabile, KISS, tutto in git |
| Rischio | lock-in, tool giovane (10/2025) | reinventare peggio un problema risolto |
| Via di mezzo | — | copiare il **contratto** `bd ready` senza adottare il tool |
| events.jsonl | resta per telemetria di metodo | resta per tutto |

Prerequisito in ogni caso: vocabolario eventi unificato (tema già a log).

## Report claude.ai (da incollare)

_Sezione vuota: qui va il report della ricerca approfondita lanciata su
claude.ai dal prompt consegnato il 14/08 (verdetti confermati/smentiti,
approfondimenti su beads in pratica, spec eseguibili, review da TL/PO,
runner stop-on-red)._
