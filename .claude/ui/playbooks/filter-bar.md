# UI Playbook: Filter Bar

**Framework v1.1.1 — Premium UI Engineering layer**
**Companion to:** `.claude/ui/playbooks/data-table.md` (the list/table this bar controls).
Scope: the search/filter/sort control row that sits *above* a Data Table or
list. This file does not cover table columns, row rendering, pagination
controls, or table-level skeleton/empty states — see the Data Table playbook
for those.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn UI + Phosphor
Icons (`@phosphor-icons/react`) + TanStack Query.

## Prerequisite: component gaps

`Frontend/src/components/ui/` currently has only: `button`, `card`,
`collapsible`, `dropdown-menu`, `field`, `input`, `label`, `separator`,
`sonner`, `tooltip`. A filter bar needs several primitives that **do not
exist yet**:

| Needed for | Missing component | Install before use |
|---|---|---|
| Status/role/short fixed-list filters | `select` | `npx shadcn@latest add select` |
| Category/long searchable-list filters | `popover` + `command` | `npx shadcn@latest add popover command` |
| Active-filter chips | `badge` | `npx shadcn@latest add badge` |
| Mobile filter drawer | `sheet` | `npx shadcn@latest add sheet` |

Do not hand-roll any of these — install via the shadcn CLI so they land in
`components/ui/` with the project's `base-nova` style and `neutral` base
color, matching what's already there.

**Icon library mismatch — read before importing icons.** `Frontend/components.json`
declares `"iconLibrary": "lucide"`, but the codebase's actual, exclusive icon
usage is Phosphor (`@phosphor-icons/react`). The shadcn CLI will scaffold new
components (`select`, `command`, `sheet`, etc.) with `lucide-react` icon
imports (e.g. `ChevronDownIcon` from `lucide-react` in `select.tsx`'s trigger
chevron, `CheckIcon` in `command.tsx`). After running `add`, replace those
imports with the Phosphor equivalents (`CaretDownIcon`, `CheckIcon` from
`@phosphor-icons/react`) so the new components match every hand-written
filter bar in this codebase. Never import from `lucide-react` in feature code
— Phosphor only, per existing convention.

## Layout

Single-row flex container, left-to-right, wrapping to a second row only for
active-filter chips:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search input.........] [Role ▾] [Category ▾ (combobox)] ... [Sort ▾] [⊞ view] │
├─────────────────────────────────────────────────────────────────────────┤
│ [Role: Rider ✕] [Category: Dairy ✕]                          Clear all  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Left**: search `Input` with a leading `MagnifyingGlassIcon` (16px,
  `text-muted-foreground`), placeholder describing what's searchable (e.g.
  "Search users by name or email…"). Fixed or `max-w-sm`; never let it grow
  to consume the whole row on wide viewports — cap it so filter/sort controls
  stay visible without scrolling.
- **Middle**: filter controls, one per filterable field, in the order the
  backend schema declares them (see below). Each control shows its current
  value as its trigger label (e.g. "Role: Rider"), not a generic "Role" label
  once a value is selected — the control itself communicates active state, in
  addition to the chip row.
- **Right**: sort control (`DropdownMenu` or `Select` — same short-list rule
  as filters) and/or a view-toggle (grid/list) as a segmented `Button` group.
  Sort is visually separated from filters (e.g. `Separator
  orientation="vertical"` or extra `gap`) since it changes ordering, not the
  result set.
- **Below/inline**: active-filter chips row, rendered only when ≥1 filter is
  active (the row takes zero space when no filters are applied — don't
  reserve empty height). A "Clear all" `Button` (`variant="ghost"`,
  `size="sm"`) sits at the end of the chip row, right-aligned.

Container: `Card` is optional — a filter bar can sit directly above the table
in a plain `<div>` with the page's standard horizontal padding, or inside a
`Card` if the page groups the whole list section visually. Pick whichever the
surrounding page already does; don't introduce a second convention.

## Spacing

Follow the project's existing spacing scale (Tailwind's default 4px steps,
per AGENTS.md rule 12 — no arbitrary values):

- Row container: `flex flex-wrap items-center gap-3` (12px gap between
  controls).
- Search input to first filter control: same `gap-3`; give the search input
  `flex-1 max-w-sm` so it doesn't starve other controls on narrow desktop
  widths.
- Sort/view-toggle cluster: separated from filters with `ml-auto` so it
  pins right regardless of how many filters are present.
- Filter bar to table: `gap-4` (16px) vertical space, consistent with the
  Data Table playbook's section spacing.
- Chip row (when present): `flex flex-wrap items-center gap-2 mt-3`; each
  `Badge` uses `gap-1` internally between label text and its `XIcon`.
- Control heights: match `Input`'s default height (`h-9`) across search,
  `Select` triggers, and sort control so the row is visually aligned — never
  mix control heights in one row.

## Recommended Components

- **`Input`** — search field. Always controlled, always paired with a
  visible or `sr-only` `Label` (see Accessibility).
- **Filter control — decision rule:**
  - **`Select`** (built on Base UI `Select`, needs installing) for a short,
    fixed, known-in-advance option set — e.g. `role` against
    `listUsersQuerySchema`'s `z.enum([UserRole.SUPER_ADMIN, UserRole.RIDER,
    UserRole.CUSTOMER])`. Three options, no search needed: a `Select` is
    correct, a combobox is over-engineering.
  - **`Popover` + `Command`** (combobox, both need installing) for a long or
    dynamically-loaded option set the user would need to type to find — e.g.
    filtering products by category or brand where the list can run into
    dozens/hundreds of entries. `Command` gives built-in fuzzy filtering;
    `Select` does not scale past roughly 8-10 options before it becomes a
    scroll-heavy, hard-to-scan list.
  - Do not use `DropdownMenu` for value-selection filters — it's already in
    the codebase but is the wrong primitive here (no built-in single-select
    checked-state semantics, no keyboard type-ahead). Reserve `DropdownMenu`
    for the sort control or row-level action menus, where the Data Table
    playbook already establishes its use.
- **`Badge`** (needs installing) — active-filter chips. `variant="secondary"`
  for a neutral, low-emphasis chip that doesn't compete with primary actions;
  each chip renders `"{Label}: {value}"` plus a trailing `XIcon` button.
- **`Sheet`** (needs installing) — mobile filter drawer, and also the right
  answer whenever a filter bar's control count exceeds what fits on one row
  even on desktop (e.g. 5+ independent filters). Don't let an inline bar wrap
  into three rows of controls — past a small number of filters, move the
  full set into a `Sheet` triggered by a single "Filters" button with an
  active-count `Badge` (e.g. "Filters (2)").
- **`Button`** — "Clear all" action, mobile "Filters" trigger, view-toggle
  segments.
- **`Field` + `Label`** — wrap each filter control for consistent
  label/description/error layout, reusing the existing `field.tsx` primitive
  rather than duplicating label markup per control (AGENTS.md rule 24:
  reuse before building new).

## Interaction Patterns

- **Search debounce.** Debounce the search input at **300ms** before it
  updates the query param / fires the list query. Use the shared
  `useDebounce` hook (per AGENTS.md rule 6 — generic hooks belong in
  `hooks/`, not reimplemented per feature). Do not fire a request on every
  keystroke, and do not require an Enter key press or a submit button — the
  debounce is the entire UX.
- **Filter selection is immediate**, not debounced — a `Select` or `Command`
  choice fires the query as soon as the user picks a value (there's no
  "typing" state to wait out).
- **Clear all filters** is a single, always-visible action once **at least
  one** filter (search text, any filter control, or a non-default sort) is
  active. It resets every filter control to its unset state and removes all
  chips in one operation. Do not require dismissing chips one at a time to
  reach empty state, though individual chip removal must also work (see
  below).
- **Individual chip removal** — clicking a chip's `XIcon` (or activating it
  via keyboard) clears that one filter only, leaving the others and the
  search text untouched.
- **URL query-string sync is the recommended default, not optional.** Every
  filter, the search term, the sort field/direction, and the current page
  sync to the URL's query string (e.g. `?role=RIDER&sort=name&page=2`),
  mapping directly onto the same shape the backend query schema expects —
  `listUsersQuerySchema`'s `role`, `page`, `pageSize` is the concrete
  precedent: a filter bar's controls are not free-floating UI state, they are
  a client-side mirror of exactly the query params the list endpoint accepts.
  This makes every filtered/sorted/paginated view shareable and
  bookmarkable, and makes back/forward navigation restore prior filter
  state for free. Implement via `useSearchParams` / `useRouter` (App Router)
  or a small `useQueryState`-style hook in the module — never keep filter
  state in a Zustand store or component state alone (AGENTS.md rule 16:
  Zustand is for global UI state, not server-query state, and filter state
  here is effectively server-query state).
- **TanStack Query key includes every active filter value** (plus
  pagination), so changing any control invalidates/refetches the correct
  query rather than serving stale cached data for a different filter
  combination.

## Responsive Behavior

- **Desktop / laptop (≥ `lg`):** full inline row — search, all filter
  controls, sort, view-toggle all visible simultaneously, per Layout above.
- **Tablet (`md`):** if controls don't fit one row, keep search + the 1-2
  most important filters inline and move the rest behind a "Filters" button
  (with an active-count `Badge`) that opens the `Sheet`. Don't silently drop
  filters from mobile/tablet — every control that exists on desktop must be
  reachable, just relocated.
- **Mobile (< `md`):** the entire filter bar collapses to: search input (full
  width) + a single "Filters" `Button` (icon: `SlidersHorizontalIcon`,
  showing an active-count `Badge` when ≥1 filter is set). Tapping it opens a
  `Sheet` from the bottom (`side="bottom"`) containing the full control set —
  every `Select`/`Command` filter, the sort control, and an "Apply"/"Clear
  all" footer action pair. Do not attempt to fit every control inline on
  mobile by shrinking them — a cramped row of five 80px-wide selects is worse
  than one well-labeled drawer.
- Sort and view-toggle move into the same `Sheet` on mobile rather than
  getting a second collapse mechanism — one drawer holds everything that
  doesn't fit, not one per control type.

## Accessibility

- Every control has a label — visible (`Label` above/beside the control) or
  `sr-only` where a placeholder already communicates purpose visually (e.g.
  the search `Input` can use `<Label className="sr-only">Search</Label>` plus
  a descriptive placeholder). Never rely on placeholder text alone as the
  only accessible name.
- Active-filter chip removal buttons are real, keyboard-operable buttons
  (`<button>` inside the `Badge`, or `Badge asChild` wrapping a `button`) —
  never a bare `onClick` on a `span`/`div`. Each carries a specific
  `aria-label` naming the field and value being removed, e.g. `aria-label="Remove
  filter: Role = Rider"`, not a generic "Remove" — with several chips present,
  a screen-reader user tabbing through them needs to distinguish which chip
  they're on without extra context.
- "Clear all" button has a clear accessible name ("Clear all filters"), not
  just an icon.
- `Select` / `Command` combobox triggers expose their current value as their
  visible text (not just an icon), which doubles as their accessible name via
  standard Base UI trigger semantics — don't override this with an empty
  `aria-label` that hides the selected value from assistive tech.
- Filter controls remain fully operable via keyboard: `Tab` to reach each
  control, `Enter`/`Space` to open `Select`/`Command`, arrow keys to move
  through options, `Escape` to close without changing selection. This is
  Base UI's default behavior for `Select`/`Popover`/`Command` — don't override
  focus trapping or key handling to "simplify" it.
- The mobile `Sheet` traps focus while open and returns focus to the
  "Filters" trigger button on close (Base UI `Dialog`-based default — verify
  it isn't disabled).

## Loading

- The filter bar itself has **no dedicated loading state**. The underlying
  list/table shows its own skeleton while a filter change is in flight — see
  the Data Table playbook's loading section for that skeleton's shape.
- The one loading affordance the filter bar owns: **disable controls during
  an in-flight mutation**, if a filter's own data is being fetched
  asynchronously (e.g. a `Command` combobox whose option list comes from an
  API — disable/show a small spinner in that control only while its options
  load; don't disable the whole bar for it).
- Never block the search `Input` itself while results load — the user must
  be able to keep typing (the debounce already protects against request
  storms); disabling it on every keystroke-triggered fetch creates a janky,
  focus-losing experience.

## Error Handling

- If a filter option source fails to load (e.g. the `Command` combobox's
  category list request errors), show an inline error state inside that
  control's popover ("Couldn't load categories" + a retry `Button`) rather
  than failing the whole filter bar or silently rendering an empty list.
- If the list query itself fails after a filter change, that error belongs
  to the list/table (per the Data Table playbook's error-state section) —
  the filter bar's job is only to keep the last-applied filter values visible
  and intact so the user can retry or adjust without having lost their
  selection.
- Never reset filter state as a side effect of a query error — a failed
  request should never silently clear the user's filters/search term.

## Empty States

- When the active filter/search combination yields zero rows, the filter
  bar's **"Clear all"** action becomes the primary path back to a useful
  view — ensure it stays visible and enabled in this state (don't hide the
  chip row or the clear action just because the list below is empty).
- The zero-results empty state itself (illustration/message/"Clear filters"
  CTA inside the list area) is owned by the Data Table playbook — see its
  "no results for this search/filter" empty state. This playbook's
  responsibility ends at making sure the bar's own clear/remove-chip
  controls remain fully functional and visible so that CTA (or a chip
  removal) actually has something to invoke.
- Prefer surfacing the filter values that produced the empty result inside
  the CTA copy where feasible (e.g. table-level empty state reads "No users
  match Role: Rider — Clear filters"), since the chip row above already
  displays the filters — keep the two consistent rather than the table
  guessing at generic copy.
