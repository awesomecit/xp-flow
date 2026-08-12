import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export const DEFAULT_EVENTS_FILE = '.xpflow/events.jsonl'

export interface XpEventInput {
  cmd: string
  issue?: number
  sp?: number
  esito?: string
  note?: string
}

export interface XpEvent extends XpEventInput {
  ts: string
}

export async function appendEvent(
  event: XpEventInput,
  file: string = DEFAULT_EVENTS_FILE
): Promise<void> {
  if (!event.cmd) throw new Error('campo "cmd" obbligatorio')
  mkdirSync(dirname(file), { recursive: true })
  const stored: XpEvent = { ts: new Date().toISOString(), ...event }
  appendFileSync(file, JSON.stringify(stored) + '\n')
}
