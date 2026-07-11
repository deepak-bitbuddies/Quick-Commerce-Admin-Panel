# Workflow: CRUD Module

A specialized, lighter variant of Build Feature for the common case of
implementing standard Create/Read/Update/Delete operations on a module —
either right after Add Module scaffolds it, or adding CRUD to a module that
already exists in some form. Skips the heavy Product Spec Engineer flow
analysis Build Feature does, since CRUD flows are standard, but still goes
through business-rule and contract design properly.

## Trigger

A request for standard list/create/read/update/delete/status-change
operations on an entity that already has (or is getting, via Add Module) a
settled business definition — not a request with complex multi-step user
flows, which belongs in Build Feature.

## Participants

Module Registry (lookup) → the owning Business Expert → Software Architect
→ API Contract Engineer → Database Engineer, Backend Engineer, Premium UI
Engineer, Frontend Engineer → Testing Engineer, Security Engineer, Code
Review Engineer → Documentation Engineer.

## Execution Order

1. **Module Registry lookup** — confirm the module and its owning domain
   expert.
2. **Business Expert** confirms field-level validation rules, uniqueness/
   integrity constraints, and permission rules (who can create/read/
   update/delete) for this entity — the CRUD-relevant subset of Business
   Requirements, not a full feature spec.
3. **Software Architect** confirms the module boundary and which existing
   pattern to mirror (`admin/users/`'s create/list/get/setStatus shape is
   the canonical CRUD reference).
4. **API Contract Engineer** writes `dto.ts`/`schema.ts` for
   create/list/get/update(-status) requests and responses, plus the
   mapper.
5. **Database Engineer, Backend Engineer, Premium UI Engineer, Frontend
   Engineer** build against the contract — a list view (with pagination
   per the established `meta` convention), a create form, a detail/edit
   view, and whatever status-change action applies.
6. **Testing Engineer, Security Engineer, Code Review Engineer** review
   the finished diff. (Performance Engineer joins only if the list
   endpoint's expected data volume or query pattern is non-trivial — most
   CRUD modules don't need it by default.)
7. **Documentation Engineer** updates the Module Registry status to
   `Built`, and the domain doc only if a new validation/permission rule
   was established.

## Parallel Execution Rules

- Step 5: Database Engineer, Backend Engineer, Premium UI Engineer run in
  parallel once the contract exists; Frontend Engineer follows once Premium UI
  and the contract are both ready — same dependency shape as Build
  Feature's step 6/7.
- Step 6: Testing/Security/Code Review run in parallel over the finished
  diff (Performance only when flagged as needed per Execution Order above).
- Steps 1 through 4 are strictly sequential.

## Inputs

A request for standard CRUD on a settled entity, or the natural next step
after Add Module scaffolds a module's skeleton.

## Outputs

A working create/list/get/update(-status) set of endpoints and UI, with
pagination on the list endpoint, following the `admin/users/` reference
shape exactly.

## Completion Criteria

Matches `CLAUDE.md`'s Definition of Done. Additionally: the list endpoint
supports `page`/`limit`/`search`/`sort`/`filters` per `Backend/AGENTS.md`'s
pagination rule, and every response goes through a mapper (no raw Mongo
document ever returned).
