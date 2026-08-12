import { test } from 'tap'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { computeStatus } from '../src/status.js'

const EVENTS_FILE = '.xpflow/test-status.jsonl'

function writeEvents(lines: object[]) {
  writeFileSync(EVENTS_FILE, lines.map(l => JSON.stringify(l)).join('\n') + '\n')
}

function cleanup() {
  if (existsSync(EVENTS_FILE)) unlinkSync(EVENTS_FILE)
}

test('sprint attivo mostra SP bruciati e stimati', async t => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'sprint', issue: 1, sp: 5, esito: 'avviato', note: '' },
    { ts: '2026-08-12T11:00:00Z', cmd: 'scenario', issue: 1, sp: 1, esito: 'ok', note: 'scenario 1' },
    { ts: '2026-08-12T12:00:00Z', cmd: 'scenario', issue: 1, sp: 1, esito: 'ok', note: 'scenario 2' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  t.ok(status.sprintAttivo, 'sprint attivo rilevato')
  t.equal(status.spTotali, 5)
  t.equal(status.spBruciati, 2)
})

test('azione manuale pendente appare in status', async t => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'sprint', issue: 1, sp: 3, esito: 'avviato', note: '' },
    { ts: '2026-08-12T11:00:00Z', cmd: 'brainstorm', issue: 2, sp: 0, esito: 'azione_manuale', note: 'configurare secret TELEGRAM_TOKEN' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  t.equal(status.azioniManuali.length, 1, 'una azione manuale pendente')
  t.match(status.azioniManuali[0].note, /TELEGRAM_TOKEN/)
})

test('nessuno sprint attivo', async t => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'brainstorm', issue: 1, sp: 3, esito: 'ok', note: '' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  t.notOk(status.sprintAttivo, 'nessuno sprint attivo')
})

test('events.jsonl non esiste → fabbrica non avviata', async t => {
  cleanup()
  const status = await computeStatus(EVENTS_FILE)
  t.notOk(status.sprintAttivo)
  t.equal(status.azioniManuali.length, 0)
  t.equal(status.spTotali, 0)
})

test('riga malformata saltata, eventi validi elaborati', async t => {
  writeFileSync(
    EVENTS_FILE,
    JSON.stringify({ ts: '2026-08-12T10:00:00Z', cmd: 'sprint', issue: 1, sp: 3, esito: 'avviato', note: '' }) + '\n' +
    '\n' +
    'RIGA_INVALIDA_NON_JSON\n' +
    JSON.stringify({ ts: '2026-08-12T11:00:00Z', cmd: 'scenario', issue: 1, sp: 1, esito: 'ok', note: '' }) + '\n'
  )
  const status = await computeStatus(EVENTS_FILE)
  t.ok(status.sprintAttivo, 'sprint rilevato nonostante riga invalida')
  t.equal(status.spBruciati, 1, 'evento valido dopo riga invalida conteggiato')
})

test('events.jsonl esiste ma è vuoto → fabbrica non avviata', async t => {
  writeFileSync(EVENTS_FILE, '')
  const status = await computeStatus(EVENTS_FILE)
  t.notOk(status.sprintAttivo)
  t.equal(status.spTotali, 0)
})

test('evento sprint senza sp e azione_manuale senza note → valori di default', async t => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'sprint', esito: 'avviato' },
    { ts: '2026-08-12T11:00:00Z', cmd: 'scenario', esito: 'ok' },
    { ts: '2026-08-12T12:00:00Z', cmd: 'deploy', esito: 'azione_manuale' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  t.ok(status.sprintAttivo)
  t.equal(status.spTotali, 0, 'sp sprint mancante → default 0')
  t.equal(status.spBruciati, 0, 'sp scenario mancante → default 0')
  t.equal(status.azioniManuali[0].note, '', 'note mancante → default stringa vuota')
})
