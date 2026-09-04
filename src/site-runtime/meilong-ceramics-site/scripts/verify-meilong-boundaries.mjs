import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = join(root, '../../..')
const storefrontRoot = join(root, 'storefront')
const runtimeRoot = join(root, 'runtime')
const templateRoot = join(repoRoot, 'src/site-runtime/external-site-template')
const runtimePreviewController = join(root, 'runtime/src/modules/preview/preview.controller.ts')
const runtimeCategoryArchiveService = join(root, 'runtime/src/modules/public-data/content-category-archive.service.ts')
const storefrontPreviewApi = join(root, 'storefront/server/api/preview/[resourceType]/[resourceId].get.ts')
const storefrontPreviewPage = join(root, 'storefront/pages/preview/[resourceType]/[resourceId].vue')
const storefrontRobotsRoute = join(root, 'storefront/server/routes/robots.txt.ts')
const storefrontSitemapRoute = join(root, 'storefront/server/routes/sitemap.xml.ts')

const requiredFiles = [
  'README.md',
  'package.json',
  'docker-compose.local.yml',
  'nginx/local-domain.conf',
  'runtime/package.json',
  'runtime/src/app.module.ts',
  'runtime/src/modules/seed/meilong-published-data-seed.service.ts',
  'storefront/package.json',
  'storefront/nuxt.config.ts',
  'storefront/pages/index.vue',
  'storefront/pages/about.vue',
  'storefront/pages/contact.vue',
  'storefront/pages/faqs.vue',
  'storefront/pages/privacy-policy.vue',
  'storefront/pages/returns-refunds.vue',
  'storefront/pages/search.vue',
  'storefront/pages/series.vue',
  'storefront/pages/shipping-delivery.vue',
  'storefront/pages/terms-conditions.vue',
  'storefront/pages/warranty.vue',
  'storefront/pages/[locale]/blogs/categories/[slug].vue',
  'storefront/pages/[locale]/news/categories/[slug].vue',
  'storefront/pages/product/collections/index.vue',
  'storefront/pages/products/[slug].vue',
  'storefront/pages/collections/[collection].vue',
  'storefront/pages/blogs/index.vue',
  'storefront/pages/blogs/categories/[slug].vue',
  'storefront/pages/news/index.vue',
  'storefront/pages/news/categories/[slug].vue',
  'storefront/server/routes/sitemap.xml.ts',
  'storefront/server/routes/robots.txt.ts',
  'storefront/composables/usePublishedSeo.ts'
]

const retiredRouteFiles = [
  'storefront/pages/blog/index.vue',
  'storefront/pages/blog/[slug].vue',
  'storefront/pages/[locale]/blog/[slug].vue',
  'storefront/pages/blogs/category/index.vue',
  'storefront/pages/blogs/category/[slug].vue',
  'storefront/pages/[locale]/blogs/category/index.vue',
  'storefront/pages/[locale]/blogs/category/[slug].vue',
  'storefront/pages/news/category/[slug].vue',
  'storefront/pages/[locale]/news/category/[slug].vue',
  'storefront/pages/categories/index.vue',
  'storefront/pages/categories/[slug].vue',
  'storefront/pages/[locale]/categories/[slug].vue',
  'storefront/pages/products/index.vue',
  'storefront/pages/collections/index.vue',
  'storefront/server/routes/blogs/topic/[slug].ts',
  'storefront/server/routes/[locale]/blogs/topic/[slug].ts',
  'storefront/server/routes/news/topic/[slug].ts',
  'storefront/server/routes/[locale]/news/topic/[slug].ts'
]

const checks = []

function check(name, predicate) {
  checks.push({ name, predicate })
}

function listFiles(dir) {
  if (!existsSync(dir)) {
    return []
  }
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const path = join(dir, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      if (['node_modules', '.nuxt', '.output', 'dist', 'data'].includes(entry)) {
        return []
      }
      return listFiles(path)
    }
    return [path]
  })
}

function readAllText(dir) {
  return listFiles(dir)
    .filter((file) => /\.(ts|vue|css|json|md|yml|yaml|conf|mjs)$/.test(file))
    .map((file) => {
      const body = readFileSync(file, 'utf8')
      return { file, body }
    })
}

function containsAny(records, patterns) {
  return records.flatMap(({ file, body }) =>
    patterns
      .filter((pattern) => pattern.test(body))
      .map((pattern) => `${relative(root, file)} matched ${pattern}`)
  )
}

check('required Meilong instance files exist', () =>
  requiredFiles.filter((file) => !existsSync(join(root, file)))
)

check('retired Meilong public route files are physically absent', () =>
  retiredRouteFiles.filter((file) => existsSync(join(root, file)))
)

check('Storefront does not hold OES credential or signing material', () => {
  const records = readAllText(storefrontRoot)
  return containsAny(records, [
    /OES_SITE_CREDENTIAL/,
    /client_secret/,
    /webhook_signing_secret/,
    /x-oes-signature/,
    /x-oes-client-id/,
    /x-oes-credential-id/,
    /published_resources/,
    /site-runtime\.sqlite/,
    /sqlite/i
  ])
})

check('Storefront does not direct-call OES core or Site-facing API', () => {
  const records = readAllText(storefrontRoot)
  return containsAny(records, [/oes_base_url/, /api\/site-facing/, /site-service/, /OES Core/i])
})

check('Runtime connects through @oes/site-runtime-kit', () => {
  const records = readAllText(runtimeRoot)
  const hasRuntimeKit = records.some(({ body }) => body.includes('@oes/site-runtime-kit'))
  return hasRuntimeKit ? [] : ['runtime does not import @oes/site-runtime-kit']
})

check('Meilong SEO identity uses production-shaped HTTPS domain', () => {
  const records = readAllText(root)
  const combined = records.map(({ body }) => body).join('\n')
  const failures = []
  if (!combined.includes('https://meilong-ceramics.com')) {
    failures.push('missing https://meilong-ceramics.com')
  }
  if (!combined.includes('meilong-ceramics.com')) {
    failures.push('missing meilong-ceramics.com local domain')
  }
  return failures
})

check('Storefront includes public SEO surfaces', () => {
  const records = readAllText(storefrontRoot)
  const combined = records.map(({ body }) => body).join('\n')
  return [
    ['canonical', /canonical/],
    ['Open Graph', /ogTitle|og:title|ogImage/],
    ['Twitter meta', /twitterCard|twitter:title|twitterImage/],
    ['JSON-LD', /application\/ld\+json/],
    ['preview noindex', /noindex, nofollow|noindex/]
  ]
    .filter(([, pattern]) => !pattern.test(combined))
    .map(([name]) => `missing ${name}`)
})

check('Preview routes force no-store and noindex without formal store writes', () => {
  const previewFiles = [runtimePreviewController, storefrontPreviewApi]
  const failures = []
  for (const file of previewFiles) {
    if (!existsSync(file)) {
      failures.push(`${relative(root, file)} missing`)
      continue
    }
    const body = readFileSync(file, 'utf8')
    if (!/Cache-Control['"], ['"]no-store/.test(body)) {
      failures.push(`${relative(root, file)} missing Cache-Control no-store`)
    }
    if (!/X-Robots-Tag['"], ['"]noindex, nofollow/.test(body)) {
      failures.push(`${relative(root, file)} missing X-Robots-Tag noindex, nofollow`)
    }
    if (/upsertPublishedResources|replaceSnapshot|syncToLatest|publishVersion\s*\+\+|webhook/i.test(body)) {
      failures.push(`${relative(root, file)} appears to write formal store, advance publish state, or trigger sync`)
    }
  }
  return failures
})

check('Storefront preview page reuses real published resource rendering', () => {
  const body = readFileSync(storefrontPreviewPage, 'utf8')
  const failures = []
  if (!body.includes('PublishedResourcePage')) {
    failures.push('preview page does not render through PublishedResourcePage')
  }
  if (!body.includes('PublicViewEnvelope')) {
    failures.push('preview page does not adapt draft payload into a public view envelope')
  }
  if (!/cache_policy.*no-store|no-store.*cache_policy/s.test(body)) {
    failures.push('preview page does not preserve no-store preview semantics')
  }
  return failures
})

check('Storefront robots blocks preview API and admin paths without relying on robots for noindex', () => {
  const body = readFileSync(storefrontRobotsRoute, 'utf8')
  return [
    ['preview', /Disallow: \/preview\//],
    ['api', /Disallow: \/api\//],
    ['admin', /Disallow: \/admin\//],
    ['sitemap', /Sitemap: \$\{config\.publicBaseUrl\}\/sitemap\.xml/]
  ]
    .filter(([, pattern]) => !pattern.test(body))
    .map(([name]) => `robots route missing ${name} rule`)
})

check('Sitemap uses the Runtime SEO route index and Content Category archives use published usage visibility', () => {
  const sitemap = readFileSync(storefrontSitemapRoute, 'utf8')
  const categoryArchive = readFileSync(runtimeCategoryArchiveService, 'utf8')
  const failures = []
  if (!sitemap.includes('/api/public/seo/route-index')) {
    failures.push('sitemap does not read runtime SEO route index')
  }
  if (!categoryArchive.includes('listCategoryRouteIndex') || !categoryArchive.includes('listVisibleCategories')) {
    failures.push('Content Category route index is not derived from visible published usage')
  }
  const routeIndexBody = categoryArchive.match(/async listCategoryRouteIndex[\s\S]*?return routes\n  \}/)?.[0] ?? ''
  if (/\bpage\b/.test(routeIndexBody) || /pagination/.test(routeIndexBody)) {
    failures.push('Content Category route index appears to include pagination pages')
  }
  return failures
})

check('External Site Template core is not polluted with Meilong business content', () => {
  const records = readAllText(templateRoot)
  return containsAny(records, [/Meilong/i, /meilong-ceramics/i, /美隆/])
})

const failures = []
for (const { name, predicate } of checks) {
  const result = predicate()
  if (result.length > 0) {
    failures.push({ name, result })
  }
}

if (failures.length > 0) {
  console.error('Meilong site boundary verification failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
    for (const item of failure.result) {
      console.error(`  - ${item}`)
    }
  }
  process.exit(1)
}

console.log('Meilong site boundary verification passed.')
