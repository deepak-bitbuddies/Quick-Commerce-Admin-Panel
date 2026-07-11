# UI Playbook — Detail Page

> Framework v1.1.1 · Premium UI Engineering layer
> Scope: viewing/editing a single entity's full record (e.g. `/users/[id]`, `/products/[id]`, `/orders/[id]`).
> Stack: Next.js App Router + TypeScript + Tailwind CSS + Shadcn UI (style `base-nova`) + `@phosphor-icons/react` + TanStack Query.

## Relationship to `crud-module.md`

This playbook does **not** decide whether a detail/edit view gets a dialog or a dedicated route — that decision (entity complexity, field count, whether it needs its own shareable URL) belongs to `.claude/ui/playbooks/crud-module.md`. This file starts from the assumption that "dedicated page" was already chosen and covers only what goes *inside* that page: `app/(dashboard)/{feature}/[id]/page.tsx` (list pages stay on `app/(dashboard)/{feature}/page.tsx` per the existing `products/page.tsx` convention). If you land here still weighing dialog vs. page, resolve that in `crud-module.md` first.

## Prerequisite: component gaps to install

Frontend/src/components/ui/ currently has only: `button`, `card`, `collapsible`, `dropdown-menu`, `field`, `input`, `label`, `separator`, `sonner`, `tooltip`. A detail page as specified below needs four components that are **not installed yet**:

| Component | Needed for | Install |
|---|---|---|
| `tabs` | sectioned detail pages (Details / Activity / Permissions) | `npx shadcn@latest add tabs` |
| `badge` | status fields (`isActive`, order status, etc.) | `npx shadcn@latest add badge` |
| `skeleton` | loading state matching field layout | `npx shadcn@latest add skeleton` |
| `alert-dialog` | destructive action confirmation (deactivate/delete) | `npx shadcn@latest add alert-dialog` |

`avatar` is optional — only pull it in if the entity has a photo/initial (e.g. a user or store detail page); the `UserResponseDto` example below has no avatar field, so don't add it speculatively.

**Icon library mismatch to flag before installing:** `Frontend/components.json` has `"iconLibrary": "lucide"`, so `shadcn add` will scaffold new primitives (`tabs.tsx`, `alert-dialog.tsx`, etc.) importing `lucide-react` icons internally (the same way today's `sonner.tsx` and `dropdown-menu.tsx` already do). This is consistent with existing precedent — leave those internal icons alone. But every icon **you** place in feature/page code (tab triggers, header action buttons, empty-state icons) must come from `@phosphor-icons/react`, matching the exclusive real usage seen in `product-form.tsx`, `header.tsx`, `sidebar.tsx`, `login-form.tsx`, and `nav.ts`. Never import from `lucide-react` in module or app code — only shadcn's own generated primitives are allowed to do that.

## Reference data shape

Use the real, shipped `Backend/src/api/v1/admin/users/mapper.ts` → `toUserResponseDto` as the concrete example of what a detail page's DTO looks like:

```ts
interface UserResponseDto {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  isActive: boolean
  createdAt: Date
}
```

Seven fields, one boolean status, no nested sub-resources — this is the shape that drives the "single card, no tabs" decision below. The backend already exposes `getUserHandler` (`GET /admin/users/:userId`) for the fetch and `setUserStatusHandler` (`PATCH` on `isActive`) as the direct-mutation precedent used in Interaction Patterns.

---

## Layout

Every detail page has exactly two regions stacked vertically inside the dashboard shell's content area (the `<main><div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">` from `dashboard-shell.tsx` — do not re-wrap or fight that container; the page component's root element sits directly inside it):

1. **Page header** — not a `Card`, a plain flex row:
   - Left: back button (`Button variant="ghost" size="icon"` with `<ArrowLeftIcon />`, navigating to the list route) or a breadcrumb, plus the entity's display name as the page `<h1>` (e.g. the user's `name`), with a secondary line/`Badge` for status directly under or beside it.
   - Right: primary actions — `Edit`, `Deactivate`/`Delete`, any entity-specific action — as a `Button` row, right-aligned with `ml-auto`/`justify-between`.
   - Structure:
     ```tsx
     <div className="flex items-center justify-between gap-4">
       <div className="flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => router.push(routes.users.list)}>
           <ArrowLeftIcon />
         </Button>
         <div>
           <h1 className="font-heading text-xl font-semibold">{user.name}</h1>
           <Badge variant={user.isActive ? "default" : "secondary"}>
             {user.isActive ? t("statusActive") : t("statusInactive")}
           </Badge>
         </div>
       </div>
       <div className="flex items-center gap-2">
         <Button variant="outline"><PencilSimpleIcon />{t("edit")}</Button>
         <Button variant="destructive"><ProhibitIcon />{t("deactivate")}</Button>
       </div>
     </div>
     ```
2. **Body** — one of two shapes, decided by field/section count, not by feature "importance":

   - **Single `Card`** when the entity has roughly **fewer than ~8 fields and no natural grouping** — this is the `UserResponseDto` case: `id` (never rendered), `name`, `email`, `phone`, `role`, `isActive`, `createdAt` is 5 displayable fields in one flat list. One `Card` with `CardHeader` (title `t("details")`) + `CardContent` holding a label/value grid is correct; do not manufacture tabs for a 5-field entity.
   - **`Tabs`** once the entity has **distinct logical sections** that a user would think of as separate pages — e.g. a richer user profile with "Details" / "Activity" / "Permissions", or an order with "Details" / "Items" / "Timeline" / "Payment". The rule of thumb: if you'd naturally title two different `Card`s two different things, use tabs instead of stacking both cards on one page.

   Never mix the two — don't put a single lonely tab, and don't cram 15+ fields into one ungrouped card just to avoid installing `tabs`.

## Spacing

- Header-to-body gap: `space-y-6` (or a wrapping `<div className="flex flex-col gap-6">`) at the page root — consistent with the `p-4 md:p-6 2xl:p-10` outer rhythm already set by `dashboard-shell.tsx`; don't add a second competing padding scale inside the page.
- Inside the details `Card`: rely on `Card`'s own `[--card-spacing:--spacing(4)]` token (`card.tsx`) — never hardcode `p-4`/`p-6` on `CardContent` children to override it.
- Label/value grid inside `CardContent`: `grid grid-cols-1 gap-4 sm:grid-cols-2` — one field per cell, label as `<dt>`/small muted text above or beside the value, never inline `label: value` strings (keeps a11y and i18n clean).
- Tab strip to tab panel gap: `mt-4` (shadcn's default `TabsContent` spacing) — don't add extra margin on top of that.
- Action button row gap: `gap-2`, consistent with existing `Field orientation="horizontal"` spacing conventions in `product-form.tsx`.

## Recommended Components

| Component | Role |
|---|---|
| `Card` / `CardHeader` / `CardTitle` / `CardContent` | Main details panel (already installed) |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | Sectioned detail pages once installed — one `TabsContent` per logical section, each itself wrapping a `Card` if it needs its own header |
| `Badge` | Status fields (`isActive`, order status, role) — never render status as raw colored text |
| `Button` | All header actions; `variant="outline"` for Edit, `variant="destructive"` for deactivate/delete, `variant="ghost" size="icon"` for back |
| `AlertDialog` | Confirmation gate in front of any destructive action (deactivate, delete) — never fire a destructive mutation directly off a button `onClick` |
| `Skeleton` | Loading placeholders shaped like the real field grid — not a spinner |
| `DropdownMenu` (already installed) | Collapsed header actions on narrow viewports (see Responsive) |
| `Tooltip` (already installed) | Icon-only buttons (back button, icon actions) always get a `Tooltip` label for a11y/discoverability |

## Interaction Patterns

**Recommendation: in-place edit toggle for simple entities (the `Card` case above), not a separate `/edit` route.**

Rationale grounded in the real backend: `admin/users` already ships `setUserStatusHandler` as a dedicated, low-ceremony `PATCH` that flips `isActive` without opening a form — the whole module's philosophy is direct state changes over heavyweight edit flows. Follow that same spirit for field edits on simple entities:

- The page has one `isEditing` boolean (local `useState`, not global/Zustand — this is transient UI state scoped to one page).
- `Edit` button toggles the `Card`'s field grid from read-only `<dd>` text to the same `Field`/`Input` components used elsewhere (`field.tsx`, per `product-form.tsx`'s pattern), in place, no navigation, no layout shift beyond swapping text for inputs.
- Toggling to edit mode swaps the header's action row to `Save` (submits via TanStack Query `useMutation`, same `onSuccess`/`onError` + `toast` pattern as `product-form.tsx`) and `Cancel` (reverts `isEditing` to `false` and resets the form).
- Use React Hook Form + Zod for the edit form fields even in-place — rule 13 in `Frontend/AGENTS.md` is unconditional, in-place editing doesn't exempt it.
- For a boolean/status-only change (activate/deactivate), skip the form entirely — call the mutation directly from the header button (through an `AlertDialog` confirm), mirroring `setUserStatusHandler`'s directness. Don't route a one-field status flip through the full edit-mode toggle.

**Escalate to a separate `/edit` route only when** the entity is complex enough that `crud-module.md` already routed you to tabs, or the edit form has meaningfully different validation/layout than the read view (e.g. a multi-step or wizard-like edit). Don't default to a separate route out of habit — it's the exception, not the rule, for this pattern.

## Responsive Behavior

- **Header actions**: at `sm`/`md` widths, a row of 2+ `Button`s wraps or overflows. Collapse everything except the single most common action (typically `Edit`) into a `DropdownMenu` triggered by a `Button variant="ghost" size="icon"` with `<DotsThreeVerticalIcon />`, once there are 3+ actions. With only Edit + one destructive action, keep both visible down to mobile (2 buttons fit); only collapse at 3+.
- **Tabs**: on narrow viewports, do not let `TabsList` overflow silently.
  - Preferred: make `TabsList` horizontally scrollable (`overflow-x-auto` with `scrollbar-hide` utility or default thin scrollbar) so triggers remain tappable — this preserves the same component and URL/state model at every breakpoint.
  - Alternative (only if there are 4+ tabs and horizontal scroll feels cramped on real devices): drive the same tab state from a `Select` below `sm`, keeping `Tabs` above `sm` — both bound to the same `activeTab` state so nothing forks.
- **Label/value grid**: `grid-cols-1` by default, `sm:grid-cols-2` — never a fixed multi-column grid that forces horizontal scroll on mobile.

## Accessibility

- Exactly one `<h1>` per page: the entity's name/title in the header. Never let a `CardTitle` (`div`, not a heading element per `card.tsx`) substitute for the page heading.
- Section titles (`CardTitle` for the single-card case, or each tab's content header) are `<h2>` — wrap the `CardTitle` content in a semantic heading (`<CardTitle asChild><h2>...</h2></CardTitle>` pattern, or add `role="heading" aria-level={2}` if `CardTitle` can't render a real heading tag) so screen-reader users get a real outline; don't rely on visual size alone.
- Once `Tabs` is installed, verify Shadcn's Base UI primitive wires the full ARIA tab pattern out of the box: `TabsList` → `role="tablist"`, `TabsTrigger` → `role="tab"` + `aria-selected` + `aria-controls`, `TabsContent` → `role="tabpanel"` + `aria-labelledby`. Do not hand-roll this with plain `button`/`div` — always the installed primitive.
- Icon-only buttons (back button, dropdown trigger, tab icons if icon-only) always pair with a `Tooltip` (installed) and an `aria-label` — an icon alone is not an accessible name.
- `isEditing` toggle must move focus to the first input when entering edit mode, and back to the `Edit` button on cancel — don't leave focus stranded on a button that just changed meaning.
- Destructive `AlertDialog` must trap focus and return it to the triggering button on close/cancel — this is default `AlertDialog` behavior once installed; don't override it.

## Loading

Never a spinner for the initial page load — build a `Skeleton` layout that mirrors the eventual field grid so there's no layout shift on data arrival:

```tsx
function UserDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

Drive this from TanStack Query's `isLoading` (rule 15/21 in `Frontend/AGENTS.md` — React Query owns this state, never a hand-rolled `useState` loading flag). If the page uses tabs, skeleton only the active tab's content plus the header — don't pre-render skeletons for hidden tabs.

## Error Handling

Two distinct error states, not one generic catch-all — this mirrors the backend's own error taxonomy (`Backend/src/shared/errors/`), where `getUserById` explicitly throws `NotFoundError` (`Backend/src/shared/errors/not-found.error.ts`, `statusCode = 404`) rather than a bare `Error`:

1. **Entity not found (404)** — `getUserHandler` surfaces the backend's `NotFoundError` message through the standard `{ success: false, message, errors: [] }` envelope; `backendFetch` throws `BackendRequestError` with that message. Render a dedicated "not found" state in the page body (keep the page header/back button so the user isn't stranded): entity icon + `t("notFoundTitle")` + `t("notFoundDescription")` + a `Button` back to the list route. Do not reuse the generic error state for this — a 404 means "this record doesn't exist," which is a different user action (go back) than a network failure (retry).
2. **Network / permission / server error** — any other failure (`5xx`, `403`, timeout, offline). Render a generic error state: warning icon + `t("errorTitle")` + a `Button` that calls TanStack Query's `refetch()`. This is the retry-able case; 404 is not.

Distinguish them by inspecting the thrown error's status (`BackendRequestError` should carry the HTTP status through from the envelope — if it doesn't yet, that's a gap to close in `@/lib/backend` before this pattern can branch correctly, not something to work around per-page).

Within an already-loaded page, a **failed edit/status-change mutation** is not a page-level error state — surface it as a `toast.error(...)` (via `sonner`, same as `product-form.tsx`'s `onError`) and leave the page/form intact so the user can retry without re-navigating.

## Empty States

A detail page's entity itself is never "empty" (if it loaded, it has data) — "empty" applies to a **sub-section with no data yet**, most commonly inside a tab (e.g. an "Activity" tab with no events, a "Permissions" tab with none assigned). Reuse the existing `ComingSoon`-style card pattern (`Frontend/src/components/feedback/coming-soon.tsx`) scoped to that tab's `TabsContent`, not the whole page:

```tsx
<TabsContent value="activity">
  {activity.length === 0 ? (
    <Card>
      <CardHeader>
        <CardTitle>{t("noActivityTitle")}</CardTitle>
        <CardDescription>{t("noActivityDescription")}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  ) : (
    <ActivityList items={activity} />
  )}
</TabsContent>
```

Never let an empty sub-section blank out silently — every tab panel resolves to loading, error, empty, or populated (rule 20, `Frontend/AGENTS.md`). The single-`Card` (non-tabbed) case has no sub-sections, so this empty-state concern doesn't apply there — a 5-field entity like the `UserResponseDto` example either has all its fields or it doesn't exist (404), there's no in-between empty section to render.
