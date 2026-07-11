# Analytics Domain

## Purpose

Analytics answers one question, and deliberately only one: **what does the
business look like when you combine what two or more other domains already
know?** GMV is a Commerce number reinterpreted over time. Dark-store fill
rate is a Commerce number divided by an Inventory number. Delivery SLA
compliance is a Commerce timestamp compared against an Operations promise.
Analytics does not generate new facts — it composes facts that already
exist elsewhere into metrics, dashboards, and reports that no single domain
could produce alone.

This is a narrow charter by design. On a 10-minute quick-commerce platform,
the temptation is to let "analytics" become a catch-all for anything with a
number or a chart. This document exists to resist that: if a request is
really about redefining what an Order, a Product, a Store, or a Rider *is*,
it belongs to the domain that owns that entity, not here. Analytics' value
is entirely in composition and interpretation across domain boundaries — the
moment it starts defining entity semantics, it has either duplicated another
expert's job or become the dumping ground the domain registry explicitly
avoided when this charter was scoped.

## Ownership

Analytics owns:

- The definition and formula of every cross-domain composed metric (GMV,
  AOV, repeat-purchase rate, fill rate, SLA compliance, campaign ROI, etc.)
  — i.e., *how the pieces are combined*, not what any one piece means.
- Reporting cadence: which metrics are near-real-time (operational
  dashboards) vs. daily/weekly/monthly (historical reports), and the
  freshness/latency contract for each.
- Dashboard composition and report structure: which metrics appear
  together, how they're segmented (per store, per zone, per period), and
  how time windows and comparisons (period-over-period, store-vs-store) are
  computed.
- Data-quality rules that are specific to *reporting* — e.g. how a
  retroactive return affects an already-published period's GMV — as
  opposed to data-quality rules for the underlying entity itself, which
  belong to the owning domain.

Analytics does not own, and must never claim:

- Any entity's core definition (Order, Product, Stock, Store, Rider,
  Customer, Coupon, Vendor) — see Explicit Non-Responsibilities.
- Any business rule that changes what happens inside another domain's
  workflow (e.g. Analytics cannot decide when a reservation expires, when a
  coupon is valid, or when an order is considered "delivered" — it only
  reads those outcomes and reports on them).

## Responsibilities

- Defining formulas for cross-domain KPIs and keeping those formulas
  consistent everywhere they're surfaced (dashboard tile, exported report,
  API response) so the same metric name never means two different
  computations in two different places.
- Specifying, per metric, which domain(s) supply the underlying data and at
  what granularity (order-level, store-level, daily aggregate, etc.).
- Defining reporting time windows and their boundary rules (see Business
  Rules) consistently across all metrics.
- Defining how dashboards handle partial/incomplete data — a store that
  opened mid-period, a day that hasn't finished yet, a return that arrived
  after a period closed.
- Specifying data freshness expectations per surface: which dashboards are
  expected to be near-real-time (operational, store-ops-facing) and which
  are acceptable as periodic/batch (historical, leadership-facing).
- Flagging, not resolving, apparent inconsistencies in source data (e.g. an
  order marked "delivered" in Commerce with no corresponding Operations
  delivery-completion event) back to the owning domain — Analytics surfaces
  the discrepancy, it does not adjudicate which system is right.

## Business Concepts

Each metric below is a composition. The formula is Analytics' to define;
every input named in parentheses is owned and defined by the domain listed
— Analytics consumes that domain's data as given and never redefines it.

- **GMV (Gross Merchandise Value)** — sum of completed order values over a
  period. Source: Commerce (order total, order status = completed/
  delivered — Commerce's definition of "completed" governs, not
  Analytics'). Analytics owns only the aggregation (sum) and the period
  boundary/adjustment rule (see Business Rules).
- **AOV (Average Order Value)** — GMV ÷ completed order count, same period,
  same store/zone scope. Source: Commerce for both numerator and
  denominator. Analytics owns the ratio and the scope it's sliced by (per
  store, per zone, platform-wide).
- **Repeat Purchase Rate** — (customers with 2+ completed orders in period)
  ÷ (total distinct customers with >=1 completed order in period). Sources:
  Commerce (order history, customer linkage on the order) + Identity
  (customer account identity, so returning "the same customer" is resolved
  against one identity, not a fuzzy name/phone match). Analytics owns the
  cohort window and the ratio only.
- **Dark Store Fill Rate** — (orders fully fulfilled without substitution
  or cancellation due to stockout) ÷ (total orders placed at that store) in
  period. Sources: Commerce (order outcome: fulfilled/substituted/
  cancelled, and the cancellation reason code) + Inventory (whether a
  stockout occurred at the time of the order, per
  `.claude/domain/inventory.md`'s stock/reservation model). Analytics never
  decides what counts as "in stock" — it reads Inventory's stockout signal
  and Commerce's order-outcome signal as given.
- **Delivery SLA Compliance** — (orders delivered within the promised
  delivery window) ÷ (total delivered orders) in period, typically sliced
  per delivery zone. Sources: Commerce (order placed/delivered timestamps)
  + Operations (the promised window itself — the delivery-zone SLA
  target and rider assignment/fulfillment timestamps, per
  `.claude/domain/operations.md`). Analytics owns only the compliance
  ratio and the zone-level rollup, not what the promised window is or how
  it's set.
- **Stockout Frequency** — count (or rate) of stockout events per store per
  period. Source: Inventory (stockout/reservation-failure events). Purely a
  read-through aggregation; Analytics adds no new stockout logic.
- **Campaign ROI / Conversion Lift** — (incremental GMV attributable to a
  campaign or coupon) relative to its cost, and/or (conversion rate for
  exposed customers) vs. (baseline conversion rate for a comparable
  unexposed cohort). Sources: Marketing (campaign/coupon definition,
  eligibility, cost/budget) + Commerce (orders and their values, whether a
  coupon was applied on a given order). Analytics owns the lift/ROI
  computation and the baseline-cohort methodology, not what a campaign is
  or who's eligible for it.
- **Rider/Delivery Fulfillment Rate** — (deliveries completed) ÷
  (deliveries assigned) in period, per rider or per zone. Sources:
  Operations (assignment and completion events) — read-through, no
  Analytics-owned logic beyond the ratio and grouping.
- **Customer Lifetime Value (directional, not accounting-grade)** —
  cumulative GMV per customer over their full order history to date.
  Sources: Commerce (order values) + Identity (customer identity for
  grouping). Analytics owns the aggregation window (to-date vs.
  trailing-N-days) only.

## Entities

Analytics does not own persistent business entities in the sense other
domains do (it has no Order, no StockRecord, no Vendor). Its "entities" are
reporting artifacts, and even these should be treated as derived/read
models, not sources of truth:

- **MetricDefinition** — `{ metricKey, name, formula description, source
  domains, granularity, refreshCadence }`. The versioned specification of a
  composed metric (this document is the human-readable form of it; a real
  implementation would likely also need this as config/code, not just
  prose, so the formula can't silently drift between a dashboard tile and
  an exported report).
- **DashboardView** — a named grouping of metrics for a given audience
  (e.g. "Dark Store Ops Dashboard," "Executive GMV Summary"), with a
  defined refresh cadence and default time window/scope.
- **ReportSnapshot** — a materialized, point-in-time computation of one or
  more metrics for a fixed period, used for historical/exported reports so
  that a report generated today for "last month" doesn't silently change if
  underlying data (e.g. a late-arriving return) is adjusted later — see the
  as-of rule in Business Rules.

These are metadata/derived-data constructs only. The moment a proposed
"Analytics entity" actually describes real business state (e.g. "the order
itself," "the stock count") it does not belong here — it is another
domain's entity being read, not a new entity Analytics owns.

## Relationships

- **Commerce** (`.claude/domain/commerce.md`) — the single largest data
  source for Analytics: order totals, order status/outcome, cancellation
  reasons, returns/refunds, order timestamps. Nearly every revenue-facing
  metric (GMV, AOV, repeat-purchase rate, campaign ROI) reads Commerce data
  as its primary input.
- **Inventory** (`.claude/domain/inventory.md`) — stockout signals,
  reservation-failure events, and shrinkage/adjustment data feed fill rate,
  stockout frequency, and shrinkage reporting. Analytics never redefines
  "in stock."
- **Operations** (`.claude/domain/operations.md`) — delivery-zone SLA
  targets, rider assignment/completion events, and store-open/service-area
  data feed SLA compliance and fulfillment-rate metrics. Analytics never
  redefines the promised delivery window or what counts as "delivered" at
  the logistics level.
- **Marketing** (`.claude/domain/marketing.md`) — campaign/coupon
  definitions, eligibility, and budget feed ROI/conversion-lift metrics.
  Analytics never decides what a campaign is or who qualifies for a
  discount.
- **Identity** (`.claude/domain/identity.md`) — customer account identity
  is the join key that lets Analytics say "the same customer" across
  multiple orders for repeat-purchase rate and lifetime-value metrics.
  Analytics never owns authentication, roles, or account state.
- **Catalog** (`.claude/domain/catalog.md`) — product/category/brand
  dimensions are used to slice metrics (e.g. GMV by category), but Catalog
  remains the sole owner of what a product or category is.
- **Platform** (`.claude/domain/platform.md`) — dashboard/report access may
  be gated by feature flags or notification hooks (e.g. alerting when a
  metric crosses a threshold) that are Platform's mechanism, not
  Analytics'; Analytics defines the threshold/metric, Platform defines how
  a notification is delivered.

## Business Rules

- **Time-window boundaries are fixed to one timezone and one cutoff rule,
  applied uniformly.** An order placed at 11:59pm must be attributed to
  exactly one reporting day, using the platform's canonical business
  timezone (not each dark store's local clock, unless the store network
  later spans multiple timezones — not the case today). Every metric that
  buckets by day/week/month must use the same cutoff instant Commerce
  itself timestamps the order at (typically order-placed time, not
  delivery time) — pick one moment consistently so a single order is never
  double-counted or dropped across adjacent buckets.
- **Retroactive returns/refunds do not rewrite an already-published
  period's GMV.** When a return is processed against an order from a prior,
  already-reported period, the original period's reported GMV figure is
  left as originally published (treated as a `ReportSnapshot`, immutable
  once a period closes). The refund is instead recorded as a adjustment
  entry attributed to the period *in which the return occurred*, shown as a
  distinct "returns/adjustments" line rather than silently reducing a
  number stakeholders already saw and acted on. Live/near-real-time
  dashboards for the *current, still-open* period are the exception: they
  may reflect returns as they happen, because the period hasn't closed yet.
- **A dark store that opened mid-period must not be penalized in
  cross-store ranking dashboards.** Per-store comparisons (fill rate, SLA
  compliance, GMV rank) must either (a) prorate/annualize the metric to a
  full-period equivalent, or (b) exclude stores open less than some
  minimum fraction of the period (e.g. under 50% of days) from ranked
  comparisons entirely, showing them separately as "new stores, insufficient
  data." A partial-period store must never appear simply as a low
  performer by virtue of having fewer days to accumulate volume.
- **Operational dashboards and historical reports have different
  freshness contracts, and both must be stated explicitly wherever a metric
  is shown.** Store-ops-facing, real-time-relevant metrics (current fill
  rate, live SLA compliance, active stockouts) should target near-real-time
  freshness (seconds-to-low-minutes lag), consistent with the 10-minute
  delivery promise these dashboards exist to protect. Leadership/historical
  reports (monthly GMV trend, repeat-purchase-rate trend) may run on a
  slower batch cadence (e.g. hourly or daily aggregation) — this is an
  acceptable and expected trade-off, not a defect, provided the report
  states its "as of" timestamp.
- **A metric's formula must be defined once and referenced everywhere it
  appears.** The same metric name (e.g. "GMV") must never be computed two
  different ways in two different dashboards/reports without an explicit,
  visible distinction in naming (e.g. "Net GMV" vs. "Gross GMV") — silent
  formula drift between surfaces is the single most damaging failure mode
  for a metrics-composition domain, since it destroys trust in every number
  it touches.
- **Denominators must be scoped identically to numerators.** Any ratio
  metric (fill rate, SLA compliance, repeat-purchase rate) must define its
  denominator's population using the same period/store/zone scope as its
  numerator — e.g. fill rate's denominator is "orders placed at store X in
  period P," not "orders placed anywhere," even when the numerator is
  correctly scoped.

## Validations

- Every `MetricDefinition` must name its source domain(s) explicitly; a
  metric with no traceable source-of-truth field per input is not a valid
  Analytics metric — it's either mis-scoped or missing a dependency.
- A `ReportSnapshot` must record the period, the generation timestamp
  ("as of"), and the metric version/formula it used, so a historical report
  can always be explained even after the underlying metric formula
  evolves.
- Cross-store or cross-period comparisons must record and expose the
  eligibility rule applied (e.g. minimum days-open threshold) rather than
  silently omitting stores/periods from a ranking with no visible reason.
- Any metric touching money (GMV, AOV, ROI) must state its currency and
  whether the figure is tax-inclusive or tax-exclusive, deferring to
  Commerce's definition of the underlying order total rather than
  recomputing tax treatment itself.

## Edge Cases

- **An order is placed in one period, delivered in the next, and later
  returned in a third.** Attribution must be decided once, consistently:
  GMV attributes to the order-placed period (per the time-window rule
  above); the return's adjustment attributes to the period the return
  occurred in, not retroactively to either prior period.
- **A store closes temporarily (maintenance, relicensing) mid-period.**
  Treat it the same as a late-opening store for ranking purposes — prorate
  or flag as insufficient-data for the affected period rather than showing
  a cratered fill rate/SLA number that reflects zero eligible volume, not
  poor performance.
- **A coupon-eligible order is cancelled before fulfillment.** Campaign
  ROI/conversion-lift figures must exclude cancelled orders from the
  "converted" numerator (per Commerce's cancellation status) even though
  the coupon was technically applied — Analytics reads Commerce's final
  order status, not the fact that a coupon was attached.
- **Two domains disagree on an outcome** — e.g. Commerce marks an order
  "delivered" but Operations has no matching delivery-completion event (or
  vice versa). Analytics must surface this as a data-quality flag/alert on
  the affected dashboard, not silently pick one source and compute as if
  there's no discrepancy; resolving *which system is authoritative* is not
  Analytics' call; it belongs to Commerce/Operations respectively for their
  own data.
- **A near-real-time dashboard metric and its later batch-reconciled
  counterpart disagree slightly** (e.g. a live fill-rate tile shows 92% but
  the next day's reconciled daily report shows 91.6%). This is expected
  given different freshness contracts and must be labeled as such (e.g.
  "live, provisional" vs. "reconciled, final"), not treated as a bug to
  silently paper over.
- **A brand-new dark store has zero completed orders on day one.** Ratio
  metrics (fill rate, SLA compliance, AOV) must render as "no data yet,"
  not as 0% or a divide-by-zero error, and must not drag down an
  aggregated platform-wide average as if it were a real zero.

## Dependencies

- **Commerce** (`.claude/domain/commerce.md`) — order totals, status,
  timestamps, returns/refunds; the primary revenue/transaction data source
  for nearly every metric in this document.
- **Inventory** (`.claude/domain/inventory.md`) — stockout and reservation
  data for fill rate and stockout-frequency metrics; shrinkage data
  (adjustments) for loss reporting.
- **Operations** (`.claude/domain/operations.md`) — delivery-zone SLA
  targets, rider assignment/completion events, store service-area and
  open/close state for SLA compliance, fulfillment rate, and partial-period
  store handling.
- **Marketing** (`.claude/domain/marketing.md`) — campaign/coupon
  definitions, eligibility, and cost/budget data for ROI and
  conversion-lift metrics.
- **Identity** (`.claude/domain/identity.md`) — customer account identity
  as the join key for repeat-purchase rate and customer lifetime value;
  admin roles/permissions gating who can view which dashboard/report.
- **Catalog** (`.claude/domain/catalog.md`) — product/category/brand
  dimensions used to slice and segment metrics.
- **Platform** (`.claude/domain/platform.md`) — feature flags that may gate
  dashboard rollout, and notification delivery for threshold-based alerts
  Analytics defines but does not deliver.
- **Backend architecture conventions** (`Backend/AGENTS.md`) — the target
  backend structure; no `Backend/src/api/v1/admin/analytics/` (or
  `reports/`, `dashboard/`) module exists yet — only `auth/` and `users/`
  are built under `Backend/src/api/v1/admin/` today. Any real Analytics
  backend work starts from scratch against those conventions, not from an
  existing partial implementation.
- **`.claude/domain/module-registry.md`** — current build status of every
  module; there is no Analytics/Reports row yet because no nav entry or
  backend module exists (see Future Growth Considerations).

## Explicit Non-Responsibilities

Given this domain's narrow, easily-scope-crept charter, these are stated
plainly and are not exhaustive by accident — they are exhaustive on
purpose:

- Analytics does not define what an **Order** is, its statuses, its
  pricing/tax computation, or its return/refund process — that is Commerce
  (`.claude/domain/commerce.md`).
- Analytics does not define what a **Product**, category, brand, attribute,
  unit, or MRP is — that is Catalog (`.claude/domain/catalog.md`).
- Analytics does not define what "in stock" means, how reservations work,
  or how transfers/adjustments/POs are processed — that is Inventory
  (`.claude/domain/inventory.md`).
- Analytics does not define what a **Store** is as a place, delivery zones,
  rider scheduling/assignment, or fulfillment mechanics — that is
  Operations (`.claude/domain/operations.md`).
- Analytics does not define coupons, offers, flash sales, campaigns, or
  promotion eligibility rules, nor does it apply discounts — that is
  Marketing (`.claude/domain/marketing.md`).
- Analytics does not define **Customer** or **Rider** accounts,
  authentication, roles, or permissions — that is Identity
  (`.claude/domain/identity.md`).
- Analytics does not define platform settings, notification delivery
  mechanics, integrations, or feature flags — that is Platform
  (`.claude/domain/platform.md`).
- Analytics does not decide any other domain's business rules (e.g. when a
  reservation expires, when a coupon is valid, when an order counts as
  "delivered") — it only reads the outcome of those rules as recorded by
  the owning domain and composes it into a metric.
- Analytics does not own a system-of-record database table for any core
  business entity — its only legitimate persisted artifacts are metric
  definitions, dashboard configuration, and report snapshots (derived data,
  not source-of-truth data).
- Analytics does not resolve cross-domain data disagreements (e.g. Commerce
  vs. Operations disagreeing on delivery completion) — it flags them for
  the owning domains to resolve.

## Future Growth Considerations

- **No Analytics/Dashboard/Reports backend module exists yet.** Nothing
  under `Backend/src/api/v1/admin/` today besides `auth/` and `users/`
  addresses metrics or reporting — this domain is entirely at the planning
  stage.
- **No dedicated Analytics/Reports sidebar section exists yet either.**
  `Frontend/src/config/nav.ts` has a `dashboard` ("Dashboard") and
  `posDashboard` ("POS Dashboard") item in the `overview` group today, but
  per `.claude/domain/module-registry.md` these are a composed/scaffold
  view and a Commerce (order-creation/POS) concern respectively — neither
  is a real cross-domain analytics dashboard yet. When Analytics gets a
  real frontend surface, expect a new nav group (e.g. "Analytics" or
  "Reports") rather than a repurposing of either existing item.
- As real metrics get built, each `MetricDefinition` should likely become
  actual versioned config or code (not just this document's prose) so a
  metric's formula can be diffed, tested, and referenced by an exact
  version from any dashboard or export — preventing the formula-drift
  failure mode called out in Business Rules.
- A real implementation will need to decide its aggregation architecture
  (e.g. scheduled batch jobs producing pre-aggregated collections vs.
  on-the-fly aggregation queries vs. a dedicated OLAP/warehouse layer) —
  out of scope for this document, which addresses business meaning, not
  data-pipeline architecture, but flagged here because the near-real-time
  vs. batch freshness split in Business Rules has direct architectural
  consequences.
- Alerting/threshold notifications on metrics (e.g. "notify ops lead when a
  store's fill rate drops below X%") will need to be co-designed with
  Platform's notification mechanism (`.claude/domain/platform.md`) once
  either domain builds real functionality.
- As the store network potentially spans multiple timezones, the
  single-canonical-timezone assumption in the time-window boundary rule
  above will need revisiting.

## Glossary

- **GMV** — Gross Merchandise Value; sum of completed order values over a
  period (Commerce-sourced).
- **AOV** — Average Order Value; GMV divided by completed order count.
- **Fill Rate** — proportion of orders fully fulfilled without
  substitution/cancellation due to stockout (Commerce + Inventory).
- **SLA Compliance** — proportion of orders delivered within the promised
  delivery window (Commerce + Operations).
- **Repeat Purchase Rate** — proportion of customers with 2+ orders in a
  period (Commerce + Identity).
- **Campaign ROI / Conversion Lift** — return or incremental conversion
  attributable to a Marketing campaign or coupon (Marketing + Commerce).
- **ReportSnapshot** — an immutable, point-in-time materialization of a
  metric for a closed period, used so historical reports don't silently
  change after the fact.
- **As-of** — the timestamp at which a report or snapshot was generated;
  required on every historical report so its freshness/staleness is
  explicit.
- **Near-real-time** — a freshness tier (seconds-to-low-minutes lag)
  appropriate for store-ops-facing operational dashboards.
- **Batch/periodic** — a freshness tier (hourly/daily or slower) acceptable
  for historical/leadership-facing reports.

## References

- `.claude/domain/commerce.md` — orders, checkout, returns/refunds, final
  pricing/tax; primary data source for revenue metrics.
- `.claude/domain/inventory.md` — stock, stockouts, reservations,
  adjustments; source for fill rate and shrinkage metrics.
- `.claude/domain/operations.md` — stores as places, delivery zones, rider
  scheduling, fulfillment; source for SLA and fulfillment metrics.
- `.claude/domain/marketing.md` — coupons, campaigns, promotions; source
  for ROI/conversion-lift metrics.
- `.claude/domain/identity.md` — customer/rider accounts and identity; join
  key for customer-level metrics.
- `.claude/domain/catalog.md` — products, categories, brands; dimensions
  used to slice metrics.
- `.claude/domain/platform.md` — feature flags and notification delivery
  that may gate or surface Analytics dashboards/alerts.
- `.claude/domain/domain-registry.md` — this domain's charter (row 7) and
  the platform's shared-entity seam list.
- `.claude/domain/module-registry.md` — current build status of every nav
  module; confirms no Analytics/Reports row exists yet.
- `Backend/AGENTS.md` — target backend architecture conventions any future
  Analytics module (e.g. `Backend/src/api/v1/admin/analytics/`) must
  follow.
- `Frontend/src/config/nav.ts` — current nav config; confirms `dashboard`
  and `posDashboard` are not yet real Analytics surfaces.
