# UI Knowledge Pack — Phosphor Icons

**Framework layer:** Premium UI Engineering (Framework v1.1.1, ADR-0003)
**Read by:** Premium UI Engineer, Frontend Engineer — before using any icon, on every screen.
**Package:** `@phosphor-icons/react` `^2.1.10` (pinned in `Frontend/package.json`).

This document is grounded in this repository's actual, shipped icon usage. It
is not a copy of Phosphor's public docs — every rule below is either an
observed convention in `Frontend/src` or an explicit, labeled extension of
one. If you find an icon usage in the codebase that contradicts this
document, treat the document as stale and flag it to the Documentation
Engineer rather than silently picking a side.

---

## 1. Why Phosphor (single icon library, consistency)

This codebase uses **exactly one** icon library: Phosphor Icons. Every
screen, form, nav item, button, and toast must draw its icons from
`@phosphor-icons/react`. No other icon set (Lucide, Heroicons, Radix Icons,
react-icons, inline custom SVGs standing in for a concept Phosphor already
covers) is permitted anywhere in `Frontend/src`.

Rationale:
- **Visual consistency.** Phosphor ships regular/bold/fill/duotone/thin
  weights of a single coherent stroke system. Mixing in Lucide's different
  stroke width and corner radius immediately reads as "assembled admin
  template," which fails this project's stated premium-SaaS bar (Linear,
  Vercel, Stripe Dashboard, Notion, Raycast, Clerk — see
  `.claude/agents/premium-ui-engineer.md`).
- **One name space.** Every future contributor and agent should be able to
  ask "what's the icon for X" and get one unambiguous, previously-decided
  answer (see the mapping table in §4) instead of re-deciding it per module.
- **Bundle discipline.** One icon package, imported consistently, tree-shakes
  cleanly. Two icon libraries in the same bundle is pure waste with zero
  visual upside.

`@phosphor-icons/react` is the **only** icon dependency this project should
ever need. `lucide-react` is present in `package.json` **only** as a
transitive artifact of shadcn's default scaffolding (see §6) — it is not a
sanctioned dependency to import from directly, ever.

---

## 2. Import Conventions

Phosphor's React package ships three entry points. This project uses exactly
two of them, and the choice is not stylistic — it is determined by whether
the file is a Server Component or a Client Component.

| Entry point | Use in | Confirmed real usage |
|---|---|---|
| `@phosphor-icons/react` | Client Components (`"use client"`) | `login-form.tsx`, `product-form.tsx`, `theme-toggle.tsx`, `language-switcher.tsx`, `header.tsx`, `sidebar.tsx`, `config/nav.ts` |
| `@phosphor-icons/react/dist/ssr` | Server Components (no `"use client"`) | `login-page.tsx` (`StorefrontIcon`) |
| `@phosphor-icons/react/dist/csr` | Not used in this codebase | — |

**The rule, precisely:** if the file containing the icon has (or would need)
a `"use client"` directive, import from `@phosphor-icons/react`. If the file
is an `async` Server Component (no `"use client"`, e.g. a page or layout that
does `await getTranslations(...)` or fetches server-side), import the same
icon names from `@phosphor-icons/react/dist/ssr` instead.

**Why this matters (bundle size / SSR):**
- Phosphor's default `@phosphor-icons/react` export wraps every icon in a
  context-aware component that reacts to a client-side `<IconContext>`
  provider (for setting a global default weight/size/color). That context
  plumbing requires client-side JS.
- The `/dist/ssr` entry point exports icons as plain server-renderable
  components with no client runtime dependency, so importing it inside a
  Server Component keeps that component's icon usage out of the client
  JS bundle entirely — it renders to static markup on the server and never
  hydrates.
- Importing the default `@phosphor-icons/react` path inside a Server
  Component still works, but silently drags client-context machinery into a
  place that never needed it, and importing `/dist/ssr` inside a Client
  Component breaks the shared `<IconContext>` weight/size defaults other
  icons on the page rely on. Get the entry point wrong in either direction
  and you either bloat the client bundle or lose a shared styling contract —
  match the import to the component type, every time, with no exceptions.
- Concretely: `login-page.tsx` is `export async function LoginPage()` with
  no `"use client"` — that's why it imports `StorefrontIcon` from
  `@phosphor-icons/react/dist/ssr`. Its child, `login-form.tsx`, is
  `"use client"` and imports `EnvelopeSimpleIcon`/`LockKeyIcon`/
  `CircleNotchIcon`/`SparkleIcon` from the regular `@phosphor-icons/react`.
  This split — SSR icon in the server shell, client icons in the
  interactive form — is the reference pattern for any page assembled the
  same way (a Server Component page wrapping a Client Component form/table).

---

## 3. Weight Convention

Phosphor icons support `thin` / `light` / `regular` / `bold` / `fill` /
`duotone` weights via a `weight` prop. Observed real usage in this codebase:

| Weight | Where used | Pattern |
|---|---|---|
| `regular` (default, no `weight` prop) | Most icons — form field icons (`login-form.tsx`, `product-form.tsx`), header icons (`ListIcon`/`XIcon`), sidebar chevron (`CaretRightIcon`), collapse rail (`CaretLineLeftIcon`/`CaretLineRightIcon`), logout (`SignOutIcon`) | The unmarked default. Nothing special is being communicated. |
| `bold` | `theme-toggle.tsx` (`SunIcon`/`MoonIcon`), `language-switcher.tsx` (`TranslateIcon`) | Standalone icon-only circular buttons in the header use `weight="bold"` for a slightly heavier, more legible glyph at small size against the header chrome. |
| `fill` | `login-page.tsx` (`StorefrontIcon weight="fill"`), `sidebar.tsx` (`item.icon weight={active ? "fill" : "regular"}`) | Two distinct meanings: (1) brand/logo mark → always `fill` for solidity; (2) **active-state signaling in navigation** — a nav item's icon switches from `regular` to `fill` when its route is active. This is the project's established way of showing "you are here" in the sidebar without a second color system. |

**Project convention, stated explicitly:**
1. Default to `regular` (omit the `weight` prop) for all icons unless one of
   the two cases below applies.
2. Use `weight="bold"` for standalone icon-only circular header/toolbar
   buttons (the `ThemeToggle`/`LanguageSwitcher` pattern) — never for inline
   field or nav icons.
3. Use `weight="fill"` for exactly two purposes: the brand mark
   (`StorefrontIcon` as used in `login-page.tsx`), and **active/selected
   state in navigation or toggles**, following `sidebar.tsx`'s
   `weight={active ? "fill" : "regular"}` pattern. Do not invent a third
   meaning for `fill` (e.g. don't use it to mean "important" or
   "destructive" — that's a color/token decision, not a weight decision).
4. `thin`, `light`, and `duotone` are not used anywhere in this codebase
   today. Do not introduce them without a documented reason — a fifth weight
   convention fragments the visual language this pack exists to prevent.

---

## 4. Sizing Convention

Every icon in this codebase is sized with a Tailwind `size-*` utility class
on the icon component itself (never a bare unstyled `<Icon />` and never
inline `style`/`width`/`height` props). Observed sizes:

| Size | Context | Confirmed usage |
|---|---|---|
| `size-3.5` | Small inline chevrons/carets inside compact UI (sidebar collapse rail, nested-group disclosure caret) | `sidebar.tsx`: `CaretLineRightIcon`/`CaretLineLeftIcon`, `CaretRightIcon` |
| `size-4` | **Standard inline-with-text size** — field label icons, button leading icons, spinners, icon-only close buttons at body-text scale | `login-form.tsx` (`EnvelopeSimpleIcon`, `LockKeyIcon`, `CircleNotchIcon`, `SparkleIcon`), `product-form.tsx` (`PackageIcon`, `CurrencyInrIcon`, `TagIcon`, `CircleNotchIcon`), `theme-toggle.tsx`, `language-switcher.tsx`, `sidebar.tsx` (`XIcon`) |
| `size-4.5` | Sidebar navigation item icons (one notch larger than body-text `size-4`, to hold visual weight against the nav's bigger touch targets) | `sidebar.tsx`: `item.icon`, `SignOutIcon` |
| `size-5` | Header icon-button icons (hamburger/close toggle) and the brand mark | `header.tsx`: `ListIcon`/`XIcon`; `login-page.tsx`: `StorefrontIcon` |

**Stated convention:**
- **Inline-with-text** (form field labels, buttons with a label, spinners
  next to submit-button text): `size-4`. This is the default — reach for it
  first.
- **Standalone icon-only buttons** (header toggles, theme/language switcher
  circular buttons): `size-4`–`size-5` depending on the button's own size —
  `size-4` for compact controls, `size-5` for primary header-level toggles
  (`header.tsx`'s hamburger/close).
- **Navigation rail icons** (sidebar items): `size-4.5` — a deliberate
  half-step up from body text to read clearly at the sidebar's larger row
  height.
- **Small auxiliary glyphs** (disclosure carets, collapse-rail carets):
  `size-3.5`.
- Never size an icon by wrapping it in a fixed-pixel container or using
  arbitrary values (`size-[17px]`) — stick to the Tailwind scale steps above.
  If none fits, that's a signal to consult the Premium UI Engineer before
  inventing a new step.

---

## 5. Icon-to-Concept Mapping

### Confirmed — already shipped in this codebase

| Concept | Icon | Source |
|---|---|---|
| Email field | `EnvelopeSimpleIcon` | `login-form.tsx` |
| Password field | `LockKeyIcon` | `login-form.tsx` |
| Loading / submitting | `CircleNotchIcon` + `animate-spin` | `login-form.tsx`, `product-form.tsx` |
| Demo/quick-fill affordance | `SparkleIcon` | `login-form.tsx` (also reused as the "brands" nav icon in `config/nav.ts`) |
| Brand mark ("Quick Commerce") | `StorefrontIcon weight="fill"` | `login-page.tsx` (also reused for "seller management" nav group in `config/nav.ts`) |
| Product name field | `PackageIcon` | `product-form.tsx` (also the "products" nav icon) |
| Price field (₹) | `CurrencyInrIcon` | `product-form.tsx` |
| Category field | `TagIcon` | `product-form.tsx` |
| Theme toggle (light) | `SunIcon weight="bold"` | `theme-toggle.tsx` |
| Theme toggle (dark) | `MoonIcon weight="bold"` | `theme-toggle.tsx` |
| Language switcher | `TranslateIcon weight="bold"` | `language-switcher.tsx` |
| Sidebar open (mobile hamburger) | `ListIcon` | `header.tsx` |
| Sidebar/panel close | `XIcon` | `header.tsx`, `sidebar.tsx` |
| Sidebar collapse (rail → expand) | `CaretLineRightIcon` | `sidebar.tsx` |
| Sidebar collapse (rail → collapse) | `CaretLineLeftIcon` | `sidebar.tsx` |
| Nested nav group disclosure | `CaretRightIcon` (rotates 90° when open) | `sidebar.tsx` |
| Logout | `SignOutIcon` | `sidebar.tsx` |
| Nav: Dashboard | `HouseIcon` | `config/nav.ts` |
| Nav: POS Dashboard | `ChartBarIcon` | `config/nav.ts` |
| Nav: Orders | `CubeIcon` | `config/nav.ts` |
| Nav: Return Requests | `ArrowUUpLeftIcon` | `config/nav.ts` |
| Nav: Dispatch Management | `TruckIcon` | `config/nav.ts` |
| Nav: Categories | `SquaresFourIcon` | `config/nav.ts` |
| Nav: Tax Rates | `ReceiptIcon` | `config/nav.ts` |
| Nav: Customers | `UsersIcon` | `config/nav.ts` |
| Nav: Stores | `BuildingsIcon` | `config/nav.ts` |
| Nav: Delivery Boys | `MotorcycleIcon` | `config/nav.ts` |
| Nav: Banners | `ImageIcon` | `config/nav.ts` |
| Nav: Featured Sections | `StarIcon` | `config/nav.ts` |
| Nav: Promos | `TicketIcon` | `config/nav.ts` |
| Nav: Ad Campaigns | `MegaphoneIcon` | `config/nav.ts` |
| Nav: App Notifications | `BellIcon` | `config/nav.ts` |
| Nav: Notifications (push/alerts) | `BellRingingIcon` | `config/nav.ts` |
| Nav: FAQs | `QuestionIcon` | `config/nav.ts` |
| Nav: Delivery Zones | `MapTrifoldIcon` | `config/nav.ts` |
| Nav: Roles & Permissions | `ShieldCheckIcon` | `config/nav.ts` |
| Nav: Settings | `GearIcon` | `config/nav.ts` |
| Nav: Cron Monitor | `ClockIcon` | `config/nav.ts` |
| Nav: System Updates | `ArrowsClockwiseIcon` | `config/nav.ts` |

Active nav-item state is signaled by weight (`fill` vs `regular`), not by a
different icon — see §3.

### Recommended — not yet used, apply for consistency the first time each concept appears

These are **not yet observed** in the codebase. They are specified here so
that the first module to need them (and every module after) uses the same
icon, rather than each agent/developer guessing independently. Confirmed
against the installed `@phosphor-icons/react@2.1.10` export list.

| Concept | Icon | Notes |
|---|---|---|
| Delete (destructive row/record action) | `TrashIcon` | Pair with a confirmation `Dialog`/`AlertDialog` per the Premium UI Engineer's decision rules — never fire on a bare click. |
| Edit | `PencilSimpleIcon` | Use for row-level and page-level "edit" actions uniformly. |
| Add / Create | `PlusIcon` | Primary "add new X" buttons (e.g. "Add Product"). |
| Search | `MagnifyingGlassIcon` | Leading icon inside search `Input`s, table toolbars. |
| Close (dialog/sheet/toast dismiss) | `XIcon` | Same icon already used for sidebar/panel close (`header.tsx`, `sidebar.tsx`) — reuse it, don't introduce `XCircleIcon` for this. |
| Sort ascending | `CaretUpIcon` | Sortable table header state. |
| Sort descending | `CaretDownIcon` | Sortable table header state. |
| Sort (unsorted/sortable, neutral) | `CaretUpDownIcon` | Default state of a sortable header before a direction is chosen. |
| Filter | `FunnelIcon` | Table/list toolbar filter trigger. |
| Row actions menu (kebab trigger) | `DotsThreeIcon` | Pairs with the existing `DropdownMenu` primitive for row actions, per the Premium UI Engineer's data-table pattern. |

If a future concept isn't covered by either table, the Premium UI Engineer
decides the icon (per its role as final authority on presentation) and this
document should be updated — don't let two modules independently invent two
different icons for the same concept.

---

## 6. The Lucide Contamination Risk

**Confirmed, currently-live issue.** `Frontend/components.json` (shadcn's own
config) declares:

```json
"iconLibrary": "lucide"
```

This means shadcn's CLI generator defaults every newly-installed component to
Lucide icon imports — and two already-installed components have never been
cleaned up:

- `Frontend/src/components/ui/dropdown-menu.tsx` imports
  `ChevronRightIcon, CheckIcon` from `lucide-react` (submenu chevron and
  checkbox/radio item indicators).
- `Frontend/src/components/ui/sonner.tsx` imports
  `CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon`
  from `lucide-react` (toast type icons).

**This pack is the canonical statement of the rule these violate: every
icon in this codebase must be a Phosphor icon, with zero exceptions —
including inside shadcn-generated primitives.** `components.json`'s
`iconLibrary` setting does not override this; it is the mechanism that
creates the violation, not a justification for it. Changing
`iconLibrary` to a Phosphor value is not supported by shadcn's schema (it
only recognizes a fixed enum of known libraries), so the fix is always a
manual post-install swap, every time, not a config change.

### Remediation procedure (apply immediately after every `npx shadcn@latest add <component>`, and to close out the two known-outstanding files above)

1. Open the newly-generated (or existing-but-contaminated) component file
   and find every `from "lucide-react"` import.
2. Replace each Lucide icon name with its Phosphor equivalent, imported from
   `@phosphor-icons/react` (these are Client Components — shadcn `ui/`
   primitives are `"use client"`), per this confirmed mapping:

   | File | Lucide import (remove) | Phosphor replacement (use) |
   |---|---|---|
   | `dropdown-menu.tsx` | `ChevronRightIcon` | `CaretRightIcon` (matches the caret vocabulary already used for disclosure in `sidebar.tsx`) |
   | `dropdown-menu.tsx` | `CheckIcon` | `CheckIcon` (Phosphor exports the same name — swap the import source only) |
   | `sonner.tsx` | `CircleCheckIcon` (success) | `CheckCircleIcon` |
   | `sonner.tsx` | `InfoIcon` (info) | `InfoIcon` (Phosphor exports the same name — swap the import source only) |
   | `sonner.tsx` | `TriangleAlertIcon` (warning) | `WarningIcon` |
   | `sonner.tsx` | `OctagonXIcon` (error) | `XCircleIcon` |
   | `sonner.tsx` | `Loader2Icon` (loading, `animate-spin`) | `CircleNotchIcon` with `animate-spin` — reuse the project's established loading-spinner icon (§4/§5) instead of introducing a second spinner glyph |

3. Confirm every replaced icon still carries an explicit `size-*` class per
   §4 (Lucide defaults and Phosphor defaults are not guaranteed to match).
4. Re-check the file for any remaining bare `from "lucide-react"` import —
   the swap is not done until that import line is gone entirely.
5. Do not remove the `lucide-react` dependency from `package.json` as part
   of an unrelated change; once the last import is swapped project-wide,
   flag its removal to the Documentation Engineer/Frontend Engineer as a
   separate, explicit cleanup so it's tracked, not silently dropped.

A component is not "done" — by a shadcn install or by any edit that touches
it — while it still imports from `lucide-react`. Treat any such import
found during review as a blocking defect, not a style nit.

---

## 7. Accessibility

Every icon-only control (a button whose only visible content is an icon,
with no adjacent visible label) must carry a visually-hidden text label so
screen readers announce its purpose. The canonical precedent is
`Frontend/src/components/common/theme-toggle.tsx`:

```tsx
<Button ...>
  <SunIcon weight="bold" className="..." />
  <MoonIcon weight="bold" className="..." />
  <span className="sr-only">{label}</span>
</Button>
```

The same pattern is repeated in `language-switcher.tsx` (`<span
className="sr-only">{label}</span>` inside the trigger button) and in
`header.tsx`'s hamburger/close toggle and `sidebar.tsx`'s close/collapse
buttons. Apply this to every icon-only control without exception:

- The `sr-only` text describes the action ("Toggle theme", "Close sidebar",
  "Expand sidebar"), not the icon ("Sun icon").
- Purely decorative icons that sit next to visible text (e.g. the
  `EnvelopeSimpleIcon` beside the "Email" field label) do not need an
  `sr-only` label of their own — the adjacent visible text is already the
  accessible name. They also don't need `aria-hidden`, matching current
  usage.
- Never ship an icon-only interactive element with no accessible name and
  no `sr-only` fallback — this is a hard accessibility gate, not a
  nice-to-have.
