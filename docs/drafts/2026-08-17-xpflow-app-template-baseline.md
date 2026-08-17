# XP Flow Factory — App Template Baseline
## Cosa non deve mai mancare in un'app FE/BE/DevOps enterprise-compliant e open source · v1.0

> Documento normativo, dominio-agnostico. Ogni app creata dalla fabbrica nasce
> da questo template: le voci sono **scaffold generati** al bootstrap dell'app
> e **check nel gate**, non una checklist da ricordare. Riferimenti: 12-Factor,
> OWASP ASVS/Top 10, WCAG 2.2, OpenTelemetry, SLSA, OpenSSF Scorecard, GDPR.
>
> Legenda enforcement — 🔴 gate bloccante (script/CI) · 🟡 review AI/umana · 📄 scaffold generato

---

## 0. Come si usa nella fabbrica

- `factory/templates/app/` contiene lo scaffold: cartelle, file di policy, pipeline, config di base. `new-app.sh <nome>` lo istanzia e apre l'issue "Baseline compliance" con la checklist §1-§4 pre-compilata.
- `gate-quality.sh --baseline` verifica le voci 🔴 (presenza file, tool in pipeline, config minime). Un'app che non passa la baseline non può promuovere a prod.
- Le voci 🟡 entrano nel contesto di architect e adversarial-spec-reviewer (`guidelines/design.md`) e nel report di fine sprint.
- Ogni deroga è un **ADR** ("Deroga baseline: X, motivo, scadenza") — mai silenziosa.

---

## 1. Trasversale (tutti i layer)

| # | Requisito | Enf. | Come nella fabbrica |
|---|-----------|------|---------------------|
| T1 | Config via ambiente; secret mai nel codice; un solo build per tutti gli ambienti (12-Factor III/V) | 🔴 | gitleaks + `.env.example` + build unico promosso |
| T2 | Licenza OSI esplicita (`LICENSE`), policy licenze dipendenze (deny-list GPL-incompatibili se serve) | 🔴 | scaffold + `license-checker` in CI |
| T3 | **SBOM** generata a ogni build (CycloneDX o SPDX) e pubblicata con la release | 🔴 | `@cyclonedx/cyclonedx-npm` in pipeline |
| T4 | Semver + changelog generato dai commit convenzionali + release firmate | 🔴 | già in `conventions/`; firma con `gh attestation`/cosign |
| T5 | Docs minime: `README`, `CONTRIBUTING`, **`SECURITY.md`** (disclosure), `CODE_OF_CONDUCT`, ADR in repo | 🔴 | scaffold; assenza = gate rosso |
| T6 | Log strutturati JSON, **correlation ID** end-to-end (FE→BE→job), livelli, **niente PII** nei log | 🔴/🟡 | logger standard del template + regola lint no-log-PII + review |
| T7 | Accessibilità e i18n considerati dall'inizio (stringhe esternalizzate, no testo hardcoded) | 🟡 | scaffold i18n + regola lint |
| T8 | **Threat model leggero** per ogni epic sensibile (STRIDE su una pagina) | 🟡 | prodotto dall'adversarial-spec-reviewer, allegato alla spec §6 |
| T9 | Data lifecycle: retention, cancellazione ed export dei dati personali by design (GDPR art. 17/20/25) | 🟡 | sezione obbligatoria nella spec quando ci sono dati personali |

## 2. Backend

| # | Requisito | Enf. | Come nella fabbrica |
|---|-----------|------|---------------------|
| B1 | AuthN standard (OIDC/OAuth2), mai custom; sessioni/JWT con scadenza, rotazione, revoca | 🔴 | libreria del template; regola "no auth fatta in casa" in guidelines |
| B2 | **AuthZ centralizzata** (RBAC/ABAC in un solo modulo, deny by default), mai sparsa negli handler | 🟡 | modulo `authz/` nello scaffold + review |
| B3 | Validazione input al confine con schema (JSON Schema/zod); errori strutturati **RFC 9457 problem+json** | 🔴 | middleware del template + test contract |
| B4 | API **contract-first**: OpenAPI versionato, client generato, breaking change = nuova major | 🔴 | `openapi.yaml` + diff breaking in CI (`oasdiff`) |
| B5 | Idempotenza sulle scritture (idempotency key), rate limiting, timeout + retry + circuit breaker verso terzi | 🟡 | pattern nello scaffold; scenari edge Gherkin li impongono |
| B6 | Migrazioni DB versionate, reversibili, disaccoppiate dal deploy; mai ALTER a mano | 🔴 | migration tool del template + check "no schema drift" |
| B7 | **Audit trail** immutabile per azioni sensibili (chi/cosa/quando/da dove), append-only | 🔴/🟡 | evento di dominio + sink WORM (pattern già in uso) |
| B8 | Health + readiness endpoint, metriche Prometheus, tracing **OpenTelemetry** | 🔴 | scaffold; gate verifica gli endpoint |
| B9 | Backup automatico + **restore testato** periodicamente (job schedulato che ripristina in ambiente effimero) | 🔴 | job in pipeline; ultimo restore riuscito < 30 gg |
| B10 | Multi-tenant (se applicabile): isolamento a livello DB (RLS o schema), tenant nel correlation ID | 🟡 | ADR obbligatorio sulla strategia |

## 3. Frontend

| # | Requisito | Enf. | Come nella fabbrica |
|---|-----------|------|---------------------|
| F1 | Design system con **token** (zero valori hardcoded), componenti dal kit | 🔴 | regola ESLint token + depcruise import solo da `@personal/ui-kit` |
| F2 | **WCAG 2.2 AA**: tastiera, focus, contrasto, aria, screen reader | 🔴/🟡 | `axe-core` in CI su ogni vista + review |
| F3 | Client API generato dall'OpenAPI; confine netto UI ↔ dati; stato prevedibile | 🔴 | generatore nel template; no fetch "a mano" (lint) |
| F4 | Sicurezza client: CSP, no secret nel bundle, sanitizzazione, CSRF/SameSite, dipendenze auditate | 🔴 | header dal template + `npm audit` + scan bundle per secret |
| F5 | Ogni vista ha stati **vuoto / caricamento / errore** + error boundary | 🔴 | scenari edge Gherkin obbligatori + test |
| F6 | Performance budget (Web Vitals) misurato in CI, lazy loading, PWA se sensata | 🔴 | Lighthouse CI con soglie |
| F7 | Feature flag client coerenti con BE (**una sola fonte**) | 🟡 | `flags.json` unico (design doc §13.1) |
| F8 | i18n: stringhe esternalizzate, formati locale (date, numeri), RTL-ready se richiesto | 🟡 | scaffold i18n + lint no-hardcoded-text |

## 4. DevOps

| # | Requisito | Enf. | Come nella fabbrica |
|---|-----------|------|---------------------|
| D1 | **Tutto as-code**: infra (OpenTofu), pipeline, policy, ambienti; drift detection schedulata | 🔴 | design doc §16 |
| D2 | Pipeline con gate deterministici: lint · SAST · secret scan · dep audit · test+coverage · **SBOM** · **container scan** (Trivy/Grype) | 🔴 | `gate-quality.sh` + job CI |
| D3 | Artefatto **immutabile** promosso tra ambienti (mai ricompilato); tag = digest | 🔴 | pipeline build-once |
| D4 | Supply chain: lockfile pinnato, Renovate/Dependabot, provenance/firma (**SLSA**), **OpenSSF Scorecard** ≥ soglia | 🔴 | Actions ufficiali; Scorecard badge nel README |
| D5 | Least privilege: identità per servizio (workload identity), secret in vault, niente credenziali statiche di lunga durata | 🔴/🟡 | tofu + policy; review su ogni IAM |
| D6 | Deploy con rollback banale (blue-green/canary o rollout progressivo); migration separata dal deploy | 🔴 | strategia nel template Cloud Run/K8s |
| D7 | Osservabilità centralizzata + **alerting su SLO** (non su metriche grezze) + **runbook** per ogni alert | 🟡 | scaffold `slo.yaml` + `runbooks/`; alert senza runbook = review rossa |
| D8 | Backup/DR con **RPO/RTO dichiarati** e restore provato | 🔴 | doc + job (vedi B9) |
| D9 | Ambienti effimeri per PR (preview) e parità dev/stage/prod | 🔴 | preview deploy in pipeline (già §7 design) |
| D10 | Container: immagine minima/distroless, non-root, read-only FS, healthcheck | 🔴 | Dockerfile del template + Trivy config check |

---

## 5. Livelli di conformità (per non bloccarsi al giorno uno)

Non tutto serve dal primo commit: la baseline si applica per **livello**, e il livello richiesto sale con l'esposizione dell'app.

| Livello | Quando | Voci obbligatorie |
|---------|--------|-------------------|
| **L0 — Interno** (dashboard dietro Tailscale) | dall'inizio, sempre | T1, T5, T6, B1, B3, B8, F5, D2 (senza container scan), D3, D9 |
| **L1 — Open source pubblico** | prima del primo tag pubblico | L0 + T2, T3, T4, D4 (Scorecard, SBOM), F2, F4, D10 |
| **L2 — Enterprise / dati di terzi** | prima di utenti reali o dati personali altrui | L1 + T8, T9, B2, B4, B6, B7, B9, D1, D5, D6, D7, D8 |

Il livello vive nel frontmatter dell'app (`compliance_level: L1`) e il gate applica le voci corrispondenti. Salire di livello è una **story** con la sua checklist.

## 6. Deroghe

Ogni voce non rispettata richiede un ADR con: voce, motivo, rischio accettato, **scadenza** della deroga. Il gate legge gli ADR di deroga attivi e non blocca finché non scadono; alla scadenza torna rosso. Nessuna deroga senza scadenza.

---

*Nota per la fabbrica: le tre voci che tipicamente mancano — SBOM + container scan (D2/T3), threat model (T8), SECURITY.md (T5) — sono nello scaffold del template: nascono con l'app e non si dimenticano.*
