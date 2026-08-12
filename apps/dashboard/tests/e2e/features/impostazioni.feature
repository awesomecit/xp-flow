# language: it
@settings
Funzionalità: Impostazioni e diagnostica
  Come product owner
  Voglio scegliere lingua e tema e vedere da dove arrivano i dati
  Così da usare il cruscotto come preferisco e capire cosa sto guardando

  @positive
  Scenario: Preferenze e pannello diagnostico
    Dato l'utente apre la pagina "/impostazioni"
    Allora vede il testo "Preferenze"
    E vede il testo "Diagnostica"
    E vede il testo "Origine dati"

  @positive
  Scenario: Il cambio lingua si applica subito e resta dopo un reload
    Dato l'utente apre la pagina "/impostazioni"
    Quando seleziona "en" nel filtro "Lingua"
    Allora vede il testo "Settings"
    Quando ricarica la pagina
    Allora vede il testo "Settings"

  @negative
  Scenario: Nessuna scrittura verso il backend dalle impostazioni
    Dato l'utente apre la pagina "/impostazioni"
    Allora non vede un messaggio di errore
    E non ci sono errori in console

  @edge
  Schema dello scenario: Impostazioni fuori dalla bottom-nav phone
    Dato la viewport è <larghezza>x<altezza>
    E l'utente apre la pagina "/"
    Allora la navigazione primaria contiene <voci> voci

    Esempi:
      | larghezza | altezza | voci |
      | 360       | 800     | 2    |
      | 1440      | 900     | 5    |

  @regression @slice-1
  Scenario: Il tema scelto resta applicato navigando tra le viste
    Dato l'utente apre la pagina "/impostazioni"
    Quando seleziona "light" nel filtro "Tema"
    E l'utente apre la pagina "/timeline"
    Allora non vede un messaggio di errore
