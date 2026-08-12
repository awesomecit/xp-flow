Feature: xpflow status
  Come sviluppatore
  Voglio eseguire "xpflow status" dalla CLI
  Per vedere lo stato corrente dello sprint senza aprire file

  Scenario: Sprint attivo con eventi
    Given events.jsonl contiene eventi di uno sprint con SP totali 5
    And 2 scenari risultano chiusi (esito "ok")
    When eseguo "xpflow status"
    Then l'output mostra il comando corrente dello sprint attivo
    And mostra "SP: 2/5 bruciati"
    And mostra i review pending se presenti
    And mostra le azioni manuali non ancora chiuse

  Scenario: Azione manuale pendente
    Given events.jsonl contiene un evento con esito "azione_manuale" senza manual_done corrispondente
    When eseguo "xpflow status"
    Then l'output elenca l'azione manuale con la nota e il timestamp originale

  Scenario: Nessuno sprint attivo
    Given events.jsonl non contiene eventi di sprint aperti
    When eseguo "xpflow status"
    Then l'output mostra "nessuno sprint attivo"
    And il processo termina con exit code 0

  Scenario: events.jsonl non esiste
    Given events.jsonl non esiste
    When eseguo "xpflow status"
    Then l'output mostra "nessun evento registrato — fabbrica non ancora avviata"
    And il processo termina con exit code 0

  Scenario: Riga malformata in events.jsonl
    Given events.jsonl contiene una riga JSON non valida tra eventi validi
    When eseguo "xpflow status"
    Then la riga invalida viene saltata con un warning su stderr
    And gli eventi validi vengono elaborati normalmente
    And il processo termina con exit code 0
