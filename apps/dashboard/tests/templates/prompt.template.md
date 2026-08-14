# Template prompt — passo 1 del flusso TDD

Compila questo template **prima** di scrivere codice o Gherkin.
Output atteso: un file `.feature` in `tests/e2e/features/`.

---

## Feature

**Nome:** <nome breve, kebab-case>
**Attore:** <chi la usa: guest / user / manager / admin>
**Obiettivo:** <cosa deve poter fare>
**Valore:** <perché serve>

## Contesto

- Tenant coinvolti: <default | acme | globex | tutti>
- Locale rilevanti: <it | en | tutti>
- Form factor: <phone | tablet | desktop | tutti>
- Permessi richiesti: <es. settings.manage>
- Feature flag: <es. billing | nessuno>

## Casi da coprire (obbligatori tutti e quattro)

### Positivi

1. <azione> → <risultato osservabile>

### Negativi

1. <input non valido / permesso mancante / errore API> → <messaggio o stato atteso>

### Edge case

1. <lista vuota, valore limite, testo lunghissimo, offline, viewport minima>

### Non regression

1. <bug noto o comportamento già garantito che non deve rompersi> (rif. issue #XXXX)

## Dati e stato iniziale

- Sessione: <anonima | ruolo X>
- Dati richiesti: <entità e quantità>
- Endpoint coinvolti: <path API, oppure demo mode>

## Criteri di accettazione

- [ ] <asserzione osservabile dall'utente, non implementativa>
- [ ] <...>

## Fuori scope

- <cosa NON copre questa feature>
