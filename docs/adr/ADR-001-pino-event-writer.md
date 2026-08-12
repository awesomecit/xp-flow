---
id: ADR-001
status: accepted
date: 2026-08-12
amended: 2026-08-12
---
# ADR-001 — pino come writer per events.jsonl

## Contesto

Il comando `xpflow status` richiede un event log append-only in formato JSONL
(`.xpflow/events.jsonl`). Serve scrivere oggetti JSON strutturati con timestamp,
garantendo compatibilità con gli standard di logging cloud (GKE/Cloud Logging:
`severity`, `message`, `timestamp` su stdout in JSON).

## Decisione

Usiamo **pino** come layer di scrittura strutturata per events.jsonl.

- Destination su file via `pino.destination(path)` in modalità `sync: true`
  (flush garantito prima di uscire dal processo CLI).
- Il formato dei campi segue lo schema `{ts, cmd, issue, sp, esito, note}` con
  timestamp ISO 8601 (`time` pino → mappato su `ts`).
- Output su file, non su stdout: il log operativo non è logging applicativo.

## Alternative considerate

| Alternativa | Motivo scartato |
|---|---|
| `JSON.stringify` + `fs.appendFileSync` | Zero struttura, nessun tipo, nessuna validazione built-in |
| `winston` | Più pesante, progettato per server long-running; CLI non ne ha bisogno |
| `bunyan` | Non mantenuto attivamente |

## Implementazione effettiva (sprint 1)

L'implementazione usa `fs.appendFileSync` + `JSON.stringify` invece di pino direttamente
su events.jsonl. Motivazione: la configurazione pino necessaria per produrre esattamente
`{ts, cmd, ...}` senza campi extra (level, pid) richiederebbe formatters non ovvi e
introdurrebbe un rischio di output non conforme allo schema. KISS vince sull'ADR.
Pino è presente come devDep e sarà usato per il logging applicativo del CLI (stderr).
Se la necessità di logging strutturato nel collettore aumenta, si rivaluta.

## Conseguenze

- Il formato JSONL è leggibile da `jq`, `grep`, e da qualsiasi tool di log cloud.
- `sync: true` introduce una piccola latenza sincrona per ogni append: accettabile
  per un CLI che scrive raramente (< 1 evento/secondo).
- Scrittura concorrente (due agenti simultanei) richiede serializzazione esplicita
  nell'implementazione (lock o stream unico) — non garantita da pino da solo.
