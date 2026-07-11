# Operations Domain

## Purpose

Operations is the domain that gets goods that already exist in a store's
stock into a customer's hands within the 10-minute delivery promise. It
owns everything physical and logistical that sits between "order placed"
(Commerce) and "order delivered" (handed back to Commerce): who supplies a
store, where a store physically is and what it can reach, which rider is
moving right now, and which rider gets assigned to which order.

Operations does not decide *what* is stocked or *how much* (Inventory), does
not define what a rider *is* as an account (Identity), and does not own the
order transaction itself (Commerce). Operations is the execution layer that
turns a placed order into a completed handoff at the customer's door.

## Ownership

Operations owns:

- **Vendors** — the supplier relationship and contract terms that feed
  stock into stores.
- **Stores as physical/logistics nodes** — address, geo-coordinates,
  service radius, operating hours, staffing, and which vendor(s) supply
  them.
- **Delivery zones** — the geo-boundary a given store is responsible for
  serving.
- **Rider scheduling and assignment** — shifts, current zone assignment,
  live location, and which rider is dispatched to which order.
- **Fulfillment** — the dispatch process from "order ready at store" to
  "delivered," including reassignment and delivery-status tracking.

Operations does **not** own:

- Stock levels, transfers, adjustments, or the stock-received side of a
  purchase order (Inventory — see `.claude/domain/inventory.md`).
- The rider's account, login, or role/permission grant (Identity — see
  `.claude/domain/identity.md`).
- The order transaction, its pricing, or the return window it opens once
  delivered (Commerce — see `.claude/domain/commerce.md`).

## Responsibilities

- Maintain the vendor directory: onboarding, contract/commission terms,
  deactivation, and which stores a vendor supplies.
- Maintain the store-as-place record: location, geo-coordinates, service
  radius, operating hours, staffing roster, and which vendor(s) supply it.
  (The *contents* of that store — SKUs and quantities — belong to
  Inventory against the same store ID.)
- Define and maintain delivery zones per store, using real geo-distance
  computation rather than static labels, so a zone reflects an actual
  reachable radius from the store's coordinates.
- Track rider shift schedules, current zone assignment, and live location.
- Assign a ready order to the nearest available, on-shift rider within the
  order's store zone, and track that assignment through pickup, en-route,
  and delivered states.
- Reassign or escalate a delivery when the assigned rider goes offline,
  cancels, or fails to make progress.
- Compute rider payout inputs from completed deliveries (the payout *rule*
  is Operations'; the underlying "order marked complete" signal is consumed
  from Commerce, not owned here).
- Hand the order back to Commerce once delivered, so Commerce can open the
  return window — Operations does not manage returns itself.

## Business Concepts

- **Vendor** — a supplier who fulfills purchase orders for one or more
  stores. Operations owns the vendor entity, the relationship/contract, and
  onboarding/deactivation lifecycle. The moment a PO is placed against a
  vendor, the *stock-received* side of that PO (quantities, batches,
  received-into-stock events) is Inventory's, not Operations'. Operations
  answers "who do we buy from and on what terms"; Inventory answers "what
  arrived and how much do we now have."
- **Store** — the physical dark-store node. Operations owns location
  (address + geo-coordinates), service radius/zone, operating hours, and
  staffing. The same store document/ID is shared with Inventory, which owns
  what's stocked there — this is an explicit split on one entity, not two
  entities (see `.claude/domain/domain-registry.md`, "Known shared-entity
  seams").
- **Delivery Zone** — the geo-boundary a store is responsible for serving.
  Given the 10-minute promise, zones are small and hyper-local (a few
  kilometers around one dark store), not city-wide shipping regions. A
  zone is derived from the store's coordinates plus a service-radius
  distance check, which is exactly what `distanceInMeters` and
  `isValidCoordinate` in `Backend/src/shared/utils/geo.ts` exist to
  compute — an address is "in zone" when its haversine distance from the
  store's coordinates is within the store's configured radius. These
  helpers are present but currently unused by any route; delivery-zone
  matching is the intended, not yet wired, consumer.
- **Rider** — Identity owns the fact that a rider is a user with
  `role=rider` and whatever permissions that grants. Operations owns
  everything about what that rider is *doing*: current shift, current zone
  assignment, live location, and current order assignment. Live location is
  expected to be tracked in Redis under the `RIDER_LOCATIONS_KEY` key
  (`Backend/src/core/cache/redis.ts`) — the naming and the comment above it
  ("GEOADD telemetry") indicate a Redis geo-index (`GEOADD`/`GEOSEARCH`),
  not a plain key-value cache, is the anticipated mechanism for "who is
  nearest right now." This key is currently unused because Redis is
  disabled in local dev, but it fixes the intended architecture.
- **Dispatch / Fulfillment** — the process that takes a ready order and
  turns it into a completed delivery: candidate-rider selection (nearest
  available rider inside the order's store zone), assignment, live
  tracking en route, delivery confirmation, and handoff back to Commerce.
  `Backend/src/server.ts` explicitly defers Socket.io ("real-time rider
  tracking") alongside "the order/rider domains they serve," confirming
  that live dispatch tracking is meant to be pushed to the admin panel over
  WebSockets, not polled.

## Entities

- **Vendor**: id, name, contact info, contract/commission terms, supplied
  store IDs, status (active/deactivated).
- **Store**: id, name, address, geo-coordinates (`GeoPoint`/`GeoJsonPoint`
  shape per `Backend/src/shared/utils/geo.ts`), service radius, operating
  hours, staffing roster, assigned vendor(s), status. (Stock-at-store is a
  separate Inventory-owned aggregate keyed by the same store id.)
- **DeliveryZone**: id, store id, boundary definition (radius from store
  coordinates, or an explicit polygon if zones later become non-circular),
  status.
- **RiderAssignment** (Operations' view of a rider): rider id (foreign key
  into Identity's user record), current shift window, current zone/store
  assignment, current live coordinates, availability status
  (online/offline/on-delivery), current order assignment if any.
- **DispatchRecord**: order id (foreign key into Commerce's order),
  assigned rider id, store id, assignment timestamp, status (assigned →
  picked-up → en-route → delivered/failed), reassignment history.
- **PayoutLedgerEntry** (rule-level, not the money-movement itself):
  rider id, completed delivery count/ids, computed payout amount, period.

## Relationships

- Vendor → Store: one vendor can supply many stores; a store may have one
  or more vendors depending on category coverage.
- Store → DeliveryZone: one store has exactly one primary delivery zone
  (may extend to multiple sub-zones later, e.g. tiered ETAs by distance
  band).
- Store ↔ Inventory's stock aggregate: same store id, two owners, explicit
  split — never model as two separate store records.
- DeliveryZone → Order (via Commerce): a customer address resolves to a
  zone (and therefore a store) at checkout time; Operations supplies the
  "is this address servable, and by which store" answer, Commerce owns the
  order created against that answer.
- RiderAssignment → Identity's user record: one-to-one; Operations never
  duplicates auth/permission fields, only references the identity id.
- DispatchRecord → Order (via Commerce): one dispatch record per order,
  created only once Commerce marks the order ready for pickup.
- DispatchRecord → RiderAssignment: one active rider per dispatch record;
  reassignment creates a new linkage and closes out the old one with a
  reason code.

## Business Rules

1. **Nearest-available-rider assignment.** When an order becomes ready for
   dispatch, Operations selects the nearest currently-online rider whose
   current zone assignment matches (or overlaps) the order's store zone,
   using `distanceInMeters` between the rider's last known location
   (from `RIDER_LOCATIONS_KEY`) and the store/customer coordinates. This is
   a real-time, seconds-scale decision — not a batch route-planning job —
   consistent with the 10-minute delivery promise.
2. **A rider belongs to at most one active zone at a time.** A rider can be
   reassigned between zones between shifts, but cannot be simultaneously
   considered "available" for two stores' dispatch pools at once.
3. **Mid-delivery rider dropout requires reassignment, not just a status
   flag.** If an assigned rider goes offline, misses a progress checkpoint,
   or cancels after pickup, Operations must generate a new candidate
   assignment (or escalate to manual dispatch) rather than leaving the
   order stuck against a dead assignment.
4. **Zones should not silently overlap without a tie-breaker.** If two
   stores' service radii overlap for a given address, Operations needs a
   deterministic resolution rule (e.g., nearest store by distance, or
   explicit zone priority) — an address must never resolve to an
   ambiguous "which store serves this" answer at checkout time.
5. **An address outside all delivery zones cannot place an order against
   this platform's dark-store model.** Operations is the source of truth
   Commerce checks before allowing checkout to proceed for a given address.
6. **Rider payout is computed from completed deliveries only.** A
   dispatch record only counts toward payout once it reaches a
   Commerce-confirmed "delivered" state — Operations consumes that
   completion signal but does not redefine what "delivered/completed"
   means at the order level (that's Commerce's).
7. **Vendor deactivation must not orphan in-flight purchase orders.**
   Deactivating a vendor blocks new POs against it but must not silently
   cancel or strand POs already in flight; those need an explicit
   resolution path (fulfill, reassign to another vendor, or explicit
   cancellation) before the vendor record is fully retired.
8. **Store coordinates and radius must be valid before a zone is
   considered live.** A store cannot be turned into an active delivery
   zone with coordinates that fail `isValidCoordinate` or with no
   configured service radius.

## Validations

- Store `lat`/`lng` must satisfy `isValidCoordinate` (finite,
  -90..90/-180..180) before the store can be activated or a delivery zone
  derived from it.
- Delivery zone radius must be a positive, bounded value consistent with
  the 10-minute-delivery hyper-local model (reject radii that imply
  city-wide shipping zones as a data-entry error, not a valid config).
- A rider cannot be assigned to a dispatch record unless their current
  availability status is online and their current zone matches the order's
  store zone.
- A dispatch record cannot be created against a store that has no active
  delivery zone.
- Vendor contract/commission terms must be present before a vendor can be
  linked to a store as an active supplier.
- Rider shift windows must not overlap for the same rider (a rider cannot
  be scheduled into two concurrent shifts).

## Edge Cases

- **No rider available within zone.** Nearest-rider search comes back
  empty (all riders offline, on delivery, or out of range) — needs an
  explicit "no rider available" state distinct from a normal pending
  assignment, likely surfaced to store staff/dispatch ops for manual
  intervention.
- **Rider location is stale.** `RIDER_LOCATIONS_KEY` reflects last reported
  position, not guaranteed live; assignment logic needs a staleness
  threshold beyond which a rider is treated as unavailable rather than
  trusted at a stale coordinate.
- **Overlapping delivery zones from adjacent stores.** An address within
  both stores' radii needs a deterministic winner (see Business Rule 4) —
  otherwise two stores could both accept, or both reject, the same order.
- **Store deactivated mid-shift.** A store going offline (closed early,
  service suspended) while riders are actively assigned to its zone needs
  a graceful drain: in-flight dispatch records complete, but no new ones
  are created against that store's zone.
- **Vendor deactivated with open POs.** See Business Rule 7 — must not
  silently orphan stock already ordered but not yet received (that
  receipt event itself is Inventory's, but the vendor-side contract state
  is Operations').
- **Rider serving one store's zone vs. cross-zone delivery.** The default
  model is one rider per store's zone at a time; any future cross-zone or
  multi-store batching would be a deliberate architecture change, not an
  assumed capability today.
- **Redis unavailable.** Per `Backend/src/server.ts`, Redis and Socket.io
  are currently disabled in local dev — live-location-based assignment and
  real-time tracking degrade to "no live data" until that infrastructure is
  reintroduced; dispatch logic should not assume `RIDER_LOCATIONS_KEY` is
  always populated.

## Dependencies

- **Inventory** (`.claude/domain/inventory.md`) — Operations needs to know
  a store has stock ready to fulfill an order before dispatch is
  meaningful; Operations does not query or own stock levels directly, it
  consumes availability/readiness signals.
- **Identity** (`.claude/domain/identity.md`) — every rider assignment
  resolves to an Identity-owned user record with `role=rider`; Operations
  never re-implements authentication, roles, or permission checks.
- **Commerce** (`.claude/domain/commerce.md`) — the order transaction,
  "ready for dispatch" trigger, and "delivered" completion signal all
  originate from Commerce; Operations executes delivery in between and
  hands control back once delivered so Commerce can open the return
  window.
- **Platform** — notifications to riders/customers about dispatch status
  are Platform's delivery mechanism (Operations decides *what* event fired,
  Platform decides how it's pushed).
- **Analytics** — consumes Operations' dispatch/delivery-time data for
  cross-domain KPIs (e.g. average delivery time, fill rate) without
  redefining what a Store, Rider, or DispatchRecord means.

## Explicit Non-Responsibilities

- Does not own stock levels, stock transfers, stock adjustments, or the
  received-stock side of a purchase order — that is Inventory.
- Does not own the rider's account, credentials, login, or role/permission
  grant — that is Identity. Operations only references the rider id.
- Does not own the order transaction, cart, checkout, final pricing/tax,
  refunds, or support tickets — that is Commerce.
- Does not own coupons, promotions, or delivery-fee discounting logic —
  that is Marketing (Operations may report delivery cost/time as an input,
  but does not decide promotional delivery-fee waivers).
- Does not own cross-domain dashboards/KPI definitions — that is
  Analytics; Operations is a data source, not the reporting layer.
- Does not own generic settings, feature flags, or notification delivery
  mechanics — that is Platform.

## Future Growth Considerations

- **Multi-zone / tiered delivery.** If the business introduces tiered ETAs
  (e.g. 10-min core zone vs. 30-min extended zone from the same store),
  the DeliveryZone entity will need to support multiple bands per store
  rather than a single radius — plan the schema to allow this without a
  breaking migration.
- **Rider batching / multi-drop.** Today's model assumes one rider, one
  active order, one store's zone. If multi-drop batching (one rider,
  multiple nearby orders) is introduced, dispatch assignment logic and
  payout calculation both need revisiting — this is a deliberate future
  change, not an implicit capability.
- **Real geo-indexing at scale.** `distanceInMeters` is a pure haversine
  calculation suitable for per-request checks; once rider/store counts
  grow, nearest-rider search should move to MongoDB geospatial indexes
  (`2dsphere`, consistent with `toGeoJsonPoint`'s `[lng, lat]` output) or
  Redis `GEOSEARCH` against `RIDER_LOCATIONS_KEY`, rather than scanning all
  riders per assignment.
- **Live tracking UI.** Once Socket.io is reintroduced (per the deferral
  comment in `Backend/src/server.ts`), the "Live Tracking" nav entry under
  Manage Delivery Boys (`Frontend/src/config/nav.ts`) becomes real-time
  rather than polled — Operations should define the event contract
  (assignment created, location updated, status changed) that the socket
  layer broadcasts.
- **Vendor-store many-to-many at scale.** If vendors begin supplying
  category-specific subsets of a store's catalog (e.g. produce vendor vs.
  dairy vendor for the same store), the vendor-store relationship may need
  to become category-scoped rather than a flat link.

## Glossary

- **Dark store** — a store that fulfills online orders only, not a
  walk-in retail location; the physical node Operations manages.
- **Dispatch** — the act of assigning a ready order to a specific rider.
- **Fulfillment** — the end-to-end execution of getting a ready order
  delivered, from dispatch through confirmed delivery.
- **Zone** — the geo-bounded area a single store is responsible for
  serving, derived from store coordinates + service radius.
- **GEOADD / geo-index** — a Redis data structure for storing
  lat/lng-tagged members and querying "who is nearest," implied by
  `RIDER_LOCATIONS_KEY`'s naming and the "GEOADD telemetry" comment in
  `Backend/src/core/cache/redis.ts`.
- **Haversine distance** — great-circle distance between two lat/lng
  points, implemented as `distanceInMeters` in
  `Backend/src/shared/utils/geo.ts`; the basis for all zone-membership and
  nearest-rider checks in this domain.
- **Handoff** — the moment Operations marks a delivery complete and
  control of the order (e.g. return-window eligibility) reverts to
  Commerce.

## References

- `.claude/domain/inventory.md` — stock-at-store and the purchase order's
  stock-received side (shared Store entity, split ownership).
- `.claude/domain/identity.md` — rider account/role definition (shared
  Rider entity, split ownership).
- `.claude/domain/commerce.md` — order transaction, dispatch trigger, and
  delivered/return-window handoff.
- `.claude/domain/domain-registry.md` — full charter table and the
  documented Store/Rider shared-entity seams.
- `.claude/domain/module-registry.md` — module-to-domain mapping for
  Dispatch Management, Delivery Zones, Manage Delivery Boys, Seller
  Management, and Stores (all Planned as of this writing).
- `Backend/src/shared/utils/geo.ts` — `distanceInMeters`,
  `isValidCoordinate`, `toGeoJsonPoint`: the real geo-distance primitives
  this domain's zone and assignment logic is meant to be built on.
- `Backend/src/core/cache/redis.ts` — `RIDER_LOCATIONS_KEY`: the
  anticipated live rider-location store (currently disabled in local dev).
- `Backend/src/server.ts` — explicit deferral comment for Socket.io
  real-time rider tracking and the order/rider domains it serves.
- `Backend/AGENTS.md` — target backend architecture (feature-first
  modules, layering, DTOs) that any Operations module (vendors, stores,
  delivery zones, dispatch, delivery-boys) must follow once built.
- `Frontend/src/config/nav.ts` — planned nav entries: Dispatch Management,
  Delivery Zones, Manage Delivery Boys, Seller Management, Stores.
