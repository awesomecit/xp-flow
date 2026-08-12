import { afterEach, expect, test } from 'vitest'
import { existsSync, unlinkSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { appendEvent } from '../src/events.js'

const EVENTS_FILE = join('.xpflow', 'test-eventlog.jsonl')
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function cleanup() {
  if (existsSync(EVENTS_FILE)) unlinkSync(EVENTS_FILE)
}

afterEach(cleanup)

test('appende un evento valido', async () => {
  cleanup()
  await appendEvent({ cmd: 'brainstorm', issue: 1, sp: 3, esito: 'ok', note: 'test' }, EVENTS_FILE)
  const lines = readFileSync(EVENTS_FILE, 'utf8').trim().split('\n')
  expect(lines.length).toBe(1)
  const event = JSON.parse(lines[0])
  expect(event.ts).toMatch(ISO_RE)
  expect(event.cmd).toBe('brainstorm')
  expect(event.issue).toBe(1)
})

test('prima scrittura crea il file se non esiste', async () => {
  cleanup()
  expect(existsSync(EVENTS_FILE)).toBe(false)
  await appendEvent({ cmd: 'sprint', issue: 1, sp: 1, esito: 'ok', note: '' }, EVENTS_FILE)
  expect(existsSync(EVENTS_FILE)).toBe(true)
})

test('rifiuta evento senza campo cmd', async () => {
  cleanup()
  const before = existsSync(EVENTS_FILE) ? readFileSync(EVENTS_FILE, 'utf8') : ''
  await expect(
    // @ts-expect-error test intenzionale: schema non valido
    () => appendEvent({ issue: 1, sp: 1, esito: 'ok', note: '' }, EVENTS_FILE)
  ).rejects.toThrow()
  const after = existsSync(EVENTS_FILE) ? readFileSync(EVENTS_FILE, 'utf8') : ''
  expect(after).toBe(before)
})

test('due scritture sequenziali producono due righe con timestamp crescenti', async () => {
  cleanup()
  await Promise.all([
    appendEvent({ cmd: 'brainstorm', issue: 1, sp: 1, esito: 'ok', note: 'primo' }, EVENTS_FILE),
    appendEvent({ cmd: 'sprint', issue: 1, sp: 1, esito: 'ok', note: 'secondo' }, EVENTS_FILE),
  ])
  const lines = readFileSync(EVENTS_FILE, 'utf8').trim().split('\n')
  expect(lines.length).toBe(2)
  const [ev1, ev2] = lines.map(l => JSON.parse(l))
  for (const ev of [ev1, ev2]) {
    expect(ev.ts).toMatch(ISO_RE)
  }
  expect(ev1.ts <= ev2.ts).toBe(true)
})
