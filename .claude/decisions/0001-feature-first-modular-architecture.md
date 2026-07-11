# ADR-0001: Feature-first modular architecture with a global API response envelope

- **Status:** Accepted
- **Date:** 2026-07-11
- **Related:** `Frontend/AGENTS.md`, `Backend/AGENTS.md`, ADR-0002

## Context

The repository started as a thin scaffold: `Frontend/src` had flat
`components/`, `services/`, `types/` folders with no feature boundaries;
`Backend/src` had a partial `api/v1/{auth,admin}` split but no DTO/mapper
layer, no custom error hierarchy, and inconsistent response shapes across
endpoints (login returned `{token,user}` directly; admin user endpoints
returned raw Mongo documents with inconsistent field sets between
create/list/get/setStatus). Neither side had a documented target
architecture, so every new feature would have re-derived folder structure
and response conventions from scratch — untenable once the platform grows
past a handful of features.

## Decision

1. **Frontend** adopts a feature-first `modules/{feature}/{api,components,
   hooks,pages,services,schema,types,constants,enums,utils,index.ts}`
   structure. `app/` stays thin (pages only compose a module's page
   component). Shared, genuinely reusable UI lives in `components/{ui,
   layout,common,feedback,...}`; cross-cutting providers live in top-level
   `providers/`; cross-feature constants (e.g. backend route strings) live
   in top-level `constants/`. Full rule set: `Frontend/AGENTS.md`.

2. **Backend** adopts a layered `api/v1/admin/{feature}/{controller,service,
   repository,routes,model,schema,dto,mapper,errors,index.ts}` structure,
   with framework-level concerns (env, Fastify setup, JWT, Mongo, Redis,
   logging) in `core/`, and cross-feature primitives (the `AppError`
   hierarchy, validation helper, response helper, shared enums/types) in
   `shared/`. Full rule set: `Backend/AGENTS.md`.

3. **Every backend response is wrapped in a global envelope:**
   `{success,message,data,meta}` on success, `{success,message,errors}` on
   error — applied retroactively to the two endpoints that already existed
   (login, admin/users CRUD), not just new ones. `shared/helpers/
   http-response.ts`'s `sendSuccess()` and `core/exceptions/
   global-error-handler.ts` are the only places that construct this shape;
   no controller hand-rolls a response body.

4. Controllers are simplified to validate → call service → `sendSuccess()`,
   with no `try/catch`/`instanceof` branching — errors are thrown as typed
   `AppError` subclasses and formatted once, centrally, by the global error
   handler (this required confirming Fastify's `preHandler` hook errors
   route through the same `setErrorHandler` as route-handler errors, which
   was verified against Fastify 5.10.0's own documentation before relying
   on it).

## Consequences

- Both sides now have exactly one way to structure a new feature — the
  first thing any future agent does is read the relevant `AGENTS.md`, not
  guess.
- The envelope change was a deliberate, approved breaking change to two
  already-working endpoints. The one frontend consumer
  (`app/api/auth/login/route.ts`) and the shared `backendFetch` helper
  (`lib/backend.ts`) were updated in the same pass — there is no
  transitional/dual-format period.
- `admin/users`' four endpoints (create/list/get/setStatus), which
  previously returned four subtly different shapes for the same resource,
  now all go through one `toUserResponseDto` mapper — fixing a real
  pre-existing inconsistency as a direct, in-scope consequence of "mappers
  always," not scope creep.
- "Absolute imports" (a stated goal for both sides) is intentionally
  **not** implemented as Node subpath imports (`#core/*` etc.) in this
  pass — that mechanism needs separate verification against this
  project's dual `tsx watch` (dev) / `tsc build → node dist` (prod)
  execution paths before being adopted. Both sides currently use relative
  imports with explicit `.js` extensions (matching the existing NodeNext
  ESM convention). Flagged as a small, explicit follow-up, not silently
  skipped.
- Folders for domains/features that don't exist yet (`jobs/`, `tests/`,
  `api/v1/app/`, `core/decorators/`, `core/permissions/`, frontend
  `orders/`, `customers/`, etc. modules) were deliberately **not**
  scaffolded — creating empty structure for unbuilt features is treated as
  premature scaffolding throughout this codebase's conventions, not a
  target to complete upfront.
