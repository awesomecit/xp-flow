# dashboard — Monitor XP Flow

Cruscotto read-only su `.xpflow/events.jsonl` (slice 1): sprint attivo, azioni
manuali pendenti, timeline eventi, pipeline, retro. Scaffold dal template
[universal-canvas](https://github.com/awesomecit/universal-canvas) `v0.1.0`
(branch sorgente `feat/storia-c-dati-reali`), nucleo portato senza la zavorra
Lovable — vedi ADR 0006.

## Avvio

```bash
pnpm dashboard                 # dal root del monorepo (porta 8080)
# oppure da questa directory:
pnpm dev                       # dati reali dal log del repo
VITE_DEMO_MODE=true pnpm dev   # demo mode: MSW + dataset fittizi
```

Variabili in `.env.example`: `XPFLOW_EVENTS_FILE` (override del log, il default
risale le directory fino a `<repoRoot>/.xpflow/events.jsonl`), `VITE_DEMO_MODE`.

## Test

```bash
pnpm test              # unit vitest (dominio, api client, flow-api)
pnpm test:e2e          # BDD playwright in demo mode (36 scenari, 3 form factor)
pnpm test:e2e:reale    # BDD contro il backend reale su fixture (porta 8081)
```
