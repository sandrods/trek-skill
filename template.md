# Cycles — <program>

**Decomposed on:** <date> · **Sources:** <documents governing this program>
**Board:** <artifact URL — every republish of `<topic>-board.html` passes this as `url:`>

## Why this cut

<Why these boundaries and not others, in 2–4 sentences. Name the alternatives that
were considered and what each one traded away. This is the field that answers, three
weeks later, "why is reading separate from deciding?".>

## Maintaining this file

Update **at the moment of the transition**, in the same commit that caused it:

| Moment | Cycles file | Status board |
|---|---|---|
| spec committed | path in `Artifacts` · status → `spec` | refresh + republish to `Board` URL |
| plan committed | path in `Artifacts` · status → `plan` | refresh + republish to `Board` URL |
| execution started | status → `executing` | refresh + republish to `Board` URL |
| MR opened | number in `Artifacts` · status → `in review` | refresh + republish to `Board` URL |
| merged | status → `done` + fill in `Surprises` | refresh + republish to `Board` URL |

The board (`<topic>-board.html`, same directory) travels in the same commit as the
cycles-file update. It is a view over this file plus the executing cycle's SDD
ledger — when they disagree, this file wins.

Statuses: `not started` · `spec` · `plan` · `executing` · `in review` · `done`.

Blocking is **not a status** — read it off `Depends on` plus the other cycles'
statuses, so that only one record of the fact exists. Task progress does not belong
here; it lives in `.superpowers/sdd/<plan>/progress.md`. This file's resolution is the
cycle.

If a cycle turns out to be too large during its own brainstorm, split the entry right
here (1 → 1a/1b). Never create a second cycles file.

---

## 1. <name> — `not started`

**Goal:** <what changes in the world once this cycle is done — one sentence>

**Scope:** <what is in>

**Out:** <what is explicitly excluded — this is the field that stops the cycle from
swallowing the next one halfway through>

**Depends on:** <which cycles, and what specifically is needed from each>

**Governing decisions:** <pointers into the decisions doc — e.g. decisions 3, 5, 10>

**Unknowns to resolve inside the cycle:** <what is still unknown, including anything
waiting on third parties>

**Done when:** <the verification story: how you demonstrate this cycle is finished>

**Artifacts:** spec — · plan — · branch — · MR —

**Surprises:** <filled in at merge: what came out different from what was predicted,
and what the next cycle inherits because of it>

## 2. <name> — `not started`

<Same fields. Later cycles are written with far less knowledge and will be coarser —
that is expected, and the entry gets sharpened when it is dispatched rather than now.
But `Out` and `Governing decisions` are worth writing today: they are what keeps the
preceding cycle inside its boundaries.>
