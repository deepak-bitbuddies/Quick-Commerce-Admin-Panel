# Commerce Domain

## Purpose

Commerce owns the commercial transaction itself — the path from "a customer
has items they intend to buy" to "money has definitively changed hands, in
either direction." On a 10-minute quick-commerce platform this path is
compressed and time-critical: cart-to-order in seconds, dispatch within
minutes, and a delivery/return/refund cycle measured in hours, not the
days-long abandoned-cart and multi-day-shipping flows traditional e-commerce
domain models assume. This document is the standing reference for any agent
reasoning about cart, checkout, orders, returns, refunds, final pricing/tax,
or (for now) customer support tickets.

## Ownership

Commerce owns:

- **Cart** — the ephemeral pre-order collection of items a customer intends
  to buy.
- **Checkout** — the transition from cart to order: final price computation,
  payment capture, and consumption of a stock reservation.
- **Orders** — the durable record of a completed transaction and its
  lifecycle from placement through delivery to completion (or cancellation/
  failure).
- **Returns** — post-delivery requests to send items back, within a stated
  window.
- **Refunds** — the money-reversal side of a return, cancellation, or
  service failure.
- **Final pricing/tax computation** — the actual amount charged: Catalog's
  base MRP plus tax plus whatever promotions Marketing has marked active,
  computed and re-verified server-side.
- **Tax Rates** — the small config entity defining tax percentages and their
  applicability, kept with Commerce because it owns pricing/tax wholesale
  even though it's grouped under the "Catalog" heading in the sidebar (see
  Explicit Non-Responsibilities and References).
- **Support Tickets** — for now. A support ticket is, in this platform,
  almost always about an order, a return, or a refund, so it's folded into
  Commerce rather than split into its own domain. See Future Growth
  Considerations for when that stops being true.

## Responsibilities

- Compute the final price of an order: take Catalog's base MRP, apply
  whatever promotion(s) Marketing has marked eligible and active, apply the
  applicable Tax Rate, and produce the amount actually charged.
- Consume (not manage) a stock reservation from Inventory at checkout time,
  and release it if checkout fails or is abandoned.
- Own the full order status lifecycle and be the single writer of order
  status, even though Operations executes part of that lifecycle physically.
- Maintain the customer-facing order history shown against a customer's
  Identity-owned profile.
- Own the return window, return eligibility per item/order, and the refund
  amount and its reconciliation against the original payment.
- Own support ticket intake, status, and resolution, when the ticket
  concerns an order, return, or refund.
- Support both customer-app checkout and in-store/dark-store POS order
  creation (POS Dashboard) as two entry points into the same order model —
  they differ in how the order is created, not in what an order is once
  created.

## Business Concepts

- **Cart** — Pre-order. Ephemeral: it exists only until checkout completes,
  is abandoned, or expires. Holds product references (Catalog), quantities,
  and a store context (which dark store fulfills it — relevant for both
  Inventory reservation and Operations delivery-zone routing), but does not
  itself reserve stock or lock a price. Cart contents are advisory; nothing
  is guaranteed available or priced until checkout runs.
- **Checkout** — The pricing/payment/reservation-consuming transition from
  cart to order. This is the one moment where Commerce must synchronously
  coordinate with Inventory (reserve stock) and Marketing (resolve which
  promotions currently apply) before it can produce a final price and
  attempt payment capture. Checkout either succeeds atomically (order
  created, stock reserved, payment captured) or fails cleanly with nothing
  left half-done — no order should ever exist without a corresponding
  successful reservation and payment outcome. Given the 10-minute delivery
  promise, checkout is designed for minimum steps: saved addresses and
  saved payment methods are first-class, and there is no cart-abandonment
  nurture flow of the kind traditional e-commerce relies on — a stale cart
  is simply re-priced at next checkout attempt, not resurrected with
  reminder emails.
- **Orders** — The durable transaction record. Real status lifecycle:
  `placed → confirmed → dispatched → delivered → completed`, with
  `cancelled` and `failed` as terminal side-paths reachable from the
  pre-dispatch states (and `cancelled` reachable, under different rules,
  even post-dispatch — see Business Rules). `dispatched` is the explicit
  handoff point to Operations (see Relationships). An order also carries
  its origin (customer app vs. POS) and its payment status as a related
  but distinct piece of state (see payment-status note in Dependencies).
- **Returns** — Post-delivery only; an order cannot be "returned" before it
  reaches `delivered`. Time-windowed from the delivery timestamp, and
  scoped per line item, not only per order (a return can cover one item out
  of a multi-item order).
- **Refunds** — Tied to a payment reversal. A refund is not the same object
  as a return: a return is a physical/logistical event (item comes back or
  is confirmed unnecessary to return, e.g. damaged perishables); a refund is
  the financial event that may or may not require a completed return first
  (e.g. a missing-item refund needs no physical return at all). Refunds
  reconcile against the original payment method/transaction, not an
  arbitrary payout.
- **Support Tickets** — Tied to an order (and, transitively, to whatever
  return/refund that order has). Has its own status lifecycle, independent
  of order status and independent of refund status — e.g. a ticket can be
  `resolved` while its associated refund is still `processing`, or a
  refund can be `completed` while its ticket remains `open` pending
  customer confirmation. See `Backend/src/shared/enums/index.ts` — a
  `ticket-status.enum.ts` is explicitly anticipated as a peer to
  `order-status.enum.ts` and `payment-status.enum.ts`, confirming these are
  three distinct status axes, not one shared status field.
- **Tax Rates** — Configuration, not transactional data: a percentage plus
  applicability rules (which products/categories/regions it applies to).
  Read at checkout time to compute final price; not itself part of the
  order lifecycle.

## Entities

| Entity | Key attributes (conceptual) | Notes |
|---|---|---|
| Cart | customer/session ref, store ref, line items (product ref, qty), created/updated timestamps | Ephemeral; no locked price; no stock hold |
| Checkout (transaction) | cart ref, resolved price breakdown (MRP, promotions applied, tax, total), payment attempt ref, reservation ref | Not persisted as its own long-lived entity beyond the attempt — it *produces* an Order or fails |
| Order | order number, customer ref (Identity), store ref, line items with locked unit price at time of order, status, payment status, origin (app/POS), placed/confirmed/dispatched/delivered timestamps | Source of truth for order history against a customer profile |
| Order Line Item | product ref, qty, unit price at purchase, line total, per-item return eligibility state | Needed because returns/refunds can be partial |
| Return | order ref, one or more order line item refs, reason, requested timestamp, status, window-expiry check result | Cannot exist without a delivered order |
| Refund | order ref, return ref (optional — not all refunds require a return), amount, payment reversal ref, status | Status independent of return status |
| Support Ticket | order ref, subject/category, status, assigned agent, linked return/refund ref (optional) | Status independent of order/refund status |
| Tax Rate | percentage, applicability scope (product/category/region), active flag | Config entity, read at checkout |

## Relationships

- **Cart → Order**: one-directional, one-time transition via Checkout. A
  cart does not persist as history once converted; the Order is the
  historical record from that point forward.
- **Order → Return → Refund**: an Order can have zero or more Returns; each
  Return can have zero or one Refund initiated from it directly, but a
  Refund can also exist without a Return (e.g. refund for a missing item,
  refund for a cancellation before dispatch). Never model Refund as
  strictly a child of Return.
- **Order → Support Ticket**: an Order can have zero or more Support
  Tickets. A Support Ticket may reference a Return and/or a Refund but is
  not required to.
- **Order → Operations (handoff)**: once an order reaches `placed`/
  `confirmed`, Commerce hands off fulfillment to Operations at the
  `dispatched` transition — rider assignment, routing, ETA, and marking
  the order physically delivered are all Operations' responsibility.
  Control returns to Commerce the moment delivery is confirmed: that's
  what opens the return/refund window and moves the order to
  `delivered`/`completed`. Commerce owns the order record throughout; it
  never stops owning it, but it is not the writer of the
  `dispatched`-through-`delivered` physical status updates in isolation —
  those are reported by Operations and reflected onto the Order Commerce
  owns.
- **Order → Catalog**: line items reference Catalog products and lock in
  Catalog's base MRP at the moment of order placement — later MRP changes
  in Catalog never retroactively alter a placed order's price.
- **Order → Inventory**: checkout consumes a stock reservation Inventory
  provides; Commerce does not decide stock levels, only whether a
  reservation succeeded.
- **Order → Marketing**: final price incorporates whatever promotion(s)
  Marketing's rules deemed eligible at checkout time; Commerce applies,
  never defines, eligibility.
- **Order → Identity**: the customer ref on every Order points to an
  Identity-owned account; Commerce is the read/write owner of the order
  history rendered against that profile, not of the profile itself.

## Business Rules

1. **Server-side price is the only price.** The order total must be
   recomputed server-side at checkout regardless of what total the client
   submitted. A client-supplied price/total is never trusted or persisted
   as-is — it exists only for the client's own display purposes.
2. **Stock reservation can fail mid-checkout.** If a reserved item becomes
   unavailable between cart display and checkout completion (another
   concurrent order consumed the last unit, a store's stock was adjusted),
   checkout must fail that line item gracefully — surface it to the
   customer and either drop the item or block the whole checkout per
   product policy, but never silently substitute or silently proceed with
   a mismatched reservation. This requires a synchronous check against
   Inventory at checkout, not a cached availability figure from cart time.
3. **Cancellation policy differs before vs. after dispatch.** Pre-dispatch
   (`placed`/`confirmed`), cancellation is low-friction — stock reservation
   releases immediately, refund (if payment was captured) is close to
   automatic. Post-dispatch (`dispatched` or later), a rider has physically
   picked up the order: cancellation, if allowed at all, is a materially
   different flow (may require rider return trip, may not be eligible for
   full refund, may need Operations coordination to redirect or recall the
   rider). Never apply pre-dispatch cancellation rules to a dispatched
   order.
4. **Returns are only valid within a stated window after delivery.** The
   window is measured from the delivery timestamp (as reported via the
   Operations handoff), not from order placement. A return request outside
   the window is rejected outright regardless of reason, unless a separate
   goodwill/exception path is explicitly invoked (log this as an
   exception, don't silently extend the window).
5. **Partial refunds are a first-class case, not an edge case bolted on.**
   A multi-item order must support refunding/returning a subset of line
   items without touching the others — the Order Line Item is the unit of
   return/refund eligibility, not the Order as a whole.
6. **A support ticket never blocks a refund it isn't gating.** If a refund
   is otherwise valid and approved, an open, unrelated, or even related-but-
   informational support ticket must not prevent it from being processed.
   Ticket status and refund status are independent axes; only an explicit
   business rule tying a *specific* ticket type to a refund hold should
   block it, never ticket-existence alone.
7. **Duplicate order submission must be idempotent.** Double-tap on
   checkout, a network retry, or a client resubmission after a timeout
   must never create two orders (or capture payment twice) for the same
   checkout attempt. Checkout needs an idempotency key (or equivalent)
   spanning the payment-capture and order-creation steps together.
8. **Order total is locked at placement.** Once an order is placed, its
   line-item prices, applied promotions, and tax are frozen as of that
   moment — later changes to Catalog MRP, Marketing promotion rules, or
   Tax Rates never retroactively recompute an existing order.
9. **POS and app orders share one status lifecycle.** A POS-created order
   is still an Order with the same lifecycle and the same return/refund
   rules — POS is a different creation path, not a different order type
   with different rules, unless a specific rule explicitly says otherwise
   (e.g. a POS order might skip the `dispatched` state entirely for
   in-store pickup — treat that as a distinct, explicitly modeled path,
   not an ad hoc exception).

## Validations

- Cart line item quantity must be validated against a sane maximum per
  item/order at add-to-cart time, but this is advisory — the authoritative
  check is always Inventory's reservation at checkout.
- Checkout must reject if: cart is empty, any line item's product is no
  longer sellable in Catalog, the delivery address falls outside any
  Operations-served delivery zone, or the resolved payment method is
  invalid/expired.
- Return requests must validate: order is in `delivered` or `completed`
  status, the requested line item(s) belong to that order, requested
  quantity does not exceed originally ordered quantity minus any quantity
  already returned, and the request falls inside the return window.
- Refund amount must never exceed the amount actually captured for the
  order/line item(s) in question, net of any prior partial refund already
  issued against the same line item(s).
- Support ticket creation should validate the referenced order (and
  optional return/refund) actually exists and belongs to the requesting
  customer (or is being raised on their behalf by an authorized admin/
  support agent).
- Tax Rate applicability rules must resolve unambiguously per product/
  region at checkout time — if multiple rates could plausibly apply, that
  is a Tax Rate configuration defect to surface, not something checkout
  should silently pick one of.

## Edge Cases

- **Stock disappears mid-checkout** — see Business Rules #2; this is the
  single most common failure mode in a 10-minute delivery model where many
  concurrent carts compete for the same thin dark-store stock.
- **Double-tap / retried checkout** — see Business Rules #7; must not
  double-charge or double-create.
- **Cancellation after rider pickup** — see Business Rules #3; requires
  Operations coordination and a different refund calculation (may need to
  net out a partial fulfillment/dispatch cost depending on policy).
- **Partial refund on a multi-item order** — see Business Rules #5;
  refund math must reconcile against the specific line item(s), not a
  naive order-total proration unless that's the explicit policy.
- **Refund needed with no return possible** — e.g. item reported missing
  from a delivered order, or a perishable item not worth physically
  returning. A Refund must be creatable without a preceding Return.
- **Support ticket outlives its order's terminal state** — an order can be
  `completed` or `cancelled` while its support ticket is still `open`;
  ticket lifecycle must not assume it can only exist while the order is
  active.
- **Promotion becomes inactive between cart and checkout** — Marketing may
  end a flash sale or deactivate a coupon between when a customer viewed
  their cart and when they complete checkout; checkout must re-resolve
  eligibility at the moment of checkout, never trust a price a customer
  saw earlier in the session.
- **Tax Rate changes between cart view and checkout** — same principle:
  the rate applied is whatever is active at checkout time, not cart-view
  time.
- **Return window boundary timing** — a return request submitted at the
  exact edge of the window (e.g. a queued request that finally processes
  seconds after the window closes) needs a clear, consistently-applied
  cutoff rule (request-received timestamp vs. request-processed
  timestamp) rather than an implicit one.

## Dependencies

- **Catalog** (`.claude/domain/catalog.md`) — base MRP per product; product
  sellability at checkout time. Commerce locks this value in at order
  placement and never re-derives it later.
- **Inventory** (`.claude/domain/inventory.md`) — stock reservation
  consumed at checkout; Commerce triggers the reservation request and
  reacts to its success/failure, but never manages stock levels itself.
- **Marketing** (`.claude/domain/marketing.md`) — active promotion/coupon
  eligibility resolved at checkout time; Commerce applies whatever is
  handed back, never determines eligibility itself.
- **Operations** (`.claude/domain/operations.md`) — executes delivery after
  the `dispatched` handoff; reports delivery completion back to Commerce,
  which reopens the return/refund window.
- **Identity** (`.claude/domain/identity.md`) — owns the customer account/
  profile that every Order's customer reference points to; Commerce reads
  identity/profile data but never writes to it, and Identity never writes
  order history.
- **Payment status**: an order's payment state (captured/pending/failed/
  reversed) is closely tied to but conceptually distinct from order status
  — see `Backend/src/shared/enums/index.ts`, which anticipates a
  `payment-status.enum.ts` as its own enum, separate from
  `order-status.enum.ts`.

## Explicit Non-Responsibilities

- **Delivery execution** — rider assignment, routing, live tracking, ETA
  calculation, and marking an order physically delivered are Operations'
  responsibility (Dispatch Management module). Commerce owns the order
  record that reflects delivery completion, not the mechanism that
  produces it.
- **Promotion/coupon eligibility rules** — Marketing defines what
  promotions exist and who/what qualifies. Commerce only applies whatever
  is currently active and eligible; it never authors eligibility logic.
- **Base product pricing (MRP)** — owned by Catalog. Commerce only adds
  tax and promotions on top and locks the result at order time.
- **Stock levels and reservations logic** — owned by Inventory. Commerce
  consumes a reservation outcome; it does not decide how reservations are
  allocated or expired.
- **Customer account/profile management** — owned by Identity. Commerce
  reads the customer reference and writes order history against it, but
  registration, authentication, and profile edits are not Commerce's
  concern.
- **UI grouping is not domain ownership** — Tax Rates appears under the
  "Catalog" heading in `Frontend/src/config/nav.ts`'s sidebar for
  navigational convenience, but the rate *definition* belongs to Commerce,
  which owns pricing/tax wholesale (see `.claude/domain/module-registry.md`
  and the Domain Registry's shared-entity notes). Do not infer domain
  ownership from sidebar grouping anywhere in this codebase.

## Future Growth Considerations

- **Support Tickets splitting into their own domain.** Support tickets are
  folded into Commerce today because, on this platform, a ticket is almost
  always about an order/return/refund. This stops being true the moment
  support workflows grow their own bounded context: SLA timers independent
  of order state, multi-tier escalation, agent workload/routing, ticket
  categories unrelated to a specific order (account issues, app bugs,
  general complaints), or a dedicated support-agent role in Identity. When
  any of those appear, run Dynamic Domain Evolution to split out a
  Support domain — do not silently let Commerce's charter absorb
  escalation-tier logic that isn't about the transaction itself.
- **Payment as its own concern.** If payment methods, gateways, and
  reconciliation grow complex enough (multiple gateways, saved-instrument
  vaulting, settlement reporting, chargebacks), watch for that pulling
  away from "transaction" into its own bounded context — today it's
  folded into Commerce as "payment status on an order" plus "refund
  reverses a payment," which is adequate only while payment logic stays
  thin.
- **POS as a distinct sub-flow.** As POS Dashboard is built out, watch for
  POS-specific rules (in-store pickup skipping dispatch, cash handling,
  till reconciliation) accumulating enough distinct logic to warrant
  explicit sub-modeling within Commerce (not a new domain — it's still the
  same transaction, just a different creation/fulfillment path).
- **Tax Rate complexity.** If tax rules grow beyond a flat percentage per
  scope (multi-jurisdiction, tax-inclusive vs. exclusive pricing display,
  compounding rates), revisit whether Tax Rates need richer modeling
  before Catalog and Commerce disagree on displayed vs. charged price.

## Glossary

- **Cart** — ephemeral pre-order collection of intended line items.
- **Checkout** — the transition transaction from cart to order.
- **Order** — the durable record of a completed (or failed/cancelled)
  transaction, with its own status lifecycle.
- **Order Line Item** — a single product/quantity/price entry within an
  order; the unit of partial return/refund.
- **Return** — a post-delivery, time-windowed request to send item(s)
  back.
- **Refund** — the financial reversal of a payment, which may or may not
  be tied to a Return.
- **Support Ticket** — a customer-service case tied to an order, with its
  own independent status lifecycle.
- **Tax Rate** — a configured percentage plus applicability scope, applied
  at checkout.
- **Dispatch (handoff)** — the order-status transition point at which
  Operations takes over physical fulfillment.
- **POS (Point of Sale)** — in-store/dark-store order creation entry
  point, producing the same Order model as customer-app checkout.
- **MRP** — Maximum Retail Price; Catalog's base price, before tax/
  promotions.

## References

- `.claude/domain/catalog.md` — base MRP, product sellability.
- `.claude/domain/inventory.md` — stock reservation consumed at checkout.
- `.claude/domain/marketing.md` — promotion/coupon eligibility rules
  applied on top of MRP.
- `.claude/domain/operations.md` — delivery execution and the
  dispatch/delivery handoff.
- `.claude/domain/identity.md` — customer account/profile ownership.
- `Backend/src/shared/enums/index.ts` — the deferred-enums comment
  confirming `order-status.enum.ts`, `payment-status.enum.ts`, and
  `ticket-status.enum.ts` are anticipated, real, already-planned models in
  this codebase.
- `Backend/AGENTS.md` — target module structure and layering
  (controller/service/repository) that any future `orders/`, `carts/`,
  `returns/`, `refunds/`, `tax-rates/`, and `support-tickets/` modules
  under `Backend/src/api/v1/admin/` must follow.
- `.claude/domain/module-registry.md` — current status (Planned) of POS
  Dashboard, Orders, Return Requests, and Tax Rates.
- `.claude/domain/domain-registry.md` — Commerce's charter and the
  shared-entity seams with Catalog, Inventory, Marketing, Identity, and
  Operations.
