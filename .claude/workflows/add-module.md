# Workflow: Add Module

A lighter variant of Build Feature for scaffolding an entirely new module
that doesn't yet exist in either codebase — establishing its structure and
registering it, rather than building out its full business behavior (that's
CRUD Module or Build Feature's job once the scaffold exists).

## Trigger

A request that needs a brand-new module created — the Module Registry has
no row for it (or has a `Planned` row with no code yet) — and the request
is primarily "stand this up correctly," not "design a complex new business
flow." If the request involves genuinely new user flows, screens, and
acceptance criteria beyond a standard module skeleton, use Build Feature
instead.

## Participants

Module Registry (lookup) → the owning Business Expert → Software Architect
→ Database Engineer, Backend Engineer, Frontend Engineer → Code Review
Engineer → Documentation Engineer.

## Execution Order

1. **Module Registry lookup** — confirm this is genuinely new (no existing
   module owns this), and confirm which domain expert owns it. No fitting
   domain → Dynamic Domain Evolution first.
2. **Business Expert** confirms the module's core business concepts/
   entities/rules at a foundational level (not a full feature-level
   spec — Product Spec Engineer is not in this workflow by default, since
   there's no complex user flow yet to specify).
3. **Software Architect** designs the module's skeleton: which files it
   needs per `Backend/AGENTS.md`'s module structure (controller/service/
   repository/routes/model/schema/dto/mapper/index.ts) and
   `Frontend/AGENTS.md`'s (api/components/hooks/pages/services/schema/
   types/constants/enums/utils/index.ts), following the canonical existing
   pattern (`Backend/src/api/v1/admin/users/`, `Frontend/src/modules/auth/`).
4. **Database Engineer, Backend Engineer, Frontend Engineer** scaffold the
   module's files — minimal, working skeleton (e.g. a basic model +
   empty-but-correct CRUD stubs), not yet the full business logic.
5. **Code Review Engineer** confirms the scaffold matches the established
   pattern exactly — no second way of structuring a module introduced.
6. **Documentation Engineer** adds the Module Registry row (status:
   Scaffolded), and only touches `AGENTS.md`/an ADR if this scaffold
   revealed a genuine architecture gap.

## Parallel Execution Rules

- Step 4: Database Engineer, Backend Engineer, and Frontend Engineer can
  scaffold in parallel once the Architect's skeleton design exists — a
  scaffold has no cross-dependency the way real business logic would.
- Everything else is sequential.

## Inputs

A request to stand up a new module, or a Dynamic Domain Evolution outcome
that just approved a new domain (which always needs at least one module
scaffolded under it).

## Outputs

A minimal, working, correctly-structured module skeleton on both sides
(where applicable), registered in the Module Registry as `Scaffolded`,
ready for CRUD Module or Build Feature to build real behavior into.

## Completion Criteria

Both sides typecheck clean, the skeleton exactly matches the canonical
existing module's file shape (no invented structure), and the Module
Registry reflects the new `Scaffolded` status.
