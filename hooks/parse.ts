import type { Cycle, LedgerRow, Question, TrekRecord } from '../types'

// Statuses ranked the way Resume ranks them: the first one present is the cycle to show.
export const IN_FLIGHT = ['executing', 'in review', 'plan', 'spec'] as const

const CYCLE_HEADING = /^### (\S+)\. (.+?) — `([^`]+)`/

export function parseTrek(text: string): TrekRecord {
  const title = text.match(/^# Trek — (.+)$/m)?.[1]?.trim() ?? ''
  const status = text.match(/\*\*Status:\*\* ([a-z]+)/)?.[1] ?? 'open'
  const sections = splitSections(text)

  return {
    title,
    status,
    cycles: parseCycles(sections.get('Cycles') ?? ''),
    questions: parseQuestions(sections.get('Open questions') ?? ''),
  }
}

export function parseLedger(text: string): LedgerRow[] | null {
  const ledger = splitSections(text).get('Ledger')
  if (ledger === undefined) return null

  return ledger
    .split('\n')
    .filter(line => line.startsWith('|'))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length >= 3 && cells[0] !== '#' && !/^-+$/.test(cells[0] ?? ''))
    .map(([id = '', task = '', status = '', commit = '', note = '']) => ({ id, task, status, commit, note }))
}

// The cycle the band and the pane lead with, or undefined when none is in flight.
export function leadCycle(cycles: Cycle[]): Cycle | undefined {
  for (const status of IN_FLIGHT) {
    const found = cycles.filter(c => c.status === status)
    if (found.length > 0) return found[found.length - 1]
  }
  return undefined
}

// The cycle's plan, relative to the trek folder: the folder's own `<folder>-plan.md`, or,
// for a cycle adopted in flight without a folder, the plan path its Artifacts line names.
export function planPath(cycle: Cycle): string | undefined {
  const folder = cycle.artifacts.match(/folder\s+`(cycles\/([^`/]+))\/?`/)
  if (folder !== null) return `${folder[1]}/${folder[2]}-plan.md`

  return cycle.artifacts.match(/plan\s+`([^`]+\.md)`/)?.[1]
}

export function joinPath(base: string, rel: string): string {
  const parts = `${base}/${rel}`.split('/')
  const out: string[] = []
  for (const part of parts) {
    if (part === '..' && out.length > 0 && out[out.length - 1] !== '..') out.pop()
    else if (part !== '.' && part !== '') out.push(part)
  }
  return (base.startsWith('/') ? '/' : '') + out.join('/')
}

function splitSections(text: string): Map<string, string> {
  const sections = new Map<string, string>()
  const chunks = text.split(/^## /m).slice(1)
  for (const chunk of chunks) {
    const newline = chunk.indexOf('\n')
    sections.set(chunk.slice(0, newline).trim(), chunk.slice(newline + 1))
  }
  return sections
}

function parseCycles(section: string): Cycle[] {
  const cycles: Cycle[] = []
  for (const chunk of section.split(/^(?=### )/m)) {
    const heading = chunk.match(CYCLE_HEADING)
    if (heading === null) continue

    const artifacts = chunk.match(/\*\*Artifacts:\*\*([\s\S]*?)(?:\n\n|$)/)?.[1] ?? ''
    cycles.push({
      id: heading[1] ?? '',
      name: heading[2] ?? '',
      status: heading[3] ?? '',
      artifacts: artifacts.replace(/\s+/g, ' ').trim(),
    })
  }
  return cycles
}

function parseQuestions(section: string): Question[] {
  return section
    .split(/^(?=- \*\*Q)/m)
    .map(item => item.match(/^- \*\*(Q\d+)\*\* \(([^)]+)\) — ([\s\S]*)/))
    .filter(match => match !== null)
    .map(([, id = '', owner = '', body = '']) => {
      const text = body.replace(/\s+/g, ' ').trim()
      return { id, owner, text, isOpen: !/^(answered|closed|resolved|superseded)\b/i.test(text) }
    })
}
