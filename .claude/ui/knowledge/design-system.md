# UI Knowledge Pack — Design System (Tokens)

**Framework:** v1.1.1 (Premium UI Engineering layer), per ADR-0003
**Owner:** Premium UI Engineer (final authority) · read by every frontend-adjacent agent before a presentation decision
**Source of truth:** `Frontend/src/app/globals.css` (tokens), `Frontend/src/app/layout.tsx` (font loading), `Frontend/components.json` (shadcn base config)

This is the canonical, single-source-of-truth reference for every color,
typography, spacing, radius, and motion value in the admin panel. It
documents **only what is actually defined in the codebase today** — no
aspirational or invented tokens. If a value you need isn't here, it doesn't
exist yet; the correct action is proposing an addition to `globals.css`, not
approximating with a hardcoded value (see Usage Rules).

Read `.claude/ui/playbooks/` for how these tokens compose into concrete
screen patterns; this document only covers the primitives.

---

## Color Tokens

All colors are defined in `oklch()` in `Frontend/src/app/globals.css`, once
under `:root` (light) and once under `.dark` (dark). They are re-exposed as
Tailwind utilities via the `@theme inline` block (e.g. `--color-primary:
var(--primary)` → `bg-primary`, `text-primary`, `border-primary`, etc.).
Never reference the raw `--background`-style variable name in a class;
always use the Tailwind-facing name (`bg-background`, not
`bg-[var(--background)]`).

| Token | CSS variable | Light | Dark | Semantic usage |
|---|---|---|---|---|
| background | `--background` | `oklch(0.985 0.003 95)` | `oklch(0.15 0.01 95)` | Page/app background. Applied on `<body>` via `bg-background` in `globals.css`'s base layer. |
| foreground | `--foreground` | `oklch(0.18 0.01 95)` | `oklch(0.97 0.003 95)` | Default text color. Applied on `<body>` via `text-foreground`. |
| card | `--card` | `oklch(1 0 0)` (pure white) | `oklch(0.19 0.01 95)` | Surface color for `Card` and any raised/contained panel. Lighter than `background` in light mode (pure white vs. off-white page), and lighter than `background` in dark mode too (charcoal card vs. near-black page) — cards always read as a distinct raised layer, never the same flat color as the page. |
| card-foreground | `--card-foreground` | `oklch(0.18 0.01 95)` | `oklch(0.97 0.003 95)` | Text inside `Card` (same value as `foreground` in both themes today, but kept as a separate token — always reference `card-foreground` inside a card, not `foreground`, in case they diverge later). |
| popover | `--popover` | `oklch(1 0 0)` | `oklch(0.19 0.01 95)` | Background for floating surfaces — `DropdownMenuContent`, `TooltipContent`, and any future `Popover`/`Select`/`Combobox` content. Same values as `card` in both themes. |
| popover-foreground | `--popover-foreground` | `oklch(0.18 0.01 95)` | `oklch(0.97 0.003 95)` | Text inside popover/dropdown/tooltip surfaces. |
| primary | `--primary` | `oklch(0.82 0.18 88)` — "Premium Amber" | `oklch(0.84 0.18 88)` | The brand/action color. Primary buttons (`buttonVariants` `default` variant), active nav items (`sidebar.tsx`'s active `NavGroupItem`), focus rings (`--ring` mirrors this value), active status dots (`NavLink`'s active indicator). Dark mode bumps lightness slightly (`0.82` → `0.84`) to stay legible against the darker card/background. |
| primary-foreground | `--primary-foreground` | `oklch(0.16 0.01 95)` (near-black) | `oklch(0.16 0.01 95)` (same in both themes) | Text/icon color on top of `primary` fills — deliberately a dark near-black in both themes because amber is a light, warm hue that never needs a light-foreground pairing. |
| secondary | `--secondary` | `oklch(0.95 0.01 95)` — "Neutral Surfaces" | `oklch(0.25 0.01 95)` | Secondary button fill, secondary emphasis surfaces. A quiet neutral, not a second brand color. |
| secondary-foreground | `--secondary-foreground` | `oklch(0.22 0.01 95)` | `oklch(0.97 0.003 95)` | Text on `secondary` surfaces. |
| muted | `--muted` | `oklch(0.965 0.004 95)` | `oklch(0.23 0.01 95)` | Subdued backgrounds — hover states (`ghost`/`outline` button hover), disabled-adjacent zones, `CardFooter`'s `bg-muted/50`. |
| muted-foreground | `--muted-foreground` | `oklch(0.48 0.01 95)` | `oklch(0.7 0.01 95)` | Secondary/de-emphasized text — subtitles, helper text, `CardDescription`, placeholder-adjacent copy. This is the token for "quieter than body text," never a raw gray utility. |
| accent | `--accent` | `oklch(0.93 0.05 90)` | `oklch(0.31 0.03 90)` | A soft warm highlight surface, distinct from `primary` (lower chroma/lightness than the brand amber) — used for `sidebar-accent` composition and general highlighted-but-not-primary emphasis. |
| accent-foreground | `--accent-foreground` | `oklch(0.22 0.01 95)` | `oklch(0.98 0.003 95)` | Text on `accent` surfaces. |
| destructive | `--destructive` | `oklch(0.63 0.23 27)` (red) | `oklch(0.7 0.19 27)` | Errors, delete/remove actions, validation failure. `buttonVariants`' `destructive` variant uses it at low opacity fills (`bg-destructive/10` light, `bg-destructive/20` dark) rather than a solid fill — see button.tsx. No `destructive-foreground` token exists; destructive text/icon color is `text-destructive` directly against a tinted `destructive/10`–`/20` background, not a solid destructive fill needing a contrasting foreground. |
| border | `--border` | `oklch(0.94 0.003 95)` | `oklch(1 0 0 / 8%)` (8% white overlay) | Default hairline border — applied globally via `* { @apply border-border; }` in `globals.css`'s base layer. Dark mode uses a translucent white overlay (not a solid oklch) so borders read correctly regardless of what surface they sit on. |
| input | `--input` | `oklch(0.92 0.004 95)` | `oklch(1 0 0 / 15%)` (15% white overlay) | Border/background wash for form controls, especially in dark mode (`button.tsx`'s `outline` variant: `dark:border-input dark:bg-input/30 dark:hover:bg-input/50`). Slightly stronger than `border` in dark mode (15% vs 8%) since inputs need to read as interactive, not just as a divider. |
| ring | `--ring` | `oklch(0.82 0.18 88)` | `oklch(0.84 0.18 88)` | Focus ring color — identical value to `primary` in both themes. Applied via `focus-visible:ring-ring/50` (`button.tsx`) and globally via `outline-ring/50` in the base layer. Never introduce a second focus-ring color. |
| sidebar | `--sidebar` | `oklch(0.975 0.003 95)` | `oklch(0.18 0.01 95)` | Sidebar background — subtly distinct from `background` (light: slightly different from page `0.985`; dark: slightly lighter than page `0.15`, i.e. still its own layer, not identical to `card`'s `0.19`). |
| sidebar-foreground | `--sidebar-foreground` | `oklch(0.18 0.01 95)` | `oklch(0.97 0.003 95)` | Default sidebar text. |
| sidebar-primary | `--sidebar-primary` | `oklch(0.82 0.18 88)` | `oklch(0.84 0.18 88)` | Sidebar-scoped primary accent (badge counts, e.g. `item.badge` pill in `sidebar.tsx`). Same value as `primary` in both themes — kept as a separate token for independent theming if the sidebar ever needs to diverge. |
| sidebar-primary-foreground | `--sidebar-primary-foreground` | `oklch(0.16 0.01 95)` | `oklch(0.16 0.01 95)` | Text on `sidebar-primary` fills (nav badge text). |
| sidebar-accent | `--sidebar-accent` | `oklch(0.93 0.05 90)` | `oklch(0.31 0.03 90)` | Active/hover nav-item background (`NavGroupItem`'s non-active-but-hovered state, and `NavLink`'s active state) — same values as the global `accent` token today. |
| sidebar-accent-foreground | `--sidebar-accent-foreground` | `oklch(0.18 0.01 95)` | `oklch(0.97 0.003 95)` | Text/icon color on `sidebar-accent`. |
| sidebar-border | `--sidebar-border` | `oklch(0.9 0.004 95)` | `oklch(1 0 0 / 12%)` | Sidebar's own border/divider (the `aside`'s `border-r`, and the scrollbar thumb color via `[scrollbar-color:var(--sidebar-border)_transparent]` in `sidebar.tsx`). Distinct from the global `border` token — slightly darker/stronger in both themes since it separates the whole nav rail from content, not just a hairline inside a panel. |
| sidebar-ring | `--sidebar-ring` | `oklch(0.82 0.18 88)` | `oklch(0.84 0.18 88)` | Focus ring for sidebar-internal controls — same value as `ring`/`primary`. |
| chart-1 | `--chart-1` | `oklch(0.82 0.18 88)` | `oklch(0.84 0.18 88)` | First data series — same hue as `primary` (amber). See Chart Colors. |
| chart-2 | `--chart-2` | `oklch(0.64 0.13 230)` | `oklch(0.72 0.14 230)` | Second data series — blue. |
| chart-3 | `--chart-3` | `oklch(0.7 0.15 150)` | `oklch(0.74 0.15 150)` | Third data series — green. |
| chart-4 | `--chart-4` | `oklch(0.74 0.17 45)` | `oklch(0.79 0.17 45)` | Fourth data series — orange. |
| chart-5 | `--chart-5` | `oklch(0.6 0.18 20)` | `oklch(0.72 0.18 20)` | Fifth data series — red-orange. |

**Base palette:** `Frontend/components.json` declares `"baseColor": "neutral"`
— the shadcn CLI scaffolds any newly-installed primitive against a neutral
gray base, consistent with the near-achromatic (`~0.003–0.01` chroma)
`background`/`foreground`/`border`/`muted` values above. `primary` is the one
deliberately saturated departure from that neutral base (chroma `0.18`,
labeled "Premium Amber" in the source comment) — everything else in the
palette is intentionally quiet so `primary` (and, secondarily, `destructive`)
are the only colors that visually assert themselves.

There is no `foreground`-paired token for `border`, `input`, or `ring` —
these three are structural (borders/rings), never fill colors that host
text.

---

## Typography

Font loading happens in `Frontend/src/app/layout.tsx` via `next/font/google`:

```ts
const figtree = Figtree({ variable: "--font-sans", subsets: ["latin"], weight: "variable" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
```

Both variable classes are applied on `<html className={`${figtree.variable}
${geistMono.variable} h-full antialiased`}>`. `globals.css`'s `@theme inline`
block then maps them into Tailwind-facing font tokens:

| Token | CSS variable | Resolves to | Usage |
|---|---|---|---|
| `--font-sans` | `var(--font-sans)` (set by `next/font` to Figtree, variable weight) | Figtree | Body text, UI copy, headings. Applied globally via `html { @apply font-sans; }` in `globals.css`'s base layer — this is the default for everything unless overridden. |
| `--font-mono` | `var(--font-geist-mono)` | Geist Mono | Monospace text — not yet used anywhere in a component (`grep` for `font-mono` in `Frontend/src` returns no hits today), but the token exists and is the only sanctioned monospace family for future use (e.g. order IDs, SKUs, API keys, code snippets). Never pull in a second monospace font. |
| `--font-heading` | `var(--font-sans)` | Figtree (same family as body) | **Not a separate typeface** — it's an alias to `--font-sans`, kept as its own semantic token so heading-level text can be retargeted to a distinct display face later without touching every call site. Applied today via the `font-heading` utility class on `CardTitle` (`card.tsx`: `"font-heading text-base leading-snug font-medium ..."`). Use `font-heading` for any component-level title/heading element (card titles, section headings, page `h1`s), even though it currently renders identically to `font-sans` — this keeps the codebase ready for a heading-family change without a find/replace. |

There is no separate type-scale token set (no `--text-*` custom properties).
Font **size** is Tailwind's built-in `text-*` scale used directly
(`text-3xl`, `text-base`, `text-sm`, `text-xs`, etc.) — this is a real,
confirmed gap, not an oversight to route around. Observed real-world
precedents to follow rather than re-deriving:
- Page `h1`: `text-3xl font-semibold tracking-tight` (per the dashboard
  playbook's documented precedent from `dashboard-page.tsx`).
- Page subtitle: `text-muted-foreground` (size inherited from body).
- `CardTitle`: fixed at `font-heading text-base leading-snug font-medium`
  by `card.tsx` (drops to `text-sm` at `data-[size=sm]` card density) —
  don't override this per-instance; if a screen needs a different card
  title weight/size, that's a signal to add a card-title variant, not a
  one-off className override.
- `CardDescription`: `text-sm text-muted-foreground`.
- Button label text: `text-sm` (default/lg sizes) down to `text-[0.8rem]`
  (`sm` size) and `text-xs` (`xs` size) — see `buttonVariants` in
  `button.tsx`.

---

## Spacing

This project uses **Tailwind's default spacing scale exclusively** — there
are no custom `--spacing-*` tokens defined in `globals.css`. Every gap,
padding, and margin value in the codebase (`gap-1`, `gap-2.5`, `gap-4`,
`gap-6`, `px-3`, `py-1.5`, `p-4`, etc.) resolves through Tailwind v4's
built-in spacing scale, not a project-specific override. `Frontend` has no
`tailwind.config.js` (Tailwind v4's CSS-first config lives entirely in
`globals.css`'s `@import`/`@theme` block), confirming there is no shadow
spacing scale hiding elsewhere.

**One confirmed exception:** `Frontend/src/components/ui/card.tsx` defines a
local custom property, `--card-spacing`, scoped to the `Card` root and
consumed by its sub-components:

```
"...flex flex-col gap-(--card-spacing) ... py-(--card-spacing) ...
[--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)] ..."
```

- Default card density: `--card-spacing: --spacing(4)` (Tailwind's `4` step,
  i.e. `1rem`), consumed as `gap-(--card-spacing)`, `py-(--card-spacing)`,
  and `px-(--card-spacing)` by `CardHeader`, `CardContent`, and
  `CardFooter`.
- Dense variant: `<Card size="sm">` sets `--card-spacing: --spacing(3)`
  (`0.75rem`) instead — use this for compact contexts (e.g. dashboard stat
  tiles), never a hand-rolled smaller padding className on a default-density
  `Card`.

No other component defines a local spacing custom property today. When a new
one is genuinely needed, follow this exact pattern (`--spacing(N)` referencing
Tailwind's scale, not a raw `rem`/`px` literal) rather than inventing an
unscoped one.

---

## Border Radius

`globals.css` derives the entire radius scale from a single base variable,
`--radius: 0.625rem` (10px, set once in `:root`, not overridden in `.dark` —
radius is identical in both themes), via the `@theme inline` block:

| Token | Formula | Computed value | When to use |
|---|---|---|---|
| `--radius-sm` | `calc(var(--radius) * 0.6)` | `0.375rem` (6px) | Small controls — checkboxes, switches, small badges, compact icon buttons. Also referenced via arbitrary clamped values in `button.tsx` (see below). |
| `--radius-md` | `calc(var(--radius) * 0.8)` | `0.5rem` (8px) | Mid-size controls. `button.tsx`'s `xs`/`sm`/`icon-xs`/`icon-sm` sizes use it via `rounded-[min(var(--radius-md),10px)]` / `rounded-[min(var(--radius-md),12px)]` — clamped so the radius never grows disproportionately relative to the button's small height. |
| `--radius-lg` | `var(--radius)` | `0.625rem` (10px) | The base/default radius. `buttonVariants`' root class uses `rounded-lg` for `default`/`lg` sized buttons. Use for standard-height interactive controls (buttons, inputs, dropdown triggers). |
| `--radius-xl` | `calc(var(--radius) * 1.4)` | `0.875rem` (14px) | Cards and card-like containers. `card.tsx`'s root uses `rounded-xl` (plus `rounded-t-xl`/`rounded-b-xl` on the header/footer and on a card's first/last child `<img>`). Use `radius-xl` for any `Card`-rooted surface (dashboard widgets, panels, dialogs once installed). |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` | `1.125rem` (18px) | Larger surfaces than a standard card — e.g. a hero/feature panel, a modal/sheet container if it should read softer than a base card. Not yet used in a real component; reach for this before inventing an arbitrary radius when `xl` reads too tight for a large surface. |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` | `1.375rem` (22px) | Very large decorative containers (e.g. a marketing-style empty-state illustration frame). Not yet used in a real component. |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` | `1.625rem` (26px) | The largest defined step — reserve for the rare full-bleed rounded container. Not yet used in a real component. |

`dropdown-menu.tsx` uses a flat `rounded-lg` on its content surfaces (not
`radius-xl`), reinforcing the convention that floating/menu surfaces sit at
the base `lg` step while card-level containers step up to `xl`.

Fully rounded controls (`rounded-full`) are used independently of this scale
for pill-shaped elements — nav items (`sidebar.tsx`'s `NavGroupItem`/
`NavLink`), status dots, and badge-like pills — this is a deliberate,
separate convention from the `--radius-*` step scale, not a missing token.

---

## Motion

**There is no centralized motion-token system yet.** `globals.css` defines
no `--duration-*` or `--ease-*` custom properties (confirmed by inspecting
the full file — only `--radius-*` and color/font tokens exist in the
`@theme inline` block). Every transition in the codebase is an ad hoc
Tailwind utility, repeated inline at each call site.

**De facto standard — use this exact literal for standard UI transitions
until real tokens exist:**

```
transition-all duration-200 ease-in-out
```

Confirmed real usage:
- `Frontend/src/components/layout/header.tsx` — the sidebar-toggle icon
  cross-fade (`ListIcon`/`XIcon`, lines 28 and 34): `"size-5 transition-all
  duration-200 ease-in-out"`, combined with `rotate-*`/`scale-*`/`opacity-*`
  utilities per open/closed state.
- `Frontend/src/components/layout/sidebar.tsx` — the active/hover state of
  `NavGroupItem` (`itemClassName`, line 129): `"... transition-all
  duration-200 ease-in-out"`; the mobile overlay backdrop fade (line 296):
  `"... transition-opacity duration-200 ease-in-out ..."`; the aside's own
  width/transform transition when collapsing (line 305):
  `"transition-[width,transform] duration-200 ease-in-out"`; the logout
  button's hover state (line 281): same `transition-all duration-200
  ease-in-out`.

**Named variant — collapsing sidebar labels specifically use a narrower
transition list, not `transition-all`:**

```
transition-[width,opacity] duration-200 ease-in-out
```

This is `sidebar.tsx`'s `collapsibleLabelClassName` helper (line 57):
`"overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200
ease-in-out"`, applied to every nav-item label span that must shrink/fade
away when the sidebar collapses to an icon rail. Use this exact
`transition-[width,opacity]` (not `transition-all`) whenever a collapsing
label/panel needs to animate specifically its width and opacity without
also transitioning unrelated properties (e.g. color, which should snap
immediately, not lag behind the collapse).

One additional real-world duration exists outside this pair:
`sidebar.tsx`'s `CollapsibleContent` (line 233) uses
`transition-[height] duration-200 ease-out` (note: `ease-out`, not
`ease-in-out`) for the expand/collapse of nav sub-items — `duration-200` is
still the shared constant, but the easing curve differs for this
height-driven panel reveal. Follow this distinction: `ease-in-out` for
symmetric hover/state toggles, `ease-out` for one-directional reveal/dismiss
panels.

**Elevation (shadows):** the same gap applies to shadows — no `--shadow-*`
custom properties exist in `globals.css`. Real usage is Tailwind's built-in
shadow utilities applied ad hoc: `shadow-sm` (active sidebar nav item,
`sidebar.tsx` line 132), `shadow-2xl`/`xl:shadow-none` (mobile sidebar drawer
overlay, line 307), `shadow-md` (sidebar collapse-toggle button, line 341),
and `shadow-md`/`shadow-lg` on floating surfaces (`dropdown-menu.tsx`'s
content panels). Elevation for `Card` itself is **not** a shadow at all —
`card.tsx` uses `ring-1 ring-foreground/10` (a hairline ring, not a drop
shadow) for its resting-state depth cue; reserve real `shadow-*` utilities
for genuinely floating/overlay surfaces (dropdowns, popovers, drawers,
modals), and use the `ring-1 ring-foreground/10` convention for flat/resting
cards, matching the existing precedent instead of adding shadows to cards.

**Future Growth (flagged, not fixed here):** centralizing motion into real
`--duration-*`/`--ease-*` tokens (and, separately, shadow/elevation into
`--shadow-*` tokens) is recorded in ADR-0003 as an explicit Future Growth
item, out of scope for this documentation-layer enhancement. Do not invent
new `--duration-*`/`--ease-*`/`--shadow-*` tokens preemptively — until the
Documentation Engineer formally introduces them, keep using the literals
above consistently so a future centralization pass is a mechanical find/
replace, not an archaeology project.

Per the Premium UI Engineer's Motion standard: only fade, slide, scale,
hover-transition, focus-transition, and loading-shimmer are sanctioned
animation types — never a gratuitous or attention-stealing animation,
regardless of how "premium" additional motion might seem.

---

## Chart Colors

Five chart-series tokens are already defined in `globals.css`, each with
independent light/dark values, and are ready for immediate use in any
analytics/dashboard visualization — no additional tokens need to be added
before charting work begins:

| Token | Light | Dark | Hue |
|---|---|---|---|
| `--chart-1` | `oklch(0.82 0.18 88)` | `oklch(0.84 0.18 88)` | Amber (matches `primary`) |
| `--chart-2` | `oklch(0.64 0.13 230)` | `oklch(0.72 0.14 230)` | Blue |
| `--chart-3` | `oklch(0.7 0.15 150)` | `oklch(0.74 0.15 150)` | Green |
| `--chart-4` | `oklch(0.74 0.17 45)` | `oklch(0.79 0.17 45)` | Orange |
| `--chart-5` | `oklch(0.6 0.18 20)` | `oklch(0.72 0.18 20)` | Red-orange |

Per the Dashboard playbook (`.claude/ui/playbooks/dashboard.md`), the only
sanctioned charting path is shadcn's `chart` component
(`npx shadcn@latest add chart`, which generates `components/ui/chart.tsx`
and pulls in `recharts`). Map every series color through that component's
`ChartConfig` using `var(--chart-1)` through `var(--chart-5)` directly —
never a new hex/oklch literal per series, and never a second charting
library. If a visualization genuinely needs a 6th+ distinct series color,
that's a token-addition escalation (propose `--chart-6` in `globals.css`),
not a one-off hardcoded color.

---

## Cursor Pointer Standard

Interactive elements across the application automatically use the correct cursor via centralized base styling rules in `Frontend/src/app/globals.css`. Developers must **never** manually add inline cursor classes (e.g. `cursor-pointer`, `cursor-not-allowed`) to interactive or disabled states.

Centralized styling rules applied globally:
- **Interactive Elements** (`a`, `button`, `select`, `summary`, `[role="button"]`, `[role="link"]`, `[role="tab"]`, `[role="menuitem"]`, `[role="switch"]`, checkbox/radio inputs): `cursor: pointer`
- **Disabled State** (`:disabled`, `[disabled]`, `[aria-disabled="true"]`, `[data-disabled]`): `cursor: not-allowed !important`
- **Text Inputs** (`input[type="text"]`, `input[type="password"]`, `input[type="email"]`, `input[type="number"]`, `input[type="search"]`, `textarea`, `[contenteditable="true"]`): `cursor: text`
- **Non-Interactive Elements** (headings, body, divs, spans): `cursor: default` (inherited from body)

When building custom interactive components (like clickable cards), always add semantic accessibility attributes such as `role="button"` or `role="link"` to inherit the pointer cursor automatically.

---

## Usage Rules

1. **Never hardcode a color.** No hex literal (`#f59e0b`), no raw Tailwind
   color utility (`bg-blue-500`, `text-red-600`, `border-zinc-200`) —
   always reference a token-backed utility (`bg-primary`, `text-destructive`,
   `border-border`). This includes utilities that *look* like tokens but
   aren't — e.g. `sidebar.tsx`'s collapse-toggle button currently uses
   `bg-white`/`text-zinc-600`/`hover:bg-zinc-50`/`hover:text-zinc-900`
   (line 341), which is a real, pre-existing violation of this rule, not a
   pattern to copy — treat it as a known defect to fix opportunistically
   (e.g. `bg-card`/`text-muted-foreground`/`hover:bg-muted`), not a
   precedent to repeat in new code.
2. **Never hardcode spacing, typography size, or radius** outside
   Tailwind's own default scale and the `--radius-*` scale documented above.
   No arbitrary `px-[13px]`, no `text-[15px]`, no `rounded-[7px]` unless it
   is a deliberately *clamped* pairing with an existing token (as in
   `button.tsx`'s `rounded-[min(var(--radius-md),10px)]` — clamping a real
   token, not inventing an unrelated value).
3. **Never hardcode a transition duration or easing curve** outside the
   documented `duration-200 ease-in-out` / `duration-200 ease-out` de facto
   standard, and never add a shadow outside Tailwind's default `shadow-*`
   scale.
4. **If a value genuinely has no token yet, the correct action is proposing
   a new token addition to `globals.css`** (a new `--color-*`, a new step in
   the `--radius-*` scale, or — per the Motion section — eventually a real
   `--duration-*`/`--ease-*`/`--shadow-*` token) — never "hardcode it
   temporarily." Temporary hardcoded values are how visual drift enters a
   100+-module codebase; there is no exception for "just this once."
5. **Always prefer the semantic token over a structurally-identical
   alternative** — e.g. use `border-border` for a divider even though
   `border-input` currently resolves to a visually similar value; the two
   tokens exist separately because their semantic roles (generic hairline
   vs. form-control emphasis) are allowed to diverge independently in a
   future palette update.
6. **Dark mode is not optional per token** — every new color token must be
   defined in both `:root` and `.dark` before use; a token that only exists
   in one theme is incomplete, not "fine for now."
7. **When escalating a missing token**, name the exact token you propose
   (e.g. "add `--color-success` / `--color-success-foreground`, paired
   light/dark values") rather than describing the problem abstractly — the
   Documentation Engineer and Premium UI Engineer need a concrete addition
   to review, not a vague gap report.
