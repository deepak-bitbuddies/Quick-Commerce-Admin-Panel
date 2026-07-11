# Marketing Domain

## Purpose

Marketing defines **what discounts and promotional campaigns exist, and who
is eligible for them** — coupons, automatic offers, flash sales, campaigns,
promotions, and the banners/featured placements that surface them in the
app. Marketing owns the *rule*, never the *execution*: it decides that
`WELCOME50` gives 50% off up to ₹100 for first-time customers on orders over
₹199, but it never touches a live cart, computes a final payable amount, or
writes to an order. That boundary belongs to Commerce. This document is the
living source of truth for how promotional mechanics work on this platform;
every rule here must be concrete enough that Commerce can execute it without
having to ask what was meant.

## Ownership

Owning expert: `.claude/agents/marketing-expert.md`. Domain registry entry:
`.claude/domain/domain-registry.md` (#4). Module registry rows:
`.claude/domain/module-registry.md` — Banners, Manage Featured Section,
Promos, Ad Campaigns (all **Planned**, no backend module exists yet under
`Backend/src/api/v1/admin/`). Marketing is the sole authority on discount
*definition*, eligibility, targeting, and promotional content scheduling.

## Responsibilities

- Define coupon rules: codes, discount shape, eligibility, usage limits.
- Define automatic offers (no code required) and their trigger conditions.
- Define and schedule flash sales, including their store/zone scope.
- Define campaigns as scheduling/grouping wrappers around offers, coupons,
  flash sales, banners, and notification triggers.
- Define banners: creative content, placement, target, and active window.
- Own "Manage Featured Section": manual merchandising of which
  products/categories get visibility slots on app surfaces.
- Own "Ad Campaigns": seller-funded sponsored placements, including the
  wallet-balance gate that permits a sponsored campaign to go live.
- Define stacking/exclusivity/priority rules between overlapping promotions
  so Commerce has a deterministic instruction set at checkout.
- Define validity windows and targeting (product/category/brand/store/zone)
  for every promotion type, by reference into Catalog and Operations data.

## Business Concepts

- **Coupon** — a code-based promotion. Customer must enter/apply the code.
  Can be single-use (one redemption ever, e.g. a referral code) or
  multi-use (many customers, capped total redemptions). Always carries
  per-user redemption limits independent of the global cap.
- **Offer** — an automatic promotion. No code; Commerce applies it the
  moment the cart satisfies the trigger condition (e.g. "buy 2 get 1 free
  on Category X", "spend ₹499, get free delivery"). Offers carry a
  `priority` and an `exclusive` flag used to resolve overlaps (see Business
  Rules).
- **Flash Sale** — a hard time-boxed promotion (hours, not weeks) on a
  specific SKU list, typically scoped to one or a handful of dark
  stores/zones rather than the whole platform, because what can be flash-
  sold is bounded by what a nearby dark store physically holds right now.
  Carries a flash price per SKU and, optionally, a per-order quantity cap.
- **Campaign** — a scheduling/grouping wrapper, not a discount mechanism
  itself. A Campaign bundles one or more Offers/Coupons/Flash Sales with
  Banners and a notification trigger under one theme and one timeline
  (e.g. "Independence Day Week"). Deleting a Campaign never deletes the
  Offers/Coupons it references — it only stops orchestrating them together.
- **Promotion** — the umbrella term for any mechanism that changes what a
  customer pays or is shown promotionally. "Promotion" is not itself a
  separate entity with its own table; it is the category that Coupons,
  Offers, and Flash Sales all belong to. When this document or an
  engineering ticket says "promotion," it means "one of: coupon, offer, or
  flash sale," never a fourth distinct thing.
- **Banner** — a visual creative asset shown at a placement (home hero,
  category page top, cart page, post-checkout). A banner's `target` is
  polymorphic: it can deep-link to a Campaign, an Offer, a Flash Sale, a
  product, a category, or an external URL. A banner can also stand alone
  with no promotional target (pure brand/announcement content).
- **Manage Featured Section** — manual merchandising, not discounting. A
  Featured Section is a named, ordered list of product/category references
  placed into a visibility slot (e.g. home page "Trending Now" carousel,
  category page "Top Picks"). It changes what customers *see* and in what
  order, never what they *pay*. A product can sit in a Featured Section and
  simultaneously carry an unrelated Coupon or Offer — no conflict, because
  one governs visibility and the other governs price.
- **Ad Campaigns** — this is the one nav module that is not a platform-run
  discount at all: it is seller-funded sponsored placement (a retail-media
  feature). A seller/vendor (an Operations entity) funds a wallet; once an
  admin approves a wallet deposit, the seller can run an Ad Campaign that
  buys visibility (sponsored slot on search/listing/category pages) for
  their own products. It shares scheduling shape with platform Campaigns
  but has a distinct funding model (seller money, wallet-gated) and a
  distinct goal (seller-paid visibility, not platform-funded discounting).
  It does not itself change price — it changes placement, same as a
  Featured Section, except the "why it's featured" is "a seller paid for
  it" instead of "a merchandiser curated it."

## Entities

| Entity | Key attributes |
|---|---|
| Coupon | `code`, `discountType` (flat/percentage), `discountValue`, `maxDiscountCap`, `minOrderValue`, `usageLimitPerUser`, `usageLimitTotal`, `firstOrderOnly`, `validFrom`, `validTo`, `applicableCategoryIds`/`applicableProductIds`/`applicableBrandIds` (Catalog refs), `applicableStoreIds`/`applicableZoneIds` (Operations refs), `exclusive`, `status` |
| Offer | `triggerType` (BXGY, spend-threshold, category-percent-off, free-delivery), `triggerConfig`, `priority`, `exclusive`, `validFrom`, `validTo`, targeting refs (same shape as Coupon) |
| Flash Sale | `name`, `skuList` (Catalog product refs with per-SKU flash price), `storeIds`/`zoneIds` (Operations refs, mandatory), `startAt`, `endAt` (both mandatory), `perOrderQtyCap` |
| Campaign | `name`, `theme`, `startAt`, `endAt` (endAt optional — see Business Rules), `childOfferIds`/`childCouponIds`/`childFlashSaleIds`, `bannerIds`, `notificationTemplateRef` (Platform) |
| Banner | `creativeAssetUrl`, `placement` (enum: home-hero, category-top, cart, post-checkout, ...), `priority`, `targetType` (campaign/offer/flashSale/product/category/external/none), `targetRef`, `startAt`, `endAt` |
| Featured Section | `name`, `slot` (enum), `orderedRefs` (product/category refs in display order), `startAt`, `endAt` |
| Ad Campaign | `sellerId` (Operations vendor ref), `walletId`, `skuList`, `dailyBudgetCap`, `startAt`, `endAt`, `status` |
| Seller Ad Wallet | `sellerId`, `balance`, `pendingDeposits` (list awaiting admin approval) |

## Relationships

- Campaign --(1:N)--> Offer / Coupon / Flash Sale (a Campaign *references*
  these; it does not own their lifecycle — an Offer can exist with no
  parent Campaign).
- Campaign --(1:N)--> Banner, and --(1:1..N)--> a Platform notification
  template used to announce it.
- Coupon / Offer / Flash Sale --(N:1)--> Catalog product/category/brand
  (referential targeting only — Marketing never redefines what these are).
- Flash Sale --(N:1)--> Operations store/zone (mandatory scope) and
  --(consumes)--> Inventory's per-store reservation mechanism at execution
  time.
- Banner --(polymorphic N:1)--> Campaign | Offer | Flash Sale | Catalog
  product/category | external URL.
- Featured Section --(N:M)--> Catalog product/category (visibility only,
  no price relationship).
- Ad Campaign --(N:1)--> Operations vendor/seller, and --(1:1)--> Seller Ad
  Wallet, which gates whether the Ad Campaign may activate or continue.
- Analytics --(consumes, does not own)--> redemption/impression/click/ROI
  data emitted by every entity above.

## Business Rules

1. **Coupon stacking — definite answer.** At most **one coupon per order**.
   A coupon and any number of automatic Offers *can* combine on the same
   order **unless** the Offer or Coupon is flagged `exclusive: true`, in
   which case it must be the only promotion applied. Two automatic Offers
   can combine with each other unless they'd both discount the exact same
   line item, in which case the one with the higher numeric `priority`
   wins and the other is dropped for that item (deterministic, no
   "whichever is bigger" heuristic — priority is set explicitly by
   Marketing at Offer-creation time). Marketing owns these flags; Commerce
   is the one that enforces them at checkout.
2. **Coupon eligibility gates.** `minOrderValue` is evaluated against
   Commerce's pre-discount cart subtotal. `firstOrderOnly` checks whether
   the customer has ever *placed* an order before (see Edge Cases for the
   returned-order case) — this is a read against Commerce's order history,
   not a Marketing-owned flag on the customer. Category/brand/product
   restriction is a positive allow-list (absence of a restriction list
   means platform-wide eligibility, not "no products eligible").
3. **Flash sales are hyper-local by default.** A Flash Sale's
   `storeIds`/`zoneIds` is mandatory and defaults to the narrowest
   reasonable scope (the dark stores that actually hold the flash stock).
   A platform-wide flash sale is an explicit, deliberate choice (selecting
   every zone), never the default, because 10-minute delivery means the
   promise only holds for stores that actually have the stock nearby.
4. **Flash sale stock is Inventory's problem, not Marketing's.** Marketing
   defines the SKU list, flash price, and per-order cap; Inventory's
   reservation mechanism is authoritative on real-time availability. A
   flash sale item selling out mid-sale is expected, correct behavior — the
   handoff is: Marketing publishes eligibility, Inventory reports
   sold-out, Commerce greys out the SKU. Marketing never tracks remaining
   stock counts itself.
5. **Validity windows.** Flash Sales require both `startAt` and `endAt`
   (mandatory, no open-ended flash sales — that would just be an Offer). A
   Flash Sale's duration is capped short by product definition (hours, not
   days); anything intended to run longer than a day belongs to Offer or
   Campaign, not Flash Sale. Coupons/Offers/Campaigns require `startAt` but
   may omit `endAt` (open-ended, e.g. an evergreen welcome coupon).
   Expired promotions are deactivated automatically, never deleted —
   redemption history must remain auditable.
6. **Banner slot conflicts are rejected, not silently overwritten.** Two
   banners with the same `placement` and overlapping `[startAt, endAt]`
   windows must have distinct `priority` values. Creating a second banner
   with an identical `placement` + `priority` + overlapping window is a
   validation error at creation time — there is no last-write-wins
   behavior for featured slots.
7. **Ad Campaign wallet gate.** An Ad Campaign may only activate (or
   continue running) while its Seller Ad Wallet balance is positive.
   Wallet top-ups require an admin approval step (the "pending wallet
   deposits" queue) before funds count toward balance — this exists so a
   seller cannot self-certify their own spend authorization. If the
   balance is depleted mid-campaign, the campaign auto-pauses; it never
   goes negative or runs on credit.
8. **Featured Section curation is manual, not algorithmic.** Ordering
   within a Featured Section is admin-curated (explicit ordered list), not
   computed from sales/ranking signals — if a ranked/algorithmic feed is
   ever wanted, that is a distinct future feature (see Future Growth), not
   a silent change to how this entity behaves today.

## Validations

- Coupon `code` is unique (case-insensitive), alphanumeric, no whitespace.
- `discountValue` for percentage-type coupons/offers requires a
  `maxDiscountCap` — a percentage discount with no cap is rejected at
  creation (prevents an uncapped "50% off" being economically unbounded on
  a large cart).
- `minOrderValue` and `discountValue` must be >= 0; `usageLimitPerUser` and
  `usageLimitTotal`, if present, must be integers >= 1.
- `startAt` < `endAt` whenever both are present, enforced at save time.
- Every targeting reference (`applicableProductIds`, `storeIds`, etc.) must
  resolve against Catalog/Operations at save time — a dangling ID is
  rejected, not silently ignored.
- Flash Sale `skuList` must be non-empty, and each SKU's flash price must
  be strictly less than that SKU's current Catalog base MRP — a "flash
  sale" that isn't actually a discount is rejected.
- A Campaign must reference at least one child Offer/Coupon/Flash Sale or
  Banner — an empty Campaign (nothing to schedule) is rejected.
- Banner `targetRef`, if set, must resolve to an existing entity of
  `targetType` at save time.
- Ad Campaign requires a resolvable `sellerId` (Operations vendor) and a
  wallet with a non-negative balance before status can move to active.

## Edge Cases

- **Order placed right at coupon expiry.** The order's creation timestamp
  (Commerce-owned) is checked against `validTo`, inclusive. A coupon
  applied before expiry but paid/confirmed after expiry still honors the
  discount — the eligibility moment is cart-apply time, not payment-
  settlement time.
- **First-order-only coupon vs. a returned/refunded prior order.** A prior
  order that was later fully returned/refunded still counts as "an order
  the customer has placed." `firstOrderOnly` checks order *placement*
  history, not order *success* history — this is deliberate, to prevent
  gaming a welcome coupon by placing then returning a throwaway order.
- **Store goes out of service mid-flash-sale.** Since Flash Sales are
  store/zone-scoped, a store closing (an Operations event) simply removes
  that store's customers from eligibility going forward — no special
  Marketing-side handling is needed; it's the natural effect of scope
  filtering, not an exception path.
- **Two banners, same placement, same priority, submitted concurrently.**
  Rejected per Business Rule 6 — the second write fails validation rather
  than silently displacing the first.
- **Ad Campaign wallet depleted mid-flight.** Campaign auto-pauses (Rule
  7); a subsequent approved top-up resumes it, it does not retroactively
  cover the gap.
- **Promotion targets a product Catalog later discontinues.** The
  promotion is not auto-deleted; it simply stops having eligible line
  items once Commerce/Catalog mark the product inactive. Marketing should
  periodically surface promotions with zero remaining eligible targets so
  they can be archived, but a discontinued product does not retroactively
  invalidate a Coupon's other targets.
- **Wallet deposit approved after an Ad Campaign was already created in
  draft.** The campaign remains in draft/inactive status until balance is
  sufficient; approval does not auto-activate a campaign, it only unblocks
  the wallet gate — a human still flips the campaign live.

## Dependencies

- **Commerce** (`.claude/domain/commerce.md`) — applies coupons/offers to a
  real cart, computes the final payable price, and is the sole enforcer of
  the stacking/exclusivity rules Marketing defines here. Marketing never
  writes to a cart or order.
- **Catalog** (`.claude/domain/catalog.md`) — source of truth for which
  products/categories/brands exist and their base MRP; every targeting
  reference in a Coupon/Offer/Flash Sale/Banner/Featured Section resolves
  against Catalog, but Marketing never edits catalog data.
- **Inventory** (`.claude/domain/inventory.md`) — owns real-time stock and
  the reservation mechanism a Flash Sale relies on to know what's actually
  sellable right now; Marketing defines eligibility, Inventory decides
  availability.
- **Operations** (`.claude/domain/operations.md`) — source of truth for
  store and delivery-zone identity (Flash Sale/Coupon scoping) and for
  vendor/seller identity (Ad Campaign funding relationship).
- **Platform** (`.claude/domain/platform.md`) — owns the actual delivery
  channel (push/SMS/in-app) used to announce a Campaign or surface a
  Banner; Marketing defines *what* content and *when*, Platform owns the
  notification/content-delivery mechanics.
- **Analytics** (`.claude/domain/analytics.md`) — consumes redemption,
  impression, click, and spend data emitted by Marketing's entities to
  compute campaign ROI, conversion lift, and ad performance; Marketing
  never computes these derived KPIs itself, only exposes the raw events.
- **Identity** (`.claude/domain/identity.md`) — per-user coupon usage
  limits resolve against a customer identity Identity owns; no ownership
  overlap, purely a reference.

## Explicit Non-Responsibilities

- Does not apply discounts to a live cart or compute final order price/tax
  — Commerce.
- Does not manage stock levels, reservations, or sold-out determination —
  Inventory.
- Does not define stores, delivery zones, or vendor/seller accounts
  themselves — Operations (Marketing only *references* their IDs).
- Does not send push notifications, SMS, or manage notification channels —
  Platform.
- Does not define products, categories, brands, or base MRP — Catalog.
- Does not compute campaign ROI, conversion-lift, or ad-performance
  dashboards — Analytics (Marketing emits the raw events those are built
  from).
- Does not own the general seller/vendor payment ledger — only the
  narrow wallet-balance gate that permits an Ad Campaign to run; broader
  seller payments/settlement is not yet owned by any domain and should not
  be assumed to be Marketing's by default.
- Does not own customer accounts or authentication — Identity.

## Future Growth Considerations

- **Self-serve ad campaign funding.** Today's wallet-deposit flow is
  admin-approved (manual "pending wallet deposits" queue); this may later
  integrate a payment gateway for instant seller top-ups, at which point
  the approval-gate rule (Business Rule 7) should be revisited, not
  silently dropped.
- **Segment-targeted/personalized offers** (e.g. "lapsed customers get 20%
  off," "high-AOV customers see a different banner") would need a customer
  segment feed, most naturally sourced from Analytics — run Dynamic Domain
  Evolution reasoning if this grows complex enough to need its own
  targeting-rule engine.
- **Loyalty/points-based promotions** are not in the current nav or
  charter. If added, check against Identity (who owns the points ledger?)
  before assuming Marketing owns redemption rules outright.
- **Referral programs** could be modeled as a Coupon subtype (single-use,
  customer-generated code) or as a distinct entity — undecided; default to
  Coupon subtype unless referral-specific rules accumulate enough to
  warrant separation.
- **A/B testing of banners/offers.** Variant assignment and lift
  measurement likely split between Marketing (defining variants) and
  Analytics (measuring outcome) — do not assume Marketing owns the
  statistical testing methodology.
- **Algorithmic Featured Sections** (ranked by sales velocity, near-expiry
  stock, personalization) would be a deliberate evolution away from Rule 8
  ("manual, not algorithmic") — must be an explicit decision, not a quiet
  behavior change.

## Glossary

- **Promotion** — umbrella term for any mechanism changing what a customer
  pays or sees promotionally; not a standalone entity, always one of
  Coupon / Offer / Flash Sale (pricing) or Banner / Featured Section
  (visibility).
- **Coupon** — code-based promotion; customer opts in by entering a code.
- **Offer** — automatic promotion; no code, applied when trigger
  conditions are met.
- **Flash Sale** — short, hard time-boxed, typically store/zone-scoped
  price-drop on a fixed SKU list.
- **Campaign** — a scheduling/grouping wrapper bundling Offers/Coupons/
  Flash Sales with Banners and a notification trigger; not itself a
  discount mechanism.
- **Banner** — visual creative content shown at a placement, optionally
  linking to a Campaign/Offer/Flash Sale/product/category/external URL.
- **Manage Featured Section** — manual merchandising: curated, ordered
  product/category visibility slots; no pricing effect.
- **Ad Campaign** — seller-funded sponsored placement (retail media), gated
  by a wallet balance; distinct from a platform Campaign in who funds it
  and why the placement exists.
- **Seller Ad Wallet** — the prepaid balance, topped up via admin-approved
  deposits, that funds and gates a seller's Ad Campaigns.
- **Exclusive (flag)** — on a Coupon/Offer, marks it as unable to combine
  with any other promotion on the same order.
- **Stacking** — whether more than one promotion can apply to a single
  order/line item simultaneously; governed by Business Rule 1.

## References

- `.claude/domain/commerce.md` — checkout-time application and stacking
  enforcement of the rules defined here.
- `.claude/domain/catalog.md` — product/category/brand/MRP data that
  promotions target.
- `.claude/domain/inventory.md` — stock/reservation coordination for Flash
  Sales.
- `.claude/domain/platform.md` — notification/content-delivery channel for
  Campaigns and Banners.
- `.claude/domain/analytics.md` — consumes campaign/coupon/offer/ad
  performance metrics.
- `.claude/domain/operations.md` — store/zone and vendor/seller identity
  referenced by Flash Sales and Ad Campaigns.
- `Backend/AGENTS.md` — target module structure; note `coupons/`,
  `promotions/`, `banners/` are the only Marketing-shaped folders currently
  named in the target `api/v1/admin/` layout — Flash Sale, Campaign,
  Featured Section, and Ad Campaign modules are not yet reflected there and
  will need folders added when built.
- `.claude/domain/module-registry.md` — Banners, Manage Featured Section,
  Promos, Ad Campaigns status rows (all Planned).
- `.claude/domain/domain-registry.md` — Marketing's charter (#4) and the
  cross-domain shared-entity notes.
- `Frontend/src/config/nav.ts` — the "marketing" nav group; ground truth
  for currently planned module names and routes.
