# UI Playbook — Dialog

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Pattern:** Dialog (modal) — confirmations and small create/edit forms
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn UI + Phosphor Icons (`@phosphor-icons/react`)

This playbook covers the **modal** shell: `Dialog` (content/form modals) and
`AlertDialog` (confirmation modals). It is distinct from
`.claude/ui/playbooks/drawer.md`'s side-panel pattern — a Dialog is centered,
width-capped, and interrupts the page; a Drawer slides in from an edge and
is used for wider or more exploratory side content. Never use one where this
playbook prescribes the other.

**Cross-references (read before deviating):**
- **`.claude/ui/playbooks/crud-module.md`** — owns the *decision rule* for
  when a create/edit form goes in a `Dialog` at all versus a dedicated page
  (at most ~5–6 fields, single column, no nested/repeatable sub-forms, no
  multi-step wizard, fits in one viewport-height without internal scroll).
  This playbook does not restate that decision — it only defines the modal
  shell once that decision has already landed on "Dialog." It also confirms
  the delete/status-change rule this playbook implements: destructive/
  status-change confirmations are always an `AlertDialog` triggered from a
  `DropdownMenuItem`, never a bare click that fires the mutation directly.
- **`.claude/ui/playbooks/form.md`** — owns all field mechanics (React Hook
  Form + Zod, `Field`/`FieldGroup`/`FieldSet`/`FieldError`, submit-button
  loading state, validation vs. submission error channels). A form rendered
  inside a `Dialog` follows `form.md` verbatim for everything below the
  `DialogHeader` — this playbook only states the surrounding shell
  (`DialogContent`, `DialogFooter`, open/close lifecycle).
- **`Frontend/AGENTS.md` rule 20** — destructive actions always get
  confirmation, never a bare click that fires the mutation directly. This
  playbook's `AlertDialog` half is the concrete mechanism for that rule.

## Prerequisites — read before building

1. **Missing shadcn components.** `Frontend/src/components/ui/` currently
   ships only `button`, `card`, `collapsible`, `dropdown-menu`, `field`,
   `input`, `label`, `separator`, `sonner`, `tooltip` — no `dialog.tsx` or
   `alert-dialog.tsx` exists yet. Install both before building anything that
   uses this playbook:

   ```
   npx shadcn@latest add dialog alert-dialog
   ```

   Do this once per repo (not per module), then never re-add.

2. **`Dialog` vs. `AlertDialog` — the decision rule.** These are not
   interchangeable, and the choice is not stylistic:
   - Use **`Dialog`** for a form or content modal the user actively works
     within — a create/edit form (per `crud-module.md`'s size rule), a
     detail preview, a search-and-select picker. It dismisses freely: `X`
     button, overlay click, or `Escape` all close it, because dismissing it
     loses nothing irreversible (an unsaved form still has its trigger to
     reopen it, or — see Loading/Error Handling below — a submission in
     flight suppresses dismissal).
   - Use **`AlertDialog`** exclusively for destructive or irreversible
     confirmations (deactivate, hard delete, discard-unsaved-changes, revoke
     access). It does **not** close on overlay click and does not render a
     corner `X` — the only ways out are the explicit `AlertDialogCancel` or
     `AlertDialogAction` buttons. This is exactly why `AlertDialog` exists as
     a separate primitive from `Dialog`: a destructive action must never be
     dismissible by an accidental stray click outside the modal, only by a
     deliberate choice.
   - Never repurpose `AlertDialog` as a generic modal (its lack of
     overlay-dismiss is a liability for anything non-destructive — it just
     annoys the user), and never use plain `Dialog` for a destructive
     confirmation (overlay-dismiss would let a misclick silently cancel a
     delete the user meant to confirm, or worse, be mistaken for "safe to
     click anywhere").

3. **Icon library swap.** `Frontend/components.json` has
   `"iconLibrary": "lucide"`, but every real feature file in this codebase
   (`login-form.tsx`, `product-form.tsx`, `header.tsx`, `sidebar.tsx`,
   `config/nav.ts`) imports exclusively from `@phosphor-icons/react`.
   `npx shadcn add dialog alert-dialog` will generate `dialog.tsx` with a
   lucide `XIcon` for the close button — **swap it to Phosphor's `XIcon`
   (`@phosphor-icons/react`) in the same commit that installs the
   component**, before any feature code depends on it. `alert-dialog.tsx`
   ships with no icons by default, so there is nothing to swap there, but
   verify on install (shadcn versions occasionally change this). Do not
   leave a newly-installed component half-migrated — `dropdown-menu.tsx`
   (`ChevronRightIcon, CheckIcon` from `lucide-react`) and `sonner.tsx`
   (`CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon,
   Loader2Icon` from `lucide-react`) are pre-existing debt, not a precedent
   to extend onto `dialog.tsx`.

4. **Primitive layer.** `components.json`'s style is `base-nova`; every
   installed component (`button.tsx` wraps `@base-ui/react/button`,
   `dropdown-menu.tsx` wraps `@base-ui/react/menu`) sits on **Base UI**, not
   Radix. The shadcn `dialog`/`alert-dialog` registry entries for this style
   follow suit — they will wrap `@base-ui/react/dialog` and
   `@base-ui/react/alert-dialog` and expose the same `data-open`/
   `data-closed` state-attribute convention already visible in
   `dropdown-menu.tsx` (not Radix's `data-state="open"`). Style transitions
   and any conditional styling off those attributes; do not write
   `data-[state=open]` selectors expecting Radix's convention.

## Layout

**Content Dialog** (form or detail modal):

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t("createEntityTitle")}</DialogTitle>
      <DialogDescription>{t("createEntityDescription")}</DialogDescription>
    </DialogHeader>

    {/* form.md's <form><FieldSet><FieldGroup>...</FieldGroup></FieldSet></form> goes here */}

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting || isPending}>
        {t("cancel")}
      </Button>
      <Button type="submit" form="entity-form" disabled={isSubmitting || isPending}>
        {isPending && <CircleNotchIcon className="size-4 animate-spin" />}
        {isPending ? t("saving") : t("save")}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Confirmation AlertDialog** (destructive/status-change):

```tsx
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t("deactivateAccountTitle")}</AlertDialogTitle>
      <AlertDialogDescription>
        {t("deactivateAccountDescription")}
        {/* e.g. "This will immediately sign the user out and block login until reactivated." */}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
      <AlertDialogAction
        className={buttonVariants({ variant: "destructive" })}
        disabled={isPending}
        onClick={handleConfirm}
      >
        {isPending && <CircleNotchIcon className="size-4 animate-spin" />}
        {isPending ? t("deactivating") : t("deactivate")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- **Footer button order is fixed across the whole app: Cancel/secondary on
  the left, primary/destructive action on the right.** This matches common
  SaaS convention (the eye lands on the safe action first, the committing
  action is the last thing before the cursor naturally exits right) and
  matches `DialogFooter`'s/`AlertDialogFooter`'s default flex-row-reverse-on-
  desktop layout emitted by the shadcn template — do not manually reorder
  the JSX children to put the primary action first; let the footer's own
  layout own the visual order consistently everywhere this pattern is used.
- `DialogTitle`/`AlertDialogTitle` is always a short, specific noun phrase
  ("Create Seller", "Deactivate Account") — never a bare "Confirm" or
  "Are you sure?".
- `DialogDescription`/`AlertDialogDescription` is required, not optional
  chrome — Base UI's primitives use it to wire `aria-describedby`
  automatically (see Accessibility), so omitting it both loses an a11y
  connection and typically means the copy requirement below (specific,
  non-reversible language) was skipped too.
- A content `Dialog` for a create/edit form only ever contains one
  `<form>`; if the footer's submit button lives outside the `<form>` tag
  (common when `DialogFooter` is a sibling of the form, not a child), wire
  it with `form="{id}"` + a matching `id` on the `<form>` element rather
  than lifting `handleSubmit` into an `onClick` on the footer button.

## Spacing

Follow the token scale already in use — no arbitrary values
(`Frontend/AGENTS.md` rule 12):

- `DialogContent`/`AlertDialogContent` ship their own internal padding and
  gap tokens from the shadcn template (typically `gap-4` between header,
  body, and footer, `p-6` container padding) — do not add ad hoc
  `className="p-4"` overrides on top of it.
- `DialogHeader`/`AlertDialogHeader` internal title-to-description spacing
  is the template default (`gap-2`, or `space-y-1.5` depending on the
  installed version) — leave as installed, do not override per-module.
- Between `DialogHeader` and the form body: rely on `DialogContent`'s own
  outer `gap`, not a manual `mt-4` on the form.
- Form fields inside a Dialog's body: defer entirely to `form.md`
  (`FieldSet` container, `FieldGroup` → `gap-5`) — do not redeclare spacing
  for form internals here. `FieldGroup` is `@container/field-group`-scoped
  (per `form.md`), which is exactly what makes `orientation="responsive"`
  fields behave correctly inside a Dialog's narrower width — no special
  handling needed for the Dialog context specifically.
- `DialogFooter`/`AlertDialogFooter` button-to-button gap is the template
  default (`gap-2`) — do not add extra spacing between Cancel and the
  primary action.

## Recommended Components

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`,
  `DialogDescription`, `DialogFooter`, `DialogClose` (new install) — form
  and content modals only.
- `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`,
  `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`,
  `AlertDialogAction`, `AlertDialogCancel` (new install) — destructive/
  irreversible confirmations only.
- `Field` / `FieldGroup` / `FieldSet` / `FieldError` (already installed) —
  for any form rendered inside a `Dialog`, per `form.md` in full; this
  playbook does not introduce a parallel field composition.
- `Button` variants from `button.tsx`: `outline` for `Dialog`'s Cancel,
  `default` for `Dialog`'s primary submit, `destructive` for
  `AlertDialogAction` on a true destructive confirm (never `default`/
  primary styling on a destructive action), `outline` or the default
  `AlertDialogCancel` styling for the Cancel side of an `AlertDialog`.
- Phosphor icons (`@phosphor-icons/react`): `XIcon` (Dialog close button,
  swapped in per Prerequisite #3), `CircleNotchIcon` with `animate-spin`
  (all in-flight loading states, matching `login-form.tsx`/
  `product-form.tsx` exactly), a domain-relevant leading icon on
  `DialogTitle` only if the module's other surfaces already pair icons with
  titles (do not add one purely for decoration).

## Interaction Patterns

- **Open/close state ownership.** A Dialog's `open` state is local component
  state (`useState`) owned by the page/row that renders the trigger — never
  Zustand (rule 16: Zustand is for global UI state, not per-component modal
  visibility) and never derived from a route change unless the Dialog is
  intentionally deep-linkable (rare; most create/edit dialogs in this app
  are not).
- **Dismiss behavior — the core distinction this playbook exists for:**
  - `Dialog`: closes via the header `X`, an overlay click, or `Escape`. All
    three are equivalent to clicking Cancel — no special handling needed,
    Base UI's primitive wires all three by default.
  - `AlertDialog` for a destructive action: does **not** close via overlay
    click, and Base UI's `AlertDialog` primitive does not render a
    dismissible `X` by default — only `AlertDialogCancel` or
    `AlertDialogAction` close it. This is the entire reason to reach for
    `AlertDialog` instead of `Dialog` for this case: an accidental click
    just outside the modal must never be interpreted as "cancel the
    delete" nor, worse, silently do nothing while the user thinks they
    backed out.
- **Destructive action styling.** `AlertDialogAction` for a genuinely
  destructive confirm (hard delete) always renders with the `destructive`
  button variant (`buttonVariants({ variant: "destructive" })` applied via
  `className`, since `AlertDialogAction` is a Base UI primitive, not the
  app's own `Button`) — never the default/primary styling, so the visual
  weight matches the risk. For a reversible status toggle (deactivate/
  reactivate, matching `admin/users`' `PATCH /users/:userId/status` shape
  per `crud-module.md`), the confirm button may use the `default` variant
  instead of `destructive` if the action is not permanent — but it still
  must be an `AlertDialog`, never a plain click-to-fire.
- **Confirmation copy is specific, not generic.** `AlertDialogDescription`
  states exactly what will happen and, for permanent actions, that it
  cannot be undone: "This will permanently deactivate this account and
  revoke all active sessions" or "This will permanently delete this
  product and cannot be undone" — never a bare "Are you sure?" with no
  object or consequence named. For the reversible deactivate/activate case
  (most entities in this app per `crud-module.md`'s `admin/users` shape),
  state what stops working, not irreversibility language that doesn't
  apply: "Deactivating this seller will immediately hide their storefront
  and pause new orders. You can reactivate them at any time."
- **Success.** Content `Dialog` (create/edit): on mutation success, close
  the dialog, `toast.success`, `queryClient.invalidateQueries` on the
  relevant list/detail query key — mirrors `product-form.tsx`'s `onSuccess`
  and `crud-module.md`'s Interaction Patterns section; do not duplicate
  that mutation wiring here. `AlertDialog` (confirm): on success, close the
  `AlertDialog`, `toast.success`, invalidate the same query keys — the
  dialog closing itself is part of the mutation's `onSuccess`, not a
  separate manual `setOpen(false)` scattered elsewhere.
- **Nested confirmation.** If closing a `Dialog` with unsaved form changes
  should itself be confirmed (e.g. a long edit form with dirty fields), that
  confirmation is a second, nested `AlertDialog` ("Discard unsaved
  changes?") triggered from the outer `Dialog`'s close attempt — do not
  hand-roll a `window.confirm()` or a custom overlay for this.

## Responsive Behavior

- **Desktop/laptop:** `DialogContent`/`AlertDialogContent` are width-capped
  and centered — the shadcn template default (`max-w-lg`, i.e. ~512px) is
  the baseline; widen only for a specific module's genuine need (e.g.
  `sm:max-w-xl` for a two-column `orientation="responsive"` field pair) and
  document why in that module's own code, not by editing the shared
  primitive's default.
- **Mobile:** near-full-width with a small margin on both sides (the
  template default clamps to something like `calc(100%-2rem)` under the
  `max-w` cap) — **never full-bleed edge-to-edge on any breakpoint**. Full-
  bleed, edge-anchored panels are the Drawer/Sheet's job (see
  `.claude/ui/playbooks/drawer.md`), not Dialog's; if a form is wide enough
  that it feels cramped even in a capped, margined mobile Dialog, that is a
  signal to move it to a dedicated page per `crud-module.md`'s
  dialog-vs-page decision rule, not to widen the Dialog past its cap.
- **Vertical overflow:** if the Dialog body (form fields, or a list — see
  Empty States) exceeds viewport height, the body scrolls internally within
  `DialogContent` while `DialogHeader`/`DialogFooter` stay pinned — this is
  the shadcn template's default `max-h-[...]` + internal `overflow-y-auto`
  behavior; don't override unless a specific form overflows by more than
  roughly one viewport-height, in which case — per `crud-module.md` — that
  is the signal to switch that module to the dedicated-page path instead of
  fighting the Dialog's sizing.
- **AlertDialog** follows the identical width/centering rules as `Dialog` —
  there is no separate sizing convention for confirmations; the content is
  simply always short enough that overflow never becomes a concern in
  practice.

## Accessibility

- **Focus on open:** Base UI's `Dialog`/`AlertDialog` primitives move focus
  into the dialog on open (to the first focusable element, or the dialog
  container itself if none is focusable) automatically — confirm this
  ships correctly with the installed version rather than reimplementing it
  with manual `ref.current.focus()` calls.
- **Focus on close:** focus returns to the triggering element (the row's
  "Edit"/"Deactivate" `DropdownMenuItem`, or the page's "Create" `Button`)
  automatically — again, a Base UI primitive behavior to verify, not
  reimplement.
- **Initial focus inside an `AlertDialog` lands on Cancel, not the
  destructive action** — so an accidental stray Enter keypress cannot
  trigger a delete/deactivate. Verify this is the installed primitive's
  shipped default (matches the same guidance already given in
  `crud-module.md`'s Accessibility section) before adding any custom
  `autoFocus` wiring; only override if the installed version defaults
  focus elsewhere.
- **Escape key — guard the in-progress-submission case explicitly.**
  Default behavior (`Escape` closes a `Dialog`) must be suppressed while a
  mutation from the form inside it is in flight (`isSubmitting || isPending`
  — the same flags `form.md` already gates the submit button on). Set
  `Dialog`'s `onOpenChange` to ignore close attempts while pending (or pass
  the primitive's own "prevent close while busy" prop if the installed
  version exposes one), so a stray Escape mid-submit cannot abandon a
  request the user has no way to know already left the client. Apply the
  same guard to `AlertDialog`'s Cancel/backdrop-adjacent affordances during
  its own confirm mutation.
- **ARIA wiring:** Base UI's `Dialog`/`AlertDialog` primitives supply
  `role="dialog"` (or `role="alertdialog"` for `AlertDialog`),
  `aria-labelledby` wired to `DialogTitle`/`AlertDialogTitle`, and
  `aria-describedby` wired to `DialogDescription`/`AlertDialogDescription`
  automatically — this is why `DialogDescription`/`AlertDialogDescription`
  is required (see Layout), not just why it reads well. Do not hand-roll
  any of these attributes; if a design calls for no visible description
  text, still render `DialogDescription` and visually hide it (e.g.
  `sr-only`) rather than omitting it and breaking the `aria-describedby`
  link.
- **Focus trap:** both primitives trap Tab/Shift+Tab focus cycling within
  the dialog while open — confirm, don't reimplement with a custom focus-
  trap library.
- Any form inside a `Dialog` inherits `form.md`'s accessibility contract in
  full (label-for association, `aria-invalid`, `FieldError`'s
  `role="alert"`) — not restated here.

## Loading

- A `Dialog` containing a form uses the **exact same submit-button loading
  pattern as `form.md`**: `<CircleNotchIcon className="size-4 animate-spin" />`
  before the label, label swaps to a submitting-specific string, button
  `disabled={isSubmitting || isPending}` — no separate loading convention
  for the Dialog context.
- **Do not close the dialog until the mutation succeeds.** Closing on
  submit-click (optimistically) and only then finding out the request
  failed causes a flash of the underlying page mid-submission followed by
  the dialog having to reappear (or the error being shown somewhere
  disconnected from where the user was looking) — always wait for
  `onSuccess` to call `setOpen(false)`.
- **`AlertDialog` confirm:** only the `AlertDialogAction` button shows its
  own spinner and disables during the mutation (`disabled={isPending}`);
  `AlertDialogCancel` is also disabled during the pending confirm so the
  user cannot back out of a request that has already been sent, matching
  the Escape-suppression guard above. The rest of the underlying page
  (table, row, other dropdown items) stays interactive — the loading state
  is scoped to the dialog, never a full-page overlay.
- **Dialog with a data-fetching body (edit dialog pre-fill, or a
  search-and-select list):** if the dialog's content itself requires a
  fetch after opening (rare for the edit-dialog case per `crud-module.md`,
  which pre-fills from already-fetched row data with no extra `GET`, but
  applicable to a picker/search dialog), render a `Skeleton` matching the
  eventual content's shape inside `DialogContent`'s body region while
  loading — keep `DialogHeader`/`DialogFooter` rendered and interactive
  (Cancel still works), never a blank dialog body.

## Error Handling

- **A failed submission keeps the dialog open, with the error surfaced
  where the user is already looking** — never close-then-show-error, which
  strands the toast against a page the user has already stopped looking at
  and loses the context (and any partially-filled fields) of what they were
  doing. This applies identically to a `Dialog` form submission and an
  `AlertDialog` confirm action.
- **Server/network failures** (create/update/status-change mutation
  `onError`): `toast.error(t("errorTitle"), { description: error.message })`
  against the typed `ApiErrorPayload`, identical to `login-form.tsx`'s and
  `product-form.tsx`'s `onError` blocks — the dialog stays open, the
  form's entered values stay intact (never reset on error), and the submit
  button returns to its enabled, non-pending state so the user can retry.
- **Client-side validation errors** (Zod, inside a Dialog's form): surface
  only via `FieldError` inline under each field, per `form.md` — never also
  toast a duplicate message for the same validation failure.
- **`AlertDialog` confirm mutation fails:** `toast.error` with the same
  `ApiErrorPayload` pattern; the `AlertDialog` itself stays open so the
  user can immediately retry the same confirm without re-triggering it
  from the row menu.
- **401 during any dialog mutation:** already handled globally by
  `lib/axios.ts`'s response interceptor (redirects to `/login`) — do not
  add a second 401 handler inside a dialog's mutation.

## Empty States

- **Not typically applicable.** A `Dialog`/`AlertDialog` is opened with
  clear intent (the user clicked "Create", "Edit", or a destructive row
  action) — there is no ambient "nothing here yet" moment the way a list
  page has on first load.
- **The one exception: a dialog whose content is itself a searchable/
  listable collection** — e.g. a "select an existing customer" picker
  dialog, or an "attach an existing product" search-dialog. That dialog's
  list region needs the **same distinct empty-vs-no-results handling as
  `.claude/ui/playbooks/data-table.md`**:
  - Zero records exist at all (nothing to pick from yet): copy states
    that plainly ("No customers yet.") with, if applicable, a way to
    create one without leaving the flow (a secondary "Create new" affordance
    inside the same dialog, or a clear path to close this dialog and do so).
  - Records exist but the current search/filter matched none: different
    copy ("No customers match your search.") plus a "Clear search" action —
    do not conflate the two the way `crud-module.md`'s Empty States section
    already prohibits for the list page itself.
  - Both cases render inside the dialog's own scrollable body region,
    with `DialogHeader` (title/description) and `DialogFooter` (Cancel,
    and a disabled primary action until a selection is made) still fully
    present — never collapse the whole dialog down to just the empty-state
    message.
