# cycles

A [Claude Code](https://claude.com/claude-code) skill for running a program that is
too large to finish in one brainstorm → plan → execute → merge cycle.

It maintains **one file** per program holding the cut: what each cycle is, what it
excludes, what governs it, and how far it got — plus a companion HTML status board
published as an artifact. Its resolution is the *cycle*, never the task; task
progress stays where it already lives.

## Modes

| Invocation | What it does |
|---|---|
| (create) | Cuts a program into cycles and writes `docs/superpowers/cycles/<topic>.md` + its board |
| (update) | Records a transition — spec, plan, executing, in review, merged — in file and board together |
| `/cycles continue` | Resumes a program in a fresh session, landing on the highest in-flight cycle |
| `/cycles handoff` | Reconciles records against git before a session is cleared |

## Install

```sh
git clone https://github.com/sandrods/cycles-skill ~/.claude/skills/cycles
```

Then ask Claude to use the `cycles` skill, or invoke it as `/cycles`.

It expects the [Superpowers](https://github.com/obra/superpowers) skills
(`brainstorming`, `writing-plans`, the executor skills) to be available, and uses
the `artifact-design` skill when authoring the status board.
