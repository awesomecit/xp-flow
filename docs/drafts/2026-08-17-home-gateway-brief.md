# Home Gateway — Spinoff City Cat (domotica felina)

> Brief operativo per agente. Fonte: sessione di design 17/08/2026.
> Lingua: documento in italiano, tutti gli artefatti code-facing (identificatori, filename, branch, commit, Gherkin) in inglese.
> Working name: `home-gateway` (naming definitivo TBD, non bloccante).

## 1. Contesto e obiettivo

Spinoff sperimentale di City Cat: software di orchestrazione domotica orientato al benessere/monitoraggio del gatto, sopra hardware di terze parti già presente in casa (SwitchBot, camere Tapo, dispositivi PetKit). Nessun hardware venduto: solo software.

**North-star:** un product increment shippato a settimana. Ogni decisione di scope si filtra su questo.

**Primo utente:** l'owner, a casa propria, col proprio gatto. Beta esterna (max ~15 utenti) solo dopo che il sistema gira stabilmente in casa per settimane.

## 2. Decisioni prese

| # | Decisione | Motivazione |
|---|-----------|-------------|
| D1 | Primo consumatore dei tool: **bot Telegram** (comandi espliciti) | Interfaccia già primaria nell'ecosistema personale; zero UI da costruire; long polling → niente esposizione su internet |
| D2 | **Adapter layer per vendor** nel core (ports & adapters) | Isola il dominio dalle API instabili/non ufficiali; abilita futuri facade (MCP, REST, PWA) senza toccare il core |
| D3 | **Comandi deterministici, niente NLU** in fase 1 | Shippabile in giorni, testabile in BDD; l'NLU è un layer sopra gli stessi use case, si aggiunge dopo |
| D4 | Ordine di integrazione: **SwitchBot (ufficiale) → ONVIF/RTSP → PetKit (experimental flag)** | Dal più stabile al più fragile; PetKit ha solo API reverse-engineered |
| D5 | **Niente monorepo tooling pesante** in settimana 1 | npm workspaces nudo; tsup/changesets/CI completa solo quando esiste un secondo consumatore dei package |
| D6 | Modello business fase demo: **beta gratuita, zero incassi** | Discussione fiscale/P.IVA fuori scope (gestita altrove); la validazione non si monetizza |
| D7 | **Nessuna rivendita hardware** in bundle; l'utente porta il proprio hardware | Elimina responsabilità garanzia, logistica, ToS; per la beta niente affiliate link |
| D8 | Pattern integrazione per beta esterna: **l'utente porta il proprio endpoint** (webhook Home Assistant/IFTTT o credenziali proprie) | Le credenziali restano dell'utente; il software orchestra, non rivende accesso ad API di terzi |
| D9 | Uso marchi terzi: **naming testuale con disclaimer**, mai loghi o apparenza di affiliazione | Riduzione rischio IP; disclaimer standard "X is a registered trademark of Y. This software is independent and not affiliated..." |

## 3. Vincoli tecnici (hard facts)

### SwitchBot
- API ufficiale Open API v1.1: token + secret generati dall'app (Developer Options), firma HMAC-SHA256.
- REST per stato/comandi; **webhook** per eventi push (preferire ai polling).
- Rate limit ~10.000 chiamate/giorno per account: budget da rispettare, polling solo di fallback.

### Camere Tapo
- Solo protocolli standard: **RTSP** (`rtsp://user:pass@IP:554/stream1|stream2`) e **ONVIF Profile S** (porta 2020; aggiunge PTZ ed eventi).
- Richiede **camera account dedicato** creato nell'app Tapo (separato dal TP-Link ID).
- Modelli a batteria: in genere **no RTSP** (eccezioni: D235/D225/TD25 se cablati). Verificare modello per modello.
- Accesso remoto **solo via VPN** (WireGuard/Tailscale). Mai port forwarding.
- IP camere: impostare DHCP reservation sul router.
- Librerie di controllo non-standard (pytapo e simili) = non ufficiali: usarle solo per feature accessorie, mai come dipendenza critica.

### PetKit (⚠️ experimental)
- **Nessuna API ufficiale, nessun developer program.** Solo librerie reverse-engineered (riferimento: ecosistema Jezza34000 / py-petkit-api).
- Breaking changes possibili in qualsiasi momento: tutto dietro feature flag `PETKIT_ENABLED`, degradazione graceful se l'API cambia.
- Vincolo account: **login su un solo device alla volta**. Setup obbligatorio: account secondario via family sharing per la libreria, account primario resta sull'app mobile.
- Dato di valore per City Cat: storico uso lettiera/pasti/acqua per gatto (segnali di salute).

### Sicurezza (baseline, non negoziabile anche in LAN)
- Whitelist `chat_id` Telegram da env: messaggi da chat non in whitelist ignorati **prima** del parsing.
- Secrets (bot token, SwitchBot token+secret, camera account, credenziali PetKit) solo in env/secret manager. Mai in repo.
- Audit log di ogni comando eseguito: `timestamp, chat_id, command, args, outcome`.
- Rate limiting applicativo sui comandi che consumano quota SwitchBot.
- Riuso dei pattern già in uso nel portfolio personale (logger già implementati, gate di qualità, soft-delete). Non citare mai progetti lavorativi.

## 4. Architettura target

```
home-gateway/
├── packages/
│   ├── core/                 # domain + ports: CameraProvider, ActuatorProvider, PetDeviceProvider
│   ├── adapter-switchbot/    # official Open API v1.1 (HMAC auth, webhook receiver)
│   ├── adapter-onvif/        # snapshot/clip via RTSP + ffmpeg, ONVIF events
│   └── adapter-petkit/       # EXPERIMENTAL, behind PETKIT_ENABLED flag
└── apps/
    └── bot-telegram/         # grammY, command-based, long polling
```

- Runtime: Node.js, JS + JSDoc, npm workspaces.
- Deploy: macchina in LAN (mini-PC/RPi), long polling verso Telegram, nessuna porta esposta.
- Snapshot camera: `ffmpeg -rtsp_transport tcp -i <rtsp_url> -frames:v 1 <out.jpg>`; clip: durata parametrica, invio come video Telegram.
- Facade futuri sullo stesso core (non ora): MCP server, REST API, PWA.

## 5. Slicing

| Settimana | Increment | Contenuto |
|-----------|-----------|-----------|
| 1 | Bot + SwitchBot | `/devices`, `/on <device>`, `/off <device>`, `/status`; whitelist, audit log, secrets da env |
| 2 | Camere | `/snap <camera>`, `/clip <camera> <seconds>` via adapter ONVIF/RTSP |
| 3 | PetKit (flag) | `/feed <grams>`, `/litter stats`; setup account secondario family sharing |
| 4+ | Routine | Automazioni evento→azione (webhook SwitchBot → azione), primi report benessere gatto |

Guardrail anti over-engineering: se a fine settimana l'increment non è shippato, si taglia scope, non si estende infrastruttura.

## 6. Ready story — Week 1 (code-facing, English)

```gherkin
Feature: Telegram bot controls SwitchBot devices
  As the home owner
  I want to list and switch my SwitchBot devices from Telegram
  So that I can operate my home without opening vendor apps

  Background:
    Given the bot is running with a whitelist containing my chat_id
    And SwitchBot credentials are loaded from environment variables

  Scenario: Unauthorized chat is ignored
    When a message arrives from a chat_id not in the whitelist
    Then the bot sends no reply
    And the attempt is written to the audit log

  Scenario: List devices
    When I send "/devices"
    Then I receive the list of SwitchBot devices with name and current state

  Scenario: Turn a device on
    Given a device named "living-light" exists
    When I send "/on living-light"
    Then the SwitchBot API receives a turnOn command for that device
    And I receive a confirmation with the resulting state
    And the command is written to the audit log

  Scenario: Unknown device
    When I send "/on nonexistent-device"
    Then I receive an error listing the available device names

  Scenario: API quota protection
    Given the daily SwitchBot call budget is nearly exhausted
    When I send a command that requires an API call
    Then the bot warns me about the remaining quota before executing

  Scenario: Health check
    When I send "/status"
    Then I receive adapter health for switchbot including last successful call timestamp
```

**Definition of done (week 1):** comandi funzionanti sui device reali di casa; test BDD verdi; audit log verificato; nessun secret in repo; deploy sulla macchina LAN con restart automatico.

## 7. Fuori scope (esplicito)

- Questioni fiscali / P.IVA / inquadramento Tech Citizen → gestite in thread separato. Nessuna monetizzazione in questa fase.
- Vendita/bundle hardware, affiliate link.
- NLU / linguaggio naturale (fase successiva, layer sopra gli use case).
- Dashboard PWA, MCP server, REST API pubblica (facade futuri sullo stesso core).
- Multi-tenant / onboarding beta esterna (richiede prima stabilità in casa + pattern D8).

## 8. Rischi principali

| Rischio | Mitigazione |
|---------|-------------|
| API PetKit cambia e rompe l'adapter | Feature flag, degradazione graceful, mai dipendenza critica |
| Superamento quota SwitchBot | Webhook invece di polling, budget tracking, warning nel bot |
| Over-engineering (rischio storico) | Slicing settimanale, D5, guardrail: increment non shippato → si taglia |
| Camera a batteria senza RTSP | Verifica compatibilità modello prima della settimana 2 |
| Clausole di esclusiva contratto di lavoro | Verifica contrattuale prima di qualsiasi beta esterna (fuori scope tecnico ma bloccante business) |
