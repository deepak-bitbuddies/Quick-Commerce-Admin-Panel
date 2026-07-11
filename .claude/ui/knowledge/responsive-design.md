# UI Knowledge Pack — Responsive Design

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Stack:** Next.js App Router + TypeScript + Tailwind CSS + Shadcn UI (`base-nova` style) + Phosphor Icons + TanStack Query
**Read by:** `premium-ui-engineer` and Frontend Engineer, before specifying responsive behavior for any screen.

This pack documents how responsive behavior is **actually implemented** in this codebase today — not generic Tailwind advice. Every claim below is sourced from a real, shipped file. Quote the class names and constants below verbatim; do not approximate them.

---

## 1. Breakpoint scale

Tailwind's **default** breakpoint scale is used **as-is** — confirmed by reading `Frontend/src/app/globals.css`: its `@theme inline { ... }` block only defines color, radius, and font tokens (`--color-*`, `--radius-*`, `--font-*`). There is no `--breakpoint-*` override anywhere in it, and there is no `tailwind.config.*` file in `Frontend/` at all (a repo-wide glob for `tailwind.config.*` returns nothing). So:

| Breakpoint | Min-width | Status in this codebase |
|---|---|---|
| `sm` | 640px | Not used anywhere in `components/layout/`. Available, not yet adopted. |
| `md` | 768px | **Used.** `header.tsx`'s `md:px-6`; `dashboard-shell.tsx`'s `md:p-6`. This is the project's de facto "tablet" threshold. |
| `lg` | 1024px | Not used anywhere in `components/layout/`. Available, not yet adopted. |
| `xl` | 1280px | **The most important breakpoint in the app.** This is the desktop threshold, and it is not a bare Tailwind convention here — it is backed by a named constant, `SIDEBAR_DESKTOP_BREAKPOINT = "(min-width: 1280px)"` in `Frontend/src/components/layout/sidebar-constants.ts`. Every `xl:` class in the sidebar/header/shell exists *because* it mirrors this constant. Treat `xl:` as "desktop sidebar is docked" in this codebase, not just "a wide screen." |
| `2xl` | 1536px | **Used**, but only for the outer content container: `dashboard-shell.tsx`'s `max-w-screen-2xl` and `2xl:p-10`. |

**Rule:** when specifying a new screen, default to the two breakpoints this project actually exercises — `md` (tablet-and-up density/padding changes) and `xl` (desktop sidebar/layout changes) — plus `2xl` only for outer-container padding on very large monitors. Do not introduce `sm` or `lg` unless a screen has a genuine third visual state between phone and tablet, or between tablet and the `xl` sidebar threshold — reaching for them without a real distinct layout need duplicates what `md`/`xl` already cover (AGENTS.md rule 38: never introduce a second way to solve the same problem).

---

## 2. CSS-only vs. JS-aware responsive logic

Two mechanisms coexist in this codebase, and the decision between them is not stylistic — it is dictated by whether the branch is **purely presentational** or **feeds into component logic/markup structure**.

### Rule
- **Pure Tailwind responsive classes** (`xl:hidden`, `md:px-6`, `xl:w-64`, etc.) — use these whenever the responsive change is *only* CSS: show/hide, resize, reposition, retranslate. The DOM node still exists on both sides of the breakpoint; only its computed style changes. This is the default, and it costs nothing at runtime (no re-render, no JS).
- **`useMediaQuery` (`Frontend/src/hooks/use-media-query.ts`)** — reach for this only when a component's **render logic or behavior itself** must branch on viewport width, not just its styling. Signature:

  ```ts
  export function useMediaQuery(query: string): boolean
  ```

  It is a `useSyncExternalStore` wrapper around `window.matchMedia(query)`: subscribes to the media query's `change` event, returns `mediaQueryList.matches`, and — critically — its **server snapshot always returns `false`** (third argument to `useSyncExternalStore`). This means on first server-rendered paint every consumer sees `false` regardless of the real viewport, then reconciles to the true value after hydration. Any component using it must tolerate a one-frame "mobile-assumed" state; don't rely on it for anything that must be correct pre-hydration (that's what SSR-safe cookie-read defaults are for — see §3's `defaultCollapsed`/`SIDEBAR_COLLAPSED_COOKIE` pattern).

### The real example of each, in `sidebar.tsx`

- **CSS-only:** the mobile drawer open/close and the desktop translate reset are pure classes — `xl:hidden` on the backdrop `div` (line ~296), `xl:translate-x-0` combined with `sidebarOpen ? "translate-x-0" : "-translate-x-full"` on the `<aside>` (line ~305). No JS branch needed; the browser's own media-query evaluation of the `xl:` classes handles it.
- **JS-aware:** `const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_BREAKPOINT)` (line 259), then `const iconRail = collapsed && isDesktop` (line 260). This is not a styling decision — `iconRail` changes *which component renders at all* inside `NavGroupItem`: when `iconRail` is true, a nav item with children renders as a `DropdownMenu` (flyout on hover/click, for the collapsed desktop rail); when false, the identical item renders as a `Collapsible` (inline expand/collapse, for mobile or the expanded desktop panel). That is a structural/behavioral fork that pure CSS cannot express — you cannot conditionally mount a different interaction pattern with a `xl:` class — hence the JS check.

**Decision rule to apply on new screens:** ask "does the breakpoint change what is rendered/how it behaves, or only how it looks?" If only how it looks → Tailwind responsive classes. If a different component, a different data-fetch, a different event-handling model, or a different DOM structure is needed on one side of the breakpoint → `useMediaQuery` with the relevant breakpoint constant (reuse `SIDEBAR_DESKTOP_BREAKPOINT` if the fork is the same desktop/mobile line; define a new named constant in the feature's own `constants/` per AGENTS.md rule 9 if it's a genuinely different threshold — never inline a raw `"(min-width: ...)"` string in a component).

---

## 3. The sidebar/shell pattern

This is the most complex real responsive pattern in the codebase, and every future layout nests inside `dashboard-shell.tsx` — so any new screen inherits this behavior automatically and must not fight it.

### Desktop (`xl` and up, ≥1280px): collapsible icon rail
- The `<aside>` in `sidebar.tsx` is always translated on-screen (`xl:translate-x-0`), and its width toggles between two fixed states driven by the `collapsed` boolean (owned by `dashboard-shell.tsx`, persisted via `SIDEBAR_COLLAPSED_COOKIE` cookie, `SIDEBAR_COLLAPSED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365`):
  - Expanded: `xl:w-64`
  - Collapsed: `xl:w-17`
- `dashboard-shell.tsx` reserves the matching space in normal flow with an invisible spacer `div` (mobile-hidden, `hidden ... xl:block`) so the content column gets the correct remaining width without the `<aside>` (which is `fixed`) overlapping it: `xl:w-16` when collapsed, `xl:w-64` when expanded. Note the **1px mismatch** between the sidebar's own `xl:w-17` and the shell spacer's `xl:w-64`/`xl:w-16` — this is the current shipped state; a new screen should not "fix" this drift on its own, just be aware the spacer and the aside width are two separate literals kept in sync by hand, not derived from one token.
  - The collapsed state doesn't just narrow the rail; it removes text everywhere via `collapsibleLabelClassName(collapsed)`: `"overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-in-out"` plus, when collapsed, `xl:w-0 xl:opacity-0` (and `xl:opacity-100` when not collapsed). Labels animate out by width+opacity, not by `display:none`, so the collapse/expand reads as a slide, not a jump cut — `duration-200 ease-in-out` is the standard transition timing used across the whole layout (`sidebar.tsx`, `header.tsx`), reuse it for any new collapsing UI rather than inventing a different duration.
  - When collapsed on desktop (`iconRail = collapsed && isDesktop`), items with children stop being inline `Collapsible` sections and become `DropdownMenu` flyouts anchored `side="right"`; single-link items get a `Tooltip` (`side="right"`) showing the label since the text is visually hidden.
  - A toggle button (`onToggleCollapsed`) floats at `absolute top-7 right-0 ... xl:flex` (hidden below `xl` — `hidden ... xl:flex`), writing the new state to the cookie on click so it survives reload/navigation.

### Mobile/tablet (below `xl`, <1280px): drawer overlay
- The same `<aside>` becomes a fixed, full-height overlay drawer: `-translate-x-full` when closed, `translate-x-0` when `sidebarOpen` is true, always `w-64` (the collapsed icon-rail width simply doesn't apply below `xl` — there is no icon-rail mode on mobile, only open/closed).
- A backdrop `div` (`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm ... xl:hidden`) fades in/out with `opacity-100`/`opacity-0` + `pointer-events-none` when closed, and clicking it calls the same `close()` that the drawer's own `X` button uses.
- The drawer's `X` close button in the sidebar header is itself `xl:hidden` — it only exists in the mobile/drawer mode; desktop never shows it because desktop never has an "open/closed" concept, only "expanded/collapsed."
- `header.tsx` supplies the **only** trigger that opens this drawer: the hamburger `Button` is `className="relative xl:hidden"` — it exists exclusively below `xl` and is entirely absent (not just hidden — irrelevant) once the sidebar is permanently docked at `xl`. It animates between `ListIcon` and `XIcon` via opacity/rotate/scale transitions keyed off the same `sidebarOpen` boolean, `duration-200 ease-in-out` again.

### The rule for any new layout-level component
Never reimplement open/closed or expanded/collapsed state locally in a new component — `sidebarOpen` and `collapsed` are owned once, in `dashboard-shell.tsx`, and passed down. A new top-level layout wrapping different content still composes `<DashboardShell>`; it does not fork this state machine. If a new surface needs its own drawer/rail behavior (e.g. a filters panel), mirror this exact structure (fixed overlay + backdrop + `translate-x-full`/`translate-x-0` + `xl:` — or a more appropriate breakpoint if justified — variant to dock it permanently) rather than inventing a different mobile-panel mechanism (AGENTS.md rule 38).

---

## 4. Table/list responsive fallback

Cross-reference: `.claude/ui/playbooks/data-table.md` §5 ("Responsive behavior") and `Frontend/AGENTS.md` rule 22 ("Responsive design across desktop, laptop, tablet, mobile — no exceptions").

The binding rule, stated in both places and non-negotiable: **the page itself must never scroll horizontally.** Only a table's own container may. Concretely, per the data-table playbook:

- The `Table` primitive is wrapped in its own `div` with `overflow-x-auto` (shipped by shadcn's generated `table.tsx` wrapper — verify it's present after `npx shadcn add table`, don't strip it). Below `md` (the same tablet threshold already established by `header.tsx`'s `md:px-6` and `dashboard-shell.tsx`'s `md:p-6`), the table scrolls **within its own bounded region**, never the page.
- For tables with more than ~4-5 meaningful columns, don't rely on horizontal scroll alone on a phone: collapse to a **card-per-row layout** below `md` (`hidden md:block` on the `Table` wrapper, `block md:hidden` on the card-list wrapper), same data/selection/sort state, different presentation markup only.
- Toolbar controls wrap (`flex-wrap`) rather than overflow on narrow viewports.

Any new list/table screen inherits this rule from the data-table playbook directly — this pack only restates the cross-cutting constraint (page never scrolls sideways) so it's visible from the responsive-design angle, not just the table angle. If a new non-table wide surface (e.g. a Kanban board, a Gantt-style schedule) needs horizontal scroll, apply the same principle: scope `overflow-x-auto` to that surface's own container, never to `<body>`/the page shell.

---

## 5. Container padding rhythm

Sourced verbatim from `Frontend/src/components/layout/dashboard-shell.tsx`:

```tsx
<main>
  <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    {children}
  </div>
</main>
```

- `p-4` (1rem) — base padding, phone and up.
- `md:p-6` (1.5rem) — tablet and up (≥768px).
- `2xl:p-10` (2.5rem) — very large monitors (≥1536px).
- The content column itself is capped at `max-w-screen-2xl` and centered (`mx-auto`), so on ultra-wide monitors the page doesn't stretch full-bleed — padding growth at `2xl` is partly redundant with the max-width cap but still shipped as-is; keep both when replicating this container elsewhere rather than dropping one.

`header.tsx` uses the same rhythm's first step for its own horizontal padding: `px-4 md:px-6` (no `2xl` step on the header, since it's a fixed-height bar, not a content column).

**Rule for new pages:** any page-level content wrapper reuses this exact scale — `p-4 md:p-6 2xl:p-10` — rather than inventing a new padding progression. If a page needs a different rhythm (e.g. a dense operational dashboard that wants tighter padding), that's a deviation to flag explicitly, not to default to.

---

## 6. General rule

Every interface in this project is responsive **by default** across desktop, laptop, tablet, and mobile — this is `Frontend/AGENTS.md` rule 22, "no exceptions." Concretely, for the Premium UI Engineer and Frontend Engineer:

- **"It will just reflow" is never an acceptable responsive spec.** Every screen/component spec must state explicit per-breakpoint behavior: what changes at `md` (768px, tablet), what changes at `xl` (1280px, desktop sidebar threshold — reuse `SIDEBAR_DESKTOP_BREAKPOINT` semantics, don't reinvent), and whether `2xl` (1536px) matters for outer padding/max-width. If a breakpoint has no behavior change, say so explicitly ("no change below `md`; layout is single-column phone through tablet") rather than leaving it unstated.
- Default to `md` and `xl` as the two load-bearing breakpoints (per §1) — only add `sm`/`lg` when a screen has a genuine third distinct layout state, and name that reason in the spec.
- Decide CSS-only vs. `useMediaQuery` per §2's rule before writing any responsive branch — most responsive behavior in this codebase (and most new responsive behavior) should be CSS-only; `useMediaQuery` is the exception for when JS logic/structure itself must fork.
- Any new layout composes `dashboard-shell.tsx` and inherits its sidebar/drawer and padding behavior (§3, §5) rather than reimplementing it.
- Any list/table surface follows the data-table playbook's responsive section (§4) and the page-never-scrolls-horizontally constraint, full stop.
