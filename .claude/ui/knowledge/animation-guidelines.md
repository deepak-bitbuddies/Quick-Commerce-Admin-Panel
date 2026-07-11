# Animation & Motion Guidelines Knowledge Pack

UI Knowledge Pack — Framework v1.1.1 (Premium UI Engineering layer).
Read by: Premium UI Engineer (`.claude/agents/premium-ui-engineer.md`) and Frontend Engineer,
**before** specifying or writing any transition, animation, or state-change interaction.

This document describes this project's actual, already-shipped motion patterns as they exist
on disk today. It is not a proposal for a new motion system — there is no centralized motion
system yet, and inventing one is explicitly out of scope for this document (see ADR-0003 and
Section 1). Its job is to make the de facto standard **explicit and consistent** so every new
transition matches what the codebase already does, instead of a fifth developer inventing a
sixth timing value.

---

## 1. The Honest Current State

**No centralized motion tokens exist.** Grepping `Frontend/src/app/globals.css` for
`--duration-*` or `--ease-*` custom properties returns nothing. Every transition value in the
codebase — every duration, every easing curve — is an inline Tailwind utility class
(`duration-200`, `ease-in-out`, etc.) repeated per component. There is no `--duration-fast`,
no `--ease-standard`, nothing a component can reference by name.

What this document does instead: catalog what the codebase **actually does today**, call that
the de facto standard, and require new work to match it exactly rather than drift.

Centralizing these into real CSS custom properties (`--duration-*`, `--ease-*` tokens
referenced from Tailwind's theme, the same way `--color-*` and `--radius-*` already are) is a
**Future Growth item per ADR-0003** — flag it to the Documentation Engineer if it becomes a
blocker, but do not unilaterally invent a token layer in the middle of an unrelated feature
pass. Until that token layer exists, "the value this document says to use" *is* the standard.

---

## 2. Standard Duration: `200ms`

`duration-200` is the overwhelming default across every hand-authored transition in the
codebase. Real, shipped precedent:

- `Frontend/src/components/layout/sidebar.tsx`:
  - The sidebar panel itself: `transition-[width,transform] duration-200 ease-in-out`
  - The mobile backdrop: `transition-opacity duration-200 ease-in-out`
  - The collapsing label text (`collapsibleLabelClassName`): `transition-[width,opacity] duration-200 ease-in-out`
  - Nav item background/color states (`itemClassName`): `transition-all duration-200 ease-in-out`
  - The logout button: `transition-all duration-200 ease-in-out`
  - The header row's justify/padding shift on collapse: `transition-all duration-200 ease-in-out`
  - The collapsible chevron rotation: `transition-transform duration-200 group-data-[panel-open]:rotate-90`
  - The `CollapsibleContent` height animation: `transition-[height] duration-200 ease-out …` (see
    Section 6 — this one deliberately uses `ease-out`, not `ease-in-out`; noted as an exception,
    not an error to "fix" toward consistency)
- `Frontend/src/components/layout/header.tsx` — the hamburger/X icon cross-fade on both icons:
  `transition-all duration-200 ease-in-out`

**Use `duration-200` for:** hover/focus state changes, panel collapse/expand, icon cross-fades,
nav item active-state changes, any "something in the interface changed state" micro-interaction.

**The one documented exception:** `Frontend/src/components/common/theme-toggle.tsx` uses
`duration-300` for the sun/moon icon cross-fade (`transition-all duration-300 ease-in-out`,
both directions). This is real, shipped code — not a typo to silently "correct" to 200ms — but
it is also not a second standard to propagate. Treat `200ms` as the default for all new work;
only match `theme-toggle.tsx`'s `300ms` if you are extending that exact interaction (a themed
icon-swap toggle), not as license to pick 300ms elsewhere.

**Never exceed ~300ms** for a UI micro-interaction (see Section 5). Nothing in the current
codebase does.

---

## 3. Standard Easing: `ease-in-out`

`ease-in-out` is the default curve on every hand-authored transition cataloged above — the
sidebar panel, the mobile backdrop, the collapsing labels, nav item states, the logout button,
the header's hamburger/X cross-fade, and the theme-toggle's icon cross-fade all use
`ease-in-out`. Use it by default for any new transition unless there is a specific, stated
reason to deviate.

**The one documented exception:** the sidebar's `CollapsibleContent` height animation uses
`ease-out`: `transition-[height] duration-200 ease-out data-[starting-style]:h-0 data-[ending-style]:h-0`
(`Frontend/src/components/layout/sidebar.tsx`, line ~233). `ease-out` reads as appropriate for a
panel that snaps open and settles — but this is a single, deliberate exception on one
already-shipped component, not a second general-purpose easing curve to reach for. Default to
`ease-in-out`; only use `ease-out` if you are extending this exact expand/collapse-panel
interaction.

Never introduce spring/bounce/elastic easings (`cubic-bezier` curves with overshoot, or any
"bounce" utility) — none exist in the codebase today, and Section 5 rules them out explicitly.

---

## 4. Approved Motion Patterns

Every one of these has a concrete, already-shipped example. New work should match the pattern
of the nearest example below rather than inventing a new shape of transition.

### Fade
`Frontend/src/components/common/theme-toggle.tsx` — the sun/moon icon opacity cross-fade:
```
opacity-100 … dark:opacity-0        (sun)
opacity-0 … dark:opacity-100        (moon)
```
combined with `transition-all duration-300 ease-in-out` on both icons. Also see the sidebar's
mobile backdrop, a pure opacity fade: `transition-opacity duration-200 ease-in-out` toggling
between `opacity-100` and `opacity-0`.

### Slide
`Frontend/src/components/layout/sidebar.tsx` — the mobile drawer's horizontal translate:
`transition-[width,transform] duration-200 ease-in-out xl:translate-x-0` toggling between
`translate-x-0` (open) and `-translate-x-full` (closed).

### Scale
`Frontend/src/components/common/theme-toggle.tsx` — the icon scale, always combined with
rotate and fade rather than used alone:
```
rotate-0 scale-100 opacity-100 … dark:-rotate-90 dark:scale-0 dark:opacity-0     (sun)
rotate-90 scale-0 opacity-0 … dark:rotate-0 dark:scale-100 dark:opacity-100      (moon)
```
Also `Frontend/src/components/layout/header.tsx`'s hamburger-to-X: `rotate-45 scale-0
opacity-0` / `-rotate-45 scale-0 opacity-0` swapping with `rotate-0 scale-100 opacity-100` —
the same rotate+scale+fade combination, applied to menu icons instead of theme icons. Treat
"rotate + scale + fade together" as the approved shape for any icon-swap interaction; scale is
never used bare.

### Hover / Focus Transitions
`Frontend/src/components/layout/sidebar.tsx`'s nav items (`itemClassName`):
`transition-all duration-200 ease-in-out` between the inactive state
(`text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`) and
active state (`bg-primary text-primary-foreground shadow-sm`). The collapse-toggle button uses
a narrower, property-specific `transition-colors` (no `-all`, since only color is changing):
`transition-colors hover:bg-zinc-50 hover:text-zinc-900`. Prefer the narrowest `transition-*`
property list that covers what's actually changing (`transition-colors`, `transition-opacity`,
`transition-transform`) over `transition-all` when only one kind of property changes — `sidebar.tsx`
does both depending on the case, so match whichever is narrower for the properties actually
animating.

### Loading (spinner)
`Frontend/src/modules/auth/components/login-form.tsx` — the established, only loading-spinner
convention in the codebase:
```tsx
{isPending && <CircleNotchIcon className="size-4 animate-spin" />}
```
`CircleNotchIcon` (Phosphor) + Tailwind's built-in `animate-spin` utility. Use this exact
pattern — same icon, same utility — for every submit-button/async-action loading state. Do not
introduce a different spinner icon or a hand-rolled CSS spin animation.

### Loading (shimmer / skeleton)
No shimmer/skeleton animation currently exists in the codebase (no `skeleton.tsx` component is
installed yet under `Frontend/src/components/ui/`). When one is added (see the Premium UI
Engineer's shadcn-first rule — install `npx shadcn@latest add skeleton` rather than hand-rolling
it), use whatever pulse/shimmer animation ships with the installed shadcn `skeleton` primitive
rather than inventing a custom keyframe animation — do not claim a shimmer convention exists
until that component lands.

---

## 5. What NOT to Do

- **No bouncing or elastic easings.** No spring physics, no overshoot curves, no "bounce"
  utilities. Every real transition in this codebase uses a plain `ease-in-out` (or, in the one
  documented exception, `ease-out`) — never anything with overshoot.
- **No animation longer than ~300ms for a UI micro-interaction.** The longest hand-authored
  duration in the codebase is `theme-toggle.tsx`'s `300ms`; everything else is `200ms`. Treat
  `300ms` as the practical ceiling for hover states, panel toggles, icon swaps, and cross-fades.
  Longer durations read as sluggish, not premium.
- **Prefer `transform`/`opacity` over `width`/`height`/`top`/`left` where possible** — these
  compose on the GPU and don't force layout recalculation on every frame, while animating
  `width`/`height`/`top`/`left` forces the browser to reflow the surrounding layout on every
  frame of the transition.
  - **The sidebar's `width` transition is a deliberate, necessary exception, not a mistake to
    fix.** `transition-[width,transform] duration-200 ease-in-out` on the `<aside>` element
    animates `width` because collapsing the sidebar **is** a layout-defining change — the
    content area's available space genuinely changes size, not just how the sidebar looks.
    This is not a decorative flourish standing in for a `transform: scaleX()` trick; it's the
    correct property to animate for a real layout resize. Do not "optimize" it into a transform
    hack that fights the actual layout.
  - The `CollapsibleContent` height animation (`transition-[height] duration-200 ease-out
    data-[starting-style]:h-0 data-[ending-style]:h-0`) is the same category of deliberate
    exception — expanding/collapsing nav sub-items is a real height change, not a purely
    cosmetic one. New decorative animations should still default to `transform`/`opacity`;
    reach for `width`/`height` only when the property genuinely must change, as these two
    real cases do.
- **Don't animate for its own sake.** Motion communicates a state change (something opened,
  something loaded, something became active) — it never decorates. If a proposed animation
  doesn't correspond to a real state transition, don't add it.
- **Don't invent a new duration or easing value.** `200ms` / `ease-in-out` is the default for
  everything; deviate only by matching an existing, cited exception (theme-toggle's `300ms`,
  the collapsible panel's `ease-out`), never by picking a fresh value because it "felt right."

---

## 6. Base UI's Built-in State Animations

Some components in this codebase are built on Base UI (`@base-ui/react`, per
`.claude/ui/knowledge/shadcn-ui.md`), which exposes its own state-driven animation hooks. Two
real, shipped shapes exist:

### `data-[starting-style]` / `data-[ending-style]` (Collapsible)
`Frontend/src/components/layout/sidebar.tsx`'s `NavGroupItem`:
```
h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out
  data-[starting-style]:h-0 data-[ending-style]:h-0
```
Base UI's `Collapsible.Panel` sets `data-starting-style` the instant it begins entering (before
its "true" height is applied) and `data-ending-style` the instant it begins exiting, giving a
CSS transition something to animate *from*/*to* across the open/closed boundary. This is Base
UI's own state-driven animation API — **use this hook for enter/exit animation on any Base UI
`Collapsible` instance rather than wrapping it in a separate animation library** (Framer Motion,
react-spring, etc. are not used anywhere in this codebase and should not be introduced for
something Base UI already exposes a hook for).

### `data-open` / `data-closed` + `tw-animate-css` utilities (Popup-based components)
`Frontend/src/components/ui/dropdown-menu.tsx` and `Frontend/src/components/ui/tooltip.tsx` —
both shadcn-CLI-generated, built on Base UI's `Menu`/`Tooltip` primitives — use a different,
also-real pattern on their `Popup` elements:
```
duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 …
data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
```
`animate-in`/`animate-out`/`fade-in-0`/`zoom-in-95`/`slide-in-from-*` are utilities from the
`tw-animate-css` package (confirmed via `@import "tw-animate-css";` in
`Frontend/src/app/globals.css`), keyed off Base UI's `data-open`/`data-closed` presence
attributes (not Radix's `data-state="open"` string — see `shadcn-ui.md` Section 0). Note this
runs at `duration-100`, faster than the `200ms` hand-authored default — this is vendored,
shadcn-registry-generated code, not a second duration standard to hand-copy into new
hand-authored components. When a shadcn install lands a new Popup-based primitive
(`select`, `popover`, `dialog`, `sheet`, etc.), its generated `data-open`/`data-closed` +
`animate-in`/`animate-out` styling is the correct, expected pattern for that component's own
enter/exit — leave it as the CLI generates it rather than rewriting it to match the `200ms
ease-in-out` hand-authored convention.

**Practical rule:** for any Base UI primitive that exposes its own open/close or
starting/ending state attributes, animate through those attributes directly in Tailwind classes.
Do not reach for a JS animation library to solve something these data attributes already solve
declaratively in CSS.

---

## 7. Reduced Motion

**Not currently addressed anywhere in the codebase.** Grepping the entire `Frontend/src` tree
for `prefers-reduced-motion` returns zero matches — no component, no global stylesheet rule,
nothing respects the user's OS-level reduced-motion preference today.

This is a **real, currently-unaddressed accessibility gap**, not a solved problem this document
can point to an example of. Do not claim reduced-motion support is handled, and do not silently
add a one-off `motion-reduce:` variant to a single component as a local fix — that would create
an inconsistent, partial convention (one component respecting the preference, ninety-nine
others not). Flag closing this gap properly (e.g. a global `@media (prefers-reduced-motion:
reduce)` rule in `globals.css` that neutralizes transition/animation durations project-wide,
or Tailwind's `motion-reduce:` variant applied systematically) to the Documentation Engineer /
Software Architect as a Future Growth item, the same way the missing motion-token layer is
flagged in Section 1 — this is cross-cutting infrastructure, not a per-component decision for
whoever happens to touch a screen next.
