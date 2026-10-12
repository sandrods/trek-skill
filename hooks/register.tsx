import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Cycle, LedgerRow, Trek } from '../types'
import { joinPath, leadCycle, parseLedger, parseTrek, planPath, trekBranch } from './parse'

const PANE = 'trek-status'
const POLL_MS = 3000
const treks = atom({ plugin: 'trek', key: 'treks' } as const, [])
const showAll = atom({ plugin: 'trek', key: 'showAll' } as const, false)

// What the band and, without --all, the pane show: the trek of the checked-out branch,
// or every open trek when the branch belongs to none.
function inView(list: Trek[]): Trek[] {
  const open = list.filter(t => t.status === 'open')
  const current = open.filter(t => t.isCurrent)
  return current.length > 0 ? current : open
}

// Reads every trek folder under the root. A folder without a readable trek.md is skipped.
// Paths start from the session's root, which follows a move into a worktree.
async function load($: EngineInterface): Promise<Trek[]> {
  const base = await $.session.root()
  const root = await trekRoot($, base)
  const branch = trekBranch(await currentBranch($, base))
  const entries = await $.fs.list(root).catch(() => [])
  const found: Trek[] = []

  for (const entry of entries.filter(e => e.kind === 'dir').sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = `${root}/${entry.name}`
    const text = await $.fs.read(`${dir}/trek.md`).catch(() => undefined)
    if (typeof text !== 'string') continue

    const record = parseTrek(text)
    const isCurrent = branch?.topic === entry.name
    // On a cycle branch that cycle leads; elsewhere the furthest-along one in flight.
    const own = isCurrent && branch?.cycle !== undefined
      ? record.cycles.find(c => branch.cycle?.split('-')[0] === c.id)
      : undefined
    const lead = own ?? leadCycle(record.cycles)
    const trek: Trek = { ...record, topic: entry.name, lead, isCurrent, isLeadCheckedOut: own !== undefined }

    // A plan's ledger is shown from the moment it is committed, not only once executing.
    if (lead?.status === 'plan' || lead?.status === 'executing') {
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
async function currentBranch($: EngineInterface, base: string): Promise<string | undefined> {
  let head = await $.fs.read(`${base}/.git/HEAD`).catch(() => undefined)
  if (typeof head !== 'string') {
    const pointer = await $.fs.read(`${base}/.git`).catch(() => undefined)
    const gitdir = typeof pointer === 'string' ? pointer.match(/^gitdir:\s*(.+)$/m)?.[1]?.trim() : undefined
    if (gitdir === undefined) return undefined
    head = await $.fs.read(`${gitdir}/HEAD`).catch(() => undefined)
  }
  return typeof head === 'string' ? head.match(/^ref: refs\/heads\/(.+)$/m)?.[1]?.trim() : undefined
}

// docs/treks/ unless the project's CLAUDE.md states `Trek root: <path>`.
async function trekRoot($: EngineInterface, base: string): Promise<string> {
  const claude = await $.fs.read(`${base}/CLAUDE.md`).catch(() => '')
  const named = typeof claude === 'string' ? claude.match(/Trek root:\s*`?([^`\s]+)`?/)?.[1] : undefined
  return joinPath(base, (named ?? 'docs/treks').replace(/\/$/, ''))
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
  return same > 1 && !trek.isLeadCheckedOut ? `${same} cycles ${lead.status}` : `cycle ${lead.id} ${lead.status}`
}

type Progress = { done: number; total: number; current?: LedgerRow; label: string }

function progress(trek: Trek): Progress | undefined {
  const status = trek.lead?.status
  if (status !== 'plan' && status !== 'executing') return undefined
  if (trek.ledger === undefined) return { done: 0, total: 0, label: 'plan not found' }
  if (trek.ledger === null) return { done: 0, total: 0, label: 'no ledger' }

  const rows = trek.ledger
  if (status === 'plan') return { done: 0, total: rows.length, current: rows[0], label: `${rows.length} tasks planned` }
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
      description: 'Show this branch\'s trek (or every open one off a trek branch); --all for every trek',
    })
    await refresh($)
    $.clock.every(POLL_MS, () => void refresh($))

    return next(e)
  })

  on('command.run', { command: 'trek-status' }, async ($, e) => {
    await update($, showAll, () => /(^|\s)--all(\s|$)/.test(e.args))
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
    const open = inView(await read($, treks))
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
    const loaded = await read($, treks)
    const list = (await read($, showAll)) ? loaded : inView(loaded)
    const width = Math.max(20, e.props.bodyColumns - 4)

    if (list.length === 0) return <Text dimColor>No open trek in this checkout; /trek-status --all shows closed ones too.</Text>

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
    const cycleRow = (c: Cycle, isLead: boolean) => {
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
        {'       '}
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
              {isOpen &&
                trek.cycles.map(c => {
                  const isLead = c.id === trek.lead?.id
                  if (!isLead || !steps) return cycleRow(c, isLead)
                  // The lead cycle carries its ledger nested beneath it.
                  return (
                    <Box flexDirection="column">
                      {cycleRow(c, true)}
                      <Text>
                        {'       '}
                        <Text color="success">{filled}</Text>
                        <Text color="inactive">{empty}</Text>{' '}
                        <Text color={steps.current ? look(steps.current.status).color : 'success'} bold>
                          {steps.total > 0 ? `${steps.done}/${steps.total} · ` : ''}
                          {steps.label}
                        </Text>
                      </Text>
                      {(trek.ledger ?? []).map(ledgerRow)}
                    </Box>
                  )
                })}
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
