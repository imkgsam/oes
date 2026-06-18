# Site Service

`site-service` owns OES-side external site publishing governance for P1. It is an internal gRPC service used by API Gateway Admin BFF and Site-facing BFF routes.

## Local Runtime

- gRPC default: `0.0.0.0:50069`
- Database: `DATABASE_URL` from `src/services/system/site-service/.env`
- API Gateway expects the site-service endpoint from `SITE_SERVICE_HOST` / `SITE_SERVICE_PORT`, or `127.0.0.1:50069` in local development.

Start order matters for local browser verification:

1. `pnpm --filter site-service prisma:push`
2. `pnpm --filter site-service build`
3. `pnpm --filter site-service start`
4. Restart `api-gateway` if it had already reported `UNAVAILABLE` for site-service.

The root scripts `backend:system`, `backend`, and `backend:system:db:sync` include `site-service`, so normal full-backend startup should start it automatically.

## Verification

Recommended focused checks:

```bash
pnpm --filter site-service test
pnpm --filter site-service build
pnpm --filter api-gateway exec jest src/modules/site-management-bff src/modules/site-runtime-bff --runInBand
pnpm --filter api-gateway build
pnpm proto:lint
pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/site-management/index.spec.ts apps/tenant-web/src/views/admin/site-management.spec.ts apps/tenant-web/src/views/admin/site-management-detail.spec.ts apps/tenant-web/src/modules/tenant-admin/routes.spec.ts --dom
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

For browser verification, open tenant-web and check:

- `/admin/site-management` renders the Site Management table without `Internal service is unavailable`.
- The `详情` action opens `/admin/site-management/:siteId` as a dedicated page, not a Drawer.
- Overview, Categories, Products, Blog / News, Locales, Sync, Settings, Credentials, and Audit tabs load without console errors or network 500s.
- The frontend never renders `OES_SITE_CREDENTIAL` or preview-token material.

## P1 Boundary

P1 implements OES-side governance, public view generation, sync, preview, runtime status reporting, credential metadata, signed Site-facing request verification, webhook dispatch, and audit.

P1 deliberately does not implement `@oes/site-runtime-kit`, external Storefront UI, page builder, templates, archive pages, customer/dealer accounts, order flows, price/inventory final validation, automatic translation, CDN purge, marketplace connectors, or multi-runtime endpoint management.
