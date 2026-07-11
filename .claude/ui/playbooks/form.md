# UI Playbook — Form

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Pattern:** Form
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn UI + Phosphor Icons (`@phosphor-icons/react`) + React Hook Form + Zod + `sonner`

**Source of truth (read before deviating):**
- `Frontend/src/modules/auth/components/login-form.tsx` — canonical two-field form (email/password), demo-credentials autofill, `useMutation` submit.
- `Frontend/src/modules/products/components/product-form.tsx` — canonical multi-field form (name/price/category), success toast + `reset()` + query invalidation.
- `Frontend/src/components/ui/field.tsx` — `Field` / `FieldLabel` / `FieldError` / `FieldGroup` / `FieldSet` / `FieldContent` / `FieldDescription` / `FieldLegend` / `FieldSeparator` / `FieldTitle`.
- `Frontend/AGENTS.md` rule 13 — forms always use React Hook Form + Zod, never hand-rolled validation.

This playbook documents the pattern as it is actually implemented in those two files. Do not invent alternate compositions (no ad hoc `<label>`/`<input>` pairs, no manual error `<span>`s, no uncontrolled forms).

---

## Layout

Every form follows the same three-level composition, exactly as in both source files:

```tsx
<form onSubmit={onSubmit} noValidate>
  <FieldSet>
    <FieldGroup>
      <Controller
        name="fieldName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              <SomeIcon className="size-4" />
              {t("fieldLabel")}
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && (
              <FieldError
                errors={[{ message: fieldState.error?.message ? t(`validation.${fieldState.error.message}`) : undefined }]}
              />
            )}
          </Field>
        )}
      />
      {/* more Controller-wrapped fields */}

      <Button type="submit" disabled={isSubmitting || isPending}>
        {isPending && <CircleNotchIcon className="size-4 animate-spin" />}
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </FieldGroup>
  </FieldSet>
</form>
```

- **`<form>`** always carries `noValidate` — native browser validation is disabled because Zod owns validation. `onSubmit` is always `handleSubmit((values) => mutate(values))` from RHF, never a raw async handler.
- **`FieldSet`** is the outermost wrapper for the whole field collection (renders a semantic `<fieldset>`). One `FieldSet` per form, unless the form is split into visually distinct sections (see below).
- **`FieldGroup`** wraps the sequence of `Field`s inside a `FieldSet` and owns the vertical rhythm between them (`gap-5` by default, per `field.tsx`). One `FieldGroup` per section; a form with two logically distinct sections (e.g. "Basic details" vs. "Pricing") uses two `FieldGroup`s inside one `FieldSet`, optionally separated with `FieldSeparator`.
- **`Field`** is one input's row: label + control + error, always as `<Field data-invalid={fieldState.invalid}>`. Never omit `data-invalid` — it drives the destructive-text styling baked into `fieldVariants` (`data-[invalid=true]:text-destructive`).
- **Field ordering**: label (with leading icon) → control → `FieldError` (conditionally rendered only `{fieldState.invalid && <FieldError .../>}`, never unconditionally with empty content).
- **Submit button placement**: last child inside the same `FieldGroup` as the fields (see `login-form.tsx`), or wrapped in its own `<Field orientation="horizontal">` when it needs to sit apart from the vertical field stack without starting a new `FieldGroup` (see `product-form.tsx`'s submit row). Use the `orientation="horizontal"` wrapper when the button should not stretch full-width; omit it when the button should be `w-full` (as in `LoginForm`).
- **Multi-column layout**: none of the two shipped forms uses a grid — every field is a full-width vertical row inside `FieldGroup`. If a form module genuinely needs two fields side by side (e.g. a short "city" + "pincode" pair), use `Field orientation="responsive"` (defined in `field.tsx`, collapses to vertical below the `@md` container breakpoint) rather than introducing a raw `grid` — do not invent a new layout primitive before checking whether `orientation="responsive"` already solves it.

## Spacing

- Do not add manual margin/padding between fields — `FieldGroup`'s `gap-5` and `Field`'s `gap-2` (label-to-control) already encode the spacing system (AGENTS.md rule 12: no arbitrary spacing values). Wrapping a field in extra `<div className="mb-4">` duplicates what `FieldGroup` already owns and must not be added.
- The icon-plus-label pairing inside `FieldLabel` uses the label's own `flex gap-2` (from `field.tsx`) — icons are always `size-4`, matching `CircleNotchIcon`, `EnvelopeSimpleIcon`, `LockKeyIcon`, `PackageIcon`, `CurrencyInrIcon`, `TagIcon` in the source files. Do not use a different icon size inside a `FieldLabel`.
- Supplementary non-field content (e.g. `LoginForm`'s demo-credentials callout) sits outside `FieldSet`, spaced with `mt-4` from the form — treat this as the boundary: everything that is a form field lives inside `FieldSet`/`FieldGroup`; anything else (hints, dividers, links) lives outside it in the `<form>` body.

## Recommended Components

Already available in `Frontend/src/components/ui/`:

| Component | Import | Use for |
|---|---|---|
| `Field`, `FieldLabel`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldContent`, `FieldDescription`, `FieldSeparator` | `@/components/ui/field` | Every field row and its grouping/section structure. |
| `Input` | `@/components/ui/input` | Text, email, password, number fields (`type="email"`, `type="password"`, `type="number" step="0.01"` as in `product-form.tsx`'s price field). |
| `Button` | `@/components/ui/button` | Submit action, with `type="submit"` and the `CircleNotchIcon` loading state. |
| `Label` | `@/components/ui/label` | Underlying primitive for `FieldLabel` — do not use directly in feature forms, use `FieldLabel`. |

**Not yet installed — install via shadcn CLI before using in any form:**

`Frontend/src/components/ui/` currently has no `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, or `switch.tsx`. Before building a form that needs a long-text field, a dropdown, a boolean toggle, or a mutually-exclusive option set, install the missing primitive first:

```bash
npx shadcn@latest add textarea select checkbox radio-group switch
```

Do not hand-roll any of these with raw `<textarea>`/`<select>`/checkbox `<input type="checkbox">` markup — that violates AGENTS.md rule 2 (shared UI only in `components/ui`) and rule 24 (reuse before creating). Once installed, wire each the same way `Input` is wired today:

- **`Textarea`** — same `Controller` + `Field` composition as `Input`, pick a domain icon (e.g. `NotePencilIcon` for a "Description" field), `aria-invalid={fieldState.invalid}`.
- **`Select`** — wrap in `Controller`; drive `value`/`onValueChange` from `field.value`/`field.onChange` (Base UI `Select` is not a native `<input>`, so it cannot spread `{...field}` directly the way `Input` does).
- **`Checkbox`** / **`Switch`** — wrap in `Controller`; drive `checked`/`onCheckedChange` from `field.value`/`field.onChange`, use `Field orientation="horizontal"` so the label sits beside the control (matches the `has-[>[data-slot=field]]` checkbox styling already present in `field.tsx`).
- **`RadioGroup`** — wrap in `Controller`; drive `value`/`onValueChange`, one `RadioGroupItem` per option, each with its own `FieldLabel`.

## Interaction Patterns

- **Validation timing**: both shipped forms use RHF's default (`mode: "onSubmit"`, implicit — neither passes a `mode` option to `useForm`), so Zod's `zodResolver` only runs on submit; errors then persist and update live via `fieldState` on every keystroke until the field becomes valid. **Recommendation**: keep `onSubmit` as the default for new forms to match the established pattern, but add `mode: "onBlur"` to `useForm` for any form longer than ~4 fields or containing password/confirmation fields, so users get per-field feedback before they reach the submit button. Do not switch to `mode: "onChange"` — that fires validation on every keystroke and is noisier than the codebase's established feel.
- **Disabled-while-submitting**: every submit `Button` (and any secondary action button, e.g. `LoginForm`'s "use demo credentials") sets `disabled={isSubmitting || isPending}` — `isSubmitting` from RHF's `formState`, `isPending` from the TanStack Query `useMutation`. Always gate on both, never on `isPending` alone, since `isSubmitting` covers the synchronous validation phase before the mutation even fires.
- **Success feedback**: `toast.success(t("successTitle"), { description: t("successDescription", { name: product.name }) })` — a specific, data-bearing description (the created/updated entity's name), never a bare "Success". Pair success with any needed side effects in the same `onSuccess` callback: `queryClient.invalidateQueries({ queryKey: [...] })` to refresh list views, and `reset()` to clear the form back to `defaultValues` (see `product-form.tsx`). `LoginForm` deviates only because success means navigation (`router.push`), not staying on the form — apply `reset()`-on-success to any "create another" style form, and navigation-on-success to any form whose job is to gate access to a subsequent screen.
- **Error feedback**: `onError: (error: ApiErrorPayload) => toast.error(t("errorTitle"), { description: error.message })` in every mutation — the toast always surfaces the backend's real `message` from `ApiErrorPayload` (`@/lib/axios`), never a hardcoded string. This is form-level/submission-level feedback and is separate from field-level validation errors (see Error Handling below).

## Responsive Behavior

- Default field layout is single-column full-width (`Field`'s default `orientation="vertical"` sets `flex-col *:w-full`) — this already works at every breakpoint with no media queries needed, matching both shipped forms.
- If a form adds side-by-side fields, use `Field orientation="responsive"` — per `field.tsx`'s `fieldVariants`, this is `flex-col` below the `@md/field-group` container breakpoint and switches to `flex-row` above it. The breakpoint is a `@container` query scoped to the parent `FieldGroup` (`@container/field-group` is set on `FieldGroup` itself), so it responds to the form's own container width, not the viewport — correct behavior for forms rendered inside narrower contexts like a side panel or modal.
- Never use `orientation="horizontal"` for a field that should collapse on mobile — `horizontal` is fixed-row at all sizes and is reserved for rows that are inherently short and never wrap (e.g. a checkbox + its label, or a submit button that should not stretch full width, as in `product-form.tsx`).
- Inputs use the shared `Input` component's default height/padding, which is already touch-friendty (44px-class tap target) — do not shrink input height with a custom `className` to fit more on screen; let the form scroll vertically instead.

## Accessibility

- **Label association**: `FieldLabel` always receives `htmlFor={field.name}` and the paired `Input` always receives `id={field.name}` — this is the exact pairing in both `login-form.tsx` and `product-form.tsx`. Never introduce a field without this pairing; it is what makes the label click-to-focus and what a screen reader announces as the control's accessible name.
- **Invalid state**: every `Input` sets `aria-invalid={fieldState.invalid}`, already present in both source files. This is not optional polish — set it on every field, driven directly off `fieldState.invalid`, never a separately-tracked boolean.
- **Error announcement**: `FieldError` renders `role="alert"` (see `field.tsx` line 217), so screen readers announce validation errors as they appear without needing a manual `aria-describedby` wire-up in the shipped pattern. Keep `FieldError` as a conditionally-rendered sibling of the `Input` inside the same `Field` (`{fieldState.invalid && <FieldError .../>}`) so the DOM proximity plus `role="alert"` together carry the error to assistive tech.
- **Fieldset/legend semantics**: `FieldSet` renders a native `<fieldset>`. If a form's `FieldSet` groups fields under a visible heading, use `FieldLegend` (exported from `field.tsx` but not yet used in either shipped form) rather than a plain `<h3>` — it renders a real `<legend>` tied to the fieldset for correct AT grouping.
- **Keyboard**: no custom key handling exists or should be added — native `<form>` submit-on-Enter and native `Tab` order through `Input`s already work because the DOM order matches the visual order (AGENTS.md rule 23). Do not add `tabIndex` overrides.

## Loading

- The submit `Button` is the single loading indicator for the whole form: `{isPending && <CircleNotchIcon className="size-4 animate-spin" />}` immediately before the label, and the label itself swaps to a submitting-specific string (`{isPending ? t("submitting") : t("submit")}` — e.g. `t("submitting")` renders as running-state copy like "Signing in…"/"Saving…", never the same static label with just a spinner bolted on).
- Combine with `disabled={isSubmitting || isPending}` on that same button (see Interaction Patterns) — the spinner and the disabled state are applied together, never one without the other.
- Do not add a full-form skeleton or overlay for submission — the shipped pattern's loading affordance is scoped to the submit button only. (A full skeleton loader is the right tool for a form's *initial data fetch* in an edit flow — see Empty States below — not for the submit action itself.)

## Error Handling

Two distinct error channels, never conflated:

1. **Validation errors (client-side, per-field)** — produced by Zod via `zodResolver`, surfaced through `fieldState.error` inside each `Controller`'s `render`, displayed inline via `FieldError` directly under the offending `Input`. Zod schemas return short machine keys as messages (e.g. `"emailRequired"`, `"emailInvalid"`, `"priceInvalid"`, `"nameRequired"`, `"categoryRequired"` — see both schemas), which are then translated: `t(\`validation.${fieldState.error.message}\`)`. Any new field's Zod `.min()`/`.refine()` message must follow this same "key, not sentence" convention so it can be run through the `validation.*` i18n namespace — never inline a raw English sentence as a Zod message.
2. **Submission/API errors (server-side, form-level)** — produced by the backend, delivered as `ApiErrorPayload` to the mutation's `onError`, surfaced as `toast.error(t("errorTitle"), { description: error.message })`. This is a toast, never an inline field error, because the backend error is not attributable to one specific field in the shipped pattern (e.g. "Invalid email or password" from a login attempt isn't "the email field is wrong" or "the password field is wrong" specifically).
- If a future form needs field-specific API errors (e.g. backend returns "email already in use" tied to the `email` field), set it with RHF's `setError("email", { message: "..." })` inside `onError` in addition to the toast — but this is an extension point, not something either shipped form currently does; do not assume it exists without adding it explicitly.
- Never validate by hand (manual `if` chains, regex checks in the component) — Zod owns 100% of validation logic per AGENTS.md rule 13.

## Empty States

Forms do not have an "empty state" in the list/table sense (no "no results" placeholder). For a form pattern, "empty state" instead means two concrete cases:

1. **Initial/default state (create forms)** — every field starts at a defined `defaultValues` entry in `useForm` (e.g. `{ email: "", password: "" }`, `{ name: "", price: "", category: "" }`). Every field must have an explicit default — never leave a field `undefined` in `defaultValues`, since RHF/Zod treat an uncontrolled-to-controlled transition as a bug (React warns, and Zod's `.min(1, ...)` won't behave predictably against `undefined`). Placeholder text (`placeholder={t("emailPlaceholder")}`) communicates the expected format in this state; it is not a substitute for a label.
2. **"Nothing to edit yet" (edit forms loading their initial data)** — neither shipped form is an edit form yet, but the pattern this codebase already uses elsewhere for async data (AGENTS.md rule 20/21: every async operation covers loading/success/error/empty, every form has a skeleton loader) extends directly: while the record to edit is being fetched, render a skeleton in place of the `FieldGroup` (matching the field count/shape) rather than mounting the form with blank inputs and then snapping in values — this avoids a flash of empty fields before `reset(fetchedValues)` runs. Once loaded, call `reset(data)` (the same `reset` used for post-submit clearing in `product-form.tsx`) to populate `defaultValues` from server data, rather than pre-filling via individual `setValue` calls per field.
- If the fetch for an edit form's initial data fails, that is an **error state**, not an empty state — show the form-level error affordance (consistent with a `toast.error` + retry action), not a blank/empty form.
