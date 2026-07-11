# Workflow: Code Review

The standalone version of Build Feature's parallel review-lens block —
usable whenever a diff needs reviewing outside the context of a full
feature pipeline (e.g. reviewing a manual change, an external contribution,
or re-reviewing after addressing findings).

## Trigger

Any existing diff that needs review before merge, independent of which
workflow (if any) produced it.

## Participants

Code Review Engineer, Security Engineer, Performance Engineer, Testing
Engineer — scaled to the diff's actual risk, per below.

## Execution Order

1. Determine which lenses actually apply to this diff's size/risk — not
   every diff needs all four:
   - **Code Review Engineer**: always.
   - **Security Engineer**: always if the diff touches auth, input
     handling, data exposure, or anything payment/PII-adjacent; otherwise
     at the reviewer's discretion for smaller diffs.
   - **Performance Engineer**: always if the diff touches a query pattern,
     list endpoint, or render-heavy frontend code; otherwise skip for
     e.g. a copy/label change.
   - **Testing Engineer**: always, unless the diff is genuinely
     untestable (e.g. a comment-only change) — verification is cheap
     relative to the cost of a regression, per `CLAUDE.md`'s Definition of
     Done.
2. Each selected lens reviews the same diff independently — no lens should
   read another's findings first, so findings aren't anchored on each
   other.
3. Findings are consolidated (most severe first, across all lenses) and
   presented together per `.claude/templates/code-review.template.md`'s
   shape.
4. If findings require changes, the owning Engineering agent addresses
   them, and only the specific changed files are re-reviewed by the lens
   that flagged them (not a full re-run of all four).

## Parallel Execution Rules

Every selected lens in step 2 runs in parallel — this is the canonical
adversarial/multi-lens review pattern this framework uses everywhere a
finished artifact needs independent verification (see also Build Feature's
step 8).

## Inputs

A diff (any size, any source workflow or none) and, where available, the
Feature Design/acceptance criteria it was meant to satisfy (so
Testing Engineer can trace findings back to intent rather than reviewing
in a vacuum).

## Outputs

A consolidated findings report across whichever lenses applied, ranked by
severity, each with a concrete failure scenario per the Code Review
template's shape — no finding without one.

## Completion Criteria

All selected lenses have reported (or explicitly found nothing), every
finding has a concrete failure scenario, and the diff is either approved,
approved-with-non-blocking-notes, or sent back for changes — never left in
an ambiguous "some feedback exists somewhere" state.
