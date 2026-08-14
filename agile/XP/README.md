# XP — Monitoraggio as-code del flusso agentico

> **Cos'è.** Il flusso XP del workspace, osservabile: gli eventi di sviluppo
> (transizioni dei task, commit, gate QA) diventano dati interrogabili e una
> dashboard per il monitor. Tutto as-code, tutto in questo repo (R&D
> archiviabile). **Pochi file, per scelta**: questo README è l'unica prosa.

## Principio

La fonte di verità è già as-code: i frontmatter di `.ai/tasks/` nei repo e la
storia git (**ogni transizione di stato è un commit** — il claiming via commit
non è solo un lock, è telemetria gratis). Questo kit non introduce una seconda
fonte: **estrae** eventi dalla storia git e **genera** viste. Mai il contrario.

```
.ai/tasks/ + git log  ──estrazione──▶  out/events.jsonl   (stream eventi)
      (fonte)                          out/status.json    (l'"API": stato interrogabile)
                                       out/dashboard.html (monitor, auto-refresh)
```

## File del kit

| File | Ruolo |
|---|---|
| `README.md` | regole e flusso (questo file) |
| `events.schema.json` | **contratto dati**: formato di eventi e status — chiunque (script, dashboard, futuro backend) interroga questo formato |
| `xp-status.mjs` | estrattore+generatore: legge i repo, scrive `out/` |
| `out/` | **generato, gitignorato**: si rigenera da git in qualsiasi momento (l'archivio È la storia git dei repo) |

## Uso

```bash
node XP/xp-status.mjs            # rigenera events/status/dashboard
open XP/out/dashboard.html       # sul monitor (auto-refresh ogni 2 min)
# loop per il monitor di stanza:
while true; do node XP/xp-status.mjs; sleep 120; done
```

## Regole del flusso (sintesi operativa)

1. Ogni transizione di stato di un task = un commit (`chore(board): ...`) —
   così l'evento è tracciato, attribuito e datato senza scrivere nulla a mano.
2. Le metriche derivano solo dagli eventi: WIP, throughput, cycle time
   (claim→done), SP per milestone. Niente metriche dichiarate a mano.
3. Le viste in `out/` non si committano né si editano: si rigenerano.
4. Evoluzione del kit: **decisione da ADR** — vedi task DIS-4 nella board di
   foundation e il design completo in [`design-piattaforma.md`](design-piattaforma.md)
   (matrice a 4 livelli: JSONL/DuckDB → NATS+Loki+Grafana → k3s → scala).
   Questo kit È il livello 1; finché un trigger non scatta (real-time sul
   monitor, seconda macchina, query dolorose sul JSONL) resta file + script
   (regola 9 del workspace). Il contratto (`events.schema.json`) è ciò che
   scala, non la tecnologia: qualsiasi livello successivo lo consuma invariato.
