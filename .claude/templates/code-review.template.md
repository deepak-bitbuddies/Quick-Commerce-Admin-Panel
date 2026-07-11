# Code Review — Template

Produced by: the Code Review Engineer, against a finished diff (runs in
parallel with Testing/Security/Performance — the same diff, a different
lens: correctness, simplification, reuse, efficiency).

---

## Scope

*(What diff/files this review covers.)*

## Findings

*(Most severe first. Each finding:)*

- **File / line:**
- **Category:** correctness | simplification | reuse | efficiency
- **Summary:** *(one sentence — the defect, not a description of the code)*
- **Concrete failure scenario:** *(what input/state produces the wrong
  output or crash — a finding without a reproducible scenario is a
  preference, not a defect)*
- **Verdict:** confirmed | plausible (if adversarially checked)

## Not flagged (and why)

*(Anything that looks like it could be a finding but was deliberately
excluded — e.g. "the duplicated validation logic in X and Y looks
repetitive but matches the existing pattern in Z; flagging would introduce
a second convention rather than fix one.")*

## Overall verdict

*(Ready to merge / needs changes before merge / needs changes but
non-blocking — matches whatever this feature's Definition of Done in
`CLAUDE.md` requires.)*
