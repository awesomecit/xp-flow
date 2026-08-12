# Brief Lovable — XP Flow Monitor (slice 1, read-only)

> Da incollare in Lovable nel progetto duplicato da universal-canvas.
> Un messaggio = una sezione, nell'ordine. I mockup Stitch (screen.png + code.html)
> si allegano schermo per schermo quando si lavora quella vista.

---

## Messaggio 1 — Contesto e regole del gioco

Stiamo costruendo **XP Flow Monitor**: il centro di controllo di una "fabbrica di
sviluppo software" gestita da agenti AI. Un solo utente (il product owner) la
supervisiona: vede lo sprint attivo, le azioni che richiedono il suo intervento
e la timeline degli eventi. **Slice 1 = solo lettura**: nessuna azione di
scrittura, nessuna auth reale, nessun backend.

REGOLE VINCOLANTI (il boilerplate le supporta già — usale, non reinventarle):
1. Non aggiungere librerie: usa i pattern esistenti (api client con demoMode,
   navigation registry, i18n con useT, feature flags, AppError, TanStack Query).
2. Tutti i dati passano dal client API in **demo mode** con fixture realistiche
   (le fornisco al messaggio 2). Endpoint futuro: `GET /api/events` con
   l'envelope tipizzato del boilerplate. NON implementare il backend.
3. Ogni pagina nasce col suo `.feature` Gherkin (tag obbligatori: @positive,
   @negative, @edge, @regression) come da docs/TDD-WORKFLOW.md.
4. i18n: catalogo base `it` (source of truth) + traduzione `en`. Tenant: solo
   `default`.
5. Feature flags: crea `interaction` e `telegram`, entrambi **spenti** (slice
   future). Niente UI per funzioni dietro flag spenti, solo il flag pronto.
6. TypeScript strict, nessun `any`. Form factor dal boilerplate (usePlatform):
   desktop = layout completo, phone = solo zone Sprint attivo + Serve-da-te.
7. CONFINE core/dominio: il codice di dominio del monitor vive in `routes/` e in
   un modulo dedicato `src/domain/` (schema eventi, derivazioni, fixture). Le
   cartelle core del boilerplate (`api/ errors/ i18n/ platform/ state/ events/
   tenant/ navigation/ components/`) NON si modificano, salvo bug del boilerplate
   stesso — in quel caso il commit usa il prefisso `fix(core): ...` (il fix verrà
   riportato nel template a monte).

## Messaggio 2 — Il dominio: eventi del flusso

Il dato sorgente è un event log append-only (JSONL). Schema evento:

```json
{"ts":"2026-08-25T09:30:00+02:00","cmd":"sprint","issue":1,"sp":3,"esito":"in_corso","note":"scenario 2/3"}
```

- `cmd`: brainstorm | sprint | pair-review | retro | manual_done | metodo_feedback
- `esito`: in_corso | chiuso | azione_manuale | escalation | bloccato
- Un evento `azione_manuale` è "pendente" finché non esiste un evento
  `{"cmd":"manual_done","ref":"<ts dell'evento originale>"}`.
- Campi extra sconosciuti: ignorare. Righe malformate: scartare contando quante
  sono (il conteggio si mostra in UI come warning, mai crash).

Fixture demo (usale come dataset di partenza, aggiungine per gli stati):

```json
{"ts":"2026-08-13T09:10:00+02:00","cmd":"brainstorm","issue":1,"sp":3,"esito":"chiuso","note":"4 scenari Gherkin, stima 3 SP"}
{"ts":"2026-08-13T11:30:00+02:00","cmd":"sprint","issue":1,"sp":3,"esito":"in_corso","note":"scenario 2/4: stato con sprint attivo"}
{"ts":"2026-08-13T14:05:00+02:00","cmd":"pair-review","issue":1,"esito":"bloccato","note":"obiezione bloccante: test dipende dall'ordine"}
{"ts":"2026-08-13T15:00:00+02:00","cmd":"sprint","issue":1,"esito":"azione_manuale","note":"configurare secret TELEGRAM_TOKEN nel repo"}
{"ts":"2026-08-13T15:40:00+02:00","cmd":"sprint","issue":1,"esito":"azione_manuale","note":"eseguire git push dei commit locali (7)"}
{"ts":"2026-08-13T16:20:00+02:00","cmd":"sprint","issue":1,"esito":"escalation","note":"regola 1: 2 fallimenti test su sonnet → opus"}
{"ts":"2026-08-13T17:00:00+02:00","cmd":"metodo_feedback","note":"markdownlint in conflitto coi doc del kit"}
{"ts":"2026-08-13T17:30:00+02:00","cmd":"manual_done","ref":"2026-08-13T15:00:00+02:00"}
```

Derivazioni da calcolare (pure function testabili, non nei componenti):
sprint attivo (ultima issue con `in_corso` senza `chiuso`), SP bruciati vs
stimati, azioni manuali pendenti (`azione_manuale` senza `manual_done`),
conteggio `metodo_feedback` in attesa di retro.

## Messaggio 3 — Rotte e navigazione (slice 1)

Registra nel navigation registry (etichette da i18n):

| Rotta | Nome | Contenuto |
|---|---|---|
| `/` | Dashboard | zone: A Sprint attivo (hero) · B Serve da te · D North-star |
| `/timeline` | Timeline | feed eventi filtrabile per cmd/esito + warning righe scartate |
| `/pipeline` | Pipeline | stepper brainstorm→sprint→pair-review→retro + dettaglio blocchi |
| `/retro` | Retro & metodo | metodo_feedback accumulati · accuratezza stime · escalation |

Su phone: bottom-nav con sole Dashboard e Timeline (primary); Pipeline e Retro
solo desktop/tablet.

Stati OBBLIGATORI di ogni vista (guidati dalle fixture):
- Dashboard: sprint attivo · attention-required (2 pendenti, review bloccata) ·
  empty "Nessuno sprint attivo" (neutro/verde, mai errore, con hint
  `/brainstorm <idea>` in stile terminale).
- Timeline: con filtri attivi · con badge "N righe scartate".
- Pipeline: flusso sano · pair-review bloccata (ambra, obiezione in evidenza).

## Messaggio 4 — Design system PRIMA delle viste

Il design è GIÀ deciso (mockup Stitch, stile "technical precision"). La fedeltà
si ottiene in due passi, in quest'ordine:

**4a — Installa i token come tema (prima di qualsiasi vista).** Ti incollo lo
YAML dei token colore esportato da Stitch (due set: dark base
`xp_flow_technical_dashboard` e light `technical_precision_light`). Mappali su
CSS variables + Tailwind theme del boilerplate (surface/on-surface/primary/
error/outline ecc., stessi nomi), con il dark come default e il light via
`class`/`data-theme`. NON inventare colori: ogni colore in UI deve venire da un
token. Semantica: verde=ok, ambra=bloccato, rosso=serve l'utente (SOLO zona
Serve-da-te), viola=escalation.
Incolla qui il contenuto INTEGRALE (colors + typography) di questi due file
versionati in xp-flow:
- `design/dashboard/xp_flow_technical_dashboard/DESIGN.md` → tema DARK (base)
- `design/dashboard/technical_precision_light/DESIGN.md` → tema LIGHT

**4b — Una vista alla volta, con l'export sotto gli occhi.** Per ogni schermo ti
allego `screen.png` (riferimento visivo) e `code.html` (riferimento strutturale:
è Tailwind con le stesse classi token — usalo come guida di layout/gerarchia,
NON copiarlo cieco: adatta alle primitive shadcn/ui e ai pattern del
boilerplate). La vista è "fatta" quando affiancata allo screenshot non si
notano differenze di layout, spaziatura o gerarchia.

La zona "Serve da te" è l'unico punto in cui la UI "chiama" l'utente: quando ha
elementi pendenti deve dominare visivamente; quando è vuota è un rassicurante
"Nessun gate pendente ✓".

## Fuori scope (slice future — non costruire ora)
- Chiudere azioni manuali dalla UI (`manual_done`) e lanciare comandi → flag `interaction`
- Canale Telegram → flag `telegram`
- Auth reale, multi-tenant, backend, WebSocket eventi live (il bus CloudEvents
  del boilerplate resta in mock transport)
