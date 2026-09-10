# trek

A [Claude Code](https://claude.com/claude-code) skill for a program too large to
finish in one brainstorm → plan → execute → merge cycle. A **trek** is one program
walked in several cycles.

It keeps one folder per program: a current-state record (`trek.md`), an append-only
history (`log.md`), a published status board, and a `cycles/` folder with one subfolder per cycle holding that
cycle's spec, plan and findings. The record's resolution is the cycle; what a cycle
decides or learns that later cycles must know comes up as one line, and everything
else stays in the cycle's folder.

## Modes

Three of the five you invoke; the other two fire when Claude recognises the situation
from the skill's description.

| Mode | Triggered by | What it does |
|---|---|---|
| Create | **Recognised** — a brainstorm concludes the scope exceeds one cycle, or you say up front that it does | Cuts the program into cycles, writes `docs/treks/<topic>/`, publishes the board, then stops without dispatching cycle 1 |
| Dispatch | Resume lands on a cycle whose dependencies are done | Creates the cycle folder and hands brainstorming, then writing-plans, then the executor their target paths |
| Update | **Recognised** — a cycle transitioned, or a rule, fact or open question changed | Replaces the record, appends the log, republishes the board, in the same commit as the work |
| Resume | `/trek continue` (also `resume`) | Picks the program back up in a fresh session, landing on the highest in-flight cycle |
| Handoff | `/trek handoff` (also `finalize`, `checkpoint`) | Reconciles the records against git before a session is cleared |

**Update is the one that gets missed.** It has to fire mid-work, while Claude is
occupied with the work that caused the transition. Handoff exists to catch what
Update let slip; if it keeps finding drift, ask for the update at the moment of the
transition.

## Install

```sh
git clone https://github.com/sandrods/trek-skill ~/.claude/skills/trek
```

Then ask Claude to use the `trek` skill, or invoke it as `/trek`.

It expects the [Superpowers](https://github.com/obra/superpowers) skills
(`brainstorming`, `writing-plans`, the executor skills) to be available, and uses
the `artifact-design` skill when authoring the status board.
