# Feature Design — Template

Produced by: the Product Spec Engineer. Consumed by: the Software Architect
only (never fanned out directly to engineering agents — the Architect is
the single node that translates product intent into a technical work
breakdown). Built from one or more Business Requirements artifacts.

---

## Feature

*(Name and one-sentence summary.)*

## User flows

*(Step-by-step: who does what, in what order, to accomplish the goal. One
flow per distinct path, including the unhappy paths that matter — e.g.
"admin attempts to deactivate the last remaining super_admin.")*

## Screens (conceptual)

*(What screens/views this needs, and what each one is for — NOT component
choices, layout, or visual design. "A paginated, filterable list of
products with an inline stock-status indicator" is correct; "a DataTable
with a Badge component" is the Premium UI Engineer's job, not this one.)*

## Permissions

*(Who can do what — reference Identity's role definitions from
`domain/identity.md` rather than inventing new role semantics here.)*

## Validation rules

*(User-facing validation — what the form/request must reject and why,
pulled from the relevant Business Requirements artifact(s).)*

## Edge cases

*(Carried forward from Business Requirements, plus any new ones this
specific feature's flows surface.)*

## Acceptance criteria

*(Testable, falsifiable statements — "Given X, when Y, then Z." These
become the Testing Engineer's test plan input directly; write them so a
test can be written against them without further interpretation.)*

## Dependencies

*(Other modules/features this depends on or blocks — cross-reference the
Module Registry.)*

## Notifications

*(What triggers a notification, to whom, through what channel — reference
`domain/platform.md` for existing notification conventions rather than
inventing new ones per feature.)*

## Out of scope

*(Explicitly what this feature does NOT cover, to prevent scope creep
during implementation — especially anything a reviewer might otherwise
assume was missed.)*
