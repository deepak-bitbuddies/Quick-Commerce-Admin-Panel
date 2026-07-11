# Platform Domain

## Purpose

**A naming note first, because this is the one place this domain's name is
genuinely ambiguous:** "Platform" here means platform-level *product/business
behavior* — configurable settings, notifications, third-party integrations,
and feature flags, all reasoned about as things an admin configures or a
customer/rider experiences. It is **explicitly not infrastructure/DevOps**
(deployment pipelines, CI/CD, servers, container orchestration, monitoring
infrastructure, uptime/alerting-as-ops-tooling). If this framework ever adds
an infrastructure/DevOps engineering role, it must be named something
distinctly different (e.g. "Infrastructure" or "DevOps," not "Platform") so
the two are never confused when someone says "ask the platform expert."
Concretely: "should SMS delivery-status alerts be configurable per store" is
this domain; "is the SMS provider's API gateway up" is not — that is
operational monitoring, out of scope here entirely.

Beyond that distinction, Platform answers: **what can an admin configure
that shapes how the platform behaves, and what triggers a notification to
whom, over what channel, using what business rule?** It is the cross-cutting
"knobs and messages" layer — every other domain owns *what happened*
(an order shipped, a flash sale started, a rider was assigned); Platform
owns *what the platform does about it in terms of settings-driven behavior
and outbound notification*, plus which third-party services the business
depends on to make that happen and how gradually a new behavior is rolled
out via feature flags.

## Ownership

Platform owns the following modules, per `.claude/domain/domain-registry.md`
(row 8) and `.claude/domain/module-registry.md`:

- App Notifications (`/app-notifications` in `Frontend/src/config/nav.ts`)
- Notifications (`/notifications` in `Frontend/src/config/nav.ts`)
- FAQs (`/faqs`)
- Settings, all its sub-pages (`/settings/system`, `/settings/web`,
  `/settings/app`, `/settings/home-general`, `/settings/authentication`,
  `/settings/email`, `/settings/payment`, `/settings/notification`,
  `/settings/delivery-boy`, `/settings/seller`, `/settings/advertisement`,
  `/settings/pos`)
- Feature Flags (not yet a nav module or backend module — see Future Growth
  Considerations; part of the charter per the Domain Registry regardless)
- Integrations, as a business-rules layer only (not yet a nav module or
  backend module — see Future Growth Considerations)

Platform does **not** own the "System" sidebar group's Cron Monitor or
System Updates entries, even though they sit directly beside Settings in
the nav. Per `.claude/domain/module-registry.md`, Cron Monitor is
**N/A — engineering-owned** (operational tooling, not a business domain),
and System Updates is only conditionally Platform's ("if release-notes/
changelog facing" — the deployment mechanics themselves stay
engineering-owned regardless of who owns any user-facing changelog copy).
Do not let sidebar adjacency imply domain ownership.

## Responsibilities

- Defining which platform-wide and per-store settings exist, their allowed
  values/ranges, and what admin role can change each one.
- Defining the trigger → recipient → channel → template chain for every
  notification the platform sends, and the business rules for when a
  notification is sent, suppressed, or forced through regardless of user
  preference.
- Maintaining FAQ content shown to admins/customers (subject to the
  staleness caveat under Edge Cases).
- Defining the business rules governing how the platform depends on and
  behaves around third-party integrations (payment gateways, SMS/push
  providers, mapping/geo services) — *when* and *under what condition* each
  is invoked, not how it is technically wired up.
- Defining feature flags: their scope (global / per-store / per-user-
  segment), rollout rules, and required lifecycle (a flag is not permanent
  configuration — see Business Rules).
- Enforcing platform-level data integrity for all of the above: settings
  validation, notification-template consistency, flag-conflict resolution.

## Business Concepts

### Settings

Settings are the configurable values that change how the platform behaves
without a code deploy. They split into two scopes:

- **Platform-wide settings** — apply everywhere unless a more specific
  scope overrides them (where overriding is actually supported): payment
  gateway configuration/business rules, email/SMS sender identity, global
  authentication policy (session timeout, password rules), advertisement
  program defaults, POS behavior defaults.
- **Per-store settings** — the ones that make sense to vary by dark store
  given the 10-minute delivery promise depends on local conditions: minimum
  order value, service hours (open/close time per store, since dark stores
  in different areas may run different hours), default delivery radius/
  serviceability distance, surge/peak-hour behavior. Whether a given setting
  is platform-wide-only or store-overridable is itself a business decision
  Platform must make explicit per setting, not assume — see Business Rules.

The current nav (`Frontend/src/config/nav.ts`) groups settings by
functional area rather than by scope (System, Web, App, Home/General,
Authentication, Email, Payment, Notification, Delivery Boy, Seller,
Advertisement, POS) — this is a UX/IA grouping, not a statement that each
page is platform-wide-only. Platform decides, per individual setting, its
true scope (platform-wide vs. per-store-overridable) when the real backend
model is designed; the nav grouping must not be read as the final word.

### Notifications

A notification is the outbound message the platform sends when something
happens. Every notification needs:

- **Trigger event** — what caused it (order status change, delivery ETA
  change, flash sale starting, wallet deposit approved, etc.). Platform does
  **not** own the event itself — it owns turning that event into a sent
  notification once another domain's event fires. See Dependencies.
- **Recipient** — customer, rider ("delivery boy" in this codebase's
  terminology), or admin/system user. The same trigger can fan out to
  multiple recipient types (e.g. "order cancelled" notifies both the
  customer and the assigned rider, each with a different template).
- **Channel** — push, SMS, email, or in-app. A recipient may have
  channel-level preferences (see Business Rules on opt-out).
- **Template** — the message content, with variables interpolated per
  trigger (order number, ETA, store name, etc.).

**App Notifications vs. Notifications — an interpretation, not a
certainty.** `Frontend/src/config/nav.ts` lists these as two separate,
same-level nav entries under the "communication" group
(`appNotifications` at `/app-notifications` with `BellIcon`, and
`notifications` at `/notifications` with `BellRingingIcon`), and
`.claude/domain/module-registry.md` lists both as Platform-owned, Planned,
with no further distinguishing note. No backend module or requirements doc
exists yet to confirm the intended split. Pending real requirements,
Platform's working interpretation is:

- **App Notifications** = the outbound, end-user-facing notifications sent
  to customers and/or riders through the mobile apps (push/in-app/SMS about
  their own orders, deliveries, promotions) — i.e. the "Notifications"
  business concept described above, scoped to end users.
- **Notifications** = admin-facing system notifications/alerts surfaced
  *inside the admin panel itself* — e.g. "5 products pending approval,"
  "seller withdrawal request awaiting review," "cron job failed" (if
  business-facing rather than pure ops noise) — informational alerts for
  the admin operating the platform, not messages sent to end users.

Treat this as the default working model until an actual PRD, wireframe, or
backend schema confirms or corrects it. Do not silently merge the two nav
entries into one concept in code or documentation without flagging that
this interpretation was revised.

### Integrations

Third-party services the platform's business processes depend on:

- **Payment gateways** — Platform owns the business rules of *when* a
  gateway is invoked (e.g. "COD is disabled above order value X," "retry a
  failed payment capture up to N times before flagging for manual
  reconciliation"), not the gateway SDK integration/API client code, which
  is Backend Engineer's job. Actual checkout payment *execution* belongs to
  Commerce (see Dependencies) — Platform's stake here is narrower: gateway
  *configuration* (which providers are enabled, in what priority/fallback
  order) as a Settings concern.
- **SMS/push notification providers** — the vendor(s) that actually deliver
  a Notification once Platform decides one should be sent. Platform owns
  "use provider A for OTP, provider B for marketing SMS" style business
  routing rules if multiple providers exist; the HTTP client and API keys
  are Backend Engineer's.
- **Mapping/geo services** — used to compute delivery radius/serviceability
  and ETA. Platform's stake is the business rule for *how* a geo result is
  used (e.g. "reject checkout if computed distance exceeds the store's
  configured delivery radius setting"), not the mapping provider's API
  integration itself, which is largely Operations/Backend Engineer
  territory for delivery-zone mechanics (see
  `.claude/domain/operations.md` once it exists, and Dependencies below).

The general split: **Platform owns the business rule of when/how an
integration is used and what setting controls it; Backend Engineer owns the
technical client/SDK/webhook implementation.** Platform is never the
authority on retry/backoff wire protocols, provider SDK versions, or API
credentials management.

### Feature Flags

A flag gates a piece of behavior on or off without a deploy — essential for
this platform's need to trial new checkout flows or dark-store-specific
experiments (e.g. a new express-checkout UI, a new surge-pricing rule) on a
subset of stores or users before a full rollout. A flag has:

- **Scope** — global (all stores/users), per-store (a subset of dark
  stores, e.g. trialing a new UI in one city first), or per-user-segment
  (e.g. only customers in a loyalty tier, or only a percentage rollout
  cohort).
- **State** — on/off, or a rollout percentage if gradual.
- **Lifecycle** — every flag must have a planned graduation point: either
  it becomes permanent (folded into a Setting or removed as a flag once the
  behavior is fully rolled out and the old path is deleted) or it is
  rolled back and removed. A flag is not meant to live indefinitely as an
  undocumented if/else — see Business Rules and Edge Cases.

No feature-flag nav entry, backend module, or admin UI exists in this
codebase today; this section describes the target business model Platform
is designing toward (see Future Growth Considerations).

## Entities

| Entity | Key fields | Notes |
|---|---|---|
| Setting | id, key, scope (platform / per-store), storeId? (when scoped), value, valueType, allowedRange/enum?, updatedBy, updatedAt | Target model; no real backend module exists yet |
| Notification | id, triggerEvent, recipientType (customer/rider/admin), recipientId, channel (push/sms/email/in-app), templateId, status (queued/sent/failed/suppressed), sentAt? | Target model |
| NotificationTemplate | id, triggerEvent, channel, body/subject, variables[], category (operational/marketing) | `category` drives the opt-out-bypass rule under Business Rules |
| NotificationPreference | id, userId, channel, category, optedIn (bool) | Per-user, per-channel, per-category opt-in/out |
| Integration | id, type (payment/sms/push/geo), provider, isEnabled, priority/fallbackOrder | Business-facing config only; technical credentials live outside Platform's model |
| FeatureFlag | id, key, scope (global/store/segment), scopeTargets[], state (on/off/percentage), rolloutPercentage?, plannedGraduationDate?, status (active/graduating/retired) | No implementation yet |
| FAQ | id, question, answer, category, displayOrder, status (active/inactive) | |

## Relationships

- **Notification → NotificationTemplate**: many-to-one; every sent
  notification uses exactly one template for its trigger+channel
  combination.
- **Notification → NotificationPreference**: a notification's actual
  delivery is gated by the recipient's preference for that channel+category,
  except where a business rule overrides it (critical operational
  notifications — see Business Rules).
- **Setting → Store**: a per-store setting references the store it
  overrides for; a platform-wide setting has no store reference and applies
  as the fallback/default.
- **FeatureFlag → Store / User Segment**: a scoped flag references the
  stores or segments it targets; a global flag references none (applies
  everywhere).
- **Integration → Setting**: which provider is active/priority-ordered for
  a given integration type is itself expressed as a Setting (e.g.
  "activePaymentGateway" as a platform-wide setting value), not a separate
  parallel configuration surface.

## Business Rules

1. **Opt-out applies to marketing/optional notifications, not operational
   ones.** A customer who has opted out of a channel/category must not
   receive notifications in that category on that channel (e.g. opted out
   of promotional push). This is a hard rule for `category = marketing`.
2. **Critical operational notifications bypass opt-out.** A notification
   whose trigger is operationally critical to the delivery promise — order
   cancelled, delivery failed, payment failed, OTP/security codes — must be
   sent regardless of the recipient's channel/category preference for that
   *category*, because "operational" and "marketing" are different
   categories by design (rule 1 only suppresses marketing-category
   notifications). Justification: a 10-minute delivery platform's core
   value proposition depends on the customer knowing immediately if
   something in their live order has gone wrong; letting a blanket
   "disable push notifications" preference silently swallow "your order
   was cancelled" would be a support/trust failure, not a minor UX
   inconvenience. Preference suppression only ever applies within the
   marketing/optional category, never to the operational category.
3. **A feature flag must have a planned removal/graduation point.** Flags
   are not permanent configuration. When a flag reaches 100% rollout with
   no regressions, either the flag is removed and its behavior becomes the
   only path, or — if it's meant to stay permanently configurable — it is
   converted into a real Setting rather than continuing to exist as a flag
   indefinitely. A flag with no planned graduation date is a defect, not a
   valid steady state.
4. **Overlapping feature flags gating the same behavior for the same user
   must not silently conflict.** If two flags could both apply to the same
   user/store for overlapping behavior (e.g. two competing checkout-flow
   experiments), Platform must define an explicit precedence rule (e.g.
   most-recently-created flag wins, or flags in the same behavior area are
   mutually exclusive by construction) rather than leaving evaluation order
   undefined.
5. **Settings must declare their own scope explicitly.** A setting is
   either platform-wide-only, or per-store-overridable with a defined
   platform-wide default/fallback — it is never ambiguous at read time
   whether a given key can vary by store.
6. **Integration provider selection is a Setting, not a code branch.**
   Which payment/SMS/push/geo provider is currently active (and any
   fallback order) must be admin-configurable via a Setting Platform
   defines, not hardcoded, so Backend Engineer's implementation reads
   provider choice as data.

## Validations

- Minimum order value: required for the setting to be meaningful, must be
  a non-negative number (zero is valid — "no minimum" — negative is not).
- Service hours: must be a valid time range (open time strictly before
  close time in the store's local time, or an explicit "24 hours" flag
  rather than an open==close range meaning something ambiguous).
- Default delivery radius: must be a positive number, in a consistent unit
  (km), and should not be set to a value that would make the store's own
  location infeasible (radius of 0 is not a valid "operating" store).
- Notification template: every template must resolve all variables it
  references (no template referencing a variable the trigger event never
  supplies); a template must exist for every enabled trigger+channel
  combination before that combination can be marked active.
- Feature flag rollout percentage: 0-100 inclusive; a percentage-scoped
  flag without a percentage value is invalid.
- Feature flag scope targets: a store-scoped or segment-scoped flag must
  reference at least one valid store/segment; an empty target list on a
  non-global flag is invalid (equivalent to "off everywhere," which should
  just be expressed as `state = off`, not an empty-target on-state).
- FAQ: question and answer both required non-empty; category must
  reference a real category grouping (not free text per entry, to keep the
  FAQ list navigable).

## Edge Cases

- **A notification's category is ambiguous at authoring time** (e.g. is
  "your order is running 5 minutes late" operational or a courtesy/
  marketing-adjacent nice-to-have?): default to treating ETA/order-status
  changes as operational (bypasses opt-out) since the 10-minute promise
  makes delay communication safety/trust-adjacent, not promotional; only
  explicitly promotional content (offers, re-engagement nudges) is
  marketing-category.
- **User has opted out of all channels for a category that includes a
  critical trigger**: the operational bypass (Business Rule 2) still
  applies — there is no user-configurable way to fully silence critical
  operational notifications, by design.
- **Two feature flags gate overlapping checkout-flow behavior for the same
  user**: resolved by Business Rule 4's precedence requirement; must never
  be resolved by "whichever code path happened to check its flag last" at
  runtime.
- **A feature flag never gets graduated or removed**: not automatically
  enforced by the system (no hard expiry), but should be surfaced as a
  maintenance/cleanup concern — an indefinitely-lived flag is technical
  debt Platform should flag for review, not silently tolerate.
- **FAQ content goes stale** (e.g. references a promo that ended, or a
  policy that changed): there is no automatic staleness rule or expiry
  mechanism. This is a content-maintenance concern adjacent to
  Documentation-type processes — Platform owns the FAQ data model and
  publishing mechanism, but keeping content current is an editorial/ops
  responsibility outside any enforced business rule.
- **A per-store setting has no override and the store is new**: falls back
  to the platform-wide default; a store must never be left with an
  undefined value for a setting Platform has scoped as per-store-
  overridable.
- **Integration provider is disabled while it's the only enabled provider
  of its type**: should be blocked or require an explicit "no provider
  active" acknowledgment — disabling the last active payment gateway, for
  instance, would silently break checkout platform-wide.

## Dependencies

- **`.claude/domain/commerce.md` (Commerce)** — the source of order-
  lifecycle events (placed, cancelled, refunded, delivery failed) that are
  among Platform's most operationally critical notification triggers.
  Commerce owns the event and its business meaning; Platform owns turning
  that event into an actual sent notification, choosing recipient/channel/
  template, and applying opt-out/bypass rules.
- **`.claude/domain/marketing.md` (Marketing)** — the source of
  promotional-notification triggers (flash sale starting, new coupon
  available). These are marketing-category notifications subject to full
  opt-out (Business Rule 1), unlike Commerce-sourced operational ones.
  Marketing also owns Banners, which are a distinct on-platform surface
  Platform does not manage.
- **`.claude/domain/operations.md` (Operations)** — the source of
  delivery/rider-related events (delivery boy assigned, ETA recalculated)
  and the owner of delivery zones/serviceability geography that Platform's
  geo-integration business rules (e.g. delivery-radius setting validation)
  must respect rather than redefine.
- **Backend Engineer / `Backend/AGENTS.md`** — owns the technical
  implementation of every Settings/Notifications/Integrations/Feature-Flag
  business rule Platform defines: the `settings/` and `notifications/`
  module paths are already named in the target `api/v1/admin/` folder
  structure (no `integrations/` or `feature-flags/` path is listed yet —
  see Future Growth Considerations), background jobs for outbound
  notification delivery per rule 26 of that document ("Background jobs
  (emails, notifications, inventory sync, cleanup, analytics) are
  implemented as jobs, never inline in controllers"), and all provider
  SDK/API-client code for integrations.
- **`.claude/domain/module-registry.md`** — authoritative status tracker;
  currently lists App Notifications, Notifications, FAQs, and Settings all
  as Planned with no implementation, and explicitly marks Cron Monitor as
  N/A-engineering-owned and System Updates as conditionally Platform's.
  Update this file (via the Documentation Engineer) whenever a Platform
  module's status changes.

## Explicit Non-Responsibilities

- **Infrastructure/DevOps** — deployment pipelines, CI/CD, server
  provisioning, container orchestration, monitoring/alerting infrastructure
  itself. This is the naming distinction called out in Purpose: "Platform"
  in this framework never means infra/DevOps.
- **Cron Monitor** — explicitly N/A/engineering-owned per the Module
  Registry, despite sitting next to Settings in the "System" nav group.
- **System Updates' deployment mechanics** — even where the release-
  notes/changelog *content* might be Platform's if that page is ever
  built, the actual deployment process behind it stays engineering-owned
  regardless.
- **The business event a notification is triggered by** — Commerce,
  Marketing, and Operations own their own domain events (order status
  changes, flash sale starts, delivery assignment). Platform only owns
  what happens *after* the event fires: recipient/channel/template
  selection and delivery-suppression rules.
- **Final checkout payment execution** — Commerce owns actually charging
  the customer; Platform only owns which payment gateway is configured/
  enabled as a Setting and the business rules for gateway fallback.
- **Delivery-zone geography and serviceability determination itself** —
  Operations. Platform's geo-integration concern is narrower: how a
  computed distance/ETA feeds into a Setting-driven business rule (e.g.
  radius-based checkout rejection), not defining the zones themselves.
- **Third-party SDK integration code, API credentials, webhook handling** —
  Backend Engineer. Platform owns the business rule of when/how an
  integration is invoked, never the technical client implementation.
- **Roles & Permissions** — Identity, even though "which admin role can
  change a Setting" (a Platform responsibility) depends on Identity's role
  model; Platform consumes that model, it does not define roles.

## Future Growth Considerations

- **No backend module exists yet for any Platform-owned area.** Settings
  and Notifications are at least named in the target `api/v1/admin/`
  folder structure in `Backend/AGENTS.md`; FAQs, Integrations, and Feature
  Flags are not named anywhere yet. All of this document's Entities are
  target models, not implemented schemas.
- **Feature Flags has no nav entry, module-registry row, or backend path
  at all.** It is part of Platform's charter per the Domain Registry, but
  will need its own Dynamic Domain Evolution-style scoping pass (admin UI
  for creating/targeting/graduating flags, an evaluation SDK for
  Frontend/Backend to check a flag's state) before it is anything more
  than the business model described here.
- **Integrations has no dedicated admin UI concept yet either** — today,
  provider choice would most plausibly surface as fields inside the
  existing Payment/Email/Notification Settings pages
  (`/settings/payment`, `/settings/email`, `/settings/notification`)
  rather than a standalone "Integrations" nav module. Whether Integrations
  ever becomes its own nav entry, or stays folded into Settings pages, is
  an open IA decision.
- **App Notifications vs. Notifications needs confirmation.** As flagged
  in Business Concepts, the current split is Platform's best-guess
  interpretation from nav labels/icons alone (`BellIcon` vs.
  `BellRingingIcon`, "communication" nav group) — this should be revisited
  and either confirmed or corrected the moment real requirements,
  wireframes, or a backend schema exist for either module.
- **Per-store vs. platform-wide scope needs to be assigned setting-by-
  setting.** The current Settings nav groups pages by functional area
  (System/Web/App/Home-General/Authentication/Email/Payment/Notification/
  Delivery-Boy/Seller/Advertisement/POS), not by scope. Before the real
  backend model is built, each individual setting within those pages needs
  an explicit scope decision (see Business Rule 5) — this is real design
  work, not a given.
- **Notification delivery reliability/observability** (retry on failed
  send, dead-letter handling for undeliverable notifications) will need
  business rules once real send volume exists — e.g. how many retries
  before an operational notification failure itself needs to alert an
  admin. Not yet specified because no notification-sending code exists.

## Glossary

- **Platform (this domain)** — platform-level product/business behavior:
  settings, notifications, integrations, feature flags. **Not**
  infrastructure/DevOps; see the naming note in Purpose.
- **Setting** — an admin-configurable value that changes platform behavior
  without a code deploy; may be platform-wide or per-store.
- **Notification** — an outbound message triggered by a domain event, sent
  to a recipient over a channel using a template.
- **App Notifications** — Platform's working interpretation: end-user-
  facing notifications sent to customers/riders through the mobile apps.
  Unconfirmed pending real requirements — see Business Concepts and Future
  Growth Considerations.
- **Notifications** — Platform's working interpretation: admin-facing
  system alerts surfaced inside the admin panel itself. Unconfirmed, same
  caveat.
- **Operational category** — a notification category (order cancelled,
  delivery failed, OTP) that bypasses recipient opt-out preferences because
  it is safety/trust-critical to the delivery promise.
- **Marketing category** — a notification category (promotions, flash-sale
  announcements) fully subject to recipient opt-out.
- **Feature Flag** — a toggle gating a piece of behavior on/off or by
  rollout percentage, scoped globally, per-store, or per-user-segment, with
  a required planned graduation/removal point.
- **Integration** — a third-party service (payment gateway, SMS/push
  provider, mapping/geo service) the platform's business processes depend
  on; Platform owns the business rules of when/how it's used, not its
  technical implementation.
- **Dark store** — the fulfillment-only micro-warehouse a quick-commerce
  order ships from; relevant here because per-store Settings (service
  hours, delivery radius, minimum order value) exist because dark stores
  genuinely vary from one another.

## References

- `.claude/domain/commerce.md` — order-lifecycle events that source
  Platform's most operationally critical notification triggers; owns final
  checkout payment execution that Platform's payment-gateway Setting only
  configures, not executes.
- `.claude/domain/marketing.md` — source of promotional-notification
  triggers (flash sales, coupons); owns Banners, a separate on-platform
  surface Platform does not manage.
- `.claude/domain/operations.md` — source of delivery/rider events and
  owner of delivery-zone geography Platform's geo-integration rules must
  respect rather than redefine.
- `.claude/domain/domain-registry.md` — full 8-domain charter list,
  including Platform's row 8 charter and the explicit infra/DevOps naming
  caveat.
- `.claude/domain/module-registry.md` — authoritative status of App
  Notifications, Notifications, FAQs, Settings (all Planned); Cron
  Monitor (N/A-engineering-owned) and System Updates (conditionally
  Platform's) sitting adjacent in the "System" nav group.
- `Backend/AGENTS.md` — backend feature-first module structure; names
  `settings/` and `notifications/` in the target `api/v1/admin/` folder
  layout (rule set includes background-job handling for notification
  sending, rule 26); no `integrations/` or `feature-flags/` path exists
  yet.
- `Frontend/src/config/nav.ts` — sidebar navigation source: the
  "communication" nav group (App Notifications, Notifications, FAQs,
  Delivery Zones) and the "system" nav group's Settings sub-pages, Cron
  Monitor, and System Updates entries.
- `.claude/agents/platform-expert.md` — the agent that owns and maintains
  this document.
