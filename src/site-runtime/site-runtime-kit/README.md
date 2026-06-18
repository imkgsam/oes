# @oes/site-runtime-kit

`@oes/site-runtime-kit` is the official OES external Site Runtime package for P1.

It provides:

- `createSiteRuntimeFromEnv()`
- `createSiteRuntime(...)`
- signed OES Site-facing client
- webhook verification
- `syncToLatest()`
- local SQLite published store
- `runtime.publicViews`
- NestJS module integration
- health and protected runtime status endpoints

It does not implement `site-service`, OES Core services, commerce writes, price or inventory validation, customer accounts, dealer portals, payments, CDN purge, distributed locks, Redis/Postgres/Mongo stores, or frontend access to OES.

## Environment

```text
OES_SITE_CREDENTIAL=oes_site_cred_v1.<base64url(json)>
OES_SITE_STORE_PATH=./data/site-runtime.sqlite
OES_SITE_PULL_INTERVAL_MS=60000
```

Credential JSON fields use the frozen P1 contract names:

```json
{
  "site_id": "brand-us",
  "client_id": "client_123",
  "credential_id": "cred_123",
  "client_secret": "server-side-secret",
  "webhook_signing_secret": "optional-webhook-secret",
  "oes_base_url": "https://oes.example.com/site-api",
  "environment": "production"
}
```

If `webhook_signing_secret` is empty, P1 falls back to `client_secret`.

## NestJS

```ts
import { Module } from '@nestjs/common'
import { OesSiteRuntimeModule } from '@oes/site-runtime-kit'

@Module({
  imports: [OesSiteRuntimeModule.forRootFromEnv({ pullIntervalMs: 60000 })]
})
export class AppModule {}
```

Webhook signature verification requires the exact raw request body:

```ts
const app = await NestFactory.create(AppModule, { rawBody: true })
```

Default endpoints:

- `POST /api/oes/webhook`
- `GET /health/live`
- `GET /health/ready`
- `GET /api/oes/runtime-status`

`/api/oes/runtime-status` is signed and protected. Public health endpoints do not expose secrets, nonces, signatures, stack traces, or local file paths.

Set `controllers: false` to disable the default controllers, or `pullIntervalMs: 0` to disable the pull fallback scheduler.

## Public Views

Site code should read published data through `runtime.publicViews`, not by reading SQLite tables directly.

```ts
const product = await runtime.publicViews.products.getBySlug('basin', 'en-US')
const blogs = await runtime.publicViews.blogs.list({ locale: 'en-US', limit: 20 })
```

P1 readers:

- `products`
- `categories`
- `contents`
- `blogs`
- `news`

Readers default to `status = published`.

## Preview

Use `runtime.getPreviewView(...)` or the signed client preview method from the site backend only. Preview views are returned to backend rendering code and are never written into `published_resources`.

## Local Verification

```bash
pnpm --filter @oes/site-runtime-kit test
pnpm --filter @oes/site-runtime-kit build
pnpm --filter @oes/site-runtime-kit smoke:local-runtime
```

The smoke command starts a local NestJS Site Runtime, uses an in-process mock OES Site API, sends a signed webhook, syncs into SQLite, reads through `runtime.publicViews`, and checks health/status endpoints over HTTP.

## P2 Deferred

P2 or later should handle inquiry submission, draft orders, final price/inventory validation, customer accounts, dealer portals, payments, CDN purge, credential rotation automation, distributed locks, multi-framework adapters, and non-SQLite store implementations.

## SQLite Note

P1 uses Node's built-in `node:sqlite` API for a dependency-light local store in this monorepo environment. Package scripts run with `NODE_OPTIONS=--no-warnings=ExperimentalWarning` to keep verification output clean. Before publishing this package externally, consider replacing it with a stable SQLite driver dependency or freezing the minimum Node version once `node:sqlite` is no longer experimental.
