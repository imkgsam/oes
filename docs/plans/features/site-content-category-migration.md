# Site Content Category Migration

```text
featureStatus: ACTIVE
ownerScope: site-service + site-runtime-kit + Meilong Runtime + Meilong Storefront
truthSource: docs/architecture/services/site-service.md
contractSource: docs/contracts/site-service/public-views.md
decisionSource: docs/adr/0009-site-content-category-taxonomy.md
```

## Goal

Replace the legacy site Content Topic taxonomy with localized, SEO-capable Content Categories without changing public Storefront category URLs or dropping existing multi-category article relationships.

## Scope

- Rename `SiteContentTopic`, `topicIds`, Topic public views, gRPC methods, Admin BFF operations, Runtime APIs, Storefront adapters and verification output to Content Category terminology.
- Publish `article-category` resources with localized display, archive and SEO metadata.
- Continue rendering `/blogs/category/:slug` and `/news/category/:slug`; add server-side redirects for legacy Topic archive URLs.
- Make page metadata and `CollectionPage` JSON-LD use the localized category SEO description with deterministic fallback.
- Migrate persisted Site Service Topic tables and JSON relations without losing ordered category membership or stable opaque IDs; rewrite Runtime-facing public views and sync-resource vocabulary to `article-category`, while retaining audit and dispatched-webhook history as immutable evidence.

## Non-goals

- No reuse of product categories for editorial taxonomy.
- No page builder, hierarchy, automatic tag archive, automatic translation, or article content rewrite.
- No change to the existing global Storefront Header or Footer.

## Execution Order

1. Update the service truth source, Runtime Kit architecture and public-view contract as required by ADR 0009.
2. Add tests that describe category public views, ordered `categoryIds`, locale completeness, legacy archive redirects and SEO description fallback; verify they fail against Topic-only code.
3. Rename Site Service Prisma models, repositories, application services, gRPC protocol and Admin BFF operations; add a data-preserving database migration.
4. Rename Runtime Kit resource types/readers and Meilong Runtime public-data controllers; migrate seed data and Runtime API paths.
5. Rename Storefront composables/components/routes and align metadata, JSON-LD, sitemap and redirect behavior.
6. Run focused service, Runtime Kit, Storefront display/SEO, build and boundary verification; search the active implementation paths for forbidden `topic` names.

## Acceptance

- Admin and code interfaces refer to Content Category rather than Topic.
- A category owns per-locale display name, archive intro, SEO title, SEO description, SEO image and historical slugs.
- A Blog or News item can retain multiple category IDs in deterministic primary-first order.
- `/blogs/category/:slug` and `/news/category/:slug` render the selected category and use its localized SEO values.
- Legacy Topic URLs 301 to the equivalent category canonical URL.
- Product categories remain separate from Content Categories.
