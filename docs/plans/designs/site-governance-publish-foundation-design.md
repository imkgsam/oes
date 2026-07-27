# Site Governance Publish Foundation Design

```text
designKey: site-governance-publish-foundation-design
thread: BLOG-NEWS-MEILONG-RUNTIME-DISPLAY
status: SUPERSEDED_BY_TRUTH_SOURCE
truthSource: docs/architecture/services/site-service.md
runtimeTruthSource: docs/architecture/site-runtime-kit.md
createdAt: 2026-07-01
lastUpdatedAt: 2026-07-02
doNotUseAsStableSource: true
```

## 1. Purpose

This workspace records the Site boundary convergence discussion for OES external site governance, publishing, Runtime sync, and Storefront display ownership.

This workspace is superseded. Use the truth sources listed above, the Site Service contracts, and `docs/plans/features/site-governance-publish-foundation.md` as the current stable sources.

It exists because the earlier Blog / News P1 implementation work mixed several concerns:

- OES-side site governance and publish contracts.
- Runtime local store and public view sync.
- Storefront visual rendering and static page ownership.
- Blog / News / Topic SEO archive display.

The current direction is to proceed step by step. The first implementation slice should not try to deliver the final Site platform. It should converge the existing implementation around a clean foundation:

```text
OES manages governed data, publication, credentials, sync state, preview contracts, and OES-owned public resources.
Site Runtime syncs published public views into a local store.
Storefront owns page shell, navigation, footer, static pages, frontend logo usage, component layout, visual rendering, and static redirects.
```

This workspace does not replace the service truth source. Frozen conclusions must be written back to:

- `docs/architecture/services/site-service.md`
- `docs/architecture/site-runtime-architecture.md`
- `docs/architecture/site-runtime-kit.md`
- `docs/contracts/site-service/**`
- relevant feature packets under `docs/plans/features/**`

## 2. Read Sources

This design round has aligned against:

- `AGENTS.md`
- `docs/architecture/services/site-service.md`
- `docs/architecture/site-runtime-architecture.md`
- `docs/architecture/site-runtime-kit.md`
- `docs/contracts/site-service/README.md`
- `docs/contracts/site-service/admin-bff.md`
- `docs/contracts/site-service/public-views.md`
- `docs/contracts/site-service/preview-and-runtime-status.md`
- `docs/contracts/site-service/sync-api.md`
- `src/site-runtime/meilong-ceramics-site/README.md`
- `src/site-runtime/site-runtime-kit/README.md`

Implementation was inspected read-only in:

- `src/services/system/site-service/**`
- `src/services/api-gateway/src/modules/site-management-bff/**`
- `src/services/api-gateway/src/modules/site-runtime-bff/**`
- `app/web/apps/tenant-web/src/api/bff/site-management/**`
- `app/web/apps/tenant-web/src/views/admin/site-management*.vue`
- `src/site-runtime/site-runtime-kit/**`
- `src/site-runtime/meilong-ceramics-site/**`

## 3. Frozen Ownership Boundary

| No. | Area | OES Owns | Site / Storefront Owns | Frozen Decision |
|---:|---|---|---|---|
| 1 | Site existence | Yes | No | OES owns site identity, internal site name, type, and lifecycle status. |
| 2 | Domain and preview base | Yes | Execution | OES stores public/preview endpoint configuration; the deployed site still owns actual routing and hosting. |
| 3 | Locale lifecycle | Yes | Locale route rendering | OES owns default locale, active/preparing/disabled lifecycle, and completeness gates. |
| 4 | Runtime credential | Yes | Runtime backend holds it | OES issues and governs `OES_SITE_CREDENTIAL`; Storefront frontend never holds it. |
| 5 | Webhook and runtime status URLs | Yes | Runtime implements endpoints | OES stores callback/status endpoints and delivery facts. |
| 6 | Publish flow | Yes | Runtime consumes | OES owns draft, pending sync, explicit Sync, publishVersion, sync batch, webhook, and audit. |
| 7 | Public views | Yes | Runtime stores, Storefront reads | OES generates public view envelopes for OES-owned resources. |
| 8 | Runtime local sync | No | Runtime backend | Runtime Kit pulls snapshot/delta/changed resources and writes local store. |
| 9 | Storefront access path | No | Site | Storefront reads through Site Runtime SSR/API and does not read SQLite directly. |
| 10 | Site name / Logo / media alt | Partial | Partial | OES internal site name is only for Admin identification, search, and audit. OES may manage media assets/CDN URLs. Frontend logo usage, size, variant, link, and logo alt are site-owned. Content image alt is managed at usage context and locale, not as a forced media asset field. |
| 11 | Main navigation | No | Yes | Main navigation structure, labels, order, hierarchy, interactions, and visual design are site-owned. OES only exposes canonical URLs/status for OES-owned resources. |
| 12 | Footer | No | Yes | Footer structure, columns, links, social icons, legal blocks, and visual design are site-owned. OES only exposes public resources that the site may reference. |
| 13 | SEO data | Resource-level only | Shell/fallback/output | OES owns SEO data only for OES-owned resources. Storefront owns site shell SEO, global fallback SEO, and final SSR/head output. |
| 14 | `robots.txt` | Resource signals only | Yes | Storefront outputs `robots.txt`. OES only provides resource-level `indexable/noindex` signals. `robots.txt` must not be used as a substitute for noindex. |
| 15 | `sitemap.xml` | Eligibility only | Yes | Storefront generates sitemap. OES public views provide canonical path/locale/published/indexable/updatedAt eligibility for OES-owned resources. |
| 16 | Product added to site | Yes | Rendering | OES owns which Product Master refs are joined to a site. |
| 17 | Product site display fields | Yes | Layout | OES owns slug, display title, display description, SEO, image override, and category refs. |
| 18 | Product master truth | No | No | Product truth belongs to Product / Item Master / PIM domains. |
| 19 | Product detail layout | No | Yes | Storefront owns page layout, components, gallery, specs UI, and interactions. |
| 20 | Product list layout | No | Yes | Storefront owns filters, cards, pagination UI, and responsive behavior. |
| 21 | Public category data | Yes | Rendering | OES owns site-defined category taxonomy, slug, hierarchy, sort, and SEO. |
| 22 | Category page UX | No | Yes | Storefront owns breadcrumbs, category navigation, product grid, and styling. |
| 23 | Blog / News content data | Yes | Rendering | OES owns title, slug, body, cover, author, publish time, topics, and SEO. |
| 24 | Blog / News page layout | No | Yes | Storefront owns list/detail layout, rich text styling, cards, and visual references. |
| 25 | Topic data | Yes | Rendering | OES owns Topic name, slug, SEO, applicability, usage validity, and historical slugs. |
| 26 | Topic archive indexability | Yes | Execution | OES-owned rules decide whether a Topic archive is indexable; Storefront emits canonical/noindex/sitemap behavior. |
| 27 | Historical slug / redirect | Dynamic resources only | Static redirects | OES owns historical slug redirect data only for OES-owned dynamic resources. Runtime/Storefront executes server-side 301. Static, marketing, domain, and locale route redirects are site-owned. |
| 28 | Preview | Token/data contract | Rendering | OES issues short-lived preview tokens and draft preview views. Runtime fetches draft data. Storefront renders preview with `noindex,nofollow,no-store` and never writes formal store. |
| 29 | Page component tree | No | Yes | OES does not manage frontend component structure. |
| 30 | Drag builder / arbitrary CMS | No | No | Explicitly out of scope. |
| 31 | Frontend stack | No | Yes | Each site owns its frontend stack. Meilong uses its frozen Nuxt Storefront stack. |
| 32 | Visual style / motion / responsive | No | Yes | Storefront owns fonts, colors, spacing, hover effects, layout, animation, and responsive behavior. |
| 33 | CDN / SSR / cache details | Publish metadata only | Yes | OES provides versions and data; site owns deployment/cache execution. |
| 34 | Inquiry / order / payment / account | No | No for this slice | These require separate business-domain designs. |

## 4. Current Implementation Inventory

The current codebase already implements a significant P1 path.

| Capability | Current Status | Evidence |
|---|---|---|
| Site root model | Implemented | `Site`, `SiteLocale`, `SiteCredential`, `SiteRuntimeStatus`, sync/audit tables exist in site-service Prisma schema. |
| Admin site workspace | Implemented | Tenant web and API Gateway expose Site Management list/detail, settings, locale, sync, credential, content, product, category operations. |
| Credential and signing | Implemented | Admin credential generation and Site Runtime signed request verification exist. |
| Publish/sync | Implemented | `syncAllPendingChanges` builds public views, advances publish version, records sync batch, and records webhook delivery. |
| Runtime sync API | Implemented | Latest state, changed resources, batch public views, snapshot, sync result, and preview view exist. |
| Runtime Kit local store | Implemented | SQLite store supports publish state, sync runs, webhook idempotency, resource upsert, snapshot replacement, list, and slug lookup. |
| Runtime Kit public readers | Implemented | Readers exist for products, categories, contents, blogs, news, and topics. |
| Meilong Runtime public APIs | Implemented | Resource list/detail, Topic archive, redirect lookup, SEO route index, site config, preview bridge exist. |
| Storefront sitemap/robots | Implemented | Storefront server routes output sitemap and robots from Runtime-local data/config. |
| Blog / News / Topic display | Implemented P1 | Meilong has list, detail, topic archive, localized detail routes, SEO, and historical slug redirect behavior. |
| Static site pages | Implemented by Storefront | Home/about/contact/privacy/warranty/terms live in Storefront code, which matches the frozen boundary. |

## 5. Gaps Against Frozen Boundary

These gaps should drive the next implementation plan.

| Gap | Severity | Why It Matters | Expected Direction |
|---|---|---|---|
| Topic fields named as navigation controls (`showInBlogNav`, `showInNewsNav`, `navLabel`) | Medium | The names imply OES controls site navigation, which conflicts with the frozen boundary. The underlying need is Topic archive visibility/labeling, not main navigation ownership. | Rename or document as archive visibility/display label, not site navigation. Storefront still decides whether and where to show topic filters. |
| Media asset and image alt model is incomplete | High | Best practice requires alt text at usage context and locale. Current Blog schema has cover image but no formal cover alt field; body image alt is not structurally validated. | Add usage-context alt model for Blog/News cover and rich text images. Media asset default alt remains optional editing assistance only. |
| Preview Storefront route is not true page rendering | Closed | Preview now adapts draft payloads into `PublicViewEnvelope` and reuses `PublishedResourcePage` for supported resource types while retaining no-store/noindex. | Keep preview no-store/noindex/no formal-store-write verification in boundary checks. |
| Dynamic redirect is not generalized | Medium | Current Blog/News/Topic redirect works, but Product/Category dynamic slug history is not covered as a common redirect index. | Add a resource-level dynamic redirect index contract for OES-owned resources, executed server-side by Runtime/Storefront. |
| Sitemap omits site-owned static pages unless manually added elsewhere | Low/Medium | Frozen boundary says Storefront owns static pages and should include its own canonical static URLs when indexable. | Storefront sitemap should merge site-owned static routes with Runtime OES-owned route index. |
| Runtime public site config still uses environment identity | Low | Acceptable because site shell is Storefront-owned, but it should not be confused with OES-managed public site identity. | Keep environment-driven public config for Storefront; do not source global SEO fallback from OES internal site name. |
| Blog list visual replica currently uses static data | Medium for display thread, low for governance | It satisfies visual experimentation but is not a production data display closure. | Keep visual replica as Storefront concern; later reconnect to Runtime data after UI direction is approved. |

## 6. First Implementation Slice

The next implementation slice should be named:

```text
SITE-GOVERNANCE-PUBLISH-FOUNDATION
```

It should not attempt to finish the entire Site platform. It should converge the existing code around a clean foundation.

### 6.1 Include

- Service truth-source update for the frozen ownership boundary.
- Contract updates for:
  - resource-level `indexable` / sitemap eligibility semantics;
  - dynamic OES-owned redirect index semantics;
  - preview no-store/noindex behavior;
  - content image alt at usage context and locale.
- Current implementation inventory reflected in a feature packet.
- Tests for the boundary behaviors that already exist or are touched:
  - Storefront does not hold `OES_SITE_CREDENTIAL`;
  - Storefront does not call OES directly;
  - preview no-store/noindex and no formal store write;
  - sitemap excludes historical slugs, noindex, preview, empty archive, and page 2+;
  - dynamic historical slug redirects are server-side 301;
  - Topic archive visibility is driven by published content usage.
- Rename or semantic cleanup for Topic archive visibility fields if approved.
- Preview rendering improvement to use real resource display components when preview payload shape matches.

### 6.2 Exclude

- Page builder or arbitrary component CMS.
- OES-managed main navigation.
- OES-managed Footer.
- OES-managed frontend logo placement/variant/size/link.
- Storefront visual replica implementation.
- Product / Item display expansion beyond existing P1 public views.
- Inquiry, order, account, payment, comment, complex search.
- Full media DAM.
- Full static page redirect management in OES.

## 7. Implementation Approach Options

### Option A: Documentation and Contract Convergence First

Update truth sources and contracts first, then implement small code deltas.

Pros:

- Best fit for the current state because implementation already exists and needs boundary cleanup.
- Prevents another round of code that violates the frozen ownership model.
- Gives parallel threads a stable reference.

Cons:

- Does not immediately change visible UI.

### Option B: Code Cleanup First

Start by removing/renaming code fields that conflict with the frozen model, then update docs.

Pros:

- Quickly reduces implementation drift.

Cons:

- Higher risk because public contracts and Admin UI may still expose old semantics.
- Can create churn if naming is not approved.

### Option C: Storefront Display First

Focus on Meilong UI and preview rendering before service contract cleanup.

Pros:

- Produces visible progress quickly.

Cons:

- Does not solve the core ownership ambiguity.
- Risks continuing the earlier problem of mixing visual replica work with OES governance work.

### Recommendation

Use Option A.

The next step should be a compact feature packet or implementation plan based on this workspace. After user approval, implementation should proceed in small patches:

1. Truth-source and contract wording updates.
2. Test expectations for frozen boundaries.
3. Minimal code cleanup for semantic drift.
4. Preview and sitemap/redirect improvements.
5. Verification commands.

## 8. Open Decisions

The following decisions still need user approval before code changes:

| Decision | Recommended Default |
|---|---|
| Rename `showInBlogNav/showInNewsNav` now or only document them as Topic archive visibility flags for this iteration? | Rename if contract churn is acceptable; otherwise document now and rename in a compatibility slice. |
| Add `coverImageAlt` immediately to Blog/News locale version contracts? | Yes. It is a clear accessibility and SEO improvement. |
| Model rich text as sanitized HTML with embedded image alt validation, or switch to structured rich text nodes now? | Keep sanitized HTML for current slice, add validation expectations and leave structured rich text for a later editor-focused slice. |
| Generalize redirect index for Product/Category in this slice? | Define the contract now; implement Blog/News/Topic compatibility first unless Product/Category slug history is actively needed. |
| Include static Storefront pages in sitemap now? | Yes, in Storefront only, because it matches the frozen boundary and is low risk. |

## 9. Verification Target

Once implementation starts, success should be proven with the actual available commands:

```bash
pnpm --dir src/services/system/site-service test
pnpm --dir src/site-runtime/site-runtime-kit test
pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
pnpm --dir src/site-runtime/meilong-ceramics-site typecheck
pnpm --dir src/site-runtime/meilong-ceramics-site build
pnpm --dir src/site-runtime/meilong-ceramics-site verify
```

If any command is unavailable or blocked by unrelated dirty-worktree changes, the implementation handoff must state that explicitly.

## 10. Handoff Notes

- This workspace is no longer active because the frozen conclusions were written back to the service truth source, contracts, runtime architecture, and feature packet.
- Implementation must not use this workspace as a second stable truth source after writeback.
- Frontend UI visual options should use visual companion only when comparing concrete UI designs. Requirement freezing and architecture decisions should remain in normal discussion.
