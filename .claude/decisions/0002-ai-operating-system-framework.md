# ADR-0002: Adopt a multi-agent AI Operating System framework (v1.1)

- **Status:** Accepted
- **Date:** 2026-07-11
- **Related:** `CLAUDE.md`, `.claude/domain/domain-registry.md`, ADR-0001

## Context

ADR-0001 gave both sides of the codebase a documented target architecture,
but architecture rules alone don't decompose an ambiguous request like
"build the Product Module" into concrete work, don't retain business-rule
decisions across separate sessions, and don't prevent an AI assistant from
re-deriving the same judgment calls (module boundaries, response shapes,
error handling conventions) every time a new feature comes up. As the
platform is expected to grow into a full Quick Commerce system — hundreds
of APIs, dozens of business modules — the cost of *not* having a
standing operating model for how AI-assisted engineering work happens here
grows with every feature added.

## Decision

Adopt a layered framework, organized as an engineering organization rather
than a single monolithic rules file:

1. **Global Rules** (`CLAUDE.md`) — the constitution every agent inherits:
   the PM-by-default orchestration posture, the definition of done, the
   Module Registry lookup as step 0, and the Dynamic Domain Evolution
   protocol.
2. **Architecture** — unchanged from ADR-0001: `Frontend/AGENTS.md`,
   `Backend/AGENTS.md`.
3. **Domain Layer** (`.claude/domain/`) — a `domain-registry.md` (which
   business domains exist, their charters) and `module-registry.md` (which
   module maps to which domain expert), plus one living knowledge document
   per domain expert, read before every consultation and updated after
   every feature that establishes a new business rule.
4. **Business Expert agents** (`.claude/agents/*-expert.md`) — eight
   domain experts (Catalog, Inventory, Commerce, Marketing, Identity,
   Operations, Analytics, Platform) that answer "what should this feature
   do," consulted before any technical design begins. They never write
   production code — a permission boundary, not just an instruction.
5. **Product Spec Engineer** — a new phase between Business Experts and
   the Software Architect, translating general domain business rules into
   a concrete, feature-specific specification (user flows, screens,
   permissions, validation rules, edge cases, acceptance criteria,
   dependencies, notification triggers) before any technical architecture
   is decided.
6. **Engineering agents** (`.claude/agents/*.md`, non-expert) — Software
   Architect, API Contract Engineer, Database Engineer, Backend Engineer,
   Frontend Engineer, UI/UX Engineer, Security Engineer, Performance
   Engineer, Testing Engineer, Code Review Engineer, Documentation
   Engineer — answering "how," each with one non-overlapping
   responsibility.
7. **Workflows** (`.claude/workflows/`) — documented orchestration
   patterns (trigger, participants, execution order, parallel-execution
   rules, completion criteria) that turn the roles above into a
   repeatable sequence rather than ad hoc coordination each time.
8. **Templates** (`.claude/templates/`) — reusable output shapes so every
   agent's artifacts are structurally consistent regardless of which
   feature produced them.
9. **Decision Log** (`.claude/decisions/`) — this file and its successors;
   append-only, immutable once accepted, referenced (never duplicated) by
   the domain docs and architecture files whose current state they explain
   the origin of.
10. **Dynamic Domain Evolution** — the framework is explicitly designed to
    grow: a four-part fit rubric decides whether a request that matches no
    existing domain warrants a new one, gated by a mandatory human approval
    step, with the Domain Registry, Module Registry, and a new ADR updated
    together on approval.

**Skills are explicitly deferred.** The ergonomic slash-command layer that
would wrap a workflow into a single invocation is built only after the
architecture above has proven stable through real feature work — automating
a framework before it's exercised risks automating the wrong thing.

## Consequences

- Orchestration depth now scales to the request: a one-line fix skips the
  framework; a genuine new module runs the full pipeline (Module Registry
  lookup → relevant domain expert(s), parallel if multi-domain → Product
  Spec Engineer → Software Architect → API Contract Engineer →
  Database/Backend/UI-UX/Frontend Engineers, parallel where independent →
  Testing/Security/Performance/Code Review, parallel review lenses →
  Documentation Engineer, which updates `AGENTS.md`, the relevant domain
  doc(s), the Module Registry, and writes an ADR if a precedent was set).
- Business-rule knowledge compounds across sessions instead of being
  re-derived per conversation, because domain experts are required to read
  their own domain doc before answering and the Documentation Engineer is
  required to update it after a feature establishes something new.
- The number of domain experts is designed to stay roughly constant
  (currently eight) while the number of modules under them grows — this,
  not a headcount increase per feature, is the mechanism intended to make
  the framework scale to 100+ modules.
- New domains can be added without restructuring anything above the
  Domain Layer: a new agent file, a new domain doc, updated registry rows,
  and an ADR — zero changes required to the Software Architect, Product
  Spec Engineer, or any of the eleven engineering roles.
- This ADR itself establishes the precedent that adopting or changing the
  framework's own structure is ADR-worthy — future amendments to this
  operating model should be recorded the same way, not made silently.
