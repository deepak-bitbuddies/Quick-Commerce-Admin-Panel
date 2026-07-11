# Domain Registry

The directory of business domains this platform recognizes. This is the
first thing consulted whenever no existing domain seems to fit a new
request (Dynamic Domain Evolution, `CLAUDE.md`) — read in full, not
skimmed, before concluding "no fit." Each row is a domain's *charter*: what
it owns, at the level a new domain would need to clear to be considered
genuinely distinct from it. Module-level detail lives in
`module-registry.md`, not here.

This file is append-only in spirit: existing rows are refined as a domain's
charter is better understood, but a domain is never silently removed —
retirement/merger goes through an ADR, same as creation.

| # | Expert | Charter | Agent file | Domain doc | Established | Status |
|---|---|---|---|---|---|---|
| 1 | **Catalog** | What can be sold: products, categories, brands, attributes, units, tags, and their base pricing (MRP). Does not own final checkout price. | `.claude/agents/catalog-expert.md` | `.claude/domain/catalog.md` | ADR-0002 | Active |
| 2 | **Inventory** | What's in stock, where: stock levels *at* a store, transfers between stores, adjustments, purchase orders, reservations. Does not own the store as a physical/logistics entity. | `.claude/agents/inventory-expert.md` | `.claude/domain/inventory.md` | ADR-0002 | Active |
| 3 | **Commerce** | The commercial transaction: cart, checkout, orders, returns, refunds, final pricing/tax computation, and (for now) customer support tickets. Does not own delivery execution or promotion eligibility rules. | `.claude/agents/commerce-expert.md` | `.claude/domain/commerce.md` | ADR-0002 | Active |
| 4 | **Marketing** | What discounts/campaigns exist and who's eligible: coupons, offers, flash sales, campaigns, promotions, banners. Does not apply discounts at checkout — that's Commerce. | `.claude/agents/marketing-expert.md` | `.claude/domain/marketing.md` | ADR-0002 | Active |
| 5 | **Identity** | Who can act, and as what: authentication, user accounts, roles, permissions — including that "rider" and "customer" are user roles. Does not own rider scheduling/assignment or customer order history. | `.claude/agents/identity-expert.md` | `.claude/domain/identity.md` | ADR-0002 | Active |
| 6 | **Operations** | Getting goods to customers: vendors, stores as physical/logistics nodes, delivery zones, rider scheduling/assignment, fulfillment. Does not own stock levels or rider account rules. | `.claude/agents/operations-expert.md` | `.claude/domain/operations.md` | ADR-0002 | Active |
| 7 | **Analytics** | Cross-domain metrics and reporting: dashboards, KPIs, business metrics that combine multiple domains (GMV, fill rate, repeat-purchase rate). Never redefines what an underlying entity means — defers to the owning expert for that. | `.claude/agents/analytics-expert.md` | `.claude/domain/analytics.md` | ADR-0002 | Active |
| 8 | **Platform** | Platform-level *product* behavior: settings, notifications, integrations, feature flags. Not infrastructure/DevOps — a future infra role would need a distinctly named charter to avoid collision with this one. | `.claude/agents/platform-expert.md` | `.claude/domain/platform.md` | ADR-0002 | Active |

## Explicitly not a domain

Some things that sound like they need a domain expert are, deliberately,
engineering-owned instead — no business-rule ambiguity to resolve, just
implementation:

- **Cron Monitor, System Updates / deployment tooling** — operational
  tooling, not business domain. Routed directly to the Software Architect /
  Backend Engineer, no domain expert consulted.

## Known shared-entity seams (not overlaps — explicit splits)

These come up whenever a feature touches one of these entities; they are
resolved, not open questions:

- **Store**: Inventory owns "what's stocked here"; Operations owns "the
  place itself" (location, service radius, staffing, vendor relationship).
- **Rider**: Identity owns "a rider is a user with role=rider and these
  permissions"; Operations owns "shift scheduling, delivery assignment,
  payout rules."
- **Pricing/Tax**: Catalog owns base MRP; Commerce owns the final computed
  price (tax + active promotions applied on top).
- **Customers**: Identity owns the account/profile; Commerce is the source
  of truth for the order history shown against that profile.

## Adding a new domain

Only via the Dynamic Domain Evolution protocol in `CLAUDE.md` — never add a
row here without the fit rubric passing and explicit human approval, and
never without a corresponding ADR in `.claude/decisions/`.
