# language: it
@timeline
Funzionalità: Timeline degli eventi
  Come product owner
  Voglio scorrere e filtrare gli eventi del flusso
  Così da ricostruire cosa è successo e quando

  @positive
  Scenario: Feed cronologico visibile
    Dato l'utente apre la pagina "/timeline"
    Allora vede il testo "eventi"
    E vede il testo "sprint"

  @positive
  Scenario: Filtro per comando ed esito
    Dato l'utente apre la pagina "/timeline"
    Quando seleziona "pair-review" nel filtro "Comando"
    E seleziona "bloccato" nel filtro "Esito"
    Allora vede il testo "obiezione bloccante"

  @negative
  Scenario: Combinazione di filtri senza risultati
    Dato l'utente apre la pagina "/timeline"
    Quando seleziona "retro" nel filtro "Comando"
    E seleziona "escalation" nel filtro "Esito"
    Allora vede il testo "Nessun evento con questi filtri"

  @negative
  Scenario: Warning sulle righe scartate
    Dato l'utente apre la pagina "/timeline"
    Allora vede il testo "righe scartate"

  @edge
  Schema dello scenario: Timeline leggibile su ogni form factor
    Dato la viewport è <larghezza>x<altezza>
    E l'utente apre la pagina "/timeline"
    Allora vede il testo "Timeline"

    Esempi:
      | larghezza | altezza |
      | 360       | 800     |
      | 1920      | 1080    |

  @regression @slice-1
  Scenario: Il cambio filtro non ricarica la pagina
    Dato l'utente apre la pagina "/timeline"
    Quando seleziona "sprint" nel filtro "Comando"
    Allora non ci sono errori in console

  @negative
  Scenario: Il backend risponde 500
    Dato il backend risponde con "error"
    E l'utente apre la pagina "/timeline"
    Allora vede il testo "Impossibile leggere il flusso"

  @negative
  Scenario: Il backend risponde con un payload fuori contratto
    Dato il backend risponde con "contract"
    E l'utente apre la pagina "/timeline"
    Allora vede il testo "Impossibile leggere il flusso"

  @regression
  Scenario: Il filtro scelto resta dopo un reload
    Dato l'utente apre la pagina "/timeline"
    Quando seleziona "pair-review" nel filtro "Comando"
    E ricarica la pagina
    Allora vede il testo "obiezione bloccante"

  @positive
  Scenario: Il feed è paginato su desktop
    Dato la viewport è 1440x900
    E l'utente apre la pagina "/timeline"
    Allora vede il testo "Pagina 1 di 2"
    Quando clicca sul pulsante "Successiva"
    Allora vede il testo "Pagina 2 di 2"

  @positive
  Scenario: Su phone la lista si allunga con "Mostra altri"
    Dato la viewport è 360x800
    E l'utente apre la pagina "/timeline"
    Allora vede il testo "10 di 13"
    Quando clicca sul pulsante "Mostra altri"
    Allora vede il testo "13 di 13"

  @negative
  Scenario: Sulla prima pagina non si torna indietro
    Dato la viewport è 1440x900
    E l'utente apre la pagina "/timeline"
    Allora il pulsante "Precedente" è disabilitato

  @edge
  Scenario: Una lista corta non mostra controlli di paginazione
    Dato non ci sono eventi bloccati o in escalation
    E la viewport è 1440x900
    E l'utente apre la pagina "/timeline"
    Allora non vede il testo "Pagina 1 di"

  @regression
  Scenario: Cambiare filtro riporta alla prima pagina
    Dato la viewport è 1440x900
    E l'utente apre la pagina "/timeline"
    Quando clicca sul pulsante "Successiva"
    Allora vede il testo "Pagina 2 di 2"
    Quando seleziona "sprint" nel filtro "Comando"
    Allora non vede il testo "Pagina 2 di 2"
