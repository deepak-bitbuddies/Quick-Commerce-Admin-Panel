# Workflow: Release

The gate before shipping a batch of completed feature/fix work — distinct
from the per-change review in Code Review; this is a whole-batch,
pre-deployment sign-off.

## Trigger

A set of completed, individually-reviewed features/fixes is ready to ship
together (however "shipping" is defined for this project at its current
stage — a deploy, a version tag, or a merge to a release branch).

## Participants

Documentation Engineer → Testing Engineer → Security Engineer → the human
(final sign-off — this workflow never self-approves; ADR-0002 and
`CLAUDE.md` both establish that consequential, hard-to-reverse steps go
through explicit human approval, and shipping is exactly that kind of
step).

## Execution Order

1. **Documentation Engineer** consolidates what's in this release: confirms
   the Module Registry reflects every module's real current status,
   confirms every ADR that should exist for this batch's decisions does,
   and drafts a changelog/release note from the actual diffs — not from
   memory of what was planned.
2. **Testing Engineer** runs a full regression pass across everything in
   the release, not just each feature's own original verification — a
   feature that passed its own review in isolation can still interact
   badly with another feature in the same release.
3. **Security Engineer** does a final pass over the full release diff,
   specifically looking for anything that individually-reviewed features
   might have missed in combination (e.g. two features each individually
   fine that together create a new permission gap).
4. **Human sign-off** — present the consolidated changelog, regression
   results, and security pass. This step is never skipped or automated
   away, regardless of how clean the prior steps came back.

## Parallel Execution Rules

Steps 1 through 3 can run in parallel — each is an independent
whole-release pass with no dependency on the others' output. Step 4 is
always last and always sequential, gated on all three completing.

## Inputs

Every feature/fix intended for this release, each already individually
reviewed via its own workflow (Build Feature, Bug Fix, etc.).

## Outputs

A release-ready, consolidated changelog; a confirmed-clean (or
explicitly-flagged) regression pass; a confirmed-clean (or
explicitly-flagged) combined-security pass; and explicit human approval.

## Completion Criteria

All three automated passes (documentation consolidation, regression,
security) are complete and their findings are either clean or explicitly
accepted by the human, and the human has explicitly signed off — this
workflow's output is never "ready" without that explicit approval, no
matter how clean everything upstream looks.
