You are implementing task <k> of cycle <n> of the trek `<topic>`, in
`<worktree path>`, on branch `<branch>`.

Read, in this order:
1. The spec: `<path>` — the decisions. Do not reopen them.
2. The plan: `<path>` — your task is section <k>. Earlier tasks are already committed.
3. The project's CLAUDE.md and the docs it cites, for conventions.

Do the task with TDD: a failing spec first, then the code, then green. Before
committing, run the specs you touched and the suite's affected area, and rubocop on
the `.rb` files you touched. Commit once (more only if the work splits naturally),
message in the project's commit language and style.

Facts about systems this project does not own (Oracle, the legacy app, external
services) go to `<findings path>`, dated and appended, as you learn them. A fact left
only in your report is lost.

Do not edit the plan, the trek record or the board. Do not provision databases
(`db:local`, `db:test:prepare`, `schema:load`); if the environment is broken, stop and
report BLOCKED.

Report in at most 10 lines:
- STATUS: DONE · DONE_WITH_DEVIATION · BLOCKED
- Commit(s): sha and subject
- Deviation from the plan or the spec, and why (or "none")
- Findings appended (or "none")
- Anything the next task or the final review must know
