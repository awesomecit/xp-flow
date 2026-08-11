# Metodo di sviluppo agentico — XP Flow

> **Governo del metodo**: congelato fino alla 2ª retrospettiva; si modifica solo in /retro (eventi `metodo_feedback`). North-star: 1 incremento di prodotto rilasciato a settimana. Kill-list dei tagli candidati in ROADMAP.md.

## 1. Principi

- **XP con pair review tra agenti**: ogni attività significativa è svolta in coppia da agenti diversi — uno implementa, uno fa review (adversarial). Nessun output critico validato da un solo agente.
- **Stima in Story Point** con serie di Fibonacci (1, 2, 3, 5, 8, 13) in base alla difficoltà. Un item > 8 va scomposto.
- **TODO + Roadmap sempre sincronizzate** con lo stato di avanzamento e con la memoria dell'agente.
- **Type safety**: preferiamo TypeScript, ottimizzando i tempi di build (type-check separato dalla transpilazione).
- **Trunk-based development**: branch di vita breve, integrazione continua su trunk.
- **Due ambienti**: `test` e `prod`.
- **Timebox di 2 giorni**: in una settimana 2 sprint + 1 sessione di retrospettiva automatizzata.

## 2. Flusso di sviluppo

### 2.1 Brainstorming e specifica
- Si parte dall'MVP desiderato: feature o problema descritto in **BDD/Gherkin**, linguaggio comprensibile a un profano ma coerente con il **linguaggio ubiquo DDD**.
- Si parte dai **test E2E** per gli acceptance criteria: **positivi, negativi, edge case**, più test di **non regressione**.

### 2.2 CI/CD locale
- Linter + analisi Sonar in **pre-push verso master**, con soglie su **complessità cognitiva**.
- **Analisi del log dei commit** per il bump di versione (semver automatico).
- Lint sui commit (commitlint) e hook gestiti con **Husky**.
- Sviluppo dal **flusso utente / admin / macchina**, top-down, in **TDD**.

### 2.3 Qualità dei test
- Ogni suite è valutata **in pair, con review adversarial**, obiettivo esplicito: ridurre i **flaky test**.

### 2.4 Tracciamento
- **Issue GitHub** come fonte di verità (+ Asana opzionale) e locale (TODO/roadmap) **sempre sincronizzati**.

### 2.5 Ambienti ed esecuzione
- **Docker sempre**, partendo dal locale: stessa base per test e prod.

### 2.6 Mock
- Solo **MSW stateful** (risposte in base allo stato del sistema, mai statiche).

### 2.7 Principi di design
- **KISS, YAGNI, SOLID, Clean Code**.

## 3. Team di agenti (roster e budget)

- **Roster: 6 subagenti** in `.claude/agents/` — problem-explorer, solution-architect, implementatore, test-writer, adversarial-reviewer, retro-analyst.
- **Attivi in parallelo: 2-3** per sprint (implementatore + reviewer, + explorer in brainstorming). Oltre 5 si sta sovra-frammentando: ri-accorpare.
- **Routing dei modelli** (frontmatter `model:`) per sostenere il piano Max:

| Ruolo | Modello | Perché |
|---|---|---|
| solution-architect | opus | giudizio ad alto costo di errore |
| adversarial-reviewer | opus | trovare difetti sottili |
| implementatore | sonnet | codice TDD, ottimo rapporto costo/resa |
| test-writer | sonnet | scrittura strutturata |
| problem-explorer | haiku | read-only, ritorna solo sintesi |
| retro-analyst | haiku | lavoro meccanico su dati strutturati |

- I ruoli "regola" (KISS/YAGNI, compliance, coaching) NON sono subagenti: vivono in CLAUDE.md.
- Sessione di default: `opusplan` (plan su opus, esecuzione su sonnet). La leva primaria è l'effort/thinking, non il tier. Matrice completa e regole di escalation autonome in `docs/model-selection.md`.
- Verificare che `CLAUDE_CODE_SUBAGENT_MODEL` non sia impostata globalmente: sovrascriverebbe il frontmatter.
- Monitoraggio budget: `/usage` settimanale; se un subagente supera il 10% del consumo, declassarlo di modello o accorparlo.

## 4. Contesto, compact e memoria

- **Lo stato vive su file, mai nella conversazione.** I contesti dei subagenti sono isolati e volatili: la condivisione avviene solo tramite disco.
- Livelli di memoria:
  1. `CLAUDE.md` — regole stabili e snelle (viene inviato a ogni chiamata: tenerlo corto).
  2. `TODO.md`, `ROADMAP.md`, `docs/` (ADR, retro) — stato di progetto durevole.
  3. `.xpflow/events.jsonl` — **event log append-only, fonte di verità operativa**: ogni comando (/brainstorm, /sprint, /pair-review, /retro) appende eventi strutturati (`{ts, cmd, issue, sp, esito, note}`).
- **Handoff tra agenti**: l'output di un subagente rientra nel main solo come sintesi distillata; mai riversare output grezzi nel contesto principale.
- **Compact**: `/compact` solo ai confini di fase (fine brainstorm, fine scenario), mai a metà ciclo TDD. A fine sprint: chiudere la sessione e ripartire pulita — lo stato è già su disco.
- Nuove regole stabili emerse dalle retro si promuovono in CLAUDE.md (non restano nella chat).
- **Azioni non automatizzabili**: convenzione `esito:"azione_manuale"` nell'event log (chiusura con `manual_done`); i comandi le elencano in coda a ogni run e un hook SessionStart le rimostra a inizio sessione.

## 5. Permessi

- Claude Code opera solo nella directory di avvio e sottodirectory; directory extra solo via `permissions.additionalDirectories`.
- Controllo fine in `.claude/settings.json`: allow/deny per tool e path (deny vince). Vietati di default: lettura `.env*`, `rm -rf`, `git push --force`.
- Enforcement aggiuntivo per operazioni distruttive: hook `PreToolUse`.
- Riferimento: `settings-permessi.json` nel repo, verifica con `/permissions`.

## 6. Osservabilità e monitoraggio

- **Metriche d'uso agenti (non homemade)**: telemetria OpenTelemetry nativa di Claude Code → Prometheus + Grafana via docker compose (gratuito, ~1h di setup, riusa le dashboard esistenti). Serve per: consumo per modello/subagente, sessioni, individuazione colli di bottiglia di budget.
- **Stato del flusso (homemade sottile)**: dashboard minima che legge `.xpflow/events.jsonl` — sprint attivo, SP stimati vs bruciati, review pending, blocchi. È il primo caso d'uso del progetto (vedi good first issue #1).
- Criterio: infrastruttura di metriche mai homemade; homemade solo la vista di dominio che nessun tool generico può darci.

## 7. Documentazione as-code (living docs)

- Ogni repo di dominio ha una `docs/` centralizzata che **vive**: non si scrive a mano ciò che si può generare.
  - `docs/architecture/` — C4 (L1-L2) in Mermaid + `dependency-graph.svg` generato da dependency-cruiser (con regole di boundary DDD come gate CI: no cicli, layer rispettati).
  - `docs/adr/` — decisioni in formato MADR, Markdown puro (immutabili, cambia solo lo status).
  - `docs/api/` — reference generata (TypeDoc dai tipi, OpenAPI dagli schemi).
  - `docs/features/` — i `.feature` Gherkin pubblicati come living specification.
  - `docs/flow/status.md` — generato da `.xpflow/events.jsonl`.
  - `CHANGELOG.md` — generato da git-cliff (conventional commits).
- Motore: **MkDocs Material** + GitHub Action che rigenera e pubblica su GitHub Pages a ogni push su main. Portale aggregato multi-repo (mkdocs-multirepo-plugin) solo quando i domini attivi sono ≥3. Backstage: mai da soli.
- **Anti-marciume**: doc critici legati ai simboli di codice (fiberplane/drift, MIT), `drift check` come gate in PR; il subagente **documentarista** aggiorna i docs toccati come parte della Definition of Done.
- Estensioni VS Code: `bierner.markdown-mermaid`, `DavidAnson.vscode-markdownlint`, `streetsidesoftware.code-spell-checker` (+italiano), `CucumberOpen.cucumber-official`, `tintinweb.graphviz-interactive-preview`, `42Crunch.vscode-openapi`.

## 8. Automazioni e buy-vs-build

- **Principio: mai ricostruire ciò che esiste già.** Prima di ogni pezzo custom, verificare in ordine: (1) è nativo di Claude Code? (subagenti, agent teams, hooks, headless, claude-code-action, skills/plugin) (2) è una GitHub Action esistente? (3) è un nodo n8n o un tool OSS? Solo se no a tutte e tre: si costruisce, con trigger di revisione esplicito.
- **Dentro il repo** (spec → TDD → review → merge → docs): Claude Code + GitHub Actions. Nessun orchestratore aggiuntivo (CrewAI/LangGraph/n8n qui sono indirezione inutile).
- **Fuori dal repo** (collante event-driven): **n8n self-hosted in Docker** — webhook GitHub → notifiche Telegram, job schedulati (retro, report), sync GitHub↔Asana/TickTick/Calendar, intake richieste → issue.
- **Vincolo di licenza n8n** (Sustainable Use License, fair-code): gratuito senza limiti per uso interno alla propria attività, anche commerciale. VIETATO embeddarlo, white-labellarlo o rivenderlo dentro i prodotti (serve licenza Embed). n8n è tooling interno, mai componente di prodotto.
- Il valore custom di XP Flow è **il metodo** (questo documento + comandi + agenti), non l'infrastruttura.
