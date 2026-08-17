# TODO — XP Flow

> Fonte di verità operativa insieme a issue GitHub e .xpflow/events.jsonl. Item stimati in SP Fibonacci.

## Prossimo sprint (2 giorni) — azioni dalla retro #2 (docs/retro/2026-33.md)
- [ ] A1 — Spike beads sul backlog reale → verdetto adotta/copia-contratto in ADR 0008 — 2 SP
- [ ] A2 — Attivare catena PR (ADR 0007 accettata): branch protection + auto-merge + variabile/secret (azioni manuali), poi prima PR reale attraverso la catena — 2 SP
- [ ] A3 — Guardrail e igiene: freeze-guard hook attivo, `manual_done` arretrati, fix tech debt #7 — 2 SP

## In coda
- [ ] Prodotto — baseline security & observability: pianificare la Fase 0 del report guida `docs/drafts/2026-08-17-ricerca-baseline-security-observability.md` (hardening SSH/UFW+fail2ban, Cloudflare WAF free + origin allowlist/Tunnel, secrets SOPS/Infisical, Pino JSON con redaction, Uptime Kuma, Sentry free, Trivy+Dependabot in CI; enterprise-gate SSO/SCIM/audit-viewer DIFFERITE alla prima richiesta scritta, ordine RBAC→audit→SSO→SCIM) — candidato /pianifica
- [ ] Prodotto — sistema notifiche: spec casi d'uso L1–L7 completa (topologia RabbitMQ, message contract v1, Gherkin E2E per livello, roadmap 7 settimane) in `docs/drafts/2026-08-17-notification-system.md` — candidato /pianifica quando entra in sprint
- [ ] Prodotto — home-gateway (spinoff City Cat, domotica felina): brief operativo con decisioni D1–D9, vincoli SwitchBot/Tapo/PetKit e ready story week 1 in `docs/drafts/2026-08-17-home-gateway-brief.md` — candidato /brainstorm→/pianifica; collocazione tenant secondo ADR 0005
- [ ] Metodo — miglioria PROPOSTA della baseline in corso: app template baseline della fabbrica (documento normativo: enforcement gate/review/scaffold, livelli conformità L0/L1/L2, deroghe solo via ADR con scadenza) in `docs/drafts/2026-08-17-xpflow-app-template-baseline.md` — da valutare in retro insieme al report baseline security/observability del 17/08, non attivare prima
- [ ] Catalogo pattern FE — slice 1: `apps/patterns`, landing hello-world + catalogo dati dei pattern del workspace (issue #6, ADR 0009; niente copia di codice, solo censimento con puntatori a universal-canvas/dashboard) — 3 SP — **16/08: implementata su feat/patterns-catalogo, pair-review passata (round 2), PR #7 in attesa di merge umano**
- [ ] Tech debt #10 — hardening test apps/patterns (rilievi non bloccanti ri-review issue #6): guardia anti-slug fragile con label i18n identiche allo slug (categoria `i18n`), test `patterns={[]}` mancante, guardia `CATEGORIES` senza `all`, smoke test `App` e dedup `length===24` — 1 SP
- [ ] Setup docs-as-code Fase 1 (mkdocs + Action + Pages) — 2 SP
- [ ] Import tecniche brainstorming BMAD in /brainstorm — 2 SP
- [ ] Regole dependency-cruiser boundary DDD — 3 SP
- [ ] Tech debt #1 — sprint mai chiuso: aggiungere evento `sprint/chiuso` e resettare `sprintAttivo` di conseguenza — 1 SP
- [ ] Tech debt #2 — `reviewPending` sempre vuoto: implementare o rimuovere il campo da SprintStatus — 1 SP
- [ ] Tech debt #3 — `appendFileSync` non thread-safe con più agenti in parallelo: valutare lock o stream — 2 SP (torn write reale osservato nel log del 12/08 11:37, riga riparata il 13/08)
- [ ] Tech debt #4 — nessun comando CLI che appende `sprint/avviato`: oggi va scritto a mano — 1 SP
- [ ] Tech debt #5 — `pino` installato ma non usato: rimuovere o usare per logging CLI — 1 SP
- [ ] Metodo — gap mid-sprint: valutare comando `/nota` o campo `tech_debt` nell'event log (candidato retro #2)
- [ ] Metodo — pannello ruoli cerimonia (ADR 0004 + bozza ceo-vision): decisione di attivazione (candidato retro #2)
- [ ] Tech debt #6 — doppia serie ADR in docs/adr/ (000X MADR vs ADR-00X): consolidare nella serie 000X — 1 SP
- [ ] Igiene post-spostamento: riferimenti morti a ~/dev/personal/* in issue #1 — 1 SP
- [ ] Metodo — xp-flow multi-tenant (ADR 0005): comandi/agenti via symlink nei repo tenant, stato/sprint indipendente per repo; sostituisce la dedup flusso legacy come design — decisione di attivazione (candidato retro #2)
- [ ] Dashboard — selettore tenant (tendina vicino al logo xpflow, ADR 0005): manifest statico dei repo/tenant workspace + file attesi per repo, non scanner dinamico (YAGNI) — dopo storia B in corso, slice successiva a #2
- [ ] Quality gate locali al posto delle feature GitHub a pagamento: husky + eslint-plugin-sonarjs + script (precedente: citycat DECISIONI #11/#13); set minimo comune ai tenant ADR 0005 — candidato retro
- [ ] Metodo — chiavi di correlazione negli eventi (`commit` sha + `refs`) per dare contesto/storico agli agenti — candidato retro #2 (prerequisito: tech debt #3)
- [ ] Metodo — freeze-guard: hook PreToolUse che blocca modifiche ai file di metodo fuori da `/retro` — candidato retro #2 (design nell'event log del 13/08)
- [ ] Monorepo — spostare la CLI in `packages/cli` quando nasce `packages/events` (trigger in ADR 0006) — 2 SP
- [ ] Monorepo — duplicazione parser eventi: CLI `src/events.ts` vs dashboard `src/domain/events.ts` → candidata `packages/events` (ADR 0002 L1) — 3 SP
- [ ] Dominio — vocabolario eventi: TRE cataloghi divergenti (CLI `status.ts`: `avviato`/`ok`/`scenario`; dashboard `schema.ts`: `in_corso`/`chiuso`/`bloccato`/`escalation`; legacy `agile/XP`: `todo`/`claimed`/`red`/`green`/`refactor`/`done` + eventi `transition` con `from`/`to`). Sul log reale la dashboard scarta 7 righe (`esito:"ok"`, `cmd:"pianifica"`). Convergenza proposta: outcomes della dashboard + `transition from/to` del legacy, CLI allineata — decisione vocabolario in retro #2 — 2 SP
- [ ] Metodo — macchina a stati esplicita (TEMA UNIFICANTE retro #2): stati storia/sprint/review dichiarati come dato, transizioni all'indietro con causa (bocciature review e riaperture visibili nel log), validazione all'append (evento fuori vocabolario o transizione illegale → rifiutato); poi `xpflow next` che CALCOLA il prossimo passo (sprint attivo? review pendenti? azioni manuali? cima TODO) — dopo la decisione di vocabolario: attuazione A in CLI ~5 SP, B `packages/events` a vocabolario stabile. **ALTERNATIVA dall'audit 14/08**: adottare `beads` (Yegge, `bd ready` = il nostro `next`) o copiarne solo il contratto — spike di valutazione 2 SP, decisione alla retro col dossier `docs/drafts/2026-08-14-audit-make-or-reuse.md`
- [ ] Metodo — comandi che non loggano: `/pair-review` e `/retro` non hanno mai prodotto eventi propri nel log reale; `manual_done` mai usato (il ciclo azione_manuale non si è mai chiuso formalmente) — i prompt sono file di metodo, retro #2
- [ ] Tech debt #7 — `xpflow status` esce su "nessuno sprint attivo" senza stampare le azioni manuali pendenti (`bin/xpflow.ts`) — 1 SP
- [ ] Tech debt #8 — `ref` fuori da `XpEventInput` (letto via cast in `status.ts`) e `ts` sovrascrivibile dallo spread in `events.ts` — 1 SP
- [ ] Tech debt #9 — dashboard `parseFlowEvents`: payload API fuori contratto → fallimento silenzioso con `discardedRows=0` — 1 SP
- [ ] Issue GH — struttura: template issue nel repo xp-flow (oggi esistono solo in `~/dev/.github`), label di stato, milestone per slice — 2 SP
- [ ] Igiene — chiudere il ciclo `azione_manuale` con eventi `manual_done` (ref = ts dell'evento aperto) man mano che i gate umani del 13-14/08 vengono eseguiti — 1 SP
- [ ] Metodo — permessi auto mode troppo stretti per operatività autonoma: durante la chiusura slice 1 il classificatore ha bloccato un `kill` su un processo dev residuo già verificato stray (bloccava porta 8081/`test:e2e:reale`), dopo averne permesso uno analogo poco prima nella stessa sessione — decidere quali azioni locali reversibili (kill di processi dev/test verificati stray, pulizia porte) allentare, senza toccare i gate hard (push, --force, --no-verify, reset --hard) — candidato retro #2
- [ ] Semi-auto — catena PR automatica (ADR 0007, proposta 14/08): review agente come required check (`pr-review.yml`, spento dietro `PR_REVIEW_ENABLED`) + auto-merge con merge commit; push scoped `feat/*` agli agenti SOLO dopo ratifica retro #2 (edit deny + 2 CLAUDE.md contestuale); azioni manuali GitHub: branch protection su main, allow auto-merge, variabile + secret dell'action — 3 SP
- [ ] Semi-auto — costituzione di codice a livello repo: dipendenze-verso-l'interno, no-duplicazione e superfici-piccole vivono SOLO nei CLAUDE.md utente/workspace → invisibili agli agenti headless/CI (il checkout vede solo il repo); idem gli agenti kiss-yagni/qa-adversarial/compliance (in `dev/.claude`, non nel repo). Promuovere le regole nel CLAUDE.md di xp-flow (file di metodo → retro #2) e renderle gate eseguibili: dependency-cruiser (già in coda), eslint-plugin-sonarjs + soglia complessità cognitiva dichiarata ma mai implementata (già in coda), valutare jscpd per la duplicazione — 2 SP di consolidamento
- [ ] Metodo — regola "mai git push, lo eseguo io" (CLAUDE.md globale + workspace, 30/07): in questa sessione (14/08) ho dato autorizzazione puntuale a Claude per push branch + `gh pr create` (xp-flow feat/monorepo-dashboard) e push tag (canvas archive/storia-c-dati-reali), scavalcando la regola invece di modificarla. Decidere in retro: (a) tenere la regola invariata e trattare ogni eccezione come puntuale/esplicita come oggi, o (b) modificare CLAUDE.md con condizioni esplicite sotto cui Claude può pushare in autonomia (es. solo dopo parità CI locale verificata + conferma esplicita in sessione) — evitare che le eccezioni puntuale-per-puntuale diventino la norma non scritta — candidato retro #2

## Fatto
- [x] #2 Dashboard di controllo slice 1 nel monorepo `apps/dashboard` (ADR 0006) — 16 SP, PR #3 mergiata il 14/08 ✅ NORTH-STAR: primo incremento di prodotto spedito (A token bridge · B stile viste, 138 e2e · C dati reali · D cleanup) ✅
- [x] #1 Event log JSONL + comando `xpflow status` — 3 SP ✅
- [x] Config — collisione nome `/discovery`: unico comando in `~/dev/.claude/commands/discovery.md` (esplorazione codice + interview DDD "spiegami come a un bambino" innestata dentro); duplicato utente rimosso ✅

## Deprecato
- ~~Life Quest slice 1: cron 21:45 controllo giornata + notifica Telegram~~ (pilota cambiato)
