# language: it
@dashboard
Funzionalità: Dashboard del flusso
  Come product owner della fabbrica software
  Voglio vedere sprint attivo, cosa serve da me e le metriche north-star
  Così da supervisionare il flusso senza leggere il log grezzo

  @positive
  Scenario: Sprint attivo visibile
    Dato l'utente apre la pagina "/"
    Allora vede il testo "Sprint attivo"
    E vede il testo "Issue #1"

  @positive
  Scenario: Zona serve-da-te con azioni pendenti e review bloccata
    Dato l'utente apre la pagina "/"
    Allora vede il testo "Serve da te"
    E vede il testo "Azione manuale in attesa"
    E vede il testo "Pair-review bloccata"

  @negative
  Scenario: Log con righe malformate segnalate ma non bloccanti
    Dato l'utente apre la pagina "/"
    Allora vede il testo "righe scartate"
    E non ci sono errori in console

  @edge
  Schema dello scenario: Sul phone restano solo le zone essenziali
    Dato la viewport è <larghezza>x<altezza>
    E l'utente apre la pagina "/"
    Allora vede il testo "Serve da te"

    Esempi:
      | larghezza | altezza |
      | 360       | 800     |
      | 1440      | 900     |

  @edge
  Scenario: Nessuno sprint attivo mostra uno stato neutro
    Dato non esiste uno sprint in corso
    Quando l'utente apre la pagina "/"
    Allora vede il testo "Nessuno sprint attivo"
    E vede il testo "/brainstorm <idea>"
    E non vede un messaggio di errore

  @regression @slice-1
  Scenario: La dashboard non esegue scritture
    Dato l'utente apre la pagina "/"
    Allora non ci sono errori in console

  @positive
  Scenario: La zona Serve da te è paginata ma mostra sempre il totale
    Dato il dataset demo è "bulk"
    E la viewport è 1440x900
    E l'utente apre la pagina "/"
    Allora vede il testo "36 pendenti"
    E vede il testo "Pagina 1 di 4"
    Quando clicca sul pulsante "Successiva" della paginazione "Serve da te"
    Allora vede il testo "Pagina 2 di 4"

  @edge
  Scenario: Con pochi elementi Serve da te non ha controlli
    Dato la viewport è 1440x900
    E l'utente apre la pagina "/"
    Allora non vede il testo "Pagina 1 di"
