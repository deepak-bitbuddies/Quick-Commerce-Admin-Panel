# Bug Report — Template

Used by: the Testing Engineer (found during verification) or as the intake
shape for the Bug Fix workflow (`.claude/workflows/bug-fix.md`) when a bug
is reported directly.

---

## Summary

*(One sentence — what's wrong.)*

## Steps to reproduce

*(Concrete, numbered, reproducible — "click X" not "sometimes fails.")*

## Expected behavior

*(What should have happened — reference the relevant Feature Design's
acceptance criteria if this is a regression against a spec, or the
relevant domain doc's business rule if it's a business-logic bug.)*

## Actual behavior

*(What actually happened — exact error message/response/screenshot
reference, not a paraphrase.)*

## Scope

*(Which module (per the Module Registry), which layer(s) — frontend,
backend, or both.)*

## Severity

*(Blocks a core flow / degrades a feature / cosmetic — drives whether this
triggers the full Bug Fix workflow or a direct small fix per `CLAUDE.md`'s
"scales down for small work" rule.)*

## Root cause

*(Filled in by whichever engineering agent diagnoses it — required before
a fix is attempted per this framework's "root cause vs workaround" bias;
do not fill in "unknown, patched around it.")*

## Fix

*(What changed, and why it addresses the root cause specifically —
including confirmation it doesn't just mask the symptom for this one
reproduction path.)*

## Regression risk

*(What else could this fix have touched — informs whether Code Review
and/or Testing re-run beyond just the originally reported path.)*
