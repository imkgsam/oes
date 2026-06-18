import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = join(fileURLToPath(new URL('.', import.meta.url)), '..')

const requiredFiles = [
  'README.md',
  'docker-compose.local.yml',
  'nginx/local-domain.conf',
  'runtime/package.json',
  'runtime/src/main.ts',
  'runtime/src/app.module.ts',
  'runtime/src/modules/public-data/public-data.controller.ts',
  'runtime/src/modules/preview/preview.controller.ts',
  'runtime/src/modules/seo/seo.controller.ts',
  'runtime/src/modules/site-config/site-config.controller.ts',
  'runtime/.env.example',
  'storefront/package.json',
  'storefront/tsconfig.json',
  'storefront/nuxt.config.ts',
  'storefront/app.vue',
  'storefront/server/routes/sitemap.xml.ts',
  'storefront/server/routes/robots.txt.ts',
  'storefront/server/utils/site-runtime.ts',
  'storefront/composables/usePublishedResource.ts',
  'storefront/pages/products/[slug].vue',
  'storefront/pages/categories/[slug].vue',
  'storefront/pages/blog/[slug].vue',
  'storefront/pages/news/[slug].vue',
  'storefront/pages/[locale]/products/[slug].vue',
  'storefront/pages/[locale]/categories/[slug].vue',
  'storefront/pages/[locale]/blog/[slug].vue',
  'storefront/pages/[locale]/news/[slug].vue',
  'storefront/pages/preview/[resourceType]/[resourceId].vue',
  'storefront/.env.example'
]

const forbiddenStorefrontTokens = [
  'OES_SITE_CREDENTIAL',
  'client_secret',
  'webhook_signing_secret',
  'x-oes-signature',
  'x-oes-client-id',
  'x-oes-credential-id',
  'node:sqlite',
  'sqlite',
  'oes_base_url'
]

const requiredRuntimeTokens = [
  '@oes/site-runtime-kit',
  'OesSiteRuntimeModule.forRootFromEnv',
  'OesSiteRuntimeService',
  'publicViews',
  '/api/oes/webhook',
  '/api/oes/runtime-status',
  '/health/live',
  '/health/ready',
  '/api/public/resources'
]

const requiredStorefrontTokens = [
  'SITE_RUNTIME_BASE_URL',
  'SITE_PUBLIC_BASE_URL',
  'canonical',
  'application/ld+json',
  'noindex',
  'sitemap',
  'robots'
]

const failures = []

// assertRequiredFiles verifies the production-shaped skeleton is present before deeper scans run.
function assertRequiredFiles() {
  for (const file of requiredFiles) {
    if (!existsSync(join(rootDir, file))) {
      failures.push(`Missing required template file: ${file}`)
    }
  }
}

// readTextFiles collects source files from a subtree without depending on shell-specific glob behavior.
function readTextFiles(relativeDir) {
  const absoluteDir = join(rootDir, relativeDir)
  if (!existsSync(absoluteDir)) {
    return []
  }
  const files = []
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      const absolutePath = join(dir, entry)
      const stats = statSync(absolutePath)
      if (stats.isDirectory()) {
        if (!['node_modules', '.nuxt', '.output', 'dist'].includes(entry)) {
          visit(absolutePath)
        }
        continue
      }
      if (/\.(ts|vue|json|md|yml|yaml|example|conf)$/.test(entry)) {
        files.push({
          path: relative(rootDir, absolutePath),
          text: readFileSync(absolutePath, 'utf8')
        })
      }
    }
  }
  visit(absoluteDir)
  return files
}

// assertStorefrontSafety ensures public Nuxt code cannot hold credentials or call OES directly.
function assertStorefrontSafety() {
  for (const file of readTextFiles('storefront')) {
    for (const token of forbiddenStorefrontTokens) {
      if (file.text.includes(token)) {
        failures.push(`Forbidden Storefront token "${token}" found in ${file.path}`)
      }
    }
  }
}

// assertRuntimeBoundary ensures the backend template uses the official runtime-kit integration.
function assertRuntimeBoundary() {
  const runtimeText = readTextFiles('runtime')
    .map((file) => file.text)
    .join('\n')
  for (const token of requiredRuntimeTokens) {
    if (!runtimeText.includes(token)) {
      failures.push(`Runtime boundary token missing: ${token}`)
    }
  }
}

// assertStorefrontSeoBoundary ensures Nuxt owns SEO output while sourcing data from Site Runtime.
function assertStorefrontSeoBoundary() {
  const storefrontText = readTextFiles('storefront')
    .map((file) => file.text)
    .join('\n')
  for (const token of requiredStorefrontTokens) {
    if (!storefrontText.includes(token)) {
      failures.push(`Storefront SEO token missing: ${token}`)
    }
  }
}

assertRequiredFiles()
assertStorefrontSafety()
assertRuntimeBoundary()
assertStorefrontSeoBoundary()

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('External site template boundary checks passed.')
