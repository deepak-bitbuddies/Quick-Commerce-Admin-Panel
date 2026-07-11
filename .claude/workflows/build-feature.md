# Workflow: Build Feature

The canonical, full pipeline for genuine new feature work — the default
this framework is built around. Other workflows are lighter variants of
this one for narrower situations.

## Trigger

A feature request with real product/business shape — new user-facing
behavior, a new business flow, or anything the Project Manager judges isn't
covered by the lighter workflows (Add Module, CRUD Module, Bug Fix,
Refactor). Per `CLAUDE.md`'s scaling rule: if it's a one-line fix or a typo,
this workflow doesn't apply at all.

## Participants

Module Registry (lookup, not an agent) → one or more Business Experts
(`.claude/agents/*-expert.md`) → Product Spec Engineer → Software Architect
→ API Contract Engineer → Database Engineer, Backend Engineer, Premium UI
Engineer → Frontend Engineer → Testing Engineer, Security Engineer,
Performance Engineer, Code Review Engineer → Documentation Engineer.

## Execution Order

1. **Module Registry lookup** (`.claude/domain/module-registry.md`) —
   identify the owning domain expert(s). No match → run Dynamic Domain
   Evolution (`CLAUDE.md`) before continuing.
2. **Business Expert(s)** produce Business Requirements
   (`.claude/templates/business-requirements.template.md`).
3. **Product Spec Engineer** consumes those, produces a Feature
   Design (`.claude/templates/feature-design.template.md`).
4. **Software Architect** consumes the Feature Design, produces a
   Module Specification (`.claude/templates/module-specification.template.md`).
5. **API Contract Engineer** consumes the Module Specification, writes the
   real `dto.ts`/`schema.ts` (the contract is code, not a document).
6. **Database Engineer, Backend Engineer, Premium UI Engineer** build against
   the contract.
7. **Frontend Engineer** builds against the contract and the Premium UI
   Engineer's component/interaction spec.
8. **Testing Engineer, Security Engineer, Performance Engineer, Code
   Review Engineer** review the finished diff.
9. **Documentation Engineer** updates whatever actually changed:
   `AGENTS.md` (only if architecture changed), the relevant domain
   doc(s) (only if a new business rule was established), the Module
   Registry (status/new row), and an ADR (only if a precedent was set).

## Parallel Execution Rules

- Step 2: all relevant Business Experts run in parallel if the request
  spans multiple domains — never sequentially when there's no dependency
  between them.
- Step 6: Database Engineer, Backend Engineer, and Premium UI Engineer run in
  parallel — none of the three depends on either of the others' output,
  only on the API Contract Engineer's completed contract.
- Step 7 is sequential after step 6 (Frontend Engineer needs both the
  contract and the Premium UI Engineer's spec).
- Step 8: all four review lenses run in parallel over the same finished
  diff — this is a fan-out over one artifact, not a chain.
- Step 9 is always last and always sequential — Documentation Engineer
  documents what was *actually* built and reviewed, not a plan.
- Steps 1 through 5 are strictly sequential — each genuinely needs the
  prior step's output before it can begin.

## Inputs

The user's feature request, in whatever form the Project Manager received
it.

## Outputs

A working, reviewed feature: backend module (controller/service/
repository/routes/model/schema/dto/mapper), frontend module (api/
components/hooks/pages/services/schema/types), passing review across all
four lenses, and updated framework artifacts where applicable.

## Completion Criteria

Matches `CLAUDE.md`'s Definition of Done: both sides typecheck/lint clean,
the actual behavior was exercised (not just static analysis), the four
parallel review lenses ran and their findings are resolved or explicitly
accepted, and the Documentation Engineer's pass is complete (even if that
pass concludes "nothing needed updating" — that conclusion itself must be
explicit, not silently skipped).
