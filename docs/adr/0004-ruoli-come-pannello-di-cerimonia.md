# 4. Ruoli come pannello di cerimonia (PO/TL/BE/FE/DevOps/CEO)

Data: 2026-08-12 · Stato: proposta (gate di attivazione: retro #2, ~21/08)

## Contesto
Negli sprint serve la prospettiva dei ruoli PO/TL/BE/FE/DevOps/CEO su prodotto
e sviluppi. Il roster funzionale attuale è **congelato fino alla 2ª retro**:
le modifiche in corsa sono vietate, gli attriti si loggano come eventi
`metodo_feedback` e si decidono solo in `/retro`. Vincoli esistenti che una
proposta di ruoli deve rispettare:
- max 2-3 agenti attivi per volta, **>5 = sovra-frammentazione**
  (`docs/comandi.md`)
- rifiuto esplicito del roster 12-personas BMAD (`ROADMAP.md` Fase 2:
  "NON importare: roster 12 personas, flusso a fasi rigido")
- precedente diretto: un agente `fe-developer` desiderato è già stato
  rinviato via evento `metodo_feedback` il 12/08, non introdotto in corsa

## Decisione
I job-title **non diventano nuovi agenti esecutori**. Diventano un **pannello
avversariale di prospettive nelle cerimonie** (`/brainstorm`, planning,
`/retro`) che discute priorità, valore e rischi. L'esecuzione resta al roster
funzionale esistente. Nuovi agenti nascono solo per capacità realmente
mancanti, su trigger deciso in retro — mai per completare la mappatura dei
titoli.

| Ruolo | Incarnazione | Dove interviene |
|---|---|---|
| PO | l'umano (by design, mai un agente) | standup, gate, priorità |
| CEO | agente `ceo-vision` (bozza inattiva, `docs/drafts/ceo-vision.md`) | SOLO `/brainstorm`: verticali, multi-tenant, monetizzazione |
| TL | `solution-architect` (già in roster) | decisioni one-way-door, ADR |
| BE | `implementatore` + `test-writer` | `/sprint` |
| FE | `implementatore` + `test-writer`; trigger `fe-developer` già in `ROADMAP.md` backlog | `/sprint`; decide la retro |
| DevOps | nessuno oggi; trigger `devops-engineer` alla prima frizione infra reale (Docker/CI/deploy/observability) | decide la retro |

## Alternative scartate
- **Roster completo di 6 personas esecutrici**: mappa 1:1 i titoli ma viola la
  regola ">5 agenti" appena si aggiunge qualunque altro agente funzionale, e
  contraddice il rifiuto esplicito del roster BMAD in ROADMAP Fase 2.
- **Pura tabella di alias documentati** (nessun agente): costo zero ma i ruoli
  non hanno voce autonoma nelle cerimonie — non cambia nulla in pratica
  rispetto a oggi.

## Conseguenze
- Nessun file sotto `.claude/` viene toccato prima che la retro #2 approvi
  questo ADR: l'unico artefatto attivo oggi è la bozza inattiva in
  `docs/drafts/ceo-vision.md`.
- **Prerequisito tecnico di attivazione**: risolvere il tech debt
  "`appendFileSync` non thread-safe" (`TODO.md`) — la riga 4 di
  `.xpflow/events.jsonl` è già corrotta da scritture interlacciate; più voci
  di pannello che loggano in parallelo aggravano il rischio.
- All'attivazione: `docs/drafts/ceo-vision.md` si copia in
  `.claude/agents/ceo-vision.md`; questo ADR passa a "accettata".
- Quando la retro approva, `/pianifica` scompone l'ADR in storie.
