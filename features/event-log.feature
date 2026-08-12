Feature: Event Log JSONL
  Come comando del flusso XP
  Voglio appendere eventi strutturati a .xpflow/events.jsonl
  Per avere una fonte di verità operativa append-only del ciclo di sviluppo

  Background:
    Given la directory .xpflow esiste o viene creata automaticamente

  Scenario: Appende un evento valido
    When un comando logga l'evento con cmd "brainstorm", issue 1, sp 3, esito "ok"
    Then events.jsonl contiene una nuova riga JSON con tutti i campi incluso il timestamp ISO
    And il file rimane valido JSONL (una riga = un oggetto JSON)

  Scenario: Prima scrittura — file non esiste
    Given events.jsonl non esiste
    When viene loggato il primo evento
    Then .xpflow/events.jsonl viene creato
    And contiene esattamente una riga JSON valida

  Scenario: Schema evento non valido — campo cmd mancante
    When un comando tenta di loggare un evento senza il campo "cmd"
    Then viene sollevato un errore esplicito con messaggio descrittivo
    And events.jsonl non viene modificato

  Scenario: Due scritture in rapida successione
    When due eventi vengono scritti in rapida successione
    Then events.jsonl contiene esattamente due righe
    And entrambe le righe sono JSON validi
    And i timestamp sono crescenti o uguali
