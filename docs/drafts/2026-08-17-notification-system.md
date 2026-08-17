# Sistema Notifiche — Specifica casi d'uso L1–L7

> Documento di design e acceptance per il sistema notifiche multi-canale su RabbitMQ.
> Ogni livello è un incremento shippabile autonomamente (north-star: 1 incremento/settimana).
> Le **opzioni migliorative** sono marcate `OPT-Lx.n` e raccolte a margine di ogni livello: NON fanno parte dello scope base. Si promuovono a scope solo con decisione esplicita (mini-ADR nel changelog).

---

## 0. Architettura condivisa

### 0.1 Topologia RabbitMQ

```
Producer → exchange "notifications" (topic, durable)
              ├─ "toast.#"  → q.toast (exclusive, auto-delete)   [L1]
              ├─ "inbox.#"  → q.inbox (durable)                  [L2–L4]
              ├─ "email.#"  → q.email (durable)
              │                 └─ DLX "notifications.dlx" → q.email.dead   [L5]
              ├─ "push.#"   → q.push  (durable)
              │                 └─ DLX → q.push.dead              [L6]
              └─ (L7: il producer smette di decidere il canale —
                  pubblica "event.#" e il router pubblica i routing key canale)
```

Regole:

- **Un solo publish per evento di dominio.** I livelli aggiungono binding, mai refactor del producer.
- Exchange e code durable dichiarati via **Rascal** (config dichiarativa, reconnect e retry gestiti). `amqplib` nudo è vietato nei service: troppa superficie d'errore su reconnect/channel recovery.
- Ogni coda durable ha il suo **DLX** con `x-message-ttl` per retry a scaglioni (retry topology: `q.email → q.email.retry.30s → q.email → … → q.email.dead`).
- Prefetch per consumer: 10 (tuning successivo, non prima).

### 0.2 Message contract (v1)

```json
{
  "v": 1,
  "eventId": "uuid",
  "type": "order.confirmed",
  "userId": "u123",
  "title": "…",
  "body": "…",
  "data": { },
  "ts": "2026-08-17T10:00:00Z"
}
```

- Validazione **ajv** all'ingresso di ogni consumer. Messaggio invalido → scarto + log warn (L1) oppure DLQ diretta senza retry (code durable): un payload malformato non diventa mai valido ritentando.
- `eventId` è la chiave di **idempotenza** ovunque: dedup client (L1), upsert inbox (L3), idempotency key invii (L5/L6).
- Evoluzione: campi solo additivi finché `v` non cambia. `v2` = nuova routing key suffix (`*.v2`), consumer dual-read durante la migrazione.

### 0.3 Convenzioni

- Codice, identifiers, Gherkin: **inglese**. Documento umano: italiano.
- Test: E2E Gherkin come contratto, **testcontainers** per RabbitMQ/MongoDB/Redis.
- Feature flag per canale (`NOTIF_EMAIL_ENABLED`, …) per rollback istantaneo.
- Legenda casi: ✅ positivo · ❌ negativo · ⚠️ edge

### 0.4 Mappa livelli

| Lv | Caso d'uso | Flusso | Canale | Componenti nuovi |
|---|---|---|---|---|
| L1 | Toast realtime | One-shot | In-app WS | WS gateway, `<ToastHost>` |
| L2 | Badge counter | Stateful-lite | In-app | Counter Redis, `<NotificationBell>` |
| L3 | Inbox read/unread | Con stato | In-app | Collection `notifications`, API REST, `<InboxPanel>` |
| L4 | Feed storico | Con storico | In-app | Cursor pagination, retention, filtri, `<FeedPage>` |
| L5 | Email transazionale | One-shot garantito | Email | Outbox, adapter email, retry+DLQ |
| L6 | Web Push | One-shot best-effort | Push | Service worker, VAPID, subscription store |
| L7 | Mixed + preferenze | Orchestrazione | Tutti | Preference center, router, digest |

---

# L1 — Toast realtime (one-shot, in-app)

## Brainstorm & design

**Decisioni base:**

- Semantica **at-most-once**: client offline = notifica persa, by design. Niente DB, niente retry, niente recupero al reconnect.
- `q.toast`: **exclusive + auto-delete** per istanza gateway. Gateway morto → coda sparisce (corretto per one-shot).
- Gateway WS: processo Node dedicato, socket.io, room `user:{id}`, auth JWT al handshake.
- Il gateway binda `toast.#` e smista internamente sul `userId` del payload.
- `<ToastHost>` UI: stack max 3 visibili, auto-dismiss 5s, dismiss manuale, coda FIFO sui burst, dedup su `eventId`, `aria-live="polite"`.

**Fuori scope (esplicito):** persistenza, recupero eventi, ack di lettura.

## Opzioni migliorative (a margine — non in scope)

| ID | Opzione | Valore | Costo/Rischio | Verdetto |
|---|---|---|---|---|
| OPT-L1.1 | **Replay buffer**: ultimi N eventi per utente in Redis (TTL 60s), replay al reconnect | Copre il gap dei drop WS brevi | È persistenza travestita → L3 anticipato; dedup obbligatoria; complica il contratto "effimero" | ❌ No. Se il bisogno emerge, il caso d'uso è L3, non un buffer |
| OPT-L1.2 | **Scala orizzontale gateway**: adapter socket.io-redis per N istanze | Necessario solo con >1 replica gateway | Zero valore con 1 replica | ⏸ Rimandato al bisogno reale (trigger: seconda replica) |
| OPT-L1.3 | **Toast actionable** (bottone CTA nel toast, es. "Vedi ordine") | UX migliore | Payload `data.action` già previsto dal contract → costo minimo | ✅ Promuovibile subito se serve un caso d'uso concreto |
| OPT-L1.4 | SSE al posto di WebSocket | Meno infrastruttura, HTTP puro, proxy-friendly | Unidirezionale (ok per toast); socket.io dà già fallback e room | ⏸ Alternativa valida; decidere una volta e non riaprire |

## Casi positivi / negativi / edge

| Tipo | Caso | Comportamento atteso |
|---|---|---|
| ✅ | Utente connesso, evento pubblicato | Toast entro 2s |
| ✅ | Burst di 10 eventi | Max 3 visibili, resto in coda FIFO |
| ✅ | Dismiss manuale | Toast rimosso, il successivo in coda entra |
| ❌ | Utente offline | Nessuna delivery, nessun recupero al reconnect |
| ❌ | Payload malformato | Scartato + log warn, gateway non crasha |
| ❌ | Token WS invalido/scaduto | Handshake rifiutato 401 |
| ⚠️ | Multi-tab stesso utente | Toast su tutte le tab (room = tutte le socket) |
| ⚠️ | Rabbit down | Gateway resta up, reconnect con backoff, WS non cade |
| ⚠️ | WS drop e reconnect | Re-auth automatica; eventi nel gap NON recuperati |
| ⚠️ | Evento duplicato (stesso `eventId`) | Un solo toast (dedup client) |

## Acceptance — Gherkin E2E

```gherkin
Feature: Real-time toast notifications
  As a logged-in user
  I want to receive ephemeral toast notifications
  So that I am informed of events while I am online

  Background:
    Given the notification exchange "notifications" exists
    And the WS gateway is running

  Scenario: Connected user receives a toast
    Given user "u123" is connected via WebSocket
    When an event with routing key "toast.user" and userId "u123" is published
    Then user "u123" sees a toast with the event title within 2 seconds

  Scenario: Offline user does not receive past toasts
    Given user "u123" is not connected
    When an event for userId "u123" is published
    And user "u123" connects 10 seconds later
    Then no toast is displayed

  Scenario: Burst of events respects display limit
    Given user "u123" is connected
    When 10 events for userId "u123" are published within 1 second
    Then at most 3 toasts are visible simultaneously
    And remaining toasts are queued in FIFO order

  Scenario: Duplicate event is deduplicated
    Given user "u123" is connected
    When the same event with eventId "e1" is delivered twice
    Then exactly one toast is displayed

  Scenario: Malformed payload is discarded safely
    Given the gateway is consuming from "q.toast"
    When a message with an invalid schema is published
    Then the message is discarded
    And a warning is logged
    And the gateway keeps consuming subsequent messages

  Scenario: Unauthenticated connection is rejected
    When a client attempts a WebSocket handshake with an invalid token
    Then the connection is rejected with status 401

  Scenario: Gateway survives broker outage
    Given user "u123" is connected
    When the message broker becomes unavailable for 30 seconds
    Then the WebSocket connection stays open
    And after broker recovery new events are delivered again
```

## Roadmap L1 (settimana 1)

1. **G1:** docker-compose Rabbit + config Rascal (exchange/binding), contract v1 + validazione ajv
2. **G2:** WS gateway — auth handshake, room per user, consumer `q.toast` (TDD sul dispatch)
3. **G3:** `<ToastHost>` — stack, FIFO, dedup, auto-dismiss
4. **G4:** E2E Gherkin (testcontainers per Rabbit)
5. **G5:** hardening reconnect (Rabbit e WS), log, ship

---

# L2 — Badge counter (stateful-lite, in-app)

## Brainstorm & design

**Decisioni base:**

- Il badge è un **counter denormalizzato in Redis** (`notif:unread:{userId}`), NON una `countDocuments` a ogni render.
- Nuovo consumer su `q.inbox` (binding `inbox.#`): per ora fa solo `INCR` del counter + publish interno di un evento `toast.badge` (riuso L1 per l'update realtime del numero).
- `<NotificationBell>`: icona campanella + badge numerico, aggiornata via WS (riuso canale L1) con fallback `GET /notifications/count` al mount.
- Reset del counter: a L2 esiste solo "azzera tutto" (`DELETE /notifications/count` → `SET 0`); il decremento puntuale per singola lettura arriva con L3.
- Cap visuale: oltre 99 → "99+".
- **Fonte di verità**: a L2 il counter È la verità (non c'è ancora la collection). A L3 la verità diventa MongoDB e il counter torna cache ricostruibile.

**Fuori scope:** lista delle notifiche (L3), decremento puntuale (L3).

## Opzioni migliorative (a margine)

| ID | Opzione | Valore | Costo/Rischio | Verdetto |
|---|---|---|---|---|
| OPT-L2.1 | **Counter per categoria** (`notif:unread:{userId}:{type}`) | Badge separati (ordini vs sistema) | Moltiplica chiavi e reset logic; nessun caso d'uso oggi | ❌ No finché la UI non lo chiede |
| OPT-L2.2 | **Ricostruzione counter da Mongo** (job di riconciliazione) | Auto-guarigione da drift | Ha senso solo da L3 in poi (a L2 non c'è la collection) | ⏸ Promuovere in L3 come task, non opzione |
| OPT-L2.3 | Badge anche nel titolo tab (`(3) App`) e favicon | Visibilità con tab in background | Banale, solo FE | ✅ Promuovibile, costo ~0 |
| OPT-L2.4 | TTL sul counter (es. 30gg) | Igiene chiavi utenti dormienti | Rischio: counter sparito ≠ zero non letti → drift | ❌ No a L2; con L3 il TTL diventa sicuro (ricostruibile) |

## Casi positivi / negativi / edge

| Tipo | Caso | Comportamento atteso |
|---|---|---|
| ✅ | Evento `inbox.*` pubblicato | Counter +1, badge aggiornato realtime se connesso |
| ✅ | Mount della bell | `GET /count` restituisce il valore corrente |
| ✅ | Azzera tutto | Counter a 0, badge sparisce su tutte le tab |
| ❌ | `GET /count` senza auth | 401 |
| ❌ | Redis down | API `/count` risponde 200 con `{count: null}` degradato; consumer va in **nack + requeue** (l'INCR non deve perdersi) |
| ⚠️ | Utente offline durante 5 eventi | Al login la bell mostra 5 (fetch al mount) |
| ⚠️ | Evento duplicato (`eventId` già visto) | Counter NON incrementato due volte (dedup con `SET notif:seen:{eventId} NX EX 3600`) |
| ⚠️ | >99 non letti | Badge mostra "99+" |
| ⚠️ | Multi-tab, azzeramento da una tab | Badge a 0 su tutte (broadcast via room) |
| ⚠️ | Counter negativo (bug/race) | Clamp a 0 lato API, log error |

## Acceptance — Gherkin E2E

```gherkin
Feature: Unread notification badge
  As a logged-in user
  I want to see how many unread notifications I have
  So that I know when something needs my attention

  Background:
    Given the inbox consumer is running
    And the counter store is available

  Scenario: Badge increments in real time
    Given user "u123" is connected with badge count 0
    When an event with routing key "inbox.order" for userId "u123" is published
    Then the badge shows 1 within 2 seconds

  Scenario: Count survives user absence
    Given user "u123" is not connected
    When 5 inbox events for userId "u123" are published
    And user "u123" logs in
    Then the badge shows 5

  Scenario: Duplicate event does not double count
    Given user "u123" has badge count 1 after event "e1"
    When the same event "e1" is redelivered
    Then the badge still shows 1

  Scenario: Clear all resets the badge everywhere
    Given user "u123" has badge count 7 on two open tabs
    When the user clears all notifications from the first tab
    Then the badge shows 0 on both tabs

  Scenario: Counter store outage degrades gracefully
    Given the counter store is unavailable
    When user "u123" requests the unread count
    Then the API responds 200 with a null count
    And the bell renders without a number

  Scenario: Consumer requeues on counter store outage
    Given the counter store is unavailable
    When an inbox event is consumed
    Then the message is negatively acknowledged and requeued
    And it is processed successfully after the store recovers

  Scenario: Badge caps at 99+
    Given user "u123" has 150 unread notifications
    When the user opens the app
    Then the badge shows "99+"
```

## Roadmap L2 (settimana 2)

1. **G1:** binding `inbox.#` + `q.inbox` durable in Rascal; consumer con INCR + dedup `eventId` (TDD)
2. **G2:** API `GET /notifications/count`, `DELETE /notifications/count` (auth, degradazione Redis-down)
3. **G3:** `<NotificationBell>` + update realtime via canale L1, fetch al mount, cap 99+
4. **G4:** E2E Gherkin (testcontainers Rabbit+Redis)
5. **G5:** hardening (nack/requeue, clamp negativi), ship

---

# L3 — Inbox read/unread (con stato, in-app)

## Brainstorm & design

**Decisioni base:**

- Collection MongoDB `notifications`, **fan-out on write** (un documento per destinatario):

```json
{
  "_id": "ObjectId",
  "eventId": "uuid",
  "userId": "u123",
  "type": "order.confirmed",
  "title": "…",
  "body": "…",
  "data": {},
  "status": "unread",          // unread | read
  "createdAt": "ISO",
  "readAt": null
}
```

- Indici: `{userId: 1, status: 1, createdAt: -1}` + **unique** `{eventId: 1, userId: 1}` (idempotenza a livello DB: il retry del consumer non duplica).
- Il consumer `q.inbox` ora fa: upsert documento → INCR counter (solo se insert effettivo) → publish `toast.badge`. Ordine: prima Mongo (verità), poi Redis (cache).
- **La verità migra a MongoDB**: il counter Redis diventa cache; task di riconciliazione (ex OPT-L2.2) schedulato notturno.
- API:
  - `GET /notifications?status=unread&limit=20` (a L3 offset semplice; cursor arriva a L4)
  - `PATCH /notifications/:id/read`
  - `POST /notifications/read-all`
- `<InboxPanel>`: dropdown dalla bell, lista con stato visuale letto/non letto, click = mark read + navigazione su `data.action`, "segna tutte come lette".

**Fuori scope:** paginazione infinita, filtri, retention (L4); archiviazione/eliminazione singola.

## Opzioni migliorative (a margine)

| ID | Opzione | Valore | Costo/Rischio | Verdetto |
|---|---|---|---|---|
| OPT-L3.1 | Stato `dismissed`/archived oltre a read | Inbox più pulita | Terzo stato = più transizioni da testare; YAGNI ora | ⏸ Solo se l'inbox diventa rumorosa in uso reale |
| OPT-L3.2 | **Mark as unread** | Parità con inbox email | Banale (transizione inversa + INCR) | ✅ Promuovibile, costo basso |
| OPT-L3.3 | Raggruppamento per tipo ("3 nuovi ordini") | Riduce rumore | Logica di collapse non banale, tocca UI e query | ❌ È digest embrionale → appartiene a L7 |
| OPT-L3.4 | Change stream Mongo → WS per sync multi-device dell'inbox | Inbox live su più device | Il badge è già live; il refetch all'apertura del panel basta | ❌ Over-engineering ora |
| OPT-L3.5 | Soft-delete dei documenti invece di delete fisico | Coerente con policy soft-delete generale | Con retention L4 serve comunque una decisione | ⏸ Decidere in L4 insieme alla retention |

## Casi positivi / negativi / edge

| Tipo | Caso | Comportamento atteso |
|---|---|---|
| ✅ | Evento `inbox.*` consumato | Documento `unread` creato, counter +1, badge live |
| ✅ | Apertura panel | Lista non lette, più recente in alto |
| ✅ | Click su notifica | `status=read`, `readAt` set, counter −1, navigazione a `data.action` |
| ✅ | Read-all | Tutte read in un update, counter a 0, badge 0 ovunque |
| ❌ | PATCH su notifica di un altro utente | 404 (scoping su `userId`, mai 403 che conferma l'esistenza) |
| ❌ | PATCH su id inesistente | 404 |
| ❌ | Mongo down | Consumer nack+requeue; API 503; il toast L1 continua a funzionare (canali indipendenti) |
| ⚠️ | Redelivery stesso `eventId` | Unique index → no duplicato, counter invariato |
| ⚠️ | Doppio click rapido su "read" | Idempotente: secondo PATCH no-op, counter decrementato una sola volta (decremento condizionato alla transizione effettiva) |
| ⚠️ | Read da device A con panel aperto su device B | B vede lo stato aggiornato al prossimo fetch; badge già sincronizzato via broadcast |
| ⚠️ | Drift counter vs Mongo | Riconciliazione notturna riallinea; log del delta |

## Acceptance — Gherkin E2E

```gherkin
Feature: Notification inbox with read state
  As a logged-in user
  I want a persistent inbox of my notifications
  So that I can catch up on what happened while I was away

  Background:
    Given the inbox consumer is running
    And the database is available

  Scenario: Inbox event creates an unread notification
    Given user "u123" has an empty inbox
    When an inbox event "order.confirmed" for userId "u123" is published
    Then the inbox of user "u123" contains 1 unread notification
    And the badge shows 1

  Scenario: Reading a notification updates state and badge
    Given user "u123" has 3 unread notifications
    When the user marks one notification as read
    Then that notification has status "read" and a readAt timestamp
    And the badge shows 2

  Scenario: Marking read is idempotent
    Given user "u123" has 1 unread notification
    When the user marks it as read twice in quick succession
    Then the badge shows 0
    And the unread count never becomes negative

  Scenario: Read-all clears the inbox state
    Given user "u123" has 10 unread notifications
    When the user marks all as read
    Then all notifications have status "read"
    And the badge shows 0 on every connected tab

  Scenario: Redelivered event does not create a duplicate
    Given the inbox contains a notification with eventId "e1" for user "u123"
    When the event "e1" is redelivered
    Then the inbox still contains exactly one notification with eventId "e1"
    And the badge count is unchanged

  Scenario: A user cannot touch another user's notification
    Given a notification belongs to user "u456"
    When user "u123" attempts to mark it as read
    Then the API responds 404
    And the notification remains unread

  Scenario: Database outage does not break ephemeral toasts
    Given the database is unavailable
    When a toast event and an inbox event are published for user "u123"
    Then the toast is displayed
    And the inbox event is requeued and stored after recovery

  Scenario: Nightly reconciliation fixes counter drift
    Given the badge counter for user "u123" is 5
    And the database contains 3 unread notifications for user "u123"
    When the reconciliation job runs
    Then the badge counter for user "u123" is 3
```

## Roadmap L3 (settimana 3)

1. **G1:** collection + indici (unique `eventId+userId`), refactor consumer: Mongo → Redis → badge event (TDD)
2. **G2:** API list/read/read-all con scoping utente e decremento condizionato
3. **G3:** `<InboxPanel>` — lista, stati visuali, click-to-read, read-all
4. **G4:** E2E Gherkin (testcontainers Rabbit+Mongo+Redis)
5. **G5:** job riconciliazione counter, hardening, ship

---

# L4 — Feed storico (con storico, in-app)

## Brainstorm & design

**Decisioni base:**

- Stessa collection L3: il feed è una **vista diversa sugli stessi dati** (append-only, consultabile), non una nuova pipeline.
- **Cursor pagination** (sostituisce l'offset di L3): cursore opaco su `(createdAt, _id)`, stabile anche con insert concorrenti. `GET /notifications/feed?cursor=…&limit=20&type=…`.
- Filtri: per `type` e per range temporale. Indice aggiuntivo `{userId: 1, type: 1, createdAt: -1}`.
- **Retention**: TTL index su `createdAt`, 90 giorni. Decisione collegata a OPT-L3.5: per le notifiche vale il **delete fisico via TTL** (deroga esplicita alla policy soft-delete: sono dati derivati, l'evento sorgente resta nel dominio; nessun valore probatorio da conservare). Se un tipo di notifica assumesse rilevanza legale → va nel log di audit, non nel feed.
- `<FeedPage>`: pagina dedicata (non dropdown), infinite scroll, filtri, empty state, raggruppamento visuale per giorno.

**Fuori scope:** ricerca full-text, export.

## Opzioni migliorative (a margine)

| ID | Opzione | Valore | Costo/Rischio | Verdetto |
|---|---|---|---|---|
| OPT-L4.1 | Retention differenziata per tipo (30/90/365gg) | Igiene fine | Il TTL index Mongo è unico per campo → serve campo `expiresAt` calcolato all'insert | ⏸ Facile da introdurre dopo (backfill di `expiresAt`); non ora |
| OPT-L4.2 | Ricerca full-text (indice text o Atlas Search) | Trovare notifiche vecchie | Poco valore su dati che scadono a 90gg | ❌ No |
| OPT-L4.3 | Export CSV del feed | Richieste sporadiche utente | Banale con cursor già pronto | ⏸ On demand |
| OPT-L4.4 | Virtualizzazione lista (react-window) | Performance su feed lunghi | Con page size 20 e retention 90gg il DOM regge | ⏸ Solo se il profiling lo chiede |

## Casi positivi / negativi / edge

| Tipo | Caso | Comportamento atteso |
|---|---|---|
| ✅ | Apertura feed | Prime 20, più recenti in alto, raggruppate per giorno |
| ✅ | Scroll a fondo pagina | Fetch pagina successiva via cursore, senza duplicati né buchi |
| ✅ | Filtro per tipo | Solo notifiche del tipo, cursore coerente col filtro |
| ✅ | Notifica più vecchia di 90gg | Assente dal feed (TTL) |
| ❌ | Cursore malformato/manomesso | 400, nessun leak di errori interni |
| ❌ | Cursore di un altro utente | Risultati comunque scoped su `userId` → nessun dato altrui |
| ⚠️ | Nuove notifiche durante lo scroll | Nessun elemento duplicato o saltato nelle pagine successive (garanzia del cursor keyset) |
| ⚠️ | Cambio filtro con cursore attivo | Cursore invalidato, si riparte dalla prima pagina |
| ⚠️ | Feed vuoto | Empty state esplicito, non spinner infinito |
| ⚠️ | Esattamente `limit` risultati rimasti | `nextCursor` null solo quando non c'è davvero altro (no pagina vuota fantasma) |

## Acceptance — Gherkin E2E

```gherkin
Feature: Notification history feed
  As a logged-in user
  I want to browse my past notifications
  So that I can review what happened over time

  Background:
    Given user "u123" has 50 notifications spread over 10 days

  Scenario: First page is the most recent slice
    When the user opens the feed
    Then 20 notifications are shown, newest first
    And a next cursor is provided

  Scenario: Pagination is stable under concurrent inserts
    Given the user has loaded the first page
    When 5 new notifications arrive
    And the user requests the next page with the previous cursor
    Then the next page contains no notification already shown
    And no notification between the two pages is skipped

  Scenario: Filtering by type
    Given 10 of the notifications have type "order.confirmed"
    When the user filters the feed by type "order.confirmed"
    Then only notifications of that type are returned

  Scenario: Expired notifications are gone
    Given a notification older than the retention period exists
    When the retention cleanup has run
    Then that notification does not appear in the feed

  Scenario: Tampered cursor is rejected
    When the user requests the feed with cursor "not-a-valid-cursor"
    Then the API responds 400

  Scenario: Empty feed shows an empty state
    Given user "u999" has no notifications
    When the user opens the feed
    Then an empty state message is displayed
    And no loading indicator remains visible

  Scenario: Last page terminates pagination
    Given user "u123" has exactly 20 notifications
    When the user loads the first page of 20
    Then no next cursor is provided
```

## Roadmap L4 (settimana 4)

1. **G1:** endpoint feed con cursor keyset + filtri (TDD sulle proprietà del cursore: no dup, no skip)
2. **G2:** TTL index + verifica retention; migrazione API L3 da offset a cursor
3. **G3:** `<FeedPage>` — infinite scroll, filtri, empty state, group-by-day
4. **G4:** E2E Gherkin (inclusi i casi di stabilità del cursore)
5. **G5:** hardening, ship

---

# L5 — Email transazionale (one-shot garantito)

## Brainstorm & design

**Decisioni base:**

- **Il livello dove la delivery diventa garantita.** Entra il pattern **Outbox**: il producer scrive l'evento nella collection `outbox` **nella stessa transazione** del write di dominio; un dispatcher (change stream, fallback polling) pubblica su Rabbit e marca `published`. Chiude il gap "commit DB ok ma publish fallito".
- `q.email` durable + retry topology: `q.email → (nack) → q.email.retry.30s → q.email → retry.5m → retry.1h → q.email.dead`. Backoff a scaglioni via TTL+DLX, senza codice.
- Adapter email: consumer che (1) verifica **idempotency key** `{eventId, channel, userId}` in collection `deliveries` (unique index), (2) rende il template, (3) invia via provider (nodemailer + SMTP provider / SES), (4) registra esito.
- Distinzione errori: **4xx permanenti** (indirizzo invalido, template error) → DLQ diretta senza retry; **5xx/timeout transitori** → retry topology.
- Template: engine minimale (handlebars/mjml), template versionati in repo, testo + HTML.
- `q.email.dead` monitorata: alert se depth > 0 per più di N minuti.
- Feature flag `NOTIF_EMAIL_ENABLED` per kill switch.

**Fuori scope:** preferenze opt-out granulari (L7 — a L5 solo i tipi transazionali obbligatori), bounce handling avanzato, digest.

## Opzioni migliorative (a margine)

| ID | Opzione | Valore | Costo/Rischio | Verdetto |
|---|---|---|---|---|
| OPT-L5.1 | **Webhook bounce/complaint dal provider** → suppression list | Deliverability e reputazione dominio | Endpoint in ingresso + collection suppression | ✅ Promuovere presto (settimana successiva al ship): senza, la reputazione si brucia in silenzio |
| OPT-L5.2 | Quorum queues Rabbit al posto delle classic durable | Resilienza a crash del nodo broker | Con broker single-node non cambia nulla | ⏸ Trigger: cluster multi-nodo |
| OPT-L5.3 | Anteprima email in dev (mailpit/mailhog in compose) | DX, test visivi template | Costo ~0 | ✅ Promuovere subito in G1 |
| OPT-L5.4 | Publisher confirms sul dispatcher | Chiude anche il gap publish→broker | Rascal lo supporta in config | ✅ Promuovere: è una riga di config, coerente con "garantito" |
| OPT-L5.5 | Tracking aperture/click (pixel, link wrapping) | Metriche engagement | Privacy/GDPR da valutare, valore dubbio su transazionali B2B | ❌ No |

## Casi positivi / negativi / edge

| Tipo | Caso | Comportamento atteso |
|---|---|---|
| ✅ | Evento di dominio committato | Riga outbox nella stessa transazione; email inviata entro pochi secondi |
| ✅ | Invio riuscito | `deliveries` registra esito `sent`, ack del messaggio |
| ❌ | Provider 5xx/timeout | Nack → retry 30s → 5m → 1h → dead; nessun doppio invio ai retry (idempotency) |
| ❌ | Indirizzo invalido (4xx permanente) | DLQ diretta, nessun retry, log con motivazione |
| ❌ | Template mancante/render error | DLQ diretta (errore permanente), alert |
| ❌ | Feature flag off | Consumer scarta con ack + log info (no accumulo in coda) |
| ⚠️ | Crash del producer dopo commit, prima del publish | Il dispatcher outbox recupera e pubblica (nessun evento perso) |
| ⚠️ | Crash dell'adapter dopo invio, prima dell'ack | Redelivery → idempotency key blocca il secondo invio |
| ⚠️ | Broker down 10 minuti | Outbox accumula `pending`; al recovery tutto pubblicato in ordine |
| ⚠️ | Burst (1000 email) | Prefetch limita la concorrenza; nessun superamento rate limit provider (rate limiter nell'adapter) |
| ⚠️ | Messaggio in dead queue | Alert operativo; replay manuale possibile dopo fix |

## Acceptance — Gherkin E2E

```gherkin
Feature: Guaranteed transactional email delivery
  As the platform
  I want transactional emails to be delivered exactly once from the user's perspective
  So that critical communications are never lost nor duplicated

  Background:
    Given the outbox dispatcher is running
    And the email adapter is consuming "q.email"
    And a fake SMTP server is capturing outgoing mail

  Scenario: Domain event results in one email
    When a domain action with an "email.order-confirmed" notification is committed
    Then exactly one email is received by the fake SMTP server within 10 seconds
    And a delivery record with status "sent" exists for the eventId

  Scenario: Publish failure is recovered by the outbox
    Given the message broker is unavailable
    When a domain action with an email notification is committed
    Then the outbox entry remains "pending"
    When the broker becomes available again
    Then the email is delivered
    And the outbox entry is marked "published"

  Scenario: Transient provider failure triggers retry with backoff
    Given the SMTP server fails with a transient error for 1 minute
    When an email event is published
    Then the message is retried through the retry topology
    And exactly one email is eventually delivered
    And no duplicate email is sent

  Scenario: Redelivery after adapter crash does not duplicate the email
    Given an email for eventId "e1" was sent but not acknowledged
    When the message "e1" is redelivered
    Then no second email is sent
    And the message is acknowledged

  Scenario: Permanent failure goes straight to the dead queue
    When an email event with an invalid recipient address is published
    Then the message lands in "q.email.dead" without retries
    And a failure reason is recorded

  Scenario: Kill switch discards without accumulating
    Given the email channel feature flag is disabled
    When an email event is published
    Then no email is sent
    And the message is acknowledged
    And the queue depth of "q.email" returns to zero

  Scenario: Dead queue depth raises an alert
    Given a message sits in "q.email.dead"
    When the monitoring check runs
    Then an alert is emitted
```

## Roadmap L5 (settimana 5)

1. **G1:** collection outbox + dispatcher (change stream + polling fallback) con publisher confirms; mailpit in compose (TDD dispatcher)
2. **G2:** retry topology Rascal (30s/5m/1h/dead) + classificazione errori permanenti/transitori
3. **G3:** adapter email — idempotency `deliveries`, template engine, rate limiter
4. **G4:** E2E Gherkin (testcontainers Rabbit+Mongo + fake SMTP)
5. **G5:** alerting dead queue, kill switch, runbook di replay, ship

---

# L6 — Web Push (one-shot best-effort)

## Brainstorm & design

**Decisioni base:**

- **Web Push standard** (VAPID) con libreria `web-push`: niente FCM finché non esiste un'app mobile nativa.
- Semantica: **best-effort con retry corto** (1 tentativo + 1 retry 30s, poi dead). Una push è tempo-sensibile: consegnarla ore dopo è peggio che non consegnarla → `x-message-ttl` di 15 minuti su `q.push`: messaggi più vecchi scadono verso la DLQ (scarto consapevole, non errore).
- Collection `push_subscriptions`: `{userId, endpoint, keys, userAgent, createdAt}`, unique su `endpoint`. Un utente può avere N subscription (device/browser diversi) → invio a tutte.
- Ciclo di vita subscription: risposta **404/410 dal push service = subscription morta → delete immediata** (auto-pulizia).
- UX opt-in: **mai** chiedere il permesso browser al primo load. Prompt "soft" in-app (banner spiegazione) → solo al click parte la richiesta nativa. Permesso negato = non richiedere più (localStorage flag).
- Service worker: mostra la notifica, click → focus/open dell'app su `data.action`.
- Idempotenza: riuso collection `deliveries` con channel `push`.
- Fallback implicito: la push non sostituisce l'inbox — lo stesso evento arriva comunque su `inbox.#` (chi non ha push non perde nulla).

**Fuori scope:** mobile nativo (FCM/APNs), rich push (immagini/azioni multiple), preferenze per tipo (L7).

## Opzioni migliorative (a margine)

| ID | Opzione | Valore | Costo/Rischio | Verdetto |
|---|---|---|---|---|
| OPT-L6.1 | Rich push (immagine, action buttons) | UX | Supporto browser disomogeneo | ⏸ Dopo, se le metriche di click lo giustificano |
| OPT-L6.2 | Collapse key / tag (nuova push sostituisce la vecchia dello stesso tipo) | Meno rumore su eventi ripetuti | `tag` nativo del Notification API, costo basso | ✅ Promuovibile, quasi gratis |
| OPT-L6.3 | Astrazione multi-provider (web-push + FCM dietro interfaccia) | Prepara il mobile | Astrazione su un solo provider = over-engineering da manuale | ❌ No finché l'app mobile non è in roadmap concreta |
| OPT-L6.4 | Silent push per sync dati | Refresh inbox in background | Restrizioni severe dei browser, affidabilità pessima | ❌ No |
| OPT-L6.5 | Quiet hours (no push 22–8) | Rispetto dell'utente | Richiede timezone utente; è una preferenza → | ⏸ Spostare in L7 |

## Casi positivi / negativi / edge

| Tipo | Caso | Comportamento atteso |
|---|---|---|
| ✅ | Opt-in completato | Subscription salvata, push di benvenuto/test ricevuta |
| ✅ | Evento `push.*` con browser chiuso | Notifica di sistema visualizzata dal SO |
| ✅ | Click sulla notifica | App aperta/focusata su `data.action` |
| ✅ | Utente con 2 device iscritti | Push su entrambi |
| ❌ | Push service risponde 410 | Subscription eliminata, nessun retry su quell'endpoint |
| ❌ | Permesso browser negato | Nessuna richiesta ripetuta; UI riflette lo stato |
| ❌ | Utente senza subscription | Consumer ack + skip (l'evento inbox parallelo copre) |
| ⚠️ | Messaggio più vecchio del TTL 15m (broker down) | Scaduto verso DLQ, conteggiato come `expired`, nessun alert critico |
| ⚠️ | Redelivery stesso `eventId` | Idempotency `deliveries` → una sola push per endpoint |
| ⚠️ | Payload > 4KB (limite push service) | Validazione a monte: payload minimale + fetch dei dettagli al click |
| ⚠️ | Logout | Subscription del device disattivata/rimossa |

## Acceptance — Gherkin E2E

```gherkin
Feature: Web push notifications
  As an opted-in user
  I want to receive push notifications even when the app is closed
  So that I am alerted about important events

  Background:
    Given the push adapter is consuming "q.push"
    And a fake push service is capturing requests

  Scenario: Opt-in stores a subscription
    Given user "u123" has granted browser permission
    When the client registers its push subscription
    Then a subscription for user "u123" is stored
    And a test push is delivered to the fake push service

  Scenario: Event is pushed to all user devices
    Given user "u123" has 2 stored subscriptions
    When an event with routing key "push.order" for userId "u123" is published
    Then the fake push service receives 2 push requests
    And each carries the eventId exactly once

  Scenario: Dead subscription is cleaned up
    Given user "u123" has a subscription that the push service answers with 410
    When a push event for user "u123" is published
    Then that subscription is deleted
    And no retry is attempted for that endpoint

  Scenario: User without subscriptions is skipped silently
    Given user "u999" has no subscriptions
    When a push event for user "u999" is published
    Then the message is acknowledged
    And no push request is made

  Scenario: Stale messages expire instead of being delivered late
    Given the push adapter is stopped
    When a push event is published
    And 16 minutes pass
    And the adapter restarts
    Then the message is not delivered
    And it is routed to the dead queue as expired

  Scenario: Redelivery does not duplicate a push
    Given a push for eventId "e1" was sent to an endpoint but not acknowledged
    When the message "e1" is redelivered
    Then no second push request is made for that endpoint

  Scenario: Push does not replace the inbox
    Given user "u123" has no subscriptions
    When a mixed event targeting inbox and push is published
    Then the inbox of user "u123" contains the notification
```

## Roadmap L6 (settimana 6)

1. **G1:** collection subscriptions + API register/unregister; VAPID keys in secret
2. **G2:** service worker + flusso opt-in soft (banner → permesso nativo), `<PushOptIn>` component
3. **G3:** adapter push — invio multi-endpoint, cleanup 404/410, idempotency, TTL coda 15m
4. **G4:** E2E Gherkin (fake push service)
5. **G5:** metrica expired/dead, logout cleanup, ship

---

# L7 — Mixed + preference center (orchestrazione)

## Brainstorm & design

**Decisioni base:**

- **Inversione del controllo sul routing**: il producer smette di scegliere i canali. Pubblica un solo evento `event.{type}`; un nuovo servizio **router** consuma `q.router`, carica le preferenze del destinatario, e ri-pubblica i routing key canale (`inbox.*`, `email.*`, `push.*`, `toast.*`). Tutti gli adapter L1–L6 restano **intoccati**: il mixed è solo un consumer in più a monte.
- **Policy matrix** per tipo di notifica:

| Tipo | Classe | Canali forzati | Canali configurabili |
|---|---|---|---|
| Transazionale critica (ordine, sicurezza) | `mandatory` | inbox + email | push |
| Operativa (assegnazioni, mention) | `default-on` | inbox | email, push, toast |
| Informativa (novità, marketing interno) | `default-off` | — | tutti |

- Collection `notification_preferences`: `{userId, matrix: {type: {channel: bool}}}`, con default derivati dalla classe. Le `mandatory` **non sono disattivabili** (enforcement nel router, non solo nella UI).
- **Digest**: per i tipi che lo prevedono, l'utente sceglie `realtime | daily | weekly`. Il router accumula in collection `digest_buffer`; un job schedulato compone e pubblica un singolo `email.digest`. Il digest esiste **solo per email** (push/inbox restano realtime): un digest push non ha senso.
- UI `<PreferenceCenter>`: matrice tipo × canale, toggle disabilitati con spiegazione per le mandatory, selettore frequenza, salvataggio ottimistico con rollback su errore.
- Cache preferenze nel router (Redis, TTL 5m, invalidazione su update) per non colpire Mongo a ogni evento.

**Fuori scope:** canali nuovi (SMS, webhook — la topologia li accoglie con un binding), preferenze a livello organizzazione/tenant, A/B su template.

## Opzioni migliorative (a margine)

| ID | Opzione | Valore | Costo/Rischio | Verdetto |
|---|---|---|---|---|
| OPT-L7.1 | **Migrazione a Novu** | Preferenze, digest, template, canali già pronti | Il threshold dell'ADR iniziale è ~qui: valutare seriamente PRIMA di costruire L7 | ⚠️ Decisione bloccante: spike 1 giorno su Novu self-hosted prima di scrivere codice L7 |
| OPT-L7.2 | Quiet hours con timezone utente (ex OPT-L6.5) | Rispetto utente | Richiede tz in profilo; rinvio push fuori orario = coda delayed | ⏸ Post-L7, disegno già compatibile |
| OPT-L7.3 | Preferenze a livello tenant/organizzazione (default aziendali) | B2B multi-tenant | Secondo livello di merge delle preferenze | ⏸ Trigger: primo cliente che lo chiede |
| OPT-L7.4 | Canale webhook M2M | Integrazione clienti | Un binding + un adapter con firma HMAC | ⏸ Naturale estensione, on demand |
| OPT-L7.5 | Collapse/aggregazione cross-evento ("3 nuovi ordini" — ex OPT-L3.3) | Meno rumore | Vive bene nel digest job | ⏸ Dentro il digest, non come feature separata |

## Casi positivi / negativi / edge

| Tipo | Caso | Comportamento atteso |
|---|---|---|
| ✅ | Evento `default-on`, preferenze di default | Inbox sempre; email/push secondo default di classe |
| ✅ | Utente disattiva email per un tipo configurabile | Da quel momento solo canali attivi; inbox comunque presente se forzata |
| ✅ | Tipo `mandatory` | Inbox+email sempre, anche con tutto disattivato |
| ✅ | Frequenza `daily` su un tipo | Nessuna email immediata; una sola email digest al giorno con gli N eventi accumulati |
| ❌ | API preferenze: tentativo di disattivare una mandatory | 422 con motivo; router comunque enforcing (difesa in profondità) |
| ❌ | Preferenze illeggibili (Mongo down) | Router applica i default di classe (fail-safe: mai perdere una mandatory) e requeua? No: applica default e procede — log warn. Requeue solo se anche il publish fallisce |
| ⚠️ | Update preferenze con eventi in volo | Cache invalidata; eventi già instradati seguono le vecchie preferenze (accettato, documentato) |
| ⚠️ | Digest senza eventi accumulati | Nessuna email vuota inviata |
| ⚠️ | Digest job crash a metà composizione | Buffer marcato per batch (`digestId`); replay idempotente, nessun evento perso né duplicato |
| ⚠️ | Redelivery evento al router | Dedup su `eventId` nel router → nessun doppio fan-out |
| ⚠️ | Passaggio da `daily` a `realtime` con buffer pieno | Buffer flushato nel prossimo digest; i nuovi eventi vanno realtime (nessun evento perso) |

## Acceptance — Gherkin E2E

```gherkin
Feature: Multi-channel routing with user preferences
  As a user
  I want to control how I am notified per notification type
  So that I receive important information without noise

  Background:
    Given the routing service is consuming "q.router"
    And all channel adapters are running

  Scenario: Default routing for an operational event
    Given user "u123" has default preferences
    When an event of type "task.assigned" for userId "u123" is published
    Then an inbox notification is created
    And no marketing-class channel is used

  Scenario: User disables a configurable channel
    Given user "u123" disabled email for type "task.assigned"
    When an event of type "task.assigned" for userId "u123" is published
    Then an inbox notification is created
    And no email is sent

  Scenario: Mandatory notifications ignore opt-outs
    Given user "u123" disabled every channel for every type
    When an event of type "order.confirmed" for userId "u123" is published
    Then an inbox notification is created
    And an email is sent

  Scenario: API rejects disabling a mandatory channel
    When user "u123" attempts to disable email for type "order.confirmed"
    Then the API responds 422
    And the preference is unchanged

  Scenario: Daily digest batches events
    Given user "u123" set frequency "daily" for type "product.news"
    When 3 events of type "product.news" for userId "u123" are published
    Then no immediate email is sent
    When the daily digest job runs
    Then exactly one digest email containing 3 items is sent

  Scenario: Empty digest is not sent
    Given user "u123" set frequency "daily" for type "product.news"
    And no events were buffered
    When the daily digest job runs
    Then no email is sent

  Scenario: Preferences outage falls back to safe defaults
    Given the preferences store is unavailable
    When an event of type "order.confirmed" for userId "u123" is published
    Then the mandatory channels are still used
    And a warning is logged

  Scenario: Router deduplicates redelivered events
    Given the event "e1" was already routed
    When the event "e1" is redelivered to the router
    Then no additional channel message is published
```

## Roadmap L7 (settimane 7–8: è il livello doppio)

0. **Spike (1g, bloccante):** Novu self-hosted vs build — decisione in mini-ADR (OPT-L7.1). Quanto segue vale per il ramo "build".
1. **G1–2:** policy matrix + collection preferenze + API (validazione mandatory) — TDD sul merge classe/preferenze
2. **G3:** router — consume, load preferenze (cache), fan-out, dedup, fail-safe default
3. **G4–5:** `<PreferenceCenter>` UI
4. **G6:** digest — buffer, job, composizione template, idempotenza batch
5. **G7:** E2E Gherkin completi
6. **G8:** migrazione producer a `event.#`, deprecazione publish diretto canale, ship

---

# Roadmap complessiva

| Settimana | Ship | Dipendenze | Rischio principale |
|---|---|---|---|
| 1 | L1 Toast | — | Reconnect handling (Rabbit + WS) |
| 2 | L2 Badge | L1 (canale WS) | Drift counter (accettato fino a L3) |
| 3 | L3 Inbox | L2 | Idempotenza consumer ↔ counter |
| 4 | L4 Feed | L3 | Stabilità cursor pagination |
| 5 | L5 Email | topologia base | Outbox dispatcher; classificazione errori |
| 6 | L6 Push | L5 (deliveries) | Ciclo vita subscription |
| 7–8 | L7 Mixed | tutti | **Spike Novu prima di scrivere codice** |

**Guardrail:** se a fine settimana 2 L1 non è in prod → si semplifica lo scope, non si estende. Le OPT marcate ✅ sono le uniche promuovibili senza discussione; le ⏸ richiedono il trigger indicato; le ❌ richiedono un mini-ADR che ne ribalti il verdetto.

## Riepilogo opzioni promuovibili subito (✅)

| ID | Opzione | Livello |
|---|---|---|
| OPT-L1.3 | Toast actionable (CTA) | L1 |
| OPT-L2.3 | Badge in titolo tab/favicon | L2 |
| OPT-L3.2 | Mark as unread | L3 |
| OPT-L5.1 | Bounce/complaint webhook + suppression list | L5 (post-ship immediato) |
| OPT-L5.3 | Mailpit in dev | L5 (G1) |
| OPT-L5.4 | Publisher confirms | L5 (G1) |
| OPT-L6.2 | Collapse tag push | L6 |

# Parte B — Data layer

## B.1 Regola di assegnazione store (il "perché" prima del "cosa")

Ogni struttura dati vive nello store scelto secondo tre domande, in ordine:

1. **È un messaggio in transito?** → RabbitMQ. Mai usare code come storage: un messaggio o viene consumato o muore in DLQ. Se serve rileggerlo domani, è un dato, non un messaggio.
2. **Perderlo è un danno?** → MongoDB. Tutto ciò che è verità (inbox, esiti delivery, subscription, preferenze, outbox) sta in Mongo con indici che codificano gli invarianti (unique = idempotenza a livello DB, non solo applicativa).
3. **È ricostruibile dalla verità?** → Redis. Counter, dedup a finestra, cache preferenze: se Redis si svuota, si ricostruisce da Mongo. Corollario: **niente in Redis può essere l'unica copia di un dato importante** (l'unica eccezione, dichiarata, è il counter a L2 — sanata a L3).

Anti-pattern esclusi esplicitamente:
- Notifiche in Redis come storage primario (perdita silenziosa su eviction/restart)
- Inbox dentro il documento utente (array `notifications` embedded → unbounded array, il classico errore Mongo)
- Rabbit come event store (non è Kafka: nessun replay dopo l'ack)

## B.2 Strutture Redis

| Chiave | Tipo | TTL | Livello | Perché Redis e perché questo tipo |
|---|---|---|---|---|
| `notif:unread:{userId}` | string (INCR/DECR) | ∞ (L2) → 30gg (da L3, ricostruibile) | L2+ | Counter ad alta frequenza di lettura (ogni render della bell) e scrittura atomica; `countDocuments` a ogni mount non scala e INCR è O(1) atomico |
| `notif:seen:{eventId}` | string, `SET NX EX 3600` | 1h | L2+ | Dedup a finestra: il unique index Mongo (L3) copre l'idempotenza persistente, questa evita il roundtrip Mongo nei redelivery ravvicinati. NX = check-and-set atomico senza race |
| `notif:prefs:{userId}` | string (JSON) | 5m + invalidazione su update | L7 | Cache read-through delle preferenze: il router le legge a ogni evento; senza cache, ogni notifica costa una query Mongo. JSON string e non hash: si legge sempre intera, mai per campo |
| `ratelimit:email` | sliding window (ZSET o token bucket) | window | L5 | Rate limiting condiviso tra N istanze adapter: in-memory non funziona con più repliche |

**Scelte scartate:** Redis Streams al posto di Rabbit per il fan-out (avremmo due sistemi di messaging: violazione della regola infrastrutturale già decisa in ADR); pub/sub Redis per il badge (già veicolato dal canale WS di L1, un secondo trasporto è ridondante).

## B.3 Collection MongoDB

#### `notifications` (L3–L4) — la verità dell'inbox/feed

```js
{
  _id: ObjectId,
  eventId: "uuid",
  userId: "u123",
  type: "order.confirmed",
  title: String, body: String,
  data: {},                    // action, deep-link, contesto
  status: "unread"|"read",
  createdAt: Date, readAt: Date|null
}
```

| Indice | Scopo |
|---|---|
| `{userId:1, status:1, createdAt:-1}` | Query inbox "non lette, recenti prima" — copre il caso caldo |
| `{eventId:1, userId:1}` **unique** | Idempotenza: il redelivery non può duplicare, per costruzione |
| `{userId:1, type:1, createdAt:-1}` | Feed filtrato per tipo (L4) |
| `{createdAt:1}` TTL 90gg | Retention (L4) — delete fisico, deroga documentata alla policy soft-delete |

**Perché Mongo e perché fan-out on write:** un documento per destinatario rende la query inbox una range scan su un solo indice, lo stato read/unread è per-utente per natura, e il volume B2B (destinatari per evento nell'ordine delle decine) non giustifica fan-out on read. Documento **denormalizzato** (title/body copiati, non referenziati): la notifica è uno snapshot al momento dell'evento — se l'ordine cambia dopo, la notifica storica NON deve cambiare.

#### `outbox` (L5) — il ponte transazionale dominio → Rabbit

```js
{
  _id: ObjectId,
  eventId: "uuid",
  routingKey: "email.order-confirmed",
  payload: {},                 // message contract v1 completo
  status: "pending"|"published",
  createdAt: Date, publishedAt: Date|null,
  attempts: Number
}
```

Indici: `{status:1, createdAt:1}` (scan del dispatcher sui pending); TTL su `publishedAt` 7gg (i pubblicati sono usa-e-getta, breve finestra per debug).

**Perché esiste:** è l'unico modo di rendere atomico "commit di dominio + intento di notifica" senza distributed transaction verso Rabbit. Il dispatcher legge via **change stream** (latenza ~0) con **polling di fallback ogni 30s** (change stream può perdere il resume token su restart lunghi). Requisito: Mongo replica set (necessario sia per transazioni sia per change stream) — vale anche in dev (`mongod --replSet rs0` single-node).

#### `deliveries` (L5–L6) — registro esiti per idempotenza invii

```js
{
  eventId: "uuid", channel: "email"|"push", userId: "u123",
  endpoint: String|null,       // per push: subscription endpoint
  status: "sent"|"failed",
  provider: String, providerMessageId: String|null,
  error: String|null, sentAt: Date
}
```

Indice **unique** `{eventId:1, channel:1, userId:1, endpoint:1}`.

**Perché una collection separata e non un flag su `notifications`:** email e push possono esistere senza documento inbox (dipende dal routing), e un invio è un *fatto operativo* con provider/errore/timestamp — dominio diverso dallo stato di lettura. È anche la base dati per il runbook di replay dalla DLQ.

#### `push_subscriptions` (L6)

```js
{ userId, endpoint, keys: {p256dh, auth}, userAgent, createdAt, lastUsedAt }
```

Indici: unique `{endpoint:1}`; `{userId:1}`. **Perché unique su endpoint e non su userId:** N device per utente; l'endpoint è l'identità reale della subscription. Cleanup: delete su 404/410 (fatto dall'adapter, non da un job — il segnale arriva gratis al momento dell'invio).

#### `notification_preferences` (L7)

```js
{ userId, matrix: { "task.assigned": { email: false, push: true }, ... }, updatedAt }
```

Un documento per utente, unique `{userId:1}`. **Sparse per design:** contiene solo le deviazioni dai default di classe; il merge `classe → deviazioni` avviene nel router. Perché: i default cambiano per policy senza migrare milioni di documenti, e "torna al default" = delete della chiave.

#### `digest_buffer` (L7)

```js
{ userId, type, eventId, payload, frequency: "daily"|"weekly",
  digestId: null|"uuid",       // marcato dal job alla presa in carico
  createdAt }
```

Indici: `{userId:1, frequency:1, digestId:1}`; unique `{eventId:1, userId:1}`.

**Perché Mongo e non una delayed queue Rabbit:** il digest deve *aggregare* N messaggi in una email sola — una coda consegna messaggi uno a uno, non fa group-by. Il two-phase del job (1: `digestId = uuid` sui candidati; 2: componi e invia; 3: delete by digestId) rende il replay idempotente dopo crash a metà.

## B.4 Mappa struttura → livello

```
L1  —            (nessuna persistenza: è il punto)
L2  Redis: unread counter, seen dedup
L3  Mongo: notifications          Redis: counter diventa cache
L4  Mongo: TTL + indice type
L5  Mongo: outbox, deliveries     Redis: ratelimit
L6  Mongo: push_subscriptions     (+deliveries riusata)
L7  Mongo: preferences, digest_buffer   Redis: prefs cache
```

---

# Parte C — Pattern UI ricorrenti (React)

## C.1 Decisioni di stack FE

| Ruolo | Scelta | Perché |
|---|---|---|
| Server state | **TanStack Query** | Inbox/feed/preferenze sono server state: cache, refetch, optimistic update e infinite query sono esattamente il suo dominio. Reinventarlo con useEffect+useState è il bug factory classico |
| Realtime | **socket.io-client** dietro un hook custom | Coerente col gateway L1; l'app non importa mai socket.io direttamente (vedi 2.2) |
| Client state | Context + useReducer, **niente Redux** | Lo stato puramente client è solo la coda toast e lo stato connessione: due reducer. Redux qui è over-engineering |
| Styling/A11y | Radix primitives (Popover, Switch) o equivalente headless | Dropdown bell e preference matrix hanno requisiti a11y non banali (focus trap, aria) — non reinventarli |

## C.2 Pattern 1 — `NotificationProvider` (connessione come singleton di albero)

Un solo provider monta la socket, gestisce auth/reconnect, ed espone un **event bus tipizzato**. Nessun componente apre socket proprie.

```jsx
// Uso nei componenti: mai socket, solo subscribe
const { subscribe, status } = useNotifications();

useEffect(() => subscribe('toast', onToast), [subscribe]);
```

Responsabilità del provider: connect/disconnect col login, re-auth su token refresh, **dedup centralizzata su `eventId`** (Set con finestra — così nessun consumer UI deve rifarla), stato connessione esposto (`connected|reconnecting|offline`) per l'indicatore.

**Perché pattern e non libreria:** il contratto (eventi tipizzati + dedup + auth) è nostro; la libreria sotto (socket.io vs SSE, OPT-L1.4) resta sostituibile senza toccare i componenti.

## C.3 Pattern 2 — `ToastHost`: portal + reducer a coda (L1)

- **Portal** su `document.body`: i toast non appartengono al layout.
- Stato = `useReducer` con azioni `PUSH | DISMISS | EXPIRE`: la logica "max 3 visibili, resto FIFO" è una pura funzione di reducer → **unit-testabile senza render**.
- Timer di auto-dismiss dentro il singolo `<Toast>` (cleanup su unmount), pausa su hover.
- `aria-live="polite"` sul container, non sui singoli toast.

Questo reducer è il pattern-madre: qualsiasi "coda di elementi effimeri con cap" (upload progress, undo snackbar) è lo stesso reducer con altra grafica.

## C.4 Pattern 3 — `NotificationBell`: server state + patch realtime (L2)

Il problema ricorrente: un dato ha **due sorgenti** (fetch iniziale + eventi WS). Soluzione standard, riusata identica per feed e inbox:

```jsx
const { data: count } = useQuery({ queryKey: ['notif','count'], queryFn: fetchCount });

useEffect(() => subscribe('badge', ({ count }) =>
  queryClient.setQueryData(['notif','count'], count)   // patch, non refetch
), []);
```

Regole: l'evento WS **patcha la cache** di TanStack Query (una sola fonte di verità lato client: la query cache); su `reconnect` → `invalidateQueries` (il gap offline non è recuperabile via eventi, si risincronizza via fetch). Cap visuale 99+ è una pura funzione di formatting, testata a parte.

## C.5 Pattern 4 — `InboxPanel`: optimistic update con rollback (L3)

Mark-as-read deve essere istantaneo. Pattern TanStack canonico:

```jsx
useMutation({
  mutationFn: markRead,
  onMutate: async (id) => {
    await queryClient.cancelQueries(['notif']);
    const prev = snapshot();
    patchCache(id, { status: 'read' });   // UI subito
    decrementBadge();
    return { prev };
  },
  onError: (_e, _id, ctx) => restore(ctx.prev),   // rollback
  onSettled: () => queryClient.invalidateQueries(['notif','count']),
});
```

Invarianti da testare: doppio click = una sola mutation (disable durante pending); rollback ripristina anche il badge; read-all è la stessa struttura su lista intera.

## C.6 Pattern 5 — `FeedPage`: `useInfiniteQuery` guidata dal cursore BE (L4)

```jsx
useInfiniteQuery({
  queryKey: ['notif','feed', filters],
  queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam, ...filters }),
  getNextPageParam: (last) => last.nextCursor ?? undefined,
});
```

- Il cursore è **opaco**: la UI non lo interpreta mai (il BE può cambiarne il formato).
- `filters` dentro la queryKey → cambio filtro = nuova query, cursore azzerato gratis (edge case della spec risolto by design).
- Trigger di caricamento: `IntersectionObserver` su sentinella, non scroll listener.
- Group-by-day è una `useMemo` di presentazione sulle pagine flatten — mai chiedere al BE di raggruppare.

## C.7 Pattern 6 — `PushOptIn`: state machine del permesso (L6)

Il permesso browser è una macchina a stati non banale, da modellare esplicitamente:

```
idle → soft-prompt-shown → native-requested → granted → subscribed
                        ↘ dismissed (localStorage, non riproporre per X gg)
                          native-requested → denied (terminale: solo istruzioni manuali)
```

Regole: la richiesta nativa parte **solo da un gesto utente** sul soft prompt; `denied` è irreversibile via codice → la UI mostra come sbloccare dalle impostazioni browser, non un bottone rotto; unsubscribe al logout.

## C.8 Pattern 7 — `PreferenceCenter`: matrice controllata + optimistic batch (L7)

- Sorgente UI = **matrice già mergiata dal BE** (classe + deviazioni): il client non conosce i default di classe, così policy nuove non richiedono deploy FE.
- Toggle `mandatory`: renderizzati disabled con tooltip del perché — lo stato disabled arriva dal BE (`editable: false`), non hardcodato.
- Salvataggio: **debounce + batch** (una PATCH con il diff, non una per toggle), optimistic con rollback per riga.
- Il selettore frequenza (realtime/daily/weekly) riusa lo stesso mutation pattern di 2.5.

## C.9 Riepilogo: 3 pattern trasversali, 7 applicazioni

| Pattern trasversale | Dove ricorre |
|---|---|
| **Query cache patchata da eventi WS** (fetch = verità al mount, WS = patch incrementale, reconnect = invalidate) | Bell, InboxPanel, FeedPage |
| **Optimistic mutation con snapshot/rollback** | mark read, read-all, preferenze, unsubscribe push |
| **Reducer puro per stato effimero con vincoli** (cap, FIFO, dedup) | ToastHost, connection status, coda offline |

Se un componente nuovo non rientra in uno di questi tre, è il segnale per fermarsi e chiedersi perché — non per inventare un quarto pattern.


---

# Parte D — Scelta del database: Mongo è il migliore?

Risposta onesta: **no in assoluto, sì in questo contesto.** La decisione è infrastrutturale, non funzionale — stesso principio applicato a Rabbit-vs-BullMQ.

## D.1 Confronto sul merito

| Requisito del sistema | MongoDB | PostgreSQL | Verdetto sul merito |
|---|---|---|---|
| Outbox transazionale | Transazioni multi-doc, **richiede replica set** | Transazioni native, outbox = pattern da manuale | **PG vince**: l'outbox è nato lì |
| Notifica dispatcher | Change stream (+ resume token da gestire) | LISTEN/NOTIFY o polling `FOR UPDATE SKIP LOCKED` | **PG vince**: `SKIP LOCKED` è più semplice e robusto del change stream |
| Documento notifica denormalizzato | Naturale (payload flessibile) | JSONB, equivalente | Pari |
| Retention | TTL index (gratis, ma delete in batch dal monitor thread) | `pg_cron` + delete partizionato, o partizioni droppate | Pari (PG più controllabile su volumi alti) |
| Idempotenza via unique | Unique compound index | Unique constraint | Pari |
| Cursor pagination | Keyset su `(createdAt,_id)` | Keyset identico | Pari |

Se partissi da zero senza stack: **PostgreSQL sarebbe la scelta di default** — outbox, SKIP LOCKED e vincoli relazionali sulle preferenze pesano più della flessibilità di schema, che qui serve poco (gli schemi sono stabili).

## D.2 Perché comunque Mongo, qui

1. **È già nello stack** (con Redis): introdurre PG per il solo sistema notifiche = un database in più da fare backup, monitorare, patchare. Il costo operativo di un secondo DBMS supera il vantaggio tecnico di SKIP LOCKED.
2. Le competenze operative (indici, profiling, replica set) sono già in casa.
3. Nessun requisito del sistema è *impossibile* o *fragile* su Mongo: change stream ha più spigoli di SKIP LOCKED, ma con polling di fallback è affidabile.

**Threshold di re-valutazione (da ADR):** se il progetto ospite adotta PG come primario per altre ragioni → il sistema notifiche migra (gli schemi sono già relational-friendly: nessun embedded, nessun array unbounded, by design). Vietato invece far entrare PG *a causa* delle notifiche.

## D.3 Vincolo operativo derivante

L'outbox (L5) richiede **replica set anche in dev/CI** (`mongod --replSet rs0` single-node nel compose e in testcontainers). Va nel G1 di L5, non scoperto a G4.

---

# Parte E — Osservabilità, azioni manuali, diagnosi e retro

> Il principio: ogni livello shippa **con** la sua osservabilità, non "dopo". Una coda senza metrica di depth non è in prod, è in produzione-speranza.

## E.1 Correlazione: l'`eventId` è il trace id

Regola non negoziabile: **ogni log line di ogni componente include `eventId`** (e `userId`, `channel` dove esistono). Log strutturati JSON col logger già in uso nei progetti. Questo rende possibile l'intera Parte E.3 (diagnosi): la storia di una notifica si ricostruisce con un solo filtro.

Formato minimo:

```json
{ "level":"info", "msg":"delivery.sent", "eventId":"…", "channel":"email",
  "userId":"…", "durationMs":142, "component":"email-adapter" }
```

Eventi log standard (naming fisso, l'agente/il grep ci si affida): `outbox.stored`, `outbox.published`, `consumer.received`, `consumer.discarded` (+reason), `delivery.sent`, `delivery.failed` (+permanent|transient), `delivery.deduped`, `message.dead`, `message.expired`.

## E.2 Metriche e alert per livello

Stack: metriche Prometheus-format (esposte da ogni servizio su `/metrics`) → VictoriaMetrics; `rabbitmq_prometheus` plugin per il broker; uptime dei servizi via Uptime Kuma; error tracking Sentry.

| Metrica | Componente | Alert | Soglia iniziale |
|---|---|---|---|
| `rabbitmq_queue_messages{queue}` | broker | Depth crescente = consumer fermo o lento | >100 per 5m (durable) |
| `rabbitmq_queue_messages{queue=~".*dead"}` | broker | **Qualsiasi messaggio in DLQ** | >0 per 10m → page |
| `notif_ws_connections` | gateway L1 | Crollo improvviso = gateway/auth rotto | −80% in 5m |
| `notif_delivery_latency_seconds{channel}` (histogram, publish→sent) | adapter | Degrado silente | p95 >30s email, >5s toast |
| `notif_delivery_total{channel,outcome}` | adapter | Error rate | failed/total >5% su 15m |
| `notif_outbox_pending_age_seconds` (max age dei pending) | dispatcher L5 | **Dispatcher morto**: la metrica più importante del sistema | >120s |
| `notif_push_expired_total` | push L6 | Solo trend (scarto by design), no page | review settimanale |
| `notif_counter_drift` (dal job riconciliazione) | job L3 | Bug idempotenza se sistematico | drift ≠0 su >1% utenti |
| `notif_digest_buffer_size` / età max buffer | L7 | Digest job fermo | età > 2× frequenza |

Dashboard: una per il **funnel** (published → consumed → sent, per canale — i buchi tra le barre SONO i bug) + una per broker (depth/rate per coda) + una per latenze.

## E.3 Runbook di diagnosi: "l'utente non ha ricevuto la notifica"

Procedura in ordine, con exit point espliciti — eseguibile a mano o da un futuro slash command di diagnosi:

```
1. outbox:      db.outbox.find({eventId})
   ├─ assente            → il dominio non ha mai emesso: bug a monte, STOP
   ├─ status:pending     → dispatcher fermo → runbook E.4.2, STOP
   └─ published ↓
2. broker:      log "consumer.received" per eventId (o Rabbit mgmt se in volo)
   ├─ mai consumato + coda profonda → consumer fermo/crash loop → E.4.3
   └─ consumato ↓
3. deliveries:  db.deliveries.find({eventId})
   ├─ status:failed      → leggere error: permanente? → messaggio in DLQ → E.4.1
   ├─ deduped            → già inviata prima: cercare la delivery originale
   ├─ assente + log "consumer.discarded" → motivo nel log (schema? flag off? no subscription?)
   └─ status:sent ↓
4. provider/client:
   ├─ email → providerMessageId presso il provider (bounce? spam?) → suppression list
   ├─ push  → subscription eliminata (410)? permesso browser revocato?
   ├─ toast → utente era offline: comportamento CORRETTO, non bug
   └─ inbox → documento c'è ma UI non lo mostra → bug FE (filtri/cache)
5. L7: verificare routing → preferenze utente + classe del tipo:
   canale disattivato dall'utente = comportamento corretto, non bug.
```

Punto 5 è quello che distingue un incident da un non-problema: **prima di aprire un bug, verificare che la mancata consegna non sia una preferenza.**

## E.4 Runbook azioni manuali

### E.4.1 Replay dalla DLQ

1. Leggere i messaggi in `q.*.dead` (shovel verso coda di ispezione o mgmt UI) — **mai** requeue alla cieca.
2. Classificare: errore transitorio risolto (provider down) → replay; permanente (indirizzo rotto, schema) → fix a monte, poi decidere se il replay ha ancora senso (una email di conferma di 3 giorni fa forse no).
3. Replay = ri-publish sull'exchange con routing key originale (script `replay-dead.js`, input: coda + filtro eventId opzionale). L'idempotency di `deliveries` garantisce che i già-inviati nel batch non partano due volte → **il replay è sempre safe**, è il motivo per cui l'idempotenza è ovunque.
4. Registrare l'esito nella retro (E.5).

### E.4.2 Outbox bloccata (pending age in alert)

1. Il dispatcher è vivo? (Uptime Kuma / log) — se morto: restart, il polling di fallback recupera tutto da solo.
2. Vivo ma fermo → change stream con resume token invalido: restart forza il re-seed dal polling.
3. Pending "avvelenati" (publish fallisce sempre, es. payload oltre limiti): marcare `status:"skipped"` + motivo, alert dedicato, fix, eventuale re-mark a pending.

### E.4.3 Consumer in crash loop

1. Sintomo: depth cresce + redelivery continui dello stesso messaggio (poison message che passa la validazione ajv ma rompe la logica).
2. Azione immediata: **kill switch del canale** (feature flag) per fermare l'emorragia — il resto del sistema continua.
3. Spostare il poison message in dead (reject senza requeue mirato), riattivare il canale, fix con TDD partendo dal payload incriminato come fixture.

### E.4.4 Riconciliazione counter manuale

`node reconcile-counters.js [--user u123]` — stesso codice del job notturno, on-demand. Da usare dopo incident su Redis o drift in alert. Output: delta per utente, log del prima/dopo.

### E.4.5 Purge subscription push

`node purge-subscriptions.js --older-than 180d --dry-run` — subscription con `lastUsedAt` vecchio. Sempre dry-run prima. (I 404/410 si auto-puliscono; questo copre solo i device abbandonati mai più raggiunti.)

## E.5 Retro e igiene periodica

**Checklist retro settimanale** (input per lo slash command di retro del flusso agentico):

- [ ] DLQ: quanti messaggi, quali cause? Ogni causa ricorrente → story di fix, non replay ripetuto (replay ricorrente = bug tollerato)
- [ ] `delivery.deduped` count: dedup frequente = qualcuno pubblica doppio → cercare il producer
- [ ] Counter drift: trend a zero? Se sistematico → bug idempotenza aperto come story
- [ ] p95 latency per canale: trend settimana su settimana
- [ ] `push_expired` e subscription 410: tasso di churn push accettabile?
- [ ] Funnel dashboard: buchi tra published/consumed/sent spiegati?
- [ ] Alert scattati: quanti erano actionable? Alert mai actionable per 4 settimane → si rimuove o si rialza la soglia (igiene anti alert-fatigue)

**Mensile:** review soglie alert con i dati reali (le soglie in E.2 sono starting point dichiarati, non verità); test del runbook E.4.1 in ambiente di staging (un runbook mai provato è un runbook rotto).

## E.6 Osservabilità nella roadmap (integrazione, non fase a parte)

| Settimana | Ship osservabilità insieme al livello |
|---|---|
| 1 (L1) | Log strutturati con eventId ovunque + `/metrics` base + `notif_ws_connections` |
| 2 (L2) | Dedup counter metric, dashboard broker (plugin prometheus Rabbit) |
| 3 (L3) | Job riconciliazione + `counter_drift`, funnel dashboard v1 |
| 5 (L5) | `outbox_pending_age` + alert (il più critico), alert DLQ, script `replay-dead.js`, runbook E.3/E.4 scritti |
| 6 (L6) | `push_expired`, script purge |
| 7–8 (L7) | Metriche digest/routing, punto 5 della diagnosi |

**Guardrail:** niente tracing distribuito (OTel) in questa fase — la correlazione via eventId sui log strutturati copre il 95% della diagnosi a una frazione del costo. Trigger per OTel: quando i componenti superano ~6 servizi deployati separatamente o la diagnosi via log fallisce 3 volte in una retro.

---

# Parte F — Backlog: epiche, storie e stima SP (bozza per PO/TL)

> **Bozza di primo taglio** da passare al flusso Gestazionale: l'agente PO valida valore/priorità e scrive le ready story col template; l'agente TL (adversarial) contesta le stime e spacca le 8. Scala Fibonacci 1-2-3-5-8. **Regola: una story da 8 non è "ready"** — va spezzata prima di entrare nel flusso Tecnico. Le stime assumono lo stack già deciso (zero spike tecnologici salvo S7.0).
>
> Corsie di parallelizzazione per subagenti: `[BE]` `[FE]` `[QA]` `[OPS]`. Stories nella stessa corsia con dipendenza esplicita sono sequenziali; corsie diverse senza dipendenza girano in parallelo.

## F.0 Convenzioni per la decomposizione

Ogni ready story derivata da questa bozza deve referenziare: sezione della spec (es. `L3 §casi`), scenari Gherkin coperti (id), file di contratto (JSON Schema, Rascal config, OpenAPI quando esisterà), mappa test (quali invarianti unit vs integration vs E2E), out-of-scope ereditato dalle tabelle OPT. DoD uniforme: `gate-quality.sh` verde + scenari della story verdi + log events standard emessi.

## EP0 — Foundation (dentro settimana 1)

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S0.1 | Compose dev: Rabbit(+prometheus plugin), Mongo **replica set single-node**, Redis, mailpit | OPS | — | 2 |
| S0.2 | Config Rascal dichiarativa: exchange `notifications`, convenzioni naming code/binding | BE | S0.1 | 3 |
| S0.3 | Message contract v1: JSON Schema in repo + package validatore ajv riusabile | BE | — | 2 |
| S0.4 | Test harness: testcontainers (Rabbit/Mongo-RS/Redis) + aggancio a gate-quality | QA | S0.1 | 3 |
| S0.5 | Logging strutturato: eventId ovunque + naming eventi log standard (E.1) | BE | — | 2 |

**EP0 = 12 SP**

## EP1 — Toast realtime (L1)

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S1.1 | WS gateway: handshake JWT, room `user:{id}`, lifecycle connessioni | BE | EP0 | 3 |
| S1.2 | Consumer `q.toast` (exclusive/auto-delete) → dispatch in room + scarto payload invalidi | BE | S1.1 | 3 |
| S1.3 | `NotificationProvider` FE: bus tipizzato, dedup eventId, stati connessione, re-auth | FE | S0.3 | 5 |
| S1.4 | `<ToastHost>`: reducer coda (cap 3, FIFO), portal, auto-dismiss, a11y | FE | S1.3 | 3 |
| S1.5 | E2E L1: `.feature` + step definitions (7 scenari) | QA | S1.2,S1.4 | 5 |
| S1.6 | Hardening reconnect (broker e WS) + metrica `ws_connections` + `/metrics` base | BE/OPS | S1.5 | 3 |

**EP1 = 22 SP** · Unit critici: reducer toast, dedup provider. Integration: consumer→room.

## EP2 — Badge counter (L2)

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S2.1 | Consumer `q.inbox` lite: INCR + dedup `seen` NX + nack/requeue su Redis down | BE | EP1 | 3 |
| S2.2 | API `GET/DELETE /notifications/count` con degradazione `{count:null}` e clamp | BE | S2.1 | 2 |
| S2.3 | `<NotificationBell>`: query cache + patch WS + cap 99+ + broadcast azzeramento | FE | S1.3 | 3 |
| S2.4 | E2E L2 (7 scenari) + dashboard broker | QA/OPS | S2.2,S2.3 | 3 |

**EP2 = 11 SP** — settimana leggera: buffer naturale per lo slittamento di EP1, non riempirla di OPT.

## EP3 — Inbox (L3)

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S3.1 | Collection `notifications` + indici (unique eventId+userId) + refactor consumer: Mongo→Redis→badge, INCR solo su insert effettivo | BE | EP2 | 5 |
| S3.2 | API list (offset), `PATCH read` idempotente con decremento condizionato, `read-all` | BE | S3.1 | 3 |
| S3.3 | `<InboxPanel>`: optimistic read con rollback, read-all, navigazione `data.action` | FE | S3.2 | 5 |
| S3.4 | Job riconciliazione counter + metrica `counter_drift` + CLI on-demand (E.4.4) | BE/OPS | S3.1 | 3 |
| S3.5 | E2E L3 (8 scenari) + funnel dashboard v1 | QA/OPS | S3.3 | 5 |

**EP3 = 21 SP** · Unit: transizioni stato + decremento condizionato. Integration: unique index sotto redelivery.

## EP4 — Feed storico (L4)

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S4.1 | Endpoint feed: cursor keyset opaco + filtri type/range + indice dedicato | BE | EP3 | 5 |
| S4.2 | TTL retention 90gg + migrazione API L3 offset→cursor | BE | S4.1 | 2 |
| S4.3 | `<FeedPage>`: useInfiniteQuery, IntersectionObserver, group-by-day, empty state | FE | S4.1 | 5 |
| S4.4 | E2E L4 (7 scenari, focus proprietà cursore: no-dup/no-skip) | QA | S4.3 | 3 |

**EP4 = 15 SP** · Unit: encode/decode cursore, formatter group-by-day (property-based sul cursore consigliato).

## EP5 — Email garantita (L5) ⚠️ epica più densa

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S5.1a | Outbox: collection + write transazionale col dominio + dispatcher via change stream + publisher confirms | BE | EP0 | 5 |
| S5.1b | Dispatcher: polling fallback 30s, gestione resume token, stato `skipped` per avvelenati | BE | S5.1a | 3 |
| S5.2 | Retry topology Rascal (30s/5m/1h/dead) + classificatore errori permanenti/transitori | BE | EP0 | 5 |
| S5.3 | Adapter email: idempotency `deliveries` (unique), template engine, rate limiter Redis | BE | S5.2 | 5 |
| S5.4 | E2E L5 (7 scenari, incluso outage broker e crash adapter) | QA | S5.1b,S5.3 | 5 |
| S5.5 | OPS L5: alert `outbox_pending_age` + DLQ>0, `replay-dead.js`, runbook E.3/E.4 in repo, kill switch | OPS | S5.4 | 5 |

**EP5 = 28 SP** — sopra la velocity di una settimana: **il PO deve decidere** se (a) spostare S5.5 a inizio settimana 6, o (b) accettare 1,5 settimane e comprimere EP6. Raccomandazione TL: opzione (a) è vietata per l'alerting outbox/DLQ (senza, la garanzia è finta) → accettare (b).

## EP6 — Web Push (L6)

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S6.1 | Collection subscriptions + API register/unregister + VAPID in secret + cleanup logout | BE | EP5 | 3 |
| S6.2 | Service worker + `<PushOptIn>` state machine (soft prompt, denied terminale) | FE | S6.1 | 5 |
| S6.3 | Adapter push: fan-out multi-endpoint, delete su 404/410, idempotency, TTL coda 15m | BE | S6.1 | 5 |
| S6.4 | E2E L6 (7 scenari, fake push service) | QA | S6.2,S6.3 | 3 |
| S6.5 | Metrica `push_expired` + `purge-subscriptions.js` dry-run | OPS | S6.3 | 2 |

**EP6 = 18 SP** · Unit: state machine opt-in (tutte le transizioni), selettore payload <4KB.

## EP7 — Mixed + preferenze (L7)

| ID | Story | Corsia | Dip. | SP |
|---|---|---|---|---|
| S7.0 | **Spike Novu vs build** — timebox 1g, output: mini-ADR. Bloccante per tutta l'epica | BE | EP5,EP6 | 3 |
| S7.1 | Policy matrix (classi mandatory/default-on/off) + collection preferences + API con 422 su mandatory | BE | S7.0 | 5 |
| S7.2a | Router core: consume `q.router`, merge classe+preferenze, fan-out routing key | BE | S7.1 | 5 |
| S7.2b | Router hardening: cache prefs (TTL+invalidation), dedup eventId, fail-safe default su store down | BE | S7.2a | 3 |
| S7.3 | `<PreferenceCenter>`: matrice da BE (`editable` flag), debounce+batch PATCH, optimistic per riga | FE | S7.1 | 5 |
| S7.4a | Digest: buffer + job two-phase (digestId) idempotente | BE | S7.2b | 5 |
| S7.4b | Digest: composizione template multi-item + frequenze + flush su cambio frequenza | BE | S7.4a | 3 |
| S7.5 | E2E L7 (8 scenari) | QA | S7.3,S7.4b | 5 |
| S7.6 | Migrazione producer → `event.#`, deprecazione publish diretto canale, metriche routing | BE/OPS | S7.5 | 3 |

**EP7 = 37 SP** (2 settimane, conferma la roadmap). Se lo spike S7.0 sceglie Novu, EP7 si riscrive: S7.1–S7.4 diventano integrazione (~15-20 SP) e S7.6 resta.

## F.1 Riepilogo e capacity check

| Epica | SP | Settimana |
|---|---|---|
| EP0 Foundation | 12 | 1 (con EP1) |
| EP1 Toast | 22 | 1 → **34 con EP0: sfora** |
| EP2 Badge | 11 | 2 |
| EP3 Inbox | 21 | 3 |
| EP4 Feed | 15 | 4 |
| EP5 Email | 28 | 5 (+coda in 6) |
| EP6 Push | 18 | 6 |
| EP7 Mixed | 37 | 7–8 |
| **Totale** | **164** | 8 settimane |

**Flag onesto per il PO:** con velocity ~20 SP/settimana, la settimana 1 (EP0+EP1 = 34) non chiude. Correzione proposta senza toccare la north-star: EP0 parte come pre-sprint (2-3 giorni prima) **oppure** S1.6 e la parte dashboard di S2.4 scivolano nella settimana 2, che a 11 SP ha spazio (è il suo ruolo di buffer). Seconda opzione raccomandata: EP0 anticipato "perché tanto è setup" è la scusa classica per non shippare in settimana 1.

**Prime 3 azioni per gli agenti:** (1) PO: validare priorità e trasformare EP0+EP1 in ready story col template; (2) TL adversarial: contestare le stime 5 di S1.3/S1.5 e ogni residuo split delle ex-8; (3) QA: convertire i Gherkin L1 della Parte A in `.feature` file eseguibili — sono il contratto, vanno in repo prima del primo commit di codice.

---

# Parte G — Golden sample: ready story S1.4

> Formato di riferimento per tutte le ready story derivate dalla Parte F. È il contratto tra flusso Gestazionale e Tecnico: l'agente implementatore NON deve prendere decisioni fuori da quanto scritto qui — se serve una decisione non coperta, la story torna al PO, non si improvvisa.

---

## S1.4 — `<ToastHost>` component

| Campo | Valore |
|---|---|
| Epica | EP1 — Toast realtime (L1) |
| SP | 3 |
| Corsia | FE |
| Dipendenze | S1.3 (`NotificationProvider` — consumo della sua API) |
| Blocca | S1.5 (E2E L1) |
| Spec ref | Parte A §L1 (design, tabella casi), Parte C §C.3 (pattern reducer+portal) |
| Branch | `feat/S1.4-toast-host` |

### Story

Come utente connesso, quando arrivano eventi toast voglio vederli comparire in modo non invasivo, con al massimo 3 visibili contemporaneamente e i restanti in coda, così da essere informato senza che la UI diventi rumore.

### Contratti referenziati (input immutabili per l'implementatore)

1. **Message contract v1** — `contracts/notification-event.v1.schema.json`. Il componente riceve eventi **già validati e deduplicati** dal provider: non rivalida, non rideduplica.
2. **API del provider (S1.3)** — unica dipendenza di runtime:

```ts
// from S1.3 — do not redefine
type ToastEvent = { eventId: string; type: string; title: string;
                    body: string; data?: { action?: string }; ts: string };
useNotifications(): {
  subscribe(channel: 'toast', handler: (e: ToastEvent) => void): () => void;
  status: 'connected' | 'reconnecting' | 'offline';
}
```

### Decisioni già prese (non riaprire)

- Stato = `useReducer` con azioni `PUSH | DISMISS | EXPIRE`; il reducer è una **funzione pura esportata** e testata senza render.
- Render via **portal** su `document.body`; container con `aria-live="polite"` e `role="status"`.
- Cap: **3 visibili**, overflow in coda FIFO; all'uscita di uno, entra il primo in coda.
- Auto-dismiss **5s** per toast, timer nel singolo `<Toast>` con cleanup su unmount; **pausa su hover/focus**, ripresa al leave.
- Dismiss manuale sempre disponibile (bottone con `aria-label`).
- Se `data.action` presente → toast cliccabile, click = navigazione + dismiss (OPT-L1.3 promossa: unica OPT in scope).

### Out of scope (ereditato — non implementare)

- Persistenza/recupero eventi (❌ OPT-L1.1), stacking configurabile, posizioni multiple, suoni, animazioni oltre enter/exit base, dedup (vive nel provider), gestione stato connessione (vive nel provider).

### Acceptance — scenari di competenza della story

```gherkin
# toast-host.component.feature — component-level (React Testing Library)
Feature: ToastHost display behavior

  Scenario: Toasts appear up to the visible cap
    Given the host received 5 toast events
    Then exactly 3 toasts are visible
    And 2 are queued in arrival order

  Scenario: Queue drains in FIFO order
    Given 3 visible toasts and 2 queued
    When the oldest visible toast is dismissed
    Then the first queued toast becomes visible

  Scenario: Auto-dismiss after 5 seconds
    Given a visible toast
    When 5 seconds elapse
    Then the toast is removed

  Scenario: Hover pauses auto-dismiss
    Given a visible toast hovered at second 4
    When 3 more seconds elapse while hovered
    Then the toast is still visible
    When the pointer leaves
    Then the toast is removed after the remaining time

  Scenario: Manual dismiss removes only the target toast
    Given 3 visible toasts
    When the second toast is dismissed manually
    Then the other 2 remain visible

  Scenario: Actionable toast navigates on click
    Given a visible toast with an action target
    When the toast body is clicked
    Then navigation to the action target is triggered
    And the toast is dismissed

  Scenario: Container is announced politely
    Then the toast container has aria-live "polite"
```

> Gli scenari E2E del canale completo (publish → toast, offline, burst reale) appartengono a **S1.5** e non vanno duplicati qui.

### Mappa test (TDD top-down)

| Livello | Cosa | Note |
|---|---|---|
| Unit | Reducer: PUSH sotto/sopra cap, DISMISS visibile/in coda, EXPIRE, ordine FIFO, DISMISS di id inesistente = no-op | Prima cosa da scrivere. Zero DOM |
| Component (RTL) | I 7 scenari sopra, fake timers per i tempi | Provider mockato sulla firma del contratto §2 |
| E2E | — | Deferito a S1.5 |

### DoD

- [ ] `gate-quality.sh` verde (lint, type-check, coverage soglia di progetto)
- [ ] Reducer: 100% branch coverage (è puro, non ci sono scuse)
- [ ] 7 scenari component verdi
- [ ] Nessun import diretto di socket.io/client: solo `useNotifications`
- [ ] Nessuna nuova dipendenza npm senza approvazione (animazioni: CSS transition, non librerie)
- [ ] Commit convenzionali con riferimento story

### Note per l'agente implementatore

Ordine TDD obbligato: (1) reducer test-first fino a verde completo; (2) `<Toast>` singolo con timer/hover; (3) host+portal componendo i due; (4) scenari component. Se durante l'implementazione emerge un caso non coperto dagli scenari (es. evento con `title` vuoto), **non decidere**: annotare nel report di story e chiedere — il contratto dice che il payload è già validato, quindi è probabilmente un bug di S1.3 o dello schema, non tuo.

---


---

# Parte H — Struttura del progetto su GitHub

> Principio guida: **il repo è la memoria degli agenti**. Tutto ciò che un agente deve sapere per lavorare (contratti, story, ADR, feature file) vive versionato nel repo — GitHub Issues/Projects sono lo specchio per il tracking umano, mai la fonte di verità. Un agente che deve chiamare un'API per leggere la sua story ha già perso.

## H.1 Layout monorepo

```
notification-system/
├── CLAUDE.md                        # regole per gli agenti (punta a docs/, contracts/, backlog/)
├── package.json                     # workspaces npm
├── docker-compose.yml               # rabbit(+prometheus), mongo --replSet, redis, mailpit
├── gate-quality.sh                  # unico gate: husky, hook Stop, CI chiamano QUESTO
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                   # lint+type+unit+integration (testcontainers) → gate-quality.sh
│   │   └── e2e.yml                  # feature file su compose effimero (su PR verso develop)
│   ├── ISSUE_TEMPLATE/story.yml     # specchio del template Parte G
│   └── pull_request_template.md     # checklist DoD + link story
├── contracts/                       # ⭐ fonte di verità cross-package, zero logica
│   ├── notification-event.v1.schema.json
│   ├── openapi.yaml                 # API REST (da S3.2 in poi)
│   └── log-events.md                # naming eventi log standard (E.1)
├── packages/
│   ├── shared/                      # validatore ajv, logger factory, tipi generati dai contratti
│   ├── rascal-config/               # topologia dichiarativa (exchange, code, retry, DLX)
│   ├── ws-gateway/                  # L1
│   ├── inbox-consumer/              # L2–L3
│   ├── outbox-dispatcher/           # L5
│   ├── adapter-email/               # L5
│   ├── adapter-push/                # L6
│   ├── router/                      # L7
│   ├── api/                         # REST (count, inbox, feed, preferences)
│   └── web/                         # React: provider, ToastHost, Bell, Inbox, Feed, PrefCenter
├── e2e/
│   ├── features/                    # .feature = QUESTI sono il contratto, non i blocchi nel md
│   │   ├── L1-toast/*.feature
│   │   └── …
│   ├── steps/
│   └── support/                     # testcontainers bootstrap, fake SMTP/push service
├── ops/
│   ├── scripts/                     # replay-dead.js, reconcile-counters.js, purge-subscriptions.js
│   ├── runbooks/                    # E.3/E.4 come file autonomi (diagnosi.md, replay-dlq.md, …)
│   └── dashboards/                  # json/config funnel + broker
├── docs/it/
│   ├── notification-system.md       # questo documento (la spec madre, Parti A–G)
│   └── adr/
│       ├── 0001-rabbitmq-over-bullmq.md
│       ├── 0002-mongodb-over-postgres.md      # Parte D distillata
│       ├── 0003-ttl-hard-delete-notifications.md
│       ├── 0004-tanstack-query.md
│       └── 0005-novu-vs-build.md              # esce dallo spike S7.0
└── backlog/
    ├── EP1-toast/
    │   ├── S1.4-toast-host.md       # ready story = file md (formato Parte G)
    │   └── …
    ├── _template.md
    └── _done/                       # story chiuse spostate qui dal retro (storico per l'agente retro)
```

**Perché monorepo:** i contratti sono condivisi da 8 package — multi-repo = versionare i contratti come pacchetto pubblicato, cerimonia ingiustificata a questa scala. `contracts/` fuori da `packages/` deliberatamente: è input di tutti, dipendenza di nessuno.

**Perché le story sono file in `backlog/` e non solo issue:** l'agente implementatore riceve il path del file, l'adversarial reviewer ne fa il diff col codice, il retro agent legge `_done/`. Le issue GitHub sono lo specchio (via `gh` CLI o action), con link bidirezionale story-file ↔ issue.

## H.2 Mapping su GitHub

| Concetto | Meccanismo GitHub | Note |
|---|---|---|
| Epica (EP0–EP7) | **Milestone** | Una per epica; la % di completamento traccia la settimana |
| Story | **Issue** (template `story.yml`) + file in `backlog/` | Label: `epic:EP1`, `lane:FE`, `sp:3` |
| Board | **Projects v2**, colonne: `Ready → In progress → Review → Done` | `Ready` = il file story esiste ed è validato dal PO; niente colonna "Backlog grezzo": ciò che non è ready sta solo nella Parte F |
| OPT promosse | Issue con label `opt` + riferimento `OPT-Lx.n` | La promozione richiede il mini-ADR nel body |
| Branch | `feat/S1.4-toast-host` (ID story nel nome) | Convenzione già nella story; una story = un branch = una PR |
| Commit | Conventional Commits con ref story: `feat(web): toast queue reducer [S1.4]` | |
| PR | Verso `develop`; template con checklist DoD della story | Squash merge; il titolo PR = titolo story |
| Release/deploy | Tag per fine settimana (`v0.1.0-L1` … ) | Il tag È lo ship della north-star: se venerdì non c'è tag, la retro parte da lì |

## H.3 CI: due livelli, un solo gate

- **ci.yml** (ogni push): `gate-quality.sh` — lint, type-check, unit, integration con testcontainers. Identico a locale/hook: nessuna logica di qualità vive solo in CI.
- **e2e.yml** (PR verso develop): compose effimero + feature file dell'epica toccata (path filter per non pagare 8 epiche a ogni PR). Su develop: suite completa notturna.
- I badge di stato + la depth DLQ di staging finiscono nella dashboard, non nel README.

## H.4 Cosa NON fare

- ❌ Wiki GitHub per la spec (non versionata col codice, invisibile agli agenti in checkout)
- ❌ Story scritte solo come issue (l'agente dovrebbe fare API call per leggere il proprio contratto)
- ❌ Un repo per package (cerimonia multi-repo senza beneficio a questa scala — threshold: quando un package viene riusato da un *altro* progetto, si estrae)
- ❌ GitFlow completo: `develop` + feature branch bastano; niente release branch per un sistema che shippa a tag settimanali

*Fine documento.*
