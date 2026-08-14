# language: it
@pipeline
Funzionalità: Pipeline del ciclo XP
  Come product owner
  Voglio vedere a che punto è il ciclo brainstorm → sprint → pair-review → retro
  Così da capire dove il flusso si ferma

  @positive
  Scenario: Stepper con tutte le fasi
    Dato l'utente apre la pagina "/pipeline"
    Allora vede il testo "brainstorm"
    E vede il testo "sprint"
    E vede il testo "pair-review"
    E vede il testo "retro"

  @positive
  Scenario: Flusso sano senza blocchi
    Dato non ci sono eventi bloccati o in escalation
    Quando l'utente apre la pagina "/pipeline"
    Allora vede il testo "Flusso sano"

  @negative
  Scenario: Pair-review bloccata con obiezione in evidenza
    Dato l'utente apre la pagina "/pipeline"
    Allora vede il testo "Blocchi"
    E vede il testo "obiezione bloccante"

  @edge
  Schema dello scenario: Pipeline non è raggiungibile dalla bottom-nav phone
    Dato la viewport è <larghezza>x<altezza>
    E l'utente apre la pagina "/"
    Allora la navigazione primaria contiene <voci> voci

    Esempi:
      | larghezza | altezza | voci |
      | 360       | 800     | 2    |
      | 1440      | 900     | 5    |

  @regression @slice-1
  Scenario: Nessuna azione di scrittura sulla pipeline
    Dato l'utente apre la pagina "/pipeline"
    Allora non ci sono errori in console

  @positive
  Scenario: I blocchi sono paginati quando sono molti
    Dato il dataset demo è "bulk"
    E la viewport è 1440x900
    E l'utente apre la pagina "/pipeline"
    Allora vede il testo "Pagina 1 di 3"
    Quando clicca sul pulsante "Successiva"
    Allora vede il testo "Pagina 2 di 3"

  @edge
  Scenario: Con pochi blocchi non compaiono controlli
    Dato la viewport è 1440x900
    E l'utente apre la pagina "/pipeline"
    Allora non vede il testo "Pagina 1 di"
