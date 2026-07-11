# UI Playbook — Settings Page

> Framework v1.1.1 · Premium UI Engineering layer
> Scope: the admin-configurable platform/store settings surfaces under `/settings/*` (e.g. `/settings/system`, `/settings/payment`, `/settings/pos`).
> Stack: Next.js App Router + TypeScript + Tailwind CSS + Shadcn UI (style `base-nova`) + `@phosphor-icons/react` + React Hook Form + Zod.

## Relationship to `form.md`, `detail-page.md`, and `.claude/domain/platform.md`

This playbook decides only the **page-level shell** a settings section lives in — persistent navigation between sections, per-section save behavior, section-level loading/error/empty handling. Once you're inside one section's form, `.claude/ui/playbooks/form.md` is the source of truth for field composition (`FieldSet`/`FieldGroup`/`Field`/`FieldError`, RHF+Zod wiring, submit-button loading state) — do not re-derive form conventions here, follow that playbook verbatim per section.

This playbook also does **not** decide which settings exist, their scope (platform-wide vs. per-store-overridable), their validation ranges, or their business rules — that is `.claude/domain/platform.md`'s charter (see its Business Concepts → Settings, Business Rules 5–6, and Validations sections). This file is presentation-only: given that Platform has defined N settings sections with M fields each, here is how to lay them out, navigate between them, and handle their loading/save/error states. If you find yourself inventing a new settings category or deciding a field's valid range, stop — that belongs in `platform.md`, not here.

## Prerequisite: component gaps to install

`Frontend/src/components/ui/` currently has only: `button`, `card`, `collapsible`, `dropdown-menu`, `field`, `input`, `label`, `separator`, `sonner`, `tooltip`. A settings page as specified below needs three components that are **not installed yet**:

| Component | Needed for | Install |
|---|---|---|
| `tabs` | section switcher when there are roughly ≤6 settings sections | `npx shadcn@latest add tabs` |
| `switch` | every boolean toggle field (e.g. "enable COD", "maintenance mode") | `npx shadcn@latest add switch` |
| `select` | every enumerated-option field (e.g. active payment gateway, timezone, notification channel) | `npx shadcn@latest add select` |

`skeleton` is also needed for the Loading section below — if `detail-page.md`'s work already installed it, reuse it; otherwise add it here (`npx shadcn@latest add skeleton`).

**Icon library mismatch to flag before installing:** `Frontend/components.json` declares `"iconLibrary": "lucide"`, so `shadcn add tabs switch select` will scaffold primitives whose *internal* icons (if any) import from `lucide-react`, not `@phosphor-icons/react`. This is already precedent, not a new problem: the two shadcn primitives currently installed that ship their own icons — `dropdown-menu.tsx` (`ChevronRightIcon`, `CheckIcon` from `lucide-react`) and `sonner.tsx` (`CircleCheckIcon`, `InfoIcon`, `TriangleAlertIcon`, `OctagonXIcon`, `Loader2Icon` from `lucide-react`) — were never swapped to Phosphor after installation. That is standing technical debt, not a pattern to replicate deliberately going forward. Do not "fix" it as a side effect of this playbook (out of scope, untracked blast radius), but do not add to it either: when `tabs`/`switch`/`select` are installed, leave their own generated internal icons alone (consistent with existing precedent) — but every icon **you place in feature code** (tab triggers, section nav icons, save-button spinners, empty-state icons) must come from `@phosphor-icons/react`, matching the exclusive real usage in `nav.ts`, `login-form.tsx`, and `product-form.tsx`. Never import `lucide-react` in module/app code.

## Reference navigation shape

`Frontend/src/config/nav.ts`'s `system` nav group already plans the settings sub-menu, under `GearIcon`, as twelve `NavChildItem`s:

```
/settings/system            (systemSettings)
/settings/web               (webSettings)
/settings/app               (appSettings)
/settings/home-general      (homeGeneralSettings)
/settings/authentication    (authenticationSettings)
/settings/email             (emailSettings)
/settings/payment           (paymentSettings)
/settings/notification      (notificationSettings)
/settings/delivery-boy      (deliveryBoySettings)
/settings/seller            (sellerSettings)
/settings/advertisement     (advertisementSettings)
/settings/pos               (posSettings)
```

Twelve sections is exactly the "many distinct sections" case this playbook exists for. Per `.claude/domain/platform.md`, each of these is a distinct functional grouping (not by scope — Platform decides platform-wide vs. per-store-overridable *within* each page, per setting) with its own fields and its own save action; there is no shared "Settings" entity spanning all twelve. `Frontend/src/modules/settings/` does not exist yet in the codebase (Settings is listed "Planned" in the module registry) — this playbook describes the target shell to build it into, not something already shipped.

---

## Layout

A settings page is never one long scrolling form mixing all sections together. With twelve sections already named in `nav.ts`, and every real settings surface in this domain trending toward "many small independent sections" rather than "few," the default layout is a **two-pane shell**: a persistent section-navigation list on one side, the selected section's form in the main content area.

- **≤ ~6 sections**: use `Tabs` (`TabsList` + `TabsTrigger` + `TabsContent`), the same primitive `detail-page.md` uses for sectioned entities. Appropriate for a scoped settings surface (e.g. if `/settings/notification` itself grows sub-tabs for channel-specific config).
- **> ~6 sections — the actual `/settings/*` case today (twelve entries)**: use a persistent **side-navigation list**, not `Tabs`. A `TabsList` with twelve triggers is unusable (either wraps awkwardly or forces a cramped scroll strip) and the settings IA in `nav.ts` is already list-shaped, not tab-shaped. Structure:

  ```tsx
  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
    <nav aria-label={t("settingsSectionsNav")} className="w-full shrink-0 lg:w-64">
      <ul className="flex flex-col gap-1">
        {settingsSections.map((section) => (
          <li key={section.key}>
            <Link
              href={section.href}
              aria-current={section.key === activeSection ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                section.key === activeSection
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <section.icon className="size-4" />
              {t(section.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    <div className="min-w-0 flex-1">
      <Card>
        <CardHeader>
          <CardTitle>{t(activeSectionLabelKey)}</CardTitle>
        </CardHeader>
        <CardContent>{/* active section's form, per form.md */}</CardContent>
      </Card>
    </div>
  </div>
  ```

  Each list item is a real `Link` to its own route (`/settings/system`, `/settings/payment`, …) — settings sections are separately addressable pages, not client-only tab state, so a section is bookmarkable/shareable and matches `nav.ts`'s existing per-section `href`s. This also means each section is its own `app/(dashboard)/settings/{section}/page.tsx` composing a `modules/settings/pages/{Section}SettingsPage` component (per `Frontend/AGENTS.md` rule 3 — thin App Router pages), all sharing one `SettingsLayout` that renders the side-nav plus `children`.
- **Never** render all twelve sections' fields on one page/one form. Each section is independently owned business-logic-wise per `platform.md` (different validation rules, potentially different admin-role gates per setting) — mixing them defeats that separation and makes a single accidental submit touch unrelated settings.

## Spacing

- Side-nav-to-content gap: `gap-6` at the shell root (matches `detail-page.md`'s header-to-body `space-y-6` rhythm) — don't introduce a second spacing scale for this layout.
- Side-nav item padding: `px-3 py-2`, consistent internal `gap-2` between icon and label — same icon size (`size-4`) as every other nav icon in `sidebar.tsx`/`nav.ts`.
- Section `Card`: rely on `card.tsx`'s own `[--card-spacing:--spacing(4)]` token for `CardHeader`/`CardContent` padding — never hardcode `p-4`/`p-6` overrides, same rule as `detail-page.md`.
- Within one section's form: follow `form.md` exactly — `FieldGroup`'s `gap-5` between fields, `Field`'s `gap-2` label-to-control.
- Between logical field groups **inside one section** (e.g. a Payment settings section separating "Gateway selection" from "COD rules"): a `Separator` (already installed) with `my-6` above/below, plus a `FieldLegend`-style sub-heading if the sub-group needs a visible label — do not silently run two unrelated field clusters together with only a blank-line's worth of `gap-5`.

## Recommended Components

| Component | Role |
|---|---|
| `Card` / `CardHeader` / `CardTitle` / `CardContent` (already installed) | Wraps every settings section's form; `CardTitle` is the section name |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` (install) | Section switcher only when a settings surface has ≤~6 sections — not the primary `/settings/*` shell today, but reusable for a scoped sub-surface |
| Custom side-nav list (`Link` + `aria-current`, no new primitive needed) | Section switcher for the real `/settings/*` case (12 sections) |
| `Switch` (install) | Every boolean setting field (`isEnabled`-style flags — e.g. maintenance mode, COD enabled, a notification channel on/off) |
| `Select` (install) | Every enumerated setting field (active payment gateway, timezone, default language, notification template category) — wrap in `Controller`, drive `value`/`onValueChange` per `form.md`'s `Select` wiring note, never `{...field}` spread |
| `Separator` (already installed) | Between logical field groups within one section's form |
| `Field`/`FieldLabel`/`FieldError`/`FieldGroup`/`FieldSet`/`Input`/`Button` (already installed) | Everything else, wired exactly as `form.md` specifies |
| `Skeleton` (install if not already present from `detail-page.md`) | Section loading placeholder (see Loading) |

## Interaction Patterns

**Recommendation: save per-section, not one giant submit for all twelve settings pages at once.**

Each section (`/settings/payment`, `/settings/email`, etc.) is its own `<form>` with its own `Save` `Button`, its own RHF instance, its own Zod schema, and its own mutation — mirroring `form.md`'s single-form pattern applied once per section rather than once globally:

- One `Save` button per section, placed the same way `product-form.tsx` places its submit button (`Field orientation="horizontal"` if it shouldn't stretch full width). Do not add one mega "Save all settings" button spanning sections — that reintroduces the single-giant-form problem this playbook's Layout section rejects, and it silently conflates saves across settings with different scope/role rules (`platform.md` Business Rule 5).
- **Rationale**: per-section save minimizes the blast radius of an accidental change — a mistyped field in Payment settings must never risk also re-submitting (and thus re-validating/re-persisting) unrelated POS settings the admin never touched. It also matches the real business model: each section corresponds to a functionally distinct area Platform reasons about independently (different fields, potentially different admin-role gates per setting per `platform.md`'s "what admin role can change each one").
- **Unsaved-changes warning**: track each section form's dirty state (`formState.isDirty` from RHF). If the admin navigates to a different settings section (or away from `/settings/*` entirely) while a section is dirty, intercept navigation with a confirm dialog ("You have unsaved changes — leave anyway?"). Implement via a route-change guard (Next.js App Router: intercept the side-nav `Link` clicks when `isDirty` is true and show an `AlertDialog` before navigating, since there is no built-in `beforeunload`-equivalent for client-side App Router transitions) — do not skip this because there's no default browser prompt for SPA navigation; it must be built explicitly.
- **Success feedback**: `toast.success(...)` with the section name in the description (e.g. "Payment settings saved"), following `form.md`'s success-toast convention. Do not `reset()` the form back to blank defaults on success the way `product-form.tsx` does for a create form — a settings save should `reset(savedValues)` (re-baseline the form's dirty-tracking to the just-saved values) so the fields keep showing what was saved, not empty inputs.
- **Boolean toggles wired to `Switch`**: for a field with no other dependent fields, still route the change through the section's normal `Save` flow (RHF value change → dirty → explicit Save), not an instant auto-save on toggle — this keeps the per-section Save button as the single, predictable commit point and keeps the unsaved-changes warning meaningful. (This differs from `detail-page.md`'s single-field `isActive` status flip, which fires an immediate mutation — that pattern is for a status field with its own dedicated backend endimg, not a batch of settings fields sharing one section-level `PATCH`.)

## Responsive Behavior

- **Side-nav (>6 sections, the real case)**: collapses below `lg` to a `Select`-driven section switcher bound to the current route — `onValueChange` calls `router.push(section.href)`. This mirrors `detail-page.md`'s "drive the same tab state from a `Select` below a breakpoint" convention, adapted from tab-state to route-navigation since sections here are real routes, not client tab state.
- **Tabs (≤6 sections case)**: follow `detail-page.md`'s tab-collapse convention exactly — horizontally scrollable `TabsList` (`overflow-x-auto`) as the preferred default, or a `Select`-driven switcher only at 4+ tabs if scroll feels cramped on real devices.
- **Section form fields**: single-column full-width by default per `form.md`; only use `Field orientation="responsive"` for genuinely short side-by-side pairs (e.g. "open time" + "close time" for service hours). Never force a fixed multi-column grid that causes horizontal scroll on mobile.
- **Save button**: stays visible and reachable at every breakpoint — do not tuck it behind a collapsed menu; it is the primary action of the page the admin is currently on.

## Accessibility

- The section nav (side-nav list or `Select` on mobile) is fully keyboard-navigable: each entry is a real `<a>`/`Link`, reachable via `Tab`, activated via `Enter` — no `onClick`-only `<div>` items.
- The current section is indicated **both visually and programmatically**: visual (background/text color per the `bg-muted`/`text-foreground` styling in the Layout snippet) and `aria-current="page"` on the active nav `Link` — never rely on color alone (`Frontend/AGENTS.md` rule 23).
- Wrap the side-nav in a `<nav aria-label={t("settingsSectionsNav")}>` so assistive tech can distinguish it from the app's primary `Sidebar` navigation landmark.
- Each section's `CardTitle` is a real heading (`<h2>`, same convention as `detail-page.md`) so the section's name appears in the page outline, distinct from the page's own `<h1>` ("Settings").
- `Switch` and `Select` (once installed) ship full ARIA wiring from the underlying Base UI primitive (`role="switch"`/`aria-checked`, `role="combobox"`/`aria-expanded` etc.) — do not hand-roll either with a styled checkbox or native `<select>`; always the installed primitive, wired through `Controller` per `form.md`.
- Every `Switch` still gets a `FieldLabel` with `htmlFor` pointing at the switch's `id`, exactly like every other field — a bare switch with no associated label is not acceptable even if a sighted user can infer meaning from adjacent text.

## Loading

Skeleton the section's form-field layout, not a spinner — same principle as `detail-page.md`, scoped to whichever section is active:

```tsx
function SettingsSectionSkeleton({ fieldCount = 5 }: { fieldCount?: number }) {
  return (
    <Card>
      <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
      <CardContent className="flex flex-col gap-5">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-24" /> {/* Save button */}
      </CardContent>
    </Card>
  )
}
```

- The side-nav itself renders immediately (it's static config from `nav.ts`, not server data) — only the active section's `CardContent` shows the skeleton while its settings values are being fetched. Never skeleton the nav list.
- Drive this off TanStack Query's `isLoading` for that section's settings query, per `Frontend/AGENTS.md` rules 15/21 — never a hand-rolled loading flag.
- Switching sections (navigating to a different `/settings/*` route) re-triggers this same per-section skeleton for the newly active section; it is not a one-time page-load skeleton.

## Error Handling

Two distinct error channels, both scoped to the active section:

1. **Failed fetch of a section's current settings values** — same two-state split as `detail-page.md`: a genuine not-found/permission case (e.g. an admin role without access to that settings page) shows a dedicated message + action, distinct from a generic network/server error which shows a retry (`refetch()`) affordance. Render this in place of the section's `Card` content; keep the side-nav intact so the admin isn't stranded.
2. **Failed save (the common case)** — show `toast.error(t("errorTitle"), { description: error.message })` per `form.md`'s submission-error convention, **and** explicitly do not reset or clear the form. The section's dirty state and the admin's in-progress edits must remain exactly as typed so nothing is silently lost — this is stricter than the generic form guidance because a settings save failure is often the admin's only attempt before navigating away, and re-typing a dozen settings fields after a transient network blip is an unacceptable retry cost. Keep the `Save` button re-enabled (`disabled={isSubmitting || isPending}` naturally clears once the mutation settles) so the admin can immediately retry without touching the fields again.

## Empty States

Not typically applicable to settings pages — settings values always have sane platform-provided defaults per `platform.md` (a per-store setting always falls back to the platform-wide default; see its Edge Cases: "a per-store setting has no override and the store is new" → falls back to default, never left undefined). A settings section that loaded successfully always has values to show; there is no "no settings yet" blank state to design for in the general case, and a section's `Card` must never be left conspicuously empty — if a fetch succeeds, render the form with its (possibly default) values, full stop.

**The one real exception**: an eventual Integrations-style section (per `platform.md`'s Future Growth Considerations — "Integrations has no dedicated admin UI concept yet either," most plausibly surfacing as fields inside the existing Payment/Email/Notification settings pages) where the admin has **zero configured providers of a given type yet** (e.g. no payment gateway connected at all). That specific sub-case is a genuine empty state and should reuse the `ComingSoon`-style card pattern (`Frontend/src/components/feedback/coming-soon.tsx`), adapted with a concrete call-to-action rather than generic "coming soon" copy — icon + `t("noIntegrationsTitle")` + `t("noIntegrationsDescription")` + a `Button` ("Connect your first integration") — scoped to that sub-section of the page, not the whole settings section. Do not manufacture this pattern speculatively elsewhere in `/settings/*`; every other section's fields have defaults and are never empty.
