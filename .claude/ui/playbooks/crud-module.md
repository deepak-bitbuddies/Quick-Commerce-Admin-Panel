# UI Playbook: CRUD Module

Part of Framework v1.1.1 (Premium UI Engineering layer). This is the
**composite** pattern for a standard entity's list + create + detail/edit +
delete flow — it pairs 1:1 with the backend `.claude/workflows/crud-module.md`
workflow, which defines the contract shape this playbook's UI must consume:
a list endpoint returning `{ success, message, data: T[], meta: { total, page,
pageSize } }`, a `POST` create endpoint, a `GET :id` detail endpoint, and a
`PATCH :id/status` (or equivalent) status-change endpoint — exactly the shape
shipped in `Backend/src/api/v1/admin/users/`.

This playbook composes two lower-level playbooks and does not duplicate
them:

- **`.claude/ui/playbooks/data-table.md`** — the table itself: column
  definitions, sorting, density, the pagination control widget, mobile
  card-list collapse mechanics. This playbook only states the *contract*
  the table binds to (`meta.total` / `page` / `pageSize`) and where it sits
  on the page.
- **`.claude/ui/playbooks/form.md`** — the React Hook Form + Zod field
  mechanics, validation error display, submit-button loading state. This
  playbook only states *which shell* (Dialog vs. page) the form goes in.

## Prerequisites — read before building

1. **Missing shadcn components.** `Frontend/src/components/ui/` currently
   ships only `button`, `card`, `collapsible`, `dropdown-menu`, `field`,
   `input`, `label`, `separator`, `sonner`, `tooltip`. This pattern needs
   four more that do not exist yet:

   ```
   npx shadcn@latest add table dialog badge skeleton alert-dialog
   ```

   Do this once per repo (not per module) before the first CRUD module is
   built, then never re-add.

2. **Icon library swap on every freshly-installed component.**
   `Frontend/components.json` has `"iconLibrary": "lucide"`, but every real
   feature file in this codebase (`login-form.tsx`, `product-form.tsx`,
   `config/nav.ts`, `header.tsx`, `sidebar.tsx`, ...) imports exclusively
   from `@phosphor-icons/react`. `npx shadcn add` will emit lucide-react
   imports in the new `table.tsx`, `dialog.tsx`, `badge.tsx`, `skeleton.tsx`,
   `alert-dialog.tsx` files — **swap every icon import to its Phosphor
   equivalent immediately**, in the same commit that adds the component,
   before any feature code depends on it. Concretely: `dialog.tsx`'s close
   button (lucide `XIcon` → Phosphor `XIcon`), `table.tsx`'s sort
   affordances if generated, `alert-dialog.tsx` has no icons by default.
   Note the two already-shipped components that were **not** swapped —
   `dropdown-menu.tsx` still imports `ChevronRightIcon, CheckIcon` from
   `lucide-react`, and `sonner.tsx` still imports `CircleCheckIcon,
   InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon` from
   `lucide-react`. That is existing debt, not a precedent to extend — fix
   it opportunistically if you touch either file, but definitely do not
   leave the four newly-installed components in the same unswapped state.

3. **Primitive layer.** `components.json`'s style is `base-nova`, and every
   installed component (`button.tsx` wraps `@base-ui/react/button`,
   `dropdown-menu.tsx` wraps `@base-ui/react/menu`) sits on **Base UI**, not
   Radix. `Dialog` and `AlertDialog` installed via shadcn will follow the
   same `data-open` / `data-closed` state-attribute convention already
   visible in `dropdown-menu.tsx` (not Radix's `data-state="open"`) — style
   transitions off those attributes, not off a `data-state` enum.

4. **Canonical backend shape.** `Backend/src/api/v1/admin/users/` is the
   reference: `dto.ts` defines `UserResponseDto { id, name, email, phone,
   role, isActive, createdAt }`; `mapper.ts`'s `toUserResponseDto` is the
   only place a Mongo document becomes that DTO; `controller.ts`'s
   `listUsersHandler` calls `sendSuccess(reply, users.map(toUserResponseDto),
   "Users fetched", 200, { total, page: query.page ?? 1, pageSize:
   query.pageSize ?? 20 })`; status change is a dedicated `PATCH
   /users/:userId/status` with body `{ isActive: boolean }`, not a generic
   `PUT`. Every field on the module's list/detail response type mirrors this
   shape — build the frontend type from the real DTO, never invent parallel
   field names.

## Layout

**List view** (`app/(dashboard)/{feature}/page.tsx`, thin — renders
`<{Feature}ListPage />` from `modules/{feature}/pages/`):

```
┌─────────────────────────────────────────────────────────┐
│ {Entity plural}                          [+ Create]      │  ← page header
│ optional one-line description                            │
├─────────────────────────────────────────────────────────┤
│ [ Search input ]  [ Filter dropdown(s) ]                  │  ← filter bar
├─────────────────────────────────────────────────────────┤
│  Card                                                      │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Table (see data-table.md)                          │   │
│  │ ...rows, each with a DropdownMenu trigger in the    │   │
│  │ last column...                                      │   │
│  └───────────────────────────────────────────────────┘   │
│  Pagination footer: "Showing {(page-1)*pageSize+1}–       │
│  {min(page*pageSize,total)} of {total}"  [ « ‹ 1 2 3 › » ]│
└─────────────────────────────────────────────────────────┘
```

- Page header title is the plural entity name (e.g. "Sellers"), an `h1`.
  The primary action is a single `Button` with `<PlusIcon />` + "Create
  {Entity}" text, top-right, `variant="default"`. Never icon-only at desktop
  width.
- The search/filter bar sits directly under the header, outside the Card
  that holds the table — it is chrome around the data, not part of it.
- The table itself lives inside a `Card` (the same `Card` primitive
  `coming-soon.tsx` uses for its baseline empty state) so list, loading, and
  empty states all render inside one consistent container.
- Pagination is a footer row below the table, inside or directly under the
  Card, never a separate disconnected block. It binds to the response
  envelope's `meta.total` / `meta.page` / `meta.pageSize` — never re-derive
  total count from the page's own row count.

**Create flow — dialog vs. dedicated page decision rule:**

> Use a `Dialog` when the form has **at most ~5–6 fields, a single column,
> no nested/repeatable sub-forms, and no multi-step wizard** — i.e. it fits
> comfortably in a modal without the modal body needing its own internal
> scroll for more than one viewport-height of content. Use a **dedicated
> route** (`app/(dashboard)/{feature}/new/page.tsx` →
> `modules/{feature}/pages/{feature}-create-page.tsx`) otherwise (image
> uploads, variant/attribute builders, multi-section forms, anything with
> its own sub-navigation).

Both cases reuse `form.md`'s field mechanics verbatim — only the shell
differs. Dialog case: trigger is the list page's "Create" button, which
sets local `open` state and renders `<Dialog><DialogContent>` around the
form; on mutation success, close the dialog, `toast.success`, and
`queryClient.invalidateQueries` on the list's query key (mirrors
`product-form.tsx`'s `onSuccess`). Page case: the create page has its own
`h1` ("New {Entity}"), a back link to the list, and on success
`router.push` back to the list (or to the new entity's detail page).

**Detail/Edit view — same decision rule applied to editing:**

- Simple entity: the list row's "Edit" action opens an **Edit Dialog**
  pre-filled via `defaultValues` from the row's already-fetched data (no
  extra `GET` needed) — same Dialog shell as create, same form.
- Complex entity, or when a stable shareable URL for one record is needed:
  a dedicated `app/(dashboard)/{feature}/[id]/page.tsx` that defaults to a
  **read-only display** (labeled fields in a `Card`, not disabled form
  inputs) with an "Edit" `Button` that swaps the read-only display for the
  edit form in place (no navigation) — matching the "toggle detail ↔ edit"
  requirement. The read-only → edit toggle is local component state, not a
  route change; only creation and the list itself get their own routes by
  default.

**Delete / status-change confirmation:**

Always an `AlertDialog`, triggered from a `DropdownMenuItem`
(`variant="destructive"` for delete; default variant for
deactivate/activate) — never a bare click that fires the mutation directly.
This matches the real `admin/users` shape: `setUserStatusHandler` takes a
boolean `isActive` body, so for entities that mirror `admin/users` (most of
them — riders, sellers, customers, staff accounts) the row action is
**"Deactivate" / "Activate"**, not "Delete" — there is no destroy endpoint
in that shape. Only label the action "Delete" when the module's backend
contract genuinely exposes a hard-delete endpoint; otherwise "Deactivate"
with the `AlertDialog` body explaining the reversible, soft-state nature of
the action (contrast copy: delete confirmations should say what's
irreversible, deactivate confirmations should say what stops working).

## Spacing

Follow the token scale already in use — no arbitrary values (`AGENTS.md`
rule 12):

- Page-level vertical rhythm between header → filter bar → table card:
  `gap-6` (or `space-y-6` on the page's root flex column).
- Filter bar internal spacing between search input and filter controls:
  `gap-3`.
- Card uses its own built-in `--card-spacing` token (`Card`'s
  `[--card-spacing:--spacing(4)]`, `--spacing(3)` at `size="sm"`) for
  internal padding — never add ad hoc `p-4`/`p-6` on top of a `Card`; pass
  `size="sm"` if a denser table card is wanted instead of overriding
  padding directly.
- Row action cluster (icon buttons/dropdown trigger in the table's last
  column): `gap-1.5`, matching `dropdown-menu.tsx`'s own internal item
  spacing (`gap-1.5`) and `login-form.tsx`'s icon+label pairing.
- Form fields inside Dialog or page: defer entirely to `form.md` (`FieldSet`
  → `gap-4`, `FieldGroup` → `gap-5`, per `field.tsx`) — do not redeclare
  spacing for form internals here.
- Pagination footer: `gap-2` between page buttons, separated from the table
  by the Card's own footer border treatment (`CardFooter`'s `border-t`) if
  the pagination lives inside the Card, or `mt-4` if it sits below it.

## Recommended Components

- `Table` (new install) wrapped by a shared `components/tables/data-table.tsx`
  per `data-table.md` — the list view never imports raw `<table>` markup or
  the shadcn primitives directly.
- `Dialog` (new install) for the dialog-shell create/edit case.
- `AlertDialog` (new install) for delete/status-change confirmation only —
  never repurpose it as a generic modal.
- `Badge` (new install) for status display (`isActive` → "Active"/"Inactive",
  role, etc.) — always paired with text, see Accessibility.
- `Skeleton` (new install) for list and detail loading states.
- `DropdownMenu` (already installed) for row actions — reuse
  `dropdown-menu.tsx` exactly as `header.tsx`/`sidebar.tsx` already do,
  including its `variant="destructive"` item styling for the delete/
  deactivate item.
- `Button` variants already defined in `button.tsx`: `default` for the
  primary Create action, `outline` for secondary dialog actions (Cancel),
  `ghost` + `size="icon"`/`"icon-sm"` for the row's DropdownMenu trigger,
  `destructive` for the AlertDialog's confirm button on true deletes.
- `Field` / `FieldGroup` / `FieldSet` / `FieldError` (already installed) for
  all form fields — per `form.md`.
- Phosphor icons (`@phosphor-icons/react`): `PlusIcon` (create),
  `MagnifyingGlassIcon` (search input), `FunnelIcon` (filter trigger),
  `DotsThreeIcon` (row action trigger — icon-only, matches `data-table.md`), `PencilSimpleIcon`
  (edit), `PowerIcon` (activate/deactivate), `TrashIcon` (true delete only),
  `CircleNotchIcon` with `animate-spin` (all loading spinners, matching
  `login-form.tsx`/`product-form.tsx` exactly).

## Interaction Patterns

- **Data fetching plumbing.** Follow the auth module's proven full chain,
  not `products-api.ts`'s partial one: `modules/{feature}/api/
  {feature}-api.ts` calls the shared `api` axios client (`@/lib/axios`)
  against a same-origin path, which is handled by an
  `app/api/{feature}/route.ts` Route Handler that calls `backendFetch<T>()`
  (`@/lib/backend`) with a `BackendRoute`-style path constant — mirroring
  `app/api/auth/login/route.ts` and `constants/backend-routes.ts`'s
  `adminUserRoute()`/`adminUserStatusRoute()` helpers. (`modules/products/
  api/products-api.ts` calls `api.get("/products")` with no corresponding
  `app/api/products/route.ts` yet — that module predates the target
  architecture per `Frontend/AGENTS.md`; don't copy its unwired half, copy
  auth's complete one.) Add a `{Feature}Route` set of path constants (or
  extend `BackendRoute`) rather than inlining path strings, per rule 17.
- **List query.** `useQuery` keyed by a centralized query key, e.g.
  `[QueryKeys.{Feature}List, { page, pageSize, search, ...filters }]` — a
  real constants file, not an inline literal array like
  `product-form.tsx`'s `queryClient.invalidateQueries({ queryKey:
  ["products"] })` (acceptable there as a small precedent, but rule 18
  requires centralized query keys for new modules going forward).
- **Search.** Debounce the search input before it changes query params —
  there is currently no debounce hook in `hooks/` (only
  `use-media-query.ts` exists). Add `hooks/use-debounce.ts` as a shared
  generic hook (rule 6) rather than hand-rolling a `setTimeout` inside the
  module.
- **Filters.** Selected filter values live in the URL's search params (not
  Zustand — Zustand is for global UI state only, rule 16), so the list view
  is shareable/bookmarkable and survives refresh.
- **Mutations.** Create, update, and status-change are each a
  `useMutation`. `onSuccess`: `toast.success` + `queryClient
  .invalidateQueries` on the list query key (and the detail query key, if a
  dedicated detail page exists) — never manually patch cache shape by hand.
  `onError`: `toast.error(t("errorTitle"), { description: error.message })`
  against the typed `ApiErrorPayload`, identical to `login-form.tsx`'s and
  `product-form.tsx`'s `onError` blocks.
- **Row actions menu.** One `DropdownMenu` per row: "Edit" opens the
  edit Dialog or navigates to the detail page per the decision rule above;
  "Activate"/"Deactivate" (or "Delete" only if the backend truly supports
  it) opens the `AlertDialog`, which fires its own mutation on confirm and
  closes itself on success.
- **Optimistic UI** is not the default — invalidate-and-refetch on success
  is (rule 15: never hand-manage cache/loading logic). Only add optimistic
  updates for a specific status toggle if product feedback demands
  instant-feeling row updates, as a deliberate exception.

## Responsive Behavior

- **Desktop/laptop:** full table, all columns, page header row with title
  left / Create button right, filter bar as a single horizontal row.
- **Tablet:** collapse secondary/low-priority columns (per `data-table.md`'s
  column-priority mechanism); keep primary identifying column + status +
  row actions visible at minimum.
- **Mobile:** table collapses to a stacked card-per-row list (mechanics
  owned by `data-table.md`); page header stacks — title on its own line,
  Create button becomes full-width below it; filter bar collapses to the
  search input plus a single "Filters" icon button that opens filter
  controls in a sheet/drawer rather than inline selects.
- **Dialog on small viewports:** shadcn's `Dialog` default responsive
  behavior (near-full-width, capped height with internal scroll) is
  sufficient — don't override unless a specific form overflows it, in which
  case that's a signal to switch that module to the dedicated-page path
  instead of fighting the dialog's sizing.
- Use the existing `hooks/use-media-query.ts` for any conditional
  rendering decisions (e.g. choosing table-vs-card-list at the container
  level) rather than pure CSS breakpoints when JS needs to branch.

## Accessibility

- Page title is a semantic `h1`; the Create button has a visible text label
  at desktop width (icon + text), never icon-only there — icon-only is only
  acceptable for the compact per-row action trigger, and only with
  `aria-label="Actions for {entity name}"` on that trigger.
- `DropdownMenuItem`s use real text content (Base UI wires the accessible
  name from children automatically) — icons inside them are decorative and
  already `pointer-events-none` per `dropdown-menu.tsx`'s existing styling.
- `AlertDialog` traps focus and returns it to the triggering row's menu
  button on close; default initial focus should land on **Cancel**, not the
  destructive confirm action, so an accidental Enter press cannot delete/
  deactivate — verify this is Base UI's shipped default before overriding
  it with custom `autoFocus` wiring.
- Table headers use `<th scope="col">`; any sortable column header is a
  real `<button>` with `aria-sort` reflecting current state (owned by
  `data-table.md`, but the CRUD list view must pass real column metadata
  in, not decorative-only headers).
- Status `Badge` always pairs a text label with color ("Active"/"Inactive"),
  never color alone, per rule 10 (no meaning encoded in color only).
- Search input has an associated accessible label (visually-hidden `Label`
  or `aria-label`), not a bare placeholder-only input.
- Form fields inside the Create/Edit shell inherit `form.md`'s
  accessibility contract in full (label-for association, `aria-invalid`,
  `FieldError`'s `role="alert"`) — not restated here.

## Loading

- **Initial list load** (`isLoading`): render `Skeleton` rows inside the
  same `Card` the real table renders in, matching the real column count so
  layout doesn't jump — keep the page header and filter bar fully
  interactive and rendered, never blank them out (rule 20: never a blank
  screen).
- **Background refetch** (`isFetching && !isLoading` — e.g. after changing
  page/search/filter): dim the existing table content (reduced opacity) or
  show a small inline spinner near the pagination footer; do not remount
  into a full skeleton for a refetch the user already has data for.
- **Create/Edit submit:** submit button shows `<CircleNotchIcon
  className="size-4 animate-spin" />` and is disabled while
  `isSubmitting || isPending`, verbatim the pattern in `login-form.tsx` and
  `product-form.tsx`.
- **Status-change/delete confirm:** only the `AlertDialog`'s confirm button
  shows its own spinner and disables during the mutation; the rest of the
  row/table stays interactive.
- **Detail page** (dedicated-page case): render field-shaped `Skeleton`
  blocks in the same read-only `Card` layout while the single-entity
  `useQuery` is loading.

## Error Handling

- **List query fails:** render an inline error state inside the same Card
  the table would occupy (short message + a "Retry" `Button` that calls
  `refetch`) — never let a list fetch failure blank the page or throw past
  an error boundary silently.
- **Mutation fails** (create/update/status-change): `toast.error` with the
  typed `ApiErrorPayload`'s `message`, identical to the `onError` blocks in
  `login-form.tsx`/`product-form.tsx`. The Dialog/page stays open with the
  user's input intact so they can retry — never clear the form on error.
- **Client-side validation errors** (Zod) surface only via `FieldError`
  inline under each field — never also toast a duplicate message for the
  same validation failure; toasts are reserved for server/network failures
  reaching a mutation's `onError`.
- **Detail/edit page, entity not found** (deleted or deactivated by someone
  else between list and navigation): a dedicated not-found state reusing
  `coming-soon.tsx`'s `Card` shape (`CardHeader` + `CardTitle`/
  `CardDescription`) but with "not found" copy and a "Back to {entity
  plural}" action — not a thrown error or blank page.
- **401 during any of the above:** already handled globally by
  `lib/axios.ts`'s response interceptor (redirects to `/login`) — do not
  add a second 401 handler inside a feature module.

## Empty States

- **Zero rows, nothing created yet:** reuse `coming-soon.tsx`'s `Card` >
  `CardHeader` (`CardTitle` + `CardDescription`) shape, but — unlike
  `ComingSoon`'s intentionally empty `CardContent` — put a primary "Create
  {Entity}" `Button` (with `PlusIcon`) inside `CardContent`, since this is
  an actionable empty state, not a "feature not built yet" placeholder.
  Copy: "No {entities} yet." / "Create your first {entity} to get started."
- **Zero rows due to active search/filter** (entities exist, none match):
  different copy — "No {entities} match your filters." — plus a "Clear
  filters" `Button`, not the Create CTA. Don't conflate "nothing exists"
  with "nothing matches"; the corrective action is different in each case.
- Either empty state renders **inside** the same Card the table would
  occupy, with the page header and filter bar still fully present above it
  — the empty state replaces only the table region, never the whole page
  shell.
