# UI Playbook — Analytics Page

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Owner:** Premium UI Engineer (final authority) · consumed by Frontend Engineer
**Stack:** Next.js App Router + TypeScript + Tailwind CSS + Shadcn UI + Phosphor
Icons (`@phosphor-icons/react`) + TanStack Query
**Applies to:** a dedicated analytics/reporting screen — e.g.
`modules/analytics/pages/analytics-page.tsx` or a per-domain report such as
`modules/analytics/pages/store-performance-report-page.tsx`. Not yet built:
per `.claude/domain/analytics.md`'s Future Growth Considerations, no
Analytics/Reports nav entry or backend module exists today, and per
`.claude/domain/module-registry.md` neither `dashboard` nor `posDashboard` in
`Frontend/src/config/nav.ts` is a real cross-domain analytics surface. This
document specifies the **target** pattern for when that surface is built;
treat every "install X" note as an unmet prerequisite.

---

## Analytics vs. Dashboard — this is not the same playbook twice

`.claude/ui/playbooks/dashboard.md` governs the **at-a-glance summary** view:
a handful of stat tiles plus one or two charts, scoped to "what does today
look like right now," with no user-driven scoping beyond an optional
Today/7D/30D `Tabs` switch on a single chart region. It optimizes for a quick
read on entry to the admin panel.

This document governs the **dedicated deep-dive screen**: a user arrives here
specifically to interrogate a metric — pick an arbitrary date range, switch
between chart types, break a metric down by store/zone/category, and export
the result. Concretely, an Analytics page always has all of the following,
none of which the Dashboard playbook requires:

- A **date-range selector** the user actively controls (not a fixed
  Today/7D/30D tab set) — see Layout.
- **Multiple chart sections**, often for the same underlying metric sliced
  different ways (e.g. GMV trend over time *and* GMV by store), not one
  chart region.
- A **breakdown table** beneath the charts, per `.claude/ui/playbooks/
  data-table.md`, giving the exact per-dimension numbers the charts only
  visualize.
- An **export action**.

Reuse, don't redefine: the KPI summary row at the top of an Analytics page
**is** the Dashboard playbook's `StatTileRow` pattern (same `Card`, same
`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`, same skeleton/error/empty
per-tile rules) — the only difference is that here it reflects the page's
selected date range instead of a fixed "today," per the Interaction Patterns
section below. Do not build a second stat-tile component for this page.

The KPI formulas this playbook must lay out are Analytics-domain-owned, not
invented here — see `.claude/domain/analytics.md`: **GMV**, **AOV**, **Dark
Store Fill Rate**, **Delivery SLA Compliance**, **Repeat Purchase Rate**, and
**Campaign ROI**. Every example below uses these as concrete stand-ins so the
layout is validated against real metric shapes (a time-series line, a
per-store bar breakdown, a ratio-based KPI tile, a composition/ROI chart) —
not against a placeholder "Metric A/B/C."

---

## Prerequisite — install the primitives before building anything

As of this writing, `Frontend/src/components/ui/` contains only: `button`,
`card`, `collapsible`, `dropdown-menu`, `field`, `input`, `label`,
`separator`, `sonner`, `tooltip`. **There is no chart library, `tabs`,
`select`, `skeleton`, or `popover`/date-range-picker component yet.** An
Analytics page cannot be built on the current primitive set. Before writing
any code:

```bash
npx shadcn@latest add chart select tabs skeleton popover
```

- `chart` pulls in `recharts` and generates `components/ui/chart.tsx`
  (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`,
  `ChartConfig`). **This is the only sanctioned charting path** — same rule
  as the Dashboard playbook. Do not add a second charting library and do not
  hand-roll SVG charts for this page just because it has more chart variety
  than the dashboard.
- `select` powers the period selector (see Layout).
- `tabs` powers metric-category switching when a page covers more than one
  KPI family (e.g. a "Commerce" tab vs. a "Fulfillment" tab within one
  Analytics page).
- `skeleton` powers every loading placeholder (stat tiles, charts, table
  rows) per Loading.
- `popover` is the base primitive a custom-date-range control needs (a
  `Popover` containing two date inputs or a calendar) — there is no
  shadcn-generated calendar/date-range-picker component installed either;
  if the Feature Design calls for true custom-range picking beyond preset
  buckets, that calendar UI is a separate build task, flagged here as a
  second prerequisite, not assumed to ship with `popover` alone.

Per `Frontend/components.json`'s `"iconLibrary": "lucide"`, swap any
generated Lucide icons in these files for Phosphor equivalents, consistent
with every other installed primitive in this codebase (see icon mapping
below).

---

## Layout

An Analytics page is always four stacked regions, in this fixed order, never
reordered per-module:

```
<div className="flex flex-col gap-6">              {/* page: same gap-6 rhythm as dashboard-page.tsx */}
  <PageHeader />                                     {/* h1 + subtitle + ExportAction (top-right) */}

  <PeriodSelectorBar />                               {/* region 1: date-range control, page-scoped */}

  <StatTileRow />                                     {/* region 2: KPI summary — reuses dashboard.md's StatTileRow */}

  <div className="grid gap-6 xl:grid-cols-2">         {/* region 3: chart sections */}
    <ChartCard metric="gmv-trend" type="line" />       {/*   e.g. GMV over time */}
    <ChartCard metric="gmv-by-store" type="bar" />      {/*   e.g. GMV by dark store */}
    <ChartCard metric="campaign-roi" type="bar" />       {/*   e.g. Campaign ROI comparison */}
    <ChartCard metric="fulfillment-mix" type="pie" />     {/*   e.g. fulfilled/substituted/cancelled mix */}
  </div>

  <BreakdownTableCard />                              {/* region 4: per-dimension detail table */}
</div>
```

This composes inside the existing shell exactly as the Dashboard playbook
does — `Frontend/src/components/layout/dashboard-shell.tsx` already supplies
the page's max-width and outer padding (`mx-auto max-w-screen-2xl p-4
md:p-6 2xl:p-10`). An Analytics page never re-declares its own container.

**Region 1 — Period selector bar.** A single `Card`-less row (or a slim
bordered bar, `border-b pb-4`) directly under the page header:

```
<div className="flex flex-wrap items-center justify-between gap-3">
  <Select>                        {/* "Last 7 days" / "Last 30 days" / "This month" / "Custom" */}
  <span className="text-sm text-muted-foreground">as of {lastUpdatedTimestamp}</span>
</div>
```

Use a shadcn `Select` (installed above) with fixed presets as the default
control — a segmented `Tabs`-as-buttons variant is acceptable if the Feature
Design specifies exactly 3–4 presets and no true custom range; don't build
both. If "Custom" is selectable, it opens a `Popover` with a from/to date
picker (see Prerequisites) rather than navigating away from the page. Per
`.claude/domain/analytics.md`'s freshness-contract rule, always show the
report's "as of" timestamp next to the selector — every historical report
must state its own freshness explicitly, and this is the one place on the
page to say it once for every widget below.

**Region 2 — KPI summary row.** Identical component to Dashboard's
`StatTileRow` (`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4`, one
`Card` per tile), populated with the page's headline metrics for the
*selected period* — e.g. GMV, AOV, Fill Rate, SLA Compliance as the four
tiles on a general Analytics overview, or a narrower set on a focused report
page (e.g. a Campaign Performance report tiles Campaign ROI, Conversion
Lift, Redemptions, Incremental GMV instead). Do not reimplement the tile
component here — import it from `modules/dashboard/components/` or, if it's
promoted to a shared primitive once a second consumer exists, from
`components/common/`, per `Frontend/AGENTS.md` rule 24 (reuse before
creating).

**Region 3 — Chart sections.** A responsive grid of `ChartCard`s, `xl:grid-
cols-2` (two charts per row on desktop, stacked below `xl:` — same
breakpoint reality as Dashboard's chart+activity row, since the sidebar only
reserves width at `xl:`). Each `ChartCard` is one `Card` with:

- `CardHeader`: `CardTitle` naming the exact metric + scope (e.g. "GMV
  Trend — All Stores"), `CardDescription` stating the period in words if not
  obvious, and a `CardAction` slot for a per-chart secondary control if truly
  needed (e.g. a series toggle — see Responsive Behavior) — never a second
  independent date-range control here (see Interaction Patterns).
- `CardContent`: the `ChartContainer`-wrapped `recharts` chart, chosen per
  metric shape, not by default habit:
  - **Line chart** — time-series metrics (GMV trend, AOV trend, SLA
    Compliance trend over the period's days/weeks).
  - **Bar chart** — categorical breakdowns (GMV by store, Fill Rate by dark
    store, Campaign ROI by campaign) — grouped/stacked bars when comparing
    2+ series per category (e.g. fulfilled vs. substituted vs. cancelled
    counts per store).
  - **Pie/donut chart** — a single-period compositional mix with few
    segments (e.g. order outcome mix: fulfilled/substituted/cancelled) —
    never for more than ~5 segments (matches the 5 available `--chart-*`
    tokens exactly) and never for a trend over time (a pie cannot show
    change over time — use a line or stacked bar instead).
- Every chart's series color comes from a `ChartConfig` mapping each series,
  in order, to `var(--chart-1)` through `var(--chart-5)` (already defined
  with separate light/dark values in `Frontend/src/app/globals.css`) — never
  a new hex/oklch literal. A chart with more than 5 series is a sign the
  breakdown belongs in the table below instead, not a 6th invented color.

**Region 4 — Breakdown table.** One `Card` containing a per-dimension detail
table (e.g. every store's GMV, AOV, Fill Rate, SLA Compliance side by side)
— this is `.claude/ui/playbooks/data-table.md`'s pattern verbatim (toolbar +
`Table` + footer pagination, `Skeleton` rows, per-row `Badge`s for
qualitative flags like "New store — insufficient data" per
`.claude/domain/analytics.md`'s partial-period rule). Do not re-derive table
behavior here; this section only states that the table exists as the fourth
region and inherits the selected period from Region 1 (see Interaction
Patterns).

**Module structure** (per `Frontend/AGENTS.md` rules 1–3, feature-first):
- `modules/analytics/pages/analytics-page.tsx` — composition only, owns the
  page-level period-selector state, no fetching logic itself.
- `modules/analytics/components/period-selector-bar.tsx` — the `Select`/
  `Popover` control, lifts its value up to the page.
- `modules/analytics/components/chart-card.tsx` (or one component per chart
  type: `gmv-trend-chart-card.tsx`, `store-breakdown-chart-card.tsx`, etc.,
  per rule 26/27 — prefer small composed components over one polymorphic
  mega-chart component once more than 2–3 chart variants exist).
- `modules/analytics/components/breakdown-table.tsx` — Region 4, built on
  the shared `Table` primitives per the Data Table playbook.
- `modules/analytics/hooks/use-analytics-summary.ts`,
  `use-gmv-trend.ts`, `use-store-breakdown.ts`, etc. — one TanStack Query
  hook per independently-loadable widget, all keyed off the same
  page-level `period` value (see Interaction Patterns and Error Handling).
- `modules/analytics/api/analytics-api.ts` — the only place calling
  `backendFetch` for this module.
- `modules/analytics/constants/query-keys.ts` — centralized query keys
  (rule 18), each including the `period` so a range change produces a new
  cache entry rather than mutating one in place.

---

## Spacing

- **Page-level rhythm:** `gap-6` between the period-selector bar, the
  KPI row, the chart grid, and the breakdown table — identical top-level
  rhythm to the Dashboard playbook's three-region `gap-6`, just extended to
  four regions here.
- **Grid gutters:** `gap-4` inside the `StatTileRow` grid; `gap-6` between
  chart cards in the Region 3 grid (charts are heavier visual units than
  stat tiles, so they get the wider "region-separating" gap, not the
  tighter `gap-4` reserved for same-row tile density — don't mix the two at
  the chart grid's nesting depth).
- **Card internals:** never hand-roll padding inside `CardContent`/
  `CardHeader` — `card.tsx`'s `--card-spacing` token already governs it.
  Chart cards use the default (`--spacing(4)`) size, not `size="sm"` — charts
  need breathing room the denser stat tiles don't.
- **Chart-to-legend spacing:** if a `ChartLegend` renders below the chart
  (multi-series line/bar), leave `pt-2` between the `ChartContainer` and the
  legend — don't let the legend crowd the plotted area's x-axis labels.
- **Typography:** page `h1` = `text-3xl font-semibold tracking-tight`,
  subtitle = `text-muted-foreground` (same as Dashboard). `CardTitle` stays
  the fixed `font-heading text-base font-medium` from `card.tsx` for every
  chart/table card title — don't size chart titles differently just because
  the chart itself is visually larger. Stat tiles reuse Dashboard's `text-2xl
  font-semibold tabular-nums`.
- **Radius:** inherited from `Card` (`rounded-xl`) throughout — charts,
  tables, and tiles never introduce a competing radius.

---

## Recommended Components

**Already available in `Frontend/src/components/ui/`** — use as-is:
- `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` /
  `CardFooter` / `CardAction` — container for every chart, the KPI tiles,
  and the breakdown table.
- `Button` (`variant="outline"` / `"ghost"`, `size="sm"`) — retry actions,
  the export action, per-chart secondary controls.
- `Tooltip` — non-chart hover affordances (e.g. an info icon explaining a
  metric's formula inline, sourced from `.claude/domain/analytics.md`'s
  definitions so the explanation never drifts from the domain's formula).
- `Separator` — between the period-selector bar and the KPI row if a
  hairline reads better than `gap` alone on a dense page.

**Not installed yet — install per Prerequisites above:**
- `Select` — the period-preset control ("Last 7 days" / "Last 30 days" /
  "This month" / "Custom").
- `Tabs` — metric-category switching (only if the page genuinely spans
  multiple KPI families; a single-topic report page, e.g. "Campaign ROI
  Report," does not need `Tabs` at all).
- `Chart` primitives (`ChartContainer`, `ChartTooltip`,
  `ChartTooltipContent`, `ChartLegend`, `ChartConfig`) — every chart on this
  page, no exceptions.
- `Skeleton` — every loading placeholder (see Loading).
- `Popover` — the base for the custom-date-range control.
- `Badge` (install alongside per the Data Table playbook if the breakdown
  table needs status pills — e.g. "New store" / "Insufficient data" per
  `.claude/domain/analytics.md`'s partial-period business rule).

**Icon mapping (Phosphor, `@phosphor-icons/react`, `Icon` suffix
convention):**
- `CalendarBlankIcon` — period-selector trigger.
- `ChartLineUpIcon` — line-chart card titles / trend-type chart headers.
- `ChartBarIcon` — bar-chart card titles / breakdown-type chart headers.
- `ChartPieSliceIcon` — pie/donut chart card titles.
- `DownloadSimpleIcon` — the export action (CSV/PDF).
- `ArrowClockwiseIcon` — per-widget retry, same convention as Dashboard.
- `WarningCircleIcon` — per-widget error state, inside `Alert`.
- `InfoIcon` — inline metric-formula explainer trigger (paired with
  `Tooltip`), e.g. clarifying that "Fill Rate" excludes substitutions per
  the domain doc's exact formula.
- `TrendUpIcon` / `TrendDownIcon` — KPI tile deltas, identical usage to
  Dashboard (never color-only — see Accessibility).

---

## Interaction Patterns

- **One period, page-wide.** Changing the date-range `Select` (or
  confirming a custom range in the `Popover`) updates a single page-level
  `period` value that every widget's query key depends on — the KPI row,
  every chart, and the breakdown table **all** refetch together against the
  new range. No widget on this page keeps its own independent date control;
  that would let widgets silently drift to different ranges and make the
  page internally inconsistent (a GMV tile for "Last 7 days" next to a chart
  still showing "Last 30 days" is a defect, not a feature). This is the one
  interaction rule that most distinguishes this page from a plain dashboard.
- **Chart tooltips show exact values, always.** Every chart uses
  `ChartTooltip`/`ChartTooltipContent` so hovering a point/bar/slice
  surfaces the precise number (e.g. "GMV: ₹4,82,300" not just the bar's
  visual height) plus the series label and, where relevant, the exact date/
  bucket. A chart is a visual summary; the tooltip is where the real number
  lives — never make a user estimate a value from pixel height alone.
- **Export is secondary, always.** An export action (CSV/PDF) lives in the
  `PageHeader`'s top-right, rendered as `Button variant="outline" size="sm"`
  with `DownloadSimpleIcon` — it never competes visually with the page's
  primary content (the charts/table), never sits inside the period-selector
  bar (which is a page-state control, not an action), and is disabled (not
  hidden) while the underlying data for the current period is still loading
  or errored, since exporting a half-loaded page produces a misleading
  file.
- **Metric-category switching (`Tabs`), if used,** only changes which chart
  sections/breakdown table are visible — it never changes the selected
  period, and it never triggers a different set of KPI tiles disappearing
  without a visible reason (if tiles genuinely differ per tab, treat each
  tab as effectively a different page-view with its own `StatTileRow`
  instance, not a partial swap that looks like tiles vanished).
- **Drill-down from chart to table.** Clicking a bar/segment in a breakdown
  chart (e.g. a specific store's bar in "GMV by Store") may filter/highlight
  the corresponding row in the breakdown table below — an enhancement, not
  a requirement, but if implemented, it filters the table in place (scroll
  it into view, highlight the row) rather than navigating away from the
  Analytics page.
- **"As of" timestamp.** Per `.claude/domain/analytics.md`'s freshness-
  contract rule, near-real-time metrics and batch-reconciled ones must be
  visibly labeled as such wherever they're shown. If a page mixes freshness
  tiers (e.g. a live "today" tile next to a daily-batch trend chart), label
  each affected widget individually ("Live, provisional" vs. "As of {date},
  reconciled") rather than a single blanket page-level timestamp implying
  uniform freshness.

---

## Responsive Behavior

Same viewport reality as the Dashboard playbook: the sidebar
(`Frontend/src/components/layout/sidebar.tsx`) only reserves in-flow width
at `xl:` (`SIDEBAR_DESKTOP_BREAKPOINT = "(min-width: 1280px)"`), so laptop/
tablet widths below 1280px get the full viewport, not a sidebar-narrowed one.

| Breakpoint | Width | KPI row | Chart grid | Breakdown table |
|---|---|---|---|---|
| Desktop | `xl:` ≥1280px | `xl:grid-cols-4` | `xl:grid-cols-2` (2 charts/row) | full table view |
| Laptop | `lg:` 1024–1279px | `lg:grid-cols-2` | `grid-cols-1` (stacked, grid collapses below `xl:`) | full table view |
| Tablet | `md:`/`sm:` 640–1023px | `sm:grid-cols-2` | `grid-cols-1` | full table view, `overflow-x-auto` |
| Mobile | base <640px | `grid-cols-1` | `grid-cols-1` | card-per-row (per Data Table playbook §5) |

- **Charts resize fluidly, never at a fixed pixel width.** Every
  `ChartContainer` is `w-full` with a fixed *responsive height* (e.g. `h-64
  sm:h-72 xl:h-80`, matching Dashboard's chart-region convention exactly),
  letting `recharts`' `ResponsiveContainer` handle internal scaling as the
  card's width changes across breakpoints.
- **Mobile multi-series simplification.** A line/bar chart with multiple
  series (e.g. GMV by store with 5+ stores, one per `--chart-*` token) reads
  fine at `xl:` width but becomes unreadable crammed into a mobile-width
  card. The recommended mobile fallback is **not** to keep rendering all
  series at a shrunken scale — instead, add a lightweight series toggle
  (a `Select` or small button group in the `ChartCard`'s `CardAction` slot,
  visible only below `md:`) that shows **one series at a time** on mobile,
  defaulting to the top/most-relevant series (e.g. the store with the
  highest GMV, or whichever the breakdown table's default sort surfaces
  first). Desktop/tablet continue showing the full multi-series chart
  since there's room for the legend and distinguishable colors. State this
  explicitly in the chart component's implementation — don't silently drop
  series with no user-visible toggle, and don't force horizontal scroll on
  a chart (unlike a table, a scrolled chart cannot be read at a glance).
- **Breakdown table** follows `.claude/ui/playbooks/data-table.md` §5
  verbatim: `overflow-x-auto` wrapper down to `md:`, full card-per-row
  collapse below `md:` for tables with more than ~4–5 meaningful columns
  (a per-store breakdown with GMV/AOV/Fill Rate/SLA columns qualifies).
- **Period-selector bar and export action** wrap (`flex-wrap`) rather than
  overflow on narrow viewports, consistent with the Data Table playbook's
  toolbar-wrapping rule.

---

## Accessibility

- **Landmarks & headings:** page `h1` in `PageHeader`; every chart card,
  KPI tile group, and the breakdown table's `CardTitle` renders as an `h2`
  (same `<CardTitle asChild><h2>...</h2></CardTitle>` pattern as Dashboard)
  — never an unlabeled `div` heading.
- **Charts are never the only way to get the data.** Per
  `Frontend/AGENTS.md`'s accessibility rules and the Dashboard playbook's
  precedent, every chart's `recharts` SVG is visual-only (effectively
  `aria-hidden` to a screen reader) and must be paired with a text-based
  alternative — one of:
  - A visually-hidden (`sr-only`) summary stating the key trend in words,
    e.g. "GMV trend, last 30 days, ranging from ₹X to ₹Y, trending up 8%"
    — acceptable for a simple single-series trend chart.
  - A visually-hidden `<table>`-shaped fallback reproducing the chart's
    exact data points — required for any multi-series or categorical
    breakdown chart (bar-by-store, pie composition) where a prose summary
    would lose information a sighted user gets from the visual. This is
    not optional decoration: a chart with no text alternative is not an
    accessible chart, full stop, regardless of how good its `ChartTooltip`
    is (a tooltip requires hover/focus per data point and is not a
    substitute for a single reachable summary).
  - Where the breakdown table (Region 4) already contains the exact same
    numbers a chart visualizes, the chart's `sr-only` alternative may
    simply reference it ("See the table below for exact per-store
    figures") rather than duplicating a second hidden table — but only
    when the table is genuinely on the same page and covers the same
    data; a summary chart with no corresponding table row still needs its
    own text alternative.
- **Stat tiles:** identical rule to Dashboard — one composed `aria-label`
  per tile stating the metric, value, and trend as one sentence.
- **Trend indicators:** `TrendUpIcon`/`TrendDownIcon` are `aria-hidden`,
  color is never the sole signal (paired with "+"/"−" text and the
  composed `aria-label`).
- **Icon-only controls:** export button, retry buttons, and the mobile
  series-toggle (if icon-only) all carry `sr-only` text or `aria-label`.
- **Keyboard:** the period `Select`, any `Tabs`, chart tooltips (`recharts`
  supports keyboard-triggered tooltips via focusable chart elements — verify
  the generated `chart.tsx` preserves this, don't strip focus handlers), the
  export button, and the full breakdown table (per the Data Table
  playbook's keyboard rule) must all be operable via Tab/Shift+Tab and
  Enter/Space alone.
- **Focus states:** every interactive element resolves focus through the
  existing token-driven ring (`focus-visible:border-ring
  focus-visible:ring-3 focus-visible:ring-ring/50`) — no exceptions for
  chart-adjacent controls just because they're new to this page.
- **Color contrast:** chart series colors are only ever `--chart-1`
  through `--chart-5` — already contrast-checked in both light and dark
  themes in `globals.css`. Never introduce a 6th ad hoc color for "one more
  series"; if a breakdown genuinely needs more than 5 categories, move the
  excess into an "Other" aggregate series or push the detail into the
  breakdown table instead of stretching the token set.

---

## Loading

Every widget on this page loads independently and shows its own skeleton —
same principle as Dashboard, extended to more widget types:

- **Period selector bar:** does not skeleton-load; render it immediately
  with its default preset selected (it has no server dependency of its own)
  so the user can already interact with period selection while the widgets
  below load against the default range.
- **KPI tiles:** identical to Dashboard's `StatTileRow` skeleton — the real
  grid shape, each cell a `Card` with three stacked `Skeleton` bars (label,
  number, trend line).
- **Chart cards:** a single `Skeleton` matching the chart's real responsive
  height and full width (`h-64 sm:h-72 xl:h-80 w-full rounded-xl`) inside
  `CardContent` — one gray rectangle at the chart's aspect ratio, exactly as
  specified for Dashboard's chart region, applied per chart card here since
  there are several.
- **Breakdown table:** full table shell skeleton per the Data Table
  playbook §7 — real header row, `Skeleton`-filled body rows matching the
  expected page size, toolbar rendered but inert.
- **Background refetch on period change** (`isFetching`, data already
  cached from a prior period) never tears every widget back down to a full
  skeleton. Use `placeholderData` to keep the previous period's values
  visible with a subtle in-place indicator (reduced opacity on chart/tile
  content, disabled period selector, or a small "Updating…" caption) while
  the new period's data streams in — reserve the full-skeleton treatment
  for each widget's true first load only. This matters more here than on
  Dashboard, since changing the period is the page's core, frequent
  interaction, not an occasional background poll.

---

## Error Handling

- **Errors are per-widget, always** — a failed KPI-summary fetch, a failed
  single chart's data fetch, or a failed breakdown-table fetch each fail
  independently, because each is its own TanStack Query hook keyed off the
  shared `period` value. One chart erroring never blanks the KPI row, the
  other charts, or the table that loaded fine — same principle as
  Dashboard, just with more independent widgets to isolate.
- **Presentation:** the failed widget's `Card` keeps its `CardHeader`/title
  visible (so the user still knows which metric failed) and swaps its body
  for an `Alert` with `WarningCircleIcon`, a short specific message (e.g.
  "Couldn't load GMV trend for this period"), and a `Button variant="outline"
  size="sm"` with `ArrowClockwiseIcon` calling that widget's own
  `refetch()`.
- **Distinguish failure classes**, per `Frontend/AGENTS.md`: a network
  failure reads differently from a permission error (e.g. a report scoped
  to a store the admin doesn't have access to) which reads differently
  from a generic 500 — never collapse all three into one generic message.
- **A cross-domain data-quality flag is not the same as a fetch error.**
  Per `.claude/domain/analytics.md`'s edge cases (e.g. Commerce marking an
  order "delivered" with no matching Operations completion event), a
  successfully-fetched metric that carries a data-quality discrepancy flag
  from the backend renders normally with a visible inline notice (e.g. a
  small `WarningCircleIcon` + `Tooltip` on the affected tile/chart reading
  "Data discrepancy detected for this period — figures may be provisional")
  rather than as a widget error state. The request succeeded; the
  underlying data has a flagged inconsistency — these are different
  states and must look different.
- **Export failures** surface via the existing `sonner` toast pattern
  (`toast.error(...)`), not an inline page error — exporting is a
  transient, action-triggered operation, not a persistent widget's load
  state, consistent with the Dashboard playbook's toast-vs-inline-error
  distinction.

---

## Empty States

- **Empty states are per-widget and per-period**, never one blanket
  page-level "no data" screen — a store that genuinely has zero orders in
  the selected period still has other widgets (e.g. a platform-wide GMV
  trend) that may show real data.
- **KPI tiles:** a metric of `0` (or a ratio of `0%`) for the selected
  period is only rendered as-is when it's a *real* zero for an established
  store/period. Per `.claude/domain/analytics.md`'s explicit edge case, a
  brand-new dark store with zero completed orders must render its ratio
  metrics (Fill Rate, SLA Compliance, AOV) as an explicit **"No data yet"**
  state on the tile — never as a `0%`/`0` value and never as a
  divide-by-zero error — and must not be folded into a platform-wide
  average as if it were a real zero. Use a muted `"—"` in place of the
  number plus a small caption ("No orders yet this period") rather than a
  fabricated flat trend arrow.
- **Chart sections:** when a chart's underlying query succeeds but returns
  no data points for the selected period (a genuinely quiet period, not a
  loading or error state), replace the chart with a compact empty state
  inside the same `CardContent` — icon (`ChartLineUpIcon`/`ChartBarIcon`/
  `ChartPieSliceIcon` matching the chart's own type) + "No data for this
  period" +, where useful, a one-line hint ("Try a wider date range") —
  never render a blank/broken `recharts` canvas with empty axes. This is
  the single most likely empty state on this page (any custom range a user
  picks can land on a quiet window) and must be handled explicitly per
  chart, not assumed away.
- **Breakdown table:** follows the Data Table playbook's two distinct empty
  states — "no data at all for this period" (e.g. a new store, before any
  orders exist) vs. "no rows match the current in-table filter/search" —
  keep the table's toolbar visible and interactive in both cases, no
  footer pagination when there's nothing to paginate.
- **Partial-period stores in cross-store views.** Per
  `.claude/domain/analytics.md`'s business rule, a store that opened
  mid-period (or closed temporarily) must never appear in a ranked
  breakdown chart/table as simply a low performer — either exclude it from
  the ranked comparison and surface it in a separate "New stores —
  insufficient data" group (a `Badge` in the breakdown table, a footnote
  under the relevant chart), or prorate its figure, per whichever rule the
  backend's `MetricDefinition` applies. The UI's job is to make that
  eligibility rule visible, not to silently omit or silently misrank the
  store.
- Empty is always a **success** state with zero/insufficient data, never a
  loading or error state — never substitute a skeleton or an `Alert` for a
  query that succeeded and legitimately returned nothing.
