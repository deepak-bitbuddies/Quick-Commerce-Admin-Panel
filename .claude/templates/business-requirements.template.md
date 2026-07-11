# Business Requirements — Template

Produced by: a Business Expert agent (`.claude/agents/*-expert.md`).
Consumed by: the Product Spec Engineer. Never consumed directly by an
engineering agent — the Product Spec Engineer translates this into a
feature-level spec first.

---

## Request

*(One sentence: what was asked, verbatim or close to it.)*

## Domain(s) consulted

*(Which domain expert(s) produced this — one row per domain if multi-domain.)*

## Business concepts involved

*(Which entities from the domain doc's "Business Concepts"/"Entities"
sections this request touches. Link to the domain doc, don't restate its
content.)*

## Business rules that apply

*(Pulled from the domain doc's "Business Rules" and "Validations" sections
— only the ones relevant to this request, not the whole doc.)*

## Edge cases relevant to this request

*(Pulled from the domain doc's "Edge Cases" section, plus any new edge case
this specific request surfaces that isn't in the domain doc yet — flag new
ones explicitly so the Documentation Engineer can add them later.)*

## Constraints and dependencies

*(Other domains/modules this touches, per the domain doc's "Dependencies"
and "Explicit Non-Responsibilities" sections — this is how the Product Spec
Engineer knows where this domain's authority ends.)*

## New business rules established by this request

*(If answering this request required deciding something not already in the
domain doc — state it here explicitly. This is what the Documentation
Engineer appends to the domain doc, and what may warrant an ADR if it sets
a precedent beyond this one feature.)*

## Open questions for the human

*(Anything genuinely ambiguous that the domain expert cannot resolve alone
— escalate here rather than guessing. Per the domain expert's escalation
rules.)*
