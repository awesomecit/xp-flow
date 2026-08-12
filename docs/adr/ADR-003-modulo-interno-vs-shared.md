---
id: ADR-003
status: accepted
date: 2026-08-12
---
# ADR-003 — modulo interno a xp-flow vs package condiviso con foundation

## Contesto

Durante il brainstorm di issue #1 è emersa la domanda: il logger pino e il
collettore di eventi dovrebbero vivere in un package condiviso nel workspace
`foundation` (`/MyRepos/tech-citizen/common/foundation/packages/`) oppure
rimanere interni a xp-flow?

## Decisione

**Modulo interno a xp-flow** (`src/events.ts`, `src/status.ts`).

- Nessun package condiviso cross-repo fino a quando non esistono ≥ 2 consumer
  confermati con la stessa logica (regola DRY: estrai solo al secondo duplcato).
- foundation è in fase di discovery (nessun codice, stack diverso:
  Fastify/PostgreSQL vs CLI); accoppiare i due repo ora è YAGNI.

## Alternative considerate

| Alternativa | Motivo scartato |
|---|---|
| `packages/logger` in foundation | Foundation ha zero consumer attivi; stack diverso; complessità cross-repo (versioning, link) non giustificata |
| Package npm pubblicato | Over-engineering per un tool personale monouser |

## Conseguenze

- Se foundation implementa logging strutturato con gli stessi requisiti,
  si valuta l'estrazione in un package condiviso — con ADR dedicata.
- Il vincolo di dipendenze verso l'interno (dominio non importa infrastruttura)
  vale anche qui: `src/events.ts` non importa Fastify, ORM o SDK cloud.
