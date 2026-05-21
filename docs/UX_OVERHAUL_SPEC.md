# setdown — UX Overhaul Spec (v2)

**Status:** Ready for parallel implementation
**Date:** 2026-05-21
**Approach:** Component-by-component replacement (design system first, then swap usages)
**Stack additions:** Convex (auth + data + AI insight cache), Google OAuth, container queries

---

## How to use this spec

This document is split into **tracks**. Each track is a self-contained work unit that one agent (or one Claude Code tab) can pick up.

- **Phase 0** must complete first (foundation work — design tokens, Convex setup). It is not parallelizable.
- **Phase 1** tracks can run **fully in parallel**. Each track lists its dependencies, files it owns, and acceptance criteria.
- **Phase 2** integrates the tracks into pages and is sequential per page but pages can be parallelized.

**Agent invocation pattern:** Open a new Claude Code tab, paste the track section (e.g. "Do Track 1.3" plus the contents of that section). The agent has everything needed.

**Ownership rules:**
- A track **owns** the files listed under "Files owned." No other track may edit those files.
- A track may **read** any file but only edit files it owns or files explicitly marked "shared — coordinate."
- New shared utilities go in `lib/` and must be created in Phase 0 if multiple tracks need them.

---

## Product principles (read first)

1. **Anonymous = the whole product, minus persistence and AI.** No nag walls, no teaser cards. The dashboard works fully without an account.
2. **Login unlocks continuity, not features.** Cross-device sync, AI coach, saved notes, exportable reports. That's it.
3. **Desktop and mobile are equals.** Stop being mobile-first. Use container queries so components adapt to their slot, not the viewport.
4. **Match Strong Premium's analytics for free.** That's the wedge.
5. **AI is ambient, not a tab.** Pre-computed insight cards on every page (logged-in); contextual chat in a slide-over.
6. **Visual identity:** Dark base + bold green accent (Linear/Vercel style). Accent used in CTAs, active chart series, key numbers — never decorative.

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

### Track 0.2 — Convex setup & schema

**Owner:** 1 agent, sequential
**Dependencies:** none (can run parallel with 0.1)
**Files owned:**
- `convex/` (entire directory, new)
- `convex.json` (new)
- `package.json` (add `convex` dep)
- `.env.local.example` (update)
- `lib/convex-client.ts` (new)
- `app/layout.tsx` (wrap with `ConvexProvider` — coordinate handoff to Track 1.0)

**Deliverables:**

1. `npx convex dev` initialized. Project named `setdown`.
2. Schema in `convex/schema.ts`:

   ```ts
   users: {
     googleId: string,
     email: string,
     name: string,
     image?: string,
     createdAt: number,
   }

   datasets: {
     userId: Id<"users">,
     uploadedAt: number,
     sourceFilename: string,
     rowCount: number,
     dateRange: { start: number, end: number },
     // raw sets stored as separate table; this is metadata
   }

   workoutSets: {
     userId: Id<"users">,
     datasetId: Id<"datasets">,
     date: number,           // session date as ms
     exerciseName: string,
     exerciseSlug: string,   // normalized for queries
     setOrder: number,
     weightKg: number,
     reps: number,
     rpe?: number,
     durationSec?: number,
     notes?: string,
   }
   // Indexed by ["userId", "exerciseSlug", "date"] and ["userId", "date"]

   insights: {
     userId: Id<"users">,
     datasetVersion: number,    // incremented on dataset replace
     kind: "overview" | "exercise" | "plateau" | "balance" | "streak",
     scope?: string,             // e.g. exerciseSlug if kind=exercise
     content: string,            // markdown
     generatedAt: number,
     model: string,              // "claude-opus-4-7" etc.
   }
   // Indexed by ["userId", "datasetVersion", "kind"]

   chatMessages: {
     userId: Id<"users">,
     role: "user" | "assistant",
     content: string,
     createdAt: number,
     pageContext?: string,       // e.g. "/exercises/bench-press"
   }

   bodyMeasurements: {
     userId: Id<"users">,
     date: number,
     weightKg?: number,
     bodyFatPct?: number,
     measurements?: Record<string, number>, // chest, waist, arm, etc
   }
   ```

3. Google OAuth via Convex Auth (`@convex-dev/auth`). Configure in `convex/auth.ts`.
4. Server functions stubs (empty bodies, just signatures):
   - `mutations/uploadDataset.ts` — takes parsed `WorkoutSet[]`, replaces existing
   - `mutations/saveBodyMeasurement.ts`
   - `mutations/saveChatMessage.ts`
   - `queries/getCurrentUser.ts`
   - `queries/getLatestDataset.ts`
   - `queries/getWorkoutSets.ts` (paginated, filterable by date range / exercise)
   - `queries/getInsights.ts` (by kind & scope)
   - `actions/generateInsights.ts` — calls Claude, writes to `insights` table
5. `lib/convex-client.ts` exports a configured `ConvexReactClient`.
6. `app/layout.tsx` wraps children in `ConvexProvider`. **Coordinate with Track 1.0 (auth context) before merging.**

**Acceptance:**
- `npx convex dev` runs cleanly.
- Google OAuth login flow works end-to-end in a throwaway test page.
- Schema deploys without errors.
- Type-safe Convex client importable from any component.

---

## Phase 1 — Parallel tracks

All Phase 1 tracks can run simultaneously after Phase 0 completes. Each is independent.

---

### Track 1.0 — Auth context & login flow

**Depends on:** 0.1, 0.2
**Files owned:**
- `context/auth-context.tsx` (new — wraps Convex auth state)
- `components/auth/login-modal.tsx` (new)
- `components/auth/user-menu.tsx` (new — avatar + dropdown for logged-in)
- `components/auth/sign-in-button.tsx` (new)
- `app/layout.tsx` (shared — add AuthProvider; coordinate with 0.2)
- `lib/migrate-indexeddb-to-convex.ts` (new)

**Deliverables:**

1. `<AuthProvider>` exposes: `{ user, isLoading, isAuthenticated, signIn, signOut }`.
2. **Login modal** (not a route — modal opens inline):
   - Triggered from "Sign in" button or any gated action.
   - Single CTA: "Continue with Google."
   - Subtitle: "Save your data. Chat with AI. It's free."
   - Privacy line: "We only store your workout data. Nothing else."
3. **Auto-migration on first login:**
   - On successful auth, check `idb-keyval` for `setdown-dataset-v1`.
   - If present, call `uploadDataset` mutation with the parsed sets.
   - Show toast: "Synced your existing data to your account."
   - On success, clear IndexedDB.
4. **User menu** (logged-in state in sidebar/header):
   - Avatar (Google profile image) + name + caret.
   - Dropdown: Settings, Sign out.
5. **Sign-in button** for sidebar/landing CTAs (unauthenticated state).

**Acceptance:**
- Click sign in → Google flow → returns to current page logged in.
- IndexedDB data migrates silently on first login.
- Refreshing preserves session.
- `useAuth()` hook is callable anywhere in the tree.

---

### Track 1.1 — Design system components

**Depends on:** 0.1
**Files owned (all new under `components/ui/`):**
- `components/ui/button.tsx` — variants: primary, secondary, ghost, danger; sizes sm/md/lg; loading state
- `components/ui/card.tsx` — base Card, replaces existing `components/card.tsx` (mark old as deprecated, do not delete yet)
- `components/ui/metric.tsx` — large number + label + delta + optional sparkline; container-query responsive
- `components/ui/badge.tsx` — accent / muted / danger / success variants
- `components/ui/tabs.tsx` — keyboard accessible, underline style, scrollable on overflow
- `components/ui/dropdown.tsx` — primitive, keyboard-nav, used by user menu, range pickers, etc.
- `components/ui/modal.tsx` — focus-trapped, ESC closes, backdrop dismissable
- `components/ui/slide-over.tsx` — right-side panel (used for AI chat)
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

1. **No redirect.** Root page is the landing. If the user has an existing dataset (IndexedDB OR Convex), show a small "Continue to your dashboard →" banner at the top, but don't auto-redirect.
2. **Hero section:**
   - Headline: "Everything Strong Premium charges for. Free."
   - Sub: "Drop your Strong export. See your numbers. Talk to AI. No signup needed to start."
   - **Inline drop zone right in the hero** — not a button to upload, the drop zone *is* the CTA.
   - Below drop zone: "or sign in to save and chat with AI" link → opens login modal.
3. **Feature grid** (3x2 or 6 cards):
   - Volume trends
   - Personal records
   - Muscle balance
   - Plateau detection
   - AI coaching (sign-in required badge)
   - Cross-device sync (sign-in required badge)
4. **Screenshot strip** — horizontally scrollable screenshots of the dashboard.
5. **Privacy note** — short, clear: "Your data lives on your device. Sign in only if you want to save it across devices or chat with AI."
6. **Footer:** GitHub link, tagline.

**Acceptance:**
- Desktop: max-width 1200px, hero is two-column (copy left, drop zone right).
- Mobile: stacked, drop zone full-width.
- Dropping a file on the hero zone triggers upload and routes to `/overview`.

---

### Track 1.3 — Navigation shell rebuild

**Depends on:** 0.1, 1.1, 1.0
**Files owned:**
- `components/layout/app-shell.tsx` (new — replaces `dashboard-layout.tsx`)
- `components/layout/sidebar.tsx` (new — replaces `sidebar-nav.tsx`)
- `components/layout/bottom-nav.tsx` (rewrite existing)
- `components/layout/top-bar.tsx` (new — desktop only, shows breadcrumb + user menu + AI button)
- `app/(dashboard)/layout.tsx` (rewrite)

**Deliverables:**

1. **Desktop (≥1024px):**
   - Persistent sidebar (left, 240px, not 64px — room for labels).
   - Sections: Dashboard, Exercises, History, Body, Insights (logged-in only), Settings.
   - User menu pinned to bottom of sidebar.
   - Top bar: page title (or breadcrumb), right side has AI button + secondary actions.
2. **Mobile (<1024px):**
   - Bottom nav: Home, Exercises, History, AI (or "More" if anonymous).
   - Top bar collapsed: just page title + AI button.
3. **AI button:** floating accent button (replaces upload FAB once data is loaded). For anonymous users, clicking opens login modal.
4. **Container queries:** the shell uses container queries for its main slot so any embedded component (cards, charts) adapts to width independently of viewport.
5. **No redirect-on-empty.** If no dataset, render an inline empty state in the current route, not a forced redirect.

**Acceptance:**
- Resize browser from 320px → 1920px: layout transitions smoothly at 1024px breakpoint.
- Sidebar collapses to bottom nav at <1024px.
- AI button visible and contextual on all dashboard pages.
- User menu shows correct state (logged in vs out).

---

### Track 1.4 — Upload flow rewrite

**Depends on:** 0.1, 1.1, 0.2 (Convex client)
**Files owned:**
- `components/upload/dropzone.tsx` (new — reusable, used by landing AND settings)
- `components/upload/upload-progress.tsx` (new)
- `components/upload/upload-confirm-replace.tsx` (new)
- `app/upload/page.tsx` (keep as a route for direct linking, but de-emphasize)
- `lib/parse-strong-csv.ts` (read-only — do not modify schema)
- `lib/upload-orchestrator.ts` (new — handles: parse → validate → save to IndexedDB or Convex)

**Deliverables:**

1. **`<Dropzone>`** is a single component used in 3 places:
   - Landing hero (large variant)
   - `/upload` page (medium variant)
   - Settings "Replace dataset" (small variant)
2. **Upload orchestrator:**
   - Always parses client-side (Papa Parse).
   - If logged in → write to Convex (`uploadDataset` mutation).
   - If anonymous → write to IndexedDB (current behavior).
3. **Progress UI:** file → parsing → validating → saving → done. Show row count.
4. **Replace flow:** if existing dataset, confirm modal with "We'll keep your AI chat history and body measurements, but replace workouts."
5. **Errors:** clear inline messages for bad columns, encoding issues, empty file.

**Acceptance:**
- Drop CSV anywhere a `<Dropzone>` is rendered → data saved correctly.
- Logged-in upload appears in Convex within 2s.
- Anonymous upload appears in IndexedDB.
- Replace flow doesn't nuke other user data.

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
6. **No insight cards yet** — Track 1.8 adds them.

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

### Track 1.8 — AI subsystem (slide-over chat + ambient insights)

**Depends on:** 0.2, 1.0, 1.1
**Files owned:**
- `components/ai/ai-button.tsx` (new — the floating accent button)
- `components/ai/chat-panel.tsx` (new — slide-over content)
- `components/ai/chat-message.tsx` (new)
- `components/ai/insight-card.tsx` (new — used by other tracks via export)
- `components/ai/suggested-prompts.tsx` (new — context-aware)
- `app/api/chat/route.ts` (rewrite — uses Convex for history + auth check)
- `convex/actions/generateInsights.ts` (implement — was stub in 0.2)
- `lib/ai/build-context.ts` (rewrite — page-aware context builder)
- `lib/ai/insight-prompts.ts` (new — one prompt per insight kind)

**Deliverables:**

1. **AI button** is the floating accent button (replaces upload FAB after data loaded).
2. **Anonymous click:** opens login modal with copy "Sign in to chat with AI about your workouts."
3. **Logged-in click:** opens slide-over with chat history loaded from Convex.
4. **Page-aware context:** if on `/exercises/bench-press`, the chat context includes bench-specific summary + the suggested prompts shift to bench questions.
5. **Ambient insights (pre-computed):**
   - On `uploadDataset` mutation, schedule `generateInsights` action.
   - Generates 5 kinds: overview summary, plateau warnings, muscle balance, streak commentary, top recommendation.
   - Cached in `insights` table keyed by `datasetVersion`.
   - Refresh trigger: dataset replace OR manual "refresh insights" button OR 7 days stale.
6. **`<InsightCard>`** component used by Track 1.5 and 1.6 — renders markdown, shows "Generated X days ago" footer, has refresh icon.
7. **Rate limits:** per-user, 50 chat messages/day (configurable). Show remaining count.

**Acceptance:**
- Slide-over chat streams Claude responses.
- Insights appear on dashboard within 30s of upload.
- Anonymous users see locked AI button → login modal flow.
- Chat history persists across sessions for logged-in users.

---

### Track 1.9 — New analytics: muscle balance + streaks + body measurements

**Depends on:** 0.1, 1.1, 0.2
**Files owned:**
- `app/(dashboard)/body/page.tsx` (new — logged-in only)
- `app/(dashboard)/insights/page.tsx` (new — landing for all insights)
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
4. **Body measurements page (logged-in only):**
   - Simple log: weight, body fat %, optional custom measurements.
   - Trend chart.
   - Anonymous users see locked state with "Sign in to log measurements."
5. **`/insights` page:** all AI-generated insights in one place, plus the muscle balance + streak cards.

**Acceptance:**
- Muscle balance renders for sample data; ratios sum sensibly.
- Body measurements form saves to Convex.
- Anonymous users redirected to login modal when accessing `/body`.

---

### Track 1.10 — Settings + data management

**Depends on:** 0.1, 1.1, 0.2, 1.4
**Files owned:**
- `app/(dashboard)/settings/page.tsx` (rewrite)
- `components/settings/account-section.tsx` (new — logged-in only)
- `components/settings/data-section.tsx` (new)
- `components/settings/preferences-section.tsx` (new)
- `components/settings/export-section.tsx` (new — download JSON, future PDF)
- `convex/mutations/deleteAccount.ts` (new)
- `convex/mutations/exportUserData.ts` (new)

**Deliverables:**

1. **Account section (logged-in):** email, name, signed-in-with-Google badge, sign out, delete account (confirm modal).
2. **Data section:** replace dataset (re-use `<Dropzone>` small variant), clear local data (anon), wipe all server data (logged-in).
3. **Preferences:** units (kg/lb), week start day, theme (dark only for now, placeholder for light).
4. **Export section:** download workouts JSON. "Yearly wrapped PDF" placeholder (future).

**Acceptance:**
- Delete account fully removes user, datasets, insights, chats, measurements from Convex.
- Export JSON downloads valid file.
- Anonymous users see only Data + Preferences sections.

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
Keyboard nav on tabs, modals, slide-over, dropdowns. Focus rings using accent color. ARIA labels on icon-only buttons. Color contrast check against accent.

### Track 2.5 — Performance pass
- Recharts → check render times on 6k+ row datasets.
- Convex query pagination on `workoutSets`.
- Image optimization for screenshots.
- Lighthouse target: 90+ on all axes.

### Track 2.6 — Telemetry (optional)
Vercel Analytics or Plausible. Track: landing → upload conversion, anonymous → signup conversion, AI usage.

---

## Component-mapping reference (old → new)

| Old | New | Track |
|---|---|---|
| `components/card.tsx` (MetricCard, InsightCard) | `components/ui/card.tsx`, `components/ui/metric.tsx`, `components/ai/insight-card.tsx` | 1.1, 1.8 |
| `components/primary-button.tsx` | `components/ui/button.tsx` (primary variant) | 1.1 |
| `components/section-label.tsx` | inline className util in design tokens | 1.1 |
| `components/tab-nav.tsx` | `components/ui/tabs.tsx` | 1.1 |
| `components/chat-input.tsx` | `components/ai/chat-panel.tsx` (sub-component) | 1.8 |
| `components/upload-fab.tsx` | `components/ai/ai-button.tsx` | 1.8 |
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
  0.1 (tokens) ─┐
  0.2 (convex) ─┤
                ▼
Phase 1 (parallel):
  1.0 auth ◄─── 0.1, 0.2
  1.1 design system ◄─── 0.1
  1.2 landing ◄─── 0.1, 1.1, 1.4*
  1.3 nav shell ◄─── 0.1, 1.1, 1.0
  1.4 upload ◄─── 0.1, 1.1, 0.2
  1.5 overview ◄─── 0.1, 1.1, 1.3
  1.6 exercises ◄─── 0.1, 1.1, 1.3
  1.7 history ◄─── 0.1, 1.1, 1.3
  1.8 AI ◄─── 0.2, 1.0, 1.1
  1.9 analytics ◄─── 0.1, 1.1, 0.2
  1.10 settings ◄─── 0.1, 1.1, 0.2, 1.4

Phase 2: sequential cleanup
```

*1.2 depends on 1.4's `<Dropzone>` but can stub it until ready.

---

## Recommended agent fan-out

**Round 1** (after Phase 0): kick off 1.1 and 1.0 first — many tracks depend on them.

**Round 2** (1.1 and 1.0 done, ~half a day): launch 1.2, 1.3, 1.4, 1.8, 1.9, 1.10 in parallel. Six tabs.

**Round 3** (1.3 done): launch 1.5, 1.6, 1.7 in parallel. Three tabs.

**Round 4:** Phase 2 cleanup, one or two tabs.

---

## Open questions to revisit

- **Pricing/donations:** the spec assumes fully free. If a Pro tier later, what's behind it? (Probably: longer chat history, more frequent insight refresh, custom AI personality.)
- **Strong app API:** not public. Stay CSV-import only.
- **Native app:** out of scope for this overhaul.
- **Real-time multi-device sync:** Convex gives this for free if we use reactive queries — confirm wiring in 1.0.
