# API Design — Template

Produced by: the API Contract Engineer, consuming a Module Specification.
**The real deliverable is code, not this document** — `dto.ts` and
`schema.ts` in the relevant backend module, and the corresponding types the
frontend imports. This template is the *design note* that precedes writing
that code, kept only long enough to get Backend Engineer and Frontend
Engineer aligned before implementation — it is not a permanent artifact and
is not maintained after the contract ships (the code is the source of
truth from that point on).

---

## Endpoints

| Method | Path | Auth | Request DTO | Response DTO (inside `data`) | Status codes |
|---|---|---|---|---|---|
| | `/api/v1/admin/...` | requireAuth + requireRole(...) or public | | | 200/201/400/401/403/404/409 |

## Request DTOs

*(Field name, type, required/optional, validation rule — becomes `schema.ts`
zod definitions and `dto.ts` types.)*

## Response DTOs

*(Field name, type — what goes inside the envelope's `data`. Note which
existing mapper is being reused, e.g. `toUserResponseDto`, vs. a new one
being introduced and why an existing one didn't fit.)*

## Pagination / meta

*(If a list endpoint: what goes in `meta` — `total`, `page`, `pageSize`,
matching the existing convention in `admin/users/controller.ts`.)*

## Error cases

*(Which `AppError` subclass for which failure — reuse `ValidationError`/
`UnauthorizedError`/`ForbiddenError`/`NotFoundError`/`ConflictError` before
proposing a new error class.)*

## Frontend consumption

*(Which frontend service function(s) will call this, via `backendFetch` or
the client-side `api` axios instance — confirm this doesn't require a new
envelope-parsing pattern; it shouldn't.)*
