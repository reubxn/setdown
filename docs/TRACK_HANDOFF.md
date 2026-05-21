# track handoff

shared status board for the ux overhaul. every agent reads + updates this when starting and finishing a track. keep entries terse, lowercase, casual.

repo: https://github.com/reubxn/setdown.git
spec: [ux_overhaul_spec.md](./UX_OVERHAUL_SPEC.md)
workflow: [workflow.md](./WORKFLOW.md)

## status legend

- `todo` — not started
- `wip` — agent actively working, branch open
- `pr` — branch pushed, pr open, awaiting review/ci
- `done` — merged to main
- `blocked` — waiting on another track (note which)

## board

| track | name | status | branch | pr | agent | notes |
|---|---|---|---|---|---|---|
| 0.1 | design tokens & primitives | done | `track/0.1-design-tokens` | [#3](https://github.com/reubxn/setdown/pull/3) | tab-a | merged |
| 0.2 | convex setup & schema | done | `track/0.2-convex-setup` | [#4](https://github.com/reubxn/setdown/pull/4) | tab-b | merged |
| 1.0 | auth context & login | pr | `track/1.0-auth` | [#6](https://github.com/reubxn/setdown/pull/6) | tab-a | edits `convex/schema.ts` (0.2-owned) to align users with authTables — see notes |
| 1.1 | design system components | wip | `track/1.1-design-system` | - | tab-b | needs 0.1 |
| 1.2 | landing page | wip | `track/1.2-landing` | - | tab-1 | needs 0.1, 1.1, 1.4 (stub ok) |
| 1.3 | nav shell rebuild | pr | `track/1.3-nav-shell` | [#11](https://github.com/reubxn/setdown/pull/11) | tab-2 | needs 0.1, 1.1, 1.0 |
| 1.4 | upload flow rewrite | todo | `track/1.4-upload` | - | - | needs 0.1, 1.1, 0.2 |
| 1.5 | dashboard overview | todo | `track/1.5-overview` | - | - | needs 0.1, 1.1, 1.3 |
| 1.6 | exercise pages | todo | `track/1.6-exercises` | - | - | needs 0.1, 1.1, 1.3 |
| 1.7 | history + session detail | todo | `track/1.7-history` | - | - | needs 0.1, 1.1, 1.3 |
| 1.8 | ai subsystem | todo | `track/1.8-ai` | - | - | needs 0.2, 1.0, 1.1 |
| 1.9 | analytics (muscle/streak/body) | todo | `track/1.9-analytics` | - | - | needs 0.1, 1.1, 0.2 |
| 1.10 | settings + data mgmt | wip | `track/1.10-settings` | - | tab-6 | needs 0.1, 1.1, 0.2, 1.4 |
| 2.1 | migrate old component usages | todo | `track/2.1-migrate-usages` | - | - | phase 2 |
| 2.2 | empty states everywhere | todo | `track/2.2-empty-states` | - | - | phase 2 |
| 2.3 | loading & error states | todo | `track/2.3-loading-errors` | - | - | phase 2 |
| 2.4 | a11y audit | todo | `track/2.4-a11y` | - | - | phase 2 |
| 2.5 | perf pass | todo | `track/2.5-perf` | - | - | phase 2 |
| 2.6 | telemetry | todo | `track/2.6-telemetry` | - | - | phase 2, optional |

## on starting a track

1. pull main, branch off it: `git checkout main && git pull && git checkout -b track/<id>-<slug>`
2. update the row above: status → `wip`, branch filled, agent = your tab handle (e.g. `tab-3`)
3. read the spec section for your track + any dependency track's merged code
4. work

## on finishing a track

1. push branch, open pr titled `track/<id>: <one-line description>` (lowercase)
2. update row: status → `pr`, pr link filled
3. on merge: status → `done`. delete branch.

## conflicts / shared files

- `app/layout.tsx` is touched by 0.2 (ConvexProvider) and 1.0 (AuthProvider). 0.2 must merge before 1.0 opens its pr.
- `components/card.tsx` and other deprecated files: do not delete in phase 1, only in 2.1.
- if you need to edit a file not in your "owned" list, leave a note in the row and pick it up in pr review.

## notes / blockers log

append-only. one line each, datestamped.

- 2026-05-21: spec drafted, board initialized
- 2026-05-21: track 1.0 (tab-a) reshapes `convex/schema.ts` users table to extend `authTables.users` (was overriding it, breaking auth). flagged on pr #6 for 0.2 review.
