import { expect, test } from 'claude-code/testing'

import { joinPath, leadCycle, parseLedger, parseTrek, planPath, trekBranch } from './parse'

const TREK = `# Trek — as marcações na app

**Status:** open · **Started:** 2026-10-12 · **Sources:** the conversation
**Board:** https://claude.ai/artifact/x

## Why this cut

Because.

## Cycles

### 1. A inclusão de marcação — \`executing\`

**Goal:** something.

**Artifacts:** spec \`../../superpowers/specs/a.md\` · plan
\`../../superpowers/plans/2026-10-07-incluir-marcacao.md\` · branch \`incluir-marcacao\`

### 2. O registro da marcação — \`not started\`

**Artifacts:** folder \`cycles/2-registro-da-marcacao/\` · branch — · MR —

## Rules

- **R1** (cut) — a rule

## Open questions

- **Q1** (Sandro, with SRH/DBA) — production \`INSERT\` on a table;
  gates cycles 2 and 4.
- **Q2** (Sandro) — answered 2026-09-28 by Sandro: no; see R5.
`

const PLAN = `# Cycle 2 — plan

## Ledger

| # | Task | Status | Commit | Note |
|---|---|---|---|---|
| 1 | Model | done | abc1234 | |
| 2 | Screen | running | — | |
| R | Final review | pending | — | |

## Tasks
`

test('reads the header, the cycles and the open questions of trek.md', () => {
  const trek = parseTrek(TREK)

  expect(trek.title).toBe('as marcações na app')
  expect(trek.status).toBe('open')
  expect(trek.cycles.map(c => [c.id, c.status])).toEqual([
    ['1', 'executing'],
    ['2', 'not started'],
  ])
  expect(trek.questions.map(q => [q.id, q.owner, q.isOpen])).toEqual([
    ['Q1', 'Sandro, with SRH/DBA', true],
    ['Q2', 'Sandro', false],
  ])
  expect(trek.questions[0]?.text).toBe('production `INSERT` on a table; gates cycles 2 and 4.')
})

test('finds the plan from a named plan path or from the cycle folder', () => {
  const [first, second] = parseTrek(TREK).cycles
  if (first === undefined || second === undefined) throw new Error('two cycles expected')

  expect(planPath(first)).toBe('../../superpowers/plans/2026-10-07-incluir-marcacao.md')
  expect(planPath(second)).toBe('cycles/2-registro-da-marcacao/2-registro-da-marcacao-plan.md')
  expect(joinPath('docs/treks/m', planPath(first) ?? '')).toBe(
    'docs/superpowers/plans/2026-10-07-incluir-marcacao.md',
  )
})

test('leads with the furthest-along in-flight cycle', () => {
  const cycles = parseTrek(TREK).cycles

  expect(leadCycle(cycles)?.id).toBe('1')
  expect(leadCycle(cycles.slice(1))).toBeUndefined()
})

test('reads the ledger table, and null when the plan has none', () => {
  expect(parseLedger(PLAN)?.map(r => [r.id, r.status, r.commit])).toEqual([
    ['1', 'done', 'abc1234'],
    ['2', 'running', '—'],
    ['R', 'pending', '—'],
  ])
  expect(parseLedger('# plan\n\n## Tasks\n')).toBeNull()
})

test('reads only treks/<topic>/<main|cycle> as a trek branch', () => {
  expect(trekBranch('treks/marcacoes-na-app/main')).toEqual({ topic: 'marcacoes-na-app' })
  expect(trekBranch('treks/marcacoes-na-app/2-registro')).toEqual({ topic: 'marcacoes-na-app', cycle: '2-registro' })
  expect(trekBranch('feature/x')).toBeUndefined()
  expect(trekBranch('treks/a/b/c')).toBeUndefined()
  expect(trekBranch(undefined)).toBeUndefined()
})
