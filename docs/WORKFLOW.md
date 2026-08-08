# workflow

how i ship changes to setdown. keep it light.

## repo

- remote: https://github.com/reubxn/setdown.git
- default branch: `main`
- protected: yes (no direct pushes, pr required, ci must pass)

## branching

- one branch per change: `<type>/<slug>`, e.g. `fix/upload-weight-ceiling`, `chore/tidy-docs`, `feat/export-tutorial-modal`
- branch off latest `main`
- rebase on `main` before opening a pr if stale
- short-lived. merge or close within a few days.

## commits

- style: lowercase, brief, present tense. example: `add dropzone component`, `wire indexeddb persistence`, `fix sidebar overflow on narrow widths`
- one logical change per commit where reasonable. squash on merge if a branch got noisy.
- no emojis.

## prs

- title: lowercase, brief. prefix with `fix:` / `docs:` / `chore:` when it helps.
- body template:
  ```
  ## what
  one-line summary.

  ## why
  the reasoning, not a restatement of the diff.

  ## test
  - [ ] item
  - [ ] item
  ```
- single-maintainer repo, so self-merge once ci passes.
- delete branch on merge.

## ci

minimal. just stop bad code reaching main. runs on every pr.

- typecheck (`tsc --noEmit`)
- lint (`next lint`)
- test (`vitest run`)
- build (`next build`)

**note: github actions is currently disabled on this repo (account flagged). until it's re-enabled, run all checks locally before pushing:**

```
npm run lint && npx tsc --noEmit && npm test && npm run build
```

do not push or open a pr until those four pass locally.

no deploy preview workflow needed. vercel handles that automatically per pr.

## release / deploy

- `main` auto-deploys to production via vercel.
- pr branches get a vercel preview url automatically.
- no manual release process.

## environment

none. the app has no backend and no secrets, so `npm install && npm run dev` is the whole setup. same in vercel: no env vars to configure.

## do not

- do not push directly to main
- do not skip ci or merge red prs
