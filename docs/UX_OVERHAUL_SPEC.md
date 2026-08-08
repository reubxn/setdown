# setdown — UX Overhaul Spec (v2)

**Status:** Ready for parallel implementation
**Date:** 2026-05-21
**Approach:** Component-by-component replacement (design system first, then swap usages)
**Stack additions:** container queries

---

## How to use this spec

This document is split into **tracks**. Each track is a self-contained work unit that one agent can pick up.

- **Phase 0** must complete first (foundation work — design tokens). It is not parallelizable.
- **Phase 1** tracks can run **fully in parallel**. Each track lists its dependencies, files it owns, and acceptance criteria.
- **Phase 2** integrates the tracks into pages and is sequential per page but pages can be parallelized.

**Agent invocation pattern:** Open a new agent tab, paste the track section (e.g. "Do Track 1.3" plus the contents of that section). The agent has everything needed.

**Ownership rules:**
- A track **owns** the files listed under "Files owned." No other track may edit those files.
- A track may **read** any file but only edit files it owns or files explicitly marked "shared — coordinate."
- New shared utilities go in `lib/` and must be created in Phase 0 if multiple tracks need them.

---

## Product principles (read first)

1. **Local-only is the whole product.** No accounts, no backend, no nag walls. The CSV is parsed in the browser and everything derives from IndexedDB.
2. **Nothing is gated.** Every chart, metric and page works the moment a file is dropped.
3. **Desktop and mobile are equals.** Stop being mobile-first. Use container queries so components adapt to their slot, not the viewport.
4. **Match Strong Premium's analytics for free.** That's the wedge.
5. **Visual identity:** Dark base + bold green accent (Linear/Vercel style). Accent used in CTAs, active chart series, key numbers — never decorative.

---

## Phase 0 — Foundation (BLOCKING, do first, single agent)

### Track 0.1 — Design tokens & primitives

**Owner:** 1 agent, sequential
**Dependencies:** none
**Files owned:**
- `app/globals.css` (extend, don't replace)
- `lib/design-tokens.ts` (new)
- `tailwind.config.ts` (create if missing, otherwise edit)

**Deliverables:**

1. CSS variable tokens in `globals.css`:
   ```
   --bg-base, --bg-elevated, --bg-sunken
   --border-subtle, --border-strong
   --text-primary, --text-secondary, --text-muted
   --accent (bold green, e.g. #00D26A), --accent-hover, --accent-muted
   --danger, --warn, --success
   --radius-sm, --radius-md, --radius-lg
   --shadow-card, --shadow-elevated
   ```
2. Spacing & type scale documented in `lib/design-tokens.ts` as TS constants (for charts, JS-driven sizing).
3. Container query utilities enabled in Tailwind (`@tailwindcss/container-queries` plugin).
4. Font: keep Geist. Add a tabular-nums utility class for numeric displays.

**Acceptance:**
- All tokens render correctly in light dev preview (dark only for now).
- `bg-base`, `text-primary`, `border-subtle`, `accent` are usable as Tailwind classes (`bg-[var(--bg-base)]` or via `@theme` directive in Tailwind v4).

---

## Phase 1 — Parallel tracks

All Phase 1 tracks can run simultaneously after Phase 0 completes. Each is independent.

---

### Track 1.1 — Design system components

**Depends on:** 0.1
**Files owned (all new under `components/ui/`):**
- `components/ui/button.tsx` — variants: primary, secondary, ghost, danger; sizes sm/md/lg; loading state
- `components/ui/card.tsx` — base Card, replaces existing `components/card.tsx` (mark old as deprecated, do not delete yet)
- `components/ui/metric.tsx` — large number + label + delta + optional sparkline; container-query responsive
- `components/ui/badge.tsx` — accent / muted / danger / success variants
- `components/ui/tabs.tsx` — keyboard accessible, underline style, scrollable on overflow
- `components/ui/dropdown.tsx` — primitive, keyboard-nav, used by range pickers, overflow menus, etc.
- `components/ui/modal.tsx` — focus-trapped, ESC closes, backdrop dismissable
- `components/ui/toast.tsx` + `components/ui/toast-provider.tsx`
- `components/ui/skeleton.tsx` — for loading states
- `components/ui/tooltip.tsx`
- `components/ui/segmented-control.tsx` — replaces ChartRangeSelect
- `components/ui/icon-button.tsx`

**Deliverables:**
- All components dark-mode by default, accent-aware.
- All accept `className` and forward refs.
- Documented at the top of each file with a one-line example.
- No business logic — pure presentation.

**Acceptance:**
- All components render with default props.
- Visual smoke test: render every component on a single throwaway page `/dev/ui` and confirm consistency.
- No `console.error` in dev.

---

### Track 1.2 — Landing page

**Depends on:** 0.1, 1.1 (Button, Card), 1.4 (drop zone — coordinate)
**Files owned:**
- `app/page.tsx` (replace current redirect)
- `components/landing/hero.tsx` (new)
- `components/landing/feature-grid.tsx` (new)
- `components/landing/privacy-note.tsx` (new)
- `components/landing/screenshot-strip.tsx` (new)
- `public/screenshots/` (placeholder pngs, real ones added later)

**Deliverables:**

1. **No redirect.** Root page is the landing. If the user has an existing dataset in IndexedDB, show a small "Continue to your dashboard →" banner at the top, but don't auto-redirect.
2. **Hero section:**
   - Headline: "Everything Strong Premium charges for. Free."
   - Sub: "Drop your Strong export. See your numbers. Nothing leaves your device."
   - **Inline drop zone right in the hero** — not a button to upload, the drop zone *is* the CTA.
3. **Feature grid** (4–6 cards):
   - Volume trends
   - Personal records
   - Muscle balance
   - Plateau detection
   - Streaks & frequency
   - Body measurements
4. **Screenshot strip** — horizontally scrollable screenshots of the dashboard.
5. **Privacy note** — short, clear: "Your data is parsed in your browser and stored on your device. There's no server and no account."
6. **Footer:** GitHub link, tagline.

**Acceptance:**
- Desktop: max-width 1200px, hero is two-column (copy left, drop zone right).
- Mobile: stacked, drop zone full-width.
- Dropping a file on the hero zone triggers upload and routes to `/overview`.

---

### Track 1.3 — Navigation shell rebuild

**Depends on:** 0.1, 1.1
**Files owned:**
- `components/layout/app-shell.tsx` (new — replaces `dashboard-layout.tsx`)
- `components/layout/sidebar.tsx` (new — replaces `sidebar-nav.tsx`)
- `components/layout/bottom-nav.tsx` (rewrite existing)
- `components/layout/top-bar.tsx` (new — desktop only, shows breadcrumb + actions)
- `app/(dashboard)/layout.tsx` (rewrite)

**Deliverables:**

1. **Desktop (≥1024px):**
   - Persistent sidebar (left, 240px, not 64px — room for labels).
   - Sections: Dashboard, Exercises, History, Body, Settings.
   - Top bar: page title (or breadcrumb), right side has secondary actions.
2. **Mobile (<1024px):**
   - Bottom nav: Home, Exercises, History, More.
   - Top bar collapsed: just page title.
3. **Upload FAB:** floating accent button on dashboard pages for replacing the dataset.
4. **Container queries:** the shell uses container queries for its main slot so any embedded component (cards, charts) adapts to width independently of viewport.
5. **No redirect-on-empty.** If no dataset, render an inline empty state in the current route, not a forced redirect.

**Acceptance:**
- Resize browser from 320px → 1920px: layout transitions smoothly at 1024px breakpoint.
- Sidebar collapses to bottom nav at <1024px.
- Upload FAB visible and contextual on all dashboard pages.

---

### Track 1.4 — Upload flow rewrite

**Depends on:** 0.1, 1.1
**Files owned:**
- `components/upload/dropzone.tsx` (new — reusable, used by landing AND settings)
- `components/upload/upload-progress.tsx` (new)
- `components/upload/upload-confirm-replace.tsx` (new)
- `app/upload/page.tsx` (keep as a route for direct linking, but de-emphasize)
- `lib/parse-strong-csv.ts` (read-only — do not modify schema)
- `lib/upload-orchestrator.ts` (new — handles: parse → validate → save to IndexedDB)

**Deliverables:**

1. **`<Dropzone>`** is a single component used in 3 places:
   - Landing hero (large variant)
   - `/upload` page (medium variant)
   - Settings "Replace dataset" (small variant)
2. **Upload orchestrator:** parses client-side (Papa Parse) and writes the normalized dataset to IndexedDB. No network calls at any point.
3. **Progress UI:** file → parsing → validating → saving → done. Show row count.
4. **Replace flow:** if an existing dataset is present, confirm modal with "We'll replace your workouts but keep your body measurements."
5. **Errors:** clear inline messages for bad columns, encoding issues, empty file.

**Acceptance:**
- Drop CSV anywhere a `<Dropzone>` is rendered → data saved correctly.
- Upload appears in IndexedDB and survives a refresh.
- Replace flow doesn't nuke other locally stored data.

---

### Track 1.5 — Dashboard `/overview` redesign

**Depends on:** 0.1, 1.1, 1.3
**Files owned:**
- `app/(dashboard)/overview/page.tsx` (rewrite)
- `components/dashboard/kpi-row.tsx` (new)
- `components/dashboard/volume-card.tsx` (new — wraps existing chart)
- `components/dashboard/frequency-calendar.tsx` (new — GitHub-style heatmap)
- `components/dashboard/recent-prs.tsx` (new)
- `components/dashboard/period-compare.tsx` (new — "this month vs last month" toggle)
- `lib/derive/streaks.ts` (new — current streak, longest streak)
- `lib/derive/period-compare.ts` (new)

**Deliverables:**

1. **Remove tabs.** Single scrollable dashboard.
2. **Desktop grid (≥1024px):**
   ```
   ┌─────────────────────────────────────────────┐
   │  KPI row: 4 metrics (workouts, volume,      │
   │  current streak, PRs this month)            │
   ├──────────────────────┬──────────────────────┤
   │  Volume trend chart  │  Frequency calendar  │
   │  (large)             │  (heatmap, 1yr)      │
   ├──────────────────────┼──────────────────────┤
   │  Recent PRs          │  Top exercises by    │
   │                      │  volume              │
   ├──────────────────────┴──────────────────────┤
   │  Period compare (this month vs last)        │
   └─────────────────────────────────────────────┘
   ```
3. **Mobile (<1024px):** all stack vertically, full width.
4. **Container queries** on each card so they downscale gracefully if placed in narrower slots later.
5. **Period compare:** toggle button group ("Week / Month / Quarter / Year"). Shows delta for every KPI in the row.

**Acceptance:**
- Desktop: 2-column grid populated and no overflow.
- Mobile: clean vertical stack.
- All charts use the new design tokens.
- Streak calculation: current streak = consecutive weeks with ≥1 workout.

---

### Track 1.6 — Exercise pages redesign

**Depends on:** 0.1, 1.1, 1.3
**Files owned:**
- `app/(dashboard)/exercises/page.tsx` (rewrite — list with search + filters)
- `app/(dashboard)/exercises/[slug]/page.tsx` (rewrite — detail)
- `components/exercises/exercise-list.tsx` (new)
- `components/exercises/exercise-card.tsx` (new)
- `components/exercises/exercise-detail-header.tsx` (new)
- `components/exercises/one-rm-chart.tsx` (new — estimated 1RM over time using Epley)
- `components/exercises/set-history-table.tsx` (new)
- `lib/derive/one-rm.ts` (new — Epley formula, configurable)

**Deliverables:**

1. **List page:**
   - Search input.
   - Filters: muscle group, last performed (any/30d/90d).
   - Sort: alphabetical, last performed, max weight, volume.
   - Each row: name, max weight, volume last 30d, last performed, mini sparkline.
   - Desktop: 2-col grid. Mobile: list.
2. **Detail page:**
   - Header: exercise name, muscle group badge, "last performed X days ago," personal record.
   - **Estimated 1RM curve** (the headline chart) using Epley: `1RM = weight × (1 + reps/30)`.
   - Volume per session chart.
   - Set history table (paginated, last 50 by default).
   - "Compare to" picker: select another exercise to overlay.
3. Charts use accent color for the active series.

**Acceptance:**
- Search filters in real time.
- 1RM curve shows reasonable values for sample data.
- Detail page handles edge cases (1 set ever, no recent activity).

---

### Track 1.7 — History redesign + session detail

**Depends on:** 0.1, 1.1, 1.3
**Files owned:**
- `app/(dashboard)/history/page.tsx` (rewrite)
- `app/(dashboard)/history/[sessionId]/page.tsx` (rewrite)
- `components/history/session-card.tsx` (new)
- `components/history/session-detail.tsx` (new)
- `components/history/calendar-view.tsx` (new — month grid alt view)

**Deliverables:**

1. **List page:**
   - Toggle: List / Calendar.
   - List: session cards grouped by month, each card shows date, duration, top 3 exercises, total volume.
   - Calendar: month grid, dots for workout days, click day → session.
2. **Detail page:**
   - Header: date, duration, total volume, exercise count.
   - Per-exercise breakdown: sets table, max weight that session, volume.
   - "Previous session of this exercise" mini link in each block.

**Acceptance:**
- Calendar view renders 12 months scrollable on desktop, 1 at a time on mobile.
- Session detail loads <100ms from local data.

---

### Track 1.9 — New analytics: muscle balance + streaks + body measurements

**Depends on:** 0.1, 1.1
**Files owned:**
- `app/(dashboard)/body/page.tsx` (new)
- `components/analytics/muscle-balance.tsx` (new)
- `components/analytics/streak-card.tsx` (new)
- `components/analytics/body-log.tsx` (new)
- `lib/derive/muscle-mapping.ts` (new — exercise → muscle group(s))
- `lib/derive/muscle-balance.ts` (new — push/pull/legs ratios)

**Deliverables:**

1. **Muscle mapping:** static table of ~200 common exercises → primary + secondary muscle groups. Fall back to "other" if unknown. Allow user override (stretch goal).
2. **Muscle balance component:**
   - Radar chart or horizontal bars showing volume distribution across: push, pull, legs, core, arms.
   - Imbalance warning if ratio off (e.g. push:pull >1.5).
3. **Streak card:** current streak, longest streak, total weeks active.
4. **Body measurements page:**
   - Simple log: weight, body fat %, optional custom measurements.
   - Stored in IndexedDB alongside the workout dataset, under its own key so a CSV replace doesn't clear it.
   - Trend chart.

**Acceptance:**
- Muscle balance renders for sample data; ratios sum sensibly.
- Body measurements persist across reloads.
- Replacing the workout CSV leaves measurements intact.

---

### Track 1.10 — Settings + data management

**Depends on:** 0.1, 1.1, 1.4
**Files owned:**
- `app/(dashboard)/settings/page.tsx` (rewrite)
- `components/settings/data-section.tsx` (new)
- `components/settings/preferences-section.tsx` (new)
- `components/settings/export-section.tsx` (new — download JSON, future PDF)

**Deliverables:**

1. **Data section:** replace dataset (re-use `<Dropzone>` small variant), clear all local data (confirm modal), and a short privacy note explaining that everything lives in this browser.
2. **Preferences:** units (kg/lb), week start day, theme (dark only for now, placeholder for light).
3. **Export section:** download workouts JSON. "Yearly wrapped PDF" placeholder (future).

**Acceptance:**
- Clear data wipes every IndexedDB key the app owns and returns the user to the empty state.
- Export JSON downloads valid file.

---

## Phase 2 — Integration & polish

These run after Phase 1 lands. Mostly sequential per file but pages can parallelize.

### Track 2.1 — Migrate old component usages
Find all imports of `components/card.tsx`, `components/primary-button.tsx`, `components/section-label.tsx`, `components/chart-range-select.tsx`, `components/tab-nav.tsx`, etc. Replace with `components/ui/*` equivalents. Delete deprecated files.

### Track 2.2 — Empty states everywhere
Every page needs a real empty state, not a redirect. Pattern: illustration + headline + CTA (drop zone for `/overview`, "Pick an exercise" for `/exercises/[slug]` when none, etc.).

### Track 2.3 — Loading & error states
Skeletons for every page (use `components/ui/skeleton.tsx`). Error boundaries with friendly retry.

### Track 2.4 — Accessibility audit
Keyboard nav on tabs, modals, dropdowns. Focus rings using accent color. ARIA labels on icon-only buttons. Color contrast check against accent.

### Track 2.5 — Performance pass
- Recharts → check render times on 6k+ row datasets.
- Memoize derived metrics so large datasets aren't recomputed per render.
- Image optimization for screenshots.
- Lighthouse target: 90+ on all axes.

### Track 2.6 — Telemetry (optional)
Vercel Analytics or Plausible. Track: landing → upload conversion. Page views only, no workout data.

---

## Component-mapping reference (old → new)

| Old | New | Track |
|---|---|---|
| `components/card.tsx` (MetricCard) | `components/ui/card.tsx`, `components/ui/metric.tsx` | 1.1 |
| `components/primary-button.tsx` | `components/ui/button.tsx` (primary variant) | 1.1 |
| `components/section-label.tsx` | inline className util in design tokens | 1.1 |
| `components/tab-nav.tsx` | `components/ui/tabs.tsx` | 1.1 |
| `components/layout/dashboard-layout.tsx` | `components/layout/app-shell.tsx` | 1.3 |
| `components/layout/sidebar-nav.tsx` | `components/layout/sidebar.tsx` | 1.3 |
| `components/layout/bottom-nav.tsx` | `components/layout/bottom-nav.tsx` (rewrite) | 1.3 |
| `components/upload/csv-uploader.tsx` | `components/upload/dropzone.tsx` | 1.4 |
| `components/empty-state-card.tsx` | Track 2.2 unified empty states | 2.2 |
| `components/trend-chart.tsx` | retained, re-themed in 1.5 | 1.5 |
| `components/chart-card.tsx` | retained, re-themed | 1.5 |
| `components/chart-range-select.tsx` | `components/ui/segmented-control.tsx` | 1.1 |

---

## Dependency graph

```
Phase 0:
  0.1 (tokens)
       ▼
Phase 1 (parallel):
  1.1 design system ◄─── 0.1
  1.2 landing ◄─── 0.1, 1.1, 1.4*
  1.3 nav shell ◄─── 0.1, 1.1
  1.4 upload ◄─── 0.1, 1.1
  1.5 overview ◄─── 0.1, 1.1, 1.3
  1.6 exercises ◄─── 0.1, 1.1, 1.3
  1.7 history ◄─── 0.1, 1.1, 1.3
  1.9 analytics ◄─── 0.1, 1.1
  1.10 settings ◄─── 0.1, 1.1, 1.4

Phase 2: sequential cleanup
```

*1.2 depends on 1.4's `<Dropzone>` but can stub it until ready.

---

## Recommended agent fan-out

**Round 1** (after Phase 0): kick off 1.1 first — most tracks depend on it.

**Round 2** (1.1 done, ~half a day): launch 1.2, 1.3, 1.4, 1.9, 1.10 in parallel. Five tabs.

**Round 3** (1.3 done): launch 1.5, 1.6, 1.7 in parallel. Three tabs.

**Round 4:** Phase 2 cleanup, one or two tabs.

---

## Open questions to revisit

- **Strong app API:** not public. Stay CSV-import only.
- **Native app:** out of scope for this overhaul.
- **Multi-device:** deliberately unsupported. The app has no backend, so a dataset lives in one browser. Export JSON is the escape hatch.
