# ROADMAP — XP Flow

> Sincronizzata con TODO.md e issue GitHub. Aggiornata dai comandi del flusso.

## Fase 0 — Walking skeleton (giorno 1 sul Mac)
Obiettivo del giorno 1: UN giro completo brainstorm→sprint→review→retro sulla issue #1, **aspettandosi rotture**. Il deliverable è il flusso che gira e i prompt aggiustati, non il codice perfetto.
- [ ] Repo `xp-flow`: copiare CLAUDE.md, docs/, .claude/ (agenti+comandi), settings, hooks
- [ ] `gh auth login`, Docker attivo, creare issue #1 da good-first-issue.md
- [ ] Sessione con `claude --model opusplan`; verificare che `CLAUDE_CODE_SUBAGENT_MODEL` non sia impostata globalmente
- [ ] Chiudere issue #1 (event log + `xpflow status`) attraversando l'intero flusso; ogni attrito col metodo → evento `metodo_feedback`, NON si corregge il metodo in corsa
- ~~**Issue #2**: Life Quest slice 1 — deprecata, pilota cambiato.~~

## ⚖️ Regole di governo (dal review del progetto)
- **Freeze**: metodo congelato fino alla 2ª retro; modifiche solo in /retro dai `metodo_feedback` accumulati.
- **North-star**: 1 incremento di prodotto/settimana. Fine settembre senza prodotto spedito → si semplifica, non si estende.

## 🔪 Kill-list (tagli candidati, attivabili SOLO dalla retro se c'è attrito)
1. Pair-review adversarial solo sui merge non banali (>3 SP o one-way-door) invece che su ogni scenario.
2. Pipeline docs-as-code rinviata al secondo dominio attivo.
3. Retro quindicinale invece che settimanale.
4. Documentarista invocato solo a fine sprint invece che a fine scenario.

## Fase 1 — Docs-as-code minimale
- [ ] `mkdocs.yml` + Action `docs.yml` → GitHub Pages (già predisposti nel repo)
- [ ] ADR in docs/adr/ (MADR puro), CHANGELOG via git-cliff
- [x] Estensioni VS Code: markdown-mermaid, markdownlint, code-spell-checker(+it), Cucumber official — installate 12/08 (graphviz-preview e openapi rimandate alle fasi che le usano)
- Trigger stop: se il pilota non dà attrito, non aggiungere altro

## Fase 2 — Import mirato da BMAD (MIT) + generatori
- [ ] Tecniche di brainstorming (CSV/skill BMAD) → dentro /brainstorm
- [ ] Struttura story file (contesto+AC) e Definition of Ready → dentro /sprint
- [ ] Pattern adversariali forge-idea + Anti-Consensus + Edge Case Hunter → dentro /pair-review e adversarial-reviewer
- [ ] TypeDoc + dependency-cruiser (regole boundary DDD in CI) + script flow-status
- NON importare: installer npx BMAD, roster 12 personas, flusso a fasi rigido
- Trigger avanzamento: doc-drift ricorrente nonostante il documentarista → Fase 3

## Fase 3 — Drift-gate, telemetria e collante esterno
- [ ] fiberplane/drift: link sui doc critici + `drift check` in PR
- [ ] OTel Claude Code → Prometheus/Grafana (docker compose, riusa dashboard esistenti)
- [ ] n8n self-hosted (Docker): webhook GitHub→Telegram, retro schedulata, sync Asana/TickTick — SOLO tooling interno, mai nei prodotti (licenza SUL)
- [ ] Valutare claude-code-action per doc-sync su merge (max-turns basso)
- Trigger portale: con ≥3 domini attivi → mkdocs-multirepo-plugin

## Vincoli trasversali (valgono da subito, si applicano quando nasce il primo servizio)
- **Cloud-ready anche in locale**: essere compliant con gli standard dei principali provider cloud pur lavorando in locale. Primo riferimento: logging strutturato compatibile GKE/Cloud Logging (JSON su stdout con `severity`, `message`, `timestamp`, campi trace) — mai formati log custom. Predisporre spazio per altri provider (AWS/Azure) tramite astrazione minima: il codice logga in un formato neutro-strutturato, l'adattamento al provider è configurazione, non riscrittura. Vale anche per health check (`/healthz`-style), graceful shutdown (SIGTERM) e config via env — i pattern che Docker locale e cloud condividono. ADR alla prima implementazione.

## Backlog futuro (non ora)
- RAG remoto on-demand (Cloud Run scale-to-zero + Atlas Vector Search + embeddings via API): casi d'uso coaching personale e normativa civica per prodotti di dominio
- Dashboard di controllo evoluta sopra events.jsonl (dopo issue #1). Design PRONTO: 19 mockup Stitch + design system in `design/dashboard/` di questo repo; brief e prompt in ~/dev/personal/agile/ (2026-08-12). Implementazione: scaffold da `awesomecit/universal-canvas` (template repository, clone locale in ~/dev/personal/universal-canvas) come `apps/dashboard` del monorepo
- Eventuale agente fe-developer nel roster: SOLO se la retro mostra attrito FE reale (decisione da /retro, il roster è congelato; nel frattempo FE = implementatore+test-writer)
- Retrospettiva: analisi accuratezza stime Fibonacci per tipo di task
- Micro-eval interna (5-10 task Gherkin/E2E reali) da rigirare a ogni release di modello per validare la Model Routing Policy
