# Cycle <n> — <name> — plan

**Spec:** `<n>-<slug>-spec.md` · **Branch:** `treks/<topic>/<n>-<slug>`, cut from `treks/<topic>/main` at `<sha>`
**Findings:** `<n>-<slug>-findings.md`

<One or two sentences: the order of the tasks and why. Nothing the spec already says.>

## Ledger

| # | Task | Status | Commit | Note |
|---|---|---|---|---|
| 1 | <task name> | pending | — | |
| 2 | <task name> | pending | — | |
| R | Final review | pending | — | |

Statuses: `pending` · `running` · `done` · `blocked`. The note holds one clause: a
deviation the implementer reported, a fix that went back, why a task is blocked.

## Tasks

### 1. <task name>

**Goal:** <what exists or works after this task, in one sentence>

**Files:** <the files it creates or changes — paths, not code>

**Tests:** <the behaviours to prove, one line each; the implementer writes them>

**Done when:** <the observable condition; always includes the suite green and rubocop
clean on the touched `.rb` files>

### 2. <task name>

<Same fields. No code, no test bodies, no step-by-step instructions: the spec carries
the decisions, the implementer carries the craft. A task that needs a paragraph of
explanation is a decision the spec is missing — fix the spec.>
