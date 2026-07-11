# Identity Domain

## Purpose

Identity answers one question for the rest of the platform: **who is
acting, and what are they allowed to do?** It is the system of record for
authentication (proving someone is who they claim to be) and for the
account/role that determines what they can subsequently do. Every other
domain that needs to know "is this a valid, active user" or "does this
caller have permission to do X" defers to Identity's answer rather than
maintaining its own copy of accounts or roles.

Identity does not decide what a role's holder *does* once authorized — a
rider's shift, delivery assignment, and payout are Operations' concern; a
customer's order history is Commerce's concern. Identity's job stops at "you
are a rider, and riders are allowed to do these things" — see Dependencies
and Explicit Non-Responsibilities.

Identity is also distinct from the engineering **Security Engineer** role in
this framework: Identity defines the *business* rule of who-can-do-what
(e.g. "a rider should only be able to update orders assigned to them"); the
Security Engineer verifies the technical implementation actually enforces
that boundary (no IDOR, no privilege escalation, no token forgery). Identity
never audits code for vulnerabilities; it defines the rule the code must
satisfy.

## Ownership

Identity owns the following modules, per `.claude/domain/domain-registry.md`
(row 5) and `.claude/domain/module-registry.md`:

- Auth (login/logout) — **Built**, `Backend/src/api/v1/admin/auth/`,
  `Frontend/src/modules/auth/`.
- Users (admin CRUD) — **Built, backend only**,
  `Backend/src/api/v1/admin/users/`; no frontend consumer exists yet.
- Roles & Permissions — **Planned**; today this is a fixed three-value enum
  with no admin-configurable module behind it (see Future Growth
  Considerations).
- The account side of "Manage Delivery Boys" (rider accounts) — jointly
  owned with Operations, which owns scheduling/assignment/payout for the
  same rider.
- The account/profile side of "Customers" — jointly owned with Commerce,
  which owns the order history displayed against that profile.

## Responsibilities

- Defining what a "user" is in this system and what data an account must
  carry (name, email, phone, password, role, active/inactive status).
- Authenticating a user (verifying a claimed identity against stored
  credentials) and issuing a session/access token on success.
- Defining the fixed set of roles a user can hold and gating admin-only
  operations behind role checks.
- Enforcing account lifecycle: creation, activation/deactivation, and (once
  built) the permission matrix a role or user carries.
- Maintaining login credential hygiene: password hashing, minimum password
  strength, never exposing password material in any response.
- Being the single source of truth other domains query (conceptually) for
  "is this user real, active, and what role do they hold" — Operations and
  Commerce build their rider/customer-specific data on top of the account
  Identity owns, they do not re-implement account/role state.

## Business Concepts

### User Account

A User is any actor who can authenticate into the platform — a platform
super-admin, a delivery rider, or a customer. Concretely, per the real
schema in `Backend/src/api/v1/admin/users/model.ts`, an account carries:

- **name** — required.
- **email** — required, unique platform-wide, normalized to lowercase,
  trimmed. The login identifier.
- **phone** — required, unique platform-wide, trimmed.
- **passwordHash** — required; the bcrypt hash of the account's password.
  Marked `select: false` on the schema, so it is never returned by a
  default Mongoose query — it must be explicitly `.select("+passwordHash")`
  for the one place that legitimately needs it (credential verification in
  `Backend/src/api/v1/admin/auth/service.ts`).
- **role** — required, indexed, one of exactly three enum values (see
  Roles below).
- **isActive** — boolean, defaults to `true`. The account-lifecycle switch;
  see Business Rules.
- **createdAt / updatedAt** — Mongoose-managed timestamps.

### Roles

Today there are exactly **three** roles, defined in
`Backend/src/shared/enums/user-role.enum.ts`:

```
UserRole = { SUPER_ADMIN: "super_admin", RIDER: "rider", CUSTOMER: "customer" }
```

There is no partial/custom role and no fourth role anywhere in shipped
code — do not invent additional roles (e.g. "manager," "store_ops") when
reasoning about this domain; if a feature needs one, that is a Dynamic
Domain Evolution / new-module discussion, not something already supported.

- **super_admin** — the platform operator role. Can manage other user
  accounts (create, list, view, activate/deactivate) via the admin Users
  API. There is no permission gradation within `super_admin` today: any
  super_admin can do anything gated by `requireRole(UserRole.SUPER_ADMIN)`.
- **rider** — a user who fulfills deliveries. Identity owns that this
  account exists and holds this role; Operations owns everything about what
  the rider *does* with it (shift scheduling, delivery assignment, payout).
- **customer** — a user who places orders. Identity owns the
  account/profile; Commerce owns the order history shown against it.

### Authentication

Authentication is a single, real, already-shipped flow: email + password in,
a signed JWT (embedding `{ id, role }`) out. There is no OAuth/SSO, no
magic-link, no OTP-based auth in the codebase today — only email/password.

### Authorization

Authorization today is coarse-grained and role-based only: a route either
requires no auth, requires *any* authenticated user (`requireAuth`), or
requires one or more specific roles (`requireRole(...)`). There is no
concept yet of a permission finer than "has this role" — e.g. there is no
way today to grant one super_admin "manage products" but not "manage
users." See Future Growth Considerations.

## Entities

| Entity | Key fields | Notes |
|---|---|---|
| User | `_id`, name, email (unique), phone (unique), passwordHash (select:false), role (enum, indexed), isActive, createdAt, updatedAt | `Backend/src/api/v1/admin/users/model.ts`; single collection for all three roles — there is no separate `riders`/`customers` collection |
| Role | `super_admin` \| `rider` \| `customer` | Not a document/collection — a fixed TypeScript/enum value on User, `Backend/src/shared/enums/user-role.enum.ts` |
| Session/Token | JWT payload `{ id, role }`, 7-day default expiry | Not persisted server-side; stateless JWT verified per-request via `@fastify/jwt` (`Backend/src/core/auth/jwt.plugin.ts`) |

## Relationships

- **User → Role**: many-to-one via the required `role` enum field. Exactly
  one role per user; there is no multi-role/role-composition support today.
- **User (role=rider) → Operations' rider-scheduling entities**: one user
  account corresponds to at most one "rider" for scheduling/assignment
  purposes, but that linkage/entity lives in Operations, not here. Identity
  only asserts "this account exists, is active, and holds role=rider."
- **User (role=customer) → Commerce's order history**: one user account,
  many orders, but the order records and their aggregation live in
  Commerce. Identity does not join against orders.
- **User → JWT**: one issued token embeds one user's `id` and `role` at
  sign time; the token is not re-checked against current `role`/`isActive`
  until it expires or a protected route re-verifies it (see Edge Cases —
  role/deactivation changes do not retroactively invalidate an
  already-issued token).

## Business Rules

1. **No public registration endpoint, by design.** `POST
   /api/v1/admin/users` (the only way to create a user) is itself gated by
   `requireAuth` + `requireRole(UserRole.SUPER_ADMIN)`
   (`Backend/src/api/v1/admin/users/routes.ts`). There is no self-service
   signup for any role, including customer or rider, in the admin backend
   today. A fresh database has no way to create its first account except
   `Backend/src/scripts/seed-admin.ts` (`npm run seed:admin`), which exists
   specifically to bootstrap the first `super_admin` — its own header
   comment states this is deliberate, not an oversight.
2. **Email and phone are each globally unique**, enforced as `unique: true`
   at the Mongoose schema level (`Backend/src/api/v1/admin/users/model.ts`).
   Two accounts cannot share an email, and two accounts cannot share a
   phone number, regardless of role.
3. **Passwords are never stored or returned in plaintext.** Only
   `passwordHash` (bcrypt, salt rounds from
   `Backend/src/shared/constants/auth.constants.js`'s
   `BCRYPT_SALT_ROUNDS`) is persisted, and the field is `select: false` so
   it is excluded from every query by default — the one legitimate reader
   (`findUserByEmail` in `Backend/src/api/v1/admin/users/repository.ts`)
   explicitly opts back in with `.select("+passwordHash")` for credential
   verification only. The response mapper
   (`Backend/src/api/v1/admin/users/mapper.ts`) never includes it in any
   DTO.
4. **Minimum password strength is enforced at creation**: the `zod`
   `createUserSchema` (`Backend/src/api/v1/admin/users/schema.ts`) requires
   at least 8 characters. There is no additional complexity rule (no
   required mixed case/digits/symbols) today.
5. **A deactivated account cannot authenticate**, even with fully correct
   credentials. `verifyCredentials`
   (`Backend/src/api/v1/admin/auth/service.ts`) checks `isActive` *after*
   confirming the password matches, and throws `AccountDisabledError` (403)
   rather than allowing the login. This is the real, already-implemented
   account-lifecycle mechanism — there is no separate "delete" path for
   users today, only activate/deactivate via `PATCH
   /users/:userId/status`.
6. **Only a super_admin manages accounts.** Every admin user-management
   endpoint (`create`, `list`, `get`, `set-active-status`) requires both
   `requireAuth` and `requireRole(UserRole.SUPER_ADMIN)`
   (`Backend/src/api/v1/admin/users/routes.ts`). A rider or customer
   account, even if authenticated, cannot list or modify other users.
7. **A JWT is the sole session-bearing artifact**; it embeds `{ id, role }`
   and is signed with `env.JWT_SECRET`, expiring per `env.JWT_EXPIRES_IN`
   (default: 7 days), configured once in
   `Backend/src/core/auth/jwt.plugin.ts` and never overridden per-call
   (`Backend/src/api/v1/admin/auth/controller.ts`'s `loginHandler` relies on
   the plugin-level default and deliberately does not repeat it).
8. **The frontend never lets client-side JS touch the raw JWT.** The
   Next.js `POST /api/auth/login` route
   (`Frontend/src/app/api/auth/login/route.ts`) calls the real backend
   login, then sets two `httpOnly` cookies with identical expiry
   (`SESSION_COOKIE_MAX_AGE`): a `session` cookie holding only display
   fields (`id`, `name`, `email`, `role` — the `AuthUser` shape, not the
   token) and a separate `access_token` cookie holding the actual JWT.
   Client-side code can read `session` for UI decisions but can never read
   or exfiltrate the bearer token itself.

## Validations

- **name**: required, non-empty (`z.string().min(1)`,
  `Backend/src/api/v1/admin/users/schema.ts`).
- **email**: required, must parse as a valid email (`z.string().email()`);
  schema-level `unique: true` + `lowercase: true` on the model.
- **phone**: required, non-empty (`z.string().min(1)`); schema-level
  `unique: true`. No format/country-code validation exists yet beyond
  non-empty.
- **password**: required at creation, minimum 8 characters
  (`z.string().min(8, "Password must be at least 8 characters")`). Login
  only requires non-empty (`loginSchema` in
  `Backend/src/api/v1/admin/auth/schema.ts` — `z.string().min(1)`), since
  strength is checked once, at creation.
- **role**: required, must be one of the three `UserRole` enum values —
  both at the Mongoose schema level and the zod `createUserSchema`/
  `listUsersQuerySchema` level.
- **isActive** (on the status-update endpoint): required boolean
  (`setStatusBodySchema`).

## Edge Cases

- **Duplicate email or phone on account creation.** The schema declares
  `unique: true` on both fields, so MongoDB will reject a duplicate insert
  with an `E11000` duplicate-key error. However, unlike the deliberate
  `ConflictError` class already defined in
  `Backend/src/shared/errors/conflict.error.ts`, nothing in
  `Backend/src/api/v1/admin/users/service.ts` or `repository.ts` currently
  catches that Mongo error and re-throws it as a `ConflictError`. The
  global handler (`Backend/src/core/exceptions/global-error-handler.ts`)
  only special-cases errors that are already instances of the app's
  `AppError` hierarchy; a raw Mongoose `E11000` is not one, so it falls
  through to the generic branch and surfaces as a `500 Internal server
  error` today, not the clean `409 Conflict` the codebase's own error
  hierarchy is designed to produce. **This is a known, real gap** — flag it
  when duplicate-account handling is touched, rather than assuming a 409
  is already returned.
- **Login against a deactivated account.** Handled correctly today:
  `AccountDisabledError` (403, `"This account has been deactivated"`) is
  thrown even when the password is correct — see Business Rule 5.
- **Wrong password or unknown email.** Both collapse to the same
  `InvalidCredentialsError` (401, `"Invalid email or password"}`) —
  deliberately not distinguishing "no such email" from "wrong password" to
  avoid leaking which emails are registered.
- **The last remaining super_admin deactivates themselves (or is
  deactivated by another super_admin).** Nothing in
  `Backend/src/api/v1/admin/users/service.ts`'s
  `updateUserActiveStatus` checks whether the target is the sole active
  super_admin before flipping `isActive` to `false`. This is a real,
  unaddressed edge case worth flagging: today it is possible to lock the
  platform out of its own admin-management surface (no active super_admin
  left to re-activate anyone), recoverable only by re-running `npm run
  seed:admin` against the database directly. **This is a known gap, not
  yet enforced in code.**
- **JWT expires mid-session.** There is no refresh-token flow. On
  expiry, the next authenticated API call fails JWT verification inside
  `requireAuth` (`Backend/src/core/auth/guards.ts`), which throws
  `UnauthorizedError` (401). The frontend's shared axios instance
  (`Frontend/src/lib/axios.ts`) already handles this globally: its response
  interceptor watches for a `401`, and if the current page isn't already
  `/login`, forces `window.location.href = "/login"` (a full reload so the
  root layout re-reads the now-absent/expired session cookie
  server-side). There is no silent token refresh — an expired session
  always requires a fresh login.
- **Role or active-status changed while a JWT is still valid.** Because the
  JWT payload (`{ id, role }`) is only set at sign time and never
  re-validated against the current database row until the token's own
  expiry, a super_admin who is deactivated or has their role changed mid-
  session can continue to pass `requireAuth` (signature still valid) until
  the token naturally expires — `isActive` and `role` are not re-checked
  per-request against the database, only at login time. This is a real
  consequence of the stateless-JWT design, not a bug, but worth naming
  explicitly: there is no server-side session revocation today.
- **Attempting to hit any `/users` endpoint without a super_admin role.**
  Rejected with `ForbiddenError` (403, `"Insufficient permissions"`) from
  `requireRole` (`Backend/src/core/auth/guards.ts`), regardless of whether
  the caller is authenticated as a rider or customer.

## Dependencies

- **`.claude/domain/operations.md` (Operations)** — owns rider shift
  scheduling, delivery assignment, and payout rules for the same account
  Identity defines as `role=rider`. Any feature that needs "which orders is
  this rider currently assigned" or "what is this rider's payout" belongs
  to Operations, not Identity, even though "is this account a rider and is
  it active" is answered here.
- **`.claude/domain/commerce.md` (Commerce)** — owns the order history
  displayed against a customer's account. Identity supplies the account/
  profile identity (`role=customer`, contact info, active status); Commerce
  supplies and aggregates the orders themselves.
- **`Backend/src/api/v1/admin/auth/`** — the real login implementation
  (`controller.ts`, `service.ts`, `schema.ts`, `errors.ts`, `dto.ts`,
  `routes.ts`).
- **`Backend/src/api/v1/admin/users/`** — the real admin user-management
  implementation (`controller.ts`, `service.ts`, `repository.ts`,
  `model.ts`, `schema.ts`, `dto.ts`, `mapper.ts`, `routes.ts`).
- **`Backend/AGENTS.md`** — the target backend architecture (feature-first
  modules, `controller → service → repository → model` layering, DTOs,
  mappers, the custom error hierarchy including `ConflictError`) that
  `auth/` and `users/` already largely follow, and that any future
  `roles/`/`permissions/` modules (already reserved in the target folder
  structure listed there) must also follow.
- **`Frontend/src/lib/axios.ts`** — the shared client whose response
  interceptor is the real mechanism handling session expiry (401 → forced
  redirect to `/login`).
- **`.claude/domain/module-registry.md`** — tracks Auth and Users as
  **Built** (Users backend-only, no frontend consumer yet), and Roles &
  Permissions as **Planned**.

## Explicit Non-Responsibilities

- **Rider shift scheduling, delivery assignment, payout computation** —
  Operations. Identity stops at "this account exists, holds `role=rider`,
  and is active."
- **Customer order history, cart, checkout** — Commerce. Identity stops at
  "this account exists, holds `role=customer`, and is active."
- **Verifying that code actually enforces an authorization rule (IDOR
  checks, privilege-escalation testing, token-forgery resistance)** — the
  Security Engineer role. Identity defines the rule; it does not audit or
  test the implementation.
- **Store/vendor identity, delivery-zone definitions** — Operations.
- **Notification delivery, feature flags, platform settings** — Platform,
  even though those features will need to know a user's identity/role to
  target or gate on.

## Future Growth Considerations

- **Roles & Permissions is a real gap, not just an unbuilt nav page.**
  `Frontend/src/config/nav.ts` already lists "Roles & Permissions" (with
  `roles` and `systemUsers` sub-items) as a planned sidebar module,
  entirely separate from the three-value enum already shipped in
  `Backend/src/shared/enums/user-role.enum.ts`. Today, authorization is
  "does this account's fixed role match one of the roles this route
  allows" — there is no admin-configurable permission matrix. When this
  module is actually designed (a Software Architect decision, not
  prescribed here), it will need to resolve:
  - **Granularity**: per-permission flags (e.g. `products:manage`,
    `users:manage`) versus continuing to gate purely on role name.
  - **Role composition**: can an account hold more than one role, or do
    additional capabilities get layered onto the existing single-role
    model instead of replacing it?
  - **Resource scoping**: whether a permission can be scoped to a subset of
    resources (e.g. "manage products but not users," or "manage users but
    only riders, not other super_admins") rather than being all-or-nothing
    per role.
  - **Backward compatibility**: the existing `requireRole(UserRole.
    SUPER_ADMIN)` guards used throughout `users/routes.ts` and any future
    admin routes must have a clear migration path if/when finer-grained
    permissions replace or augment simple role checks.
- **No refresh-token / revocation model.** The current stateless-JWT design
  has no way to invalidate a token before its natural expiry (e.g. on
  forced logout, password change, or role/active-status change). A future
  iteration may need server-side session tracking (a token
  denylist/allowlist, or shorter-lived access tokens paired with a refresh
  token) if immediate revocation becomes a business requirement.
- **Self-service registration for customers.** Today there is no public
  signup path for any role — even customer accounts must be created by a
  super_admin via the admin Users API. If a customer-facing storefront is
  ever built, Identity will need to decide whether customer self-
  registration is introduced (and if so, what verification — email/OTP —
  gates it) without weakening the deliberate "no public registration"
  stance for staff/admin/rider accounts.
- **Last-super_admin protection.** As flagged in Edge Cases, nothing
  today prevents deactivating the sole remaining super_admin. A safeguard
  (e.g. blocking self-deactivation, or requiring at least one other active
  super_admin to remain) is a real, currently-open item for whenever the
  Users module is revisited.
- **Duplicate-account conflict handling.** As flagged in Edge Cases, wiring
  Mongo's `E11000` duplicate-key error to the already-defined
  `ConflictError` (rather than falling through to a generic 500) is a
  small, concrete improvement to make the moment this module is next
  touched.

## Glossary

- **User** — any authenticatable account in the system, regardless of
  role; the single `UserModel` collection backs all three roles.
- **Role** — the fixed classification a User holds: `super_admin`,
  `rider`, or `customer`. Exactly one per user today.
- **super_admin** — the platform-operator role; the only role permitted to
  manage other user accounts.
- **Rider** — a user with `role=rider`; the account/identity Identity
  owns, distinct from the shift/assignment/payout data Operations attaches
  to that same account.
- **Customer** — a user with `role=customer`; the account/profile Identity
  owns, distinct from the order history Commerce attaches to that same
  account.
- **JWT (access token)** — the signed bearer token issued at login,
  embedding `{ id, role }`, expiring per `JWT_EXPIRES_IN` (default 7 days).
- **Session cookie** — the `httpOnly` cookie holding only display fields
  (`id`, `name`, `email`, `role`) for frontend UI use; not the bearer
  token itself.
- **Access-token cookie** — the separate `httpOnly` cookie holding the
  actual JWT, never exposed to client-side JavaScript.
- **isActive** — the boolean account-lifecycle flag; `false` blocks login
  even with correct credentials, via `AccountDisabledError`.
- **ConflictError** — the shared 409 error class
  (`Backend/src/shared/errors/conflict.error.ts`) intended for duplicate-
  resource situations; defined but not yet wired to the Users module's
  duplicate email/phone case (see Edge Cases).

## References

- `.claude/domain/operations.md` — rider shift scheduling, delivery
  assignment, payout rules for the `role=rider` account Identity defines.
- `.claude/domain/commerce.md` — customer order history displayed against
  the `role=customer` account Identity defines.
- `Backend/src/api/v1/admin/auth/` — real login implementation
  (`controller.ts`, `service.ts`, `schema.ts`, `errors.ts`, `dto.ts`,
  `routes.ts`).
- `Backend/src/api/v1/admin/users/` — real admin user-management
  implementation (`controller.ts`, `service.ts`, `repository.ts`,
  `model.ts`, `schema.ts`, `dto.ts`, `mapper.ts`, `routes.ts`).
- `Backend/AGENTS.md` — target backend architecture, layering, and custom
  error hierarchy (including `ConflictError`) that this domain's real code
  already largely follows.
- `Frontend/src/lib/axios.ts` — shared API client; its response
  interceptor is the real mechanism for handling 401/session-expiry by
  redirecting to `/login`.
- `.claude/domain/module-registry.md` — authoritative status tracker;
  lists Auth and Users as **Built** and Roles & Permissions as **Planned**.
- `Backend/src/scripts/seed-admin.ts` — the only way to create the first
  account in a fresh database; documents the deliberate "no public
  registration" business rule in its own header comment.
- `Backend/src/shared/enums/user-role.enum.ts` — the authoritative,
  current definition of the three roles.
- `Frontend/src/config/nav.ts` — sidebar navigation source, including the
  planned "Roles & Permissions" group (`roles`, `systemUsers`).
