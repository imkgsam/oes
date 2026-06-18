import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = join(root, '../../..')
const storefrontRoot = join(root, 'storefront')
const runtimeRoot = join(root, 'runtime')
const templateRoot = join(repoRoot, 'src/site-runtime/external-site-template')

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
  'storefront/pages/products/index.vue',
  'storefront/pages/categories/index.vue',
  'storefront/pages/blog/index.vue',
  'storefront/pages/news/index.vue',
  'storefront/server/routes/sitemap.xml.ts',
  'storefront/server/routes/robots.txt.ts',
  'storefront/composables/usePublishedSeo.ts'
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
