import { afterEach, expect, test } from 'vitest'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { computeStatus } from '../src/status.js'

const EVENTS_FILE = '.xpflow/test-status.jsonl'

function writeEvents(lines: object[]) {
  writeFileSync(EVENTS_FILE, lines.map(l => JSON.stringify(l)).join('\n') + '\n')
}

function cleanup() {
  if (existsSync(EVENTS_FILE)) unlinkSync(EVENTS_FILE)
}

afterEach(cleanup)

test('sprint attivo mostra SP bruciati e stimati', async () => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'sprint', issue: 1, sp: 5, esito: 'avviato', note: '' },
    { ts: '2026-08-12T11:00:00Z', cmd: 'scenario', issue: 1, sp: 1, esito: 'ok', note: 'scenario 1' },
    { ts: '2026-08-12T12:00:00Z', cmd: 'scenario', issue: 1, sp: 1, esito: 'ok', note: 'scenario 2' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  expect(status.sprintAttivo).toBeTruthy()
  expect(status.spTotali).toBe(5)
  expect(status.spBruciati).toBe(2)
})

test('azione manuale pendente appare in status', async () => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'sprint', issue: 1, sp: 3, esito: 'avviato', note: '' },
    { ts: '2026-08-12T11:00:00Z', cmd: 'deploy', esito: 'azione_manuale', note: 'configurare secret TELEGRAM_TOKEN' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  expect(status.azioniManuali.length).toBe(1)
  expect(status.azioniManuali[0].note).toMatch(/TELEGRAM_TOKEN/)
})

test('azione manuale chiusa da manual_done non appare in status', async () => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'sprint', issue: 1, sp: 3, esito: 'avviato', note: '' },
    { ts: '2026-08-12T11:00:00Z', cmd: 'deploy', esito: 'azione_manuale', note: 'configurare TOKEN' },
    { ts: '2026-08-12T12:00:00Z', cmd: 'manual_done', ref: '2026-08-12T11:00:00Z' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  expect(status.azioniManuali.length).toBe(0)
})

test('nessuno sprint attivo', async () => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'brainstorm', issue: 1, sp: 3, esito: 'ok', note: '' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  expect(status.sprintAttivo).toBeFalsy()
})

test('events.jsonl non esiste → fabbrica non avviata', async () => {
  cleanup()
  const status = await computeStatus(EVENTS_FILE)
  expect(status.sprintAttivo).toBeFalsy()
  expect(status.azioniManuali.length).toBe(0)
  expect(status.spTotali).toBe(0)
})

test('riga malformata saltata, eventi validi elaborati', async () => {
  writeFileSync(
    EVENTS_FILE,
    JSON.stringify({ ts: '2026-08-12T10:00:00Z', cmd: 'sprint', issue: 1, sp: 3, esito: 'avviato', note: '' }) + '\n' +
    '\n' +
    'RIGA_INVALIDA_NON_JSON\n' +
    JSON.stringify({ ts: '2026-08-12T11:00:00Z', cmd: 'scenario', issue: 1, sp: 1, esito: 'ok', note: '' }) + '\n'
  )
  const status = await computeStatus(EVENTS_FILE)
  expect(status.sprintAttivo).toBeTruthy()
  expect(status.spBruciati).toBe(1)
})

test('events.jsonl esiste ma è vuoto → fabbrica non avviata', async () => {
  writeFileSync(EVENTS_FILE, '')
  const status = await computeStatus(EVENTS_FILE)
  expect(status.sprintAttivo).toBeFalsy()
  expect(status.spTotali).toBe(0)
})

test('evento sprint senza sp e azione_manuale senza note → valori di default', async () => {
  writeEvents([
    { ts: '2026-08-12T10:00:00Z', cmd: 'sprint', esito: 'avviato' },
    { ts: '2026-08-12T11:00:00Z', cmd: 'scenario', esito: 'ok' },
    { ts: '2026-08-12T12:00:00Z', cmd: 'deploy', esito: 'azione_manuale' },
  ])
  const status = await computeStatus(EVENTS_FILE)
  expect(status.sprintAttivo).toBeTruthy()
  expect(status.spTotali).toBe(0)
  expect(status.spBruciati).toBe(0)
  expect(status.azioniManuali[0].note).toBe('')
})
