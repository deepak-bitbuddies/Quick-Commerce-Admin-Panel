# Catalog Domain

## Purpose

Catalog answers one question for the rest of the platform: **what can be
sold, and at what listed price?** It is the system of record for the
sellable-item graph — products, the categories and brands that organize
them, the attributes and units that describe them, and the tags used to
group and surface them for browsing. Every other domain that needs to know
"what is this SKU" or "what's its MRP" reads from Catalog rather than
maintaining its own copy.

Catalog does not decide what a customer actually pays. It publishes the
base Maximum Retail Price (MRP); Commerce is responsible for turning that
into a final checkout price once tax and active promotions are applied. See
Dependencies below.

## Ownership

Catalog owns the following modules, per `.claude/domain/domain-registry.md`
(row 1) and `.claude/domain/module-registry.md`:

- Products
- Categories
- Brands
- Attributes (not yet a nav module, but part of the charter — see Future
  Growth Considerations)
- Units (not yet a nav module — same)
- Tags (not yet a nav module — same)
- Base MRP per product

Catalog does **not** own Tax Rates. The "Catalog" sidebar group in
`Frontend/src/config/nav.ts` currently lists Categories, Products, Brands,
and Tax Rates together as one navigational group, but Tax Rates is a
Commerce-owned rate *definition* (Commerce owns pricing/tax wholesale — see
`.claude/domain/domain-registry.md`'s shared-entity notes and
`.claude/domain/commerce.md`). Grouping in the sidebar is a UX/IA decision,
not a domain boundary; do not let it leak into service/repository code that
conflates the two.

## Responsibilities

- Defining what a "product" is in this system and what data it must carry
  to be sellable (name, SKU, unit of measure, pack size, MRP, category,
  brand, images, status).
- Maintaining the category tree used for browsing and merchandising.
- Maintaining the brand directory.
- Maintaining reusable attributes (category-scoped descriptive facets) and
  units of measure.
- Maintaining tags for cross-cutting grouping (e.g. "organic", "diwali
  special") independent of the category tree.
- Enforcing catalog-level data integrity: uniqueness, required
  relationships, and lifecycle rules (draft/active/inactive/discontinued)
  for all of the above.
- Publishing MRP as the base price signal Commerce builds the final price
  from.

## Business Concepts

### Products

A Product is a sellable SKU in the dark-store catalog — a grocery/quick-
commerce item, not an arbitrary long-tail marketplace listing. Concretely it
needs:

- **SKU code** — the unique internal identifier used across Inventory,
  Commerce, and Analytics to refer to this exact sellable unit (e.g. a
  specific brand + pack size combination, not just "product name").
- **Name** and **description**.
- **Unit of measure** — how the product's quantity is expressed: piece,
  kg, gram, litre, millilitre, dozen, etc. This is distinct from pack size.
- **Pack size / net quantity** — the actual sellable quantity, e.g. `500g`,
  `1L`, `6 pieces`. Two products can share a unit of measure (both sold in
  "grams") but have different pack sizes (`250g` vs `1kg`), and those are
  different SKUs with different MRPs.
- **Perishability flag** — whether the item has a shelf life that matters
  operationally (produce, dairy, bakery vs. packaged/ambient goods). Catalog
  owns the flag as product metadata; Inventory owns what it *does* with that
  flag (batch/expiry tracking, FEFO rotation) — see
  `.claude/domain/inventory.md`.
- **Category reference** — exactly one category (see below).
- **Brand reference** — zero or one brand (unbranded/loose produce is
  legitimate and has no brand).
- **MRP** — the base Maximum Retail Price Catalog publishes for the SKU.
- **Images** — one or more product images; at least one required before a
  product can go active.
- **Tags** — zero or more (see Tags below).
- **Attribute values** — zero or more, scoped by the product's category
  (see Attributes below).
- **Status** — draft / active / inactive / discontinued. Only active
  products are sellable and visible to Inventory/Commerce for stocking and
  ordering.

**Current implementation reality:** the only code that exists today is a
frontend demo scaffold. `Frontend/src/modules/products/types/product.ts`
defines `Product` and `CreateProductInput` as just
`{ id, name, price, category }` — `category` is a plain string, not a
foreign key to a real Category entity. `Frontend/src/modules/products/
components/product-form.tsx` is a bare create form (name/price/category)
backed by `Frontend/src/modules/products/api/products-api.ts`
(`getProducts()` / `createProduct()`), which calls a `/products` REST
resource that **does not exist yet** under `Backend/src/api/v1/admin/` —
only `auth/` and `users/` exist there today. This scaffold is wired into the
dashboard home page, not the real `/products` route (which still renders
`ComingSoon`). Treat everything above this paragraph as the target model
Catalog is designing toward, not what's running in production today.

### Categories

Categories organize products for browsing and merchandising and need a
**parent/child hierarchy** (e.g. `Dairy, Bread & Eggs` → `Milk` → `Toned
Milk`), not a flat list — quick-commerce home pages and category-landing
pages are built on 2-3 levels of nesting. Fields: name, slug, parent
reference (nullable for root categories), display order, image/icon,
status (active/inactive). A category's depth should be bounded (a small
fixed number of levels) to keep browsing and admin UI predictable — the
exact limit is an implementation decision, not a business rule fixed here,
but it must be enforced somewhere before this doc is closed out.

### Brands

The manufacturer or house brand a product is sold under. Fields: name
(unique), logo/image, description, status (active/inactive). Loose/local
produce with no brand is normal and must be representable (Product.brand
is optional).

### Attributes

Attributes are descriptive facets that vary **by category**, not global to
every product — e.g. "spicy level" only makes sense for snacks/masalas,
"organic" mostly matters for produce and staples, "fat content" for dairy.
An Attribute definition needs: name, applicable category (or categories),
value type (enum/boolean/number/text), and for enum types the allowed
values (e.g. spicy level: mild/medium/hot). A Product then carries
Attribute *values* for whichever attributes apply to its category. This is
what powers category-specific filters in the customer app (e.g. filtering
dairy by "fat content" but not expecting a "spicy level" filter there).

### Units

Units define how a product's quantity is measured and sold — the
controlled vocabulary behind "unit of measure" on a Product (piece, kg, g,
litre, ml, dozen). Units are a small, largely static reference list
maintained centrally so that pack-size math (e.g. converting `500g` vs
`0.5kg` for search/sort or Inventory reconciliation) is consistent across
the platform rather than re-invented per product.

### Tags

Free-form-ish, admin-curated labels for cross-cutting grouping that doesn't
fit the category tree — "organic", "diwali-special", "new-arrival",
"low-stock-prone". A product can have many tags, tags can span many
categories, and tags are primarily a merchandising/discovery aid rather
than a structural classification (that's what Categories are for).

## Entities

| Entity | Key fields | Notes |
|---|---|---|
| Product | id, sku, name, description, unitOfMeasure, packSize, perishable, categoryId, brandId?, mrp, images[], tagIds[], attributeValues[], status | Central entity; target model, not yet backed by a real backend module |
| Category | id, name, slug, parentId?, displayOrder, image?, status | Self-referential hierarchy |
| Brand | id, name (unique), logo?, description, status | |
| Attribute | id, name, categoryIds[], valueType (enum/boolean/number/text), allowedValues[]? | Definitions live here; values live on Product |
| Unit | id, code (kg/g/l/ml/piece/dozen), displayName, baseUnitConversion? | Small static reference set |
| Tag | id, name (unique), status | Many-to-many with Product |

## Relationships

- **Product → Category**: many-to-one, required. Every active product
  belongs to exactly one category (the most specific/leaf category it's
  browsed under).
- **Category → Category**: self-referential parent/child, forming a tree.
  A category may have zero or more children and at most one parent.
- **Product → Brand**: many-to-one, optional.
- **Product ↔ Tag**: many-to-many, optional on both sides.
- **Product ↔ Attribute (via Attribute Value)**: a product carries values
  only for attributes applicable to its category; an attribute is
  applicable to one or more categories.
- **Product → Unit**: many-to-one, required. Defines the unit of measure
  the pack size is expressed in.
- **Product → MRP**: one current MRP per product, versioned over time (see
  Business Rules) but a single "current" value at any instant.

## Business Rules

1. A product must belong to **exactly one** category, but may carry
   **multiple** tags — categories are structural (single-parent
   classification for browsing), tags are supplemental (multi-label
   discovery).
2. A product cannot be set to **active** status without: at least one
   image, a category, a unit of measure + pack size, and a defined MRP.
   Draft products can exist with incomplete data; active ones cannot.
3. MRP changes are prospective, not retroactive. Changing a product's MRP
   today must never alter the price shown on an order already placed —
   Commerce snapshots the price at order time and is the one responsible
   for enforcing that immutability (see Dependencies). Catalog's job is
   only to make the *current* MRP correct and timestamp when it changed.
4. Brand names must be unique (case-insensitive) to avoid duplicate brand
   records for the same manufacturer.
5. SKU codes must be unique platform-wide. A duplicate SKU on create is
   rejected, not silently merged or auto-suffixed — SKU collisions usually
   indicate a real data entry error (e.g. re-adding an existing pack
   size/brand combination) that should surface to the admin, not be hidden.
6. An Attribute's `allowedValues` (for enum-type attributes) can be
   extended but not silently reordered/removed while products reference
   existing values — removing a value that's in use on a product must be
   an explicit, blocking operation, not a cascading silent delete.
7. Category deletion is blocked while any product (in any status) still
   references that category, directly or via a non-empty subtree.
   Deleting a category must first require re-parenting or archiving its
   products and children.
8. Deactivating a category cascades as a *visibility* concern (hidden from
   browsing) but does not itself deactivate the products inside it —
   product status is independent and explicit.
9. Perishability is metadata Catalog defines on the product; Catalog does
   not track expiry dates or batches — that is Inventory's concern once
   stock of that perishable SKU exists at a store.
10. Units are a closed, centrally-maintained set — admins pick from
    existing units when creating a product rather than free-typing a new
    unit per product, to keep pack-size data comparable/sortable across
    the catalog.
11. Deactivating a Brand is a visibility/selectability concern only, the
    same as Category deactivation (rule 8) — it does not cascade to
    products that reference it; a deactivated brand simply stops
    appearing as a selectable option for new/edited products while
    existing product-brand references are untouched.
12. Duplicate brand name — on create or on rename — is rejected outright,
    never silently merged or auto-suffixed, the same duplicate-handling
    principle rule 5 establishes for SKU applied to brand name.
13. Brand management (all five endpoints, including read/list) is
    restricted to `super_admin` only, via the same all-or-nothing role
    gate `admin/users` already uses (`.claude/domain/identity.md` rule 6)
    — Catalog has no more granular permission model for Brands than
    Identity does for Users today.

## Validations

- Product name: required, minimum length, no leading/trailing whitespace.
- SKU: required, unique, fixed format (alphanumeric, no spaces) — exact
  pattern is an implementation decision but must be validated server-side,
  not just in the frontend form.
- MRP: required for active products, must be a positive number, sensible
  currency precision (paise-level for INR, i.e. at most 2 decimal places).
- Pack size: required for active products, positive numeric value paired
  with a valid Unit reference.
- Category reference: required for active products; must reference an
  existing, non-deleted category.
- Brand reference: optional, but if present must reference an existing,
  non-deleted brand.
- Images: at least one required before activation; each must be a valid
  stored asset reference, not an arbitrary external URL (avoids dead links
  and lets the platform own image hosting/CDN behavior).
- Attribute values: must only be set for attributes applicable to the
  product's category; an enum-type attribute value must be one of that
  attribute's `allowedValues`.
- Tag names: required, unique, no duplicate tag assignment on the same
  product.

The current implementation validates only `name` (min length 2), `price`
(must parse to a positive number), and `category` (non-empty string) client-
side via the Zod schema in `Frontend/src/modules/products/components/
product-form.tsx` — none of the richer rules above are implemented yet;
they are the target validation surface once the real Products module is
built.

## Edge Cases

- **Duplicate SKU on create**: reject with a clear conflict error rather
  than creating a second product record or silently updating the existing
  one.
- **Category deletion with products/children still attached**: block the
  delete; surface which products/subcategories are blocking it.
- **Brand deletion while products reference it**: block, or require
  explicit reassignment of affected products to "no brand" — do not
  silently null out the reference platform-wide without an admin decision
  point.
- **Attribute value removed from an enum while products use it**: existing
  products keep the (now "orphaned") value visible in the admin so data
  isn't silently lost, but the value can no longer be selected for new
  products.
- **Product with a category but that category later becomes inactive**:
  the product is not automatically deactivated; it simply stops appearing
  in that category's active browsing surface until re-categorized or the
  category is reactivated.
- **Same brand + pack size, different SKU**: legitimate (e.g. a
  promotional multipack vs. the standard pack) — SKU uniqueness is the only
  hard constraint, not brand+packSize uniqueness.
- **MRP edited while an order for that product is mid-checkout**: Catalog
  simply updates its own "current MRP" record; it is Commerce's
  responsibility (via price snapshotting at cart/order time) to make sure
  the customer isn't charged a price that changed after they started
  checkout. Catalog does not implement any locking or checkout-awareness
  itself.
- **Product deactivated while stock exists at stores**: Catalog does not
  check or care about existing stock levels when deactivating a product for
  sale — that consequence (what happens to stranded stock) is Inventory's
  concern to react to, not something Catalog blocks on.

## Dependencies

- **`.claude/domain/commerce.md` (Commerce)** — owns the final checkout
  price: applies tax and active promotions on top of Catalog's MRP, and is
  responsible for snapshotting price at order time so Catalog's future MRP
  edits never retroactively change a placed order's price. Commerce also
  owns Tax Rate *definitions*, despite Tax Rates appearing in the same
  sidebar nav group as Catalog's modules.
- **`.claude/domain/inventory.md` (Inventory)** — owns stock levels,
  transfers, and purchase orders for a given product *at a store*.
  "Is this SKU in stock right now" is adjacent to Catalog but not part of
  it: Catalog defines that the SKU exists and is sellable in principle;
  Inventory tracks whether units of it are physically available. Catalog
  also relies on Inventory to be the consumer of the perishability flag for
  batch/expiry tracking.
- **`Frontend/AGENTS.md`** — frontend feature-first architecture
  (`modules/{feature}/{api,components,hooks,...}`) that any real Products/
  Categories/Brands module must follow; defines the backend response
  envelope contract (`{ success, message, data, meta }`) consumed via
  `backendFetch`.
- **`Backend/AGENTS.md`** — backend feature-first module structure
  (`controller → service → repository → model`, DTOs, mappers, custom
  error classes) that the eventual `Backend/src/api/v1/admin/products/`,
  `categories/`, `brands/` modules must follow; also documents that
  `inventory` is its own sibling module path, reinforcing the Catalog/
  Inventory split at the code level.
- **`.claude/domain/module-registry.md`** — authoritative status tracker;
  currently lists Products as Scaffolded, Brands as **Built**
  (`Backend/src/api/v1/admin/brands/`, `Frontend/src/modules/brands/`),
  Categories as Planned, and Tax Rates as Planned-under-Commerce. Update
  this file (via the Documentation Engineer) whenever a Catalog module's
  status changes.
- **`.claude/agents/catalog-expert.md`** — the agent definition that owns
  and maintains this document; not read as part of writing this file, but
  expected to exist as a sibling.

## Explicit Non-Responsibilities

- **Final checkout price, tax computation, promotion/discount
  application** — Commerce.
- **Stock levels, batch/expiry tracking, purchase orders, store-level
  reservations** — Inventory.
- **Whether a product is currently orderable in a given delivery zone**
  (a store-availability/serviceability question) — Operations/Inventory,
  not Catalog. Catalog only says the SKU exists and is marked active.
- **Vendor/supplier relationships for sourcing a product** — Operations
  (vendors).
- **Coupons, offers, flash-sale pricing, banners featuring products** —
  Marketing. Catalog supplies the product data Marketing references; it
  does not define the promotional rules.
- **Product reviews, FAQs, "pending approval" moderation workflow** —
  these appear under the "Products" nav group
  (`/products/reviews`, `/products/faqs`, `/products/pending-approval`,
  `/products/badges` in `Frontend/src/config/nav.ts`) but are not yet
  assigned an owning expert in the module registry; do not assume Catalog
  owns them by proximity alone — resolve via Dynamic Domain Evolution when
  one of them is actually built.

## Future Growth Considerations

- **Category becomes a real entity, not a string.** The most pressing gap:
  `Product.category` is currently a free-text string
  (`Frontend/src/modules/products/types/product.ts`). Growing to a real
  `categoryId` foreign key (and building the Categories module at all,
  since it's currently just a Planned nav entry with no implementation)
  is a prerequisite for the parent/child hierarchy, category-scoped
  attributes, and category-based browsing described in this document.
- **Wiring Product to the real Brand entity.** Brand itself is no longer
  the gap — the Brands module is Built (`Backend/src/api/v1/admin/
  brands/`, `Frontend/src/modules/brands/`), with `name` (unique),
  `logo`, `description`, and `status`. The remaining gap is that
  `Product` still has no `brandId` reference at all today, since Products
  itself remains the pre-existing scaffold described above — that wiring
  is prerequisite work for whenever the real Products module is built.
- **Attributes, Units, and Tags as first-class modules.** None of these
  exist as nav entries or backend modules yet. They are part of Catalog's
  charter per the domain registry, but will need their own Dynamic Domain
  Evolution-style scoping work (data model, admin UI, migration of any
  attribute-like data currently jammed into product name/description) when
  they're actually built.
- **SKU-level variant modeling.** Real quick-commerce catalogs often need
  "product" (e.g. "Amul Milk") vs. "variant" (e.g. "500ml", "1L") as two
  tiers, so shared marketing content (images, description) doesn't have to
  be duplicated per pack size. The current single-tier Product model
  doesn't distinguish these; watch for this need once real product volume
  arrives.
- **MRP history/versioning.** Business Rule 3 assumes Commerce snapshots
  price at order time, but Catalog itself may eventually need to retain an
  MRP change history (for margin analysis handed to Analytics, or for
  regulatory MRP-display requirements on packaged goods) rather than
  overwriting the current value in place.
- **Bulk import/export.** Quick-commerce catalogs (hundreds to thousands of
  SKUs per dark store cluster) typically need CSV/bulk upload for product
  and price maintenance rather than one-at-a-time form entry — the current
  scaffold form is single-product-create only.

## Glossary

- **MRP** — Maximum Retail Price. The base price Catalog publishes for a
  product; the ceiling Commerce's final checkout price is computed from.
- **SKU** — Stock Keeping Unit. The unique code identifying one specific
  sellable product variant (brand + pack size), used across Catalog,
  Inventory, and Commerce.
- **Pack size / net quantity** — The actual sellable quantity of a product
  (e.g. `500g`, `1L`), expressed in a Unit.
- **Unit of measure** — The measurement system a product's quantity is
  expressed in (kg, g, litre, ml, piece, dozen).
- **Perishable** — A product flag indicating the item has a meaningful
  shelf life, relevant to Inventory's batch/expiry/FEFO handling.
- **Attribute** — A category-scoped descriptive facet (e.g. spicy level,
  organic) with defined allowed values, used for filtering/browsing.
- **Tag** — A free-form, cross-cutting label applied to products for
  merchandising/discovery, independent of the category tree.
- **Dark store** — The fulfillment-only micro-warehouse a quick-commerce
  order ships from; not itself a Catalog concept, but the context that
  makes pack-size/perishability/SKU precision matter here.

## References

- `.claude/domain/commerce.md` — final checkout pricing, tax computation,
  order-time price snapshotting, Tax Rate ownership.
- `.claude/domain/inventory.md` — stock levels, batch/expiry tracking,
  purchase orders; the "is this in stock" question adjacent to Catalog.
- `.claude/domain/module-registry.md` — authoritative status of Products,
  Categories, Brands, and Tax Rates modules.
- `.claude/domain/domain-registry.md` — full 8-domain charter list and the
  Pricing/Tax shared-entity split.
- `Frontend/AGENTS.md` — frontend feature-first architecture and backend
  response envelope contract.
- `Backend/AGENTS.md` — backend feature-first module structure
  (controller/service/repository/model) and target `api/v1/admin/`
  module layout, including the planned `products/`, `categories/`,
  `brands/` paths.
- `Frontend/src/modules/products/types/product.ts` — current (scaffold)
  Product/CreateProductInput shape.
- `Frontend/src/modules/products/components/product-form.tsx` — current
  (scaffold) create-product form and its Zod validation.
- `Frontend/src/modules/products/api/products-api.ts` — current
  (scaffold) `/products` API client.
- `Frontend/src/config/nav.ts` — sidebar navigation source, including the
  "catalog" nav group (categories, products, brands, tax rates) and the
  broader unowned Products sub-pages (reviews, FAQs, badges,
  pending-approval).
- `.claude/agents/catalog-expert.md` — the agent that owns and maintains
  this document.
