# Workflow: Bug Fix

## Trigger

A reported bug — either surfaced by the Testing Engineer during another
workflow's review phase, or reported directly by the human — per
`.claude/templates/bug-report.template.md`.

## Participants

Whichever Engineering agent owns the affected layer (Backend Engineer,
Frontend Engineer, Database Engineer, as applicable — determined by the
bug's Scope field) → Testing Engineer → Security Engineer (only if the bug
is security-relevant) → Code Review Engineer → Documentation Engineer
(only if the fix reveals a business-rule gap or architecture
inconsistency).

## Execution Order

1. **Root cause diagnosis** by the owning Engineering agent — fills in the
   bug report's Root Cause field. Never proceeds to a fix without this;
   "unknown, patched around it" is not an acceptable diagnosis.
2. If diagnosis reveals the bug is actually a missing/incorrect business
   rule (not a code defect) — escalate back to the relevant Business
   Expert before writing a fix, since the "fix" might be a rule decision,
   not a code change.
3. **Fix** by the owning Engineering agent, addressing the root cause
   specifically — filling in the bug report's Fix field with why this
   addresses the cause, not just the one reproduction path.
4. **Testing Engineer** verifies the fix against the original reproduction
   steps AND checks the Regression Risk field's other potentially-affected
   paths.
5. **Security Engineer** joins only if the bug's Scope or root cause
   touches auth/authz/input validation/data exposure.
6. **Code Review Engineer** reviews the fix diff.
7. **Documentation Engineer** — only if the root cause was a genuine
   business-rule gap (update the relevant domain doc) or the fix reveals
   an architecture pattern that should be documented (update `AGENTS.md`
   or write an ADR if it's precedent-setting). Most bug fixes need none of
   this — don't force a documentation step where nothing changed.

## Parallel Execution Rules

- Steps 4 through 6 can run in parallel once the fix exists, same as the
  review-lens pattern in Build Feature — Testing, Security (when
  applicable), and Code Review are independent lenses over the same fix.
- Steps 1 through 3 are strictly sequential — diagnosis must precede the
  fix, and the fix must address what diagnosis actually found.

## Inputs

A bug report per `.claude/templates/bug-report.template.md`, or enough
information from the human/Testing Engineer to construct one before
proceeding.

## Outputs

A fix addressing the diagnosed root cause, verified against both the
original reproduction and its regression-risk scope, reviewed, and
documented only where the fix actually changed something worth recording.

## Completion Criteria

The original reproduction steps no longer reproduce the bug, the
regression-risk scope was re-verified (not just the one originally-reported
path), Code Review found nothing further, and — per `CLAUDE.md`'s standing
principle of root cause over workaround — the bug report's Root Cause field
is filled in with an actual mechanism, not a symptom description.
