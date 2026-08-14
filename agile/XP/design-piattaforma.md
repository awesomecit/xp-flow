# XP Platform — Design Consolidato (R&D)

> Provenienza: sessione di design su claude.ai (browser), 05/08/2026.
> Stato: **proposta, pre-skeleton** — input della discovery DIS-4 (foundation),
> deliverable ADR-014.

## Nota di raccordo col registro decisioni (05/08/2026)

Letto in chiave avversaria rispetto a quanto già deciso nel workspace:

- ✅ **Già implementato (livello "Locale solo" della matrice §3)**: `agile/XP/`
  v0 — eventi derivati dalla storia git (ogni transizione di stato è un
  commit), `events.jsonl` + `status.json` (contratto in `events.schema.json`)
  + dashboard statica. Zero infrastruttura.
- ✅ **Già applicato**: riduzione docs (§1) — archivio gitignorato, mappa
  unica, regola d'oro; recepita in `~/dev/CLAUDE.md` regola 5.
- ⚠️ **Differenza di design da sciogliere in DIS-4**: qui gli agenti
  *emettono* eventi (event log = fonte); nella v0 gli eventi si *derivano*
  da git (git = event log, zero doppia contabilità, replay gratuito).
  L'emissione via hook aggiunge segnali che git non ha (tool usage, esiti QA,
  cicli TDD falliti) — valutare l'ibrido: derivazione come base + hook che
  appendono eventi arricchiti.
- ❌ **Già respinti con motivo nel registro/report** (qui riproposti perché la
  chat browser non conosce il registro): `semantic-release`/`git-cliff`
  (contro DECISIONI #14 — Changesets con gate umano), `llms.txt` (duplica
  CLAUDE.md = seconda fonte), Vale/Repomix/Qodo PR-Agent/Aider-OpenHands-Goose
  (YAGNI con trigger dichiarati). Restano validi: lychee (già nelle checklist
  A1/E0), markdownlint (valutare in A1).
- 🔒 Vincoli invarianti: mai push (i sync verso GitHub = gate umano),
  configure-over-build con ADR (regola 9), niente livello 2 finché un trigger
  non scatta.

---

## 1. Principio guida: un solo albero di verità

Ridurre il carico cognitivo della documentazione a un entry point unico, pochi markdown vivi, tutto il resto archiviato e non committato.

Struttura docs: `README.md` (indice unico) · `flows/` (1 file per flusso vivo) · `adr/` · `ops/` (runbook) · `.archive/` gitignorata con `ARCHIVE-INDEX`.
Regole: doc non linkato = non esiste · un flusso = un file · le ADR non si rileggono per lavorare · test come documentazione dei dettagli · regola d'oro ("se sparisse, qualcuno dovrebbe rifare una ricerca o riprendere una decisione?").
Tool proposti a supporto docs: Vale, markdownlint+lychee, Repomix, llms.txt, semantic-release/git-cliff, Qodo PR-Agent, Aider/OpenHands/Goose. *(vedi Nota di raccordo: in parte respinti)*

## 2. XP as code: eventi + stato + regole

Il flusso agile XP diventa interrogabile **facendo emettere eventi strutturati al flusso stesso**; dashboard, correlazione e auto-affinamento sono conseguenze.

Struttura `xp/`: `XP.md` (contratto unico caricato dall'agente) · `flows/` (tdd-loop, story-lifecycle, release) · `policies/` (DoD, WIP limit, quality gates in YAML) · `events/schema.json` · `state/current.json` (GENERATO — l'API interrogabile) · `.archive/` snapshot R&D.
Principio: pochi markdown per umani/agenti, YAML/JSON per regole e stato.

Pipeline: (1) emissione da hook Claude Code (PostToolUse, Stop, SubagentStop) → `events.jsonl` `{ts, agent, flow, story_id, event_type, payload}`; (2) correlazione/storage: Grafana OSS+Loki (prima scelta) · OpenSearch+Dashboards (full-text pesante) · DuckDB sul JSONL (zero infra, SQL diretto — ideale R&D); (3) stato derivato da job → `state/current.json`.

Monitor in camera: **Grafana kiosk mode** su Raspberry/tablet — storie in corso, cicli TDD passati/falliti, eventi agenti, quality gate.
Backbone gratuito: GitHub (Issues=storie, Projects, Actions) · n8n o Windmill per orchestrare webhook→agente→evento→stato · Qodo PR-Agent come gate PR.
Auto-affinamento: agente periodico legge eventi (DuckDB) → metriche (cicli falliti, rework, tempi) → **propone modifiche a flows/ e policies/ via PR** con review umana. Ogni iterazione = commit → R&D archiviata per definizione.

## 3. Pattern di scalabilità: locale → replicato → distribuito → scalato

Pattern: **event log come unica fonte di verità + componenti stateless + deploy dichiarativo**. Crescere = cambio di adapter e orchestratore, mai riscrittura.

Principi: (1) lo stato vive solo nell'event log (componenti buttabili, replica = due istanze sullo stesso log); (2) ports & adapters sugli I/O (event sink astratto, adapter da config); (3) tutto dichiarativo, un solo artefatto (stessa immagine dal Mac al cluster).

| Livello | Event sink | Storage/query | Orchestratore |
|---|---|---|---|
| Locale solo | append JSONL | DuckDB sul file | processi / compose |
| Locale robusto | NATS JetStream (singolo binario) | Loki monolitico | docker compose |
| Distribuito | NATS cluster | Loki + MinIO (S3-compatible) | k3s / k8s |
| Scala seria | idem, più repliche | Loki simple-scalable → microservices | k8s qualsiasi |

Perché: NATS JetStream (stesso binario ~15MB dal locale al cluster, persistenza + request/reply) · Loki (tre modalità di deploy con la stessa config, backend MinIO→qualsiasi S3) · k3d/k3s (stessa API k8s dal locale al cluster).

Struttura repo piattaforma `xp-platform/`: `components/` (emitter-hook, state-reducer, api — stateless) · `contracts/` (events.schema.json, sink.md — **il contratto è ciò che scala, non il codice**) · `deploy/` (compose, k8s kustomize, bootstrap.sh) · `dashboards/` (Grafana provisioning as-code).

Percorso: Giorno 1 compose NATS+Loki+Grafana → Replica (leaf node NATS, monitor come consumer) → Distribuzione (k3d→cluster, MinIO) → Scala (repliche stateless).
Bonus R&D: archiviare un esperimento = stream JSONL + commit; ogni stato passato è riproducibile rigiocando gli eventi (event sourcing sul processo di sviluppo).

## 4. Prossimi passi (dal design originale)

- [ ] Scegliere il nome della piattaforma e il progetto su cui montarla
- [ ] Skeleton: compose (NATS+Loki+Grafana provisionata), events.schema.json, adapter sink file/NATS, bootstrap.sh
- [ ] Prima dashboard con 3 pannelli (storie in corso, cicli TDD, eventi agenti)
- [ ] Applicare la riduzione docs *(✅ fatta il 05/08 — vedi Nota di raccordo)*
- [ ] Combo docs in CI *(ridimensionata: lychee sì, resto respinto — vedi Nota)*
