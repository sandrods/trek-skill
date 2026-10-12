---
name: trek
description: Use when asked to start a program too large to finish in one brainstorm-plan-execute-merge cycle — e.g. `/trek start` — or when a brainstorm reports the scope needs decomposing before designing, when a cycle has transitioned (spec committed, plan committed, execution started, MR opened, merged, superseded) and the trek's record is now stale, when a fact about an external system was learned mid-cycle and needs a durable place, when asked to continue or resume a program in a fresh session — e.g. `/trek continue` — or when about to clear or end a session with a program still in flight — e.g. `/trek handoff`.
---

# Trek

## Overview

A **trek** is one program walked in several cycles of brainstorm → plan → execute →
MR → merge. This skill keeps the trek's records: what the cut is, what each cycle is
and excludes, what the program has decided and learned, and where it stands. The
records are read to dispatch the next cycle and to resume in a fresh session.

Two facts about the records govern everything below:

- **The record holds current state; the log holds history.** `trek.md` is replaced
  in place and is never appended to. `log.md` is appended to and never edited. Mixing
  the two in one file is how a pointer file grows to 13,000 words.
- **Only what outlives a cycle enters `trek.md`.** Cycle design lives in the cycle's
  own folder. A rule, a fact or an open question that later cycles must know comes up
  as one line pointing back at where it came from.

## When to Use

- Asked to start a program known to be multi-cycle (`/trek start`)
- A brainstorm concludes the scope exceeds one cycle — the safety net for a program
  nobody recognised up front
- A cycle transitioned and the records no longer reflect reality
- A fact about a system you do not own was learned while working a cycle
- Asked to continue or resume a program (`/trek continue`), typically in a fresh session
- About to clear or end a session with a program in flight (`/trek handoff`)

**Not for:** single-cycle work · task tracking within one plan · a roadmap of
unrelated features.

## Layout

Every trek lives in one folder under the trek root. The root is `docs/treks/` unless
the project's CLAUDE.md states a different one (`Trek root: <path>`). It is a property
of the repository, never chosen per program.

```
docs/treks/<topic>/
  trek.md                        current state — the record
  log.md                         history — append-only
  cycles/
    1-<cycle-slug>/              created at dispatch, one per cycle
      1-<cycle-slug>-spec.md     brainstorming's output
      1-<cycle-slug>-plan.md     the plan, with the ledger table
      1-<cycle-slug>-findings.md facts learned while working the cycle
    2-<cycle-slug>/
```

- The record's own location is the trek folder, so paths inside it are relative to it:
  a cycle's spec is `cycles/1-<slug>/1-<slug>-spec.md`.
- Files inside a cycle folder carry the folder's name as a prefix, so a path names
  its cycle on its own.
- A cycle that splits gets `1a-<slug>/` and `1b-<slug>/`. Numbers are handles and
  are never reused or renumbered; a superseded cycle keeps its number and its folder.
- Brainstorming has its own default path for single-cycle work. When dispatching it
  for a cycle, hand it the exact target path.
- A brainstorm may start from a written input. The input is not part of the trek: it
  lives wherever it was written, the spec names it under its sources, and **nothing is
  ever written to it after the brainstorm consumed it.** An input outside the repo or
  in a gitignored path is copied into the trek folder first, so the citation resolves.

## `trek.md` — the record

Filled from `templates/trek.md`. Sections are fixed: header · why this cut · cycles ·
rules · facts · open questions. No maintenance instructions inside the file; this
skill holds them.

- **Header:** program status (`open` · `closed`), start date, sources.
- **Why this cut:** 2–4 sentences on these boundaries and the alternatives rejected.
- **One entry per cycle, at cut resolution.** Status in the heading. Fields: goal in
  one sentence, scope, out, depends on, governing rules by handle, unknowns, done
  when, artifacts (cycle folder · branch · MR). An in-flight cycle may carry a `Next`
  paragraph — branch, immediate next action, what was deferred and by whose decision —
  which is removed at merge. Nothing else: no task rows, no narrative, no findings.
- **Rules, facts, open questions.** One line each, with a handle (`R1`, `F1`, `Q1`)
  and the cycle that produced it. A fact carries the date it was measured. An open
  question names its owner. Specs cite these by handle.
- **Statuses:** `not started` · `spec` · `plan` · `executing` · `in review` · `done`
  · `superseded`. A status carries one sentence of why only when it surprises;
  `superseded` always does, since without it a reader takes it for a mistake.
  `superseded` is terminal and means the premise was invalidated, not that the work
  failed. It never blocks anything; cycles that depended on it get their `Depends on`
  re-cut, and that amendment is a log event.
- **Replace, never append.** A status change replaces the old status and its why. A
  superseded rule keeps its handle and its body becomes one line: what superseded it,
  when, and where the old text lives. The specimen this skill was rebuilt from grew
  600-word cycle entries because every status change appended its reason.
- **Blocking is not a status.** Read it off `Depends on` plus the other cycles'
  statuses. Task progress is never copied in; it lives in the plan's ledger.

## `log.md` — the history

One line per event, newest first, from `templates/log.md`:
`<date> · <what moved, from what to what> · <where the reason lives>`.

Events: a status transition, a rule/fact/question added or superseded, a cut
amendment (split, re-cut dependency), a re-brainstorm, program close. A findings
entry is not an event; its promotion at merge is. Never edited retroactively; a wrong
line gets a correcting line above it. Always written in the same commit as the
`trek.md` change it records. The date is the date the line is written: a transition
recorded late says so in the line ("missed update, caught at handoff") rather than
carrying an invented earlier date.

## The status mod — the view

The question "where are we?" is answered by a Claude Code mod that ships in this
skill's folder (`.claude-plugin/`, `hooks/`) and draws from the records on disk of the
checkout the session runs in: a band above the prompt for each open trek, and
`/trek-status` for a pane with every cycle, the executing cycle's ledger and the open
questions. There is nothing to publish or refresh: keeping the records current is
keeping the view current.

It parses these shapes, so they are kept exact:

- the header's `**Status:** <open|closed>`;
- cycle headings ``### <n>. <name> — `<status>` ``;
- `- **Q<n>** (<owner>) — …` lines under `## Open questions` (a line whose text starts
  `answered`, `closed`, `resolved` or `superseded` counts as closed);
- the executing cycle's plan at `cycles/<n>-<slug>/<n>-<slug>-plan.md` (or the `plan`
  path its `Artifacts` names when it has no folder), its table under `## Ledger`.

## `cycles/<n>-<slug>/` — the cycle folder

Cycle-scoped content never leaves it.

- **Spec.** Names its sources, including any written input. Cites governing rules by
  `trek.md` handle. Frozen once approved. A re-brainstorm replaces it; git keeps the
  old one and `log.md` records the event.
- **Plan.** Filled from `templates/plan.md`: a ledger table, then 3–5 coarse tasks,
  each a goal, the files, the behaviours to test and a done-when — no code, no test
  bodies, no steps. About a page. The tasks are frozen once approved; only the ledger
  table changes after that, and only the main session writes it.
- **Findings.** Created at dispatch from `templates/findings.md`, so the file exists
  before anyone has something to put in it. Holds facts about systems the project does
  not own — a legacy database's real shape, what a package actually does, a count that
  was expensive to obtain — at any stage, at any length, dated and appended. Every
  implementer brief names this file as the destination for such facts:
  a fact left in a subagent's report is lost when the report is. It is read at merge.
  A gotcha about the project's own code is not a finding; it belongs in the project's
  documentation or in a fix.

## Mode 1 — Start

Invoked with `start` (also `new` / `create`), or when a brainstorm's scope check finds
several cycles where one was expected. It is a brainstorm at the altitude of the cut:
it understands the problem just enough to cut it, and stops there.

1. **Read the sources** — the request, any written input, the repo. Copy an
   out-of-repo or gitignored input into the trek folder.
2. **Ask boundary questions, one at a time.** In, out, what blocks what. Every field
   in `templates/trek.md` is answerable without knowing how anything gets built — a
   question needing implementation detail belongs to that cycle's own brainstorm.
3. **Present 2–3 candidate cuts** with trade-offs and a recommendation. Where you cut
   is a design decision; get approval before writing.
4. **Write `trek.md`** from the template, status `open`, and **`log.md`** with its
   first line, the cut.
5. **Commit** the folder.
6. **STOP.** Do not dispatch cycle 1. Starting a cycle is a separate decision and a
   separate brainstorm.

## Dispatching a Cycle

Take the first cycle whose dependencies all read `done`. Superpowers is used for the
brainstorm only; the plan and the build follow this section.

1. Create `cycles/<n>-<slug>/` with `<n>-<slug>-findings.md` from the template.
2. Invoke superpowers:brainstorming with the entry as the scope statement, the spec's
   target path, the rules and facts it lists as governing, and the findings file as
   the destination for facts learned. Its `Scope` / `Out` / `Done when` pre-answer
   brainstorming's scope check: this is one cycle because someone already cut it.
   Brainstorming ends by offering writing-plans; do not invoke it — step 4 replaces it.
3. When the spec is committed, run Mode 2 (status → `spec`).
4. **Plan.** Once the spec is approved, write `<n>-<slug>-plan.md` yourself from
   `templates/plan.md`. Commit it, run Mode 2 (status → `plan`), and ask your human
   partner to approve it.
5. **Build.** Once the plan is approved, cut the branch from the trek line (in a
   worktree), run Mode 2 (→ `executing`), and work the ledger top to bottom:
   - Dispatch **one fresh implementer agent per task**, briefed from
     `templates/implementer-brief.md` (sonnet unless the project says otherwise).
     Never implement a task in the main session: keeping its context light is the
     point of dispatching.
   - Read the report and the commit's file list — not the diff. A deviation that
     contradicts the spec, or a `BLOCKED`, stops the build: bring it to your human
     partner.
   - In one commit, set the finished row to `done` with its commit and any reported
     deviation in its note, and the next row to `running`. Then dispatch the next
     implementer. Never commit while an implementer is working in the same
     worktree: the two commits collide.
6. **Final review.** When every task row is `done`, dispatch one review agent briefed
   from `templates/final-review-brief.md` (opus) over the whole branch. Bring its
   findings to your human partner; the fixes they accept go to one implementer agent,
   briefed with those findings, and are recorded in the review row's note. Then set
   the review row to `done`.
7. MR or merge as the project does it: Mode 2 at MR (→ `in review`) and at merge
   (→ `done`).

There is no review agent per task. A wrong turn early in the plan is caught by the
implementer's own tests, by your reading of each report, and finally by the review.

## Mode 2 — Update

Invoked at a transition. `trek.md` and `log.md` move together, **in the same
commit as the work that caused the transition**, never separately.

| Moment | `trek.md` | `log.md` |
|---|---|---|
| spec / plan committed | status; folder in `Artifacts` | one line |
| execution started · MR opened | status; branch / MR in `Artifacts` | one line |
| merged | status → `done`; remove `Next`; **read the findings file and promote** what outlives the cycle: each fact or rule as one line under Facts or Rules, pointing at the cycle; replace each `Unknowns` item the cycle answered with the handle that answers it | one line per transition and per item promoted |
| cycle superseded | status → `superseded` + why; re-cut dependents' `Depends on` | one line per change |
| rule / fact / question added or superseded outside a merge | the line, or the handle's body replaced with its pointer | one line |
| last cycle `done` or `superseded` | program status → `closed` | one line |


**On close**, report — do not write — the rules and facts in `trek.md` that outlive
the program. They are the raw material for a permanent feature document in the
project's own documentation and language. Writing that document is a separate act,
done when your human partner judges the feature stable; when it exists, record its
path in the header. The trek folder stays as the archive. Nothing is deleted.

## Mode 3 — Resume

Invoked with `continue` (also `resume` / `retomar`, or any ask to pick a program back
up in a fresh session). List the trek root; if more than one trek is `open`, ask
which. Read that trek's `trek.md` — only `trek.md`; open a cycle folder only for the
cycle you land on. Act on the **highest row of this table that any cycle matches** —
an in-flight cycle always outranks starting a new one:

| Highest cycle status found | Next action |
|---|---|
| `executing` | `Artifacts` names the branch; find its worktree and read the plan's ledger. A `running` row means a session died mid-task: check the branch's `git log` for its commit and fix the row first. Resume Dispatching step 5 at the first row not `done` (step 6 if only the review remains). |
| `in review` | Check the MR: merged → run Mode 2's merged transition, then re-enter this table; still open → report what the review waits on and stop. |
| `plan` | The plan awaits approval — ask for it; once approved, continue Dispatching from step 5. |
| `spec` | The spec awaits your human partner's review — ask for it; once approved, continue Dispatching from step 4. |
| only `not started` remain, dependencies `done` | Dispatch the next cycle. |
| everything `done`, `superseded` or externally gated | Report the end state and what gates the rest; nothing to dispatch. |

A session can die between the work and the record: before resuming, glance at `git
log` and branch state for a transition the record missed — if one exists, fix the
record first (Mode 2), then resume.

## Mode 4 — Handoff

Invoked with `handoff` (also `finalize` / `checkpoint`), or by any ask to wrap up
before clearing. It makes what the session learned durable, so the next
`/trek continue` resumes cheaply.

**It reconciles records with facts. It never decides transitions.** Do not move a
status on your own judgment. A branch merged while the cycle's `Done when` is unmet
is still in flight — report the discrepancy and ask.

1. **Reconcile against git.** Commits since `trek.md` was last touched; branch and
   merge state per cycle; files in cycle folders that `Artifacts` does not name; the
   executing cycle's ledger against the branch's commits. Anything missed is a
   **missed Mode 2 update** — say so.
2. **Update `trek.md` and `log.md`** for what is genuinely stale, in Mode 2's format.
3. **Sweep for session-only state.** A fact that lives only in the conversation goes
   to the in-flight cycle's findings file. A pointer to a path outside the repo is
   dangling: copy the file into the trek folder, or state plainly why it is expendable.
4. **Refresh the in-flight cycle's `Next` paragraph.** This is what makes resume
   fast; the terminal summary in step 6 is not durable.
5. **Commit** the trek folder. **Verify** the tree is clean.
6. **Report** what a fresh `/trek continue` will land on, and why.

This is a safety net. Transitions are recorded when they happen (Mode 2); if handoff
routinely finds drift, the in-the-moment discipline is what needs fixing.

## Rules

- **Brainstorming detects; this skill cuts.** Never decompose inside a brainstorm.
- **One trek per program, always flat.** A cycle too large for its own brainstorm
  splits its entry in place. Never a second `trek.md`, never nested. Depth is 1.
- **`trek.md` is replaced, `log.md` is appended.** No section of the record is
  append-only; no line of the log is ever edited.
- **Only what outlives a cycle enters `trek.md`**, and it enters as one line pointing
  at its cycle. The long version stays in the cycle folder.
- **Handles are permanent.** Cycle numbers and `R`/`F`/`Q` handles are never reused,
  renumbered or removed. Superseded keeps the handle and shrinks the body.
- **A consumed input is frozen.**
- **Always write in English**, including in projects whose permanent documentation is
  another language. Trek files are transient working artifacts; domain nouns keep
  their original form.

## Red Flags — STOP

- "I'm already in the brainstorm, I'll just decompose it here"
- "This cycle deserves its own record file"
- "The record is written and cycle 1 is obvious, I'll start it"
- "Adding the task rows would make `trek.md` more informative"
- "I'll note the new reason under the old status so nothing is lost"
- "This finding is worth a paragraph in `trek.md`"
- "I'll put the fact in my report; the orchestrator will pick it up"
- "This task is small, I'll implement it here instead of dispatching"
- "The plan would be clearer with the code written out"
- "The cycle is superseded, I'll remove the entry to keep the file clean"
- "Brainstorming has its own default path, I'll let it save there"
- "The input doc is the natural place for this new decision"
- "It's a little stale, I'll bring it up to date at the end"
- "The session is ending, but it's all in the transcript"

In order: hand off to this skill · split in place · stop · keep it coarse · replace ·
one line, pointer to the findings file · write the findings file · dispatch it ·
the spec holds the decisions, the implementer the code · keep the handle ·
pass the target path · the input is frozen, this goes in `trek.md` · update now · a
transcript is not a record, run Mode 4.

## Common Mistakes

| Mistake | Consequence |
|---|---|
| Session cleared without a handoff | Next session resumes from stale records and redoes settled work |
| Handoff moved a status on its own judgment | The record announces a cycle finished when it has not |
| Reason appended under a status instead of replacing it | Entry size tracks how often the cycle was re-decided, not what it is |
| Cycle design written into `trek.md` | A pointer file nobody can afford to read on resume |
| New decisions written into the brainstorm input | A frozen source becomes the only place the rules live, and rots |
| Fact left in an implementer's report | Lost when the report is; the next cycle pays to rediscover it |
| Plan written with code and test bodies | The plan becomes the build, costs more context than the build, and freezes choices the implementer should make |
| Ledger row not updated after a task | Resume redoes a finished task, and the band shows the wrong progress |
| Superseded cycle removed from the record | Numbers stop being handles; every citation of it dangles |
| `superseded` without its why sentence | Reads as a mistake |
| Transition committed without `log.md` | History has a hole |
| Spec or plan saved to the single-cycle default paths | The trek's work is scattered; resume cannot find the cycle's files |
| Bare `plan.md` in every cycle folder | Paths stop naming their cycle, and the mod cannot find the ledger |
| `Out` left empty | Cycle 1 quietly absorbs cycle 2 halfway through |
| Detail questions asked during Start | You design cycle 3 before building cycle 1 |
