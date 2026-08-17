---
description: Fase 2.2 — Sprint da 2 giorni: sviluppo TDD top-down su trunk
argument-hint: [issue/scenario da affrontare, opzionale]
---

# Sprint (timebox 2 giorni)

Focus: $ARGUMENTS (se vuoto, proponi dagli item in cima a `TODO.md`)

## Setup
1. Verifica sync `TODO.md` ↔ issue GitHub. Se divergono, FERMATI e riallinea prima.
2. Se il timebox non è ancora aperto nel log (nessun `sprint/avviato` senza
   `sprint/chiuso` successivo), appendi l'evento di apertura con issue e SP
   pianificati: `{"ts":"...","cmd":"sprint","esito":"avviato","issue":...,"sp":...,"note":"planning: ..."}`.
3. Ambiente **Docker locale** su: `docker compose up -d`. Se manca il compose, crealo (stessa base per test e prod).

## Ciclo TDD top-down
3. Parti dal flusso utente/admin/macchina e percorri i passi dall'alto verso il basso.
4. Per ogni passo: test rosso → implementazione minima → verde → refactor (KISS/YAGNI/SOLID/Clean). Se un task fallisce i test 2 volte di fila: escala il subagente a opus (regola 1 di docs/model-selection.md) e logga l'escalation.
5. **TypeScript**: type-check separato dalla transpilazione; build veloce (tsx/esbuild/swc in dev).
6. Mock solo se necessari, con **MSW stateful** (risposte in base allo stato del sistema, mai statiche).
7. Commit piccoli e frequenti su trunk (Conventional Commits, lint via commitlint+Husky).

## Chiusura passo
8. Dopo ogni scenario completato: lancia `/pair-review` sui test scritti PRIMA di considerarlo chiuso, poi il subagente documentarista aggiorna i docs toccati.
9. Aggiorna `TODO.md`, `ROADMAP.md`, le issue GitHub e appendi l'evento a `.xpflow/events.jsonl`.
10. Pre-push su master: lint + analisi complessità cognitiva; analisi commit log per il bump semver.
11. Stato finale esplicito: test ✅/❌ · lint ✅/❌ · sync tracking ✅/❌ · docs ✅/❌ · SP bruciati vs stimati.
12. Chiudi SEMPRE con la sezione "⚠️ Azioni manuali richieste": eventi `azione_manuale` non ancora chiusi da `manual_done` in `.xpflow/events.jsonl` (se nessuna: dichiaralo).
