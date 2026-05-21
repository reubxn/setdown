# workflow

how we ship the ux overhaul. keep it light.

## repo

- remote: https://github.com/reubxn/setdown.git
- default branch: `main`
- protected: yes (no direct pushes, pr required, ci must pass)

## branching

- one branch per track: `track/<id>-<slug>` (e.g. `track/1.5-overview`)
- branch off latest `main`
- rebase on `main` before opening pr if stale
- short-lived. merge or close within a few days.

## worktrees (required for parallel tracks)

multiple tabs on the same `/Users/reuba/strong` checkout collide — one tab switches the branch under another mid-build, stash entries mix, node_modules gets contaminated. always use a dedicated worktree per track:

```
cd /Users/reuba/strong
git worktree add ../strong-track-<id> -b track/<id>-<slug>
cd ../strong-track-<id>
npm install   # first time only; subsequent worktrees can `ln -s ../strong/node_modules .` if disk space matters
```

work in `../strong-track-<id>` for the entire track. when done and merged, clean up:

```
cd /Users/reuba/strong
git worktree remove ../strong-track-<id>
```

if you forget and end up with two tabs in `/Users/reuba/strong`, stop, `git stash`, create the worktree, then `git stash pop` inside it.

## commits

- author: you (reuban ramsden). **never** add `Co-Authored-By: Claude` or "generated with claude code" footers.
- style: lowercase, brief, present tense. example: `add dropzone component`, `wire convex auth`, `fix sidebar overflow on narrow widths`
- one logical change per commit where reasonable. squash on merge if a branch got noisy.
- no emojis.

## prs

- title: `track/<id>: <lowercase brief description>`
- body template:
  ```
  ## what
  one-line summary.

  ## why
  link to spec section if relevant.

  ## test
  - [ ] item
  - [ ] item
  ```
- author: you. no claude attribution.
- request review from yourself (single-maintainer repo) or just self-merge after ci passes.
- delete branch on merge.

## ci

minimal — just stop bad code reaching main. runs on every pr.

- typecheck (`tsc --noEmit`)
- lint (`next lint`)
- test (`vitest run`)
- build (`next build`)

**note: github actions is currently disabled on this repo (account flagged). until it's re-enabled, run all checks locally before pushing:**

```
npm run lint && npx tsc --noEmit && npm test && npm run build
```

do not push or open a pr until those four pass locally.

no deploy preview workflow needed — vercel handles that automatically per pr.

## release / deploy

- `main` auto-deploys to production via vercel.
- pr branches get a vercel preview url automatically.
- no manual release process.

## environment

required env vars (set in vercel + locally in `.env.local`):
- `CONVEX_DEPLOYMENT` — convex deployment name
- `NEXT_PUBLIC_CONVEX_URL` — convex public url
- `AUTH_GOOGLE_ID` — google oauth client id
- `AUTH_GOOGLE_SECRET` — google oauth client secret
- `ANTHROPIC_API_KEY` — server-side only

## coordination

- status board: [track_handoff.md](./TRACK_HANDOFF.md). update on start + finish.
- spec: [ux_overhaul_spec.md](./UX_OVERHAUL_SPEC.md). source of truth for scope.
- conflicts on shared files: 0.2 before 1.0 for `app/layout.tsx`. flag others in the handoff notes log.

## do not

- do not push directly to main
- do not add claude attribution to commits or prs
- do not delete deprecated components in phase 1 (only in track 2.1)
- do not edit files outside your track's owned list without flagging in handoff
- do not skip ci or merge red prs
