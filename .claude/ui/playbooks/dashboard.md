# UI Playbook — Dashboard

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Owner:** Premium UI Engineer (final authority) · consumed by Frontend Engineer
**Applies to:** any KPI/stats/overview screen — the main admin dashboard
(`Frontend/src/app/(dashboard)/page.tsx` → `Frontend/src/modules/dashboard/pages/dashboard-page.tsx`)
and any future per-module dashboard (e.g. a store-performance view under
`modules/stores/pages/store-dashboard-page.tsx`).

**Current state vs. this playbook:** `dashboard-page.tsx` today is a
placeholder — an `<h1>`/subtitle pair plus one `Card` wrapping the demo
`ProductForm`. It has no KPI tiles, no charts, no activity feed. This
document specifies the **target** pattern; nothing described below is built
yet. Treat every "install X" note as a real, unmet prerequisite, not
housekeeping.

---

## Layout

A dashboard is always three stacked regions inside the existing page
container, never a single freeform canvas:

```
<div className="flex flex-col gap-6">           {/* page: mirrors dashboard-page.tsx's gap-6 rhythm */}
  <PageHeader />                                  {/* h1 + subtitle, same shape as dashboard-page.tsx today */}

  <StatTileRow />                                 {/* region 1: KPI grid */}

  <div className="grid gap-6 xl:grid-cols-3">     {/* region 2+3 share a row on desktop only */}
    <ChartCard className="xl:col-span-2" />       {/*   region 2: charts, 2/3 width on desktop */}
    <RecentActivityCard />                        {/*   region 3: activity feed, 1/3 width on desktop */}
  </div>
</div>
```

This composes inside the existing shell — `Frontend/src/components/layout/
dashboard-shell.tsx` already wraps every page in `<main><div className="mx-auto
max-w-screen-2xl p-4 md:p-6 2xl:p-10">{children}</div></main>`. A dashboard
page never re-declares its own max-width or outer padding; it only fills that
container.

**Module structure** (per `Frontend/AGENTS.md` rules 1–3, feature-first):
- `modules/dashboard/pages/dashboard-page.tsx` — composition only, no fetching logic.
- `modules/dashboard/components/stat-tile-row.tsx`, `stat-tile.tsx` — KPI grid + single tile.
- `modules/dashboard/components/revenue-chart-card.tsx` (or per-metric equivalent) — chart region.
- `modules/dashboard/components/recent-activity-card.tsx` — activity list region.
- `modules/dashboard/hooks/use-dashboard-stats.ts`, `use-recent-activity.ts` — TanStack Query hooks, one per independently-loadable region (see Error Handling — regions must fail independently).
- `modules/dashboard/api/dashboard-api.ts` — the only place calling `backendFetch`.
- `modules/dashboard/constants/query-keys.ts` — centralized query keys per rule 18, never inline arrays in components.

Each region (`StatTileRow`, `ChartCard`, `RecentActivityCard`) is its own
`Card`-rooted component with its own query, its own loading/error/empty
state. A dashboard is a composition of independent widgets, not one
monolithic fetch — this is what makes the per-widget Loading/Error/Empty
rules below possible.

---

## Spacing

- **Page-level rhythm:** `gap-6` between the header, the stat-tile row, and
  the charts+activity row — matching the `gap-6` already used in
  `dashboard-page.tsx`'s root `<div className="flex flex-col gap-6">`.
- **Grid gutters:** `gap-4` inside the stat-tile grid and inside the
  `charts + activity` grid. Do not mix `gap-4` and `gap-6` at the same
  nesting depth — `gap-6` is reserved for separating the three top-level
  regions, `gap-4` for items within a region.
- **Card internals:** never add ad hoc padding inside `CardContent`/
  `CardHeader`. `Frontend/src/components/ui/card.tsx` already defines
  `[--card-spacing:--spacing(4)]` on the root and every sub-component
  consumes it (`px-(--card-spacing)`, `py-(--card-spacing)`). Use
  `<Card size="sm">` (`--card-spacing` becomes `--spacing(3)`) for the denser
  stat tiles if the default 4-unit padding feels too loose at 4-column
  desktop width — don't hand-roll a smaller padding value.
- **Typography scale:** this codebase has no separate type-scale tokens
  (only `--font-sans`/`--font-mono`/`--font-heading` family variables in
  `globals.css`) — the token system for size *is* Tailwind's built-in
  `text-*` scale. Follow the precedent already in `dashboard-page.tsx`:
  page `h1` = `text-3xl font-semibold tracking-tight`, subtitle =
  `text-muted-foreground`. `CardTitle` (widget headings) is fixed at
  `font-heading text-base font-medium` by `card.tsx` — don't override it
  per-widget. Stat tile numbers are the one new size in this pattern: use
  `text-2xl font-semibold tabular-nums` (or `text-3xl` if the tile has no
  icon competing for space) — `tabular-nums` so KPI digits don't jitter on
  refetch.
- **Radius:** widgets are `Card`s, so radius is inherited (`rounded-xl`, i.e.
  `--radius-xl`) automatically — never set a competing radius on a
  dashboard widget.

---

## Recommended Components

**Already available in `Frontend/src/components/ui/`** — use as-is:
- `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` /
  `CardFooter` / `CardAction` — every widget (stat tile, chart panel,
  activity panel) is a `Card`.
- `Button` (`variant="outline"` or `"ghost"`, `size="sm"`) — retry actions,
  "View all" links, time-range fallback controls.
- `Tooltip` — hover detail on a truncated stat label or a trend delta.
- `Separator` — between rows inside the activity list if a hairline reads
  better than `gap` alone.

**Not installed yet — install via shadcn CLI before use, then swap any
default Lucide icons for Phosphor** (per `components.json`'s
`"iconLibrary": "lucide"` mismatch):
- `npx shadcn@latest add skeleton` — stat-tile and activity-row loading
  placeholders (see Loading).
- `npx shadcn@latest add badge` — status pills in the activity list (e.g.
  order status: Placed / Preparing / Out for Delivery / Delivered /
  Cancelled), colored via `bg-primary`/`bg-muted`/`bg-destructive` tokens
  per status, never a new hardcoded color per status.
- `npx shadcn@latest add chart` — this pulls in `recharts` as a dependency
  and generates `components/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`,
  `ChartLegend`, `ChartConfig`). **This is the only sanctioned charting
  path** — do not add a different charting library and do not hand-roll SVG
  charts. Map every series color through a `ChartConfig` whose `color`
  values are `var(--chart-1)` through `var(--chart-5)` (already defined in
  `globals.css`, already have separate light/dark values) — never a new hex
  or oklch literal per series.
- `npx shadcn@latest add alert` — per-widget error state body (see Error
  Handling).
- `npx shadcn@latest add avatar` — optional actor avatar in an activity row
  (e.g. delivery partner/customer initials) when the row represents a
  person-driven event.
- `npx shadcn@latest add tabs` — optional scoped time-range control (Today /
  7D / 30D) on the chart region header, if the Feature Design calls for one.

**Icon mapping (Phosphor, `@phosphor-icons/react`, always with the `Icon`
suffix per existing imports like `ListIcon`/`XIcon`/`SignOutIcon`):**
- `TrendUpIcon` — positive stat delta, colored `text-primary` (or
  `text-chart-3` if a distinct "good" green reads better than amber
  `primary` — pick one and use it for every positive delta, never mix).
- `TrendDownIcon` — negative stat delta, colored `text-destructive`.
- `ArrowClockwiseIcon` — manual refresh control and per-widget retry button.
- `WarningCircleIcon` — per-widget error state icon (inside `Alert`).
- `ClockIcon` — timestamp in activity rows.
- `CaretRightIcon` — "View all" link affordance (already the convention in
  `sidebar.tsx`'s `NavGroupItem` for expandable rows — reuse the same
  glyph for the same "there's more" concept here).
- `ChartLineUpIcon` — chart-region `CardTitle` leading icon.
- Domain-appropriate KPI icons (pick one per tile, keep it stable across
  redeploys of the same metric): e.g. `ReceiptIcon` (orders),
  `CurrencyInrIcon`/`CurrencyCircleDollarIcon` (revenue, match the
  project's actual currency), `StorefrontIcon` (active dark stores),
  `UsersIcon` (customers).

---

## Interaction Patterns

- **Clickable KPI tiles:** if a stat tile represents a drill-down (e.g.
  "Orders Today" → `/orders`), the whole `Card` is a `Link`, gets
  `hover:ring-foreground/20` (up from the default `ring-1 ring-foreground/10`)
  and `transition-all duration-200 ease-in-out` (the project's de facto
  motion standard, per `header.tsx`/`sidebar.tsx` — no centralized
  `--duration-*`/`--ease-*` tokens exist yet, so this literal is correct
  until they do). Non-actionable tiles (pure metrics with no drill-down)
  stay static — don't fake affordance with a hover state that goes nowhere.
- **Manual refresh:** an icon-only `Button` (`variant="ghost" size="icon-sm"`)
  with `ArrowClockwiseIcon` and `sr-only` text (following the `ThemeToggle`
  precedent), calling each visible region's `refetch()`. Spins
  (`animate-spin`) only while `isFetching` is true for that specific query —
  never a global spinner for a per-widget refresh.
- **Live-ish data:** given the 10-minute-delivery domain, dashboard queries
  should use TanStack Query's `refetchInterval` (e.g. 30s) plus
  `placeholderData` (keep previous data) on refetch so the UI never flashes
  back to a skeleton for a background refresh — only the very first load
  shows the skeleton. Pair this with a small `text-muted-foreground`
  "Updated {relative time}" caption per widget or per page, not a blocking
  indicator.
- **Time-range scope:** if the dashboard needs a Today/7D/30D switch, put it
  once, at the page or chart-region header level (via `Tabs`, once
  installed) — never duplicate an independent range control per stat tile.
- **Trend direction is never color-only:** always pair `TrendUpIcon`/
  `TrendDownIcon` with the numeric delta text (e.g. "+12%") — color
  reinforces, it doesn't carry the meaning alone (see Accessibility).

---

## Responsive Behavior

The sidebar (`Frontend/src/components/layout/sidebar.tsx`) only reserves
in-flow width at `xl:` (`SIDEBAR_DESKTOP_BREAKPOINT = "(min-width: 1280px)"`,
`dashboard-shell.tsx`'s spacer `div` is `hidden ... xl:block`). Below `xl`
the sidebar is a fixed-position overlay drawer — so "laptop"/"tablet" widths
below 1280px get the **full** viewport width for content, not a
sidebar-narrowed one. Size the dashboard grid against that reality:

| Breakpoint | Width | Stat-tile grid | Chart + Activity row |
|---|---|---|---|
| Desktop | `xl:` ≥1280px | `xl:grid-cols-4` | side-by-side, `xl:grid-cols-3` with chart `xl:col-span-2` |
| Laptop | `lg:` 1024–1279px | `lg:grid-cols-2` (sidebar overlay, not reserved — content is full width, but 4 tight tiles still crowd a laptop viewport) | stacked full width (grid collapses to 1 col below `xl:`) |
| Tablet | `md:`/`sm:` 640–1023px | `sm:grid-cols-2` | stacked full width |
| Mobile | base <640px | `grid-cols-1` | stacked full width |

Concretely: `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">`
for the stat-tile row, and `<div className="grid gap-6 xl:grid-cols-3">` with
`className="xl:col-span-2"` on the chart card for the second row — the
chart+activity split only happens at `xl:`, below that both are full-width
stacked blocks (chart above activity, since it's the higher-priority
region).

The `Chart` region itself must never force page-level horizontal scroll:
give it a fixed responsive height (`h-64 sm:h-72 xl:h-80`) and `w-full`, let
`ChartContainer`/`recharts`' `ResponsiveContainer` handle internal scaling —
never a fixed pixel width.

The activity list scrolls internally past a max height on tablet/laptop
(`max-h-[28rem] overflow-y-auto`) rather than pushing the page taller than
the viewport — consistent with the sidebar nav's own internal-scroll
pattern (`overflow-y-auto` in `sidebar.tsx`'s `<nav>`).

---

## Accessibility

- **Landmarks & headings:** page `h1` (already present in
  `dashboard-page.tsx`), each widget's `CardTitle` renders as an `h2` (wrap
  it, e.g. `<CardTitle asChild><h2>...</h2></CardTitle>` or equivalent —
  never leave widget headings as unlabeled `div`s to a screen reader).
- **Stat tiles:** give each tile a single composed `aria-label` so a screen
  reader announces the metric as one statement, e.g. `aria-label="Orders
  today: 1,284, up 12% from yesterday"` — don't rely on the visual
  arrangement of label/number/icon to convey that on its own.
- **Trend indicators:** `TrendUpIcon`/`TrendDownIcon` are decorative
  (`aria-hidden="true"`) since the composed `aria-label` above already
  states the direction in words — never let the icon be the only accessible
  signal.
- **Icon-only controls:** refresh and retry buttons always carry `sr-only`
  text, per the existing `ThemeToggle`/`Header` sidebar-toggle precedent
  (`<span className="sr-only">...</span>`).
- **Focus states:** every interactive element (clickable KPI `Card`-as-`Link`,
  refresh button, retry button, time-range `Tabs`) resolves focus through the
  existing token-driven ring — `focus-visible:border-ring
  focus-visible:ring-3 focus-visible:ring-ring/50`, the same pattern already
  baked into `button.tsx`'s `buttonVariants`. Don't suppress or reinvent it.
- **Charts:** the `recharts` SVG itself is `aria-hidden` (visual-only); pair
  it with a visually-hidden summary (`sr-only` text or a
  `<table>`-shaped fallback) stating the key trend in words, e.g. "Revenue
  trend, last 7 days, ranging from ₹X to ₹Y" — a chart is never the *only*
  way to get its data.
- **Color contrast:** only via existing tokens (`chart-1..5`, `primary`,
  `destructive`, `muted-foreground`) — they're already contrast-checked in
  both themes; never introduce an unchecked opacity/hex combination for a
  "subtler" look.

---

## Loading

- **Never a spinner for the initial load.** Each region's first render
  (`isLoading`, no cached data yet) shows a skeleton shaped exactly like its
  eventual content, using the shadcn `Skeleton` (once installed):
  - **Stat tiles:** render the same `grid-cols-1 sm:grid-cols-2
    xl:grid-cols-4` grid, each cell a `Card` containing three `Skeleton`
    bars stacked with the tile's real internal `gap` — a short wide bar
    (label), a shorter bar (the big number), a thin narrow bar (trend line)
    — never one giant gray rectangle standing in for the whole tile.
  - **Chart region:** a single `Skeleton` matching the chart's real
    responsive height (`h-64 sm:h-72 xl:h-80 w-full rounded-xl`) inside the
    `Card`'s `CardContent`.
  - **Activity list:** N `Skeleton`-based rows (a small circular `Skeleton`
    standing in for the optional `Avatar`, plus two stacked text-line
    `Skeleton`s) — same row count the real list would show per page (e.g.
    5), not a single block.
- **Background refetch (`isFetching && !isLoading`, i.e. data already
  cached) never re-shows the skeleton.** Combine `placeholderData` (keep
  previous data visible) with a small, non-blocking indicator (e.g. the
  refresh icon spinning, or a "Updating…" caption) — swapping real content
  for a skeleton on every 30s poll is a regression, not a loading state.
- This satisfies `Frontend/AGENTS.md` rule 21 ("every table/form/dashboard/
  list has a proper skeleton loader") per widget, not once for the page.

---

## Error Handling

- **Errors are per-widget, always** — one failing endpoint (e.g. the
  activity-feed query 500s) never blanks the stat tiles or the chart that
  loaded fine. This is why each region owns its own TanStack Query hook
  (`use-dashboard-stats.ts`, `use-recent-activity.ts`, etc.) rather than one
  combined dashboard query.
- **Presentation:** the failed widget's `Card` swaps its body (not its
  `CardHeader`/title — keep the widget's identity visible) for an `Alert`
  (once installed) with `WarningCircleIcon`, a short specific message (e.g.
  "Couldn't load recent activity"), and a `Button` (`variant="outline"
  size="sm"`, `ArrowClockwiseIcon`) calling that query's `refetch()` — never
  a toast-only error for a persistent widget failure (toasts are for
  transient/action-triggered errors, e.g. a failed mutation elsewhere on the
  page).
- **Distinguish failure classes**, per `Frontend/AGENTS.md`'s Error Handling
  rule: a network failure ("Couldn't connect — check your connection") reads
  differently from a permission error ("You don't have access to this
  data") which reads differently from a generic 500 ("Something went wrong
  loading this widget") — never collapse all three into one generic
  message.
- A widget error is never conflated with an empty result (see Empty
  States) — an error means the request failed; empty means it succeeded and
  returned nothing.

---

## Empty States

- **Empty states are per-widget**, extending the existing
  `components/feedback/coming-soon.tsx` shape (`Card` → `CardHeader` →
  `CardTitle` + `CardDescription`) with a Phosphor icon and, where useful, a
  primary action — never one blanket "no data" page when only one region is
  genuinely empty (e.g. a brand-new store with zero orders today still has
  real, current stat tiles at `0`).
- **Stat tiles:** a metric of `0` is real data, not an empty state — render
  it normally (`0`, no trend arrow if there's no prior-period baseline to
  compare against yet, rather than fabricating a `0%`/flat trend). Only
  fall back to a muted `"—"` placeholder when the value is genuinely
  unavailable (not merely zero).
- **Chart region:** when there's no time-series data yet for the selected
  range, replace the chart with a compact empty state inside the same
  `CardContent` — icon (`ChartLineUpIcon` or similar) + "No data for this
  period yet" — never render an empty/blank `recharts` canvas.
- **Activity list:** replace the row list with the `coming-soon.tsx` shape,
  parameterized, e.g. icon `ReceiptIcon`, title "No orders yet today",
  description "New orders will show up here as they come in" — specific to
  the widget's content, never a generic "No data" string (per the
  Premium UI Engineer's Empty States standard).
- Empty is a **success** state with zero items, not a loading or error
  state — never show a skeleton or an `Alert` when the query succeeded and
  simply returned nothing.
