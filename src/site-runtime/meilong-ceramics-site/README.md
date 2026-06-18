# Meilong Ceramics Site Pilot

This directory is the Meilong Ceramics external site instance for the OES External Site Integration P1 pilot. It is a production-shaped local project made of a NestJS Site Runtime and a Nuxt Storefront.

This runbook is for local handoff only. It does not add new product/category/blog/news features, does not redesign the storefront, does not claim device QA, and does not claim production deployment readiness.

## Project Structure

```text
src/site-runtime/meilong-ceramics-site/
  package.json                 root scripts for local development and verification
  .env.example                 mode guide with placeholders only
  .gitignore                   generated and local runtime files
  docker-compose.local.yml     local Runtime + Storefront + nginx edge shape
  nginx/local-domain.conf      local domain reverse proxy example
  scripts/verify-meilong-boundaries.mjs
  runtime/                     NestJS Site Runtime backend
  storefront/                  Nuxt public Storefront frontend
```

## Boundary

```text
Browser
  -> Nuxt Storefront public pages / Nuxt server routes
  -> NestJS Site Runtime local public APIs
  -> @oes/site-runtime-kit
  -> local published store / signed OES sync paths
```

Rules:

- Storefront does not hold `OES_SITE_CREDENTIAL`, client secrets, signing material, or SQLite paths.
- Storefront does not call OES Core or OES Site-facing API directly.
- Storefront does not read the Runtime SQLite store.
- Normal public rendering reads local published data through Site Runtime APIs.
- Runtime connects to OES only through `@oes/site-runtime-kit`.
- P1 contact CTAs are outbound only: email, WhatsApp, or Contact page. They do not write inquiry, lead, order, payment, account, comment, or review data to OES.

## Running Modes

### Seed Preview Mode

Seed Preview Mode uses local seed published data to verify pages, SEO output, runtime/storefront boundaries, and local project packaging.

Use it when you want a local site preview without OES services:

```text
SITE_MEILONG_SEED_PUBLISHED_DATA=true
OES_SITE_CREDENTIAL=oes_site_cred_v1.<placeholder-or-local-dev-credential>
```

This mode does not prove OES live sync. It only proves that the Meilong Runtime and Storefront can render local published data with the correct P1 boundaries.

### OES Live Sync Mode

OES Live Sync Mode uses a real Runtime-only `OES_SITE_CREDENTIAL`, OES `api-gateway` / `site-service`, signed webhook delivery, and pull fallback. It verifies that OES published data can sync into the Runtime local store and then render in Storefront.

Use it only when the OES-side services and credential are available:

```text
SITE_MEILONG_SEED_PUBLISHED_DATA=false
OES_SITE_CREDENTIAL=oes_site_cred_v1.<real-secret-from-oes-site-management>
OES_SITE_PULL_INTERVAL_MS=60000
```

Dependencies:

- OES `api-gateway` Site-facing API reachable from Runtime.
- OES `site-service` with the Meilong site, credential, webhook URL, and runtime status URL configured.
- A real credential bundle with `site:read`, `site:sync`, `site:preview`, and `site:status` scopes as applicable.
- Runtime endpoint reachable by the configured webhook URL.

Do not put the real credential in repo files. Do not copy it into `storefront/.env.local`.

Device QA and deployment readiness are deferred until final frontend design is implemented.

## Environment Files

Environment examples are placeholders and documentation, not secret storage:

- `.env.example`: root mode guide and shared public identity placeholders.
- `runtime/.env.example`: Runtime-only variables, including the secret placeholder.
- `storefront/.env.example`: Storefront public-safe variables only.

Runtime variables:

```text
OES_SITE_CREDENTIAL=oes_site_cred_v1.<base64url-json-from-oes-site-management>
OES_SITE_STORE_PATH=./data/site-runtime.sqlite
OES_SITE_PULL_INTERVAL_MS=60000
SITE_RUNTIME_PORT=4301
SITE_RUNTIME_HOST=127.0.0.1
SITE_PUBLIC_BASE_URL=https://meilong-ceramics.com
SITE_DEFAULT_LOCALE=en-US
SITE_ACTIVE_LOCALES=en-US
SITE_NAME=Meilong Ceramics
SITE_MEILONG_SEED_PUBLISHED_DATA=true
```

Storefront variables:

```text
SITE_RUNTIME_BASE_URL=http://127.0.0.1:4301
SITE_PUBLIC_BASE_URL=https://meilong-ceramics.com
NUXT_HOST=127.0.0.1
NUXT_PORT=4300
```

`SITE_PUBLIC_BASE_URL` should remain `https://meilong-ceramics.com` for canonical, sitemap, and SEO identity even when local access uses `localhost` or local HTTP.

## Local Startup

Install dependencies for the root package and both deployable units if they are not already installed:

```bash
pnpm --dir src/site-runtime/meilong-ceramics-site install
pnpm --dir src/site-runtime/meilong-ceramics-site/runtime install
pnpm --dir src/site-runtime/meilong-ceramics-site/storefront install
```

Start backend and frontend in two terminals:

```bash
pnpm --dir src/site-runtime/meilong-ceramics-site dev:backend
pnpm --dir src/site-runtime/meilong-ceramics-site dev:frontend
```

From the repo root, start both with:

```bash
pnpm meilong
```

The Meilong package `dev` script prints the two-terminal startup instruction. The repo root `pnpm meilong` script uses `concurrently` because the root project already uses that tool for multi-process development.

`dev:backend` defaults to Seed Preview Mode when no real credential is provided. It injects a non-secret local dev credential, sets `SITE_MEILONG_SEED_PUBLISHED_DATA=true`, and disables pull fallback with `OES_SITE_PULL_INTERVAL_MS=0`. If you export a real `OES_SITE_CREDENTIAL`, `SITE_MEILONG_SEED_PUBLISHED_DATA=false`, and a pull interval before starting, those values take precedence for OES Live Sync Mode.

Default direct local URLs:

```text
Backend:  http://127.0.0.1:4301
Frontend: http://127.0.0.1:4300
```

## Local Domain And Nginx Edge

Add a hosts entry on the local machine:

```text
127.0.0.1 meilong-ceramics.com
```

Run the local edge shape:

```bash
cd src/site-runtime/meilong-ceramics-site
docker compose -f docker-compose.local.yml up
```

The nginx edge listens on local HTTP port `8080` and keeps a production-shaped Host while proxying to separate units:

```text
http://meilong-ceramics.com:8080
  /                       -> Storefront
  /api/oes/webhook        -> Runtime
  /api/oes/runtime-status -> Runtime
  /health/*               -> Runtime
```

If you bypass nginx and access Nuxt directly with `Host: meilong-ceramics.com`, Vite/Nuxt dev host checks can block the request. Use `localhost`/`127.0.0.1` for direct dev access, or use the nginx edge. If a future direct custom Host flow is required, configure Nuxt/Vite `server.allowedHosts` explicitly in that thread.

## Local Verification

Runtime health and public-safe APIs:

```bash
curl -sS http://127.0.0.1:4301/health/live
curl -sS http://127.0.0.1:4301/health/ready
curl -sS http://127.0.0.1:4301/api/public/site-config
curl -sS http://127.0.0.1:4301/api/public/seo/route-index
curl -sS 'http://127.0.0.1:4301/api/public/resources/products?locale=en-US'
curl -sS 'http://127.0.0.1:4301/api/public/resources/categories?locale=en-US'
curl -sS 'http://127.0.0.1:4301/api/public/resources/blog?locale=en-US'
curl -sS 'http://127.0.0.1:4301/api/public/resources/news?locale=en-US'
```

Storefront pages and SEO surfaces:

```bash
curl -sS http://127.0.0.1:4300/
curl -sS http://127.0.0.1:4300/products
curl -sS http://127.0.0.1:4300/categories
curl -sS http://127.0.0.1:4300/blog
curl -sS http://127.0.0.1:4300/news
curl -sS http://127.0.0.1:4300/about
curl -sS http://127.0.0.1:4300/contact
curl -sS http://127.0.0.1:4300/sitemap.xml
curl -sS http://127.0.0.1:4300/robots.txt
```

For localhost verification, page access may use `127.0.0.1`, but HTML canonical URLs, route index, and sitemap must still use `https://meilong-ceramics.com`.

## Build And Static Verification

Run from the Meilong root:

```bash
pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
pnpm --dir src/site-runtime/meilong-ceramics-site typecheck
pnpm --dir src/site-runtime/meilong-ceramics-site build
pnpm --dir src/site-runtime/meilong-ceramics-site verify
```

Root scripts:

| Script | Purpose |
| --- | --- |
| `dev:backend` | Starts the NestJS backend from `runtime/`. |
| `dev:frontend` | Starts the Nuxt frontend from `storefront/`. |
| `dev` | Prints the two-terminal startup instruction and root `pnpm meilong` hint. |
| `typecheck:runtime` | Runs Runtime TypeScript typecheck. |
| `typecheck:storefront` | Runs Storefront Nuxt typecheck. |
| `typecheck` | Runs both typecheck scripts. |
| `build:runtime` | Builds the Runtime into `runtime/dist`. |
| `build:storefront` | Builds the Storefront into `storefront/.output`. |
| `build` | Runs both build scripts. |
| `verify:boundaries` | Runs static Meilong boundary checks. |
| `verify` | Runs boundary checks, typecheck, and build. |
| `clean:generated` / `clean` | Prints the generated-file policy; it does not delete local data. |

`verify` intentionally does not run full OES live sync because that depends on external OES services and real credentials.

## Generated Files And Local Data

The following are local generated/runtime files and are ignored:

```text
runtime/dist/
runtime/tsconfig.tsbuildinfo
runtime/data/
runtime/data/site-runtime.sqlite*
runtime/node_modules/
storefront/.nuxt/
storefront/.output/
storefront/node_modules/
```

Do not commit them. Do not delete `runtime/data/site-runtime.sqlite*` unless you explicitly want to reset local Runtime published data. Existing local SQLite files may contain seed preview data or OES live sync data from a previous run.

The root `clean` scripts are intentionally non-destructive. If cleanup is needed, review the directories manually and coordinate before removing runtime data.

## Current Completed Capability

- External Site Template P1 is available as the reusable engineering skeleton.
- Meilong Ceramics local Site Runtime + Nuxt Storefront exists as the first concrete site instance.
- Seed Preview Mode can render Meilong product/category/blog/news local published data.
- OES live sync was previously confirmed in a dedicated integration thread: webhook sync, pull fallback sync, and Storefront rendering of real OES published data.
- This runbook preserves the distinction between seed preview and OES live sync; it does not re-run the full live sync integration.

## Deferred

- Final frontend design.
- Device QA and true-device browser coverage.
- Production DNS, public TLS, CDN, cache purge, and deployment readiness.
- P2 inquiry submission.
- Order, payment, account, dealer portal, comments/reviews, and advanced search.
- Price/inventory final validation.

## Troubleshooting

### Storefront cannot reach Runtime

Check `SITE_RUNTIME_BASE_URL` in `storefront/.env.local` and confirm Runtime is listening:

```bash
curl -sS http://127.0.0.1:4301/health/ready
```

### Canonical or sitemap shows localhost

Set `SITE_PUBLIC_BASE_URL=https://meilong-ceramics.com` for Runtime and Storefront. Local access can use localhost, but SEO identity must remain production-shaped.

### Custom Host is blocked by Nuxt/Vite

Use `http://127.0.0.1:4300` for direct dev access or route through nginx at `http://meilong-ceramics.com:8080`. Do not treat a direct custom Host failure as an OES sync failure.

### Runtime starts but shows no live OES data

Confirm the mode:

- Seed Preview Mode uses `SITE_MEILONG_SEED_PUBLISHED_DATA=true` and local seed data.
- OES Live Sync Mode uses `SITE_MEILONG_SEED_PUBLISHED_DATA=false`, a real Runtime-only `OES_SITE_CREDENTIAL`, OES services, webhook delivery, and pull fallback.

Seed preview data is not evidence of OES live sync.

### Backend fails with `Missing OES_SITE_CREDENTIAL`

Use the Meilong startup scripts instead of running `runtime/package.json` directly:

```bash
pnpm meilong:backend
```

The startup script provides a local non-secret seed preview credential when no real credential is exported. Directly running `pnpm --dir src/site-runtime/meilong-ceramics-site/runtime dev` still requires `OES_SITE_CREDENTIAL`, because `@oes/site-runtime-kit` correctly treats the credential as a required backend runtime input.

### Webhook sync does not run

Verify the OES-side webhook URL points to the Runtime path exposed by the local edge or tunnel:

```text
POST /api/oes/webhook
```

Also confirm the Runtime credential is real, unrevoked, scoped correctly, and from the same OES environment as the Site-facing API.

### Runtime status check is unauthorized

`/api/oes/runtime-status` is intended for protected OES management access. Anonymous access should not be treated as the public readiness check. Use `/health/live` and `/health/ready` for local process checks.

### Typecheck or build creates generated directories

`runtime/dist`, `storefront/.nuxt`, `storefront/.output`, and `runtime/tsconfig.tsbuildinfo` are expected generated artifacts. They are ignored and should not be committed.

## Handoff Notes

This site instance is ready for local engineering handoff when:

- A developer can choose Seed Preview Mode or OES Live Sync Mode without mixing them.
- Runtime and Storefront can be started from root scripts or the documented two-terminal flow.
- Local domain/nginx and localhost verification strategies are both clear.
- `verify:boundaries`, `typecheck`, `build`, and `verify` can be run from the root package.
- Generated artifacts and local SQLite runtime data are understood as non-source local files.

It is not production deployment ready and has not completed device QA.
