# language: it
# Template: copia in tests/e2e/features/<feature>.feature
# Ogni feature DEVE avere almeno: 1 positivo, 1 negativo, 1 edge, 1 non-regression.

@nome-feature
Funzionalità: <nome della feature>
  Come <ruolo>
  Voglio <capacità>
  Così da <valore>

  @positive
  Scenario: <percorso felice>
    Dato l'utente apre la pagina "/"
    Quando clicca sul pulsante "<azione>"
    Allora vede il testo "<risultato atteso>"

  @negative
  Scenario: <input non valido o permesso mancante>
    Dato l'utente apre la pagina "/"
    Quando clicca sul pulsante "<azione>"
    Allora vede il testo "<messaggio di errore atteso>"

  @edge
  Schema dello scenario: <limiti, valori estremi, form factor>
    Dato la viewport è <larghezza>x<altezza>
    E l'utente apre la pagina "/"
    Allora vede il testo "<risultato atteso>"

    Esempi:
      | larghezza | altezza |
      | 320       | 640     |
      | 1920      | 1080    |

  @regression @issue-XXXX
  Scenario: <bug già corretto che non deve tornare>
    Dato l'utente apre la pagina "/"
    Allora non ci sono errori in console
