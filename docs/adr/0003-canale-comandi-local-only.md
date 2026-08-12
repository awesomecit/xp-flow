# 3. Canale comandi remoto, local-only (Telegram + dashboard)

Data: 2026-08-12 · Stato: accettata (predisposizione — implementazione alla slice 3 della issue #2)

## Contesto
Il PO vuole interagire con la fabbrica da un punto unico anche fuori dal terminale
(dashboard slice 2, Telegram slice 3), senza esporre server: tutto gira in locale
sul Mac. Verificato: Claude Code supporta l'esecuzione headless sicura
(`claude -p` + `--permission-mode` + `--allowedTools`), e Telegram supporta il
long-polling (`getUpdates`): solo traffico in uscita, zero porte aperte.

## Decisione
Un **dispatcher locale unico** per tutti i canali di comando:

```text
Telegram bot (long-polling, processo locale)  ─┐
Dashboard monitor (slice 2, azioni UI)        ─┤→ DISPATCHER locale
                                               │   - whitelist: solo chat_id del PO
                                               │   - solo comandi MAPPATI (stato,
                                               │     standup, manual_done,
                                               │     /brainstorm <testo>) — mai
                                               │     prompt liberi verso la shell
                                               │   - ogni comando → evento nel log
                                               ↓
                          claude -p "<comando>" --permission-mode acceptEdits
                          (eseguito nella dir xp-flow: i deny del repo valgono
                           anche headless — push/credenziali restano bloccati)
                                               ↓
                          risposta sintetica → canale di origine
```

## Alternative scartate
- **Webhook Telegram**: richiede HTTPS raggiungibile da internet → server esposto,
  contro il vincolo local-only.
- **`--dangerously-skip-permissions` per l'headless**: bypassa i binari fail-closed;
  la coppia permission-mode+allowlist ottiene l'autonomia senza perdere i deny.
- **n8n da subito**: previsto in ROADMAP Fase 3 come collante; finché il flusso è
  uno solo, uno script è più semplice del motore di workflow.

## Conseguenze
- La sicurezza sta nel dispatcher (whitelist + mapping), non nel canale: aggiungere
  un canale nuovo = aggiungere un ingresso, non nuove regole.
- Quando la slice 3 entra in sprint, /pianifica scompone questo ADR in storie;
  la scelta script Node vs n8n si decide lì (trigger: più di un flusso attivo).
- Il token del bot Telegram è un secret: vive fuori dal repo (keychain/env locale),
  configurarlo sarà un'azione manuale (`esito:"azione_manuale"`).
