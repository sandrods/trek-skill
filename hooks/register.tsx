import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Cycle, LedgerRow, Trek } from '../types'
import { joinPath, leadCycle, parseLedger, parseTrek, planPath } from './parse'

const PANE = 'trek-status'
const POLL_MS = 3000
const treks = atom({ plugin: 'trek', key: 'treks' } as const, [])

// Reads every trek folder under the root. A folder without a readable trek.md is skipped.
async function load($: EngineInterface): Promise<Trek[]> {
  const root = await trekRoot($)
  const branch = await currentBranch($)
  const entries = await $.fs.list(root).catch(() => [])
  const found: Trek[] = []

  for (const entry of entries.filter(e => e.kind === 'dir').sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = `${root}/${entry.name}`
    const text = await $.fs.read(`${dir}/trek.md`).catch(() => undefined)
    if (typeof text !== 'string') continue

    const record = parseTrek(text)
    const lead = leadCycle(record.cycles)
    const isCurrent = branch !== undefined && record.branches.includes(branch)
    const trek: Trek = { ...record, topic: entry.name, lead, isCurrent }

    if (lead?.status === 'executing') {
      const rel = planPath(lead)
      if (rel !== undefined) {
        trek.planFile = joinPath(dir, rel)
        const plan = await $.fs.read(trek.planFile).catch(() => undefined)
        if (typeof plan === 'string') trek.ledger = parseLedger(plan)
      }
    }
    found.push(trek)
  }
  return found
}

// The checked-out branch, read from HEAD; `.git` is a file pointing at the gitdir in a worktree.
async function currentBranch($: EngineInterface): Promise<string | undefined> {
  let head = await $.fs.read('.git/HEAD').catch(() => undefined)
  if (typeof head !== 'string') {
    const pointer = await $.fs.read('.git').catch(() => undefined)
    const gitdir = typeof pointer === 'string' ? pointer.match(/^gitdir:\s*(.+)$/m)?.[1]?.trim() : undefined
    if (gitdir === undefined) return undefined
    head = await $.fs.read(`${gitdir}/HEAD`).catch(() => undefined)
  }
  return typeof head === 'string' ? head.match(/^ref: refs\/heads\/(.+)$/m)?.[1]?.trim() : undefined
}

// docs/treks/ unless the project's CLAUDE.md states `Trek root: <path>`.
async function trekRoot($: EngineInterface): Promise<string> {
  const claude = await $.fs.read('CLAUDE.md').catch(() => '')
  const named = typeof claude === 'string' ? claude.match(/Trek root:\s*`?([^`\s]+)`?/)?.[1] : undefined
  return (named ?? 'docs/treks').replace(/\/$/, '')
}

async function refresh($: EngineInterface): Promise<void> {
  const next = await load($)
  const current = await read($, treks)
  if (JSON.stringify(next) !== JSON.stringify(current)) await update($, treks, () => next)
}

type Look = { glyph: string; color: string }

// One glyph and one theme color per status, shared by cycles and ledger rows.
const LOOKS: Record<string, Look> = {
  done: { glyph: '✓', color: 'success' },
  executing: { glyph: '▶', color: 'warning' },
  running: { glyph: '▶', color: 'warning' },
  'in review': { glyph: '◆', color: 'suggestion' },
  plan: { glyph: '◇', color: 'planMode' },
  spec: { glyph: '◇', color: 'permission' },
  blocked: { glyph: '✗', color: 'error' },
  superseded: { glyph: '✗', color: 'inactive' },
}
const look = (status: string): Look => LOOKS[status] ?? { glyph: '○', color: 'inactive' }

function cyclePhrase(trek: Trek): string {
  const lead = trek.lead
  if (lead === undefined) return 'no cycle in flight'

  const same = trek.cycles.filter(c => c.status === lead.status).length
  return same > 1 ? `${same} cycles ${lead.status}` : `cycle ${lead.id} ${lead.status}`
}

type Progress = { done: number; total: number; current?: LedgerRow; label: string }

function progress(trek: Trek): Progress | undefined {
  if (trek.lead?.status !== 'executing') return undefined
  if (trek.ledger === undefined) return { done: 0, total: 0, label: 'plan not found' }
  if (trek.ledger === null) return { done: 0, total: 0, label: 'no ledger' }

  const rows = trek.ledger
  const done = rows.filter(r => r.status === 'done').length
  const current = rows.find(r => r.status !== 'done')
  const label = current === undefined
    ? 'ledger done'
    : `${current.id === 'R' ? 'review' : `task ${current.id}`} ${current.status}`
  return { done, total: rows.length, current, label }
}

const bar = (done: number, total: number) => ['▰'.repeat(done), '▱'.repeat(Math.max(0, total - done))]

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'trek-status',
      description: 'Show the treks of this checkout: cycles, the executing ledger, open questions',
    })
    await refresh($)
    $.clock.every(POLL_MS, () => void refresh($))

    return next(e)
  })

  on('command.run', { command: 'trek-status' }, async $ => {
    await refresh($)
    await $.ui.open({ id: PANE, title: 'Treks' })

    return { text: 'Trek status pane opened.' }
  })

  // Records written in this session redraw at once; the poll catches everything else.
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (e.tool === 'Edit' || e.tool === 'Write' || e.tool === 'Bash') await refresh($).catch(() => undefined)
    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const open = (await read($, treks)).filter(t => t.status === 'open' && t.isCurrent)
    if (e.props.hasSurvey || open.length === 0) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {open.map(trek => {
          const lead = trek.lead && look(trek.lead.status)
          const steps = progress(trek)
          const questions = trek.questions.filter(q => q.isOpen).length
          const [filled, empty] = bar(steps?.done ?? 0, steps?.total ?? 0)
          return (
            <Text wrap="truncate-end">
              <Text color="claude" bold>▌{trek.topic}</Text>{'  '}
              {trek.cycles.map(c => (
                <Text color={look(c.status).color}>{look(c.status).glyph}</Text>
              ))}{'  '}
              <Text color={lead?.color ?? 'inactive'} bold>{cyclePhrase(trek)}</Text>
              {steps && (
                <Text>
                  {'  '}
                  <Text color="success">{filled}</Text>
                  <Text color="inactive">{empty}</Text>{steps.total > 0 ? ' ' : ''}
                  <Text color={steps.current ? look(steps.current.status).color : 'success'}>{steps.label}</Text>
                </Text>
              )}
              {questions > 0 && <Text color="warning">{'  '}⚑ {questions} open Q</Text>}
            </Text>
          )
        })}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, treks)
    const width = Math.max(20, e.props.bodyColumns - 4)

    if (list.length === 0) return <Text dimColor>No trek records in this checkout.</Text>

    const chip = (status: string) => (
      <Text backgroundColor={look(status).color} color="inverseText" bold>
        {` ${status} `}
      </Text>
    )
    const heading = (text: string) => (
      <Text color="subtle" bold>
        {'  '}
        {text}
      </Text>
    )
    const cycleRow = (c: Cycle) => {
      const isLead = c.status === 'executing'
      return (
        <Text wrap="truncate-end">
          {'  '}
          <Text color={look(c.status).color}>{look(c.status).glyph}</Text>{' '}
          <Text dimColor>{c.id.padStart(2)}.</Text>{' '}
          <Text bold={isLead} dimColor={c.status === 'superseded'} strikethrough={c.status === 'superseded'}>
            {c.name}
          </Text>{' '}
          <Text color={look(c.status).color}>{c.status}</Text>
        </Text>
      )
    }
    const ledgerRow = (r: LedgerRow) => (
      <Text wrap="truncate-end">
        {'  '}
        <Text color={look(r.status).color}>{look(r.status).glyph}</Text>{' '}
        <Text dimColor>{r.id.padStart(2)}</Text>{' '}
        <Text bold={r.status === 'running'} dimColor={r.status === 'pending'}>{r.task}</Text>
        {r.commit && r.commit !== '—' ? <Text color="subtle"> {r.commit}</Text> : ''}
        {r.note ? <Text dimColor italic> — {r.note}</Text> : ''}
      </Text>
    )

    return (
      <Box flexDirection="column">
        {list.map(trek => {
          const steps = progress(trek)
          const [filled, empty] = bar(steps?.done ?? 0, steps?.total ?? 0)
          const questions = trek.questions.filter(q => q.isOpen)
          const isOpen = trek.status === 'open'
          return (
            <Box flexDirection="column" marginBottom={1}>
              <Text wrap="truncate-end">
                <Text color={isOpen ? 'claude' : 'inactive'} bold>▌{trek.topic}</Text>{' '}
                {chip(isOpen ? 'open' : trek.status === 'closed' ? 'done' : trek.status)}
                {trek.title ? <Text dimColor> {trek.title}</Text> : ''}
                {trek.isCurrent ? <Text color="claude"> ← this branch</Text> : ''}
              </Text>
              {isOpen && heading('Cycles')}
              {isOpen && trek.cycles.map(cycleRow)}
              {steps && trek.lead && (
                <Box flexDirection="column">
                  {heading(`Ledger · cycle ${trek.lead.id}`)}
                  <Text>
                    {'  '}
                    <Text color="success">{filled}</Text>
                    <Text color="inactive">{empty}</Text>{' '}
                    <Text color={steps.current ? look(steps.current.status).color : 'success'} bold>
                      {steps.total > 0 ? `${steps.done}/${steps.total} · ` : ''}
                      {steps.label}
                    </Text>
                  </Text>
                  {(trek.ledger ?? []).map(ledgerRow)}
                </Box>
              )}
              {isOpen && questions.length > 0 && heading('Open questions')}
              {isOpen &&
                questions.map(q => (
                  <Text wrap="truncate-end">
                    {'  '}
                    <Text color="warning" bold>⚑ {q.id}</Text> <Text color="subtle">{q.owner}</Text>{' '}
                    {q.text.length > width ? `${q.text.slice(0, width - 1)}…` : q.text}
                  </Text>
                ))}
            </Box>
          )
        })}
      </Box>
    )
  })
}
