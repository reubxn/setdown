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
| 1.1 | design system components | wip | `track/1.1-design-system` | - | tab-b | needs 0.1 |
| 1.2 | landing page | pr | `track/1.2-landing` | [#9](https://github.com/reubxn/setdown/pull/9) | tab-1 | needs 0.1, 1.1, 1.4 (stub ok); dropzone stubbed inline in hero, 1.4 replaces |
| 1.3 | nav shell rebuild | todo | `track/1.3-nav-shell` | - | - | needs 0.1, 1.1 |
| 1.4 | upload flow rewrite | pr | `track/1.4-upload` | [#10](https://github.com/reubxn/setdown/pull/10) | tab-3 | needs 0.1, 1.1 |
| 1.5 | dashboard overview | pr | `track/1.5-overview` | [#18](https://github.com/reubxn/setdown/pull/18) | tab-1 | needs 0.1, 1.1, 1.3 |
| 1.6 | exercise pages | todo | `track/1.6-exercises` | - | - | needs 0.1, 1.1, 1.3 |
| 1.7 | history + session detail | todo | `track/1.7-history` | - | - | needs 0.1, 1.1, 1.3 |
| 1.9 | analytics (muscle/streak/body) | wip | `track/1.9-analytics` | - | tab-5 | needs 0.1, 1.1 |
| 1.10 | settings + data mgmt | pr | `track/1.10-settings` | [#14](https://github.com/reubxn/setdown/pull/14) | tab-6 | needs 0.1, 1.1, 1.4 |
| 2.1 | migrate old component usages | pr | `track/2.1-migrate` | [#21](https://github.com/reubxn/setdown/pull/21) | tab-1 | phase 2 |
| 2.2 | empty states everywhere | todo | `track/2.2-empty-states` | - | - | phase 2 |
| 2.3 | loading & error states | pr | `track/2.3-loading-errors` | [#25](https://github.com/reubxn/setdown/pull/25) | tab-1 | phase 2 |
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

- `app/layout.tsx` is shared. only one track should hold it at a time; claim it in the notes log first.
- `components/card.tsx` and other deprecated files: do not delete in phase 1, only in 2.1.
- if you need to edit a file not in your "owned" list, leave a note in the row and pick it up in pr review.

## notes / blockers log

append-only. one line each, datestamped.

- 2026-05-21: spec drafted, board initialized
- 2026-05-21: track 1.4 (tab-3) owns the indexeddb keys. 1.9 stores body measurements under its own key so a csv replace doesn't wipe them.
