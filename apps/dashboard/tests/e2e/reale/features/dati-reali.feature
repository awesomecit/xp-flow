# language: it
@reale
Funzionalità: Dati reali dal log della fabbrica
  Come product owner
  Voglio che il monitor legga l'event log vero (senza MSW)
  Così da vedere lo stato reale della fabbrica

  @positive @slice-1
  Scenario: La timeline mostra gli eventi del log reale
    Dato l'utente apre la pagina "/timeline"
    Allora vede il testo "sprint sensore lunare avviato in tdd"
    E non vede un messaggio di errore

  @positive @slice-1
  Scenario: La dashboard mostra l'azione manuale pendente del log reale
    Dato l'utente apre la pagina "/"
    Allora vede il testo "caricare la chiave api del sensore lunare"
    E non vede un messaggio di errore
