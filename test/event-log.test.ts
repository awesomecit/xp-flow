import { test } from 'tap'
import { existsSync, unlinkSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { appendEvent } from '../src/events.js'

const EVENTS_FILE = join('.xpflow', 'test-eventlog.jsonl')
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function cleanup() {
  if (existsSync(EVENTS_FILE)) unlinkSync(EVENTS_FILE)
}

test('appende un evento valido', async t => {
  t.teardown(cleanup)
  cleanup()
  await appendEvent({ cmd: 'brainstorm', issue: 1, sp: 3, esito: 'ok', note: 'test' }, EVENTS_FILE)
  const lines = readFileSync(EVENTS_FILE, 'utf8').trim().split('\n')
  t.equal(lines.length, 1)
  const event = JSON.parse(lines[0])
  t.match(event.ts, ISO_RE, 'ts è ISO-8601 UTC')
  t.equal(event.cmd, 'brainstorm')
  t.equal(event.issue, 1)
})

test('prima scrittura crea il file se non esiste', async t => {
  t.teardown(cleanup)
  cleanup()
  t.notOk(existsSync(EVENTS_FILE), 'precondizione: file assente')
  await appendEvent({ cmd: 'sprint', issue: 1, sp: 1, esito: 'ok', note: '' }, EVENTS_FILE)
  t.ok(existsSync(EVENTS_FILE), 'file creato dopo prima scrittura')
})

test('rifiuta evento senza campo cmd', async t => {
  t.teardown(cleanup)
  cleanup()
  const before = existsSync(EVENTS_FILE) ? readFileSync(EVENTS_FILE, 'utf8') : ''
  await t.rejects(
    // @ts-expect-error test intenzionale: schema non valido
    () => appendEvent({ issue: 1, sp: 1, esito: 'ok', note: '' }, EVENTS_FILE),
    'errore esplicito per cmd mancante'
  )
  const after = existsSync(EVENTS_FILE) ? readFileSync(EVENTS_FILE, 'utf8') : ''
  t.equal(before, after, 'file invariato dopo errore')
})

test('due scritture sequenziali producono due righe con timestamp crescenti', async t => {
  t.teardown(cleanup)
  cleanup()
  // appendFileSync è sincrono: Promise.all esegue in sequenza nel thread JS
  await Promise.all([
    appendEvent({ cmd: 'brainstorm', issue: 1, sp: 1, esito: 'ok', note: 'primo' }, EVENTS_FILE),
    appendEvent({ cmd: 'sprint', issue: 1, sp: 1, esito: 'ok', note: 'secondo' }, EVENTS_FILE),
  ])
  const lines = readFileSync(EVENTS_FILE, 'utf8').trim().split('\n')
  t.equal(lines.length, 2, 'due righe')
  const [ev1, ev2] = lines.map(l => JSON.parse(l))
  for (const [i, ev] of [ev1, ev2].entries()) {
    t.match(ev.ts, ISO_RE, `riga ${i + 1} ha timestamp ISO`)
  }
  t.ok(ev1.ts <= ev2.ts, 'timestamp crescenti o uguali')
})
