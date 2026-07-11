# UI Playbook — Data Table

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Stack:** Next.js App Router + TypeScript + Tailwind CSS + Shadcn UI (`base-nova` style, `neutral` base color) + Phosphor Icons + TanStack Query
**Applies to:** any list surface with more than ~5 rows and more than 1 column of structured data — products, orders, customers, sellers, coupons, users, roles, etc.

Visual bar: this must read like Linear's issue list or the Stripe Dashboard transaction table — dense, quiet, confident typography, no visual noise. Never a bare `<table>` with default browser borders, never `<div>` rows pretending to be a table.

---

## 0. Prerequisite — install the primitives before building anything

As of this writing, `Frontend/src/components/ui/` contains only: `button`, `card`, `collapsible`, `dropdown-menu`, `field`, `input`, `label`, `separator`, `sonner`, `tooltip`. **There is no `table`, `badge`, `skeleton`, `checkbox`, or `pagination` component yet.**

Before building any data table, run:

```bash
npx shadcn@latest add table badge skeleton checkbox pagination
```

Do not hand-roll a table out of `<div>` grids or hand-roll a status pill out of a `<span>` with inline Tailwind color classes — that duplicates what the CLI installs and immediately diverges from the design system (violates `Frontend/AGENTS.md` rule 24: reuse before creating, and rule 38: never introduce a second way to solve the same problem).

`Frontend/components.json` has `"iconLibrary": "lucide"`, so the CLI-generated `table.tsx` / `badge.tsx` / `pagination.tsx` files will ship with no icons, or with Lucide icons if a block happens to include one. **Replace/add any icon in these files with Phosphor** (`@phosphor-icons/react`), since Lucide is not used anywhere else in this codebase. Standard mapping for this pattern:

| Purpose | Icon |
|---|---|
| Sort ascending indicator | `CaretUpIcon` |
| Sort descending indicator | `CaretDownIcon` |
| Filter trigger | `FunnelIcon` |
| Row-actions trigger (last column) | `DotsThreeIcon` (`weight="bold"`) |
| Toolbar search input | `MagnifyingGlassIcon` |

Per `Frontend/AGENTS.md`, the generated `Table`, `Badge`, `Skeleton`, `Checkbox`, `Pagination` primitives belong in `components/ui/` (shared, framework-level). The composed `<ProductsTable />`, `<OrdersTable />`, etc. — with their columns, query hooks, and row-action wiring — belong in each feature's `modules/{feature}/components/`, not in shared `components/tables/` (that folder is reserved for a genuinely feature-agnostic `DataTable` wrapper, if one gets built later).

---

## Layout

A data table view is always a **toolbar + table + footer pagination** stack inside a `Card` (or a bare section if the page itself already provides card framing — don't double-wrap).

```
┌─────────────────────────────────────────────────────────────┐
│ [Search input]        [Filter ▾]      [Bulk bar | + Add New] │  ← toolbar row
├─────────────────────────────────────────────────────────────┤
│ ☐ │ Column A ⌃ │ Column B │ Column C │ Status │        ⋯      │  ← header row
├───┼────────────┼──────────┼──────────┼────────┼──────────────┤
│ ☐ │ ...        │ ...      │ ...      │ Badge  │        ⋯      │  ← body rows
├─────────────────────────────────────────────────────────────┤
│ 12 of 128 results                     [< 1 2 3 … 11 >]        │  ← footer
└─────────────────────────────────────────────────────────────┘
```

**Toolbar row** (`flex items-center justify-between gap-3`, `pb-4`):
- Left cluster: search `Input` with `MagnifyingGlassIcon` positioned absolutely inside it (`relative` wrapper, icon at `left-3 top-1/2 -translate-y-1/2`, input `pl-9`), followed by a filter trigger button (`Button variant="outline"`, `FunnelIcon` + label, opens a `DropdownMenu` or a filter panel — never a second modal for simple filters).
- Right cluster: **normally** the primary action button (`Button` default variant, e.g. "Add Product"). **When one or more rows are selected**, the right cluster is replaced by the bulk-action bar: a muted pill showing the selection count ("3 selected") plus the bulk-action buttons (e.g. "Delete", "Export", "Deactivate"), and the primary action button is hidden. Never show both simultaneously — the bulk bar is a state substitution for the toolbar's right side, not an addition below it.

**Table:**
- Header row: every sortable column header is a `<button>` (not a plain `<th>` text node) wrapping the label and a caret icon, with `aria-sort` set on the parent `<th>` (`"ascending" | "descending" | "none"`).
- Leading column: a `Checkbox` for row selection, only present if bulk actions apply to this table. A header checkbox selects/deselects all rows on the current page (with an indeterminate state when some-but-not-all are selected).
- Status-bearing columns render a `Badge`, never plain colored text.
- Trailing column: a single `DotsThreeIcon` icon-button that opens a `DropdownMenu` with the row actions (View, Edit, Deactivate, Delete, etc.). This column has no header label (visually), just an `sr-only` "Actions" header for accessibility, and is pinned last, never first.

**Footer:** a result-count string on the left ("Showing 21–40 of 128") and the `Pagination` control on the right, inside the same `Card`/container as the table, not a separate block below it.

---

## Spacing

Follow `Frontend/AGENTS.md` rule 12 — no arbitrary spacing values, use the Tailwind scale consistently:

- Table container padding (if wrapped in `Card`): `p-0` on the `Card` with the toolbar and pagination getting their own `px-4 py-3` / `px-6 py-4` bands, so the table's own row dividers run edge-to-edge inside the card without double-padding.
- Toolbar row: `gap-3` between controls, `py-3` (compact) matching the `h-14` rhythm already used by `header.tsx`.
- Table cell padding: `px-4 py-3` for standard density, `px-3 py-2` for a "compact" density variant if a module explicitly needs to show more rows (e.g. live order queues) — pick one density per table, never mix.
- Header row height: matches one cell padding step less than body rows (`py-2.5`) to visually separate it as a label row, not a data row.
- Gap between toolbar and table: `mt-0` if the toolbar sits inside the same bordered card as a `border-b` divider; otherwise `gap-4` between the toolbar block and the table block.
- Badge internal padding stays whatever the installed `badge.tsx` variant defines by default — do not override with arbitrary `px-*`/`py-*` per usage; if a size is wrong, add a variant to the component, not a one-off className.

---

## Recommended Components

| Need | Component | Notes |
|---|---|---|
| Table structure | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Install first — see Section 0. Never a raw `<table>`. |
| Row selection | `Checkbox` | Header checkbox = select-all-on-page; row checkbox = select-one. Selection state lives in the feature module's list-page component state (or a small hook), not Zustand — it's page-local UI state, not global. |
| Status columns | `Badge` | Map variant to status **meaning**, not to whichever color looks nice: `bg-primary`/`text-primary-foreground` for the positive/active/completed state, `bg-muted`/`text-muted-foreground` for neutral/inactive/draft, `bg-destructive`/`text-destructive-foreground` for failed/blocked/error. There is currently no dedicated "warning"/"pending" token in `globals.css` (only `primary`, `secondary`, `muted`, `accent`, `destructive`, `chart-1..5`) — for an in-between state (e.g. "Pending", "Processing"), use the `accent` token rather than inventing a raw color, and flag it if a true warning token is needed across enough modules to justify adding one (per rule 10: add a token first, don't hardcode). |
| Loading rows | `Skeleton` | See Section 7. |
| Row actions | `DropdownMenu` (already installed) | Trigger is an icon-only `Button variant="ghost" size="icon"` containing `DotsThreeIcon`; content lists actions with destructive ones (Delete) visually separated via `DropdownMenuSeparator` and colored via the menu item's destructive variant, not manual red text. |
| Pagination | `Pagination` | Footer of the table region. Drives `page`/`pageSize` query params consumed by TanStack Query — see Section 4. |
| Toolbar search | `Input` (installed) + `MagnifyingGlassIcon` | See Section 1. |
| Filter trigger | `Button` + `FunnelIcon`, opening `DropdownMenu` (simple filters) | For multi-field filters, a `Collapsible` panel (already installed) below the toolbar is acceptable; don't reach for a dialog unless the filter set is genuinely large. |
| Bulk-action bar | Composed inline from `Button` + a muted count pill | Not a separate shadcn primitive — build it as a small local component inside the feature module. |

---

## Interaction Patterns

- **Sorting.** Clicking a sortable header button cycles `none → ascending → descending → none`. The clicked column's `aria-sort` and caret icon reflect the current state (`CaretUpIcon` for ascending, `CaretDownIcon` for descending, no icon — or a low-opacity neutral caret — for unsorted). Only one column is sorted at a time; sorting a new column resets any previous one to `none`. Sort state is a query param (e.g. `sort=name:asc`) driving the TanStack Query key, never client-side array sorting of already-fetched data once the dataset is paginated server-side.
- **Search.** The toolbar search input is debounced (300ms via the shared `useDebounce` hook per `Frontend/AGENTS.md` rule 6 — reuse it, don't reimplement) before it updates the query param that feeds the TanStack Query key. Typing never fires a request per keystroke.
- **Bulk actions.** Bulk-action buttons are disabled (not hidden) when 0 rows are selected on the surrounding toolbar's default state; the bulk bar itself only *appears* once ≥1 row is selected, replacing the toolbar's primary-action cluster, and always shows the live count ("3 selected", "1 selected" — not "1 selecteds"). Deselecting all rows collapses the bulk bar back to the default toolbar in the same transition duration as the rest of the app (`duration-200 ease-in-out`, matching `sidebar.tsx`/`header.tsx`).
- **Row click.** Convention for this codebase: **the row itself does not navigate.** Only an explicit action navigates or opens detail — either a "View" item in the row's `DropdownMenu`, or (if the primary column value is meant to be the entry point) that cell's value renders as a `Link`/button, visually distinguished (e.g. `text-primary underline-offset-4 hover:underline`). This avoids the classic conflict between "row click navigates" and "row click toggles the checkbox/opens the menu," and keeps behavior predictable once bulk selection is added to a table that didn't originally have it. State this convention once here and follow it in every module — don't let individual features invent per-table row-click behavior.
- **Row-action menu.** Opens on click of the trailing `DotsThreeIcon` button; standard order is view-oriented actions first, mutating actions in the middle, destructive actions last (separated by `DropdownMenuSeparator`, rendered in the menu's destructive variant — never manually colored red text).

---

## Responsive Behavior

Per `Frontend/AGENTS.md`, the page itself must never scroll horizontally. The table therefore owns its own horizontal scroll container:

- Wrap `Table` in a dedicated `div` with `overflow-x-auto` (this is what the installed `table.tsx` typically provides via its wrapper — confirm after running the CLI add, don't strip it) so that below the tablet breakpoint (`md`, matching the `md:px-6` breakpoint already used in `header.tsx`) the table scrolls within its own bounded region, not the page.
- Keep the leading checkbox column and the trailing actions column reasonably sticky-friendly (avoid putting critical identifying info only in a column that scrolls out of view) — the first data column (usually name/ID) should be the one users still recognize the row by while scrolled.
- **Mobile fallback for wide tables:** when a table has more than ~4-5 meaningful columns, collapse to a **card-per-row layout** below `md` instead of forcing horizontal scroll on a phone screen: each row renders as a `Card` with the primary field as a heading, secondary fields as label/value pairs stacked below, the `Badge` in the top-right of the card, and the row-actions `DotsThreeIcon` menu in the same corner. Use Tailwind's responsive display utilities to swap layout (`hidden md:block` on the `Table` wrapper, `block md:hidden` on the card-list wrapper) rather than reflowing the same DOM with CSS — the data-fetching/selection/sort state stays identical between both renderings, only the presentation markup differs.
- Toolbar controls wrap (`flex-wrap`) rather than overflow on narrow viewports; the search input takes full width on mobile with filter/action buttons below it if they don't fit on one line.

---

## Accessibility

- Use the semantic `Table` primitives (`<table>`/`<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>` under the hood) — never a `<div>` grid pretending to be a table, which breaks screen-reader table navigation.
- Sortable column headers: the interactive element is a real `<button>` inside the `<th>`, with the `<th>` carrying `aria-sort="ascending" | "descending" | "none"`, and the button carrying an accessible name that already states the column ("Sort by Order Date").
- Row/header checkboxes: each row checkbox has an `aria-label` naming the row it selects (e.g. "Select order #4821"), not a bare unlabeled checkbox. The header checkbox's label states its select-all/indeterminate role.
- Row-actions trigger: the icon-only `DotsThreeIcon` button must have `sr-only` text or `aria-label="Row actions"` — never an icon alone with no accessible name.
- All interactive elements (sort buttons, checkboxes, filter trigger, pagination controls, row-action triggers) must show a visible focus ring on keyboard navigation (Shadcn's default `focus-visible:ring` on `base-nova` primitives already does this — don't strip it with a custom className).
- Keyboard: full table interaction (search, sort, select, paginate, open row menu, choose a row action) must be reachable via Tab/Shift+Tab and Enter/Space alone, with no mouse-only affordance.
- Live region for async state changes: when a bulk action completes (e.g. "3 items deleted"), announce it via the existing `sonner` toast (already installed), which is accessible by default — don't add a second custom live-region mechanism.

---

## Loading

- Every table has a skeleton state, never a spinner, per `Frontend/AGENTS.md` rule 21. Render the full table shell (toolbar disabled/inert, real `Table`/`TableHeader` with real column headers) with the body replaced by `Skeleton`-filled `TableRow`s — this keeps layout stable (no shift when data arrives) since the header and column widths are already correct.
- Skeleton row count matches the current/expected `pageSize` (commonly 10 or 20, per the same default the backend uses — see Section 8) capped at a sensible number (e.g. 8) so the loading state doesn't dominate the viewport.
- Skeleton cell widths approximate real content width per column (a "Name" column skeleton is wider than a "Status" column skeleton, which should approximate a `Badge`-sized pill, not a full-width bar) — this is what makes the loading state read as "this specific table is loading" rather than a generic gray block.
- Toolbar and pagination remain visually present (not skeletonized) during a refetch triggered by search/sort/page changes — use TanStack Query's `isFetching`/`isPlaceholderData` (or `keepPreviousData`) to keep the previous rows visible with a subtle loading affordance (e.g. reduced opacity on the table body, `Button`/`Input` disabled) instead of tearing down to a full skeleton on every param change. Reserve the full-skeleton treatment for the true initial load only.

---

## Error Handling

- A failed query (`isError` from TanStack Query) renders an inline error state **inside the table's body region** — same card/container, same width as the data would occupy — never a full-page error screen or a redirect. The toolbar stays visible and interactive (a filter/search change might resolve the error, e.g. if the error was caused by an invalid filter combination).
- The error state shows a short message plus a `Button variant="outline"` "Retry" action that calls TanStack Query's `refetch()`. No raw error stack, no raw backend `message` string, unless it's a validation-style message safe for end users — otherwise show a generic "Couldn't load {resource}" and log the real error via the existing centralized handling, not `console.log` (rule 31).
- Row-level mutation errors (bulk delete fails, single-row action fails) surface via the existing `sonner` toast pattern (`toast.error(...)`, matching the convention already used in `sidebar.tsx`'s logout handler), not an inline table error — the table's inline error state is reserved for the *list query* failing, not for action failures on an already-loaded table.

---

## Empty States

Distinguish two genuinely different empty states — never collapse them into one generic "No data" message:

1. **No data at all yet** (the resource has zero records in the system, independent of any filter/search — i.e. the unfiltered base query also returns zero). Show the table's toolbar (so the user can still search once data exists, and so layout doesn't jump) with the body replaced by a centered empty-state block: an icon, a short headline ("No products yet"), a one-line description, and a **primary CTA button** to create the first record ("Add Product") — reusing the same action the toolbar's primary button would otherwise trigger.
2. **No results for the current search/filter** (the base dataset has records, but the current `search`/`filter` query params matched none). Show a centered empty-state block with a headline ("No results found"), a description referencing the active search/filter, and a **secondary action** ("Clear filters") that resets search/filter query params back to defaults — not a "create new" CTA, since data already exists.

Both empty states live inside the same table body region (same bounds as loading/error), keep the toolbar rendered and interactive above them, and never show the footer pagination (there's nothing to paginate).
