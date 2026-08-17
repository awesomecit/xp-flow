<!--
Titolo PR: Conventional Commit, in italiano, SENZA prefisso ticket (regola dev/CLAUDE.md).
Esempio: "feat: selettore tema chiaro/scuro nelle impostazioni"
-->

## Cosa e perché

<!-- Una frase sul cambiamento e sul motivo — cosa cambia per chi usa/legge il codice, non l'elenco dei file. -->

Closes #

## Tipo di cambiamento

- [ ] feat — nuova funzionalità
- [ ] fix — bugfix
- [ ] refactor — nessun cambio di comportamento osservabile
- [ ] chore / docs / test — manutenzione, documentazione, test

## Scenari toccati (Given/When/Then)

<!-- Feature file coinvolti, o "n/a" se la PR non tocca comportamento testabile via BDD. -->

## Come è stato testato

- [ ] Unit
- [ ] E2E (feature file elencati sopra)
- [ ] `git merge-tree` contro il branch base: nessun conflitto

## Checklist

- [ ] Commit atomici, Conventional Commits in italiano
- [ ] `/pair-review` superato senza gap aperti
- [ ] `lint` / `typecheck` puliti, CI verde (quality + e2e)
- [ ] Niente fuori scope
- [ ] TODO/ROADMAP/event log aggiornati se necessario — candidato retro? → annotato in TODO.md
