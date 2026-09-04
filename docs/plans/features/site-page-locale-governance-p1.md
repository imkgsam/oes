# Site Page Locale Governance P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement OES-governed SitePage and site-locale exposure so Storefront page capabilities are discovered automatically, published state is synchronized atomically, and locale-aware routing/SEO follows one local Runtime state.

**Architecture:** Storefront declares only stable page identities and supported locales. `@oes/site-runtime-kit` registers that complete manifest idempotently at startup and stores the committed Site Exposure Publication locally. `site-service` owns discovery, SitePage governance, site-level locale activation, drift blocking, publishVersion and audit; Storefront executes routing and SEO from Runtime-local state. Dynamic resources publish locale versions independently.

**Tech Stack:** NestJS, TypeScript, Prisma/SQLite, gRPC contracts, API Gateway BFF, Nuxt 3 Storefront, Vitest/Node test suites.

---

This feature packet records execution scope, path ownership, task state, and acceptance status only. Stable service boundaries and object semantics remain defined by the corresponding files under `docs/architecture/` and `docs/contracts/site-service/`.

## Frozen scope

- The site locale switch is the only locale exposure switch. There is no page-by-locale enable matrix.
- SitePage enable/index intent is page-wide for all active site locales; sitemap eligibility is derived by Storefront / Runtime.
- Static pages must declare support for every active site locale before locale activation succeeds.
- Dynamic resource locale versions publish independently. Missing locale versions return 404 and are excluded from lists, sitemap and hreflang; there is no language fallback.
- Runtime startup capability registration is idempotent discovery only. It never enables pages, resets Admin configuration, advances publishVersion or sends publish webhook.
- A new capability is discovered disabled. A disappeared enabled capability creates drift and blocks the next Sync; Runtime outage alone does not delete capability history.
- Site Exposure Publication is a versioned, public-safe sync payload separate from slug-bearing business public views.
- Default locale is unprefixed; default-locale prefixed URLs 301 to the unprefixed canonical; other effective locales use a prefix; invalid/disabled/missing-locale pages 404.
- Meilong Content Category archive canonicals are frozen exclusively at `/blogs/categories/:categorySlug` and `/news/categories/:categorySlug`; retired development namespaces are terminal 404 without redirects or compatibility entry points.
- Meilong Blog list/detail canonicals use `/blogs` and `/blogs/:slug`; retired development aliases are terminal 404 without redirects or compatibility entry points.
- Meilong does not expose a Product Category list/detail SitePage or an all-products list SitePage. Product detail remains a separate deferred product-design concern.
- Meilong's Collection root entry is `/product/collections`. Retired root paths are terminal 404 without compatibility entry points. Existing `/collections/:slug` detail routes remain, but first-class Collection resource and locale-publication governance is a separate design gap and is not frozen by this packet.
- The Product Master–Site Product / `SiteProductPublication` identity, mapping and lifecycle relationship remains deferred to a separate product design. This packet does not freeze that relationship, and existing Product public-view reads are not evidence that it is complete.
- Storefront public proxies must preserve deterministic Runtime 400/404 semantics and reject repeated or non-string query values instead of defaulting them or rewriting them as Runtime outages.
- Blog / News archive pagination must not truncate at one Runtime reader page. Each returned archive page is assembled inside one Runtime publication fence; valid page-number routes render from a stable ordered result, use the agreed canonical/index policy, and remain consistent with sitemap-visible detail resources.
- Content Category directory reads are gated by the consuming SitePage capability (list, detail, or category archive), not globally coupled to the Blog / News list-page switch.
- Storefront Frontend never calls OES directly or reads Runtime SQLite directly.

## Dependencies and sequencing

1. The contract and truth-source changes in this packet are prerequisites for all production code.
2. Backend owns the signed registration endpoint, persisted discovery/governance state, preflight, publish payload and BFF contracts.
3. Runtime Kit depends on the backend contract and owns registration, local governance persistence/readers, atomic sync and missing-resource convergence.
4. Admin UI depends on the Backend BFF contract and owns only tenant-web presentation and commands.
5. Storefront depends on the Runtime Kit reader and owns manifest declaration, route guards, canonical/lang/hreflang, sitemap and static locale implementation.
6. Do not start parallel production implementation until the backend/contract task has frozen generated contracts. After that, Runtime SDK, Admin and Storefront can work in parallel if they touch only their allowed paths.

## Allowed path ownership

### Backend / contract thread

May modify only:

- `src/common/src/contracts/site_service/**` and generated output through the repository generation command;
- `src/services/system/site-service/prisma/schema.prisma` and one dedicated migration;
- `src/services/system/site-service/src/domain/site-page/**` and related domain publication/sync files;
- `src/services/system/site-service/src/application/services/site-admin-application.service.ts`;
- `src/services/system/site-service/src/application/services/site-runtime-application.service.ts`;
- `src/services/system/site-service/src/infrastructure/repositories/prisma-site.repository.ts`;
- `src/services/system/site-service/src/interfaces/grpc/site-admin.grpc.controller.ts`;
- `src/services/system/site-service/src/interfaces/grpc/site-runtime.grpc.controller.ts`;
- `src/services/api-gateway/src/modules/site-management-bff/**`;
- `src/services/api-gateway/src/modules/site-runtime-bff/**`;
- backend contract/unit/integration tests in the corresponding service test directories.

Must not modify Storefront, Runtime Kit or tenant-web files.

### Runtime SDK thread

May modify only:

- `src/site-runtime/site-runtime-kit/src/types.ts`;
- `src/site-runtime/site-runtime-kit/src/client/**`;
- `src/site-runtime/site-runtime-kit/src/runtime/**`;
- `src/site-runtime/site-runtime-kit/src/nestjs/**`;
- `src/site-runtime/site-runtime-kit/src/store/**`;
- `src/site-runtime/site-runtime-kit/src/sync/**`;
- `src/site-runtime/site-runtime-kit/src/public-views/**`;
- `src/site-runtime/site-runtime-kit/src/index.ts` and package metadata if required;
- matching `src/site-runtime/site-runtime-kit/test/**`.

Must not modify OES service/schema/proto, tenant-web or Meilong page/layout files.

### Storefront / Site instance thread

May modify only:

- `src/site-runtime/meilong-ceramics-site/runtime/src/**`;
- `src/site-runtime/meilong-ceramics-site/storefront/app.vue`, only to install the root-owned committed exposure head lifecycle required by Task 4;
- `src/site-runtime/meilong-ceramics-site/storefront/components/BlogCategoryNav.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/components/BlogDetailReplica.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/components/NewsArchive.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/components/NewsArticleView.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/components/PublishedResourcePage.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/components/SiteHeader.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/components/home/HomeReplicaFooter.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/components/product/KohlerProductDetailReplica.vue`;
- `src/site-runtime/meilong-ceramics-site/storefront/pages/**`;
- `src/site-runtime/meilong-ceramics-site/storefront/middleware/**` and route rules;
- `src/site-runtime/meilong-ceramics-site/storefront/composables/**`;
- `src/site-runtime/meilong-ceramics-site/storefront/server/api/**`;
- `src/site-runtime/meilong-ceramics-site/storefront/server/routes/**`;
- `src/site-runtime/meilong-ceramics-site/storefront/server/utils/**`;
- `src/site-runtime/meilong-ceramics-site/storefront/utils/archive-route-key.ts`;
- `src/site-runtime/meilong-ceramics-site/storefront/utils/news-archive-pagination.ts`;
- `src/site-runtime/meilong-ceramics-site/storefront/utils/news-archive-session-cache.ts`;
- `src/site-runtime/meilong-ceramics-site/storefront/utils/news-date-filter.ts`;
- `src/site-runtime/meilong-ceramics-site/storefront/types/**`;
- `src/site-runtime/meilong-ceramics-site/storefront/nuxt.config.ts`;
- `src/site-runtime/meilong-ceramics-site/scripts/verify-meilong-boundaries.mjs`;
- `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`;
- `src/site-runtime/meilong-ceramics-site/storefront/src/tests/utils/archive-route-state.unit.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/content-archive.integration.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/content-category-archive.integration.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/meilong-seed-exposure.integration.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/runtime-controller-boundary.contract.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/site-capability-manifest.contract.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/site-exposure-service.integration.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/site-public-surface.integration.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/test/storefront-public-proxy.contract.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/storefront/src/tests/types/storefront-route-policy.unit.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/tests/nuxt-server-globals.d.ts`;
- `src/site-runtime/meilong-ceramics-site/jest.config.cjs`;
- `src/site-runtime/meilong-ceramics-site/tsconfig.tests.json`.

Must not modify Runtime Kit, OES service, API Gateway or tenant-web.

### Unified acceptance owner / thread

May modify only:

- `src/site-runtime/meilong-ceramics-site/scripts/locale-governance-acceptance-harness.ts`;
- `src/site-runtime/meilong-ceramics-site/scripts/locale-governance-gateway-harness.ts`;
- `src/site-runtime/meilong-ceramics-site/scripts/verify-locale-governance-acceptance.ts`;
- `src/site-runtime/meilong-ceramics-site/test/locale-governance-acceptance-harness.node.integration.spec.ts`;
- `src/site-runtime/meilong-ceramics-site/tsconfig.acceptance.json`;
- `src/site-runtime/meilong-ceramics-site/package.json`, only the `scripts.test:acceptance:locale-governance` entry;
- `src/site-runtime/meilong-ceramics-site/storefront/src/tests/types/public-read-error.unit.spec.ts` and `src/site-runtime/meilong-ceramics-site/storefront/src/tests/server/sitemap-policy.unit.spec.ts`, the focused runtime-policy coverage retained after the mixed source-text suite was split.

Must not modify production Runtime, Storefront behavior, Runtime Kit, OES services, API Gateway, tenant-web, schema, proto or stable architecture/contracts. Cross-boundary execution state is recorded in this feature packet rather than in the Meilong runbook.

### OES Admin thread

May modify only:

- `app/web/apps/tenant-web/src/api/bff/site-management/**`;
- `app/web/apps/tenant-web/src/views/admin/site-management-detail.vue` and its tests;
- `app/web/apps/tenant-web/src/locales/langs/en-US/page.json`;
- `app/web/apps/tenant-web/src/locales/langs/zh-CN/page.json`;
- necessary tenant-web test mocks.

Must not modify backend contracts, Runtime Kit or Storefront.

## Task 0: Contract and truth-source freeze

**Files:**

- Modify: `docs/architecture/services/site-service.md`
- Modify: `docs/architecture/platforms/site-runtime-architecture.md`
- Modify: `docs/architecture/platforms/site-runtime-kit.md`
- Modify: `docs/contracts/site-service/README.md`
- Modify: `docs/contracts/site-service/sync-api.md`
- Modify: `docs/contracts/site-service/public-views.md`
- Modify: `docs/contracts/site-service/admin-bff.md`
- Create: `docs/contracts/site-service/page-capabilities-and-exposure.md`

- [x] Verify the stable rules in this packet exactly match the frozen design workspace.
- [x] Ensure no document describes page-by-locale enable switches or global all-resource locale completeness.
- [x] Ensure Site Exposure Publication is separate from slug-bearing business public views.
- [x] Ensure the contract index points to the new contract and identifies the stable truth sources.
- [x] Record the remaining implementation-only choices in the feature packet rather than in architecture truth.

Verification:

```bash
rg -n "SitePage.*按页面.*locale|按页面与 locale 独立治理|全部 active locale versions|active 语言必须完整" \
  docs/architecture docs/contracts/site-service
```

Expected: no conflicting stable rule remains; intentional negative statements such as “不提供页面 × locale” are allowed, while old positive page-by-locale or global-completeness rules are removed or marked superseded.

## Task 1: OES backend and BFF

**Files:** See Backend / contract thread allowed paths above.

- [x] Add isolated domain concepts for discovered Storefront page capability, SitePage governance, and capability drift; keep discovery facts separate from operator configuration.
- [x] Add idempotent signed Runtime registration handling for a complete page identity + supported-locale manifest. Re-registration refreshes discovery metadata only.
- [x] Persist new capability as disabled by default; preserve existing governance configuration across repeated registration, Runtime outage and capability reappearance.
- [x] Mark enabled capability removal as drift and make Sync preflight fail closed with a machine-readable reason; do not silently unpublish the current production version.
- [x] Make site locale activation validate every enabled static page has a registered implementation for that locale. Do not require all historical dynamic resources to be translated.
- [x] Allow dynamic resource locale versions to publish independently and adjust Blog/News/Category completeness checks to the locale being published.
- [x] Add SitePage page-wide enabled/index governance commands and queries; derive sitemap eligibility in Runtime/Storefront. Do not add page-by-locale switches, page kind, layout or content editing.
- [x] Include Site Exposure Publication in the same publishVersion/delta/batch/snapshot path as affected public views, without forcing it through the slug-bearing public-view envelope.
- [x] Keep no-change Sync from advancing publishVersion or sending Webhook; ensure drift/preflight failures do the same.
- [x] Add audit records for capability registration, governance changes, drift and drift recovery.
- [x] Add contract tests for registration idempotency, config preservation, new capability default-off, drift block/recovery, locale activation readiness, per-resource locale publishing, and exposure publication versioning.

Verification:

```bash
pnpm proto:lint
pnpm --filter site-service test
pnpm --filter site-service build
pnpm --filter api-gateway exec jest src/modules/site-management-bff src/modules/site-runtime-bff --runInBand
pnpm --filter api-gateway build
```

## Task 2: Runtime SDK and Site Runtime Kit

**Files:** See Runtime SDK allowed paths above.

- [x] Add a validated capability manifest input to Runtime initialization; reject page kind, layout, component, content, resource and internal-route data.
- [x] Register the complete manifest during Runtime startup through the signed Site-facing client. Make retries and duplicate startup calls idempotent.
- [x] Add local storage/read abstractions for committed Site Exposure Publication and capability discovery/drift status without exposing secrets.
- [x] Extend snapshot and delta application so exposure governance and affected resource removals commit atomically with the target publishVersion.
- [x] Apply `missing_resources` as local unpublish/removal convergence; never leave stale published rows after OES says a resource is not visible.
- [x] Preserve the last complete committed version when sync fails; do not expose half-applied page or locale governance.
- [x] Expose a public-safe reader for Storefront routing and SEO decisions: effective site locales, enabled page capabilities, page index eligibility, and published resource availability.
- [x] Add startup registration, duplicate registration, capability disappearance/recovery, atomic exposure sync, missing-resource convergence and failure-preserves-old-version tests.
- [x] Add the package-level `typecheck` script required by this packet's verification gate; it must perform a no-emit TypeScript check rather than aliasing tests.

Verification:

```bash
pnpm --dir src/site-runtime/site-runtime-kit test
pnpm --dir src/site-runtime/site-runtime-kit typecheck
pnpm --dir src/site-runtime/site-runtime-kit build
```

## Task 3: OES Admin UI

**Files:** See OES Admin allowed paths above.

- [x] Add a Pages capability section to the existing Site Management detail workspace; do not add a new global navigation route.
- [x] Show discovered page identities, supported locales, discovery freshness, current enabled/index configuration and derived sitemap eligibility, pending sync state and capability drift.
- [x] Provide page-wide enable/disable and index governance actions; do not render a page-by-locale enable matrix or independent sitemap toggle.
- [x] Show locale activation readiness failures for missing static page capability coverage.
- [x] Show dynamic resource locale completeness only for the resource being published; do not present a fake requirement that all historical resources be translated.
- [x] Keep operator permissions, tenant context, audit feedback and existing explicit Sync workflow intact.
- [x] Add UI/API tests using actual BFF response shapes for new capability, drift, governance and readiness states.

Verification:

```bash
pnpm --dir app/web exec vitest run \
  apps/tenant-web/src/api/bff/site-management/index.spec.ts \
  apps/tenant-web/src/views/admin/site-management-detail.spec.ts --dom
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

## Task 4: Meilong Storefront and Site Runtime integration

**Files:** See Storefront / Site instance allowed paths above.

- [ ] Declare the current Meilong stable page identities and actual supported locales from the Storefront runtime; do not declare layout or internal file paths.
- [ ] Pass the declaration to Runtime Kit at startup and fail readiness/degrade safely if registration cannot be completed according to the backend contract.
- [ ] Add one route policy for default-locale unprefixed canonical, default-locale prefix 301, effective non-default locale prefixes, invalid/disabled locale 404 and no language fallback.
- [ ] Apply the SitePage page-wide enable gate and dynamic resource locale availability gate before rendering lists, details or archives.
- [ ] Ensure untranslated in-scope dynamic Blog / News resources are omitted from locale lists and return 404 at locale-specific detail URLs.
- [ ] Make static page locale support explicit and ensure site locale activation is blocked before unsupported enabled static pages can go live.
- [ ] Generate canonical, `html lang`, hreflang, noindex, sitemap and robots from one Runtime-local committed governance state. Do not call OES from request-time SSR.
- [ ] Normalize list/archive errors so invalid locale, disabled page and missing resource are deterministic 404 responses rather than mixed 502/null behavior.
- [ ] Use only the frozen plural Content Category archive paths in pages, internal links, canonical/hreflang, sitemap, historical-slug redirect targets and tests; every retired development path must return 404 without compatibility redirects.
- [ ] Keep every retired development alias terminal 404; retain 301 only for real published resource/category historical slugs and the required default-locale prefix normalization.
- [ ] Remove Product Category list/detail and all-products list SitePage declarations/routes, and move the Collection root entry to `/product/collections` without adding development-path compatibility redirects.
- [ ] Normalize and safely decode public paths before terminal namespace classification; malformed encodings fail closed, locale tags use canonical casing, and encoded retired paths cannot diverge from Runtime SEO filtering.
- [ ] Validate all Nuxt public-proxy query values as zero-or-one strings and preserve Runtime 400/404 status semantics.
- [ ] Make Content Category directory governance operation-aware so list, detail and category archive capabilities remain independently switchable.
- [ ] Implement non-truncating Blog / News archive pagination from one Runtime publication attempt; verify more than 48 resources, locale isolation, date/category filters, load-more/page navigation, and sitemap/list consistency.
- [ ] Render valid later Content Category pages with the frozen pagination SEO policy; reserve 404 for missing/out-of-range pages rather than using index eligibility as existence.
- [ ] Add tests for default prefix 301, invalid locale 404, no fallback, missing dynamic locale 404, page-wide disable, static capability coverage, noindex/sitemap exclusion and hreflang generation.

Verification:

```bash
pnpm --dir src/site-runtime/meilong-ceramics-site typecheck
pnpm --dir src/site-runtime/meilong-ceramics-site build
pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
pnpm --dir src/site-runtime/meilong-ceramics-site verify
```

## Unified acceptance gate

The implementation threads own unit and local integration tests. A separate acceptance task must close the cross-boundary flow after all four lanes are ready. Current execution is deliberately phased, and every phase remains unchecked until its live boundary assertions pass:

- [ ] **Phase A — credential and idempotent capability registration:** issue the exact five-scope Runtime credential through Admin HTTP; start Runtime twice over the same SQLite store; prove the complete manifest is registered once and existing page governance is not reset. The strict runner and harness tests exist, but live execution is blocked only because the required disposable PostgreSQL URL and explicit disposal confirmation are not set in this environment. A successful runner output still reports `unifiedAcceptanceClosed: false`.
- [ ] **Phase B — governance publication:** enable a page and index policy through Admin, perform Sync, commit one matching Runtime exposure version, and prove no-change Sync does not advance publication state.
- [ ] **Phase C — Storefront and SEO convergence:** route and render from that same committed state; verify canonical, `html lang`, hreflang, robots and sitemap agreement; verify only the frozen plural Content Category archive canonicals and `/product/collections` are exposed, with retired paths returning terminal 404 without redirect; verify the capability manifest and route inventory contain no Product Category list/detail or all-products list SitePage.
- [ ] **Phase D — drift and recovery:** remove an enabled capability, prove the next Sync is blocked without deleting the prior production version, then restore the capability and prove recovery.
- [ ] **Phase E — locale isolation:** prove an untranslated dynamic resource is absent only from its locale, and prove a disabled site locale disappears consistently from pages, sitemap and hreflang after one Runtime version switch.
- [ ] **Phase F — outage continuity:** stop the upstream Runtime sync boundary and prove Storefront continues serving the last complete committed version without mixed state.

Task 4 and the Unified acceptance checkboxes remain unchecked. Phase A harness availability and local static/unit gates do not constitute live E2E acceptance. Phases B–F are not implemented by the current runner.

This gate does not freeze first-class Collection resource governance or the Product Master–Site Product relationship. Both remain independently deferred and must not be inferred from the retained Collection root/detail routes or existing Product public reads.

## Handoff requirements

Each implementation thread must return:

- scope and allowed paths used;
- files changed;
- contract/data behavior changed;
- tests and exact commands run;
- known risks or blocked dependencies;
- handoff to the unified acceptance owner.
