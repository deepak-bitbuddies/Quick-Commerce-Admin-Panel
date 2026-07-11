# UI Playbook — Authentication

**Framework:** v1.1.1 (Premium UI Engineering layer)
**Pattern:** Authentication (login, and by extension logout / session-expired / forgot-password)
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn UI + Phosphor Icons (`@phosphor-icons/react`) + React Hook Form + Zod

**Source of truth (read before deviating):**
- `Frontend/src/app/(auth)/layout.tsx` — the shared auth route-group shell.
- `Frontend/src/modules/auth/pages/login-page.tsx` — the real, shipped page composition.
- `Frontend/src/modules/auth/components/login-form.tsx` — the real, shipped form.
- `Frontend/src/proxy.ts` + `Frontend/src/lib/auth/constants.ts` — the middleware that redirects to `/login` and the `?from=` contract the form consumes.
- `Frontend/messages/en.json` (`"Login"` namespace) — the i18n keys actually used.

**This is not an aspirational playbook.** Unlike the other eleven, the pattern described here is already fully built and shipped. Every section documents the *actual* code as it exists today. Where this playbook extends the pattern to a screen that doesn't exist yet (forgot-password, session-expired, logout confirmation), that extrapolation is explicitly labeled **"not yet built"** — do not treat it as already-implemented.

---

## Layout

The shipped structure is a two-part composition: a route-group layout that centers the viewport, and a page that composes a single `Card`.

**1. `(auth)/layout.tsx` — the shell**, applied to every route inside the `(auth)` route group:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {children}
    </div>
  )
}
```

- `min-h-screen` + `flex items-center justify-center` centers the card both axes, full viewport height — there is no header/sidebar/footer chrome on auth routes, unlike every dashboard route.
- `bg-muted/30` is the only background treatment — a faint tint against the default `bg-background`, not a hero image, gradient, or illustration. Do not add decorative backgrounds; this is a deliberately minimal, functional screen.
- `p-4` is the shell's only spacing — it exists purely so the `Card` never touches the viewport edge on narrow screens.
- Any new auth-adjacent route (`/forgot-password`, `/session-expired`) that lives under the `(auth)` route group inherits this shell automatically by virtue of file placement — do not re-wrap it in another centering `<div>`.

**2. `login-page.tsx` — the page**, rendered inside that shell:

```tsx
<Card className="w-full max-w-sm">
  <CardHeader>
    <div className="mb-2 flex items-center gap-2 font-semibold">
      <StorefrontIcon weight="fill" className="size-5 text-primary" />
      Quick Commerce
    </div>
    <CardTitle>{t("title")}</CardTitle>
    <CardDescription>{t("subtitle")}</CardDescription>
  </CardHeader>
  <CardContent>
    <Suspense>
      <LoginForm />
    </Suspense>
  </CardContent>
</Card>
```

- **`Card className="w-full max-w-sm"`** — `w-full` so it fills the shell's padded area on mobile, `max-w-sm` (24rem) caps it on wider viewports. This is the one and only container; there is no outer wrapping `<div>` around the `Card` inside the page component.
- **Brand row** (`mb-2 flex items-center gap-2 font-semibold`): a Phosphor icon (`StorefrontIcon`, `weight="fill"`, `size-5`, `text-primary`) plus the literal wordmark text `"Quick Commerce"`. This sits *above* `CardTitle`, inside the same `CardHeader`, not as a separate element outside the `Card`.
- **`CardTitle`** carries the page-specific heading (`t("title")` → "Sign in"), **`CardDescription`** the subheading (`t("subtitle")` → "Enter your credentials to access the admin panel."). Both come from `CardHeader`'s own `grid auto-rows-min gap-1` — no manual spacing is added between them.
- **`CardContent`** holds exactly one child: the form, wrapped in `<Suspense>`. There is no `CardFooter` in the shipped screen (no "forgot password?" / "sign up" links exist yet — see Interaction Patterns for how to add one without breaking this structure).
- **`LoginPage` is an `async` Server Component** (`export async function LoginPage()`, using `getTranslations` from `next-intl/server`) — this is why `StorefrontIcon` is imported from `@phosphor-icons/react/dist/ssr` rather than the client entrypoint (see Recommended Components). The interactive form is isolated into `LoginForm`, a separate `"use client"` module, keeping the page itself server-rendered.
- **`<Suspense>` is required, not optional**, because `LoginForm` calls `useSearchParams()` (see `proxy.ts` contract below) — Next.js requires any component reading `useSearchParams` in a static/SSR page to be wrapped in a `Suspense` boundary. Any future auth form that reads a URL search param (e.g. a password-reset token) must be wrapped the same way.

## Spacing

- No custom spacing utilities exist anywhere in this pattern beyond what `Card`/`CardHeader`/`CardContent` already encode via their own `--card-spacing` CSS variable (`px-(--card-spacing)`, default `--spacing(4)`). Never add ad hoc `p-*`/`m-*` overrides on `CardHeader`/`CardContent` in an auth screen — the card's own spacing system is the entire spacing contract here.
- The brand row's `mb-2` is the only manually-authored margin in the whole page composition — it separates the wordmark row from `CardTitle`. Do not add additional margins between `CardTitle` and `CardDescription`; `CardHeader`'s `gap-1` already owns that.
- Inside the form, spacing is entirely owned by `FieldSet`/`FieldGroup` (see the `form.md` playbook for the full field-spacing contract — it applies identically here, `LoginForm` is one of that playbook's two canonical source files). The one addition specific to this screen is the demo-credentials box: `mt-4` separates it from the `FieldSet` above, and it uses its own internal `p-3` — this `mt-4` boundary is the rule for "anything that isn't a form field lives outside `FieldSet`, spaced by `mt-4`."

## Recommended Components

Already available and used exactly this way in the shipped screen:

| Component | Import | Use for |
|---|---|---|
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | `@/components/ui/card` | The single container for any auth screen. `CardFooter` is available but unused today — reserve it for a future "forgot password?" / secondary-action link row. |
| `Field`, `FieldGroup`, `FieldSet`, `FieldLabel`, `FieldError` | `@/components/ui/field` | Identical usage to every other form in the app — see `form.md`. |
| `Input` | `@/components/ui/input` | Email (`type="email"`) and password (`type="password"`) fields. |
| `Button` | `@/components/ui/button` | Submit action and the secondary "Use Demo Credentials" action (`variant="outline" size="sm"`). |
| `StorefrontIcon`, `EnvelopeSimpleIcon`, `LockKeyIcon`, `CircleNotchIcon`, `SparkleIcon` | `@phosphor-icons/react` (client) / `@phosphor-icons/react/dist/ssr` (server) | Brand mark, field icons, submit-loading spinner, demo-credentials affordance icon. |

**The `/dist/ssr` import distinction is load-bearing, not stylistic.** `login-page.tsx` is a Server Component and imports `StorefrontIcon` from `"@phosphor-icons/react/dist/ssr"`. `login-form.tsx` is a Client Component (`"use client"` at the top) and imports its icons (`CircleNotchIcon`, `EnvelopeSimpleIcon`, `LockKeyIcon`, `SparkleIcon`) from the plain `"@phosphor-icons/react"` client entrypoint. When adding any new icon to an auth screen: if the file has no `"use client"` directive, import from `/dist/ssr`; if it does, import from the package root. Getting this backwards either bloats the server bundle unnecessarily or breaks in a strict RSC boundary.

**This screen is the reference example for icon-library correctness.** `Frontend/components.json` sets `"iconLibrary": "lucide"` for the shadcn CLI's own scaffolding defaults — that setting is irrelevant here because every icon in the auth pattern is already Phosphor, imported correctly (including the SSR-vs-client split above), with zero `lucide-react` imports anywhere in `modules/auth/`. Hold this screen up as the standard other playbooks/modules should match if they are found still importing from `lucide-react`.

## Interaction Patterns

- **Submit flow**: `useMutation({ mutationFn: login })` from TanStack Query. `onSuccess` calls `setUser(user)` on the Zustand `useAuthStore`, then `router.push(searchParams.get("from") ?? "/")` — never a hardcoded `router.push("/")`. This is what makes the `?from=` redirect contract (see below) actually take effect.
- **Demo credentials affordance** (specific, deliberate feature of this admin panel — not a generic pattern to replicate on customer-facing or other apps' login screens, but a real part of this shipped screen and should be preserved as-is): a dashed-border box (`rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm`) displaying the literal demo email/password (`DEMO_EMAIL = "admin@quickcommerce.com"`, `DEMO_PASSWORD = "ChangeMe123!"`, both module-level constants in `login-form.tsx`) and a `Button variant="outline" size="sm"` labeled via `t("useDemoCredentials")` with a leading `SparkleIcon`. Its click handler (`handleUseDemoCredentials`) calls `setValue("email", DEMO_EMAIL, { shouldValidate: true })` and `setValue("password", DEMO_PASSWORD, { shouldValidate: true })`, then immediately calls `onSubmit()` — it doesn't just fill the fields, it submits on the user's behalf. This exists to let reviewers/stakeholders/demo viewers sign in with one click without needing real credentials; keep it faithfully if touching this screen, but do not propagate the "hardcoded credentials in a box" idea to any screen handling real user data.
- **`?from=` redirect contract**: `proxy.ts` (the Next.js middleware) redirects unauthenticated requests to protected routes to `/login?from=<originalPath>` (see below). `LoginForm` reads this via `useSearchParams().get("from")` and uses it as the post-login destination, falling back to `"/"` if absent (i.e., a direct, un-redirected visit to `/login`). Any new auth-flow page that also needs to "return the user to where they were going" must consume the same `from` param the same way — do not invent a second param name.
- **No client-side redirect-if-already-authenticated logic exists in the page/form** — that direction (authenticated user hitting `/login`) is handled entirely by `proxy.ts`, not by the component tree. Keep it that way: authentication-state routing decisions belong in the middleware, not scattered into page components.

**`proxy.ts` middleware contract** (not part of the UI files themselves, but the mechanism the login screen depends on):

```ts
if (!isAuthenticated && !isPublicPath) {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("from", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}
if (isAuthenticated && isPublicPath) {
  return NextResponse.redirect(new URL("/", request.url))
}
```

`PUBLIC_PATHS` (`@/lib/auth/constants`) currently contains only `["/login"]`. **Not yet built:** if `/forgot-password` or a `/session-expired` screen is added, its path must be appended to `PUBLIC_PATHS` or it will itself get redirect-looped by the `!isAuthenticated && !isPublicPath` branch — this is a required wiring step, not optional.

## Responsive Behavior

- The entire responsive story is two Tailwind utilities on the `Card`: `w-full` (fills available width inside the shell's `p-4` padding on small viewports) and `max-w-sm` (caps growth at 24rem on larger viewports). There is no separate mobile layout, no breakpoint-conditional stacking, no hidden/shown elements — the same single-column `Card` renders identically from a 320px phone to a wide desktop, just re-centered by the shell's flex centering.
- Because the shell is `min-h-screen` + `flex items-center justify-center`, the card recenters automatically on any viewport/orientation change with zero extra media-query code.
- The demo-credentials `Button` is `className="mt-2 w-full"` — full-width to match the field-stack width above it, at every breakpoint. Do not make it a fixed/inline-width button that could look orphaned at the `max-w-sm` card width.

## Accessibility

- Every rule documented in `form.md`'s Accessibility section applies identically here — `login-form.tsx` is literally one of that playbook's two canonical sources (`FieldLabel htmlFor` / `Input id` pairing, `aria-invalid={fieldState.invalid}` on every `Input`, `FieldError`'s `role="alert"`, native `<form>` submit-on-Enter with no custom `tabIndex`). Do not re-derive a separate accessibility contract for the login form — reuse that one.
- **Email field**: `autoComplete="email"`. **Password field**: `autoComplete="current-password"` (not `new-password` — this is a sign-in form, not a registration/reset form; a future forgot-password/reset-password screen that sets a *new* password should use `autoComplete="new-password"` instead, following browser/password-manager convention).
- `<form onSubmit={onSubmit} noValidate>` — native HTML5 validation is suppressed in favor of Zod, identical to every other form in the app (AGENTS.md rule 13).
- The brand row (icon + "Quick Commerce" text) is plain text content, not a link and not an `<h1>` — `CardTitle` is the actual page heading (rendered as a styled `div`, not a semantic `<h1>`/`<h2>`, consistent with the rest of the `Card` primitive's non-semantic headings across the app).

## Loading

- Identical mechanism to every other form in the app (see `form.md`'s Loading section, which this screen is one of the two canonical sources for): the submit `Button` shows `{isPending && <CircleNotchIcon className="size-4 animate-spin" />}` immediately before its label, and the label itself swaps from `t("submit")` ("Sign in") to `t("submitting")` ("Signing in...") while `isPending`. The button is disabled via `disabled={isSubmitting || isPending}` for the duration.
- The secondary "Use Demo Credentials" button shares the same `disabled={isSubmitting || isPending}` gate — both actions are locked out together during a submit, since `handleUseDemoCredentials` itself triggers a submit.
- There is no full-page loading skeleton for the login screen itself — `LoginPage` is a Server Component with no async data fetch of its own (translations resolve server-side before render; there is no "loading the login form" state to skeleton). The only in-flight state on this screen is the submit-button spinner described above.

## Error Handling

Two channels, matching the general form pattern exactly (see `form.md`'s Error Handling section) with one difference specific to login:

1. **Validation errors (client-side, per-field)** — Zod's `loginFormSchema` (`email: z.string().min(1, "emailRequired").email("emailInvalid")`, `password: z.string().min(1, "passwordRequired")`) produces machine-key messages, translated via `t(\`validation.${fieldState.error.message}\`)` and rendered inline via `FieldError` under the relevant `Input`. The three real keys today: `emailRequired`, `emailInvalid`, `passwordRequired`.
2. **Submission errors (server-side, form-level)** — `onError: (error: ApiErrorPayload) => toast.error(t("errorTitle"), { description: error.message })`. Note this is deliberately **not** attributed to either the email or password field individually — a failed login (e.g. "Invalid email or password") does not reveal which credential was wrong, both for the generic form-error reason documented in `form.md` and, specifically for auth, as a basic enumeration-prevention practice (never let a login form's error state imply "that email doesn't exist" vs. "that password is wrong" as two distinguishable states).
- **Not yet built:** a session-expired scenario (JWT/cookie expired mid-session, user redirected back to `/login` by `proxy.ts`) currently lands on the exact same login screen with no distinguishing message — the `from` param records where they were headed, but there is no "your session expired, please sign in again" banner. If this is built, follow the established pattern: add a query param (e.g. `?reason=session-expired`) alongside `from`, read it in `LoginForm` via the same `useSearchParams()` call already in place, and surface it as a non-blocking banner/`CardDescription` addendum — not a toast (toasts are reserved for this screen's submission-error channel, not entry-state messaging).

## Empty States

Not applicable in the list/table sense, and there is no real analogue to force one. An authentication screen has no data collection to be empty — it is a fixed, single-purpose form that renders the same three elements (email field, password field, submit button) whether it is the very first visit or the hundredth. The closest things to an "empty" condition are:

- **Fresh/unfilled form** — both fields start at `defaultValues: { email: "", password: "" }`, which is the form's permanent "empty" starting point, not a state that needs a dedicated empty-state component (no `EmptyState` shared component, no illustration, no "nothing here yet" copy applies).
- **Not yet built — forgot-password screen**: if a "check your email" confirmation view is added after a reset-request submission, that view *would* have a genuine empty-state-adjacent moment ("we've sent a link, there's nothing further to do here") — at that point, reuse the shared `EmptyState` component (per AGENTS.md rule 2, shared components list) rather than composing an ad hoc confirmation panel inside the `Card`. Until that screen exists, treat this section as not applicable to the authentication pattern.
