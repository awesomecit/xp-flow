# 5. xp-flow multi-tenant: metodo condiviso via symlink, stato indipendente per app

Data: 2026-08-12 · Stato: **accettata** (retro #2, 14/08/2026) — attivazione condizionata alla decisione sul vocabolario/macchina a stati (spike beads dello sprint corrente)

## Contesto
Il workspace ha più app da costruire (citycat.app, foundation, universal-canvas,
future) e la richiesta esplicita è **un solo flusso, un solo set di comandi** —
niente comandi duplicati/copiati tra repo (spreco di sync), ma nemmeno un solo
sprint globale che blocca tutte le app a turno. Il flusso legacy (`~/dev/.claude`,
usato da citycat.app) e xp-flow hanno però **modelli di concorrenza diversi**:
legacy = task-board con `depends_on` e claim, pensato per più task paralleli
dentro un repo; xp-flow = un solo sprint attivo alla volta, roster congelato.
Questo ADR nasce da `TODO.md` ("Config — dedup flusso XP legacy vs xp-flow —
candidata retro") e dal backlog dashboard ("selettore repo/app").

## Decisione
**xp-flow resta l'unica sorgente di verità per comandi e agenti**
(`.claude/commands/`, `.claude/agents/`) — nessun altro repo li copia, li
ottiene via **symlink** (stesso pattern già in uso per i comandi legacy di
citycat.app e per le cerimonie personali in `~/.claude/commands/`). Ogni repo
che adotta il metodo diventa un **tenant**: mantiene il proprio
`.xpflow/events.jsonl` e la propria fonte di backlog (TODO.md semplice dove
non esiste altro, oppure `.ai/tasks/` board dove già esiste, es. citycat) —
lo **stato è indipendente per tenant**, non globale. Più tenant possono avere
uno sprint attivo contemporaneamente, ciascuno nel proprio repo.

La dashboard (già in backlog TODO.md) diventa il **selettore di tenant**: legge
un manifest dei repo noti (statico, non scanner dinamico — YAGNI) e mostra lo
stato di un tenant o l'aggregato di "tutti".

## Alternative scartate
- **Sprint singolo globale per tutto il workspace**: troppo stretto, blocca
  ogni altra app finché quella attiva non chiude.
- **Importare il task-board a claim multiplo di citycat dentro xp-flow
  globalmente**: confonde due livelli diversi — "N task paralleli dentro un
  repo" (quello che fa il board) non è lo stesso problema di "N tenant
  paralleli tra repo" (quello che risolve questo ADR). Il board di citycat
  NON viene ritirato: resta la fonte di backlog per il tenant citycat quando
  il metodo si attiva lì, senza dover essere rifuso nel modello xp-flow.

## Conseguenze
- Nessun file `.claude/` di xp-flow cambia. **Nessun symlink viene creato**
  in citycat.app/foundation/universal-canvas prima che la retro #2 approvi.
- Il task-board di citycat.app resta intatto e diventa opzionale-riusabile
  come fonte di backlog per il proprio tenant, non sostituito.
- **Prerequisito tecnico** (condiviso con ADR 0004): tech debt #3
  (`appendFileSync` non thread-safe) — più rilevante qui perché un dashboard
  multi-tenant legge più `events.jsonl` in parallelo, uno per repo.
- All'attivazione: symlink dei comandi/agenti nei repo tenant scelti, ognuno
  con il proprio `.xpflow/events.jsonl`; il manifest dashboard elenca i tenant.
