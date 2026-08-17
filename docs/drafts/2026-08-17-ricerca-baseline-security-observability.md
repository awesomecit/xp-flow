# Open-source-grade & Enterprise-ready: requisiti Baseline / Enterprise-gate / Killer, con roadmap per un solo dev su Hetzner + Cloudflare

## TL;DR
- **Per un solo dev EU su Hetzner+Cloudflare con budget minimo, quasi tutta la baseline "seria" è raggiungibile gratis e self-hosted**: OWASP ASVS L1/L2, TLS + security headers, `npm audit`/Trivy/Dependabot, Cloudflare WAF free + allowlist IP origine, fail2ban, secrets fuori da git, logging JSON strutturato (Pino), Uptime Kuma + un unico backend osservabilità leggero (VictoriaLogs/VictoriaMetrics oppure OpenObserve), Sentry free per gli errori.
- **Le feature "Enterprise-gate" (SSO SAML/OIDC, SCIM, audit log immutabili con retention, report di compliance) NON vanno costruite in anticipo**: si differiscono finché un cliente enterprise le richiede per iscritto. L'ordine consigliato dalla community (enterpriseready.io, Hashorn) è **RBAC → audit log → SSO → SCIM**.
- **I "killer/extra" (SLSA L3, tracing distribuito OpenTelemetry completo, WORM/object-lock, ABAC, retention log a lungo termine)** sono giustificati solo su scala o come leva di vendita; per ora bastano pattern append-only + hash-chain in MongoDB ed export su **Cloudflare R2** (egress zero).

## Key Findings
1. **Il grosso della baseline enterprise-grade costa ~0 €** su questo stack: Cloudflare free assorbe TLS, WAF e DDoS; il resto è open-source self-hosted a footprint contenuto.
2. **OpenTelemetry è lo standard de facto per l'osservabilità**: progetto CNCF **graduato il 21 maggio 2026**, con la seconda project velocity più alta tra oltre 240 progetti del cloud native, seconda solo a Kubernetes.
3. **Non anticipare le feature enterprise**: la community è unanime — "Wait until one customer asks in writing". Costruire SSO da zero costa realisticamente 6-18 mesi.
4. **Per MongoDB Community l'audit nativo non esiste** (solo Enterprise/Atlas): serve un pattern applicativo (collection insert-only + Change Streams + hash-chain + export WORM).
5. **Cloudflare R2 (egress zero) è la scelta ovvia** per retention economica di log/audit su uno stack già dietro Cloudflare.
6. **Gli indirizzi IP sono dati personali (GDPR)**: retention breve e minimizzazione fin dalla sorgente sono obbligatorie per un'app EU-hosted.

## Details

### Contesto e principio guida
Stack di riferimento: **Node.js + MongoDB + Redis, Docker**, su VPS/dedicato **Hetzner (EU)**, dominio dietro **proxy Cloudflare**. Budget minimo: preferenza per free tier e open-source self-hosted; SaaS a pagamento solo se "killer". Principio della community (enterpriseready.io, Hashorn): non costruire feature enterprise in modo speculativo. L'ordine corretto è **RBAC prima** (tutto dipende dai ruoli), poi **audit log** (ogni cliente enterprise li chiede e servono per SOC 2), poi **SSO**, infine **SCIM** solo su richiesta esplicita — "If you skip audit logs, you fail SOC 2 and you can't answer the customer's 'who did this' question."

---

### AREA 1 — Security (Application Security)

**Baseline (table stakes)**
- **OWASP ASVS Livello 1** come minimo assoluto per ogni app ("Level 1 is the bare minimum that all applications should strive for" — OWASP ASVS). Punta a **L2** appena tratti dati sensibili/B2B ("Level 2 is recommended for most applications handling sensitive data or transactions").
- **TLS ovunque** (gestito gratis da Cloudflare + Let's Encrypt sull'origine), **security headers** HTTP (CSP, HSTS, X-Content-Type-Options), **rate limiting**.
- **Dependency scanning gratuito**: `npm audit` (incluso in Node), **Dependabot** (nativo GitHub, gratis, apre PR di fix), **Trivy** (Apache-2.0, scansiona dipendenze + immagini container + IaC + secrets in un solo binario, gira in <60s). Consenso: "fix con Dependabot, diagnostica con Trivy". **Renovate** (OSS) se non sei su GitHub.
- **Container hardening**: immagini base minimal, utente non-root, `npm ci`/`--frozen-lockfile` nei Dockerfile, pin per digest (SHA) non per tag.
- **Cloudflare Free WAF**: custom rules (5 slot free), Managed Challenge, blocco user-agent scanner, geo-restrizione admin panel, blocco `wp-login.php`/`xmlrpc.php`. "Cloudflare's free tier WAF is more powerful than most people use."
- **Origin protection**: allowlist degli IP pubblicati da Cloudflare sulle porte 80/443 (ufw/nftables), deny tutto il resto; oppure **Cloudflare Tunnel** (`cloudflared`, outbound-only, origine senza IP pubblico — "Very secure", disponibile a tutti). Senza questo, chiunque scopra l'IP origine (DNS storico, CT log) bypassa WAF e rate limit.
- **SSH hardening + fail2ban**: solo chiavi SSH, password auth disabilitata, UFW con sole porte 22/80/443. Su un singolo server fail2ban basta ("On one box, fail2ban is plenty").
- **Aggiornamenti automatici** (`unattended-upgrades`).
- **Secrets fuori da git**: per un solo dev, **SOPS** (Mozilla, gratis, cripta i secret nel repo con age/KMS), **Infisical** (open-source MIT, free tier fino a 5 utenti, self-host con Postgres+Redis) o **Doppler** (free tier usabile ma senza self-host). 1Password CLI se già cliente.

**Enterprise-gate**
- ASVS **L2 verificato** (pentest/audit) come evidenza per i questionari di sicurezza.
- **SBOM** per artefatto (Syft/Trivy, formati CycloneDX/SPDX) — richiesto sempre più spesso in procurement (spinta EU Cyber Resilience Act / EO 14028).
- **Firma degli artefatti con Sigstore/cosign** (keyless via OIDC, log di trasparenza Rekor) — "SLSA Level 2 achievable in an afternoon".
- Report di vulnerability scanning periodici.

**Killer / Extra (solo su scala)**
- **SLSA Livello 3** (build isolate/hardened, provenance verificabile) — target per componenti critici o settori regolati; per la maggior parte "target SLSA Level 2 as near-term goal".
- **CrowdSec** al posto/accanto a fail2ban: threat intelligence community, blocca IP prima che colpiscano ("Across a fleet, CrowdSec's shared bans earn the extra complexity"); overhead maggiore (200-500MB vs pochi MB di fail2ban), ha senso su più server.
- Admission controller che verifica firme/provenance in deploy (Kyverno/policy-controller) — rilevante solo con Kubernetes.

---

### AREA 2 — Access & Identity

**Baseline**
- **OAuth2 / OIDC** come standard di autenticazione (OAuth 2.1: PKCE obbligatorio, no implicit grant). Per Node esistono librerie di prima classe (`openid-client`).
- **MFA** (TOTP; passkey/WebAuthn come upgrade), session management robusto (Redis è ideale come session store), API key con hashing e scope.
- **RBAC**: "Build it once, properly. RBAC first because everything else depends on roles." Evitare il boolean `isAdmin` hard-coded.
- Isolamento multi-tenancy (tenant ID su ogni query/documento).

**Enterprise-gate**
- **SSO via SAML o OIDC**: hard blocker in procurement. La **CISA/FBI "Secure by Demand Guide" (6 ago 2024)** chiede espressamente ai buyer di verificare: *"Does the manufacturer support integrating standards-based single sign-on (SSO) for customers at no additional cost?"* SAML resta il "lingua franca" enterprise.
- **SCIM 2.0** per provisioning/deprovisioning automatico — solo quando il cliente lo chiede esplicitamente. "Ship SSO without SCIM and you will still fail security reviews" se il cliente lo esige.
- Il "three-legged stool" enterprise: SAML/OIDC (login) + SCIM (lifecycle) + MFA enforcement + audit logging.
- Costruire SSO da zero: 6-18 mesi realistici → valuta un IdP/servizio (Logto/WorkOS/Clerk/Authgear) prima di reinventare.

**Killer / Extra**
- **ABAC** / modelli di autorizzazione fine-grained (policy engine tipo OPA/Cedar) — "the most obvious differentiator between professional and enterprise tiers is the sophistication of the authorization model", ma solo su domanda enterprise.
- Audit di ogni decisione di autorizzazione, sessioni con revoca centralizzata, dedicated egress IP.

---

### AREA 3 — Audit (Audit Trail / Logs)

**Cosa registrare (baseline, da ISO-27002 via enterpriseready.io)**: attività utente applicative, eccezioni, eventi di sicurezza (successi e rifiuti), uso di privilegi, login falliti/riusciti, logout, dati acceduti/tentati, modifiche di configurazione amministrativa. Modello: *actor / action / resource / timestamp / source IP / result*. **Regola d'oro OWASP**: tenere PII e secret FUORI dall'audit log. Timestamp in GMT al millisecondo da server sincronizzato NTP.

**Baseline**
- Audit log applicativo **separato** dai log di debug, append-only.
- Per lo stack MongoDB: **l'audit nativo MongoDB NON è disponibile in Community Edition** (solo Enterprise/Atlas; Atlas aggiunge +10% al costo orario del cluster e ritiene i log 30 giorni di default). Quindi per il solo dev il pattern è a livello applicativo.
- **Pattern append-only in MongoDB**: collection insert-only (permessi solo INSERT) + **MongoDB Change Streams** (`db.watch()`) per catturare CRUD in modo reattivo. Librerie Node/Mongoose open-source concrete: **mongoose-audit-log** (registra save/update/delete + utente + timestamp), **mongoose-audit-trail** (diff-based, opzione `omit` per escludere campi), **mongoose-audit-logger** (fork mantenuto), **mongoose-log-history** (field-level, soft delete, batch, contextual logging).

**Enterprise-gate**
- **Audit log come feature di prodotto**: viewer in-app, export CSV, API accessibile (poll con etag / push via webhook) per ingestione in SIEM (Splunk). "Customers want to query the audit log, not just generate it."
- **Retention controllabile** e report di compliance (SOC 2 / ISO 27001).
- **Tamper-evidence**: hash-chaining SHA-256 (ogni record include l'hash del precedente, con genesis block "GENESIS") — rende l'alterazione rilevabile. "Modify any record retroactively and every hash from that point forward becomes invalid." Attenzione: append-only ≠ tamper-evident — una collection INSERT-only è append-only ma da sola non basta.

**Killer / Extra**
- **Immutabilità WORM reale**: export dei record su object storage con **Object Lock** (modalità GOVERNANCE/COMPLIANCE + Legal Hold) — es. **Cloudflare R2** (S3-compatibile, object-lock, egress zero), Backblaze B2, Hetzner Object Storage. Ancoraggio esterno dell'head della hash-chain (bucket object-locked, Sigstore Rekor, o timestamp RFC 3161): "a privileged rewrite of the entire table is detectable only against such an external anchor."
- Attenzione: COMPLIANCE mode è **irreversibile** — un errore di retention = dati non cancellabili che accumulano costi (in tensione anche con il diritto di cancellazione GDPR).

---

### AREA 4 — Logging & Log Retention

**Baseline**
- **Logging strutturato JSON**. Per Node: **Pino** (il più veloce, 10.000+ log/s, basso overhead, **redaction integrata** per campi sensibili, child logger per contesto richiesta, transport su worker thread). Consenso community: Pino default per produzione; Winston se serve massima flessibilità; Morgan per HTTP.
- **Correlation ID** per request, log level configurabili, log rotation.
- Aggregazione centralizzata leggera (vedi build-vs-buy sotto).

**Enterprise-gate**
- Policy di retention documentate e differenziate per tipo di log (es. security 90-365 giorni, debug 7-30 giorni).
- Controllo accessi ai log, cifratura.

**Killer / Extra**
- Retention a lungo termine su object storage con tiering (Loki/VictoriaLogs con backend S3-compatibile; lifecycle rules per spostare/eliminare dati vecchi — Loki gestisce la retention via Compactor).
- Log analytics avanzata, anomaly detection.

**GDPR (rilevante per EU-hosted)**
- Gli **indirizzi IP sono dati personali** (Recital 30; CGUE *Breyer* 2016, anche IP dinamici). Log pieni di IP = dati personali regolati.
- **Art. 5 — data minimization & storage limitation**: raccogli solo ciò che serve, tieni solo il tempo necessario. Nessun periodo fisso in GDPR: per i security log tipicamente **6-12 mesi** giustificabili; molte guide indicano **30-90 giorni** per log di sicurezza standard.
- Tecniche: troncamento IP (pseudonimizzazione, NON anonimizzazione), hashing con salt, esclusione PII alla sorgente (redaction Pino). La retention si applica anche a backup e archivi.

---

### AREA 5 — Monitoring & Observability

**📖 Box per neofiti — Monitoraggio vs Osservabilità: che differenza c'è?**

I due termini vengono spesso usati come sinonimi, ma indicano due cose diverse. Capire la differenza aiuta a scegliere gli strumenti giusti e a non comprare (o costruire) più del necessario.

- **Monitoraggio** = rispondere a domande **decise in anticipo**. Definisci cosa controllare ("il sito risponde?", "la CPU è sotto l'80%?", "il disco è pieno oltre il 90%?") e imposti soglie di allarme. Quando la soglia scatta, ricevi una notifica. Il monitoraggio ti dice **CHE** qualcosa è rotto. Analogia: la spia dell'olio in macchina — si accende, sai che c'è un problema, ma non sai il perché.

- **Osservabilità** = la capacità del sistema di rispondere a domande **che non avevi previsto**. Se l'applicazione emette segnali abbastanza ricchi (log strutturati con contesto, metriche, tracce delle richieste), puoi investigare a posteriori problemi mai visti prima: "perché le richieste dell'utente X sono lente solo dopo le 18?". L'osservabilità ti dice **PERCHÉ** è rotto. Analogia: il meccanico che collega la diagnostica alla centralina e ricostruisce la sequenza di eventi.

In gergo: il monitoraggio copre i **known unknowns** (cose che sai che possono rompersi), l'osservabilità gli **unknown unknowns** (guasti che non potevi prevedere). Il monitoraggio è di fatto un sottoinsieme dell'osservabilità: un sistema osservabile include il monitoraggio, non viceversa.

I tre segnali (pillar) dell'osservabilità:
1. **Metriche** — numeri aggregati nel tempo (richieste/sec, latenza media, RAM usata). Economiche da conservare, ottime per allarmi e dashboard.
2. **Log** — eventi discreti con contesto ("l'utente 42 ha fatto login alle 14:03 da IP x.y.z"). Raccontano cosa è successo.
3. **Tracce** — il percorso di una singola richiesta attraverso i componenti (API → DB → cache), con i tempi di ogni passaggio. Fondamentali con i microservizi, spesso overkill per un monolite.

Mappato sugli strumenti di questo report: **Uptime Kuma = monitoraggio** (domande predefinite: "è su?"). **VictoriaLogs/OpenObserve + OpenTelemetry = osservabilità** (puoi interrogare i dati con domande nuove). **Sentry** sta a metà: monitora gli errori ma dà contesto ricco per capirne la causa. Per un solo dev la strategia sensata è: prima il monitoraggio (poche ore di setup, copre il 90% delle emergenze), poi l'osservabilità in modo incrementale (log strutturati subito, metriche dopo, tracce solo se servono).

**Baseline**
- **OpenTelemetry (OTel) è LO standard** — progetto CNCF **graduato il 21 maggio 2026**, "de facto observability standard". Ha raggiunto la seconda project velocity più alta tra oltre 240 progetti cloud native, seconda solo a Kubernetes, con oltre 12.000 contributori da più di 2.800 aziende. Instrumentare con OTel = vendor-neutral (una volta, verso qualsiasi backend).
- I tre segnali: metriche, log, tracce. Baseline realistica per solo dev: metriche + log + **uptime monitoring** + **error tracking**.
- **Uptime Kuma** (self-hosted, 50-200MB RAM, SQLite, 90+ canali di notifica, status page pubblica, monitor illimitati gratis) — table stakes per "è su, dall'esterno, e mi ha avvisato".
- **Health check** endpoint (`/health`, `/ready`).
- **Error tracking**: **Sentry free** (5.000 errori/mese) — "start with Sentry for error tracking (free tier handles your volume)".

**Enterprise-gate**
- Dashboard e alerting affidabili, SLO/error budget documentati, on-call.
- Report di uptime/SLA per i clienti.

**Killer / Extra**
- **Tracing distribuito** completo (Tempo/Jaeger/OTel) — utile su microservizi, overkill per un monolite singolo.
- SLO formali con error budget, RUM/session replay, AI SRE / root-cause automatica.

---

## BUILD vs BUY — Osservabilità, Logging, Audit per solo dev su Hetzner+Cloudflare

### Footprint self-hosted (RAM) — dati community
- **Uptime Kuma**: 50-200MB (256MB gestiscono centinaia di monitor). Il primo tool da installare.
- **Beszel**: agente ~10-15MB RAM, il più leggero per metriche server 1-20 host.
- **Netdata**: 50-100MB (fino a 200-500MB con tutti i collector).
- **VictoriaLogs**: footprint RAM/disco più piccolo della categoria — docs ufficiali: *"It uses up to 30x less RAM and up to 15x less disk space than other solutions such as Elasticsearch and Grafana Loki"*, e *"performs typical full-text queries up to 1000x faster than Grafana Loki"*; setup molto più semplice di Loki e gestisce campi ad alta cardinalità (trace_id, user_id) che mettono in crisi Loki.
- **OpenObserve**: ~512MB RAM a idle, single binary Rust, logs/metrics/traces + object storage, SQL invece di LogQL. Su VPS da 8GB lascia >7.5GB liberi.
- **SigNoz**: OTel-native (logs/metrics/traces + APM in una UI), ClickHouse, multi-container. Su VPS da 8GB lascia ~6GB liberi (più pesante di OpenObserve).
- **Grafana LGTM stack** (Loki+Grafana+Tempo+Mimir+Alloy): 500MB-1GB+, ecosistema più grande ma più componenti da gestire — per un solo dev è oneroso.
- **Sentry self-hosted**: SCONSIGLIATO — 40+ container, min 16GB RAM. Usa il cloud free.

**Verdetto self-host**: per un solo dev con RAM limitata, un **backend unificato leggero** batte lo stack LGTM. Scelte consigliate: **VictoriaMetrics + VictoriaLogs** (massima efficienza, metriche primarie) oppure **OpenObserve** (un binario, logs+metrics+traces+object storage nativo). SigNoz se vuoi APM OTel-native e hai ≥8GB.

### Managed free tier (numeri)
- **Grafana Cloud Free**: 10.000 serie metriche attive, 50GB logs, 50GB traces, 50GB profiles/mese, 3 utenti, **retention 14 giorni**, forever-free, no carta di credito. Ottimo per personal/prototipi; i due muri sono retention 14gg e cap 10k serie. Pro da $19/mese estende la retention (13 mesi metriche, 30gg log).
- **Sentry Free (Developer)**: 5.000 errori/mese, 5M span di tracing.
- **Axiom Free**: ingest molto generoso per i log (storicamente 500GB/mese) — "standout generous" per log management.
- **Better Stack Free**: 3GB logs/traces/metrics, no carta di credito; error tracking compatibile con SDK Sentry a ~1/6 del costo; uptime a 30s; status page.
- **PostHog Free**: 100.000 errori/mese (il più generoso per error tracking).

### Object storage per retention economica (numeri 2026)
- **Cloudflare R2**: storage $0.015/GB/mese, **egress ZERO**, free tier 10GB storage + 1M Class A + 10M Class B op/mese. Vincitore per un setup già-Cloudflare (Loki/VictoriaLogs/OpenObserve puntano R2 come backend S3-compatibile; supporta Object Lock/WORM per audit immutabili).
- **Backblaze B2**: **$0.006/GB/mese** (~$6/TB), il più economico per storage a freddo; egress gratis fino a 3× lo storage medio, poi $0.01/GB, e gratis verso Cloudflare (Bandwidth Alliance); durabilità 11 nine.
- **Hetzner Object Storage**: prezzo base **€4,99 / $5,99 al mese** (IVA escl.), inclusi **1TB di storage + 1TB di egress**; oltre soglia €1,00/TB egress e €0,0067 per TB-ora storage. S3-compatibile, DC Falkenstein/Norimberga/Helsinki (utile per data residency EU), con versioning, object lock e SSE.

### Cloudflare Free — cosa ottieni davvero (docs ufficiali, "Last updated Aug 14, 2026")
- **Web Analytics**: gratis, cookieless, **retention 30 giorni**, campionamento 10% dei page load.
- **Security Events** (dashboard): "sampled logs only", **retention 24 ore** su Free, no export (Business+ export fino a 500 eventi).
- **Security Analytics** (dataset `httpRequestsAdaptive`): **retention 7 giorni** su Free, finestra query 24h.
- **GraphQL Analytics API**: accessibile su TUTTI i piani incluso Free (granularità 1h, ultime 24h su Free).
- **Logpush** (log HTTP/zone per-request): **solo Enterprise** (0 job su Free/Pro/Business). Eccezione: **Workers Trace Events Logpush** su Workers Paid ($5/mese, 10M richieste incluse, $0.05/M dopo).
- **Instant Logs** (live tail): dal piano Business.
- **Implicazione**: su Free la retention edge Cloudflare è breve e non-esportabile → per log durevoli/forensi spedisci i **log origine** (dalla tua app Node) al tuo storage, e usa la GraphQL API per conteggi giornalieri.

---

## Recommendations (roadmap prioritizzata)

**Fase 0 — Subito (giorni, costo ~0)**
1. SSH hardening (solo chiavi), UFW (22/80/443), fail2ban, `unattended-upgrades`.
2. Cloudflare proxy attivo + allowlist IP Cloudflare sull'origine (o Cloudflare Tunnel); WAF free con 5 custom rules.
3. Secrets fuori da git: SOPS o Infisical free.
4. Pino (JSON, redaction PII/secret) in tutta l'app; correlation ID; health check endpoints.
5. `npm audit` + Dependabot + Trivy in CI; immagini non-root, pin per digest.
6. Uptime Kuma (su server SEPARATO se possibile) con ≥2 canali di notifica; alert disco >80% e scadenza SSL.
7. Sentry free per error tracking.
8. Policy retention log documentata (es. security 90gg, app 30gg) con troncamento/hashing IP per GDPR.

**Fase 1 — Settimane (baseline "seria")**
9. Un backend osservabilità unificato leggero: **VictoriaMetrics+VictoriaLogs** o **OpenObserve**, con Grafana per le dashboard; instrumentazione **OpenTelemetry**.
10. Backup automatici (restic) + export log/metrics su **Cloudflare R2** (egress zero) con lifecycle per retention economica.
11. RBAC pulito (no `isAdmin` hard-coded), OAuth2/OIDC + MFA (TOTP).
12. Audit log applicativo append-only in MongoDB (collection insert-only + Change Streams + libreria Mongoose), schema actor/action/resource/result, PII esclusa.

**Fase 2 — Quando arriva la trazione / primo cliente enterprise (differire!)**
13. Alla PRIMA richiesta scritta enterprise: audit log con viewer + export + API, retention controllabile; poi SSO (SAML/OIDC, valutare WorkOS/Logto per non costruire da zero); SCIM solo se richiesto.
14. Hash-chain SHA-256 sull'audit + export WORM su R2 Object Lock quando serve tamper-evidence per compliance.
15. SBOM (Syft/Trivy) + firma cosign/Sigstore (SLSA L2) nel CI.

**Soglie che cambiano le scelte**
- Se superi ~50GB log/mese o retention >14gg su Grafana Cloud free → self-host (VictoriaLogs) + R2.
- Se passi da 1 a più server → valuta CrowdSec al posto di fail2ban.
- Se il monolite diventa microservizi → attiva tracing distribuito OTel (Tempo/SigNoz).
- Se un cliente esige SOC 2 → priorità ad audit log immutabili + report.

## Caveats
- Diverse fonti su pricing/free-tier e footprint RAM sono blog di vendor o terze parti (2026): i numeri Cloudflare provengono dai docs ufficiali (developers.cloudflare.com, "Last updated Aug 14, 2026"); i footprint RAM sono cifre indicative dipendenti dal carico. Alcune fonti terze riportano finestre di retention Cloudflare contraddittorie (72h, 14gg) — ho usato i docs ufficiali.
- Il prezzo di Hetzner Object Storage: la cifra corretta dai comunicati ufficiali Hetzner è **€4,99/$5,99 al mese** (IVA escl.) con 1TB storage + 1TB egress inclusi; alcune fonti terze citano €6,49 (probabilmente IVA/listino diverso).
- OpenTelemetry graduato CNCF il 21/5/2026 (comunicato CNCF/PRNewswire) — confermato.
- GDPR non fissa periodi di retention: le cifre 30-90gg / 6-12 mesi sono prassi comuni, non obblighi; documenta e giustifica la tua scelta.
- L'ordine RBAC→audit→SSO→SCIM e il "non costruire in anticipo" riflettono il consenso di enterpriseready.io/Hashorn/SSOJet, non una regola assoluta: adatta alla tua nicchia.
- L'audit nativo e le funzioni WORM non esistono in MongoDB Community: qualsiasi tamper-evidence va costruita a livello applicativo (hash-chain) e ancorata a storage esterno object-locked; la sola object-lock protegge il layer di storage ma non i metadati — per compliance seria servono hash + trusted timestamp + audit trail verificabile.
