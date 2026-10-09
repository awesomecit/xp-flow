# Proposta per retro #4 — gate sul rischio (dalla "agentic software factory" di OpenAI)

Stato: **bozza**, da discutere in `/retro`. Nessun file di metodo è stato toccato.
Fonte dello schema: The Pragmatic Engineer, "The agentic software factory inside OpenAI".

## Sintesi

XP Flow ha già progettato quasi tutta la parte a monte della factory OpenAI,
inclusa la catena PR → review agente → auto-merge (ADR 0007). Ma la catena è
**spenta** dal 18/08: R2 è ancora aperta, lo Sprint A è stato avviato e mai
chiuso, e l'ultimo evento nel log risale al 18/08. Il checkpoint north-star
di fine settembre è passato senza un incremento di prodotto dopo il 17/08,
e la regola dice: **si semplifica, non si estende**.

Per questo la proposta aggiunge un solo pezzo nuovo, il gate sul rischio, e lo
mette dentro un workflow che esiste già. Più l'innesco che oggi manca:
**gli agenti non partono da soli**, li lanci tu in sessione.

## Il riferimento che funziona: il project "BEG — sito"

Sullo stesso periodo, il sito BEG ha 26 issue in Done con un flusso più leggero:

- GitHub Project con le viste Iterazione corrente (board Todo / In Progress / Done), Backlog, Roadmap, Le mie card, Formazione
- issue con codice nel titolo (`C05b · traduzioni: titoli, alt, aria-label…`), campo Estimate (1, 2…), label di tipo (`fix`) e di filone (`formazione`)
- iterazione come campo del project, non come evento in un file

XP Flow tiene invece lo stesso stato in quattro posti (TODO.md, ROADMAP.md,
issue, events.jsonl) da sincronizzare a mano. **Domanda per la retro:** il
project GitHub diventa la fonte di verità del backlog e delle iterazioni,
come su BEG, e `events.jsonl` resta solo per ciò che il project non ha
(`azione_manuale`, `escalation`, `metodo_feedback`)? Sarebbe la
semplificazione che la regola north-star chiede.

## Mappa: schema OpenAI → XP Flow

| Fase OpenAI | Dove vive in XP Flow | Stato al 09/10 |
|---|---|---|
| Builder definisce l'outcome | `/brainstorm` → Gherkin + E2E rossi + stime | attivo |
| Contesto per l'agente | `CLAUDE.md`, 7 agenti in `.claude/agents/`, comandi | attivo |
| Codex scrive il codice | `/sprint` TDD top-down, `implementatore` | attivo |
| CI build + test | `.github/workflows/ci.yml` (`quality` + `e2e`) | attivo |
| Agente itera finché è verde | `/pair-review` + regole di escalation in `docs/model-selection.md` | attivo, in sessione locale |
| Review agentica in parallelo | `pr-review.yml` (claude-code-action, review adversarial) | **spento** (`PR_REVIEW_ENABLED`) |
| Classificazione del rischio | criteri one-way-door nel CLAUDE.md, usati solo per scegliere il modello | **manca come gate** |
| Review umana sui cambi rischiosi | oggi: tu su tutto, o nessuno se l'auto-merge si accende | **manca** |
| Deploy agentico, produzione, Perf Factory, Sevbot | nessun prodotto in produzione | fuori scope (YAGNI) |
| Tracciabilità | `.xpflow/events.jsonl` (`azione_manuale`, `escalation`) | attivo, più ricco dello schema |

## Buco trovato in ADR 0007 così com'è scritto

Il job `enable-auto-merge` parte **in parallelo** alla review, senza
condizioni. Il job `claude-review` termina verde anche quando la review
chiude con `REQUEST_CHANGES`: il verdetto è un commento, non l'esito del job.
Quindi, una volta accesa la catena, a meno che la branch protection non
richieda un'approvazione che il bot conta davvero, una PR bocciata dalla
review potrebbe fondersi quando `quality` ed `e2e` sono verdi.
**Da verificare al primo giro con una PR di prova bocciata apposta.**

## Proposta (max 3 azioni, come vuole la retro)

### P1 — Accendere la catena di ADR 0007 (ex R2) · 2 SP · zero codice

Il blocco di billing è caduto: il repo ora è pubblico. Restano le azioni manuali:

- [ ] Branch protection su `main`: required checks `quality`, `e2e`, `claude-review`
- [ ] Settings → General: "Allow auto-merge"
- [ ] Secret `CLAUDE_CODE_OAUTH_TOKEN` (o `ANTHROPIC_API_KEY`)
- [ ] Label: `gh label create risk:low -c 2da44e; gh label create risk:medium -c d4a72c; gh label create risk:high -c cf222e; gh label create review:blocco -c 000000`
- [ ] Variabile di repo `PR_REVIEW_ENABLED=true`, **per ultima**, dopo il merge di P2

### P2 — Gate sul rischio dentro `pr-review.yml` · 2 SP

La review applica una label `risk:*` usando gli stessi criteri one-way-door
già scritti nel CLAUDE.md, così non nasce un secondo catalogo. Lo step di
gate decide:

- `review:blocco` presente → check rosso, niente merge
- `risk:high` → auto-merge disattivato, evento `azione_manuale` (merge tuo)
- `risk:low` / `risk:medium` → auto-merge con merge commit (ADR 0007: mai squash, mai rebase)

Il job separato `enable-auto-merge` sparisce: era quello che correva in
parallelo alla review (vedi il buco sopra).

```yaml
# .github/workflows/pr-review.yml — versione proposta
name: pr-review

on:
  pull_request:
    types: [opened, synchronize, reopened]

concurrency:
  group: pr-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  claude-review:
    if: ${{ vars.PR_REVIEW_ENABLED == 'true' }}
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Review adversarial e classificazione del rischio
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: --allowedTools "Bash(gh pr view:*),Bash(gh pr diff:*),Bash(gh pr edit:*)"
          prompt: |
            Fai una review adversarial di questa PR secondo il metodo del repo
            (CLAUDE.md): KISS/YAGNI, ciclo XP rosso-prima (test nuovi presenti e
            significativi, test esistenti non modificati dall'implementatore),
            retrocompatibilità dei contratti, niente markdown duplicati, commit
            convenzionali in italiano. Cerca i buchi, non certificare: elenca
            problemi concreti con file e riga.

            Poi applica le label con `gh pr edit`, togliendo prima quelle
            vecchie (risk:low, risk:medium, risk:high, review:blocco):
            - se hai trovato un blocco vero: review:blocco
            - esattamente UNA label di rischio:
              risk:high se la PR tocca anche uno solo di: più di 8 file, auth o
              permessi o segreti, migrazioni o cancellazioni di dati, API
              pubbliche o contratti, dipendenze nuove o major, file di metodo
              (CLAUDE.md, .claude/**, .github/**, docs/metodo*);
              risk:medium se cambia logica di dominio esistente;
              risk:low altrimenti.
            Nel dubbio scegli il livello più alto.

      - name: Gate sul rischio
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR: ${{ github.event.pull_request.html_url }}
        run: |
          labels=$(gh pr view "$PR" --json labels --jq '.labels[].name')
          if echo "$labels" | grep -qx 'review:blocco'; then
            echo "::error::La review ha trovato un blocco"; exit 1
          fi
          risk=$(echo "$labels" | grep '^risk:' || true)
          if [ "$(printf '%s' "$risk" | grep -c .)" -ne 1 ]; then
            echo "::error::Serve esattamente una label risk:*"; exit 1
          fi
          if [ "$risk" = "risk:high" ]; then
            gh pr merge "$PR" --disable-auto || true
            echo "::notice::risk:high — merge umano"
          else
            gh pr merge "$PR" --auto --merge
          fi
```

Criterio di verifica: tre PR di prova. Una solo docs deve fondersi da sola.
Una che tocca `.claude/` deve restare aperta con `risk:high`. Una con un test
esistente modificato dall'implementatore deve avere il check rosso.

### P3 — L'agente parte dalla issue · 3 SP

È il pezzo che manca perché la fabbrica "vada da sola". Metti la label
`agente` su una issue pronta (con scenario Gherkin e Estimate) e una Action
implementa, apre la PR, e da lì prosegue la catena di P1 e P2. Tu entri solo
su `risk:high` e sulle `azione_manuale`.

```yaml
# .github/workflows/agente-issue.yml — proposta
name: agente-issue

on:
  issues:
    types: [labeled]

concurrency:
  group: agente-issue-${{ github.event.issue.number }}
  cancel-in-progress: false

jobs:
  implementa:
    if: ${{ github.event.label.name == 'agente' && vars.AGENT_ENABLED == 'true' }}
    runs-on: ubuntu-latest
    timeout-minutes: 60
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: --allowedTools "Read,Edit,Write,Bash(pnpm:*),Bash(git add:*),Bash(git commit:*),Bash(git checkout -b feat/*),Bash(git push origin feat/*),Bash(gh pr create:*),Bash(gh issue comment:*)"
          prompt: |
            Implementa la issue #${{ github.event.issue.number }} secondo CLAUDE.md.
            Se la issue non ha uno scenario Gherkin, non implementare: commenta
            sulla issue cosa manca e fermati.
            Altrimenti: branch feat/issue-${{ github.event.issue.number }},
            TDD top-down dallo scenario, `pnpm lint && pnpm typecheck && pnpm test`
            verdi prima di aprire la PR, commit convenzionali in italiano,
            PR con "Closes #${{ github.event.issue.number }}".
            Se dopo due tentativi i test restano rossi, apri la PR in draft e
            spiega nel corpo dove ti sei fermato.
```

Da verificare al primo giro:
- **La PR deve far partire la CI.** Push e PR fatti con il `GITHUB_TOKEN`
  non attivano altri workflow. Bisogna controllare che l'action usi il token
  della Claude GitHub App (installata sul repo); altrimenti `ci.yml` e
  `pr-review.yml` non partono e la catena si ferma.
- **Kill switch:** la variabile `AGENT_ENABLED`, come `PR_REVIEW_ENABLED`.
- **Costo:** un run fino a 60 minuti per issue; si parte con issue da 1–2 SP.

## Misura: interventi umani a settimana · 0 SP

Non serve una label nuova: gli interventi umani sono già nel log come
`azione_manuale` ed `escalation`.

```bash
jq -r 'select(.esito=="azione_manuale" or .esito=="escalation") | .ts[0:10]' .xpflow/events.jsonl \
  | xargs -I{} date -d {} +%G-W%V | sort | uniq -c
```

Va letta insieme alla north-star: se gli interventi calano ma il prodotto non
esce, la fabbrica sta ottimizzando se stessa.

## Scartato

- **Kit generico con label `intervento` e squash merge**: duplica
  `azione_manuale` e viola ADR 0007 (solo merge commit).
- **Review per specialità in parallelo** (dati, infra, cloud, sicurezza):
  un solo reviewer adversarial con il criterio di rischio basta a questa scala.
- **Deploy agentico, Perf Factory, Sevbot, CI per il carico degli agenti**:
  nessun prodotto in produzione, quindi YAGNI. Il trigger per riaprirli è il
  primo prodotto con utenti veri.
