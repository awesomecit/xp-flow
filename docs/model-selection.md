# Model Routing Policy — XP Flow

> Usare gli alias (`opus`/`sonnet`/`haiku`/`opusplan`), mai gli ID versione: la policy non deve invecchiare a ogni release.

## Default
- Sessione: `claude --model opusplan` (plan mode su opus, esecuzione su sonnet).
- La leva primaria è l'**effort/thinking**, non il tier: default high; xhigh per architettura, security review, debugging profondo; low/medium per brainstorm, changelog, retro, copy.
- Il routing per-agente è nel frontmatter di `.claude/agents/*.md`. `CLAUDE_CODE_SUBAGENT_MODEL` NON deve essere impostata (sovrascrive tutto); usarla solo deliberatamente nelle settimane a budget stretto per forzare `sonnet`.

## Matrice per task

| Fase / Task | Modello | Upgrade se | Downgrade se | Effort |
|---|---|---|---|---|
| Ricerca mercato/benchmark | sonnet | sintesi strategica multi-fonte | raccolta grezza → haiku | medium |
| Brainstorming | haiku | idee superficiali/ripetitive | — | low |
| Specifica / PRD | sonnet | prodotto nuovo, requisiti ambigui | bozza da rifinire → haiku | high |
| Analisi requisiti | sonnet | safety-critical o normativi | — | high |
| Stime / planning | haiku | stime divergenti, task interdipendenti | — | low |
| Architettura (solution-architect) | opus | — | pattern noto/ripetitivo → sonnet | xhigh |
| Esplorazione codebase (problem-explorer) | haiku | sintesi insufficienti (regola 2) | — | low |
| Implementazione TDD (implementatore) | sonnet | 2 fallimenti test (regola 1), refactor grande | boilerplate/rename → haiku | high/xhigh |
| Scrittura test (test-writer) | sonnet | edge case safety-critical | scaffolding → haiku | high |
| Review / security (adversarial-reviewer) | opus | — | solo stile/lint su PR piccole → sonnet | xhigh |
| Refactoring | sonnet | >8 file, contratti pubblici, migrazioni | trasformazioni meccaniche → haiku | high |
| Debugging | sonnet | long-horizon/cross-layer, 2 fallimenti | stacktrace triviali → haiku | xhigh su opus |
| Documentazione (documentarista) | sonnet | — | changelog/docstring → haiku | low/medium |
| Commit / changelog | haiku | serve sintesi semantica del diff | — | low |
| Retro (retro-analyst) | haiku | serve inferenza causale | — | low |
| UX copy | haiku | tone-of-voice, copy ad alta visibilità | — | low |

## Regole di escalation/de-escalation (autonome per gli agenti)
1. **Fallimento**: task su sonnet fallisce i test 2 volte di fila → escala a opus (xhigh); logga la causa in `.xpflow/events.jsonl`.
2. **Sintesi**: haiku produce sintesi insufficienti (file mancanti, conclusioni vaghe) → riesegui su sonnet.
3. **Rischio one-way-door**: diff che tocca >8 file, sicurezza/auth, migrazioni DB o contratti API pubblici → forza opus per implementazione E review, sempre.
4. **Costo/effort**: sonnet a xhigh che non converge in ~2 iterazioni → escala a opus (costo ormai simile, qualità migliore). Se opus risolve al primo colpo task ripetitivi → riporta il default a sonnet.
5. **Quota**: `/usage` mostra il cap settimanale opus vicino al limite → non-critico su sonnet/haiku; opus riservato a security review e decisioni irreversibili fino al reset.

## Fuori famiglia Claude (preserva la quota)
- Embeddings (RAG, indicizzazione): embedder locale via Ollama o API embeddings dedicata — mai token Claude.
- Classificazione massiva / estrazione strutturata: modello locale con validazione dell'output.
- Bozze offline / codice che non deve lasciare la macchina: Ollama. Mai per codice production-critical.

## Verifica continua
- Micro-eval interna (5-10 task Gherkin/E2E reali del repo) da rigirare a ogni release di modello: solo lei dice se un downgrade è sicuro. ≥1 regressione bloccante → quella fase resta su opus.
- Ogni escalation va tracciata nell'event log (regola → task → esito) e rivista in /retro.
- Grafana: pannello costo per sessione/modello + alert al 70% del cap settimanale opus.
