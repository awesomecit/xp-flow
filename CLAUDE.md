# CLAUDE.md — Progetti personali (XP Flow)

## ⛔ Governo del metodo + North-star
- **Il metodo si modifica SOLO in `/retro`** (regola permanente; il freeze iniziale è stato sciolto dalla retro #2 del 14/08/2026, che ha validato il pattern: 19 feedback ordinati invece di modifiche in corsa). Fuori dalla retro, un difetto del metodo si logga come evento `{"cmd":"metodo_feedback","note":"..."}` e si prosegue. Nessun file di metodo (CLAUDE.md, docs/metodo*, comandi, agenti, policy) si tocca fuori da quel momento; protezione tecnica: hook freeze-guard (attivazione = azione dello sprint corrente). Push degli agenti: solo `feat/*` via ADR 0007 (accettata).
- **North-star: 1 incremento di prodotto rilasciato a settimana** (feature utilizzabile di un prodotto reale, non infrastruttura della fabbrica). È LA metrica: le metriche interne (SP, eventi, escalation) servono solo a spiegarla. Se a fine settembre la fabbrica non ha spedito prodotto: si semplifica il metodo, non lo si estende.

## Metodo
Metodo completo in `docs/metodo-sviluppo-agentico.md`: leggilo a inizio sessione. Sintesi:

- XP con **pair review tra agenti** (implementatore + reviewer adversarial). Nessun output critico validato da un solo agente.
- Stime **SP Fibonacci** (1,2,3,5,8,13); item >8 si scompone.
- **TODO.md + ROADMAP.md + issue GitHub sempre sincronizzati**.
- **TypeScript**, build ottimizzata. **Trunk-based**, ambienti `test` e `prod`. **Docker sempre**. Mock solo **MSW stateful**.
- **Sprint da 2 giorni**, 2/settimana + `/retro` automatizzata.

## Team agenti
Roster in `.claude/agents/`: problem-explorer (haiku) · solution-architect (opus) · implementatore (sonnet) · test-writer (sonnet) · adversarial-reviewer (opus) · retro-analyst (haiku) · documentarista (sonnet). Attivi 2-3 per volta. I subagenti ritornano SOLO sintesi distillate, mai output grezzi.

## Stato e memoria
- Lo stato vive su file: ogni comando appende un evento a `.xpflow/events.jsonl` (`{ts, cmd, issue, sp, esito, note}`) e aggiorna TODO/ROADMAP/issue.
- **Azioni non automatizzabili**: quando un'attività richiede l'umano (secret da configurare, pagamenti, verifiche in-app, permessi), l'agente NON la salta in silenzio: appende un evento con `esito:"azione_manuale"` e `note` con l'istruzione precisa. Si chiude appendendo `{"cmd":"manual_done","ref":"<ts evento originale>"}`. Ogni comando termina elencando le azioni manuali pendenti.
- `/compact` solo a confine di fase; fine sprint = sessione nuova.
- Regole nuove stabili dalle retro → promosse qui.

## Ciclo di lavoro
1. `/brainstorm <idea>` → specifica Gherkin + E2E rossi + stime + tracking
2. `/sprint` → TDD top-down su trunk, timebox 2 giorni
3. `/pair-review` → review adversarial dei test (obbligatoria per chiudere uno scenario)
4. `/retro` → fine settimana

## Regole di giudizio (sempre attive)
- **KISS/YAGNI**: complessità solo per problemi presenti; astrazioni solo dal refactoring.
- **SOLID/Clean Code**: leggibile prima che "furbo".
- **Compliance**: mai citare progetti o componenti del contesto lavorativo; riferirsi genericamente a "logger già implementati" o "pattern già in uso". Nessun dato di terzi nei prompt.
- Mai dichiarare completato senza stato esplicito: test, lint, sync tracking, evento loggato.
- Pre-push su master: lint + soglia complessità cognitiva + bump semver da commit log. Conventional Commits (commitlint + Husky).

## Docs e automazioni
- Docs-as-code: mai scrivere a mano ciò che si genera (TypeDoc, OpenAPI, dependency-graph, changelog, flow status via CI). Il documentarista aggiorna il resto; DoD include docs allineati (`drift check` pulito dove attivo).
- Buy-vs-build: prima di costruire, verificare Claude Code nativo → GitHub Actions → n8n/OSS. n8n solo come collante interno fuori dal repo; MAI embeddato nei prodotti (vincolo di licenza).

## Model Routing Policy
- Sessione di default: `opusplan`. Routing per-agente nel frontmatter; effort come leva primaria (xhigh solo per architettura, security review, debugging profondo).
- Matrice completa e 5 regole di escalation autonome: `docs/model-selection.md` — gli agenti le applicano da soli e loggano ogni escalation nell'event log.
- Escalation chiave: 2 fallimenti test su sonnet → opus · sintesi haiku insufficiente → sonnet · diff one-way-door (>8 file, auth, migrazioni, API pubbliche) → opus obbligatorio · cap opus vicino → riserva a security e decisioni irreversibili.
