import { test } from 'tap'
import { existsSync, unlinkSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { appendEvent } from '../src/events.js'

const EVENTS_FILE = join('.xpflow', 'test-eventlog.jsonl')

function cleanup() {
  if (existsSync(EVENTS_FILE)) unlinkSync(EVENTS_FILE)
}

test('appende un evento valido', async t => {
  cleanup()
  await appendEvent({ cmd: 'brainstorm', issue: 1, sp: 3, esito: 'ok', note: 'test' }, EVENTS_FILE)
  const lines = readFileSync(EVENTS_FILE, 'utf8').trim().split('\n')
  t.equal(lines.length, 1)
  const event = JSON.parse(lines[0])
  t.ok(event.ts, 'ha timestamp ISO')
  t.equal(event.cmd, 'brainstorm')
  t.equal(event.issue, 1)
})

test('prima scrittura crea il file se non esiste', async t => {
  cleanup()
  t.notOk(existsSync(EVENTS_FILE), 'precondizione: file assente')
  await appendEvent({ cmd: 'sprint', issue: 1, sp: 1, esito: 'ok', note: '' }, EVENTS_FILE)
  t.ok(existsSync(EVENTS_FILE), 'file creato dopo prima scrittura')
})

test('rifiuta evento senza campo cmd', async t => {
  const before = existsSync(EVENTS_FILE) ? readFileSync(EVENTS_FILE, 'utf8') : ''
  await t.rejects(
    // @ts-expect-error test intenzionale: schema non valido
    () => appendEvent({ issue: 1, sp: 1, esito: 'ok', note: '' }, EVENTS_FILE),
    'errore esplicito per cmd mancante'
  )
  const after = existsSync(EVENTS_FILE) ? readFileSync(EVENTS_FILE, 'utf8') : ''
  t.equal(before, after, 'file invariato dopo errore')
})

test('due scritture in rapida successione producono due righe valide', async t => {
  cleanup()
  await Promise.all([
    appendEvent({ cmd: 'brainstorm', issue: 1, sp: 1, esito: 'ok', note: 'primo' }, EVENTS_FILE),
    appendEvent({ cmd: 'sprint', issue: 1, sp: 1, esito: 'ok', note: 'secondo' }, EVENTS_FILE),
  ])
  const lines = readFileSync(EVENTS_FILE, 'utf8').trim().split('\n')
  t.equal(lines.length, 2, 'due righe')
  for (const [i, line] of lines.entries()) {
    t.doesNotThrow(() => JSON.parse(line), `riga ${i + 1} è JSON valido`)
  }
})
