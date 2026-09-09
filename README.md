# cycles

A [Claude Code](https://claude.com/claude-code) skill for running a program that is
too large to finish in one brainstorm → plan → execute → merge cycle.

It maintains **one file** per program holding the cut: what each cycle is, what it
excludes, what governs it, and how far it got — plus a companion HTML status board
published as an artifact. Its resolution is the *cycle*, never the task; task
progress stays where it already lives.

## Modes

Two of the four modes you invoke; the other two fire when Claude recognises the
situation from the skill's description. There is no command to type for those.

| Mode | Triggered by | What it does |
|---|---|---|
| Create | **Recognised** — a brainstorm concludes the scope exceeds one cycle, or you say up front that it does | Cuts the program into cycles, writes `docs/superpowers/cycles/<topic>.md` and its board, then stops without dispatching cycle 1 |
| Update | **Recognised** — a cycle just transitioned (spec committed, plan committed, MR opened, merged) and the records are now stale | Writes the transition into the cycles file and the board, in the same commit as the work that caused it |
| Resume | `/cycles continue` (also `resume`) | Picks a program back up in a fresh session, landing on the highest in-flight cycle |
| Handoff | `/cycles handoff` (also `finalize`, `checkpoint`) | Reconciles the records against git before a session is cleared |

**Update is the one that gets missed.** It has to fire mid-work — right after the
commit or the MR that caused the transition — while Claude is occupied with that
work, and nothing forces it. So records drift. That is what Handoff exists for: run
`/cycles handoff` before clearing a session and it reconciles whatever Update let
slip. If handoff keeps finding drift, ask for the update explicitly at the moment the
transition happens.

## Install

```sh
git clone https://github.com/sandrods/cycles-skill ~/.claude/skills/cycles
```

Then ask Claude to use the `cycles` skill, or invoke it as `/cycles`.

It expects the [Superpowers](https://github.com/obra/superpowers) skills
(`brainstorming`, `writing-plans`, the executor skills) to be available, and uses
the `artifact-design` skill when authoring the status board.
