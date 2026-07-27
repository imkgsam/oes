# Site Governance Publish Foundation

```text
featureKey: SITE-GOVERNANCE-PUBLISH-FOUNDATION
status: COMPLETED
truthSource: docs/architecture/services/site-service.md
runtimeTruthSource: docs/architecture/site-runtime-kit.md
createdAt: 2026-07-01
lastUpdatedAt: 2026-07-02
```

## Scope

This feature packet closes the first production-shaped foundation slice for Site Governance, Publish, Runtime sync, preview, redirects, sitemap, and robots.

It does not build a page builder, arbitrary CMS, theme editor, final Meilong visual replica, inquiry/order/account/payment flows, comment/review features, complex search, or Product / Item master truth.

## Frozen Boundary

- OES owns site governance, locale lifecycle, credentials, publishVersion, sync batches, public views, preview token issuance, resource SEO for OES-owned resources, and dynamic OES-owned resource historical slug eligibility.
- Runtime Kit owns signed OES access, webhook verification, sync, local published store writes, and `runtime.publicViews`.
- Storefront owns shell, main navigation, Footer, Logo usage, static pages, static redirects, robots output, sitemap output, final SSR/head/JSON-LD output, and visual rendering.
- Preview is draft-only: `noindex`, `nofollow`, `no-store`, no formal store write, no publishVersion advance, and no webhook.

## Implementation Checklist

- [x] Confirm task scope and non-conflicting write paths.
- [x] Backfill stable truth-source and contract language from the frozen Site ownership boundary.
- [x] Preserve Topic wire fields while redefining their semantics as archive/filter visibility/display candidates.
- [x] Model Blog / News cover image alt at content locale version and public view payload level.
- [x] Add boundary verification for Storefront credential/OES/SQLite separation, preview no-store/noindex, robots blocking, sitemap source, and Topic route-index visibility.
- [x] Reuse real Storefront resource detail components in preview route under user-approved scoped Storefront override.

## Seed vs Live Sync

Seed Preview Mode proves that Meilong Runtime and Storefront can render local published data through the correct boundaries without OES services.

OES Live Sync Mode proves signed OES sync through api-gateway / site-service, Runtime local store writes, and Storefront rendering from Runtime-local data. It requires real services, a Runtime-only `OES_SITE_CREDENTIAL`, and reachable webhook/status endpoints.

## Verification

Required commands for handoff:

```bash
pnpm --dir src/services/system/site-service test
pnpm --dir src/site-runtime/site-runtime-kit test
pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
pnpm --dir src/site-runtime/meilong-ceramics-site typecheck
pnpm --dir src/site-runtime/meilong-ceramics-site build
pnpm --dir src/site-runtime/meilong-ceramics-site verify
```

Verified results:

- `pnpm --dir src/services/system/site-service test`: passed in implementation handoff.
- `pnpm --dir src/site-runtime/site-runtime-kit test`: passed, 8 suites / 24 tests.
- `pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries`: passed.
- `pnpm --dir src/site-runtime/meilong-ceramics-site typecheck`: passed.
- `pnpm --dir src/site-runtime/meilong-ceramics-site build`: passed with non-blocking Nuxt/Tailwind sourcemap warnings.
- `pnpm --dir src/site-runtime/meilong-ceramics-site verify`: passed.
- `pnpm --dir src/site-runtime/meilong-ceramics-site test:live-sync`: passed in local live-compatible signed HTTP mode with seed data disabled.

## Residual Risk

- External deployed OES API Gateway / site-service with real production `OES_SITE_CREDENTIAL` was not verified in this slice.
- Storefront changes required direct scope confirmation because concurrent visual work could overlap.
- Visual QA for Meilong Blog / News pages was HTTP/HTML smoke based, not screenshot-level or real-device QA.
