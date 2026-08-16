# language: it
@retro
Funzionalità: Retro e metodo
  Come product owner
  Voglio vedere i feedback sul metodo, l'accuratezza delle stime e le escalation
  Così da migliorare il processo alla prossima retro

  @positive
  Scenario: Feedback metodo accumulati dopo l'ultima retro
    Dato l'utente apre la pagina "/retro"
    Allora vede il testo "Feedback metodo accumulati"
    E vede il testo "markdownlint"

  @positive
  Scenario: Accuratezza stime per issue
    Dato l'utente apre la pagina "/retro"
    Allora vede il testo "Accuratezza stime"
    E vede il testo "Issue #1"

  @negative
  Scenario: Nessuna escalation registrata
    Dato non ci sono eventi in escalation
    Quando l'utente apre la pagina "/retro"
    Allora vede il testo "Nessuna escalation registrata."

  @edge
  Schema dello scenario: La retro resta una vista desktop/tablet
    Dato la viewport è <larghezza>x<altezza>
    E l'utente apre la pagina "/retro"
    Allora vede il testo "Retro"

    Esempi:
      | larghezza | altezza |
      | 768       | 1024    |
      | 1920      | 1080    |

  @regression @slice-1
  Scenario: Nessun feedback duplicato dopo l'ultima retro
    Dato l'utente apre la pagina "/retro"
    Allora non ci sono errori in console

  @positive
  Scenario: Feedback ed escalation sono paginati
    Dato il dataset demo è "bulk"
    E la viewport è 1440x900
    E l'utente apre la pagina "/retro"
    Allora vede il testo "Pagina 1 di 2"

  @edge
  Scenario: Con pochi elementi le liste della retro non hanno controlli
    Dato la viewport è 1440x900
    E l'utente apre la pagina "/retro"
    Allora non vede il testo "Pagina 1 di"
