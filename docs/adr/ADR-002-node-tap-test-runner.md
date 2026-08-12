---
id: ADR-002
status: accepted
date: 2026-08-12
---
# ADR-002 — node-tap v18 come test runner

## Contesto

xp-flow è un tool CLI TypeScript in ESM (Node 22). Serve un test runner che:
- supporti ESM e TypeScript senza configurazione aggiuntiva
- produca output TAP leggibile da tool CI standard
- sia leggero (nessuna dipendenza da browser, bundler o DOM)

## Decisione

Usiamo **tap v18** (node-tap).

- Loader TypeScript nativo integrato (`@isaacs/ts-node-temp-fork-for-pr-2009`):
  nessun loader esterno (tsx rimosso, babel non necessario).
- Output TAP v14, compatibile con qualsiasi CI.
- API stabile: `import { test } from 'tap'`.

## Alternative considerate

| Alternativa | Motivo scartato |
|---|---|
| jest | ESM richiede `--experimental-vm-modules` o transform; config non banale su Node 22 |
| vitest | Ottimo per progetti Vite/browser; overhead non giustificato per CLI pura |
| node:test | Built-in Node 22, zero dipendenze; manca maturità per test paralleli e coverage integrata |

## Conseguenze

- tap v18 porta con sé transitive deps con vulnerabilità moderate (solo devDep,
  non impatta produzione). Da rivalutare a ogni release di tap.
- `node:test` built-in è un'alternativa da rivalutare alla prima retro se tap
  introduce attrito (kill-list candidata).
