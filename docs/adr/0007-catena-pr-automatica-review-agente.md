# 7. Catena PR automatica: push scoped agli agenti, review agente, auto-merge

Data: 2026-08-14 · Stato: **accettata** (retro #2, 14/08/2026 — CLAUDE.md e deny aggiornati contestualmente)

## Contesto
Il traguardo "Fabbrica semi-auto" (ROADMAP) richiede che una storia ben
specificata attraversi sviluppo → PR → review → merge senza intervento umano.
Decisione esplicita dell'utente (14/08): il loop deve essere completo, **push
compreso**. Questo confligge con un non-negoziabile scritto in due CLAUDE.md
("mai `git push`, il push è sempre gate umano") e bloccato via deny nei
settings — e il 14/08 stesso è stato registrato un episodio di regola
mai-push scavalcata da un agente (commit `f4609bd`). Serve quindi una
decisione formale e strumentata, non una deroga silenziosa: questo ADR la
propone; per il freeze del metodo la ratifica spetta alla retro #2.

## Decisione (proposta)
1. **Push scoped agli agenti**: consentito SOLO `git push origin feat/*`
   (branch di lavoro). Mai `main`, mai `--force`/`--no-verify`, mai delete
   di ref remoti, mai tag. Tutto il resto resta deny.
2. **`main` intoccabile per tutti** (umano compreso): branch protection con
   required checks `quality` + `e2e` + `claude-review`, nessun push diretto.
   Il merge avviene esclusivamente via PR.
3. **Review agente obbligatoria**: workflow `pr-review.yml` (claude-code-action)
   esegue una review adversarial secondo il metodo (KISS/YAGNI, TDD rosso-prima,
   retrocompatibilità, compliance) e risulta come check obbligatorio.
4. **Auto-merge con merge commit**: a check verdi la PR si fonde da sola
   (`gh pr merge --auto --merge`). Strategia merge commit, coerente con la
   regola "sincronizzazione via merge"; **rebase resta vietato**, anche come
   strategia GitHub.
5. **Attivazione a doppia chiave**: (a) ratifica in retro #2 con modifica
   contestuale dei due CLAUDE.md e dei deny (allow scoped al posto del
   blocco totale); (b) azioni manuali GitHub: branch protection su `main`,
   "Allow auto-merge" nel repo, variabile `PR_REVIEW_ENABLED=true` e secret
   dell'action (`ANTHROPIC_API_KEY` o `CLAUDE_CODE_OAUTH_TOKEN`). Il
   workflow è nel repo da subito ma **spento** dietro la variabile.

## Alternative scartate
- **Push resta umano, automazione solo a valle**: proposta come opzione
  raccomandata, bocciata dall'utente il 14/08 — il gesto manuale residuo
  vanifica il loop notturno/semi-auto.
- **Rebase-merge o squash su GitHub**: contrasta "sincronizzazione via
  merge" e riscrive la storia; il merge commit preserva l'audit.
- **Merge locale automatico senza passare da GitHub**: niente PR, niente
  audit trail, niente required checks — perde proprio i guardrail che
  rendono accettabile il push agli agenti.

## Conseguenze
- L'audit del codice si sposta sulla PR GitHub: ogni merge ha CI, review
  agente e cronologia — più tracciato di oggi, non meno.
- Rischio residuo: un agente pusha spazzatura su `feat/*` → recuperabile
  (branch cancellabile), `main` resta protetto dai required checks.
- Costo Actions su repo privati: review a ogni sync di PR — mitigato con
  `concurrency` (cancella i run superati) e kill-switch via variabile.
- Il secret dell'action è un gate di billing/identità: la sua creazione
  resta azione manuale umana, mai automatizzata.
- Da estendere ai repo tenant (universal-canvas, futuri) solo dopo che il
  giro funziona su xp-flow (ADR 0005: stesso pattern, un tenant alla volta).
