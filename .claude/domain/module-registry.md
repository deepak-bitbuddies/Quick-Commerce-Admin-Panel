# Module Registry

Maps every known module — built, in progress, or only planned in the
sidebar nav (`Frontend/src/config/nav.ts`) — to its owning domain expert(s).
This is **step 0** of every feature request (`CLAUDE.md`): look here before
reasoning about domain from scratch. A module not listed here is new — run
Dynamic Domain Evolution, don't guess.

Status values: **Built** (real backend + frontend code exists), **Scaffolded**
(a demo/placeholder implementation exists, not the real feature), **Planned**
(nav entry exists, shows `ComingSoon`, no implementation yet), **N/A**
(engineering-owned, no domain expert applies).

| Module | Owning expert(s) | Status | Notes |
|---|---|---|---|
| Auth (login/logout) | Identity | **Built** | `Backend/src/api/v1/admin/auth/`, `Frontend/src/modules/auth/` |
| Users (admin CRUD) | Identity | **Built** (backend only) | `Backend/src/api/v1/admin/users/`; no frontend consumer yet |
| Products | Catalog | **Scaffolded** | Demo form (`Frontend/src/modules/products/`) wired to dashboard home, not the real `/products` page (which still shows `ComingSoon`) |
| Categories | Catalog | Planned | |
| Brands | Catalog | **Built** | `Backend/src/api/v1/admin/brands/`, `Frontend/src/modules/brands/` |
| Tax Rates | Commerce | Planned | Rate *definition* kept with Commerce, which owns pricing/tax wholesale — see Domain Registry's shared-entity notes |
| Dashboard (home) | *(composed view, no single owner)* | **Built** (scaffold content) | Currently renders the Products demo form; not itself a business module |
| POS Dashboard | Commerce | Planned | Point-of-sale is order creation |
| Orders | Commerce | Planned | |
| Return Requests | Commerce | Planned | |
| Dispatch Management | Operations | Planned | |
| Customers | Identity (primary) + Commerce (order history) | Planned | See Domain Registry shared-entity note |
| Seller Management | Operations | Planned | Vendors |
| Stores | Inventory (stock) + Operations (place) | Planned | See Domain Registry shared-entity note |
| Manage Delivery Boys | Operations (scheduling) + Identity (account) | Planned | See Domain Registry shared-entity note |
| Banners | Marketing | Planned | |
| Manage Featured Section | Marketing | Planned | |
| Promos | Marketing | Planned | |
| Ad Campaigns | Marketing | Planned | |
| App Notifications | Platform | Planned | |
| Notifications | Platform | Planned | |
| FAQs | Platform | Planned | |
| Delivery Zones | Operations | Planned | |
| Roles & Permissions | Identity | Planned | |
| Settings | Platform | Planned | |
| Cron Monitor | **N/A — engineering-owned** | Planned | Operational tooling, not a business domain |
| System Updates | Platform (if release-notes/changelog facing) | Planned | Deployment mechanics themselves are engineering-owned regardless |

## Maintenance

Updated by the Documentation Engineer at the end of any feature that
introduces a new module or changes a module's status
(Planned → Scaffolded → Built). New rows for genuinely new modules go
through Dynamic Domain Evolution first if no existing expert clearly owns
them.
