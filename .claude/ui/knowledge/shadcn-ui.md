# shadcn/ui Knowledge Pack

UI Knowledge Pack — Framework v1.1.1 (Premium UI Engineering layer).
Read by: Premium UI Engineer (`.claude/agents/premium-ui-engineer.md`) and Frontend Engineer,
**before** installing or touching any `Frontend/src/components/ui/*` component.

This document describes this project's actual shadcn setup as configured in
`Frontend/components.json` and as it exists on disk today. It is not generic shadcn
documentation — where this project's conventions diverge from shadcn's defaults or from
what most tutorials assume, that divergence is the point of this document.

---

## 0. Read This First: Base UI, Not Radix

`Frontend/components.json` sets `"style": "base-nova"`. In this shadcn registry, that style
means every primitive component is built on **Base UI** (`@base-ui/react`, currently `^1.6.0`),
**not Radix UI**. This is the single most consequential fact in this document.

Almost all shadcn tutorials, Stack Overflow answers, and even shadcn's own default docs
assume Radix primitives (`@radix-ui/react-*`). None of that applies here. Concretely:

- **Package**: components import from `@base-ui/react/<primitive>`, e.g.
  `import { Button as ButtonPrimitive } from "@base-ui/react/button"`,
  `import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"`,
  `import { Menu as MenuPrimitive } from "@base-ui/react/menu"` (dropdown-menu is built on
  Base UI's `Menu`, not a `DropdownMenu` primitive), `import { Input as InputPrimitive } from "@base-ui/react/input"`,
  `import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"`,
  `import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"`.
- **State attributes differ from Radix.** Radix uses `data-state="open" | "closed"`. Base UI
  uses **boolean-style presence attributes**: `data-open` and `data-closed` (present/absent,
  not a `data-state` string). You will see this throughout the installed components' Tailwind
  classes, e.g. in `dropdown-menu.tsx`:
  `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95`.
  Do not write `data-[state=open]:` selectors expecting them to match Base UI components —
  they won't. (One inconsistency to be aware of: `tooltip.tsx` mixes a legacy-looking
  `data-[state=delayed-open]:` selector alongside `data-open:` — Base UI's tooltip popup does
  carry both; don't take that single file as license to reintroduce Radix-style `data-state`
  selectors elsewhere.)
- **Compound part naming differs.** Radix's `Content`/`Portal`/`Trigger` triad maps to Base UI
  concepts that are sometimes named differently and sometimes split further, e.g. dropdown menu
  content is composed from `MenuPrimitive.Portal` → `MenuPrimitive.Positioner` →
  `MenuPrimitive.Popup` (three layers, not one `Content`). Tooltip follows the same
  Portal → Positioner → Popup shape. Collapsible exposes `.Root`, `.Trigger`, `.Panel`
  (Base UI calls the expandable region `Panel`, not `Content` — the wrapper in this repo
  renames it to `CollapsibleContent` for API familiarity, but the underlying prop types are
  `CollapsiblePrimitive.Panel.Props`).
- **Props types come from the primitive's namespace**, e.g. `ButtonPrimitive.Props`,
  `CollapsiblePrimitive.Root.Props`, `MenuPrimitive.Popup.Props`. When extending a component's
  props, extend from the Base UI type, not a Radix-shaped one.
- **`render` prop / `asChild` equivalence**: Base UI's composition model favors a `render` prop
  over Radix's `asChild` pattern in places. Before assuming `asChild` works on a given
  primitive, check the installed component or the Base UI docs for that primitive.

**Practical consequence**: when adding a new shadcn component to this project, or when the
shadcn CLI's registry output for `base-nova` doesn't quite match what you expect from memory of
"how shadcn usually does it," trust the file that lands on disk and this document over prior
Radix-based knowledge. If a new component needs custom animation/state styling, grep the
existing installed components (`collapsible.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`) for the
`data-open`/`data-closed` pattern before writing new selectors.

---

## 1. Project Configuration

`Frontend/components.json` (verbatim, as of this writing):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

What each setting means for this project:

- `"style": "base-nova"` — Base UI-backed component variant (see §0). This is not one of
  shadcn's classic `"default"`/`"new-york"` Radix styles.
- `"rsc": true` — components are written for the Next.js App Router / React Server Components
  model; interactive primitives that need client behavior are explicitly marked `"use client"`
  at the top of the file (see `collapsible.tsx`, `dropdown-menu.tsx`, `separator.tsx`,
  `tooltip.tsx`, `sonner.tsx`). `card.tsx`, `field.tsx`'s non-interactive parts, `label.tsx`,
  and `input.tsx`/`button.tsx` are plain (no directive needed unless they hold client state).
- `"tsx": true` — components are generated as `.tsx`.
- `"tailwind.css": "src/app/globals.css"` — this is the single Tailwind entry point; CSS custom
  properties (theme tokens like `--card-spacing`, `--radius-md`, color tokens such as
  `--primary`, `--destructive`) are defined there and consumed via `var(...)` / Tailwind's
  arbitrary-value syntax (`bg-(--card-spacing)`-style utilities) throughout the `ui/` components.
- `"baseColor": "neutral"` — the generated color palette is neutral-gray based, not slate/zinc/stone.
- `"cssVariables": true` — theming goes through CSS variables (`bg-primary`, `text-destructive`,
  etc. resolve to `var(--primary)` etc.), not static Tailwind color classes. Any new component
  must use the same token classes (`bg-card`, `text-muted-foreground`, `ring-foreground/10`, ...)
  rather than hardcoded Tailwind palette colors, to stay theme-consistent (light/dark).
- `"tailwind.prefix": ""` — no Tailwind class prefix; utility classes are used unprefixed as normal.
- `"iconLibrary": "lucide"` — **stale/incorrect for this project**; see §2, do not treat as guidance.
- `"rtl": false` — no right-to-left layout support is configured.
- Aliases — always import through these, never via relative paths reaching into `components/ui`
  or `lib`:
  - `@/components` → `Frontend/src/components`
  - `@/components/ui` → `Frontend/src/components/ui`
  - `@/lib` → `Frontend/src/lib`
  - `@/lib/utils` → `Frontend/src/lib/utils` (the `cn()` helper, see §6)
  - `@/hooks` → `Frontend/src/hooks`
- `"menuColor": "default"`, `"menuAccent": "subtle"` — registry-level theming knobs for menu-family
  components (dropdown menu, context menu, etc.); leave as-is unless a design change is
  explicitly requested.
- `"registries": {}` — no additional/third-party component registries are configured; only the
  standard shadcn registry is in play.

---

## 2. Icon Library Mismatch: `lucide` config vs. Phosphor reality

`components.json` declares `"iconLibrary": "lucide"`. This is **wrong for this codebase and
must never be followed**. Every feature file in this project imports icons exclusively from
`@phosphor-icons/react` (`^2.1.10`, present in `Frontend/package.json`). `lucide-react`
(`^1.23.0`) is present in `package.json` only as a transitive/leftover dependency for the two
components below — it is not a sanctioned icon source for anything new.

**Known, already-existing debt** (do not replicate this pattern; do not treat it as precedent):

- `Frontend/src/components/ui/dropdown-menu.tsx` — imports `ChevronRightIcon, CheckIcon` from
  `"lucide-react"`, used for the submenu chevron and the checkbox/radio item indicators.
- `Frontend/src/components/ui/sonner.tsx` — imports
  `CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon` from `"lucide-react"`,
  used for the toast type icons.

These two files were installed via the shadcn CLI and never had their icons swapped. They are
tracked debt, not a template to copy from. When you touch either file for an unrelated reason,
swap the icons per the procedure below as part of that change; do not leave new lucide imports
anywhere else in the codebase.

### Mandatory post-install swap procedure

Whenever a shadcn component is installed (or an existing one is edited) and it references
`lucide-react`:

1. Install/generate the component via the shadcn CLI as normal (see §3).
2. Grep the new/changed file for the literal string `from "lucide-react"`.
3. For every icon imported from `lucide-react`, replace it with its closest Phosphor
   equivalent imported from `@phosphor-icons/react`. Common mappings seen/needed in this
   codebase:
   - `ChevronRightIcon` → `CaretRightIcon`
   - `CheckIcon` → `CheckIcon` (Phosphor also exports `CheckIcon`; same name, different package)
   - `CircleCheckIcon` → `CheckCircleIcon`
   - `InfoIcon` → `InfoIcon`
   - `TriangleAlertIcon` → `WarningIcon` (or `WarningCircleIcon` depending on context)
   - `OctagonXIcon` → `XCircleIcon` (or `ProhibitIcon` for a stronger "blocked" connotation)
   - `Loader2Icon` (spinner) → `SpinnerGapIcon` or `CircleNotchIcon` with the existing
     `animate-spin` class retained
   - For anything not listed here, pick the nearest Phosphor icon by meaning, not by name
     similarity — Phosphor's naming scheme differs from Lucide's.
4. Update the import statement to `import { ... } from "@phosphor-icons/react"`.
5. Verify visual weight and size still match: Phosphor icons default to a `regular` weight and
   are sized via the `size` prop or a `className` with `size-*`/`h-*/w-*` utilities, same as
   this codebase's existing usage elsewhere. Check the icon renders at the same visual weight
   as the rest of the component (most `ui/` components size icons via
   `[&_svg:not([class*='size-'])]:size-4`-style descendant selectors — Phosphor icons render as
   `<svg>` and satisfy these selectors identically to Lucide, so no selector changes are needed,
   only the import and the icon name).
6. Re-check the component visually (Storybook/running app) to confirm nothing shifted — Phosphor
   and Lucide icons can differ slightly in optical size/stroke weight even at the same numeric size.

Never install a new shadcn component and leave its default Lucide icons in place. If a
component you're installing has no icons, there is nothing to swap — but always check.

---

## 3. Installing a New Component

Use the shadcn CLI exactly as configured by `components.json` — no manual scaffolding:

```
npx shadcn@latest add <component>
```

Run this from `Frontend/` (where `components.json` lives). The CLI will:
- Emit the component into `Frontend/src/components/ui/<component>.tsx`, honoring the
  `ui` alias.
- Use the `base-nova` style, so the generated component will be Base UI-backed (see §0) —
  expect `@base-ui/react/*` imports, not `@radix-ui/react-*`.
- Follow `cssVariables`/`baseColor: neutral` theming, so classes will reference the same
  token set (`bg-card`, `text-muted-foreground`, `ring-foreground/10`, etc.) already used
  elsewhere in `ui/`.
- Possibly include `lucide-react` icon imports per the (incorrect) `iconLibrary` setting.

**Mandatory step after every install**: perform the icon-swap procedure in §2 before
considering the component done. This is not optional cleanup — treat a fresh install with
un-swapped Lucide icons as an incomplete task, the same way you'd treat a failing type-check.

After installing, also verify:
- The component's props type extends the correct Base UI namespace type (not a hand-written
  Radix-shaped type left over from copy-pasted reference code).
- Any `"use client"` directive is present if the component holds interactive/client-only
  behavior (compare against `collapsible.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `separator.tsx`).
- The component composes with `cn()` for `className` merging (see §6), matching every existing
  file in `ui/`.

---

## 4. Current Inventory

### Already installed (`Frontend/src/components/ui/`)

| File | Notes |
|---|---|
| `button.tsx` | `cva`-based variants; see §5 |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`; supports `size="default" \| "sm"` |
| `collapsible.tsx` | Base UI `Collapsible` (`Root`/`Trigger`/`Panel`) |
| `dropdown-menu.tsx` | Base UI `Menu`; **has un-swapped lucide icons** (`ChevronRightIcon`, `CheckIcon`) — see §2 |
| `field.tsx` | Form field composition primitives (`Field`, `FieldSet`, `FieldGroup`, `FieldLabel`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldSeparator`, `FieldLegend`, `FieldTitle`) — pairs with `label.tsx` and `separator.tsx` |
| `input.tsx` | Base UI `Input` |
| `label.tsx` | Plain `<label>` wrapper, peer/group-disabled aware |
| `separator.tsx` | Base UI `Separator` |
| `sonner.tsx` | Toast wrapper (`sonner` package + `next-themes`); **has un-swapped lucide icons** (`CircleCheckIcon`, `InfoIcon`, `TriangleAlertIcon`, `OctagonXIcon`, `Loader2Icon`) — see §2 |
| `tooltip.tsx` | Base UI `Tooltip` (`Provider`/`Root`/`Trigger`/`Portal`/`Positioner`/`Popup`) |

### Commonly needed but NOT yet installed

The 12 UI playbooks in `.claude/ui/playbooks/` (`analytics.md`, `authentication.md`,
`crud-module.md`, `dashboard.md`, `data-table.md`, `detail-page.md`, `dialog.md`, `drawer.md`,
`filter-bar.md`, `form.md`, `multi-step-wizard.md`, `settings-page.md`) repeatedly assume these
primitives as prerequisites. None exist in `ui/` yet — flag installing them via the CLI (§3)
whenever a playbook needs one, and remember the mandatory icon swap for any that ship with
Lucide defaults (Base UI/shadcn's `table`, `select`, `command`, and `chart` scaffolds in
particular tend to include icons):

`table`, `dialog`, `alert-dialog`, `sheet`, `badge`, `skeleton`, `tabs`, `select`, `checkbox`,
`radio-group`, `switch`, `textarea`, `progress`, `avatar`, `alert`, `popover`, `command`,
`chart` (recharts wrapper), `pagination`.

Never hand-roll any of the above with raw `<div>`/`<table>` markup when the shadcn primitive is
missing — install it first.

---

## 5. Variant Pattern: `cva`

New components that need style variants follow the `class-variance-authority` (`cva`) pattern
established in `button.tsx`:

```ts
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "<base classes applied to every variant>",
  {
    variants: {
      variant: {
        default: "...",
        outline: "...",
        secondary: "...",
        ghost: "...",
        destructive: "...",
        link: "...",
      },
      size: {
        default: "...",
        xs: "...",
        sm: "...",
        lg: "...",
        icon: "...",
        "icon-xs": "...",
        "icon-sm": "...",
        "icon-lg": "...",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

The component then:
- Accepts `variant`/`size` (or whatever variant keys are defined) as props, typed via
  `VariantProps<typeof buttonVariants>` intersected with the primitive's own `Props` type
  (e.g. `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`).
- Applies the computed classes through `cn(buttonVariants({ variant, size, className }))` so
  a caller-supplied `className` can still override/extend via `tailwind-merge` (§6).
- Exports both the component and the `*Variants` function (`export { Button, buttonVariants }`)
  so other components (e.g. things styled to look like a button, or composed variants) can
  reuse the same class map without re-deriving it.

`field.tsx` follows the same pattern for `fieldVariants` (keyed on `orientation:
"vertical" | "horizontal" | "responsive"`). Use this exact shape — `cva` call → typed props via
`VariantProps` → `cn(variants({...}, className))` → export the variants function — for any new
component that has more than one visual variant or size.

---

## 6. Composition Convention: `cn()`

`Frontend/src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- Signature: `cn(...inputs: ClassValue[]): string`. Accepts any `clsx`-compatible input
  (strings, arrays, objects with boolean values, `undefined`/`null`/`false` which are dropped).
- `clsx` resolves conditional class logic first; `tailwind-merge` then resolves conflicting
  Tailwind utility classes (e.g. a caller passing `className="px-4"` correctly overrides a
  component default of `px-2.5` instead of both being emitted).
- Every component in `ui/` imports this from `@/lib/utils` and applies it as
  `className={cn("<component's own default classes...>", className)}` (or, for
  variant-driven components, `cn(variants({...}), className)` — see §5). Always thread a
  `className` prop through this way so consumers can override styles predictably; never
  concatenate className strings manually or skip `cn()`.
