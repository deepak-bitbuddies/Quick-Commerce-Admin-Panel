# Inventory Domain

## Purpose

Inventory answers one question for every product, at every store, at every
moment: **how many can we actually sell right now, from here?** On a
10-minute quick-commerce platform that question is answered in seconds, not
overnight batch jobs — a customer opening the app sees "out of stock" as a
direct, real-time reflection of what this domain tracks. Inventory exists to
make that number correct under concurrent load, explain how it changed
(sale, transfer, adjustment, receipt), and prevent the platform from selling
what a dark store does not physically have.

This is not warehousing. Dark stores hold small, shallow stock (tens to low
hundreds of units per SKU, not pallets), restock multiple times a day rather
than weekly, and carry perishables whose shelf life is measured in days.
Every rule in this document is shaped by that reality, not by traditional
e-commerce/warehouse inventory patterns.

## Ownership

Inventory owns **stock at a store** — the quantity facet of the Store
entity. It does not own the store as a place. Concretely:

- Inventory owns: how many units of product X exist at store Y right now,
  how that number got there or left, and whether it's safe to promise a
  unit to a customer.
- Operations owns: where store Y is, its service radius, its staffing, and
  its relationship with vendors as logistics/commercial partners (see
  `.claude/domain/operations.md`).

Same `storeId`, two non-overlapping facets. Any feature that reads "is this
store open / can it deliver here" is Operations; any feature that reads "is
there stock here" is Inventory.

## Responsibilities

- Real-time stock levels per product per store (the atomic counter that
  order placement decrements).
- Stock reservations that hold inventory against an in-progress cart/
  checkout so it isn't oversold before payment completes.
- Transfers of stock between two stores (inter-store rebalancing).
- Manual adjustments to stock (damage, expiry write-off, cycle-count
  corrections) with a reason code and audit trail.
- Purchase orders: the restocking documents raised against a vendor,
  their expected quantities, and reconciliation against what's actually
  received.
- The historical ledger of all stock movement (sale decrements, transfer
  in/out, adjustments, PO receipts) needed to explain "why is stock at this
  number."

## Business Concepts

**Stock** — the sellable quantity of one product at one store. This is the
single most latency-sensitive number on the platform: it's read on every
product listing/PDP and written on every order placement. It is intentionally
*not* modeled as one authoritative slow-changing record; see Entities below
for the two-tier model this platform uses.

**Transfers** — moving stock from one store to another (rebalancing a dark
store that's overstocked on an item against one that's about to run out).
A transfer is a paired debit/credit across two `storeId`s for the same
product and must never let stock exist in neither, or both, store at once.

**Adjustments** — manual, non-order corrections to stock: damage, expiry
write-offs, breakage, cycle-count reconciliation (physical count doesn't
match system count). Always signed (+/-), always carries a reason code,
never silent.

**Purchase Orders (POs)** — the restocking mechanism: an order raised against
a vendor for a store, with expected quantities per product and an expected/
committed delivery window. Receiving a PO is where external vendor supply
becomes Inventory's own stock record. The vendor itself (who they are, the
commercial terms, which stores they supply) is Operations' entity — Inventory
only references a `vendorId` on the PO, it does not define what a vendor is.

**Stock Reservations** — the mechanism that prevents overselling in the gap
between "customer adds to cart / begins checkout" and "payment confirmed,
order placed." A reservation soft-holds N units of a product at a store,
subtracted from what's shown as available but not yet a completed sale. This
is the domain's most quick-commerce-specific concept: because checkout is
meant to complete in seconds and delivery in minutes, reservations must be
short-lived and self-expiring, unlike a traditional e-commerce "add to cart"
which can sit for days.

## Entities

- **StockRecord** — `{ storeId, productId, availableQty, reservedQty }`.
  `availableQty` is the fast-moving, real-time figure. Modeled as the
  atomic Redis counter (see Business Rules) rather than a MongoDB document
  read on every request — MongoDB may hold a periodically-synced snapshot
  for reporting/query convenience, but the counter is the source of truth
  for "can this be sold right now."
- **StockReservation** — `{ reservationId, storeId, productId, qty,
  cartOrOrderId, createdAt, expiresAt, status: active|committed|released }`.
  Short-lived by design.
- **StockTransfer** — `{ transferId, productId, fromStoreId, toStoreId, qty,
  status: initiated|in-transit|completed|cancelled, initiatedBy, timestamps
  }`.
- **StockAdjustment** — `{ adjustmentId, storeId, productId, deltaQty,
  reasonCode: damage|expiry|miscount|other, note, adjustedBy, createdAt }`.
- **PurchaseOrder** — `{ poId, storeId, vendorId, lines: [{ productId,
  expectedQty, receivedQty }], status: draft|placed|partially-received|
  received|reconciled|cancelled, expectedDeliveryAt }`. `vendorId` is a
  foreign reference into Operations' Vendor entity, not owned here.
- **StockMovementLedgerEntry** — append-only audit row `{ storeId,
  productId, deltaQty, movementType: sale|transfer-in|transfer-out|
  adjustment|po-receipt|reservation-release, refId, actorId, timestamp }`,
  the record that lets any stock number be explained after the fact.

## Relationships

- **Product (Catalog)** — Stock, reservations, transfers, adjustments, and
  PO lines all key off `productId`, but Inventory never defines what a
  product *is* (name, category, brand, attributes, unit of measure, base
  MRP) — that's `.claude/domain/catalog.md`. Inventory only ever stores a
  reference ID and a quantity/unit consistent with Catalog's definition.
- **Store (Operations)** — every entity here keys off `storeId`, but
  Inventory never defines the store's location, service radius, staffing,
  or hours. See the Store seam called out in Ownership above and repeated
  in Dependencies.
- **Vendor (Operations)** — Purchase Orders reference `vendorId`. The
  vendor's identity, commercial terms, and relationship to a store are
  Operations' facts; Inventory only tracks what was ordered and received.
- **Cart / Checkout / Order (Commerce)** — a Stock Reservation is created
  when checkout begins and is consumed (committed to a real decrement) or
  released back to available stock depending on how checkout ends. Order
  placement is the event that turns a reservation into a permanent stock
  decrement recorded in the movement ledger. See
  `.claude/domain/commerce.md`.
- **Analytics** — fill rate, stockout rate, shrinkage (from adjustments),
  and PO reconciliation accuracy are cross-domain KPIs Analytics may
  report on, but Analytics does not redefine what "in stock" means — it
  reads Inventory's numbers as-is.

## Business Rules

- **Atomic per-store, per-product counters are the mechanism, not just a
  convenience.** The real-time available quantity lives in Redis, keyed by
  `inventoryKey(storeId, productId)` (`Backend/src/core/cache/redis.ts`,
  format `inventory:{storeId}:{productId}`) and is decremented with an
  atomic Redis operation (e.g. `DECRBY`/Lua) at order placement, not read-
  then-written from application code. MongoDB holds the slower-moving,
  query/report-friendly records — Purchase Orders, Transfers, Adjustments,
  the movement ledger — and may hold a synced snapshot of stock for
  listing/search, but the Redis counter is authoritative for "can this be
  sold right now."
- **Stock must never go negative.** Two simultaneous orders for the last
  unit of a product must not both succeed. The atomic decrement operation
  must check-and-decrement in one indivisible step (Lua script or `DECRBY`
  with a post-check-and-compensating-increment pattern), never a
  read-quantity-then-write-quantity round trip from application code —
  that round trip is exactly the race window that oversells the last unit.
- **A reservation must expire quickly if checkout doesn't complete.**
  Because a 10-minute delivery promise implies a checkout flow measured in
  seconds to low minutes, a reservation's TTL should be short (order of
  minutes, not the hours/days reasonable for traditional e-commerce cart
  holds). An expired, uncommitted reservation must release its held
  quantity back to `availableQty` automatically — a stuck reservation is a
  phantom stockout indistinguishable from real unavailability to the
  customer.
- **Reservation lifecycle is a state machine, not a flag.** `active` →
  `committed` (order placed, becomes a permanent ledger decrement) or
  `active` → `released` (expired or checkout abandoned/failed). A
  reservation must never be committed after it has already expired/been
  released, and never double-committed.
- **Transfers must be atomic across both stores.** Decrementing the source
  store's stock and incrementing the destination's must happen as a single
  transaction (or an equivalent compensating-transaction saga if the two
  legs cross data stores/services). A transfer that decrements the source
  but fails before incrementing the destination has destroyed stock;
  incrementing the destination before confirming the source decrement
  creates phantom stock that exists in two places at once — both are
  correctness bugs this domain must design against.
- **Adjustments always carry a reason code and are always audited.** No
  adjustment is a silent quantity edit; every adjustment writes a
  `StockAdjustment` record and a corresponding `StockMovementLedgerEntry`
  attributing who changed what, by how much, and why.
- **PO receipt reconciles against expected quantities.** Receiving a PO
  compares `receivedQty` against each line's `expectedQty` per product;
  discrepancies (short-shipped, over-shipped, damaged-on-arrival) must be
  flagged, not silently accepted as the new stock figure, so shrinkage and
  vendor reliability can be tracked (an Analytics/Operations concern fed by
  this domain's data, not decided by it).
- **Perishables should use FEFO, not FIFO.** Given the grocery/perishable
  mix typical of quick commerce, stock depletion logic (and in particular
  what a transfer or a sale draws down first, when a product has multiple
  receipt batches with different expiry dates) should prefer First-Expiry-
  First-Out over First-In-First-Out where batch/expiry tracking exists.
  This is a deliberate deviation from generic inventory FIFO assumptions
  and matters directly for shrinkage (expired stock adjusted off) and
  customer-facing freshness.
- **Restocking cadence is frequent, not periodic.** Because dark stores
  restock multiple times a day rather than on a weekly cycle, Purchase
  Orders and their reconciliation need to support high-frequency, small-
  batch POs per store rather than assuming large infrequent warehouse
  replenishment cycles.

## Validations

- `availableQty` and `reservedQty` must be non-negative integers (or the
  smallest valid unit per Catalog's unit-of-measure for that product) at
  all times; no operation may leave either field negative.
- A reservation's `qty` must not exceed current `availableQty` at the time
  it is created — reservation creation is itself a check-and-hold, not a
  check followed by a separate hold.
- A transfer's `qty` must not exceed the source store's `availableQty`
  (minus anything already reserved there) at initiation.
- Every `StockAdjustment` requires a non-empty `reasonCode` from a closed
  enum (damage, expiry, miscount, other) — free-text-only adjustments are
  not permitted.
- A PO's line `receivedQty` is validated against `expectedQty` at receipt
  time; a mismatch beyond a configurable tolerance must be flagged rather
  than silently reconciled.
- `storeId` and `productId` on every entity here must reference real,
  existing Store (Operations) and Product (Catalog) records — Inventory
  validates the reference exists, not what it means.

## Edge Cases

- **Two customers check out the last unit simultaneously.** Only one
  reservation/decrement may succeed; the other must fail fast with a
  clear "just went out of stock" response, not an oversold order.
- **A reservation's checkout never completes (app closed, payment
  abandoned) and it isn't explicitly released.** The TTL-based auto-expiry
  must reclaim the stock; without it, popular items would appear
  progressively "more out of stock" than they truly are over the course of
  a day (reservation leakage).
- **A transfer is initiated but the destination store goes offline/
  unreachable mid-transfer.** The source decrement must not be treated as
  final until the destination increment is confirmed — otherwise stock is
  simply lost from the system, not just misallocated.
- **A PO is partially received** (say, 80 of 100 units arrived, the rest
  is backordered). Status must reflect `partially-received`, stock is
  credited only for what actually arrived, and the shortfall must remain
  visible for follow-up rather than being marked `received`.
- **Perishable stock crosses its expiry date while still logged as
  available.** This must surface as a required adjustment (expiry
  write-off), not be left to silently oversell an expired item — a
  correctness and food-safety concern specific to grocery quick commerce.
- **Adjustment or transfer requested for a `storeId`/`productId` pair with
  no existing StockRecord.** Must fail with a clear not-found rather than
  implicitly creating a zero-then-modified record, since an unexpected
  first-touch usually indicates a bad reference, not a legitimate new
  stock line.
- **Redis counter and MongoDB snapshot disagree** (e.g. after a cache
  flush, failover, or missed sync). Redis remains authoritative for
  sell-through decisions; any reconciliation job must treat MongoDB as the
  thing to correct, not the reverse, and any material drift should be
  logged as an incident, not silently overwritten.

## Dependencies

- **Catalog** (`.claude/domain/catalog.md`) — for what a product is, its
  unit of measure, and whether it's currently sellable at all (active/
  approved). Inventory consumes `productId` as given; it does not define
  product attributes.
- **Operations** (`.claude/domain/operations.md`) — for the Store entity's
  physical/logistics facet (location, service radius, staffing) and for
  Vendor identity/commercial terms referenced on Purchase Orders. This is
  the domain's primary shared-entity seam (see Domain Registry) — Inventory
  must never define store location or vendor relationship terms, only
  reference their IDs.
- **Commerce** (`.claude/domain/commerce.md`) — checkout is the consumer of
  Stock Reservations; order placement is the event that triggers the
  atomic decrement. Inventory does not own checkout flow, payment, or
  order lifecycle — only the stock-side effect of it.
- **Redis** (`Backend/src/core/cache/redis.ts`) — the real, already-built
  mechanism this domain's real-time stock model depends on:
  `inventoryKey(storeId, productId)` builds the atomic-counter key; the
  same module's `homepageCacheKey(storeId)` is a reminder that store-scoped
  Redis keys are an established pattern here, not a new one Inventory would
  be introducing.
- **Backend architecture conventions** (`Backend/AGENTS.md`) — the target
  folder structure already reserves `Backend/src/api/v1/admin/inventory/`
  as a first-class module (controller/service/repository/model/dto/mapper/
  routes), consistent with every other domain module. Rule 25's call for
  "transactions for complex write operations wherever applicable" applies
  directly to transfers and reservation-commit paths.

## Explicit Non-Responsibilities

- Store location, service radius, staffing, opening hours, or vendor
  commercial relationship — Operations.
- What a product is (name, category, brand, attributes, base MRP) —
  Catalog.
- Cart contents, checkout flow, payment, final price/tax computation,
  order lifecycle after placement, returns/refunds — Commerce.
- Coupons, promotions, or any discount eligibility that might influence
  what a customer chooses to buy — Marketing.
- Rider assignment/scheduling or delivery execution once an order is
  placed — Operations.
- User accounts/roles/permissions of whoever performs an adjustment or
  approves a PO — Identity (Inventory records *who*, as an actor ID, but
  does not define what that identity or its permissions are).

## Future Growth Considerations

- **No Inventory backend module exists yet.** There is no
  `Backend/src/api/v1/admin/inventory/` directory today (only the target
  structure in `Backend/AGENTS.md` reserves the slot) — this domain is
  entirely at the planning stage in terms of real implementation.
- **No frontend surface exists yet either.** `Frontend/src/config/nav.ts`
  has no Stock/Inventory/Warehouse section — not under `stores`, not
  elsewhere. The `stores` nav group (`Frontend/src/config/nav.ts`) only
  covers Operations' facet (`/stores`, `/stores/reviews`) today. When
  Inventory's UI is built, expect a new nav group or new items nested under
  a store's detail view (stock levels, transfers, adjustments, POs), not a
  reuse of the existing `stores` items.
- As real stock volume grows, the Redis-counter-plus-Mongo-ledger split
  should be revisited for whether a periodic reconciliation job (Redis
  truth → Mongo snapshot) is sufficient, or whether Mongo change streams /
  outbox pattern are needed to keep the ledger perfectly consistent with
  the counters under partial failures.
- Batch/lot-level expiry tracking (needed for real FEFO) is not yet
  modeled — today's Entities section describes quantity-only stock; a
  batch dimension (`{ batchId, expiryDate, qty }` under each StockRecord)
  is a likely near-term addition once perishables handling matures beyond
  a manual adjustment-based write-off.
- Multi-store reservation logic (e.g., a customer's address maps to more
  than one serviceable dark store) is not addressed here and would need
  explicit rules on which store's stock is reserved, likely resolved
  jointly with Operations' delivery-zone logic.

## Glossary

- **SKU** — a distinct sellable product/variant, tracked as `productId`
  here (owned by Catalog).
- **Dark store** — a small, delivery-only local store holding shallow
  stock, restocked multiple times daily; the unit of "where" for every
  Inventory record.
- **Reservation** — a short-lived hold on stock during checkout, preventing
  oversell before an order is confirmed.
- **FEFO** — First-Expiry-First-Out; depletion strategy prioritizing
  soonest-to-expire stock, relevant wherever batch/expiry data exists.
- **FIFO** — First-In-First-Out; the generic warehousing default this
  domain deliberately overrides for perishables.
- **Shrinkage** — stock lost to damage, expiry, theft, or miscount,
  recorded via Adjustments.
- **PO (Purchase Order)** — a restocking request against a vendor for a
  store, with expected quantities to reconcile at receipt.
- **Fill rate** — the proportion of demand actually met from stock without
  a stockout; an Analytics KPI computed from this domain's data.

## References

- `.claude/domain/catalog.md` — product identity, attributes, base MRP.
- `.claude/domain/operations.md` — store as a place, vendor identity and
  terms.
- `.claude/domain/commerce.md` — checkout flow that creates and consumes
  Stock Reservations, order placement that triggers the atomic decrement.
- `Backend/src/core/cache/redis.ts` — the real, existing
  `inventoryKey(storeId, productId)` and `homepageCacheKey(storeId)` helpers
  this domain's real-time model is built on.
- `Backend/AGENTS.md` — target backend architecture, including the
  reserved (not yet built) `api/v1/admin/inventory/` module and the
  transaction/repository/DTO conventions any Inventory module must follow.
- `.claude/domain/module-registry.md` — current build status of every
  module, including Inventory's "Planned" status on the `Stores` row.
- `.claude/domain/domain-registry.md` — the Store shared-entity seam
  between Inventory and Operations, stated at charter level.
