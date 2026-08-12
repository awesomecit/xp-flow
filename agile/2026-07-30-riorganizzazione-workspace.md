# 30/07/2026 — Da docs sparse a workspace governato

**Contesto.** Il workspace era un accumulo di sessioni: zip scaricati con nomi
generici, documentazione duplicata in tre generazioni (Fondamenta 25/07,
Gestionale 28/07, governance City Cat 30/07), regole d'agente sparse e in
parte contraddittorie.

**Cosa è successo.** Consolidati due repo git locali (`citycat.app`,
`common`); gerarchia Claude Code a 3 livelli (utente → workspace → repo) con
il vincolo scoperto sulla doc ufficiale: solo i CLAUDE.md cascano, settings/
agent/comandi no — da qui i symlink dei comandi comuni. Backlog diventato
as-code: epiche E0-E10 migrate in `.ai/tasks/` con relazioni nel frontmatter,
board generata per milestone.

**Svolte.** (1) TypeScript ovunque — Antonio ha corretto a voce la mia
risoluzione documentale a favore di JS+JSDoc: la decisione viva batte i
documenti (DECISIONI #18). (2) Foundation-first: il core white-label si
costruisce prima del dominio City Cat, con filosofia configure-over-build
(IAM→Keycloak o simili da valutare, non da scrivere). (3) Documentazione
ridotta all'osso: archivio gitignorato, mappa unica per repo — il carico
cognitivo era diventato il problema, non la mancanza di doc.

**Vicoli ciechi.** Il roleplay "Sicilia Cat" era un typo, ma il contenuto
regionale resta nei doc di dominio come esempio (nota di scope, non
riscrittura). La verifica avversariale a 5 lenti ha trovato 19 magagne
(stack superato presentato come corrente, prefissi ticket residui, hook senza
guard): un pomeriggio di banner e fix.

**Lezione.** Ogni fonte esterna incollata in chat (valutazioni, tool
consigliati) va passata al vaglio del registro decisioni: semantic-release
sembrava sensato ed era già stato scartato con motivazione (DECISIONI #14).

**Stato a fine sessione.** Board foundation: DIS-1/2/3 claimabili, E0 bloccata
dalle discovery. City Cat in pausa, riparte da D1. Pendenti: passphrase da
migrare (gate pre-release), recupero manuale dei 9 doc dalle chat.
