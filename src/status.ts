import { existsSync, readFileSync } from 'node:fs'
import { DEFAULT_EVENTS_FILE, XpEvent } from './events.js'

export interface ManualAction {
  ts: string
  cmd: string
  note: string
}

export interface SprintStatus {
  sprintAttivo: boolean
  spTotali: number
  spBruciati: number
  reviewPending: string[]
  azioniManuali: ManualAction[]
  totalEvents: number
}

function parseEvents(file: string): XpEvent[] {
  if (!existsSync(file)) return []
  const content = readFileSync(file, 'utf8').trim()
  if (!content) return []
  const results: XpEvent[] = []
  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    try {
      results.push(JSON.parse(line) as XpEvent)
    } catch {
      process.stderr.write(`[xpflow] riga non valida ignorata: ${line.slice(0, 60)}\n`)
    }
  }
  return results
}

export async function computeStatus(file: string = DEFAULT_EVENTS_FILE): Promise<SprintStatus> {
  const events = parseEvents(file)

  let sprintAttivo = false
  let spTotali = 0
  let spBruciati = 0
  const reviewPending: string[] = []
  const pending: ManualAction[] = []

  for (const ev of events) {
    if (ev.cmd === 'sprint' && ev.esito === 'avviato') {
      sprintAttivo = true
      spTotali = ev.sp ?? 0
    }
    if (ev.cmd === 'scenario' && ev.esito === 'ok') {
      spBruciati += ev.sp ?? 0
    }
    if (ev.esito === 'azione_manuale') {
      pending.push({ ts: ev.ts, cmd: ev.cmd, note: ev.note ?? '' })
    }
  }

  const azioniManuali = pending
  return { sprintAttivo, spTotali, spBruciati, reviewPending, azioniManuali, totalEvents: events.length }
}
