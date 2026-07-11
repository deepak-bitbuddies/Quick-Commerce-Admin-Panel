# Accessibility — UI Knowledge Pack

Framework v1.1.1 (Premium UI Engineering layer). Read by the Premium UI
Engineer and Frontend Engineer before finalizing any screen's accessibility
behavior. This pack documents what this project actually does today —
`Frontend/AGENTS.md` rule 23 ("Keyboard navigation, focus states, ARIA
labels, semantic HTML, always") is the binding rule; this file is how you
satisfy it concretely, with real files as the reference implementation.

Companion pack: `.claude/ui/knowledge/design-system.md` is the token source
of truth referenced throughout (create it first if it doesn't exist yet —
color-contrast compliance in this project has no separate tooling and
depends entirely on that file existing and being followed).

---

## 0. The one fact that changes everything: Base UI, not Radix

Every shadcn primitive in `Frontend/src/components/ui/` is built on
**Base UI** (`@base-ui/react`), not Radix UI, even though shadcn's public
docs and most training data assume Radix. Confirmed imports:

- `button.tsx` → `import { Button as ButtonPrimitive } from "@base-ui/react/button"`
- `dropdown-menu.tsx` → `import { Menu as MenuPrimitive } from "@base-ui/react/menu"`
- `tooltip.tsx` → `import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"`
- `collapsible.tsx` → `import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"`

This changes two things about how you reason about accessibility here:

1. **Trust it, don't reimplement it.** For any interaction built on a Base
   UI primitive (menu, tooltip, collapsible, and future installs — dialog,
   select, tabs, alert-dialog, popover, switch, checkbox, radio-group),
   Base UI already ships correct focus trapping, roving tabindex, ARIA
   roles/states, `Escape`-to-close, and outside-click handling. Never
   hand-roll `onKeyDown` for arrow-key navigation inside a menu, never
   manually manage `role="dialog"` + `aria-modal`, never write your own
   focus-trap — that work is done. Your job is to verify it (tab through
   it, check the ARIA tree in devtools), not duplicate it.
2. **Don't assume Radix's attribute names.** The single most common mistake
   porting a shadcn snippet from documentation/training data into this repo
   is styling against `data-state="open"` / `data-state="closed"`. Base UI
   does not consistently use that attribute — see §7 for the exact
   attributes this codebase actually uses and a real leftover-Radix-class
   gotcha to watch for.

---

## 1. Semantic HTML

Use the element the browser already gives correct behavior for before
reaching for a `div` + ARIA role.

- **Landmarks.** `sidebar.tsx` uses a real `<nav>` for the primary
  navigation list and a real `<aside>` for the sidebar landmark itself
  (`Frontend/src/components/layout/sidebar.tsx`, the `<aside className="fixed inset-y-0 left-0 ...">` wrapping the `<nav>`). Any new layout chrome
  (header, footer, main content region) should use `<header>`, `<main>`,
  `<footer>` — never a bare `<div>` standing in for a landmark a screen
  reader's landmark-navigation shortcut would otherwise pick up.
- **Buttons vs. links vs. custom actions.** Navigation that changes the
  URL is a real `<Link href>` / `<a>` (see `NavLink` and `NavGroupItem`'s
  `<Link href={item.href!}>` in `sidebar.tsx`); an action that doesn't
  navigate is a real `<button type="button">` (see the logout control and
  the sidebar-collapse toggle in `sidebar.tsx`). Never bind `onClick` to a
  `<div>` or `<span>` to save a few characters of markup — you lose
  keyboard operability, the implicit `button`/`link` role, and Enter/Space
  activation all at once.
- **Heading hierarchy.** No dedicated page-header/heading component exists
  yet in `components/ui` or `components/layout` as of this writing — when
  one is introduced (or until then, per-page), each screen gets exactly
  one `<h1>` (the page title), with `<h2>`/`<h3>` for section/card titles
  in strict nesting order. Never skip a level to get a smaller font —
  that's a `design-system.md` typography-token problem, not a heading-level
  problem.
- **Forms.** Every form field is built from `Field`/`FieldLabel`/`Input`
  (§4) — never a bare `<label>`-less `<input>`, and never a `<div>`
  standing in for `<form onSubmit>` (see `login-form.tsx`'s
  `<form onSubmit={onSubmit} noValidate>`).

---

## 2. Keyboard Navigation

Every interactive element must be reachable via `Tab`/`Shift+Tab` and
operable via `Enter`/`Space` (or arrow keys where that's the native
pattern, e.g. within a menu). Split this into two cases:

**Base UI primitives — already handled.** `DropdownMenu`, `Tooltip`,
`Collapsible`, `Button`, and any future Base UI–backed install (`Dialog`,
`Select`, `Tabs`, `AlertDialog`) come with correct keyboard behavior out of
the box: arrow-key item traversal and `Escape`-to-close inside
`DropdownMenuContent`, `Enter`/`Space` activation on `Button`, `Escape`
dismissal on `Tooltip`. Do not add redundant `onKeyDown` handlers on top of
these — verify the behavior by tabbing through it, don't re-solve it.

**Custom interactive elements — your explicit responsibility.** Anything
that is *not* a Base UI primitive under the hood gets no free keyboard
support and must implement it explicitly:

- A custom step indicator (e.g. a multi-step wizard progress bar) —
  if steps are clickable to jump back, each step needs
  `tabIndex={0}`, a real `<button>` (preferred) or `role="button"` +
  `onKeyDown` handling `Enter`/`Space`, and `aria-current="step"` on the
  active one (§4).
- A custom card acting as a button (e.g. a clickable stat card or a
  selectable list card that isn't a `<Link>`/`<button>`) — wrap the
  clickable surface in a real `<button>` or apply
  `role="button" tabIndex={0}` plus an `onKeyDown` that fires the same
  handler on `Enter`/`Space`. Prefer restructuring to a real `<button>` —
  it's less code than correctly reimplementing native button semantics.
- Reference for the existing "custom clickable surface that got it right":
  `sidebar.tsx`'s collapse-toggle and logout controls are real
  `<button type="button">` elements with visible focus styling inherited
  from the shared `focus-visible:*` utilities in `buttonVariants`
  (`Frontend/src/components/ui/button.tsx`) — even though they don't reuse
  the `Button` component directly, they preserve the same interaction
  contract (real button element, native activation).
- Never rely on `onMouseDown`/`onClick`-only handlers for anything that
  isn't a native `<button>`/`<a>`/`<input>` — that silently drops keyboard
  users.

---

## 3. Focus Management

**Trust Base UI for its own primitives, verify rather than reimplement.**
When a `Dialog`, `Sheet` (built on Base UI's `Dialog`/`AlertDialog`
primitives once installed), `DropdownMenu`, `Tooltip`, or `Collapsible`
opens:

- Focus moves into the popup/panel automatically (first focusable element,
  or the panel itself where appropriate).
- `Escape` and outside-click close it.
- Focus returns to the triggering element on close (e.g. closing a
  `DropdownMenu` opened from a row's "actions" trigger returns focus to
  that trigger button, not to `<body>`).

This is Base UI's job, not the Frontend Engineer's or Premium UI
Engineer's — do not write manual `.focus()` calls, `useRef` + `useEffect`
focus restoration, or a custom focus-trap hook to reproduce what
`@base-ui/react/menu` / `@base-ui/react/tooltip` already do. The
Premium UI Engineer's per-screen accessibility notes should say "verified:
focus enters on open, returns to trigger on close" rather than specifying
*how* to implement it — there is nothing to implement for a Base UI–backed
component.

**What you do own:** anything that manages its own open/closed state
outside a Base UI primitive — e.g. a custom full-screen loading overlay,
a toast-triggered inline panel, or any bespoke overlay that isn't routed
through an installed Base UI–backed component. For those, focus must be
moved deliberately on open and restored on close, following the same
contract Base UI gives you for free elsewhere. If you find yourself
writing that logic, first double-check a Base UI primitive doesn't already
cover the use case (per Decision Rule 1 in `premium-ui-engineer.md`:
shadcn/Base UI first, always) before treating it as a genuinely custom
case.

---

## 4. ARIA Attributes

### Label association — `Field` / `FieldLabel`

Every form field uses the shared primitives in
`Frontend/src/components/ui/field.tsx`, which enforce label association by
construction: `FieldLabel` renders the shadcn `Label` (a real `<label>`),
and every field wires `htmlFor={field.name}` on the label to `id={field.name}`
on the input. From `login-form.tsx`:

```tsx
<FieldLabel htmlFor={field.name}>
  <EnvelopeSimpleIcon className="size-4" />
  {t("email")}
</FieldLabel>
<Input
  {...field}
  id={field.name}
  type="email"
  autoComplete="email"
  placeholder={t("emailPlaceholder")}
  aria-invalid={fieldState.invalid}
/>
```

Rules that follow from this real pattern:
- Never render an `Input`/`Select`/`Textarea` without a paired
  `FieldLabel` whose `htmlFor` matches the input's `id` — a placeholder is
  not a label.
- `Field` itself carries `role="group"` and `data-invalid` (see
  `field.tsx`'s `Field` component) so the whole field — label, control,
  and error — reads as one unit to assistive tech, and error styling
  (`data-[invalid=true]:text-destructive`) is driven off the same flag as
  the ARIA state, not a separate ad hoc class.
- `FieldError` renders with `role="alert"` (`field.tsx` line 217) so
  validation messages are announced when they appear — never render a raw
  `<p>` for an inline error instead.

### `aria-invalid` on errored fields

Already correct, real pattern in `login-form.tsx`: both the email and
password `Controller` renders set `aria-invalid={fieldState.invalid}`
directly on the `Input`, driven by React Hook Form's `fieldState`, in sync
with `Field`'s `data-invalid={fieldState.invalid}`. Every form field in
every module should follow this exact pairing — `aria-invalid` on the
control, `data-invalid` on the wrapping `Field` — rather than inventing a
new validation-state convention per module.

### `aria-sort` on sortable table headers

No `table`/`data-table` component exists in `components/ui` yet (per the
Premium UI Engineer's current component inventory) — this is a convention
to establish on first install, not a shipped pattern to point at. When
`table` is installed and a sortable header is built: the header cell's
interactive element is a real `<button>` (§2), and the parent `<th>` (or
the button itself, per whichever the installed shadcn `table.tsx` renders)
carries `aria-sort="ascending" | "descending" | "none"` reflecting current
sort state — never only a rotated chevron icon with no ARIA equivalent,
since the visual-only signal is invisible to screen reader users.

### `aria-current` for active nav / step / tab

`sidebar.tsx`'s active-item styling today is purely visual (background/
text color swap via the `active` boolean in `NavGroupItem`/`NavLink` —
see `itemClassName(active)` and the `active ? "bg-sidebar-accent ..." : ...`
branches). Treat this as a gap to close, not a pattern to copy verbatim:
any active nav link, active step in a wizard/step-indicator, or active tab
should carry `aria-current="page"` (nav) or `aria-current="step"` (wizard
step) or a selected/`aria-selected` state (tabs, once a Base UI `Tabs`
primitive is installed) in addition to the visual treatment already there
— color alone is not exposed to assistive tech.

### `sr-only` text for icon-only controls

The canonical, already-shipped pattern — every icon-only `Button` in this
codebase pairs the icon with a visually-hidden label via Tailwind's
`sr-only` utility, exactly like this. `Frontend/src/components/common/theme-toggle.tsx`:

```tsx
<Button
  variant="outline"
  size="icon"
  className="cursor-pointer rounded-full"
  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
>
  <SunIcon ... />
  <MoonIcon ... />
  <span className="sr-only">{label}</span>
</Button>
```

`Frontend/src/components/common/language-switcher.tsx` follows the
identical shape inside a `DropdownMenuTrigger`'s `render` prop:

```tsx
<Button variant="outline" size="icon" className="cursor-pointer rounded-full" disabled={isPending}>
  <TranslateIcon weight="bold" className="size-4 text-sky-500" />
  <span className="sr-only">{label}</span>
</Button>
```

`sidebar.tsx` repeats this for the mobile close button, the
collapse/expand toggle, and implicitly relies on visible text for the
logout button (no icon-only case there). Rule: **every icon-only
interactive control gets a sibling `<span className="sr-only">{label}</span>`
inside the same `Button`/`button`** — the label text itself is passed in
as a prop (translated via `next-intl`, per `t(...)` calls throughout), it
is never hardcoded English inside the component. Never rely on a
`title` attribute alone — it's not consistently exposed by all screen
readers and provides no keyboard-visible affordance.

---

## 5. Color Contrast

There is no dedicated contrast-checking tool, linter, or separate
contrast-token layer in this project. The design tokens themselves (in
`Frontend/src/app/globals.css`, catalogued in
`.claude/ui/knowledge/design-system.md` once it exists) **are** the
contrast-compliance mechanism: token pairs like
`bg-primary`/`text-primary-foreground`, `bg-destructive`/`text-destructive`,
`bg-sidebar-accent`/`text-sidebar-accent-foreground` are defined and
already contrast-checked as pairs. This makes token-compliance and
contrast-compliance the same review question:

- If a screen only ever uses `bg-*`/`text-*`/`border-*` tokens from the
  established set (never a raw Tailwind color like `text-red-500` or a
  hex literal, per `Frontend/AGENTS.md` rule 10), contrast is already
  handled — there is nothing further to check per-screen.
- If a new color pairing is genuinely needed and no token exists, the
  correct move is exactly what `premium-ui-engineer.md`'s escalation rules
  say: add the token to `globals.css` first (verifying contrast at that
  point), never hardcode a one-off color "temporarily." A hardcoded color
  is simultaneously a token-discipline violation and an unverified-contrast
  risk — flag it as one issue, not two.
- Do not introduce a parallel contrast-checking process (a browser
  extension step, a manual ratio calculation) as part of a screen's
  accessibility notes — the deliverable is "uses only tokens," full stop.

---

## 6. Screen Reader Considerations

- **Charts and visualizations need a text alternative**, per
  `Frontend/AGENTS.md`. No `components/charts` implementation exists yet —
  when one is built, every chart ships with a text equivalent: a visually-
  hidden summary (`sr-only` paragraph stating the key figures/trend) or an
  adjacent data table toggle — never a chart that is silent to a screen
  reader. This is a required deliverable on the Premium UI Engineer's
  per-screen accessibility notes for any Dashboard/Analytics playbook
  screen, not an optional enhancement.
- **Decorative elements get `aria-hidden="true"`.** `sidebar.tsx`'s mobile
  backdrop overlay is the real example — the `<div>` behind the mobile
  sidebar that dims/blurs the page has no semantic content and is marked
  accordingly:

  ```tsx
  <div
    className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm ..."
    onClick={close}
    aria-hidden="true"
  />
  ```

  Apply the same treatment to any purely decorative icon (an icon that
  duplicates adjacent visible text, a background illustration, a status
  dot that's paired with a text badge) — `aria-hidden="true"` on the icon,
  never a redundant label read twice.
- **Meaningful icons get `sr-only` labels**, not `aria-hidden` — see §4's
  `ThemeToggle`/`LanguageSwitcher` pattern. The dividing line: if the icon
  is the *only* content conveying meaning (icon-only button), it needs an
  `sr-only` label; if the icon is purely reinforcing adjacent visible text
  (an icon next to a labeled button), it should be `aria-hidden="true"` so
  the label isn't announced twice.
- **Toasts** (via `sonner`, per the existing `toast.error(...)` pattern in
  `login-form.tsx` and `sidebar.tsx`) are announced by `sonner`'s own
  live-region wiring — don't duplicate that with a second manual
  `aria-live` region.

---

## 7. Base UI vs. Radix Attribute Reference

This is the concrete cheat sheet — use these, not the Radix attributes you
may recall from training data or shadcn's public docs.

| Concept | Radix (do NOT assume this) | Base UI (what this repo actually uses) |
|---|---|---|
| Open/closed styling hook | `data-state="open"` / `data-state="closed"` | `data-open` / `data-closed` (boolean-presence attributes, not a `data-state` value) |
| Panel/collapsible open state | `data-state="open"` on the trigger | `data-panel-open` on the trigger group, exposed for styling as `group-data-[panel-open]:*` |
| Submenu open state | `data-state="open"` | `data-popup-open` / `data-open` (see `dropdown-menu.tsx`'s `DropdownMenuSubTrigger`: `data-popup-open:bg-accent data-open:bg-accent`) |

**Real example — `sidebar.tsx`'s `NavGroupItem`:** the collapsible chevron
rotates using the Base UI panel-open state exposed on the parent group,
not a `data-state` selector:

```tsx
<CaretRightIcon
  className={cn(
    "size-3.5 shrink-0 transition-transform duration-200 group-data-[panel-open]:rotate-90",
    collapsed && "xl:hidden",
  )}
/>
```

This works because `CollapsibleTrigger` (`Frontend/src/components/ui/collapsible.tsx`, wrapping `@base-ui/react/collapsible`'s
`CollapsiblePrimitive.Trigger`) exposes a `group` class and Base UI sets
`data-panel-open` on it when the paired `CollapsibleContent`
(`CollapsiblePrimitive.Panel`) is open — `group-data-[panel-open]:rotate-90`
reads that state through the Tailwind `group-data-*` variant. Writing
`group-data-[state=open]:rotate-90` here would silently never match.

**Known gotcha already in the codebase — don't propagate it.**
`tooltip.tsx`'s `TooltipContent` className still contains a leftover
Radix-era selector, `data-[state=delayed-open]:animate-in ...`, sitting
right next to the correct `data-open:animate-in ...` / `data-closed:animate-out ...`
classes on the same element. Base UI's `Tooltip.Popup` does not set
`data-state`, so that half of the class list is dead weight — it never
matches and the animation is actually driven by the `data-open`/
`data-closed` classes alongside it. Do not copy the `data-[state=...]`
half forward into new components; when touching `tooltip.tsx` next, that
dead selector is a safe cleanup, not a pattern to imitate elsewhere.

**Practical rule:** when styling any state-dependent variant on a
Base-UI-backed primitive, check the actual rendered DOM (devtools) or the
primitive's own `.tsx` wrapper in `components/ui/` for which attribute it
really sets before writing a `data-[...]` selector — never port a
Radix-flavored class list from memory or from shadcn's upstream docs
without verifying it against this project's Base UI primitives first.
