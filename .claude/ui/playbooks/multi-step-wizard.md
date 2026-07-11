# UI Playbook — Multi-Step Wizard

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Pattern:** Multi-Step Wizard
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn UI + Phosphor Icons (`@phosphor-icons/react`) + React Hook Form + Zod + Zustand (cross-step state only)

**Source of truth (read before deviating):**
- `.claude/ui/playbooks/form.md` — every wizard step's form is a Form playbook form, scoped to that step's field subset. This playbook does not repeat Form playbook content; it only adds what changes when a form is split across steps (indicator, step navigation, cross-step state, review-and-edit).
- `Frontend/src/modules/auth/components/login-form.tsx` and `Frontend/src/modules/products/components/product-form.tsx` — canonical `Controller` + `Field`/`FieldGroup`/`FieldSet` composition. Each step's form body is built exactly this way, just holding fewer fields than a full single-page form would.
- `Frontend/src/components/ui/field.tsx`, `card.tsx`, `button.tsx`, `separator.tsx` — primitives this playbook composes; no new primitive is invented where these already suffice.
- `Frontend/src/store/auth-store.ts` — the codebase's one shipped Zustand store, using `createStore` from `zustand/vanilla` plus a provider (see `Frontend/src/providers/`), not the `create` hook directly. A wizard store follows this same `createStore` + provider shape, scoped to the wizard's page, not registered as a new global store.
- `Frontend/AGENTS.md` rule 16 — Zustand is for global UI state only, never server data. Rule 13 — forms always RHF + Zod. Rule 12 — spacing must follow the spacing system, no arbitrary values.

A wizard is a form (or bulk-import flow) split into sequential steps, each independently valid before the user can advance, ending in a review/submit step. Examples in this codebase's domain: onboarding a new dark store (address → serviceable area → operating hours → staff → review), a multi-step coupon builder, bulk product import (upload → column mapping → validation preview → confirm).

---

## Layout

Three fixed regions, top to bottom, inside the wizard's page/section container:

```tsx
<div className="flex flex-col gap-6">
  {/* 1. Step indicator */}
  <WizardStepIndicator steps={steps} currentStep={currentStep} />

  {/* 2. Current step content */}
  <Card>
    <CardHeader>
      <CardTitle>{steps[currentStep].title}</CardTitle>
      <CardDescription>{steps[currentStep].description}</CardDescription>
    </CardHeader>
    <CardContent>
      {/* this step's <form> — see Form playbook for internal composition */}
    </CardContent>
  </Card>

  {/* 3. Navigation footer */}
  <div className="flex items-center justify-between">
    <Button type="button" variant="outline" onClick={onBack} disabled={isFirstStep}>
      <ArrowLeftIcon className="size-4" />
      {t("back")}
    </Button>
    <Button type="button" onClick={isFinalStep ? onSubmit : onNext} disabled={isSubmitting || isPending}>
      {isPending && <CircleNotchIcon className="size-4 animate-spin" />}
      {isFinalStep ? (isPending ? t("submitting") : t("submit")) : t("next")}
    </Button>
  </div>
</div>
```

- **Step indicator** is a standalone row above the `Card`, never inside `CardHeader` — it represents progress through the whole wizard, not this step's content, so it must not scroll away with step content in a scrollable card body.
- **Step content** always lives inside one `Card` (`CardHeader` for the step's title/description, `CardContent` for the step's `FieldSet`/`FieldGroup` form body per the Form playbook). Do not render step content directly in the page body without a `Card` — every other content surface in this codebase (`detail-page.md`, `crud-module.md`) uses `Card` as the content boundary, and the wizard must not be the exception.
- **Navigation footer** is outside the `Card`, not a `CardFooter`, because it navigates the wizard, not the individual step's card. Back is always `variant="outline"` (secondary action); Next/Submit is always `variant="default"` (primary action) — this mirrors every other primary/secondary button pairing in the codebase (e.g. `LoginForm`'s demo-credentials button is `outline`, submit is `default`).
- On the first step, Back is `disabled`, not hidden — hiding it shifts the Next/Submit button's horizontal position between steps, which reads as layout jitter. Keep both buttons mounted for the whole wizard lifetime.
- The wizard owns exactly one `<form>` per step (the step's own `handleSubmit`-wrapped form), not one `<form>` spanning all steps — see Interaction Patterns for why (per-step validation on Next).

## Spacing

- `gap-6` between the step indicator, the step `Card`, and the navigation footer (the three regions above) — matches the vertical rhythm already used between major page sections in `dashboard.md`/`detail-page.md`. Do not tighten this to `gap-4`; a wizard's regions are structurally distinct (progress vs. content vs. navigation) and need the larger gap to read as separate.
- Inside the step `Card`, `CardContent`'s form uses the Form playbook's own spacing untouched (`FieldGroup`'s `gap-5`, `Field`'s `gap-2`) — a wizard step is not a special form, so it must not override the Form playbook's spacing tokens.
- The navigation footer's two buttons use `justify-between` (Back pinned left, Next/Submit pinned right) — do not center them or stack them horizontally with a manual gap; `justify-between` is the one layout that keeps Back's position stable regardless of Next/Submit's label length changing ("Next" → "Submit").
- The review step's per-section summary blocks (see Interaction Patterns) are separated with `FieldSeparator` or `Separator`, consistent with how `field.tsx` already separates logical field groups — do not introduce ad hoc `<hr>` or manual `border-t` divs.

## Recommended Components

| Component | Import | Use for |
|---|---|---|
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | `@/components/ui/card` | The current step's content boundary (see Layout). |
| `Field`, `FieldLabel`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldSeparator` | `@/components/ui/field` | Each step's own form body — identical composition to the Form playbook, scoped to that step's field subset. |
| `Button` | `@/components/ui/button` | Back (`variant="outline"`), Next/Submit (`variant="default"`), and per-section "Edit" links on the review step (`variant="ghost"` + `size="sm"`, icon-leading). |
| `Separator` | `@/components/ui/separator` | Dividers between review-step summary sections. |
| **Custom `WizardStepIndicator`** | new, `components/common/wizard-step-indicator.tsx` (shared — any module can build a wizard) | The numbered-circle step row (desktop) and compact "Step X of N" fallback (mobile). See below for why this is custom, not `Progress`. |

**On `Progress` (not yet installed):** `Frontend/src/components/ui/` has no `progress.tsx` today. Do not `npx shadcn@latest add progress` and reach for it as the step indicator's primary implementation — Shadcn's `Progress` renders one continuous bar with a fill percentage; it cannot natively represent discrete numbered steps, a completed-step checkmark, or per-step labels, all of which this wizard's desktop layout requires. **Recommendation:** build a small custom `WizardStepIndicator` component from existing tokens (`bg-primary`/`text-primary-foreground` for current, `bg-primary` + `CheckIcon` for completed, `bg-muted text-muted-foreground` for upcoming, `bg-border` connector lines) — a handful of `div`s and one Phosphor icon, not a new dependency. The one place `Progress` (or an equivalent 2px filled bar) is legitimate is the **mobile collapsed variant**'s thin line under the "Step X of N" text (see Responsive Behavior) — if it is installed for that, install it deliberately for that purpose only, do not let it silently become the desktop indicator too.

**On `iconLibrary: "lucide"` in `components.json`:** the config's `"iconLibrary": "lucide"` (line 13) does not match reality — every shipped component (`login-form.tsx`, `product-form.tsx`) imports real icons exclusively from `@phosphor-icons/react` (`CircleNotchIcon`, `EnvelopeSimpleIcon`, `LockKeyIcon`, `PackageIcon`, etc.), never `lucide-react`. This is a stale/incorrect config value, not a signal to use Lucide. When `npx shadcn@latest add <component>` scaffolds a new primitive (e.g. if `progress` is added per above) and it emits Lucide icon imports, manually swap them to the Phosphor equivalent before committing — never leave a Lucide import in a merged component. For this wizard specifically: `CheckIcon` (completed step), `PencilSimpleIcon` (review step "edit" affordance), `ArrowLeftIcon`/`ArrowRightIcon` (Back/Next, optional), `CircleNotchIcon` (submit loading, per Form playbook) — all from `@phosphor-icons/react`.

## Interaction Patterns

- **Next validates only the current step's fields.** Each step is its own `useForm` instance (or one shared `useForm` for the whole wizard with `trigger(currentStepFieldNames)` called on Next — either is acceptable, but never validate fields the user hasn't reached yet). Concretely, with one form-per-step:
  ```tsx
  const onNext = handleSubmit((values) => {
    updateWizardData(values) // merge this step's values into cross-step state
    goToStep(currentStep + 1)
  })
  ```
  This reuses the exact `handleSubmit((values) => ...)` idiom from `login-form.tsx`/`product-form.tsx` — Next *is* that step's form submit, it just advances the step instead of firing a mutation. Do not let Next call `goToStep` directly without going through `handleSubmit`; that is how an invalid step gets skipped.
- **Back preserves entered values, always.** Back never calls `reset()` and never remounts the step's form with fresh `defaultValues` — it only moves `currentStep` backward while the wizard's cross-step state (see below) keeps every step's already-entered values. Re-entering a previous step must show what the user typed, not blank fields.
- **Cross-step state — Zustand decision rule:** which step the user is on, and the accumulated field values from completed steps, are UI/session state that exists only in the browser for the wizard's lifetime — there is no server record until the final submit succeeds. Per `AGENTS.md` rule 16 ("Zustand only for global UI state... never server data") and rule 15 ("React Query for all server state"), this means:
  - **Use** a page-scoped Zustand store (same `createStore` + provider shape as `Frontend/src/store/auth-store.ts`, but instantiated and provided only within the wizard's page/layout — not added to the global `store/` folder or `providers/app-providers.tsx`) **or** plain `useState`/`useReducer` lifted to the wizard's page component, if the wizard has no descendants deep enough to need context. Either is correct; pick Zustand only when steps are nested deeply enough that prop-drilling the update functions becomes awkward.
  - **Never** model wizard-in-progress data as a TanStack Query cache entry, and never invent a fake query key for it — there is nothing to fetch, no server is the source of truth yet, and `invalidateQueries` has no meaning for data that hasn't been persisted. TanStack Query only enters the picture for the **final submit mutation** (`useMutation`, exactly as `product-form.tsx` does) and, for an edit-existing-entity wizard, for the initial `useQuery` that seeds the wizard's starting values.
  - This is the same distinction the Form playbook already draws in its Error Handling section (client validation vs. server errors) applied one level up: everything before the final submit is client/session state (Zustand or lifted `useState`); the final submit and any pre-fetch are the only server-state touchpoints (TanStack Query).
- **Final review step.** The step before submission renders a read-only summary of every prior step's values, grouped by step, each group with a `PencilSimpleIcon` "Edit" button (`variant="ghost" size="sm"`) that calls `goToStep(thatStep)` — jumping directly there without losing any other step's data (state is preserved per the Back rule above). Do not require the user to click Back repeatedly to reach an earlier step from review.
- **Final submission** uses the identical loading/disable pattern as any Form playbook submit: `disabled={isSubmitting || isPending}` on the Submit button, `CircleNotchIcon` + `t("submitting")` label swap, `onSuccess`/`onError` via `useMutation` exactly as in `product-form.tsx`. The only wizard-specific addition is disabling the Back button and all "Edit" affordances on the review step for the duration of `isPending` too (see Loading) — a mid-flight edit-jump during submission is not a state this flow needs to support.

## Responsive Behavior

- **Desktop/tablet (`@md` and up):** full step-indicator row — numbered circles connected by horizontal connector lines (`Separator`-style `bg-border` segments), each circle showing its number, a `CheckIcon` if completed, and a label underneath (e.g. "Details", "Address", "Review"). Current step's circle uses `bg-primary text-primary-foreground`; upcoming steps use `bg-muted text-muted-foreground`; the connector segment between two completed steps is `bg-primary`, otherwise `bg-border`.
- **Mobile (below `@md`):** collapse the numbered-circle row to a compact `t("stepProgress", { current: currentStep + 1, total: steps.length })` text (e.g. "Step 2 of 5") plus a single thin 2px progress line beneath it (width = `(currentStep + 1) / steps.length * 100%`, `bg-primary` fill on `bg-muted` track). Do not render five numbered circles in a narrow viewport — at typical wizard step counts (3–6) each circle plus label plus connector does not fit without wrapping or truncating labels illegibly, so the collapse is a hard requirement, not a nice-to-have.
- Implement the breakpoint switch with Tailwind responsive classes on the two variants inside the same `WizardStepIndicator` component (`hidden @md:flex` for the circle row, `flex @md:hidden` for the compact text+line), matching how this codebase already handles responsive component swaps rather than JS-based `useMediaQuery` for a purely presentational change.
- The step `Card`'s internal form layout follows the Form playbook's responsive rules unchanged (`Field orientation="responsive"` for any side-by-side fields within a step) — a wizard step is not exempt from those rules just because it's one of several steps.
- Navigation footer buttons remain a `flex justify-between` row at every breakpoint — do not stack Back/Next vertically on mobile; both must stay reachable with a thumb without scrolling past the step content.

## Accessibility

- **Current-step announcement:** the step indicator's current-step circle (or, on mobile, the compact text) carries `aria-current="step"` — not `aria-current="true"` or `aria-selected` — this is the semantically correct value for a step in a sequential process per WAI-ARIA, and screen readers announce it distinctly from a generic selected state.
- **Focus management on advance:** when Next/Back changes `currentStep`, move focus to the new step's first focusable field (e.g. `formRef.current?.querySelector('input, [role="group"] input')?.focus()`, or simpler, give the new step's first `Controller`-wrapped field a `ref` and call `.focus()` in a `useEffect` keyed on `currentStep`). Without this, a screen-reader or keyboard user's focus stays on the now-stale Next button while the entire visible content has changed underneath them — this is the single most important accessibility requirement in this playbook, not an optional nicety.
- **Keyboard reachability:** Back and Next/Submit are native `Button`s (already keyboard-focusable with the shared `focus-visible:ring-3 focus-visible:ring-ring/50` styling baked into `buttonVariants` — see `button.tsx`), so no custom `tabIndex` or key handler is needed for them. Do not intercept `Enter`/`Space` manually on these buttons.
- **Step indicator circles are not interactive on desktop** unless the wizard explicitly supports jumping to any visited (non-upcoming) step by clicking its circle — if that affordance is added, each clickable circle must be a real `<button>` (not a `div` with an `onClick`), disabled/non-interactive for upcoming steps not yet reached, with an accessible name like `t("goToStep", { step: index + 1, title: steps[index].title })`.
- **Review step "Edit" buttons:** each `PencilSimpleIcon` button needs a real accessible name beyond the icon — `t("editSection", { section: step.title })` as `aria-label` or visible text next to the icon, never an icon-only button with no label (an icon alone is not accessible per `AGENTS.md` rule 23).
- **Fieldset/legend semantics inside each step:** unchanged from the Form playbook — each step's `FieldSet` groups that step's fields; use `FieldLegend` if the step's `Card` visually needs a sub-heading beyond `CardTitle` (usually it doesn't, since `CardTitle` already names the step).

## Loading

- **Per-step Next** has no loading state of its own when it's purely local validation + state update (synchronous `trigger`/`handleSubmit` + `goToStep`) — no spinner needed for an instant, client-only transition. If a step's Next also triggers an async check (e.g. verifying a store's serviceable pincode against the backend before allowing advance), that Next button follows the Form playbook's submit loading pattern exactly (`disabled` + `CircleNotchIcon` + label swap) scoped to that one button.
- **Final submission** is the one point where the whole wizard, not just one button, must be locked: disable Back, disable every review-step "Edit" button, and disable/spin the Submit button, all driven off the same `isPending`/`isSubmitting` flags. A user must not be able to jump to step 2 and start editing while step 5's submit request is in flight — that produces a race between the in-flight payload and newly-edited local state. Prefer disabling the interactive elements over a full opaque overlay (consistent with the Form playbook's "loading affordance is scoped, not a full-form overlay" stance) unless the submission is expected to take long enough (bulk import processing, multi-second backend validation) that users need explicit reassurance — in that case, an overlay on the `Card` (`absolute inset-0 bg-background/80` with a centered spinner) inside the step `Card` is acceptable, matching how `crud-module.md`/`data-table.md` already use overlay-in-place patterns for longer operations rather than navigating away.
- **Initial data load (edit-existing-entity wizard):** if the wizard seeds its steps from an existing record (e.g. editing a draft store onboarding), show a skeleton across the step indicator + first step's `Card` while the seeding `useQuery` is pending, per the Form playbook's edit-form skeleton rule — never mount the wizard with empty steps and snap in values after the fact.

## Error Handling

- **Current-step validation errors** are exactly the Form playbook's inline `FieldError` per invalid field, and they **block Next**: `handleSubmit` simply does not call its success callback (and therefore does not call `goToStep`) when validation fails — no separate "cannot advance" message is needed beyond the field-level errors already surfacing, since that is precisely why Next didn't move.
- **Submission errors on the final step** must never lose entered data. `onError` in the submit `useMutation` (mirroring `toast.error(t("errorTitle"), { description: error.message })` from the Form playbook) fires while the user remains on the review step — do not navigate away, reset the wizard, or clear the accumulated cross-step state on failure. The user must be able to retry Submit immediately, or jump back via an Edit affordance to fix whatever the backend rejected, without re-entering anything.
- **Field-specific submission errors** (e.g. backend rejects one field from an earlier step — "pincode not serviceable") should, if the backend attributes the error to a field, surface both as the toast (so it's not silently missed on the review step) and, ideally, route the user back to the owning step with that field's error set via `setError` — this is the same extension point the Form playbook calls out ("not something either shipped form currently does; add explicitly"), applied across steps rather than within one.
- **Async per-step validation failures** (e.g. the pincode-serviceability check mentioned in Loading) use the same two-channel split as the Form playbook: a failed check is either a field-level error (`setError` on that step's field, blocking Next) or, if not attributable to one field, a toast — never both silently merged into one undifferentiated "something went wrong."

## Empty States

A wizard has no list/table-style "empty state" (no "no results" placeholder) — the closest analogues are:

1. **A step whose valid options depend on a prior step's selection, and none exist.** E.g. an "Assign staff" step where the prior step picked a dark store and that store has zero eligible staff to assign, or a "Select delivery zones" step where the prior step's city has no zones configured yet. Do not render that step with a broken/empty `Select` and let the user hit a wall at submission. Instead, render an inline message in the step's `CardContent` (reuse the codebase's empty-state visual language from list views — icon + short message + a clear next action) explaining *why* — "No staff available for {storeName} yet" — with an action that is actually useful: a link/button to the relevant management screen to fix the upstream data, or, if the field is optional, a clear "Skip this step" affordance so the wizard isn't a dead end. Never silently allow Next to proceed with a step that has nothing meaningful for the user to fill in without explaining that.
2. **A step that is conditionally skippable.** If a step becomes irrelevant based on an earlier answer (e.g. a "Configure delivery partner" step only matters if the store type selected earlier was "hybrid," not "dark-store-only"), skip it programmatically in `goToStep`'s next/previous calculation rather than rendering it empty and asking the user to click through nothing. The step indicator must reflect the skip (numbering/labels only include steps actually in the active path for this wizard run), not show a step the user will never see.
- In both cases, this is a **content/data gap**, not a loading or error state — treat it as its own explicit UI (message + action), never a blank `CardContent` with just the step's unusable form controls.
