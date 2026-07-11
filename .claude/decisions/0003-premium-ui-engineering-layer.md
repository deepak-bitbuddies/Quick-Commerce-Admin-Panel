# ADR-0003: Introduce a Premium UI Engineering layer, replacing the UI/UX Engineer

- **Status:** Accepted
- **Date:** 2026-07-11
- **Related:** ADR-0002 (supersedes its "UI/UX Engineer" role definition and
  its mention in the Build Feature / CRUD Module workflows), `CLAUDE.md`,
  `.claude/agents/premium-ui-engineer.md`

## Context

ADR-0002 established a UI/UX Engineer role with real, detailed standards
(reuse-first component discipline, token-only styling, mandatory loading/
empty/error states, responsive/accessibility rules). In practice this was
still too generic for a project explicitly targeting a premium SaaS visual
bar: it didn't commit to a single icon library, didn't mandate a
shadcn-install-first discipline for missing primitives, had no motion
standard, and had no shared, reusable reference material for common
interface patterns (a dashboard, a CRUD module, a data table, a form) —
meaning every feature re-derived these patterns from first principles
instead of building from an established one.

This is a Framework v1.1.1 enhancement: strengthening the frontend
presentation layer of the already-frozen v1.1 architecture, not a
redesign. Everything outside the UI/UX role and its immediate collaborators
is unchanged.

## Decision

1. **The UI/UX Engineer role is replaced by the Premium UI Engineer**
   (`.claude/agents/premium-ui-engineer.md`). Same position in the pipeline
   (between Product Spec Engineer and Frontend Engineer, parallel with
   Database/Backend Engineer), same "never writes business logic" boundary,
   same "final authority on presentation" relationship to Frontend
   Engineer — but with substantially more explicit, opinionated standards:
   - **Shadcn/ui first, install before inventing** — the real component
     inventory (`Frontend/src/components/ui/`) has only 10 primitives
     today (`button`, `card`, `collapsible`, `dropdown-menu`, `field`,
     `input`, `label`, `separator`, `sonner`, `tooltip`); every missing
     primitive (table, dialog, sheet, badge, skeleton, tabs, select, etc.)
     is installed via the shadcn CLI before any custom UI is built.
   - **Phosphor Icons only**, with an explicit, real gotcha documented:
     `Frontend/components.json` declares `"iconLibrary": "lucide"` even
     though the codebase exclusively uses `@phosphor-icons/react` — any
     freshly shadcn-installed component's default Lucide icons must be
     swapped to Phosphor before the component is done.
   - **Tokens only** (color, spacing, typography, radius, motion) —
     extending the prior rule with an explicit motion standard (subtle
     fade/slide/scale/hover/focus/shimmer only) and an honest note that no
     centralized motion tokens exist yet (ad hoc `duration-200
     ease-in-out` is the de facto standard until they do).
   - **A named visual bar**: Linear, Vercel, Stripe Dashboard, Notion,
     Raycast, Clerk — never a generic CRUD-generator look. This is now an
     explicit, checkable quality gate, not an implicit aspiration.
2. **A new UI Playbooks layer** (`.claude/ui/playbooks/`): reusable,
   concrete interface-pattern references — Dashboard, CRUD Module, Data
   Table, Form, Filter Bar, Detail Page, Settings Page, Drawer, Dialog,
   Authentication, Analytics, Multi-Step Wizard. Each defines layout,
   spacing, recommended components, interaction patterns, responsive
   behavior, accessibility, loading, error handling, and empty states. The
   Premium UI Engineer consults the matching playbook before designing a
   screen type rather than re-deriving the pattern per feature.
3. **A new UI Knowledge Packs layer** (`.claude/ui/knowledge/`): shared
   reference documents — `shadcn-ui.md`, `phosphor-icons.md`,
   `design-system.md`, `accessibility.md`, `responsive-design.md`,
   `animation-guidelines.md`. These are the canonical, single-source-of-
   truth references any frontend-adjacent agent reads before making a
   presentation decision.
4. **Frontend-adjacent engineering agents updated to collaborate with,
   not route around, the Premium UI Engineer**: Frontend Engineer's
   Escalation Rules and Anti-patterns now explicitly name "freelancing a
   UI decision" (picking an icon, inventing a state the spec didn't cover)
   as a defect to escalate rather than resolve independently. Software
   Architect, API Contract Engineer, Database Engineer, Backend Engineer,
   Product Spec Engineer, and the relevant Business Experts had their
   references to "UI/UX Engineer" updated to "Premium UI Engineer"
   throughout — a terminology change, not a boundary change, for all of
   these except Frontend Engineer.

## Consequences

- **Backward compatible with Framework v1.1.** The pipeline shape, the
  eleven-then-twelve engineering roles' boundaries (Software Architect,
  Product Spec Engineer, API Contract Engineer, Database Engineer, Backend
  Engineer, Frontend Engineer, Security/Performance/Testing/Code Review/
  Documentation Engineers), the eight Business Experts, the Module/Domain
  Registries, and the Dynamic Domain Evolution protocol are all unchanged.
  Only the former UI/UX Engineer's file was replaced, and only the files
  that named it were edited to reflect the rename plus the Frontend
  Engineer's strengthened deference language.
- **`ui-ux-engineer.md` is deleted, not archived** — there is exactly one
  agent responsible for presentation at any point in time; keeping a
  superseded duplicate around risks a future session invoking the wrong
  one. This ADR and `premium-ui-engineer.md`'s own text are the permanent
  record of what it replaced and why.
- Two real, previously undocumented codebase facts surfaced while writing
  this enhancement and are now recorded rather than silently worked
  around: (1) `Frontend/components.json`'s `iconLibrary: "lucide"` setting
  contradicts the project's exclusive real use of Phosphor — every future
  shadcn install must account for this; (2) no centralized motion-token
  system exists yet — ad hoc Tailwind transition utilities are the interim
  standard, with centralizing them flagged as a Future Growth item, not
  fixed in this pass (out of scope for a documentation-layer enhancement).
- The UI Playbooks and Knowledge Packs are new, reusable artifacts that
  reduce future per-feature design cost — the intended long-term payoff is
  that the tenth CRUD module built under this framework looks and behaves
  identically to the first, without either one requiring the Premium UI
  Engineer to re-derive the pattern from scratch.
