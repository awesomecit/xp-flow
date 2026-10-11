# Piano — criticità risolte e City Cat MVP come pilota della fabbrica condivisa

Stato: **bozza** per la retro #4, insieme a
[`2026-10-09-gate-rischio-da-factory-openai.md`](2026-10-09-gate-rischio-da-factory-openai.md).
Nessun file di metodo è stato toccato.

## Sintesi

Il primo componente da versionare e condividere tra i progetti è **la
fabbrica stessa**, non il codice UI. Si tratta di workflow, template e
agenti, oggi copiati o collegati con symlink che funzionano solo sul Mac.
City Cat MVP è il primo prodotto che nasce già dentro la catena automatica:
issue → agente → PR → review con rischio → merge, mentre il deploy resta
umano. BEG non si tocca finché la catena non ha funzionato su City Cat, perché
è l'unico progetto che oggi spedisce.

## 1. Criticità → soluzione

| # | Criticità | Evidenza | Soluzione | Dove |
|---|---|---|---|---|
| 1 | Gli agenti non partono da soli, serve sempre Antonio | fermo dal 18/08 (causa dichiarata) | label `agente` su issue pronta → Action implementa e apre PR | workflow riusabile `agent-issue` |
| 2 | Il merge è sempre umano | BEG: ogni PR mergiata da `awesomecit` | auto-merge sotto `risk:high` | workflow riusabile `pr-review` (P1+P2) |
| 3 | Auto-merge in parallelo alla review; review verde anche con REQUEST_CHANGES | `pr-review.yml` di xp-flow | un solo job: review → label → step di gate che fallisce su `review:blocco` | `pr-review` |
| 4 | PR aperte con `GITHUB_TOKEN` non fanno partire la CI | comportamento GitHub | l'action usa il token della Claude GitHub App, verificato con la PR di prova | `agent-issue` |
| 5 | Comandi e agenti via symlink gitignorati: invisibili in CI | ADR 0005, CLAUDE.md di BEG | il workflow riusabile fa checkout di xp-flow **al tag** e copia `.claude/agents` e `.claude/commands` prima di lanciare l'agente | `agent-issue`, `pr-review` |
| 6 | Stato in quattro posti (TODO, ROADMAP, issue, JSONL) | xp-flow | modello BEG: il project è la fonte di verità, il JSONL solo per `azione_manuale` / `escalation` / `metodo_feedback` | metodo (retro) |
| 7 | Issue create due volte | BEG #50/51, #72/75, #73/76 | prima di `gh issue create` si cerca il titolo esatto; se esiste, si riusa | prompt degli agenti |
| 8 | Issue gemella per ogni PR di chore | BEG #68/69, #73/74… | `chore`, `ci`, `docs`: PR senza issue; issue solo per `feat` e `fix` | metodo (retro) |
| 9 | Le azioni della retro restano in coda, lo sprint non si chiude | retro #3, Sprint A mai chiuso | le azioni della retro diventano issue nell'iterazione corrente; l'iterazione si chiude per data (campo Iteration), non con un evento | `project.json` |
| 10 | Push negato in sessione locale nonostante l'allow | evento 18/08 | diventa irrilevante: l'agente pusha da Actions; in locale resta da indagare (R3) | — |
| 11 | Configurazione del project duplicata per repo | BEG `.github/project.json` + `scripts/github-project.mjs` | lo script entra nel kit come script locale, non come workflow: si lancia di rado, col `gh` dell'umano (scope `project`); in CI servirebbe un PAT, perché `GITHUB_TOKEN` non scrive sui project di un utente. Ogni repo tiene solo il suo `project.json`; xp-flow lo usa già con `--config` (ponte) | `scripts/` del kit |
| 12 | L'auto-merge abilitato con `GITHUB_TOKEN` non fa partire i workflow su `main` | stessa regola del #4: il push del merge risulta fatto da quel token, quindi `docs.yml` (`on: push`) non gira e sito, CHANGELOG e flow-status restano indietro | lo step di gate abilita l'auto-merge con il token di una GitHub App (`actions/create-github-app-token`), non con `GITHUB_TOKEN`; da verificare con la PR di prova docs | `pr-review` |

## 2. Cosa si versiona: il kit della fabbrica dentro xp-flow

ADR 0002 livello 2, cioè tag git e nessun registry. ADR-003 dice "estrai al
secondo consumatore": i consumatori sono già tre (xp-flow, BEG, City Cat),
quindi la condizione è soddisfatta.

```
xp-flow/
  .github/workflows/
    pr-review.yml        on: workflow_call   review + rischio + gate + auto-merge
    agent-issue.yml      on: workflow_call   issue con label agente → PR
  scripts/
    github-project.mjs   locale, da BEG       applica .github/project.json del chiamante (--config)
  .claude/agents/ .claude/commands/          già qui (ADR 0005)
  templates/             PR template, item template (da BEG), project.json di base
```

Tag `factory-vX.Y.Z` prodotti dal flusso, mai a mano. xp-flow è pubblico,
quindi i repo privati possono chiamarne i workflow.

Un tenant ha solo due file da 10 righe ciascuno:

```yaml
# citycat-mvp/.github/workflows/factory.yml
name: factory
on:
  issues:
    types: [labeled]
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  agent:
    if: github.event_name == 'issues' && github.event.label.name == 'agente'
    uses: awesomecit/xp-flow/.github/workflows/agent-issue.yml@factory-v0.1.0
    secrets: inherit
  review:
    if: github.event_name == 'pull_request'
    uses: awesomecit/xp-flow/.github/workflows/pr-review.yml@factory-v0.1.0
    secrets: inherit
```

Per aggiornare un tenant basta cambiare il tag in una PR, che è `risk:high`
perché tocca `.github/`, quindi la rivedi tu. Per tornare indietro si
rimette il tag precedente.

Il **codice** condiviso (UI kit, i18n, import CSV) **non** si estrae ora: si
estrae quando City Cat duplica davvero qualcosa di BEG, con la sua ADR
(regola di ADR-003).

## 3. City Cat MVP: il pilota

**Obiettivo:** il primo incremento di prodotto costruito dalla catena con al
massimo un intervento umano per issue, cioè spec all'inizio e `risk:high`
o deploy alla fine.

**Repo nuovo** `citycat-mvp`, privato, tenant del kit. Non è il vecchio
`citycat.app` col suo task-board: si parte pulito e la catena è il vincolo
di progetto. Stack come BEG (Vite + React + i18n), così la prossima estrazione
di codice condiviso ha un candidato concreto.

**Slice 1, da confermare con Antonio:** un referente registra una colonia e
annota gli interventi di cura con data, e può esportare il registro datato.
È il nucleo della tutela del referente; il resto (comuni, mappa, multi-utente)
è fuori.

Issue pronte per l'agente, ciascuna da 1–2 di Estimate e con scenario Gherkin
nel file `agile/items/`:

1. registrare una colonia (nome, zona, referente)
2. annotare un intervento datato su una colonia
3. esportare il registro di una colonia (PDF o stampa)

## 4. Ordine e criteri di verifica

| Iterazione | Cosa | Fatto quando |
|---|---|---|
| retro #4 | ratifica di queste due bozze | decisione registrata in `docs/retro/` |
| 1 (xp-flow) | kit `factory-v0.1.0`: `pr-review` e `agent-issue` come workflow riusabili; xp-flow chiama sé stesso | tre PR di prova: docs → si fonde da sola; tocca `.claude/` → resta `risk:high`; test esistente modificato → check rosso. Una issue `agente` arriva a PR con CI partita |
| 2 (City Cat) | repo `citycat-mvp` dal kit, project, tre issue slice 1 con label `agente` | almeno 2 issue su 3 dalla label al merge con zero interventi; slice 1 online (deploy umano) |
| dopo | BEG adotta il kit cambiando solo `factory.yml` | prima PR di BEG fusa senza merge manuale |

**Misura:** interventi umani per issue, dalle `azione_manuale` e dai merge
manuali. Kill switch: variabile `AGENT_ENABLED` per repo.

## 5. Rischi

- **Costo:** ogni issue fa partire un run fino a 60 minuti di Actions più
  l'uso di Claude. Sul piano Free i repo privati hanno minuti limitati, quindi
  si inizia con issue da 1–2.
- **Qualità:** un agente che sbaglia apre PR inutili. La review con rischio e
  la CI le fermano; nel caso peggiore si chiude la PR.
- **Scope creep della fabbrica:** se dopo l'iterazione 2 City Cat non è
  online, si ferma il kit e si torna al modello BEG manuale. Vale la regola
  north-star.

## 6. Riproducibilità, dati e memoria

Ogni affermazione sul sistema si deve poter rifare: un assunto, la sua
confutazione, un bug prima e dopo il fix. Resta legata all'iterazione in cui
è nata e si ripete copiando un comando, anche se la rifà uno junior. La prova
è sempre un artefatto eseguibile, cioè un test, uno script o una query.

| Pratica | Come | Gate |
|---|---|---|
| Script e query in sola lettura | `scripts/read/`, tecnici e di dominio, con un utente DB che ha solo permessi di lettura | permessi del DB |
| Mai sui dati reali in chiaro | ambiente `test` con seed, o copia anonimizzata di `prod` rigenerata da script; `prod` diretto mai | deny + credenziali separate |
| Seed deterministico | `seed/` versionato, condiviso da e2e, demo e copia anonimizzata; mock solo MSW stateful | CI |
| Infra, docs e pipeline come codice | Dockerfile, compose, workflow, MkDocs; CI su ogni PR, deploy umano | CI |
| Ogni lancio si storicizza | `npm run read -- <script>` salva input, sintesi, commit e iterazione nel file dell'item; output completo come artefatto CI | wrapper |
| Assunti e confutazioni | sezione **Assunti** nel file dell'item: stato (aperto / confermato / confutato) e link alla prova | review |
| Bug riproducibili | test rosso che riproduce il bug prima del fix, lo stesso test verde dopo, nella stessa PR | TDD |
| Memoria del progetto | query utili in `scripts/read/` con "a cosa serve"; glossario in `docs/dominio.md`; decisioni in ADR | review |
| Scritto per uno junior | ogni item ha "Come riprodurre" con comandi da copiare, nessun gergo fuori glossario | template dell'item |

## 7. Strumenti di qualità e sicurezza: cosa gira davvero

Situazione verificata nei repo il 09/10/2026. Conta ciò che fa fallire la
build, non ciò che è scritto nei documenti.

| Strumento | A cosa serve | xp-flow | BEG |
|---|---|---|---|
| Husky | controlli prima di commit e push | attivo, ma gli hook delegano a `~/.claude/shared-hooks`, fuori dal repo | assente |
| commitlint | Conventional Commits, base per versione e CHANGELOG | attivo in locale, non in CI | assente |
| ESLint | errori e stile, zero warning | attivo, anche in CI | attivo, anche in CI |
| TypeScript strict | errori di tipo | attivo, anche in CI | dentro la build in CI |
| Test unit ed e2e | regressioni | in CI (tap, vitest, Playwright) | e2e Playwright in CI |
| git-cliff | versione e CHANGELOG dai commit | installato | script proprio, CHANGELOG a frammenti |
| eslint-plugin-sonarjs + soglia di complessità cognitiva | codice troppo complesso o duplicato | solo nei documenti | assente |
| gitleaks | segreti nel codice | solo nei documenti | assente |
| Dependabot o Trivy | dipendenze vulnerabili | solo nei documenti | assente |
| dependency-cruiser | confini tra moduli | solo nel backlog | assente |

Due conseguenze per il kit:

- **Gli hook vanno versionati nel repo.** Un agente che fa commit in Actions
  non trova `~/.claude/shared-hooks`: il commit fallisce o i controlli
  saltano.
- **Ciò che protegge deve girare in CI**, perché è lì che lavora l'agente.
  Minimo da attivare: commitlint, gitleaks, la regola di complessità di
  sonarjs dentro ESLint (senza server Sonar) e Dependabot (nativo e gratuito
  su GitHub).
