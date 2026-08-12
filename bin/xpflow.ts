#!/usr/bin/env node
import { computeStatus } from '../src/status.js'

const cmd = process.argv[2]

if (cmd === 'status') {
  const status = await computeStatus()

  if (status.totalEvents === 0) {
    console.log('nessun evento registrato — fabbrica non ancora avviata')
    process.exit(0)
  }

  if (!status.sprintAttivo) {
    console.log('nessuno sprint attivo')
    process.exit(0)
  }

  console.log(`Sprint attivo | SP: ${status.spBruciati}/${status.spTotali} bruciati`)

  if (status.reviewPending.length > 0) {
    console.log('\nReview pending:')
    for (const r of status.reviewPending) console.log(`  - ${r}`)
  }

  if (status.azioniManuali.length > 0) {
    console.log('\nAzioni manuali pendenti:')
    for (const a of status.azioniManuali) {
      console.log(`  [${a.ts}] ${a.cmd}: ${a.note}`)
    }
  }
} else {
  process.stderr.write(`Comando sconosciuto: ${cmd ?? '(nessuno)'}\nUso: xpflow status\n`)
  process.exit(1)
}
