# trek

A [Claude Code](https://claude.com/claude-code) skill for a program too large to finish
in one brainstorm → plan → execute → merge cycle.

A **trek** is one program walked in several cycles. The skill cuts the program into
cycles, keeps a record of where the trek stands, and walks each cycle through design,
plan and build: the design by the [Superpowers](https://github.com/obra/superpowers)
brainstorming skill, the plan and the build by the skill itself. It exists so that a
fresh session, weeks in, can read one short file and know what to do next.

## The problem it solves

A multi-cycle program produces knowledge that outlives any single cycle: the rules it
has decided, the facts it has measured about systems it does not own, the questions
still gating it. Without a place for that knowledge, it lands wherever is open — the
brainstorm's input document, a status file, a note — and those files grow until nobody
can afford to read them at the start of a session.

trek gives that knowledge a shape with two rules behind it:

- **The record holds current state; the log holds history.** `trek.md` is replaced in
  place and never appended to. `log.md` is appended to and never edited. Kept apart, a
  status change replaces the old status instead of stacking a new reason on top of it.
- **Only what outlives a cycle enters the record, and it enters as one line.** Cycle
  design stays in the cycle's own folder. A rule, a fact or an open question comes up
  as a numbered one-liner pointing back at the cycle that produced it.

## What a trek looks like

```
docs/treks/<topic>/
  trek.md                          current state: the cut, one entry per cycle,
                                   rules, facts, open questions
  log.md                           one dated line per event, newest first
  cycles/
    1-<slug>/
      1-<slug>-spec.md             the cycle's brainstorm output
      1-<slug>-plan.md             the cycle's plan and its ledger
      1-<slug>-findings.md         facts learned while working the cycle
    2-<slug>/
      ...
```

**`trek.md`** is the file a session reads first. Each cycle is an entry at the
resolution of the cut — goal, scope, out, dependencies, governing rules, unknowns,
done-when, artifacts, status — and nothing more: no task rows, no narrative. Below the
cycles sit the program's **rules** (`R1`, `R2`, …), **facts** (`F1`, …) and **open
questions** (`Q1`, …), one line each. Handles are permanent; specs cite them, and a
superseded item keeps its handle with a one-line pointer to what replaced it.

**`log.md`** answers "how did we get here?" without making the record carry it.

**The status mod** answers "where are we?" without a second record. The skill's folder
is also a Claude Code plugin: it reads the records of the checkout a session runs in and
draws a band above the prompt for the trek the checked-out branch belongs to (cycle track, lead cycle, ledger
progress, open questions), and `/trek-status` opens a pane with every cycle, the
executing cycle's ledger and the open questions. It draws from the files, so it cannot
disagree with them.

**The cycle folder** holds everything cycle-scoped. The findings file is created empty
at dispatch and named in every implementer brief, so a fact about a legacy database or
an external package has somewhere to go the moment it is found. At merge it is read,
and what outlives the cycle goes up to `trek.md` as one line pointing back.

**The plan** is about a page: a ledger table, then 3–5 coarse tasks, each a goal, the
files, the behaviours to test and a done-when. No code. The spec holds the decisions;
the implementer writes the code. The ledger table (task · status · commit · note) is
what resume reads and what the band shows.

## How it flows

| Mode | How it starts | What it does |
|---|---|---|
| **Start** | `/trek start` | A brainstorm at the altitude of the cut: asks boundary questions, presents candidate cuts, writes the trek folder. Stops without dispatching cycle 1. |
| **Dispatch** | Resume finds a cycle whose dependencies are done | Creates the cycle folder and runs the brainstorm; once the spec is approved, writes the short plan; once that is approved, builds it with one fresh implementer agent per task, then one final review agent over the whole branch. |
| **Update** | A cycle transitions, or a rule, fact or question changes | Replaces the record and appends the log, in the same commit as the work that caused it. At merge, promotes findings. When the last cycle closes, closes the program. |
| **Resume** | `/trek continue` | Reads `trek.md`, lands on the highest in-flight cycle, and picks up from there. |
| **Handoff** | `/trek handoff` | Before a session is cleared: reconciles the records against git, writes down what lived only in the conversation, refreshes the next-step note. Never moves a status on its own. |

Start, Resume and Handoff you type: begin, pick up, put down. Update fires when Claude
recognises a transition. Dispatch is what Resume does when the next cycle is ready. If
a plain brainstorm discovers mid-way that the scope is several cycles, it hands over to
Start; that is the safety net, not the way in.

**Update is the one that gets missed.** It has to fire mid-work, while Claude is busy
with the thing that caused the transition. Handoff exists to catch what Update let
slip. If it keeps finding drift, ask for the update at the moment of the transition.

## Walking a trek

1. `/trek start`. You describe the program. Claude asks boundary questions, presents
   candidate cuts, you pick one. Claude writes `docs/treks/<topic>/` and
   commits. Stops.
2. In a fresh session, `/trek continue`. Claude dispatches cycle 1: creates its folder,
   runs the brainstorm. Spec committed, record updated.
3. You approve the spec. Claude writes the short plan. Plan committed, record updated.
4. You approve the plan. Claude cuts the branch and dispatches one implementer agent per
   task, ticking the ledger after each. The main session reads
   reports, not diffs. Facts learned go to the cycle's findings file.
5. Context runs out mid-plan. `/trek handoff`. `/clear`. `/trek continue`. Claude lands
   on `executing` and resumes at the first ledger row not `done`.
6. All tasks done. One review agent reads the whole branch against the spec; you pick
   the fixes, one agent makes them. MR opened. Record updated: cycle 1 `in review`.
7. MR merged. In a fresh session, `/trek continue`. Claude sees the merge: cycle 1
   `done`, findings promoted to one-line facts in `trek.md`. Cycle 2's dependency is
   met, so it dispatches cycle 2. Back to step 3.
8. Last cycle merges. `/trek continue`. Program `closed`. Claude reports the rules and
   facts that outlive it, for the feature doc you write when the feature is stable.

Three things you ever type: `/trek start`, `/trek continue`, `/trek handoff`.

The `/trek handoff` → `/clear` → `/trek continue` sequence works at any point, not only
mid-plan. Whenever the session feels heavy, put the trek down and pick it up clean: the
records are what carry it, not the conversation.

## Where things live, and where they don't

- A trek lives under `docs/treks/`. A repository that needs a different root says so
  once in its CLAUDE.md (`Trek root: <path>`). The root is never chosen per program.
- A brainstorm may start from a written input. That input is not part of the trek: the
  spec names it as a source, and **nothing is written to it after the brainstorm
  consumed it.** New decisions go in `trek.md`.
- Trek files are transient working artifacts, written in English regardless of the
  project's documentation language. When the program closes, the skill reports the
  rules and facts that outlive it, as raw material for a permanent feature document in
  the project's own docs. It does not write that document.

## Install

```sh
git clone https://github.com/sandrods/trek-skill ~/.claude/skills/trek
```

Then `/trek start` to cut a program, `/trek continue` to pick one up in a fresh session,
`/trek handoff` before clearing a session.

Requires the [Superpowers](https://github.com/obra/superpowers) `brainstorming` skill,
and a Claude Code build with plugin function hooks for the status mod. Plans and
builds use no Superpowers skill: the briefs for the implementer and the final review are
in `templates/`.

## Where it came from

The skill was rebuilt after one full program run under its predecessor. The status file
had grown to 13,000 words, entry size tracked how often a cycle had been re-decided
rather than what it was, and the brainstorm's input document had become the only home
for a month of program-level decisions. Every rule above traces to one of those
measurements.
