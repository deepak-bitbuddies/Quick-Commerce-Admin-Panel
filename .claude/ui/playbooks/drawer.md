# UI Playbook — Drawer

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Pattern:** Drawer (`Sheet`-based side panel)
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn UI (style `base-nova`) + `@phosphor-icons/react`

Scope: a `Sheet`-based panel that slides in over the current page for
**filters, quick-create forms, or supplementary detail** — content the user
needs alongside what they're already looking at, without leaving it. This is
distinct from:

- **`Dialog`** (`crud-module.md`) — a centered modal for a focused create/edit
  form the user commits to before doing anything else. A drawer is
  peripheral/contextual; a dialog is a blocking interruption. Use
  `crud-module.md`'s dialog-vs-page decision rule first — reach for a drawer
  only when the content is explicitly *supplementary* (a filter panel, a
  contextual detail preview, a quick-create shortcut from a list toolbar),
  not as a third option for every create/edit form.
- **A dedicated page** (`detail-page.md`) — a full route with its own URL,
  for an entity's complete record. A drawer never replaces a detail page for
  primary content; it's the right call when the content doesn't need to be
  shareable/bookmarkable and the user benefits from keeping the underlying
  list/page visible and scrollable behind it.
- **The mobile filter `Sheet`** already specified in `filter-bar.md` — that
  file establishes *when* a filter set escalates to a `Sheet`. This playbook
  covers the `Sheet` implementation itself in full (layout, states, a11y) so
  `filter-bar.md` and any future quick-create/detail-preview drawer can both
  point here instead of re-deriving it.

## Prerequisite: `Sheet` is not installed yet

`Frontend/src/components/ui/` currently has only: `button`, `card`,
`collapsible`, `dropdown-menu`, `field`, `input`, `label`, `separator`,
`sonner`, `tooltip`. There is no `sheet.tsx`. Install it before building any
drawer:

```bash
npx shadcn@latest add sheet
```

Shadcn's `Sheet` is built on Base UI `Dialog` (rendered off to a side instead
of centered, with slide-in/out animation) and is the correct primitive for
this pattern — **do not hand-roll a sliding `<div>` panel** with manual
`translate-x`/`useState` open logic. That would duplicate what `Dialog`
already gives you for free: focus trap, focus return, `Escape` handling,
`aria-modal`, portal rendering, and overlay click-outside. Reuse it,
per `Frontend/AGENTS.md` rule 24.

**Icon library mismatch — check the generated file before shipping a drawer.**
`Frontend/components.json` declares `"iconLibrary": "lucide"`, so `shadcn add
sheet` will scaffold `sheet.tsx` with its close button using `XIcon` imported
from `lucide-react`. The codebase's real, exclusive icon usage is Phosphor
(`@phosphor-icons/react`) — confirmed in `sidebar.tsx`, `login-form.tsx`,
`product-form.tsx`. The dangerous part: **Phosphor also exports a component
named `XIcon`**, so the import swap is easy to miss by eye — the JSX
(`<XIcon />`) looks identical whether it's coming from `lucide-react` or
`@phosphor-icons/react`. After installing, open `sheet.tsx` and change:

```diff
- import { XIcon } from "lucide-react"
+ import { XIcon } from "@phosphor-icons/react"
```

Check for any other default icon shadcn ships in the generated file (some
versions include a chevron on a nested/`SheetClose` affordance) and swap those
too. Never leave a `lucide-react` import in a file that ships to the app —
only shadcn's own generated primitives are allowed to carry that dependency
transiently until this swap happens, and it must happen before the component
is used anywhere.

**Existing precedent to match, not replicate.** `Frontend/src/components/layout/sidebar.tsx`
already hand-rolls a slide-in drawer for the mobile nav — it predates `Sheet`
being installed, so it isn't a strike against the rule above, but it *is* the
codebase's only real precedent for how a drawer should move and how its
backdrop should look:

```tsx
// backdrop
"fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-200 ease-in-out xl:hidden"

// panel
"fixed inset-y-0 left-0 z-50 flex w-64 flex-col ... transition-[width,transform] duration-200 ease-in-out xl:translate-x-0"
sidebarOpen ? "translate-x-0 shadow-2xl xl:shadow-none" : "-translate-x-full"
```

**Once `Sheet` is installed, new drawers use `Sheet` — do not copy
`sidebar.tsx`'s hand-rolled `translate-x`/`useState` approach for anything
new.** But carry its *values* forward for visual consistency: after
installing, open the generated `sheet.tsx` and check its overlay and content
animation classes against these two data points —

- **Backdrop**: `bg-foreground/20 backdrop-blur-sm`, not shadcn's stock
  overlay tint (typically a flat black/opacity value with no blur). Override
  the generated `SheetOverlay`'s className to match — a drawer's backdrop
  should look like the sidebar's, not a heavier/different modal scrim.
- **Timing**: `duration-200 ease-in-out`. If the generated `sheet.tsx` ships
  a slower default (shadcn's stock `Sheet` commonly animates around
  `duration-500`), tighten it to `200ms` so a `Sheet` drawer and the mobile
  nav drawer feel like the same motion language, not two different speeds in
  the same product.

This is what "feel like Linear's side-panel issue view" cashes out to
concretely: fast (200ms), unobtrusive (soft blurred scrim, no heavy dimming),
no bounce/overshoot easing.

---

## Layout

Default shape — right-side panel, header + scrollable body + optional sticky
footer:

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    <Button>{t("filters")}</Button>
  </SheetTrigger>
  <SheetContent side={isDesktop ? "right" : "bottom"} className="flex flex-col gap-0 p-0 sm:max-w-md">
    <SheetHeader className="border-b px-6 py-4">
      <SheetTitle>{t("drawerTitle")}</SheetTitle>
      {/* SheetDescription if the drawer needs a subtitle; otherwise keep it
          for a11y via VisuallyHidden — see Accessibility */}
    </SheetHeader>

    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* content: form FieldSet, detail fields, filter controls, etc. */}
    </div>

    {/* only when the drawer holds a form — omit entirely for a read-only
        detail/filter drawer that commits changes immediately per control */}
    <SheetFooter className="border-t px-6 py-4">
      <SheetClose asChild>
        <Button variant="outline">{t("cancel")}</Button>
      </SheetClose>
      <Button type="submit" form="drawer-form" disabled={isSubmitting || isPending}>
        {isPending && <CircleNotchIcon className="size-4 animate-spin" />}
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

- **Side, default right.** `side="right"` is the default for supplementary
  content and quick-create — this matches how contextual drawers open in
  every product on the visual bar (Linear's issue side panel, Vercel's
  project detail slide-over, Stripe Dashboard's resource drawers). Don't use
  `side="left"` — that side is already owned by the primary nav sidebar in
  this app and a second left-side panel would compete with it visually and
  for the same screen real estate on desktop.
- **Bottom on mobile** is a responsive fallback, not a separate pattern — see
  Responsive Behavior for exactly how `side` is switched.
- **Header** is always `SheetTitle` + a close `X` (the built-in `SheetClose`
  Base UI renders in the top-right corner of `SheetContent` by default — don't
  add a second manual close button unless the generated primitive omits one).
  If the header needs more than a title (e.g. a status `Badge` next to it),
  put that inside `SheetHeader` beside `SheetTitle`, not below it — keep the
  header a single row.
- **Body is always the scrollable region** (`flex-1 overflow-y-auto`), never
  the whole `SheetContent` — if the footer scrolls out of view when content
  is long, the primary action becomes unreachable without scrolling to the
  bottom, which is exactly what the sticky footer exists to prevent.
- **Footer is sticky and conditional.** Include `SheetFooter` only when the
  drawer contains a form with a commit action (create/edit). A read-only
  detail-preview drawer or a filter drawer whose controls apply immediately
  (per `filter-bar.md`'s "filter selection is immediate" rule) does not need
  a footer — its "footer" work is already done by each control the moment
  it's changed. Don't add an empty/decorative footer just for visual
  symmetry.

## Spacing

- Header/body/footer padding: `px-6 py-4`, matching the horizontal rhythm
  already used for `Card`'s content spacing elsewhere in the app — don't
  introduce a different horizontal inset for drawer content than what
  `Card`/`CardContent` establish. Confirm against whatever padding the
  generated `SheetHeader`/`SheetFooter` ship with by default; if they already
  encode this via their own classNames, don't re-declare it, only add
  `border-b`/`border-t` for the divider (per the Layout example above).
- Header-to-body and body-to-footer boundaries are a `border-b`/`border-t`
  (`border-border`, the existing token), not extra margin — a hairline
  divider is what separates the fixed chrome from the scrollable content in
  the sidebar/dropdown precedents already in this codebase (`sidebar.tsx`'s
  `border-t border-sidebar-border` on its own footer region).
- Width: default to `sm:max-w-md` (a supplementary panel, not a second main
  column). Widen only when content genuinely needs it — e.g. a quick-create
  form with `Field orientation="responsive"` two-up rows benefits from
  `sm:max-w-lg`/`sm:max-w-xl`, but a 2–3 field filter panel or a single-record
  preview stays at the default. Never full-bleed (`w-full`/no max-width) on
  desktop; that turns a drawer into a second page and belongs in
  `detail-page.md` instead.
- Footer action gap: `gap-2` between `Cancel` and the submit `Button`,
  consistent with `detail-page.md`'s action-button-row spacing and
  `crud-module.md`'s dialog footer buttons — don't invent a different gap
  for the drawer footer specifically.
- Form content inside the drawer body follows `form.md`'s spacing rules
  as-is (`FieldGroup`'s `gap-5`, `Field`'s `gap-2`) — the drawer's own
  padding is the only spacing this playbook adds; it does not modify the
  Form playbook's internal field rhythm.

## Recommended Components

| Component | Import (after install) | Use for |
|---|---|---|
| `Sheet`, `SheetTrigger`, `SheetContent`, `SheetOverlay`, `SheetClose` | `@/components/ui/sheet` | The drawer shell, open/close plumbing. |
| `SheetHeader`, `SheetTitle`, `SheetDescription` | `@/components/ui/sheet` | Header row — title always required (see Accessibility), description optional/visually-hidden. |
| `SheetFooter` | `@/components/ui/sheet` | Sticky action row, only for form-holding drawers. |
| `Button` | `@/components/ui/button` (installed) | Trigger, footer actions, retry action in the error state. |
| `FieldSet`/`FieldGroup`/`Field`/`FieldLabel`/`FieldError` | `@/components/ui/field` (installed) | Any form inside a drawer body — reuse `form.md` verbatim, do not re-derive field layout inside a drawer. |
| `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent` | `@/components/ui/card` (installed) | Empty state inside the drawer body, same shape as `coming-soon.tsx` (see Empty States). |
| `Skeleton` (not yet installed — `npx shadcn@latest add skeleton`, same gap already flagged in `detail-page.md`) | `@/components/ui/skeleton` | Loading placeholder inside the drawer body while a detail fetch is in flight. |

Do not introduce a second modal/overlay primitive (e.g. a bespoke
`react-portal` panel, or repurposing `DropdownMenuContent` as a panel) —
`Sheet` is the one drawer primitive for this app once installed, the same way
`Dialog` is the one modal primitive per `crud-module.md`.

## Interaction Patterns

- **Open triggers**: a trigger `Button` (e.g. a list toolbar's "Filters" or
  "Quick create" button) or a row-level action (a `DropdownMenuItem` like
  "View details" that opens a detail-preview drawer instead of navigating).
  Either way, `open` is local component state (`useState`, or lifted one
  level to the list if a row action needs to set which record's data to
  show) — never global/Zustand state, per `Frontend/AGENTS.md` rule 16 (drawer
  open/closed is transient UI state, not shared app state).
- **Close triggers — all three, always**: the header's `X` (`SheetClose`),
  clicking the overlay, and `Escape`. This is Base UI `Dialog`'s built-in
  behavior once `Sheet` is installed — **don't disable any of the three**
  without a specific, stated reason. The one legitimate reason is an
  in-progress unsaved-changes guard on a form-holding drawer: intercept
  `onInteractOutside`/`onEscapeKeyDown` (both exposed on `SheetContent`),
  call `event.preventDefault()`, and surface an `AlertDialog` ("Discard
  changes?") before actually closing — never a silent no-op where the user's
  click/`Escape` visibly does nothing. If a drawer has no unsaved-state
  concern (read-only detail preview, immediate-apply filters), leave all
  three close paths untouched.
- **Quick-create form in a drawer**: identical loading/disabled-while-submitting
  behavior to `form.md` — the footer's submit `Button` sets
  `disabled={isSubmitting || isPending}` and shows the same
  `CircleNotchIcon` + submitting-label swap. On mutation success: `toast.success(...)`
  (per `form.md`'s success-feedback convention), `queryClient.invalidateQueries(...)`
  to refresh the underlying list, and `setOpen(false)` to close the drawer —
  mirroring `crud-module.md`'s dialog-close-on-success behavior. On failure:
  `toast.error(...)` and **keep the drawer open** with form state intact, same
  as a failed dialog submission.
- **Immediate-apply drawers** (filter panels): no footer submit needed for the
  controls themselves — each control fires its own state change/query
  update the instant it changes, per `filter-bar.md`. A filter drawer's
  footer, if present at all, holds only `Apply`/`Clear all` as a convenience
  for closing after a batch of changes — not as the thing that makes the
  filters take effect.

## Responsive Behavior

- **Side switches by viewport — this is the consumer's job, not something
  `Sheet` does automatically.** `SheetContent`'s `side` prop is a static value
  per render; nothing about the primitive re-evaluates it on resize. Drive it
  explicitly the same way `sidebar.tsx` already computes its own
  desktop/mobile split:

  ```tsx
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_BREAKPOINT) // or a
    // drawer-specific named breakpoint constant if a narrower panel should
    // switch at a different width than the nav sidebar does — either way,
    // a named constant, never an inline media-query string (AGENTS.md rule 7)
  <SheetContent side={isDesktop ? "right" : "bottom"} className={...}>
  ```

  Reuse the existing `useMediaQuery` hook (`@/hooks/use-media-query.ts`) —
  don't add a second responsive-detection mechanism.
- **Desktop/tablet**: `side="right"`, width per Spacing (`sm:max-w-md`
  default, wider only when content needs it).
- **Mobile**: `side="bottom"`, height sized to content via the drawer body's
  natural height with an internal scroll cap (e.g. `max-h-[85vh]` on
  `SheetContent` with the body `div` remaining `overflow-y-auto`) — not a
  fixed full-screen sheet. Only let it approach full height when the content
  itself is long enough to need it (a multi-field quick-create form), never
  by default for a 2–3 field filter panel.
- Never full-bleed width/height on desktop just because it's simpler than
  sizing to content — that turns the drawer into a de facto page and signals
  the content should have been routed to `detail-page.md` instead.

## Accessibility

- **Focus management is Base UI Dialog's job — confirm, don't reimplement.**
  Once `Sheet` is installed, opening it moves focus into `SheetContent`
  (typically to the first focusable element or the content container itself),
  and closing it returns focus to the trigger that opened it. Verify this
  after install with a keyboard-only pass; do not add manual `.focus()` calls
  or a `ref`-based focus effect — that would fight the primitive's own
  behavior rather than complement it.
- **`Escape` closes** by default (see Interaction Patterns for the one
  legitimate exception, the unsaved-changes guard).
- **Dialog role is automatic.** `SheetContent` renders as Base UI's
  `Dialog.Popup`, which carries `role="dialog"` and `aria-modal="true"` out
  of the box — don't add a redundant `role` attribute, and don't render a
  drawer's contents outside `SheetContent` (e.g. conditionally rendering a
  plain `<div>` instead) just to avoid the wrapper, since that's what puts it
  in the accessibility tree correctly in the first place.
- **`SheetTitle` is mandatory on every drawer**, even ones without a visually
  prominent header — Base UI warns (and screen readers have nothing to
  announce) if `Dialog.Content` lacks an accessible name. If the design calls
  for no visible title text, still render `SheetTitle` with a `sr-only`
  className rather than omitting it. Same rule for `SheetDescription` if the
  drawer has no subtitle copy — shadcn's generated `sheet.tsx` typically
  wires an accessible description slot; use it (visually hidden if needed)
  rather than leaving `aria-describedby` unset.
- **Close button** needs an accessible name beyond the icon — pair `XIcon`
  with `sr-only` text, exactly like `sidebar.tsx`'s own close button already
  does (`<XIcon className="size-4" /><span className="sr-only">{t("closeSidebar")}</span>`).
  If the generated `SheetClose` doesn't already include this, add it rather
  than shipping an icon-only button with no accessible name.

## Loading

- **A drawer whose content depends on a fetch never opens blank.** The
  moment the trigger fires, set `open` to `true` immediately (the `Sheet`'s
  own slide-in animation is independent of data state) and render a
  `Skeleton` layout inside the body the instant it mounts, driven by
  TanStack Query's `isLoading` — never wait for data to resolve before
  opening the `Sheet`, and never render an empty body while `isLoading` is
  true.
- Shape the skeleton like `detail-page.md`'s, but single-column and scaled to
  the drawer's narrower width (no `sm:grid-cols-2` — the drawer body doesn't
  have the room a full page's `CardContent` does):

  ```tsx
  <div className="flex flex-col gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-full" />
      </div>
    ))}
  </div>
  ```
- **Quick-create/filter drawers with no initial fetch** (static
  `defaultValues`, or controls bound to already-loaded filter state) have no
  drawer-level loading state — only the Form playbook's submit-button
  spinner applies once the user submits, per Interaction Patterns above.

## Error Handling

Two distinct channels, mirroring `form.md`'s split — don't conflate them:

1. **Content-fetch error (populating a detail/preview drawer)** — render an
   inline error state *inside the drawer body*, in place of the skeleton/data,
   with the header (title + close `X`) still visible so the user isn't
   stranded: an icon, `t("errorTitle")`, and a `Button` calling the query's
   `refetch()`. **Never a toast for this case** — a toast can render behind
   or outside the drawer's visual stack and is easy to miss on a panel the
   user is actively focused inside; the error needs to live where the user is
   already looking. If the fetch fails because the record no longer exists
   (404), treat it like `detail-page.md`'s not-found state, scaled down (icon
   + "not found" copy + a `Button` that closes the drawer), not the generic
   retry state — a deleted record isn't fixed by retrying.
2. **Form-submission error (quick-create/edit inside the drawer)** — this one
   *is* a toast, exactly per `form.md`'s Error Handling section:
   `toast.error(t("errorTitle"), { description: error.message })`, drawer
   stays open, form values stay intact so the user can fix and resubmit
   without re-opening the drawer. This is a submission failure, not a
   content-load failure, so the inline-vs-toast rule above doesn't invert —
   a submission toast is fine because the user just took an action and is
   watching for its result, unlike a background content fetch.

## Empty States

- A **content-preview drawer** (e.g. opened to show a record's related data)
  that resolves to nothing to show reuses the same `coming-soon.tsx`-derived
  shape used elsewhere (`Card` → `CardHeader` → `CardTitle` + `CardDescription`
  → empty `CardContent`), scaled to the drawer's narrower width: drop the
  `Card`'s outer border/shadow if it reads as a redundant box-inside-a-box
  against the `Sheet`'s own edges, but keep the `CardTitle`/`CardDescription`
  text structure so it stays consistent with every other empty state in the
  app rather than inventing new copy conventions per surface.

  ```tsx
  <CardHeader>
    <CardTitle>{t("noDataTitle")}</CardTitle>
    <CardDescription>{t("noDataDescription")}</CardDescription>
  </CardHeader>
  <CardContent />
  ```
- A **quick-create form drawer** has no empty state in this sense, same as
  `form.md`'s stance — its "empty" moment is just the form's defined
  `defaultValues`, not a separate visual state.
- A **filter drawer** (per `filter-bar.md`) has no empty state of its own
  either — an empty *result set* after filters are applied belongs to the
  list/table behind the drawer, not to the drawer itself.
