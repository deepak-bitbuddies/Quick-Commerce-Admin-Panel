# Workflow: Refactor

For structural/quality improvements with **no intended behavior change** —
distinguishes this from Build Feature (new behavior) and Bug Fix (broken
behavior). No Business Expert or Product Spec Engineer involvement, since
there's no business behavior in question.

## Trigger

A request to simplify, deduplicate, reorganize, or otherwise improve
existing code's structure/quality without changing what it does — e.g.
"this module has grown large, split it per `Backend/AGENTS.md`'s pluralized
folder convention," or "these three modules duplicate the same validation
logic, extract it to `shared/`."

## Participants

Software Architect → the owning Engineering agent(s) (Backend Engineer/
Frontend Engineer/Database Engineer, as applicable) → Testing Engineer →
Code Review Engineer → Documentation Engineer (only if `AGENTS.md`'s stated
pattern itself changes as a result).

## Execution Order

1. **Software Architect** confirms the current pattern, the target pattern,
   and that the target pattern doesn't invent a second way of doing
   something `AGENTS.md` already covers — a refactor introducing a new
   convention is itself a decision requiring the same rigor as adopting
   one in Build Feature, not something to slip in incidentally.
2. **Owning Engineering agent(s)** implement the refactor.
3. **Testing Engineer** verifies behavior is identical before and after —
   this is the load-bearing check for this workflow specifically: a
   refactor that changes observable behavior isn't a refactor, it's an
   undisclosed feature change or bug fix and should be re-routed to the
   correct workflow.
4. **Code Review Engineer** confirms the refactor actually achieved its
   stated simplification goal (per this framework's simplification/reuse/
   efficiency lens) and didn't just move complexity around.
5. **Documentation Engineer** updates `AGENTS.md` only if the refactor
   changed a stated architectural pattern (e.g. introduced the pluralized
   module-folder convention for the first time) — most refactors don't
   warrant this.

## Parallel Execution Rules

Largely sequential — a refactor's whole premise is a single, coherent
before/after comparison, so there's little to parallelize except when
multiple genuinely independent modules are being refactored identically
(e.g. the same duplication fix applied to three unrelated modules), in
which case those three implementations can proceed in parallel.

## Inputs

A specific, scoped refactor request — what's being simplified/reorganized
and why, ideally referencing a concrete `AGENTS.md` rule or Code Review
finding that motivated it.

## Outputs

Structurally improved code with identical external behavior, verified as
such.

## Completion Criteria

Testing Engineer confirms zero behavior change (this is the primary gate —
more important than for any other workflow, since "did it break anything"
is the entire risk of a refactor), Code Review confirms the simplification
goal was actually met, and `AGENTS.md` is updated only if a stated pattern
genuinely changed.
