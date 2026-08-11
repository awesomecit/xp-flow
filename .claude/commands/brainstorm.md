---
description: Fase 2.1 — Brainstorming, specifica BDD/Gherkin e scheletro E2E
argument-hint: <feature o problema in una frase>
---

# Brainstorm → Specifica

Input: $ARGUMENTS

1. Leggi `docs/metodo-sviluppo-agentico.md`, `ROADMAP.md` e `TODO.md` per il contesto.
2. Esplora il problema con me: MVP desiderato, chi sono gli attori (utente/admin/macchina), qual è il valore. Fai UNA domanda alla volta.
3. Scrivi la specifica in **Gherkin** (`features/*.feature`): linguaggio comprensibile a un profano, termini dal linguaggio ubiquo DDD del progetto. Copri casi **positivi, negativi, edge case**.
4. Stima ogni scenario in **SP Fibonacci** (1,2,3,5,8,13). Se >8: scomponi.
5. Genera lo scheletro dei **test E2E** che mappano gli acceptance criteria (rossi, non implementati).
6. Aggiorna `TODO.md` e `ROADMAP.md` con gli item stimati e apri/aggiorna le issue GitHub corrispondenti (`gh issue`) mantenendo la sincronizzazione bidirezionale.
7. Chiudi con riepilogo: scenari, SP totali, cosa entra nel prossimo sprint da 2 giorni.
