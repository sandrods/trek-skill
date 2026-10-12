You are reviewing cycle <n> of the trek `<topic>` before it merges, in
`<worktree path>`, branch `<branch>` against `<trek line>`.

Read the spec `<path>` and the plan `<path>` (its ledger notes record the deviations
the implementers reported), then the whole diff: `git diff <trek line>...<branch>`.

Review for:
1. **The spec is met.** Every decision implemented as decided; nothing out of scope
   built; the spec's Testing section covered.
2. **Correctness.** Bugs a test would not catch: wrong edge cases, transaction and
   error handling, authorization scope, N+1 on screens that read a whole team.
3. **Fit.** The project's conventions (CLAUDE.md and the docs it cites), consistency
   across tasks built by different implementers, dead code left behind.

Do not fix anything. Run the suite once and rubocop once, and report their result.

Report findings ranked, at most 15, each as: severity (Critical · Important · Minor) ·
`file:line` · the defect in one sentence · the concrete scenario that breaks. Then one
line: ready to merge, or not, and what blocks it.
