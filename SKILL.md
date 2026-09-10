---
name: cycles
description: Use when a program is too large to finish in one brainstorm-plan-execute-merge cycle, when a brainstorm reports the scope needs decomposing into sub-projects before designing, when a cycle has transitioned (spec committed, plan committed, MR opened, merged) and the program's cycles file or published status board is now out of date, or when asked to continue or resume a program's work — e.g. `/cycles continue` — in a fresh session, or when about to clear or end a session with a program still in flight — e.g. `/cycles handoff`.
---

# Cycles

## Overview

One program, several cycles of brainstorm → plan → execute → MR → merge. This skill
produces and maintains **one file** holding the cut: what each cycle is, what it
excludes, what governs it, how far it got. The file is the deliverable — you read it
to dispatch the next cycle and to see where you stand.

Its resolution is the **cycle**, never the task. Task progress within one plan already
lives in `.superpowers/sdd/<plan>/progress.md`; copying it here creates a second record
that will be the wrong one.

## When to Use

- A brainstorm concludes the scope exceeds one cycle
- You know a program is multi-cycle before brainstorming starts
- A cycle transitioned and the file no longer reflects reality
- Asked to continue or resume a program (`/cycles continue`), typically in a fresh session
- About to clear or end a session with a program in flight (`/cycles handoff`)

**Not for:** single-cycle work · task tracking within one plan · a roadmap of
unrelated features.

## Layout

Every program lives in one directory, `<base_dir>`, holding the records and one
subdirectory per cycle:

```
<base_dir>/                      default: docs/superpowers/cycles/<program-slug>/
  cycles.md                      the cycles file — the record
  board.html                     the status board — a view over cycles.md
  1-<cycle-slug>/
    1-<cycle-slug>-spec.md       written by brainstorming when the cycle is dispatched
    1-<cycle-slug>-plan.md       written by writing-plans once the spec is approved
  2-<cycle-slug>/
    ...
```

- `<base_dir>` defaults to `docs/superpowers/cycles/<program-slug>/`. The user may
  name a different directory when creating the program; the directory they name **is**
  `<base_dir>` as given — the slug is not appended to it — and every path below is
  relative to it. The cycles file's own location *is* the base directory, so it is
  never written into the file.
- The cycle directory is `<n>-<cycle-slug>/`, numbered as in the cycles file. A split
  cycle gets `1a-<slug>/`, `1b-<slug>/`.
- Spec and plan carry the cycle directory's name as a prefix, not bare `spec.md` /
  `plan.md`: the executor keys its ledger on the plan's basename
  (`.superpowers/sdd/<plan-basename>/`), so bare names would make every cycle share
  one ledger.
- Specs and plans for a cycle go **here, not** to `docs/superpowers/specs/` or
  `docs/superpowers/plans/`. When dispatching brainstorming or writing-plans, hand
  them the exact target path — their own defaults are for single-cycle work.
- `Artifacts` lines in `cycles.md` hold paths relative to `<base_dir>`.

## Mode 1 — Create

1. **Read the sources** — the request as stated, any existing decision or design
   document, the repo. Where a decisions doc exists, most of the work is routing:
   which decision governs which cycle. A source that lives outside the repo, or in a
   gitignored path, is copied into `<base_dir>/` so the cycles file's `Sources` line
   points at something committed.
2. **Ask boundary questions, one at a time.** In, out, what blocks what. Every field
   in `template.md` is answerable without knowing how anything gets built — a question
   needing implementation detail belongs to that cycle's own brainstorm.
3. **Present 2–3 candidate cuts** with trade-offs and a recommendation. Where you cut
   is a design decision; get approval before writing.
4. **Fill `template.md`** into `<base_dir>/cycles.md` — undated, unlike single-cycle
   specs and plans, because this file is returned to for weeks and a date prefix
   makes "is this still the current one?" a question every time.
5. **Create the status board** (see The Status Board below): author
   `<base_dir>/board.html`, publish it as an artifact, and write the returned URL into
   the cycles file's `**Board:**` header line.
6. **Commit both files** (and any copied source).
7. **STOP.** Do not dispatch cycle 1.

## Mode 2 — Update

Invoked at a transition. Two artifacts move together, in the same commit as the work
that caused the transition, never separately:

1. **The cycles file** — write the status and artifact path for the cycle that moved;
   on merge add the `Surprises` line.
2. **The status board** — edit `<base_dir>/board.html` to match, and republish it
   passing `url:` = the address in the cycles file's `**Board:**` line. A transition
   without a board refresh, or a republish without that `url:`, is an incomplete
   update.

## Mode 3 — Resume

Invoked with the argument `continue` (also `resume` / `retomar`, or any ask to
pick a program back up in a fresh session). Find every `cycles.md` in the repo
(default location `docs/superpowers/cycles/*/cycles.md`; a program may have been
created elsewhere at the user's request); if more than one program has cycles not
`done`, ask which. Then scan that program's cycles and act on the **highest row of
this table that any cycle matches** — an in-flight cycle always outranks
starting a new one:

| Highest cycle status found | Next action |
|---|---|
| `executing` | Reopen its workspace: `Artifacts` names the branch; find that branch's worktree and the plan's ledger at `.superpowers/sdd/<plan-basename>/progress.md` inside it, then resume with the executor skill the plan's header names. No worktree or ledger survives → the branch's `git log` is the record; resume at the first task without commits. |
| `in review` | Check the MR: merged → run Mode 2's merged transition, then re-enter this table; still open → report what the review is waiting on and stop. |
| `plan` | Invoke the executor skill the plan's header names, on the plan path in `Artifacts`. |
| `spec` | The spec awaits your human partner's review — ask for it; once approved, invoke superpowers:writing-plans with the plan's target path `<base_dir>/<n>-<cycle-slug>/<n>-<cycle-slug>-plan.md`. |
| only `not started` remain (with dependencies `done`) | Dispatch the next cycle (see Dispatching a Cycle). |
| everything `done` or externally gated | Report the program's end state and what gates the rest; nothing to dispatch. |

The file records transitions at commit time, but a session can die between
the work and the record: before resuming, glance at `git log` and branch
state for a transition the file missed — if one exists, fix the record first
(Mode 2), then resume.

## Mode 4 — Handoff

Invoked with `handoff` (also `finalize` / `checkpoint`), or by any ask to wrap up before
clearing. Context windows force sessions to end mid-program; this mode makes what the
session learned durable, so the next `/cycles continue` resumes cheaply.

**It reconciles records with facts. It never decides transitions.** Do not mark a cycle
`done`, or move any status, on your own judgment here. A branch merged while the cycle's
`Done when` is unmet is still in flight — report the discrepancy and ask. Guessing tells
everyone the work finished when it did not.

1. **Reconcile against git.** Commits since the cycles file was last touched; branch and
   merge state per cycle; spec/plan files in the cycle directories that no `Artifacts`
   line references; the SDD ledger of an `executing` cycle. Anything the records missed is
   a **missed Mode 2 update** — say so, so recurring drift is visible.
2. **Update the cycles file** for what is genuinely stale, in Mode 2's format. No new
   vocabulary, no summary block duplicating statuses.
3. **Update and republish the board**, passing the `**Board:**` URL as `url:`.
4. **Sweep for session-only state.** Anything load-bearing that lives only in the
   conversation or a scratchpad dies at the clear. A records-file reference to a path
   outside the repo is a dangling pointer: copy the file into `<base_dir>/`, or state
   plainly that it is expendable and why.
5. **Refresh the in-flight cycle's next-step block** — a short paragraph in its entry
   naming the branch, the immediate next action, anything deliberately deferred *and by
   whose decision*, and any warning the next session needs before acting. This block is
   what makes resume fast; the terminal summary in step 8 is not durable.
6. **Commit** the cycles file and the board together.
7. **Verify** the tree is clean and nothing is left unstaged.
8. **Report** what a fresh `/cycles continue` will land on, and why.

**This is a safety net, not the normal path.** Transitions still get recorded when they
happen (Mode 2). If handoff routinely finds drift, the in-the-moment discipline is what
needs fixing.

## The Status Board

Long-running programs need a glanceable answer to "where are we?" that a markdown
file doesn't give stakeholders. Every cycles file has a companion single-page HTML
board, committed at `<base_dir>/board.html` and published as a Claude artifact.

- **It is a view, never a record.** It renders the cycles file plus the executing
  cycle's SDD ledger; showing the executing cycle's task rows is presentation, not a
  second record — when board and records disagree, the records win and the board gets
  fixed.
- **One URL for its whole life.** The published address lives in the cycles file
  header as `**Board:** <url>`. Every republish passes it as `url:` — publishing
  without it forks a duplicate artifact and strands everyone holding the old link.
  Keep the artifact title and favicon stable across republishes.
- **Authoring:** load the artifact-design skill before writing or restyling it. At
  minimum it shows: the cycle rail with statuses, the executing cycle's task ledger,
  and pending work grouped by owner (you, the team, external parties).

## Rules

- **Brainstorming detects; this skill cuts.** Never decompose inside a brainstorm —
  two decomposers disagree with each other.
- **One cycles file per program, always flat.** A cycle that proves too large during
  its own brainstorm splits its entry in place (1 → 1a/1b). Never a second file, never
  nested. Depth is always 1.
- **One record per fact.** Blocking is read off `Depends on` plus the other cycles'
  statuses, never stored. Task progress is never copied in.
- **Everything for a program lives under `<base_dir>`.** Records, board, and every
  cycle's spec and plan. A spec or plan written to the single-cycle default paths is
  misplaced: move it into the cycle directory and fix `Artifacts`.
- **Always write in English**, including in projects whose permanent documentation is
  another language. Cycles files, specs and plans are transient working artifacts;
  domain nouns keep their original form.

## Red Flags — STOP

- "I'm already in the brainstorm, I'll just decompose it here"
- "This cycle is big enough to deserve its own cycles file"
- "The file is written and cycle 1 is obvious, I'll start it"
- "Adding task 3 of 9 would make the file more informative"
- "It's a little stale, I'll bring it up to date at the end"
- "The session is ending, but it's all in the transcript"
- "Brainstorming has its own default path, I'll let it save there"

In order: hand off · amend in place · stop · keep it coarse · update now · a transcript
is not a record · pass the cycle directory path explicitly — run Mode 4.

## Dispatching a Cycle

Take the first cycle whose dependencies read `done` and invoke
superpowers:brainstorming with that entry as the scope statement and the spec's
target path `<base_dir>/<n>-<cycle-slug>/<n>-<cycle-slug>-spec.md`. Its `Scope` /
`Out` / `Done when` pre-answer brainstorming's scope check: this is one cycle
because someone already cut it and wrote down where. When the spec is committed,
run Mode 2 (status → `spec`, path in `Artifacts`).

## Common Mistakes

| Mistake | Consequence |
|---|---|
| Session cleared without a handoff | Next session resumes from a stale file and redoes settled work |
| Handoff moved a status on its own judgment | The board announces a cycle finished when it has not |
| Status kept by hand in two places | One is wrong and you can't tell which |
| Board republished without `url:` | Duplicate artifact; stakeholders keep the stale link |
| Transition committed without the board refresh | The visible answer to "where are we?" is now wrong |
| Spec or plan saved to `docs/superpowers/specs/` or `plans/` | The program's work is scattered; resume can't find the cycle's files from its directory |
| Plans named bare `plan.md` in every cycle directory | Every cycle shares one SDD ledger and the executor resumes the wrong cycle's tasks |
| `Out` left empty | Cycle 1 quietly absorbs cycle 2 halfway through |
| `Surprises` skipped at merge | The next cycle inherits a surprise nobody recorded |
| Detail questions asked during Create | You design cycle 3 before building cycle 1 |
