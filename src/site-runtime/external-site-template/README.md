# External Site Template P1

This template provides a production-shaped external site starting point for OES-managed public sites.
It contains two separately deployable units:

- `runtime/`: NestJS Site Runtime backend.
- `storefront/`: Nuxt Storefront frontend.

The template standardizes engineering boundaries, not brand expression. A concrete site instance owns
homepage composition, navigation, About, Contact, header and footer copy, visual direction, and CTA
placement.

## Boundary

```text
Browser
  -> Nuxt Storefront public pages
  -> Nuxt server routes
  -> NestJS Site Runtime local APIs
  -> @oes/site-runtime-kit
  -> local published store / signed OES sync paths
```

Rules:

- Storefront does not hold `OES_SITE_CREDENTIAL`.
- Storefront does not call OES Core or OES Site-facing API.
- Storefront does not read the Runtime local database.
- Normal public rendering uses local published data through Site Runtime APIs.
- Runtime connects to OES only through `@oes/site-runtime-kit`.
- Runtime kit default endpoints provide `/api/oes/webhook`, `/api/oes/runtime-status`, `/health/live`,
  and `/health/ready`.

## P1 Public Data Scope

The reusable route and rendering examples cover:

- product: `/products/:slug`, `/:locale/products/:slug`
- category: `/categories/:slug`, `/:locale/categories/:slug`
- blog: `/blog/:slug`, `/:locale/blog/:slug`
- news: `/news/:slug`, `/:locale/news/:slug`

Default English routes have no locale prefix. Non-default active locales use `/:locale/`. Preparing or
disabled locales must not be returned by Runtime site config, route index, sitemap, or hreflang logic.

## SEO Structure

Nuxt owns public SEO output surfaces:

- HTML head
- canonical
- meta title and description
- Open Graph and Twitter tags
- JSON-LD structured data
- `/sitemap.xml`
- `/robots.txt`
- preview `noindex`, `nofollow`, `no-store`

Runtime owns local SEO data APIs:

- `/api/public/site-config`
- `/api/public/seo/route-index`
- `/api/public/resources/:collection`
- `/api/public/resources/:collection/:slug`
- `/api/preview/:resourceType/:resourceId`

These APIs read local published data and public-safe site config.
They must not expose OES credentials, signing secrets, nonce state, runtime status internals, or direct
OES endpoints to the Storefront.

## Local Preview

Runtime local preview needs a credential-shaped value because the official runtime kernel is
configured from `OES_SITE_CREDENTIAL`. For a template-only preview, create a local credential with the
contract shape and use `SITE_TEMPLATE_SEED_PUBLISHED_DATA=true` to seed neutral product/category/blog/news
published views.

Example local variables:

```bash
export OES_SITE_CREDENTIAL='oes_site_cred_v1.<base64url-json>'
export OES_SITE_STORE_PATH='./data/site-runtime.sqlite'
export SITE_TEMPLATE_SEED_PUBLISHED_DATA=true
export SITE_PUBLIC_BASE_URL='https://example-site.test'
export SITE_RUNTIME_BASE_URL='http://127.0.0.1:4301'
```

Run the units separately:

```bash
pnpm --dir src/site-runtime/external-site-template/runtime dev
pnpm --dir src/site-runtime/external-site-template/storefront dev
```

When running units directly, `localhost` or `127.0.0.1` access is acceptable for local verification, but
`SITE_PUBLIC_BASE_URL` must remain production-shaped so canonical URLs, sitemap entries, and Open Graph
URLs do not become localhost URLs.

The optional `docker-compose.local.yml` and `nginx/local-domain.conf` show how to put both units behind
one local domain while preserving deployable separation. If you access the Nuxt dev server with a custom
Host such as `example-site.test`, use this edge shape or configure Nuxt/Vite `server.allowedHosts` for
that host. Direct Host-header access to Nuxt dev may be rejected by Vite unless the host is explicitly
allowed.

## Site Instance Freedom

This template intentionally does not provide:

- page builder
- site builder
- OES-managed navigation contract
- shared homepage design
- shared About or Contact design
- inquiry, order, payment, comments, reviews, customer account, dealer portal, or advanced search
- production CDN implementation

Concrete site instances provide their own brand pages and visual system while consuming the same
published data and runtime boundaries.

## Verification

Template boundary checks:

```bash
pnpm --dir src/site-runtime/external-site-template verify:boundaries
```

Expected checks:

- required Runtime and Storefront files exist.
- Storefront does not contain credential, signing, OES direct-call, or local store tokens.
- Runtime uses `@oes/site-runtime-kit`.
- Nuxt contains canonical, sitemap, robots, structured data, and preview noindex surfaces.
