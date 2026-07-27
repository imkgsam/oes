import { strict as assert } from 'node:assert'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'
import { setTimeout as delay } from 'node:timers/promises'

const root = new URL('..', import.meta.url).pathname
const runtimePort = 4521
const storefrontPort = 4520
const publicBaseUrl = 'https://meilong-ceramics.com'
const credential =
  'oes_site_cred_v1.eyJzaXRlX2lkIjoibWVpbG9uZy1jZXJhbWljcy1sb2NhbCIsImNsaWVudF9pZCI6Im1laWxvbmctbG9jYWwtZGV2LWNsaWVudCIsImNyZWRlbnRpYWxfaWQiOiJtZWlsb25nLWxvY2FsLWRldi1jcmVkZW50aWFsIiwiY2xpZW50X3NlY3JldCI6ImxvY2FsLWRldi1ub3QtYS1zZWNyZXQiLCJ3ZWJob29rX3NpZ25pbmdfc2VjcmV0IjoibG9jYWwtZGV2LW5vdC1hLXNlY3JldCIsIm9lc19iYXNlX3VybCI6Imh0dHA6Ly8xMjcuMC4wLjE6NTc3MSIsImVudmlyb25tZW50IjoibG9jYWwtc2VlZC1wcmV2aWV3In0'

const runtimeBaseUrl = `http://127.0.0.1:${runtimePort}`
const storefrontBaseUrl = `http://127.0.0.1:${storefrontPort}`
const displayCacheBust = Date.now().toString(36)
const dataDir = join(tmpdir(), `meilong-blog-news-${Date.now()}`)
const terminalContentDetailSlugs = ['category', 'topic', 'categories']
const blogDetailCss = readFileSync(join(root, 'storefront/assets/css/main.css'), 'utf8')
const blogArchiveCss = readFileSync(join(root, 'storefront/assets/css/dxv-home.css'), 'utf8')
const blogCategoryNavSource = readFileSync(
  join(root, 'storefront/components/BlogCategoryNav.vue'),
  'utf8'
)
const newsArchiveSource = readFileSync(join(root, 'storefront/components/NewsArchive.vue'), 'utf8')
const newsArticleSource = readFileSync(
  join(root, 'storefront/components/NewsArticleView.vue'),
  'utf8'
)
const inspirationArchiveSource = readFileSync(
  join(root, 'storefront/components/InspirationArchivePage.vue'),
  'utf8'
)
const inspirationProductDrawerPath = join(
  root,
  'storefront/components/InspirationProductDrawer.vue'
)
const inspirationProductDrawerSource = existsSync(inspirationProductDrawerPath)
  ? readFileSync(inspirationProductDrawerPath, 'utf8')
  : ''
const inspirationFixtureSource = readFileSync(
  join(root, 'storefront/data/westelm-kids-reference.ts'),
  'utf8'
)
const inspirationCss = readFileSync(join(root, 'storefront/assets/css/main.css'), 'utf8')
const faqPageSource = readFileSync(join(root, 'storefront/components/FaqHelpPage.vue'), 'utf8')
const faqDataSource = readFileSync(join(root, 'storefront/data/faqs.ts'), 'utf8')
const contactPageSource = readFileSync(join(root, 'storefront/pages/contact.vue'), 'utf8')
const footerSource = readFileSync(
  join(root, 'storefront/components/home/HomeReplicaFooter.vue'),
  'utf8'
)
const newsArchiveRouteSources = [
  'storefront/pages/news/index.vue',
  'storefront/pages/[locale]/news/index.vue',
  'storefront/pages/news/categories/[slug].vue',
  'storefront/pages/[locale]/news/categories/[slug].vue'
].map((path) => readFileSync(join(root, path), 'utf8'))
const archivePaginationScrollPath = join(
  root,
  'storefront/composables/useArchivePaginationScroll.ts'
)
const blogArchivePagePaths = [
  join(root, 'storefront/pages/blogs/index.vue'),
  join(root, 'storefront/pages/blogs/categories/[slug].vue'),
  join(root, 'storefront/pages/[locale]/blogs/categories/[slug].vue')
]
const verificationScope = process.argv.includes('governance')
  ? 'governance'
  : process.argv.includes('blog-index')
    ? 'blog-index'
    : process.argv.includes('blog-detail')
      ? 'blog-detail'
      : process.argv.includes('news')
        ? 'news'
        : process.argv.includes('inspirations')
          ? 'inspirations'
          : process.argv.includes('faq')
            ? 'faq'
            : process.argv.includes('redirects')
              ? 'redirects'
              : 'all'
mkdirSync(dataDir, { recursive: true })
seedStaleNewsResource()

const processes = []
// sinkArticleImageUrls keeps the complete reference article image sequence under SSR regression coverage.
const sinkArticleImageUrls = [
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/1_5e22c741-9ba5-4341-9f1e-196f90d0e56d_1024x1024.png?v=1712480894',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_1c0b04e5-1073-40c9-8c8e-e1e3fe30510d_1024x1024.png?v=1712480890',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_0b270b87-93d5-40e2-a8d4-29eb382da806_1024x1024.png?v=1712480894',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_340fc2e1-2b77-4108-aeff-24dca33b5803_1024x1024.png?v=1712480894',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/5_3ed315f1-a455-45eb-8b6f-ee4834d3cb50_1024x1024.png?v=1712480894',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/6_d5ee4c25-8411-4d84-9ccd-2ffd3ec48ddb_1024x1024.png?v=1712480894',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/7_cc49953d-97eb-4ce7-8ec0-9f52d64e3a54_1024x1024.png?v=1712480893',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/8_273cdfa0-acba-4595-b5ba-0505ca5134c8_1024x1024.png?v=1712480894',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/10_a5c9136c-8bf8-47e8-a6ad-1314ce21db68_1024x1024.png?v=1712484032',
  'https://cdn.shopify.com/s/files/1/0526/3536/9660/files/9_b4e8b0a9-12f0-47a3-bc1c-2f6a2e53453c_1024x1024.png?v=1712484032'
]
const additionalDeerValleyArticles = [
  [
    'quick-and-easy-vessel-bathroom-sink-installation-guide',
    'Quick and Easy Vessel Bathroom Sink Installation Guide'
  ],
  [
    'perfect-your-bathroom-with-a-pedestal-sink-installation-made-easy',
    'Perfect Your Bathroom with a Pedestal Sink: Installation Made Easy'
  ],
  [
    'strainer-installation-made-simple-easy-to-follow-guide',
    'Strainer Installation Made Simple | Easy-to-Follow Guide'
  ],
  [
    'essential-tips-for-undermount-kitchen-sink-kit-installation',
    'Essential Tips for Undermount Kitchen Sink Kit Installation'
  ],
  [
    'keep-your-ceramic-kitchen-sink-clean-and-well-maintained',
    'Keep Your Ceramic Kitchen Sink Clean and Well-Maintained'
  ],
  [
    'enhance-your-bathroom-experience-with-certified-toilets',
    'Enhance Your Bathroom Experience with Certified Toilets'
  ],
  [
    '10-expert-tips-for-removing-toilet-stains-and-keeping-your-bathroom-clean',
    '10 Expert Tips for Removing Toilet Stains and Keeping Your Bathroom Clean'
  ],
  [
    'the-ultimate-guide-to-installing-a-two-piece-toilet-step-by-step-instructions',
    'The Ultimate Guide to Installing a Two-Piece Toilet: Step-by-Step Instructions'
  ],
  ['8-effective-methods-to-unclog-your-toilet', '8 Effective Methods to Unclog Your Toilet'],
  [
    'a-complete-guide-to-installing-a-one-piece-toilet',
    'A Complete Guide to Installing a One-Piece Toilet (Type A)'
  ]
]

try {
  processes.push(
    spawnProcess(
      'pnpm',
      [
        '--dir',
        'runtime',
        'exec',
        'ts-node',
        '-r',
        'tsconfig-paths/register',
        '--project',
        'tsconfig.json',
        'src/main.ts'
      ],
      {
        OES_SITE_CREDENTIAL: credential,
        OES_SITE_STORE_PATH: join(dataDir, 'runtime.sqlite'),
        OES_SITE_PULL_INTERVAL_MS: '0',
        SITE_MEILONG_SEED_PUBLISHED_DATA: 'true',
        SITE_RUNTIME_PORT: String(runtimePort),
        SITE_RUNTIME_HOST: '127.0.0.1',
        SITE_PUBLIC_BASE_URL: publicBaseUrl,
        SITE_DEFAULT_LOCALE: 'en-US',
        SITE_ACTIVE_LOCALES: 'en-US',
        SITE_NAME: 'Meilong Ceramics'
      }
    )
  )
  await waitForUrl(`${runtimeBaseUrl}/health/ready`, 'runtime ready')

  processes.push(
    spawnProcess(
      'pnpm',
      [
        '--dir',
        'storefront',
        'exec',
        'nuxt',
        'dev',
        '--host',
        '127.0.0.1',
        '--port',
        String(storefrontPort)
      ],
      {
        SITE_RUNTIME_BASE_URL: runtimeBaseUrl,
        SITE_PUBLIC_BASE_URL: publicBaseUrl,
        NUXT_IGNORE_LOCK: '1',
        NUXT_TELEMETRY_DISABLED: '1'
      }
    )
  )
  await waitForUrl(`${storefrontBaseUrl}/robots.txt`, 'storefront ready')

  await verifyRuntimePublicViews()
  if (verificationScope === 'governance') {
    await verifySiteGovernance()
  } else if (verificationScope === 'blog-index') {
    await verifyBlogIndex()
  } else if (verificationScope === 'blog-detail') {
    await verifyStorefrontPages()
  } else if (verificationScope === 'news') {
    await verifyNewsExperience()
  } else if (verificationScope === 'inspirations') {
    await verifyInspirationsExperience()
  } else if (verificationScope === 'faq') {
    await verifyFaqExperience()
  } else if (verificationScope === 'redirects') {
    await verifyRedirects()
  } else {
    await verifyStorefrontPages()
    await verifyInspirationsExperience()
    await verifyFaqExperience()
    await verifySeoSurfaces()
    await verifyRedirects()
    await verifyPreview()
  }
} finally {
  await Promise.allSettled(processes.map(stopProcess))
}

// verifySiteGovernance proves route, SEO, crawler, and publication-version policy through the running Runtime and Nuxt boundary.
async function verifySiteGovernance() {
  for (const [requestedPath, canonicalPath] of [
    ['/en-US', '/'],
    ['/en-US/about', '/about'],
    ['/en-US/blogs', '/blogs'],
    ['/en-US/news', '/news'],
    ['/en-US/product/collections', '/product/collections']
  ]) {
    const defaultPrefixed = await fetch(`${storefrontBaseUrl}${requestedPath}`, {
      redirect: 'manual'
    })
    assert.equal(defaultPrefixed.status, 301, `${requestedPath} removes the default locale prefix`)
    assert.equal(defaultPrefixed.headers.get('location'), canonicalPath)
  }

  const invalidLocale = await fetch(`${storefrontBaseUrl}/fr-FR/news`, {
    redirect: 'manual'
  })
  assert.equal(invalidLocale.status, 404)

  const missingLocalizedResource = await fetch(
    `${storefrontBaseUrl}/en-US/news/not-a-published-news-release`,
    { redirect: 'manual' }
  )
  assert.equal(missingLocalizedResource.status, 404)

  const news = await text(`${storefrontBaseUrl}/news`)
  assert.match(news, /<html[^>]*lang="en-US"/)
  assert.match(news, /rel="canonical" href="https:\/\/meilong-ceramics\.com\/news"/)
  assert.match(news, /name="robots" content="index,follow"/)

  const decisionResponse = await fetch(
    `${storefrontBaseUrl}/api/public/site-exposure/route-decision?pageKey=NEWS_LIST&resourceCollection=news`
  )
  assert.equal(decisionResponse.status, 200)
  const decision = await decisionResponse.json()

  const [sitemapResponse, robotsResponse] = await Promise.all([
    fetch(`${storefrontBaseUrl}/sitemap.xml`),
    fetch(`${storefrontBaseUrl}/robots.txt`)
  ])
  assert.equal(sitemapResponse.status, 200)
  assert.equal(robotsResponse.status, 200)
  const expectedVersion = String(decision.committedPublishVersion)
  assert.equal(sitemapResponse.headers.get('x-oes-site-exposure-version'), expectedVersion)
  assert.equal(robotsResponse.headers.get('x-oes-site-exposure-version'), expectedVersion)
  assert.doesNotMatch(
    await sitemapResponse.text(),
    /https:\/\/meilong-ceramics\.com\/search<\/loc>/
  )

  await verifyClientRouteGovernance()
}

// verifyClientRouteGovernance protects head cleanup and historical redirects across hydrated Nuxt navigation.
async function verifyClientRouteGovernance() {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const pageErrors = []
  const hydrationWarnings = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' && /hydration/i.test(message.text())) {
      hydrationWarnings.push(message.text())
    }
  })

  try {
    await page.goto(`${storefrontBaseUrl}/blogs`, { waitUntil: 'domcontentloaded' })
    pageErrors.length = 0
    await pushClientRoute(page, '/blogs/porcelain-tile-specification-checklist')
    await page.waitForURL(
      '**/blogs/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience'
    )
    await page
      .getByRole('heading', {
        name: '10 Expert Tips for Transforming Your Bathroom into the Ultimate Spa Experience'
      })
      .waitFor()
    assert.deepEqual(pageErrors, [], `client historical redirect raised: ${pageErrors.join('; ')}`)

    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await page.goto(`${storefrontBaseUrl}/news`, { waitUntil: 'commit' })
    await page.waitForFunction(
      () => {
        const vueApp = document.querySelector('#__nuxt')?.__vue_app__
        const nuxtApp = vueApp?.config.globalProperties.$nuxt
        const router = vueApp?.config.globalProperties.$router
        const head = Reflect.ownKeys(vueApp?._context.provides ?? {})
          .map((key) => vueApp._context.provides[key])
          .find((value) => value?.hooks?.hook && typeof value.resolveTags === 'function')
        return Boolean(
          router &&
            head &&
            nuxtApp?.isHydrating === true &&
            document.querySelectorAll('link[rel="alternate"][hreflang]').length === 2
        )
      }
    )
    const searchHead = await captureClientRouteHeadRender(page, {
      path: '/search',
      canonicalUrl: `${publicBaseUrl}/search`,
      robots: 'noindex,follow'
    })
    assert.deepEqual(
      searchHead,
      { resolvedAlternates: [], domAlternates: [], elMapAlternates: [] },
      'search render atomically removes hydrated hreflang from resolved tags, DOM, and Unhead state'
    )

    const newsHead = await captureClientRouteHeadRender(page, {
      path: '/news',
      canonicalUrl: `${publicBaseUrl}/news`,
      robots: 'index,follow'
    })
    assert.equal(newsHead.resolvedAlternates.length, 2, 'news resolved tags restore hreflang')
    assert.equal(newsHead.domAlternates.length, 2, 'news DOM restores hreflang')
    assert.equal(newsHead.elMapAlternates.length, 2, 'news Unhead state restores hreflang')
    assert.deepEqual(pageErrors, [], `client governance raised: ${pageErrors.join('; ')}`)
    assert.deepEqual(
      hydrationWarnings,
      [],
      `client governance emitted hydration warnings: ${hydrationWarnings.join('; ')}`
    )
  } finally {
    await context.close()
    await browser.close()
  }
}

// captureClientRouteHeadRender snapshots one Nuxt-owned DOM commit for the requested governed route.
async function captureClientRouteHeadRender(page, expected) {
  await page.evaluate(
    ({ path, canonicalUrl, robots }) => {
      const vueApp = document.querySelector('#__nuxt')?.__vue_app__
      const router = vueApp?.config.globalProperties.$router
      const nuxtApp = vueApp?.config.globalProperties.$nuxt
      const head = Reflect.ownKeys(vueApp?._context.provides ?? {})
        .map((key) => vueApp._context.provides[key])
        .find((value) => value?.hooks?.hook && typeof value.resolveTags === 'function')
      if (!router || !nuxtApp || !head) {
        throw new Error('Nuxt app, router, or head instance is unavailable')
      }

      const capture = {
        error: null,
        eventSequence: 0,
        events: [],
        matchingRender: null,
        result: null,
        routerResolved: false,
        removeEntriesHook: null,
        removeRenderedHook: null,
        cleanup: null
      }
      globalThis.__oesHeadLifecycleCapture = capture

      const snapshot = async (event) => {
        const resolved = await head.resolveTags()
        const currentSnapshot = {
          sequence: ++capture.eventSequence,
          event,
          currentPath: router.currentRoute.value.fullPath,
          dirty: head.dirty,
          exposure: nuxtApp.payload.state['meilong-site-route-exposure'] ?? null,
          canonical: resolved.find(
            (tag) => tag.tag === 'link' && tag.props.rel === 'canonical'
          )?.props.href,
          robots: resolved.find(
            (tag) => tag.tag === 'meta' && tag.props.name === 'robots'
          )?.props.content,
          resolvedAlternates: resolved
            .filter((tag) => tag.tag === 'link' && tag.props.rel === 'alternate')
            .map((tag) => ({ hreflang: tag.props.hreflang, href: tag.props.href })),
          domAlternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
            (link) => link.outerHTML
          ),
          elMapAlternates: [...(head._dom?.elMap.values() ?? [])]
            .filter(
              (element) =>
                element instanceof HTMLLinkElement &&
                element.rel === 'alternate' &&
                Boolean(element.hreflang)
            )
            .map((link) => link.outerHTML)
        }
        capture.events.push(currentSnapshot)
        return currentSnapshot
      }

      const fail = (error) => {
        capture.error = error instanceof Error ? error.message : String(error)
        capture.cleanup()
      }
      const finishWhenReady = () => {
        if (!capture.routerResolved || !capture.matchingRender) {
          return
        }
        capture.result = {
          resolvedAlternates: capture.matchingRender.resolvedAlternates,
          domAlternates: capture.matchingRender.domAlternates,
          elMapAlternates: capture.matchingRender.elMapAlternates
        }
        capture.cleanup()
      }
      capture.cleanup = () => {
        capture.removeEntriesHook?.()
        capture.removeRenderedHook?.()
        capture.removeEntriesHook = null
        capture.removeRenderedHook = null
      }
      capture.removeEntriesHook = head.hooks.hook('entries:updated', async () => {
        try {
          await snapshot('entries:updated')
        } catch (error) {
          fail(error)
        }
      })
      capture.removeRenderedHook = head.hooks.hook('dom:rendered', async () => {
        try {
          const renderedSnapshot = await snapshot('dom:rendered')
          if (
            !capture.matchingRender &&
            renderedSnapshot.canonical === canonicalUrl &&
            renderedSnapshot.robots === robots
          ) {
            capture.matchingRender = renderedSnapshot
            finishWhenReady()
          }
        } catch (error) {
          fail(error)
        }
      })

      Promise.resolve(router.push(path)).then(
        () => {
          capture.routerResolved = true
          capture.events.push({
            sequence: ++capture.eventSequence,
            event: 'router:resolved',
            currentPath: router.currentRoute.value.fullPath,
            dirty: head.dirty
          })
          finishWhenReady()
        },
        (error) => fail(error)
      )
    },
    expected
  )

  try {
    await page.waitForFunction(
      () => {
        const capture = globalThis.__oesHeadLifecycleCapture
        return Boolean(capture?.result || capture?.error)
      },
      undefined,
      { timeout: 15_000 }
    )
  } catch (failure) {
    const diagnostic = await page.evaluate(async ({ canonicalUrl, robots }) => {
      const vueApp = document.querySelector('#__nuxt')?.__vue_app__
      const nuxtApp = vueApp?.config.globalProperties.$nuxt
      const head = Reflect.ownKeys(vueApp?._context.provides ?? {})
        .map((key) => vueApp._context.provides[key])
        .find((value) => value?.hooks?.hook && typeof value.resolveTags === 'function')
      const capture = globalThis.__oesHeadLifecycleCapture
      const resolved = head ? await head.resolveTags() : []
      const diagnosticSnapshot = {
        expected: { canonicalUrl, robots },
        routerResolved: capture?.routerResolved ?? false,
        matchingRender: capture?.matchingRender ?? null,
        exposure: nuxtApp?.payload.state['meilong-site-route-exposure'] ?? null,
        dirty: head?.dirty,
        resolved: {
          canonical: resolved.find(
            (tag) => tag.tag === 'link' && tag.props.rel === 'canonical'
          )?.props.href,
          robots: resolved.find(
            (tag) => tag.tag === 'meta' && tag.props.name === 'robots'
          )?.props.content,
          alternates: resolved
            .filter((tag) => tag.tag === 'link' && tag.props.rel === 'alternate')
            .map((tag) => ({ hreflang: tag.props.hreflang, href: tag.props.href }))
        },
        domAlternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
          (link) => link.outerHTML
        ),
        elMapAlternates: [...(head?._dom?.elMap.values() ?? [])]
          .filter(
            (element) =>
              element instanceof HTMLLinkElement &&
              element.rel === 'alternate' &&
              Boolean(element.hreflang)
          )
          .map((link) => link.outerHTML),
        eventLog: capture?.events ?? [],
        captureError: capture?.error ?? null
      }
      capture?.cleanup?.()
      delete globalThis.__oesHeadLifecycleCapture
      return diagnosticSnapshot
    }, expected)
    throw new Error(
      `Nuxt head lifecycle did not reach the governed DOM condition: ${JSON.stringify(
        diagnostic,
        null,
        2
      )}\n${failure instanceof Error ? failure.message : String(failure)}`
    )
  }

  const outcome = await page.evaluate(() => {
    const capture = globalThis.__oesHeadLifecycleCapture
    const result = capture?.result ?? null
    const error = capture?.error ?? null
    capture?.cleanup?.()
    delete globalThis.__oesHeadLifecycleCapture
    return { result, error }
  })
  if (outcome.error) {
    throw new Error(`Nuxt head lifecycle failed: ${outcome.error}`)
  }
  if (!outcome.result) {
    throw new Error('Nuxt head lifecycle completed without a governed DOM snapshot')
  }
  return outcome.result
}

// pushClientRoute drives Nuxt's real client router and waits for its navigation promise without arbitrary sleeps.
async function pushClientRoute(page, path) {
  await page.waitForFunction(() =>
    Boolean(document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$router)
  )
  await page.evaluate(
    (targetPath) =>
      document
        .querySelector('#__nuxt')
        .__vue_app__.config.globalProperties.$router.push(targetPath),
    path
  )
}

// verifyRuntimePublicViews checks the local runtime API exposes contract-shaped content and filtered categories.
async function verifyRuntimePublicViews() {
  const categories = await json(
    `${runtimeBaseUrl}/api/public/article-categories/blog?pageKey=BLOG_LIST&locale=en-US`
  )
  assert(
    categories.items.some((category) => category.slug === 'bathroom-sink'),
    'blog category nav includes referenced category'
  )
  await verifyRetiredGenericArticleCategorySurface()
  await verifyArchiveNumericQueryContract()
  assert(
    !categories.items.some((category) => category.slug === 'unused-category'),
    'category nav excludes retired category'
  )

  const archive = await json(
    `${runtimeBaseUrl}/api/public/article-category-archives/blog/bathroom-sink?locale=en-US&page=1&pageSize=2`
  )
  assert.equal(archive.category.slug, 'bathroom-sink')
  assert.equal(archive.items.length, 2)
  assert.equal(archive.pagination.page, 1)
  assert.equal(archive.pagination.totalPages, 4)
}

// verifyRetiredGenericArticleCategorySurface keeps generic category list/detail URLs 404 while the operation-aware directory remains public.
async function verifyRetiredGenericArticleCategorySurface() {
  const operationAware = await fetch(
    `${storefrontBaseUrl}/api/public/article-categories/blog?pageKey=BLOG_LIST&locale=en-US`,
    { redirect: 'manual' }
  )
  assert.equal(operationAware.status, 200)

  for (const url of [
    `${runtimeBaseUrl}/api/public/resources/article-categories`,
    `${runtimeBaseUrl}/api/public/resources/article-categories/bathroom-sink`,
    `${storefrontBaseUrl}/api/public/article-categories`,
    `${storefrontBaseUrl}/api/public/article-categories/bathroom-sink`
  ]) {
    const response = await fetch(url, { redirect: 'manual' })
    assert.equal(response.status, 404, `${url} keeps the generic article-category surface retired`)
    assert.equal(response.headers.get('location'), null)
  }
}

// verifyArchiveNumericQueryContract proves Runtime and Nuxt HTTP boundaries reject invalid archive numbers as 400.
async function verifyArchiveNumericQueryContract() {
  const runtimeCases = [
    '/api/public/article-archives/news?year=1999',
    '/api/public/article-archives/news?page=0',
    '/api/public/article-archives/news?page=-1',
    '/api/public/article-archives/news?page=9007199254740992',
    '/api/public/article-archives/news?pageSize=49',
    '/api/public/article-archives/news?month=13',
    '/api/public/article-archives/news?year=2101',
    '/api/public/article-archives/news?page=2e3',
    '/api/public/article-archives/news?page=0xC',
    '/api/public/article-archives/news?page=%2B12',
    '/api/public/article-archives/news?page=12.0',
    '/api/public/article-archives/news?page=%2012%20',
    '/api/public/article-archives/news?month=0xC',
    '/api/public/article-archives/news?month=%2B12',
    '/api/public/article-archives/news?month=12.0',
    '/api/public/article-archives/news?month=%2012%20',
    '/api/public/article-archives/news?year=2e3',
    '/api/public/article-category-archives/blog/bathroom-sink?year=1999',
    '/api/public/article-category-archives/blog/bathroom-sink?page=0',
    '/api/public/article-category-archives/blog/bathroom-sink?page=-1',
    '/api/public/article-category-archives/blog/bathroom-sink?page=9007199254740992',
    '/api/public/article-category-archives/blog/bathroom-sink?pageSize=25',
    '/api/public/article-category-archives/blog/bathroom-sink?month=13',
    '/api/public/article-category-archives/blog/bathroom-sink?year=2101',
    '/api/public/article-category-archives/blog/bathroom-sink?page=2e3',
    '/api/public/article-category-archives/blog/bathroom-sink?page=0xC',
    '/api/public/article-category-archives/blog/bathroom-sink?page=%2B12',
    '/api/public/article-category-archives/blog/bathroom-sink?page=12.0',
    '/api/public/article-category-archives/blog/bathroom-sink?page=%2012%20',
    '/api/public/article-category-archives/blog/bathroom-sink?month=0xC',
    '/api/public/article-category-archives/blog/bathroom-sink?month=%2B12',
    '/api/public/article-category-archives/blog/bathroom-sink?month=12.0',
    '/api/public/article-category-archives/blog/bathroom-sink?month=%2012%20',
    '/api/public/article-category-archives/blog/bathroom-sink?year=2e3'
  ]
  for (const path of runtimeCases) {
    const response = await fetch(`${runtimeBaseUrl}${path}`, { redirect: 'manual' })
    assert.equal(response.status, 400, `Runtime rejects ${path} with 400`)
  }

  for (const path of [
    ...runtimeCases,
    '/api/public/article-archives/news?page=1&page=2',
    '/api/public/article-category-archives/blog/bathroom-sink?page=1&page=2'
  ]) {
    const response = await fetch(`${storefrontBaseUrl}${path}`, { redirect: 'manual' })
    assert.equal(response.status, 400, `Nuxt rejects ${path} with 400`)
  }
}

// verifyStorefrontPages checks public list, detail, category archive, and page 2 routes render actual content.
async function verifyStorefrontPages() {
  assertUniformBlogHeroStyles(blogDetailCss)
  assertRefinedBlogDetailPresentationStyles(blogDetailCss)
  await verifyBlogIndex()

  const blogDetail = await text(
    `${storefrontBaseUrl}/blogs/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience?displayCheck=${displayCacheBust}`
  )
  assert.match(
    blogDetail,
    /10 Expert Tips for Transforming Your Bathroom into the Ultimate Spa Experience/
  )
  assert.match(blogDetail, /BlogPosting/)
  assert.match(blogDetail, /dxv-header/)
  assert.match(blogDetail, /dxv-footer/)
  assert.match(blogDetail, /dv-detail-page/)
  assert.match(blogDetail, /dv-detail-hero/)
  assert.match(blogDetail, /dv-detail-paper/)
  assert.match(blogDetail, /Commercial porcelain selection starts with use conditions/)
  assert.match(blogDetail, /Share article/)
  assert.match(blogDetail, /dv-detail-share__actions/)
  assert.match(blogDetail, /aria-label="Share on Facebook"/)
  assert.match(blogDetail, /Previous/)
  assert.match(blogDetail, /Next/)
  assert.match(blogDetail, /Latest Stories/)
  assert.match(blogDetail, /Help (?:&amp;|&) Support/)

  const sinkReferenceDetail = await text(
    `${storefrontBaseUrl}/blogs/sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types?displayCheck=${displayCacheBust}`
  )
  assert.match(sinkReferenceDetail, /Choose the perfect bathroom sink for you/)
  assert.match(sinkReferenceDetail, /dxv-header/)
  assert.match(sinkReferenceDetail, /dxv-footer/)
  assert.match(sinkReferenceDetail, /dv-detail-page/)
  assert.match(sinkReferenceDetail, /dv-detail-hero/)
  assert.match(sinkReferenceDetail, /Wall Mounted Sink/)
  assert.match(sinkReferenceDetail, /Key Features to Consider/)
  assert.match(sinkReferenceDetail, /ZJocelyn/)
  assert.match(sinkReferenceDetail, /"author":\{"@type":"Person","name":"ZJocelyn"\}/)
  assert.match(sinkReferenceDetail, /Products Recommended/)
  assert.match(sinkReferenceDetail, /dv-detail-category/)
  assert.match(sinkReferenceDetail, /href="\/blogs\/categories\/bathroom-sink"/)
  assert.match(
    sinkReferenceDetail,
    /<h1[^>]*>Choose the perfect bathroom sink for you<\/h1>\s*<div class="dv-detail-category">/
  )
  assert.doesNotMatch(sinkReferenceDetail, />Category</)
  assert.match(sinkReferenceDetail, /dv-detail-tags/)
  assert.match(sinkReferenceDetail, />Tags</)
  assert.match(sinkReferenceDetail, /class="dv-detail-tag">Bathroom Design</)
  assert.match(sinkReferenceDetail, /class="dv-detail-tag">Sink Types</)
  assert.match(sinkReferenceDetail, /class="dv-detail-tag">Buying Guide</)
  assert.match(sinkReferenceDetail, /Latest Stories/)
  assert.match(sinkReferenceDetail, /mainEntityOfPage/)
  for (const imageUrl of sinkArticleImageUrls) {
    assert.match(
      sinkReferenceDetail,
      new RegExp(escapeRegExp(imageUrl)),
      `sink article renders ${imageUrl}`
    )
  }
  assert.match(
    sinkReferenceDetail,
    /canonical" href="https:\/\/meilong-ceramics\.com\/blogs\/sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types"/
  )

  const localizedSinkReferenceDetail = await text(
    `${storefrontBaseUrl}/en-US/blogs/sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types?displayCheck=${displayCacheBust}`
  )
  assert.match(localizedSinkReferenceDetail, /dv-detail-page/)
  assert.match(localizedSinkReferenceDetail, /dv-detail-hero/)
  assert.match(localizedSinkReferenceDetail, /Choose the perfect bathroom sink for you/)

  if (verificationScope === 'blog-detail') {
    return
  }

  await verifyNewsExperience()

  const categoryPageOne = await text(`${storefrontBaseUrl}/blogs/categories/bathroom-sink`)
  assert.match(categoryPageOne, /Bathroom Sink/)
  assert.match(categoryPageOne, /Choose the perfect bathroom sink for you/)
}

// verifyNewsExperience protects the commercial News archive, category route, detail semantics, and historical category redirects.
async function verifyNewsExperience() {
  await verifyNewsLexicalFilterClientIsolation()
  assertNewsLayoutContainmentStyles(blogDetailCss)
  assertNewsArticleDepthPresentation(newsArticleSource, blogDetailCss)
  assertNewsArticleAuthor(newsArticleSource)
  assertNewsLoadMoreCue(newsArchiveSource, blogDetailCss)
  assertNewsArchiveReturnState(newsArchiveSource, newsArchiveRouteSources)
  assertNewsFilterRailInteraction(newsArchiveSource, blogDetailCss)
  assertNewsDateFilterRouteReactivity(newsArchiveRouteSources)
  const newsIndex = await text(`${storefrontBaseUrl}/news`)
  assert.match(newsIndex, /dxv-news-archive/)
  assert.match(newsIndex, /dxv-news-breadcrumbs/)
  assert.match(newsIndex, /aria-label="Breadcrumb"/)
  assert.match(newsIndex, /<h1[^>]*>News<\/h1>/)
  assert.match(newsIndex, /dxv-news-filter-rail/)
  assert.match(newsIndex, /News categories/)
  assert.match(newsIndex, /Browse by date/)
  assert.match(newsIndex, /name="month"/)
  assert.match(newsIndex, /name="year"/)
  assert.match(newsIndex, /dxv-news-grid/)
  assert.match(newsIndex, /dxv-news-card/)
  assert.match(newsIndex, /dxv-news-load-state/)
  assert.match(newsIndex, /You have seen 8 from 16 articles/)
  assert.match(newsIndex, /<button[^>]*class="dxv-news-load-state__button"[^>]*>[\s\S]*?Load more/)
  assert.equal((newsIndex.match(/<article[^>]*class="dxv-news-card"/g) ?? []).length, 8)
  assert.match(newsIndex, /data-news-total="16"/)
  assert.match(newsIndex, /data-news-visible="8"/)
  assert.match(
    newsIndex,
    /Roca Strengthens Its Presence in Central Asia with a New Showroom in Almaty/
  )
  assert.match(
    newsIndex,
    /Roca Group ends 2025 with revenue of 1\.96 billion euros and a profit of 43 million euros/
  )
  assert.match(
    newsIndex,
    /The Government of Catalonia approves the urban planning for Roca City in Gavà and Viladecans/
  )
  assert.match(
    newsIndex,
    /Mediterranean Rituals: Roca explores the bathroom through architecture, design and technology/
  )
  assert.match(newsIndex, /\/images\/news-reference\/roca-almaty-showroom\.jpg/)
  assert.match(newsIndex, /\/images\/news-reference\/roca-city\.jpg/)
  assert.doesNotMatch(newsIndex, /www\.roca\.es\/documents\/portlet_file_entry/)
  assert.match(newsIndex, /href="\/news\/categories\/roca-group"/)
  assert.doesNotMatch(newsIndex, /Meilong Previews 2026 Commercial Surface Collection/)
  assert.match(newsIndex, /CollectionPage/)
  assert.match(newsIndex, /itemListOrder/)
  assert.match(newsIndex, /"numberOfItems":8/)
  await verifyNewsLoadMoreInteraction()

  const yearWithoutNews = await text(`${storefrontBaseUrl}/news?year=2024`)
  assert.match(yearWithoutNews, /No news is available in this category\./)
  assert.match(yearWithoutNews, /name="robots" content="noindex,follow"/)
  assert.match(yearWithoutNews, /canonical" href="https:\/\/meilong-ceramics\.com\/news"/)

  const newsDetail = await text(
    `${storefrontBaseUrl}/news/roca-strengthens-presence-central-asia-new-showroom-almaty`
  )
  assert.match(
    newsDetail,
    /Roca Strengthens Its Presence in Central Asia with a New Showroom in Almaty/
  )
  assert.match(newsDetail, /NewsArticle/)
  assert.match(newsDetail, /dxv-news-article/)
  assert.match(newsDetail, /dxv-news-article__breadcrumbs/)
  assert.match(newsDetail, /dxv-news-article__body/)
  assert.match(newsDetail, /By Meilong Editorial Desk/)
  assert.match(newsDetail, /new showroom in Almaty, Kazakhstan/)
  assert.match(newsDetail, /href="\/news\/categories\/roca"/)
  assert.match(
    newsDetail,
    /canonical" href="https:\/\/meilong-ceramics\.com\/news\/roca-strengthens-presence-central-asia-new-showroom-almaty"/
  )

  const financialResultsNews = await text(
    `${storefrontBaseUrl}/news/roca-group-closed-2024-with-revenues-and-investment`
  )
  assert.match(
    financialResultsNews,
    /Roca Group closed 2024 with revenues of €1\.95 billion and an investment of €155 million/
  )
  assert.match(financialResultsNews, /dxv-news-article__lead/)
  assert.match(financialResultsNews, /dxv-news-article__facts/)
  assert.match(financialResultsNews, /Financial performance/)
  assert.match(financialResultsNews, /Investment and industrial capacity/)
  assert.match(financialResultsNews, /Sustainability progress/)
  assert.match(financialResultsNews, /Portfolio expansion/)
  assert.match(financialResultsNews, /1\.948 billion euros/)
  assert.match(financialResultsNews, /dxv-news-article__media-grid/)
  assert.match(financialResultsNews, /roca-zero-emission-facility\.png/)
  assert.match(financialResultsNews, /roca-ecovadis-platinum\.jpg/)
  assert.match(financialResultsNews, /roca-kazakhstan-plant\.jpg/)
  assert.match(financialResultsNews, /"wordCount":\d{3,}/)

  const newsCategory = await text(`${storefrontBaseUrl}/news/categories/roca-group`)
  assert.match(newsCategory, /dxv-news-archive/)
  assert.match(newsCategory, /dxv-news-filter-rail/)
  assert.match(newsCategory, /Roca Group/)
  assert.match(
    newsCategory,
    /Roca Group ends 2025 with revenue of 1\.96 billion euros and a profit of 43 million euros/
  )
  assert.match(
    newsCategory,
    /href="\/news\/roca-group-ends-2025-with-revenue-of-196-billion-euros-and-a-profit-of-43-million-euros"/
  )

  const dateFilteredNewsCategory = await text(
    `${storefrontBaseUrl}/news/categories/roca-group?year=2024`
  )
  assert.match(dateFilteredNewsCategory, /No news is available in this category\./)
  assert.match(dateFilteredNewsCategory, /name="robots" content="noindex,follow"/)
  assert.match(
    dateFilteredNewsCategory,
    /canonical" href="https:\/\/meilong-ceramics\.com\/news\/categories\/roca-group"/
  )

  const oldCategory = await fetch(`${storefrontBaseUrl}/news/categories/project-news`, {
    redirect: 'manual'
  })
  assert.equal(oldCategory.status, 301)
  assert.equal(oldCategory.headers.get('location'), '/news/categories/roca-group')

  const localizedNewsDetail = await text(
    `${storefrontBaseUrl}/en-US/news/roca-strengthens-presence-central-asia-new-showroom-almaty`
  )
  assert.match(localizedNewsDetail, /dxv-news-article/)
  assert.match(localizedNewsDetail, /NewsArticle/)
  assert.match(
    localizedNewsDetail,
    /canonical" href="https:\/\/meilong-ceramics\.com\/news\/roca-strengthens-presence-central-asia-new-showroom-almaty"/
  )
  assert.doesNotMatch(
    localizedNewsDetail,
    /canonical" href="https:\/\/meilong-ceramics\.com\/en-US\/news\/roca-strengthens-presence-central-asia-new-showroom-almaty"/
  )

  const localizedNewsIndex = await text(`${storefrontBaseUrl}/en-US/news`)
  assert.match(localizedNewsIndex, /dxv-news-archive/)
  assert.match(localizedNewsIndex, /href="\/news\/categories\/roca-group"/)
  assert.doesNotMatch(localizedNewsIndex, /href="\/en-US\/news\/categories\/roca-group"/)

  const localizedNewsCategory = await text(`${storefrontBaseUrl}/en-US/news/categories/roca-group`)
  assert.match(localizedNewsCategory, /dxv-news-archive/)
  assert.match(localizedNewsCategory, /Roca Group/)

  await verifyArchiveVolumeSurfaces()
}

// verifyNewsLoadMoreInteraction proves the unchanged cue fetches page two and restores only its route-local session.
async function verifyNewsLoadMoreInteraction() {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const continuationRequests = []
  page.on('request', (request) => {
    if (request.url().includes('/api/public/article-archives/news')) {
      continuationRequests.push(request.url())
    }
  })

  try {
    await page.goto(`${storefrontBaseUrl}/news`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => {
      const nuxtApp = document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt
      return nuxtApp?.isHydrating === false
    })
    await page.getByRole('button', { name: 'Load more' }).click()
    try {
      await page.locator('[data-news-visible="16"]').waitFor()
    } catch (failure) {
      const diagnostic = await page.evaluate(() => {
        const grid = document.querySelector('[data-news-visible]')
        const loaderBar = document.querySelector('.dxv-news-load-state__loader-bar:last-child')
        return {
          grid: grid?.outerHTML.slice(0, 500),
          loader: document.querySelector('.dxv-news-load-state__loader')?.outerHTML,
          loaderAnimation: loaderBar ? getComputedStyle(loaderBar).animation : null,
          visible: grid?.getAttribute('data-news-visible')
        }
      })
      throw new Error(
        `News load-more stalled: ${JSON.stringify({ continuationRequests, diagnostic })}\n${
          failure instanceof Error ? failure.message : String(failure)
        }`
      )
    }
    assert.equal(await page.locator('article.dxv-news-card').count(), 16)
    assert(
      continuationRequests.some((url) => /[?&]page=2(?:&|$)/.test(url)),
      `News load-more did not request page 2: ${continuationRequests.join(', ')}`
    )

    await pushClientRoute(page, '/news?year=2024')
    await page.getByRole('heading', { name: 'No news is available in this category.' }).waitFor()
    await pushClientRoute(page, '/news')
    await page.locator('[data-news-visible="16"]').waitFor()
    assert.equal(await page.locator('article.dxv-news-card').count(), 16)
  } finally {
    await context.close()
    await browser.close()
  }
}

// verifyNewsLexicalFilterClientIsolation proves invalid-to-valid filter navigation rebuilds default and localized category sessions without mixed cards.
async function verifyNewsLexicalFilterClientIsolation() {
  seedNewsYearFilterFixtures()
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const archiveRequests = []
  page.on('request', (request) => {
    if (/\/api\/public\/article-(?:category-)?archives\/news/.test(request.url())) {
      archiveRequests.push(request.url())
    }
  })

  try {
    await assertNewsLexicalFilterRoute(page, archiveRequests, {
      invalidPath: '/news?year=2e3',
      validPath: '/news?year=2000'
    })

    setDisplayPublicationLocales('fr-FR', ['fr-FR', 'en-US'])
    await assertNewsLexicalFilterRoute(page, archiveRequests, {
      invalidPath: '/en-US/news/categories/roca-group?year=2e3',
      validPath: '/en-US/news/categories/roca-group?year=2000'
    })
  } finally {
    setDisplayPublicationLocales('en-US', ['en-US'])
    removeNewsYearFilterFixtures()
    await context.close()
    await browser.close()
  }
}

// assertNewsLexicalFilterRoute checks one hydrated invalid-to-valid route transition and its filtered continuation page.
async function assertNewsLexicalFilterRoute(page, requests, { invalidPath, validPath }) {
  await page.goto(`${storefrontBaseUrl}${invalidPath}`, { waitUntil: 'domcontentloaded' })
  await waitForNuxtHydration(page)
  assert.equal(await page.locator('article.dxv-news-card').count(), 8)
  assert.equal(await page.locator('article.dxv-news-card time[datetime^="2000-"]').count(), 0)

  requests.length = 0
  await pushClientRoute(page, validPath)
  await page.evaluate(() => new Promise(requestAnimationFrame))
  assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, validPath)
  await page.locator('article.dxv-news-card time[datetime^="2000-"]').nth(7).waitFor()
  assert.equal(await page.locator('article.dxv-news-card').count(), 8)
  assert.equal(
    await page.locator('article.dxv-news-card time[datetime^="2000-"]').count(),
    8,
    `${validPath} replaces the invalid-filter cards after requests: ${requests.join(', ')}`
  )
  assert(
    requests.some((url) => /[?&]year=2000(?:&|$)/.test(url) && /[?&]page=1(?:&|$)/.test(url)),
    `${validPath} creates a new page-one filtered Runtime read: ${requests.join(', ')}`
  )

  await page.getByRole('button', { name: 'Load more' }).click()
  await page.locator('[data-news-visible="16"]').waitFor()
  assert.equal(await page.locator('article.dxv-news-card').count(), 16)
  assert.equal(await page.locator('article.dxv-news-card time[datetime^="2000-"]').count(), 16)
  assert(
    requests.some((url) => /[?&]year=2000(?:&|$)/.test(url) && /[?&]page=2(?:&|$)/.test(url)),
    `${validPath} keeps page-two continuation inside the year-2000 filter: ${requests.join(', ')}`
  )
}

// verifyArchiveVolumeSurfaces proves 49+ rows remain reachable through Runtime pages, SSR, filters, and sitemap details.
async function verifyArchiveVolumeSurfaces() {
  seedArchiveVolumeFixtures()

  const newsLaterPage = await json(
    `${runtimeBaseUrl}/api/public/article-archives/news?locale=en-US&page=7&pageSize=8`
  )
  assert.equal(newsLaterPage.pagination.totalItems, 65)
  assert.equal(newsLaterPage.pagination.totalPages, 9)
  assert(newsLaterPage.items.some((item) => item.slug.startsWith('volume-news-')))
  const publicConfig = await json(`${runtimeBaseUrl}/api/public/site-config`)
  assert.equal(
    newsLaterPage.committedPublishVersion,
    publicConfig.committedPublishVersion
  )

  const newsVolumeSsr = await text(`${storefrontBaseUrl}/news?volumeCheck=${displayCacheBust}`)
  assert.match(newsVolumeSsr, /data-news-total="65"/)
  assert.equal((newsVolumeSsr.match(/<article[^>]*class="dxv-news-card"/g) ?? []).length, 8)

  const categoryLaterPage = await json(
    `${runtimeBaseUrl}/api/public/article-category-archives/news/roca-group?locale=en-US&year=2023&page=7&pageSize=8`
  )
  assert.deepEqual(categoryLaterPage.pagination, {
    page: 7,
    pageSize: 8,
    totalItems: 49,
    totalPages: 7
  })
  assert.equal(categoryLaterPage.items.length, 1)
  const categoryVolumeSsr = await text(`${storefrontBaseUrl}/news/categories/roca-group?year=2023`)
  assert.match(categoryVolumeSsr, /data-news-total="49"/)
  assert.match(categoryVolumeSsr, /<option value="2023" selected>2023<\/option>/)

  const newsCategoryPageTwo = await text(`${storefrontBaseUrl}/news/categories/roca-group?page=2`)
  assert.match(
    newsCategoryPageTwo,
    /canonical" href="https:\/\/meilong-ceramics\.com\/news\/categories\/roca-group\?page=2"/
  )
  assert.match(newsCategoryPageTwo, /name="robots" content="index,follow"/)
  assert.match(
    newsCategoryPageTwo,
    /rel="alternate" hreflang="en-US" href="https:\/\/meilong-ceramics\.com\/news\/categories\/roca-group\?page=2"/
  )
  assert.match(
    newsCategoryPageTwo,
    /rel="prev" href="https:\/\/meilong-ceramics\.com\/news\/categories\/roca-group"/
  )
  assert.match(
    newsCategoryPageTwo,
    /rel="next" href="https:\/\/meilong-ceramics\.com\/news\/categories\/roca-group\?page=3"/
  )
  assert.match(newsCategoryPageTwo, /"position":9/)
  assert.match(newsCategoryPageTwo, />\s*Previous\s*<\/a>/)
  assert.match(newsCategoryPageTwo, />\s*Next\s*<\/a>/)

  const newsCategoryLeadingZero = await text(
    `${storefrontBaseUrl}/news/categories/roca-group?page=02`
  )
  assert.match(
    newsCategoryLeadingZero,
    /canonical" href="https:\/\/meilong-ceramics\.com\/news\/categories\/roca-group"/
  )
  assert.match(newsCategoryLeadingZero, /name="robots" content="noindex,follow"/)
  assert.match(newsCategoryLeadingZero, /"position":1/)
  assert.doesNotMatch(newsCategoryLeadingZero, /"position":9/)

  const newsCategoryBeyond = await fetch(
    `${storefrontBaseUrl}/news/categories/roca-group?page=99`,
    { redirect: 'manual' }
  )
  assert.equal(newsCategoryBeyond.status, 404)
  const localizedNewsCategoryPageTwo = await fetch(
    `${storefrontBaseUrl}/en-US/news/categories/roca-group?page=2`,
    { redirect: 'manual' }
  )
  assert.equal(localizedNewsCategoryPageTwo.status, 301)
  assert.equal(
    localizedNewsCategoryPageTwo.headers.get('location'),
    '/news/categories/roca-group?page=2'
  )

  const blogFirstPage = await json(
    `${runtimeBaseUrl}/api/public/article-archives/blog?locale=en-US&page=1&pageSize=9`
  )
  assert(blogFirstPage.pagination.totalItems > 49)
  const blogLastPage = await text(
    `${storefrontBaseUrl}/blogs?page=${blogFirstPage.pagination.totalPages}`
  )
  assert.match(blogLastPage, /Archive Volume Blog/)

  const blogCategoryPageTwo = await text(`${storefrontBaseUrl}/blogs/categories/bathroom-sink?page=2`)
  assert.match(
    blogCategoryPageTwo,
    /canonical" href="https:\/\/meilong-ceramics\.com\/blogs\/categories\/bathroom-sink\?page=2"/
  )
  assert.match(blogCategoryPageTwo, /name="robots" content="index,follow"/)
  assert.match(blogCategoryPageTwo, /"position":10/)
  assert.match(blogCategoryPageTwo, />\s*Previous\s*<\/a>/)
  assert.match(blogCategoryPageTwo, />\s*Next\s*<\/a>/)
  const blogCategoryLeadingZero = await text(
    `${storefrontBaseUrl}/blogs/categories/bathroom-sink?page=02`
  )
  assert.match(
    blogCategoryLeadingZero,
    /canonical" href="https:\/\/meilong-ceramics\.com\/blogs\/categories\/bathroom-sink"/
  )
  assert.match(blogCategoryLeadingZero, /name="robots" content="noindex,follow"/)
  assert.match(blogCategoryLeadingZero, /"position":1/)
  assert.doesNotMatch(blogCategoryLeadingZero, /"position":10/)
  const blogCategoryBeyond = await fetch(
    `${storefrontBaseUrl}/blogs/categories/bathroom-sink?page=99`,
    { redirect: 'manual' }
  )
  assert.equal(blogCategoryBeyond.status, 404)

  const newsRootLeadingZero = await text(`${storefrontBaseUrl}/news?page=02`)
  assert.match(
    newsRootLeadingZero,
    /canonical" href="https:\/\/meilong-ceramics\.com\/news"/
  )
  assert.match(newsRootLeadingZero, /name="robots" content="noindex,follow"/)
  assert.match(newsRootLeadingZero, /"position":1/)
  assert.doesNotMatch(newsRootLeadingZero, /"position":9/)

  const [routeIndex, sitemap] = await Promise.all([
    json(`${runtimeBaseUrl}/api/public/seo/route-index`),
    text(`${storefrontBaseUrl}/sitemap.xml`)
  ])
  assert(routeIndex.routes.some((route) => route.path === '/news/volume-news-048'))
  assert(routeIndex.routes.some((route) => route.path === '/blogs/volume-blog-048'))
  assert.match(sitemap, /https:\/\/meilong-ceramics\.com\/news\/volume-news-048<\/loc>/)
  assert.match(sitemap, /https:\/\/meilong-ceramics\.com\/blogs\/volume-blog-048<\/loc>/)
}

// verifyFaqExperience protects the FAQ route's SSR, structured-data, accessibility, and support-discovery surfaces.
async function verifyFaqExperience() {
  assert.match(faqDataSource, /export type FaqCategory/)
  assert.match(faqDataSource, /locale: 'en-US'/)
  assert.match(faqDataSource, /function buildFaqPageStructuredData\(canonicalUrl: string\)/)
  assert.match(faqPageSource, /aria-label="FAQ categories"/)
  assert.match(faqPageSource, /aria-controls/)
  assert.match(faqPageSource, /role="region"/)
  assert.match(faqPageSource, /@keydown\.esc="closeOpenQuestion"/)
  assert.match(faqPageSource, /@media \(max-width: 760px\)/)
  assert.match(faqPageSource, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(faqPageSource, /--faq-paper: var\(--dxv-white, #ffffff\)/)
  assert.match(faqPageSource, /\.dxv-faq-page h1\s*\{[\s\S]*?font-family: var\(--dxv-body/)
  assert.match(
    faqPageSource,
    /\.dxv-faq-page__category-heading h2\s*\{[\s\S]*?font-family: var\(--dxv-body/
  )
  assert.doesNotMatch(faqPageSource, /#866653/)
  assert.match(faqPageSource, /\.dxv-faq-page__hero\s*\{[\s\S]*?background: var\(--faq-paper\)/)
  assert.doesNotMatch(faqPageSource, /box-shadow: inset 3px 0 0 var\(--faq-ink\)/)
  assert.doesNotMatch(
    faqPageSource,
    /\.dxv-faq-page__item:hover \.dxv-faq-page__toggle-mark\s*\{[^}]*transform/
  )
  assert.match(
    faqPageSource,
    /@media \(hover: hover\)\s*\{[\s\S]*?\.dxv-faq-page__item:hover button > span:first-child::after\s*\{[\s\S]*?transform: scaleX\(1\)/
  )
  await verifyFaqInteractions()
  assert.match(footerSource, /\{ label: 'FAQ', href: '\/faqs' \}/)
  assert.match(contactPageSource, /<NuxtLink to="\/faqs">frequently asked questions<\/NuxtLink>/)

  const faqPage = await text(`${storefrontBaseUrl}/faqs`)
  assert.match(faqPage, /<h1[^>]*>FAQ \/ Help<\/h1>/)
  assert.match(faqPage, /dxv-faq-page/)
  assert.match(faqPage, /dxv-header/)
  assert.match(faqPage, /dxv-footer/)
  assert.match(faqPage, /aria-label="FAQ categories"/)
  assert.match(faqPage, /aria-expanded="false"/)
  assert.match(faqPage, /role="region"/)
  assert.match(faqPage, /Orders &amp; Shipping/)
  assert.match(faqPage, /Returns &amp; Warranty/)
  assert.match(faqPage, /Product Care &amp; Installation/)
  assert.match(faqPage, /Finishes &amp; Samples/)
  assert.match(faqPage, /Account &amp; Support/)
  assert.match(faqPage, /When will my order begin processing\?/)
  assert.match(faqPage, /Contact Customer Service/)
  assert.match(faqPage, /FAQPage/)
  assert.match(faqPage, /canonical" href="https:\/\/meilong-ceramics\.com\/faqs"/)

  const routeIndexResponse = await fetch(`${runtimeBaseUrl}/api/public/seo/route-index`)
  assert.equal(
    routeIndexResponse.status,
    200,
    `FAQ Runtime SEO route-index returned ${routeIndexResponse.status}`
  )
  const routeIndex = await routeIndexResponse.json()
  const faqRoute = routeIndex.pages.find(
    (page) => page.pageKey === 'FAQ' && page.locale === routeIndex.defaultLocale
  )
  assert(faqRoute, 'Runtime SEO route-index omits the default-locale FAQ page')
  assert.equal(
    faqRoute.indexEligible,
    true,
    'Runtime SEO route-index marks the default-locale FAQ page as non-index-eligible'
  )

  const sitemapResponse = await fetch(`${storefrontBaseUrl}/sitemap.xml`)
  assert.equal(sitemapResponse.status, 200, `FAQ sitemap returned ${sitemapResponse.status}`)
  assert.equal(
    sitemapResponse.headers.get('x-oes-site-exposure-version'),
    String(routeIndex.committedPublishVersion),
    'Sitemap publication version differs from the Runtime SEO route-index'
  )
  const sitemap = await sitemapResponse.text()
  assert.match(
    sitemap,
    /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
    'Sitemap does not expose the expected XML urlset document'
  )
  const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, location]) => location
  )
  const faqCanonicalUrl = `${routeIndex.publicBaseUrl.replace(/\/$/, '')}/faqs`
  assert(
    sitemapLocations.includes(faqCanonicalUrl),
    `Sitemap omits the canonical FAQ path ${faqCanonicalUrl}`
  )
  assert(
    !sitemapLocations.includes(`${routeIndex.publicBaseUrl.replace(/\/$/, '')}/faq`),
    'Sitemap exposes the legacy /faq path'
  )
  const sitemapPaths = sitemapLocations.map((location) => new URL(location).pathname)
  assert(!sitemapPaths.includes('/search'), 'Sitemap exposes the noindex /search page')
  assert(
    !sitemapPaths.some((path) => path === '/preview' || path.startsWith('/preview/')),
    'Sitemap exposes a preview path'
  )
}

// verifyFaqInteractions protects the observable hover, accordion, keyboard, focus, and reduced-motion contract in Chromium.
async function verifyFaqInteractions() {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  let context
  let reducedMotionContext

  try {
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
    const page = await context.newPage()
    await page.goto(`${storefrontBaseUrl}/faqs`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => {
      const vueApp = document.querySelector('#__nuxt')?.__vue_app__
      const nuxtApp = vueApp?.config.globalProperties.$nuxt
      return Boolean(
        vueApp?.config.globalProperties.$router &&
          vueApp?._instance?.isMounted &&
          nuxtApp?.isHydrating === false
      )
    })
    const hydrationComplete = await page.evaluate(() =>
      document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating ===
      false
    )
    assert.equal(
      hydrationComplete,
      true,
      'FAQ interaction readiness resolved before Nuxt hydration completed'
    )

    const question = page.getByRole('button', {
      name: 'When will my order begin processing?'
    })
    await question.waitFor()
    const questionId = await question.getAttribute('id')
    assert(questionId, 'FAQ question button does not expose a stable id')

    const closed = await readFaqQuestionState(question)
    assert.equal(closed.expanded, 'false')
    assert.equal(closed.answerHidden, 'true')
    assert.equal(closed.itemOpen, false)
    assert(Math.abs(closed.toggleAfterVerticalComponent) > 0.98, 'closed FAQ icon is a plus')

    await question.hover()
    await page.waitForFunction(
      (buttonId) => {
        const button = document.getElementById(buttonId)
        if (!button) return false
        const label = button.querySelector('span:not(.dxv-faq-page__toggle-mark)')
        const transform = label ? getComputedStyle(label, '::after').transform : 'none'
        return transform !== 'none' && new DOMMatrixReadOnly(transform).a > 0.01
      },
      questionId
    )
    const hovered = await readFaqQuestionState(question)
    assert.equal(hovered.toggleTransform, closed.toggleTransform)
    assert.equal(hovered.toggleBeforeTransform, closed.toggleBeforeTransform)
    assert.equal(hovered.toggleAfterTransform, closed.toggleAfterTransform)
    assert(
      hovered.questionUnderlineScale > closed.questionUnderlineScale,
      'FAQ hover reveals only the question underline'
    )

    await question.click()
    await page.waitForFunction(
      (buttonId) => {
        const button = document.getElementById(buttonId)
        if (!button) return false
        const item = button.closest('.dxv-faq-page__item')
        const answer = document.getElementById(button.getAttribute('aria-controls'))
        const mark = button.querySelector('.dxv-faq-page__toggle-mark')
        const transform = mark ? getComputedStyle(mark, '::after').transform : 'none'
        return (
          button.getAttribute('aria-expanded') === 'true' &&
          answer?.getAttribute('aria-hidden') === 'false' &&
          item?.classList.contains('is-open') &&
          transform !== 'none' &&
          Math.abs(new DOMMatrixReadOnly(transform).b) < 0.02 &&
          Number(getComputedStyle(answer).opacity) > 0.99
        )
      },
      questionId
    )
    const expanded = await readFaqQuestionState(question)
    assert.equal(expanded.expanded, 'true')
    assert.equal(expanded.answerHidden, 'false')
    assert.equal(expanded.itemOpen, true)
    assert.equal(
      expanded.toggleTransform,
      closed.toggleTransform,
      'expanded FAQ hover does not transform the toggle mark'
    )
    assert.equal(expanded.toggleBeforeTransform, closed.toggleBeforeTransform)
    assert(
      Math.abs(expanded.toggleAfterVerticalComponent) < 0.02,
      'expanded FAQ icon is a minus'
    )

    await question.press('Escape')
    await page.waitForFunction(
      (buttonId) => {
        const button = document.getElementById(buttonId)
        if (!button) return false
        const item = button.closest('.dxv-faq-page__item')
        const answer = document.getElementById(button.getAttribute('aria-controls'))
        return (
          button.getAttribute('aria-expanded') === 'false' &&
          answer?.getAttribute('aria-hidden') === 'true' &&
          !item?.classList.contains('is-open') &&
          Number(getComputedStyle(answer).opacity) < 0.01 &&
          Math.abs(new DOMMatrixReadOnly(
            getComputedStyle(button.querySelector('.dxv-faq-page__toggle-mark'), '::after')
              .transform
          ).b) > 0.98
        )
      },
      questionId
    )
    await page.waitForFunction(
      (buttonId) => {
        const button = document.getElementById(buttonId)
        if (!button) return false
        const style = getComputedStyle(button)
        return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2
      },
      questionId
    )
    const escaped = await readFaqQuestionState(question)
    assert.equal(escaped.expanded, 'false')
    assert.equal(escaped.answerHidden, 'true')
    assert.equal(escaped.itemOpen, false)
    assert(Math.abs(escaped.toggleAfterVerticalComponent) > 0.98, 'closed FAQ icon returns to a plus')
    assert.notEqual(escaped.outlineStyle, 'none')
    assert(escaped.outlineWidth >= 2, 'FAQ keyboard focus remains visible')

    reducedMotionContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      reducedMotion: 'reduce'
    })
    const reducedMotionPage = await reducedMotionContext.newPage()
    await reducedMotionPage.goto(`${storefrontBaseUrl}/faqs`, {
      waitUntil: 'domcontentloaded'
    })
    const reducedMotionQuestion = reducedMotionPage.getByRole('button', {
      name: 'When will my order begin processing?'
    })
    await reducedMotionQuestion.waitFor()
    const reducedMotion = await readFaqQuestionState(reducedMotionQuestion)

    for (const key of [
      'buttonTransitionDuration',
      'toggleTransitionDuration',
      'toggleAfterTransitionDuration',
      'answerTransitionDuration'
    ]) {
      assert(
        reducedMotion[key] <= 0.1,
        `FAQ reduced-motion ${key} remains above 0.1ms`
      )
      assert(
        reducedMotion[key] < closed[key],
        `FAQ reduced-motion ${key} was not reduced`
      )
    }
  } finally {
    await reducedMotionContext?.close()
    await context?.close()
    await browser.close()
  }
}

// readFaqQuestionState samples one question's public ARIA state and computed visual affordances without fixed delays.
async function readFaqQuestionState(question) {
  return question.evaluate((button) => {
    const item = button.closest('.dxv-faq-page__item')
    const answer = document.getElementById(button.getAttribute('aria-controls'))
    const toggle = button.querySelector('.dxv-faq-page__toggle-mark')
    const label = button.querySelector('span:not(.dxv-faq-page__toggle-mark)')

    // transitionDuration converts every CSS duration list into its longest observable duration in milliseconds.
    const transitionDuration = (style) =>
      Math.max(
        ...style.transitionDuration.split(',').map((duration) => {
          const value = Number.parseFloat(duration)
          return duration.trim().endsWith('ms') ? value : value * 1_000
        })
      )
    const toggleAfterTransform = toggle ? getComputedStyle(toggle, '::after').transform : 'none'
    const labelAfterTransform = label ? getComputedStyle(label, '::after').transform : 'none'

    return {
      expanded: button.getAttribute('aria-expanded'),
      answerHidden: answer?.getAttribute('aria-hidden'),
      itemOpen: item?.classList.contains('is-open') ?? false,
      toggleTransform: toggle ? getComputedStyle(toggle).transform : 'none',
      toggleBeforeTransform: toggle ? getComputedStyle(toggle, '::before').transform : 'none',
      toggleAfterTransform,
      toggleAfterVerticalComponent:
        toggleAfterTransform === 'none' ? 0 : new DOMMatrixReadOnly(toggleAfterTransform).b,
      questionUnderlineScale:
        labelAfterTransform === 'none' ? 0 : new DOMMatrixReadOnly(labelAfterTransform).a,
      outlineStyle: getComputedStyle(button).outlineStyle,
      outlineWidth: Number.parseFloat(getComputedStyle(button).outlineWidth),
      buttonTransitionDuration: transitionDuration(getComputedStyle(button)),
      toggleTransitionDuration: toggle ? transitionDuration(getComputedStyle(toggle)) : 0,
      toggleAfterTransitionDuration: toggle
        ? transitionDuration(getComputedStyle(toggle, '::after'))
        : 0,
      answerTransitionDuration: answer ? transitionDuration(getComputedStyle(answer)) : 0
    }
  })
}

// verifyInspirationsExperience checks the inspiration gallery hierarchy, category behavior, masonry behavior, and SSR metadata.
async function verifyInspirationsExperience() {
  assert.match(inspirationArchiveSource, /WebPage/)
  assert.match(inspirationArchiveSource, /INSPIRATION \/ EDIT/)
  assert.match(inspirationArchiveSource, /Kids/)
  assert.match(
    inspirationArchiveSource,
    /Warm, considered spaces designed to live beautifully with our closest companions\./
  )
  assert.match(inspirationArchiveSource, /westelm-kids-reference/)
  assert.match(inspirationArchiveSource, /INITIAL_VISIBLE_TILE_COUNT = 28/)
  assert.match(inspirationArchiveSource, /AUTO_LOAD_TILE_COUNT = 20/)
  assert.match(inspirationArchiveSource, /AUTO_LOAD_DELAY_MS = 2_000/)
  assert.match(inspirationArchiveSource, /PENDING_SKELETON_ASPECT_RATIO = 0\.66/)
  assert.match(inspirationArchiveSource, /TARGET_IMAGE_ASPECT_RATIO_SCALE = 0\.838/)
  assert.match(inspirationArchiveSource, /COMPACT_GALLERY_COLUMN_QUERY = '\(max-width: 1023px\)'/)
  assert.match(inspirationArchiveSource, /MOBILE_GALLERY_COLUMN_QUERY = '\(max-width: 767px\)'/)
  assert.match(
    inspirationArchiveSource,
    /masonryColumnCount\.value = mobileGalleryColumnQuery\?\.matches \? 2 : compactGalleryColumnQuery\?\.matches \? 3 : 4/
  )
  assert.match(inspirationArchiveSource, /IntersectionObserver/)
  assert.match(inspirationArchiveSource, /loadNextTiles/)
  assert.match(inspirationArchiveSource, /pendingSkeletonTiles/)
  assert.match(inspirationArchiveSource, /displayAspectRatio: PENDING_SKELETON_ASPECT_RATIO/)
  assert.match(
    inspirationArchiveSource,
    /displayAspectRatio: isImageLoaded\(tile\.src\) \? tile\.aspectRatio \* TARGET_IMAGE_ASPECT_RATIO_SCALE : PENDING_SKELETON_ASPECT_RATIO/
  )
  assert.match(inspirationArchiveSource, /--westelm-kids-aspect': masonryTile\.displayAspectRatio/)
  assert.match(inspirationArchiveSource, /markImageLoaded/)
  assert.match(inspirationArchiveSource, /layoutMasonryTiles/)
  assert.match(inspirationArchiveSource, /ResizeObserver/)
  assert.match(inspirationArchiveSource, /const masonryContainerWidth = ref\(0\)/)
  assert.match(inspirationArchiveSource, /--westelm-kids-masonry-x/)
  assert.match(inspirationArchiveSource, /--westelm-kids-masonry-y/)
  assert.match(inspirationArchiveSource, /data-inspiration-tile-source/)
  assert.doesNotMatch(inspirationArchiveSource, /queueMasonryReflow/)
  assert.match(inspirationArchiveSource, /westelm-kids-inspiration__tile-skeleton/)
  assert.match(inspirationArchiveSource, /westelm-kids-inspiration__load-sentinel/)
  assert.match(
    inspirationArchiveSource,
    /function openLightbox\(tile: InspirationTile, event: MouseEvent\)/
  )
  assert.match(inspirationArchiveSource, /function closeLightbox\(\)/)
  assert.match(inspirationArchiveSource, /function handleLightboxKeydown\(event: KeyboardEvent\)/)
  assert.match(
    inspirationArchiveSource,
    /function closeLightboxHotspot\(\) \{\s+activeLightboxHotspotIndex\.value = null\s+\}/
  )
  assert.match(inspirationArchiveSource, /function restoreLightboxHotspotFocus\(\)/)
  assert.match(inspirationArchiveSource, /const isLightboxVisible = ref\(false\)/)
  assert.match(inspirationArchiveSource, /const activeLightboxIndex = ref<number \| null>\(null\)/)
  assert.match(inspirationArchiveSource, /const activeLightboxTile = computed\(\(\)/)
  assert.doesNotMatch(inspirationArchiveSource, /const lightboxThumbnails = computed\(\(\)/)
  assert.match(inspirationArchiveSource, /function showPreviousLightboxTile\(\)/)
  assert.match(inspirationArchiveSource, /function showNextLightboxTile\(\)/)
  assert.match(inspirationArchiveSource, /function selectLightboxTile\(index: number\)/)
  assert.match(inspirationArchiveSource, /inspirationHotspotProducts/)
  assert.match(inspirationArchiveSource, /const orderedLightboxProducts = computed/)
  assert.match(
    inspirationArchiveSource,
    /<Transition name="dxv-drawer" @after-leave="restoreLightboxHotspotFocus">/
  )
  assert.match(inspirationArchiveSource, /<InspirationProductDrawer/)
  assert.match(inspirationArchiveSource, /:products="orderedLightboxProducts"/)
  assert.match(
    inspirationProductDrawerSource,
    /class="right-modal dialog-modal dialog-open dxv-look-dialog westelm-kids-inspiration__product-drawer"/
  )
  assert.match(inspirationProductDrawerSource, /Products in Look/)
  assert.match(inspirationProductDrawerSource, /aria-labelledby="inspiration-product-drawer-title"/)
  assert.match(inspirationProductDrawerSource, /dialogRef\.value\.showModal\(\)/)
  assert.doesNotMatch(inspirationProductDrawerSource, /onBeforeUnmount/)
  assert.doesNotMatch(inspirationProductDrawerSource, /dialogRef\.value\.close\(\)/)
  assert.doesNotMatch(inspirationArchiveSource, /westelm-kids-inspiration__hotspot-product/)
  assert.doesNotMatch(inspirationCss, /\.westelm-kids-inspiration__hotspot-product/)
  assert.match(
    inspirationCss,
    /\.dxv-look-dialog\.westelm-kids-inspiration__product-drawer\s*\{[^}]*left: max\(0px, calc\(100vw - 448px\)\);[^}]*width: min\(448px, 100vw\);/
  )
  assert.match(
    inspirationArchiveSource,
    /:disabled="masonryTile\.isPending \|\| !isImageLoaded\(masonryTile\.tile\.src\)"/
  )
  assert.doesNotMatch(inspirationArchiveSource, /lightboxSourceRect/)
  assert.doesNotMatch(inspirationArchiveSource, /prepareLightboxMotion/)
  assert.doesNotMatch(inspirationArchiveSource, /handleLightboxStageTransitionEnd/)
  assert.match(inspirationArchiveSource, /aria-label="Open enlarged inspiration image"/)
  assert.doesNotMatch(inspirationArchiveSource, /aria-label="Close enlarged image"/)
  assert.doesNotMatch(inspirationArchiveSource, /aria-label="Show previous inspiration image"/)
  assert.doesNotMatch(inspirationArchiveSource, /aria-label="Show next inspiration image"/)
  assert.match(inspirationArchiveSource, /ref="lightboxDialog"/)
  assert.match(inspirationArchiveSource, /tabindex="-1"/)
  assert.match(inspirationArchiveSource, /lightboxDialog\.value\?\.focus\(\)/)
  assert.match(inspirationProductDrawerSource, /:aria-label="`View \$\{product\.title\}`"/)
  assert.doesNotMatch(inspirationArchiveSource, /@click\.self="closeLightbox"/)
  assert.match(inspirationArchiveSource, /@click="closeLightbox"/)
  assert.match(inspirationArchiveSource, /<figure[^>]*@click\.stop/)
  assert.match(
    inspirationArchiveSource,
    /<div(?=[^>]*\bv-if="!hasMoreTiles && !isLoadingMore")(?=[^>]*\bclass="westelm-kids-inspiration__end-sentinel")(?=[^>]*\baria-live="polite")[^>]*>\s*<p class="westelm-kids-inspiration__end-state">You've reached the end<\/p>\s*<\/div>/
  )
  assert.doesNotMatch(
    inspirationArchiveSource,
    /'is-complete':\s*!hasMoreTiles\s*&&\s*!isLoadingMore/
  )
  assert.doesNotMatch(inspirationArchiveSource, /v-else-if="!hasMoreTiles"/)
  assert.match(inspirationFixtureSource, /capturedFixtureRows/)
  assert.match(inspirationFixtureSource, /inspirationHotspotProducts/)
  assert.match(inspirationFixtureSource, /Kane 2-Piece Wedge Chaise Sectional/)
  assert.equal(
    [
      ...inspirationFixtureSource.matchAll(
        /https:\/\/www\.westelm\.com\/netstorage\/images\/edam\//g
      )
    ].length,
    111,
    'full captured reference fixture contains 111 image URLs'
  )
  assert.match(inspirationArchiveSource, /westelm-kids-inspiration__filters/)
  assert.match(inspirationArchiveSource, /westelm-kids-inspiration__masonry/)
  assert.match(
    inspirationFixtureSource,
    /001-pl-su26-wek-pink-chicken-kid-room-floral--main-v01-262\.jpg/
  )
  assert.match(inspirationCss, /\.westelm-kids-inspiration\s*\{[^}]*background: #ffffff;/)
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__masonry\s*\{[^}]*position: relative;[^}]*width: min\(1680px, 100%\);[^}]*margin: 0 auto;/
  )
  assert.match(inspirationCss, /\.westelm-kids-inspiration__masonry\s*\{[^}]*opacity: 0;/)
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__intro\s*\{[^}]*padding: 70px 80px 32px;[^}]*text-align: center;/
  )
  assert.match(inspirationCss, /\.westelm-kids-inspiration__intro h1\s*\{[^}]*max-width: none;/)
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__tile\s*\{[^}]*position: absolute;[^}]*transform: translate3d\(var\(--westelm-kids-masonry-x\), var\(--westelm-kids-masonry-y\), 0\);[^}]*transition: transform 200ms ease;/
  )
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__tile-skeleton::after\s*\{[^}]*animation: westelm-kids-tile-skeleton-shimmer/
  )
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__tile\.is-loaded .westelm-kids-inspiration__tile-skeleton\s*\{[^}]*opacity: 0;/
  )
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__end-sentinel\s*\{(?=[^}]*min-height:\s*0;)(?=[^}]*padding:\s*36px 0 52px;)[^}]*\}/
  )
  assert.doesNotMatch(
    inspirationCss,
    /\.westelm-kids-inspiration__load-sentinel\.is-complete\s*\{/
  )
  assert.match(inspirationCss, /\.westelm-kids-inspiration__end-state\s*\{[^}]*display: grid;/)
  assert.match(inspirationCss, /\.westelm-kids-inspiration__lightbox\s*\{[^}]*position: fixed;/)
  assert.match(inspirationCss, /\.westelm-kids-inspiration__tile\s*\{[^}]*cursor: pointer;/)
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__tile:disabled\s*\{[^}]*cursor: default;/
  )
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__lightbox-gallery\s*\{[^}]*display: grid;/
  )
  assert.doesNotMatch(inspirationArchiveSource, /westelm-kids-inspiration__lightbox-gallery-footer/)
  assert.doesNotMatch(inspirationArchiveSource, /westelm-kids-inspiration__gallery-thumbnails/)
  assert.doesNotMatch(inspirationCss, /\.westelm-kids-inspiration__lightbox-gallery-footer/)
  assert.doesNotMatch(inspirationCss, /\.westelm-kids-inspiration__gallery-thumbnails/)
  assert.doesNotMatch(inspirationArchiveSource, /westelm-kids-inspiration__lightbox-close/)
  assert.doesNotMatch(inspirationArchiveSource, /westelm-kids-inspiration__lightbox-navigation/)
  assert.doesNotMatch(inspirationCss, /\.westelm-kids-inspiration__lightbox-close/)
  assert.doesNotMatch(inspirationCss, /\.westelm-kids-inspiration__lightbox-navigation/)
  assert.match(
    inspirationCss,
    /\.westelm-kids-inspiration__lightbox-hotspot\s*\{[^}]*position: absolute;/
  )
  assert.match(inspirationCss, /\.westelm-kids-gallery-image-enter-active/)
  assert.doesNotMatch(
    inspirationCss,
    /\.westelm-kids-inspiration__lightbox-stage\s*\{[^}]*transition: transform 520ms/
  )
  assert.doesNotMatch(inspirationCss, /\.westelm-kids-inspiration__tile\.is-reflowing/)
  assert.doesNotMatch(
    inspirationArchiveSource,
    /v-if="isLoadingMore" class="westelm-kids-inspiration__load-skeleton"/
  )

  const archive = await text(`${storefrontBaseUrl}/inspirations`)
  assert.match(archive, /westelm-kids-inspiration/)
  assert.match(archive, /<h1[^>]*>Inspiration<\/h1>/)
  assert.match(archive, /INSPIRATION \/ EDIT/)
  assert.match(
    archive,
    /A considered edit of spaces, details, and everyday rituals to inspire your next room\./
  )
  assert.match(archive, /aria-label="Browse inspiration categories"/)
  assert.match(archive, />All<\/span>/)
  assert.match(archive, /Pets/)
  assert.match(archive, /Kids/)
  assert.match(archive, /Tetro/)
  assert.match(archive, /dxv-header/)
  assert.match(archive, /dxv-footer/)
  assert.match(
    archive,
    /https:\/\/www\.westelm\.com\/netstorage\/images\/edam\/001-pl-su26-wek-pink-chicken-kid-room-floral--main-v01-262\.jpg/
  )
  assert.match(
    archive,
    /https:\/\/www\.westelm\.com\/netstorage\/images\/edam\/010-mid-century-mini-desk-36-4-xl\.jpg/
  )
  assert.doesNotMatch(
    archive,
    /https:\/\/www\.westelm\.com\/netstorage\/images\/edam\/99-pl-main-wek-scallop-kid-room-refresh-su24-v01-116\.jpg/
  )
  assert.match(archive, /WebPage/)
  assert.match(archive, /canonical" href="https:\/\/meilong-ceramics\.com\/inspirations"/)

  const referenceImageUrl =
    'https://www.westelm.com/netstorage/images/edam/001-pl-su26-wek-pink-chicken-kid-room-floral--main-v01-262.jpg'
  const proxiedReferenceImage = await fetch(
    `${storefrontBaseUrl}/api/reference-images?src=${encodeURIComponent(referenceImageUrl)}`
  )
  assert.equal(proxiedReferenceImage.status, 200)
  assert.match(proxiedReferenceImage.headers.get('content-type') ?? '', /^image\/jpeg/)
  assert.ok((await proxiedReferenceImage.arrayBuffer()).byteLength > 100_000)

  const sitemap = await text(`${storefrontBaseUrl}/sitemap.xml`)
  assert.match(sitemap, /https:\/\/meilong-ceramics\.com\/inspirations<\/loc>/)
}

// assertNewsArticleDepthPresentation protects the shared News detail template from regressing to a sparse single-column article shell.
function assertNewsArticleDepthPresentation(source, css) {
  assert.match(source, /dxv-news-article__lead/)
  assert.match(source, /dxv-news-article__facts/)
  assert.match(source, /dxv-news-article__reading-time/)
  assert.match(
    source,
    /const renderedBodyHtml = computed\(\(\) => groupConsecutiveFigures\(bodyHtml\.value\)\)/
  )
  assert.match(
    source,
    /function groupConsecutiveFigures\(value: string \| undefined\): string \| undefined/
  )
  assert.match(source, /itemprop="articleBody"/)
  assert.match(
    css,
    /\.dxv-news-article__reading-wrap\s*\{[^}]*grid-template-columns: 184px minmax\(0, 760px\);/
  )
  assert.match(css, /\.dxv-news-article__aside\s*\{[^}]*position: sticky;/)
  assert.match(css, /\.dxv-news-article__facts > div\s*\{[^}]*border-top:/)
  assert.match(css, /\.dxv-news-article__lead\s*\{[^}]*font-size:/)
  assert.match(
    css,
    /\.dxv-news-article__media\s*\{[^}]*width: min\(1280px, calc\(100% - 64px\)\);[^}]*aspect-ratio: 2 \/ 1;/
  )
  assert.match(
    css,
    /\.dxv-news-article__media-grid\s*\{[^}]*display: grid;[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/
  )
  assert.match(
    css,
    /\.dxv-news-article__media-grid > figure:first-child:nth-last-child\(3\)\s*\{[^}]*grid-column: 1 \/ -1;/
  )
  assert.match(
    css,
    /\.dxv-news-article__media-grid > figure:first-child:nth-last-child\(3\) img\s*\{[^}]*aspect-ratio: 16 \/ 9;/
  )
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*\{[\s\S]*?\.dxv-news-article__media\s*\{[^}]*aspect-ratio: 16 \/ 9;/
  )
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*\{[\s\S]*?\.dxv-news-article__media-grid\s*\{[^}]*grid-template-columns: 1fr;/
  )
  assert.match(css, /\.dxv-news-article__body h2\s*\{[^}]*border-top:/)
}

// assertNewsArticleAuthor keeps the published author visible in the News header rather than only in structured metadata.
function assertNewsArticleAuthor(source) {
  assert.match(
    source,
    /const authorName = computed\(\(\) => textField\(payload\.value\.author_display_name\)/
  )
  assert.match(source, /class="dxv-news-article__author"/)
  assert.match(source, /By \{\{ authorName \}\}/)
}

// assertNewsLoadMoreCue protects the Roca-style cue while requiring real version-safe page continuation.
function assertNewsLoadMoreCue(componentSource, css) {
  assert.match(
    componentSource,
    /const newsPageCount = computed\(\(\) => totalPages\.value\)/
  )
  assert.match(
    componentSource,
    /const loadedNewsPageCount = computed\(\(\) => loadedPage\.value\)/
  )
  assert.match(componentSource, /const response = await props\.loadPage/)
  assert.match(componentSource, /response\.committedPublishVersion !== loadedPublishVersion\.value/)
  assert.match(componentSource, /loadedItems\.value\.push\(\.\.\.response\.items\)/)
  assert.match(componentSource, /class="dxv-news-load-state__segments"/)
  assert.match(componentSource, /class="dxv-news-load-state__segment"/)
  assert.match(componentSource, /class="dxv-news-load-state__loader"/)
  assert.match(componentSource, /class="dxv-news-load-state__loader-bar"/)
  assert.match(componentSource, /class="dxv-news-load-state__chevron"/)
  assert.match(componentSource, /@animationend="completeLoadMore"/)
  assert.match(componentSource, /v-if="visibleItems\.length"\s+v-show="hasMoreItems"/)
  assert.doesNotMatch(componentSource, /appendedStartIndex/)
  assert.match(css, /\.dxv-news-load-state\s*\{[^}]*width: 100%;[^}]*text-align: center;/)
  assert.match(
    css,
    /\.dxv-news-load-state__segments\s*\{[^}]*width: min\(203px, 100%\);[^}]*grid-template-columns: repeat\(var\(--dxv-news-page-count\), minmax\(0, 1fr\)\);/
  )
  assert.match(css, /\.dxv-news-load-state__segment\.is-active\s*\{[^}]*background: #1b1d1a;/)
  assert.match(
    css,
    /\.dxv-news-load-state__button\s*\{[^}]*width: 100%;[^}]*min-height: 32px;[^}]*justify-content: center;[^}]*margin-top: 8px;[^}]*font-size: 1rem;[^}]*padding: 0;/
  )
  assert.match(
    css,
    /\.dxv-news-load-state__button-label\s*\{[^}]*font-size: 0\.875rem;[^}]*line-height: 1\.5;/
  )
  assert.match(
    css,
    /\.dxv-news-load-state__chevron\s*\{[^}]*width: 32px;[^}]*height: 32px;[^}]*border: 0;[^}]*transform: none;/
  )
  assert.match(css, /\.dxv-news-load-state__chevron::after\s*\{[^}]*width: 10px;[^}]*height: 10px;/)
  assert.match(css, /\.dxv-news-load-state__loader-bar\s*\{[^}]*animation: dxv-news-load-bar/)
  assert.match(css, /@keyframes dxv-news-load-bar/)
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.dxv-news-load-state__loader-bar\s*\{[^}]*animation: none !important;/
  )
}

// assertNewsArchiveReturnState keeps a reader's loaded News cards and viewport when returning from a detail route.
function assertNewsArchiveReturnState(componentSource, routeSources) {
  assert.match(componentSource, /sessionKey: string/)
  assert.match(componentSource, /const activeSessionKey = ref\(props\.sessionKey\)/)
  assert.match(
    componentSource,
    /const \{ restoreArchiveState, saveArchiveState \} = useNewsArchiveSession\(activeSessionKey\)/
  )
  assert.match(
    componentSource,
    /onMounted\(\(\) => \{\s+void restoreArchiveSession\(\)/
  )
  assert.match(componentSource, /onBeforeUnmount\(\(\) => \{\s+saveCurrentArchiveState\(\)/)
  assert.match(componentSource, /committedPublishVersion: loadedPublishVersion\.value/)
  assert.match(componentSource, /loadedPage: loadedPage\.value/)

  const rootRouteSources = routeSources.slice(0, 2)
  const categoryRouteSources = routeSources.slice(2)
  for (const routeSource of rootRouteSources) {
    assert.match(routeSource, /parseNewsRootArchiveRouteState\(route\.query\)/)
    assert.match(
      routeSource,
      /buildNewsRootArchiveRouteKey\(route\.path, newsArchiveRouteState\.value\)/
    )
    assert.doesNotMatch(routeSource, /(?:parse|build)NewsCategoryArchiveRoute/)
  }
  for (const routeSource of categoryRouteSources) {
    assert.match(routeSource, /parseNewsCategoryArchiveRouteState\(route\.query\)/)
    assert.match(
      routeSource,
      /buildNewsCategoryArchiveRouteKey\(route\.path, newsArchiveRouteState\.value\)/
    )
    assert.doesNotMatch(routeSource, /(?:parse|build)NewsRootArchiveRoute/)
  }
  for (const routeSource of routeSources) {
    assert.match(routeSource, /:session-key="newsArchiveSessionKey"/)
    assert.doesNotMatch(routeSource, /route\.fullPath/)
    assert.match(routeSource, /:load-page="loadNewsPage"/)
    assert.match(routeSource, /:pagination=/)
  }
}

// seedStaleNewsResource creates a legacy local row so seed initialization must converge the database to its declared fixture.
function seedStaleNewsResource() {
  const database = new DatabaseSync(join(dataDir, 'runtime.sqlite'))
  database.exec(`
    CREATE TABLE IF NOT EXISTS published_resources (
      site_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      locale TEXT NOT NULL,
      status TEXT NOT NULL,
      publish_version INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (site_id, resource_type, resource_id, locale)
    );
  `)
  database
    .prepare(
      `INSERT INTO published_resources (
        site_id, resource_type, resource_id, slug, locale, status, publish_version, payload_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      'meilong-ceramics-local',
      'news',
      'news_2026_trade_collection',
      '2026-commercial-surface-collection-preview',
      'en-US',
      'published',
      7,
      JSON.stringify({
        title: 'Meilong Previews 2026 Commercial Surface Collection',
        published_at: '2026-06-16T00:00:00.000Z'
      }),
      '2026-06-16T00:00:00.000Z'
    )
  database.close()
}

// seedArchiveVolumeFixtures atomically adds selected older Blog/News rows without disturbing their visual first pages.
function seedArchiveVolumeFixtures({ blog = true, news = true } = {}) {
  const database = new DatabaseSync(join(dataDir, 'runtime.sqlite'))
  const publication = database
    .prepare(
      `SELECT site_id AS siteId, publish_version AS publishVersion
       FROM published_resources
       WHERE locale = 'en-US'
       ORDER BY publish_version DESC
       LIMIT 1`
    )
    .get()
  const blogCategory = database
    .prepare(
      `SELECT resource_id AS resourceId
       FROM published_resources
       WHERE resource_type = 'article-category' AND slug = 'bathroom-sink' AND locale = 'en-US'`
    )
    .get()
  const newsCategory = database
    .prepare(
      `SELECT resource_id AS resourceId
       FROM published_resources
       WHERE resource_type = 'article-category' AND slug = 'roca-group' AND locale = 'en-US'`
    )
    .get()
  assert(publication?.siteId && Number.isSafeInteger(publication.publishVersion))
  assert(blogCategory?.resourceId)
  assert(newsCategory?.resourceId)

  const insert = database.prepare(
    `INSERT OR REPLACE INTO published_resources (
      site_id, resource_type, resource_id, slug, locale, status, publish_version, payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?)`
  )
  database.exec('BEGIN IMMEDIATE')
  try {
    for (let index = 0; index < 49; index += 1) {
      const suffix = String(index).padStart(3, '0')
      const day = String((index % 28) + 1).padStart(2, '0')
      const blogTimestamp = `2018-01-${day}T00:00:00.000Z`
      const newsTimestamp = `2023-01-${day}T00:00:00.000Z`
      if (blog) {
        insert.run(
          publication.siteId,
          'blog',
          `volume-blog-${suffix}`,
          `volume-blog-${suffix}`,
          'en-US',
          publication.publishVersion,
          JSON.stringify({
            title: `Archive Volume Blog ${suffix}`,
            summary: 'Publication-fenced Blog pagination fixture.',
            published_at: blogTimestamp,
            category_ids: [blogCategory.resourceId]
          }),
          blogTimestamp
        )
      }
      if (news) {
        insert.run(
          publication.siteId,
          'news',
          `volume-news-${suffix}`,
          `volume-news-${suffix}`,
          'en-US',
          publication.publishVersion,
          JSON.stringify({
            title: `Archive Volume News ${suffix}`,
            summary: 'Publication-fenced News pagination fixture.',
            published_at: newsTimestamp,
            category_ids: [newsCategory.resourceId]
          }),
          newsTimestamp
        )
      }
    }
    database.exec('COMMIT')
  } catch (failure) {
    database.exec('ROLLBACK')
    throw failure
  } finally {
    database.close()
  }
}

// seedNewsYearFilterFixtures adds a bounded year-2000 category set for client filter and continuation isolation checks.
function seedNewsYearFilterFixtures() {
  const database = new DatabaseSync(join(dataDir, 'runtime.sqlite'))
  const publication = database
    .prepare(
      `SELECT site_id AS siteId, publish_version AS publishVersion
       FROM published_resources
       WHERE locale = 'en-US'
       ORDER BY publish_version DESC
       LIMIT 1`
    )
    .get()
  const newsCategory = database
    .prepare(
      `SELECT resource_id AS resourceId
       FROM published_resources
       WHERE resource_type = 'article-category' AND slug = 'roca-group' AND locale = 'en-US'`
    )
    .get()
  assert(publication?.siteId && Number.isSafeInteger(publication.publishVersion))
  assert(newsCategory?.resourceId)
  const insert = database.prepare(
    `INSERT OR REPLACE INTO published_resources (
      site_id, resource_type, resource_id, slug, locale, status, publish_version, payload_json, updated_at
    ) VALUES (?, 'news', ?, ?, 'en-US', 'published', ?, ?, ?)`
  )

  database.exec('BEGIN IMMEDIATE')
  try {
    for (let index = 0; index < 17; index += 1) {
      const suffix = String(index).padStart(2, '0')
      const timestamp = `2000-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`
      insert.run(
        publication.siteId,
        `year-2000-news-${suffix}`,
        `year-2000-news-${suffix}`,
        publication.publishVersion,
        JSON.stringify({
          title: `Year 2000 News ${suffix}`,
          summary: 'Lexically isolated News filter fixture.',
          published_at: timestamp,
          category_ids: [newsCategory.resourceId]
        }),
        timestamp
      )
    }
    database.exec('COMMIT')
  } catch (failure) {
    database.exec('ROLLBACK')
    throw failure
  } finally {
    database.close()
  }
}

// removeNewsYearFilterFixtures restores the display database after client lexical-filter verification.
function removeNewsYearFilterFixtures() {
  const database = new DatabaseSync(join(dataDir, 'runtime.sqlite'))
  database
    .prepare(
      `DELETE FROM published_resources
       WHERE resource_type = 'news' AND resource_id LIKE 'year-2000-news-%'`
    )
    .run()
  database.close()
}

// assertNewsLayoutContainmentStyles protects News pages from fixed-header overlap and mobile horizontal overflow.
function assertNewsLayoutContainmentStyles(css) {
  assert.match(css, /\.dxv-news-archive\s*\{[^}]*min-width: 0;[^}]*padding: 143px 0 120px;/)
  assert.match(css, /\.dxv-news-card,\s*\.dxv-news-card__content\s*\{[^}]*min-width: 0;/)
  assert.match(css, /\.dxv-news-card h2\s*\{[^}]*overflow-wrap: anywhere;/)
  assert.match(
    css,
    /@media \(max-width: 1279px\)\s*\{[\s\S]*?\.dxv-news-archive\s*\{[^}]*padding-top: 56px;/
  )
  assert.match(
    css,
    /@media \(max-width: 820px\)\s*\{[\s\S]*?\.dxv-news-filter-rail__panel,\s*\.dxv-news-filter-rail__panel--date\s*\{[^}]*width: calc\(100vw - 32px\);/
  )
  assert.match(
    css,
    /@media \(max-width: 820px\)\s*\{[\s\S]*?\.dxv-news-filter-rail__group:last-child \.dxv-news-filter-rail__panel\s*\{[^}]*right: -1px;[^}]*left: auto;/
  )
  assert.match(
    css,
    /@media \(max-width: 760px\)\s*\{[\s\S]*?\.dxv-news-filter-rail__options\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*max-height: min\(52dvh, 420px\);[^}]*overflow-y: auto;/
  )
  assert.match(
    css,
    /@media \(max-width: 520px\)\s*\{[\s\S]*?\.dxv-news-filter-rail__form\s*\{[^}]*grid-template-columns: 1fr;/
  )
}

// assertNewsDateFilterRouteReactivity requires every News archive to send reactive filters before Runtime pagination.
function assertNewsDateFilterRouteReactivity(sources) {
  for (const source of sources) {
    assert.match(
      source,
      /const newsArchiveRouteState = computed\(\(\) =>\s+parseNews(?:Root|Category)ArchiveRouteState\(route\.query\)\s+\)/
    )
    assert.match(source, /const dateFilter = computed\(\(\) => newsArchiveRouteState\.value\.dateFilter\)/)
    assert.match(source, /month: dateFilter\.value\.month/)
    assert.match(source, /year: dateFilter\.value\.year/)
    assert.doesNotMatch(source, /matchesNewsDateFilter/)
  }
}

// assertNewsFilterRailInteraction keeps the two News filters mutually exclusive with symmetric open and close feedback.
function assertNewsFilterRailInteraction(source, css) {
  assert.match(source, /const activeNewsFilter = ref<NewsFilterName \| null>\(null\)/)
  assert.match(source, /function toggleNewsFilter\(filter: NewsFilterName\): void/)
  assert.match(source, /function closeNewsFilter\(\): void/)
  assert.match(source, /@click="toggleNewsFilter\('categories'\)"/)
  assert.match(source, /@click="toggleNewsFilter\('date'\)"/)
  assert.match(source, /const categoryFilterLabel = computed\(/)
  assert.match(source, /const dateFilterLabel = computed\(/)
  assert.match(source, /class="dxv-news-filter-rail__active-indicator"/)
  assert.match(source, /:to="dateFilterAction\(\)" @click="closeNewsFilter">Clear<\/NuxtLink>/)
  assert.match(source, /@keydown\.esc\.stop="closeNewsFilter"/)
  assert.doesNotMatch(source, /<details\b/)
  assert.match(css, /\.dxv-news-filter-rail__trigger\s*\{[^}]*cursor: pointer;[^}]*transition:/)
  assert.match(css, /\.dxv-news-filter-rail__group\.is-open\s*\{[^}]*z-index: 5;/)
  assert.match(
    css,
    /\.dxv-news-filter-rail__group\.is-open\s+\.dxv-news-filter-rail__chevron\s*\{[^}]*transform:/
  )
  assert.match(
    css,
    /\.dxv-news-filter-rail__group\.is-filtered\s+\.dxv-news-filter-rail__trigger\s*\{[^}]*background:/
  )
  assert.match(
    css,
    /\.dxv-news-filter-panel-enter-active,[\s\S]*?\.dxv-news-filter-panel-leave-active\s*\{[^}]*transition:/
  )
}

// assertUniformBlogHeroStyles protects the shared banner sizing contract across every blog detail route.
function assertUniformBlogHeroStyles(css) {
  assert.match(
    css,
    /\.dv-detail-page\s*\{[^}]*--dv-detail-hero-height: clamp\(600px, 46vw, 800px\);/
  )
  assert.match(css, /\.dv-detail-hero\s*\{[^}]*height: var\(--dv-detail-hero-height\);/)
  assert.match(css, /\.dv-detail-hero > img\s*\{[^}]*height: var\(--dv-detail-hero-height\);/)
  assert.match(
    css,
    /@media \(max-width: 760px\)\s*\{[\s\S]*?\.dv-detail-page\s*\{[^}]*--dv-detail-hero-height: 640px;/
  )
}

// assertRefinedBlogDetailPresentationStyles keeps the requested desktop width and quieter editorial controls stable.
function assertRefinedBlogDetailPresentationStyles(css) {
  assert.match(css, /\.dv-detail-paper\s*\{[^}]*width: min\(1240px, calc\(100% - 48px\)\);/)
  assert.match(css, /\.dv-detail-paper__content\s*\{[^}]*width: min\(100%, 860px\);/)
  assert.match(css, /\.dv-detail-category\s*\{[^}]*margin-top: 22px;/)
  assert.match(
    css,
    /\.dv-detail-hero h1\s*\{[^}]*max-width: 720px;[^}]*font-size: clamp\(2\.85rem, 4\.35vw, 5\.25rem\);[^}]*line-height: 1\.02;/
  )
  assert.match(
    css,
    /@media \(max-width: 760px\)\s*\{[\s\S]*?\.dv-detail-hero h1\s*\{[^}]*max-width: none;[^}]*font-size: clamp\(2\.35rem, 9\.4vw, 3\.65rem\);[^}]*line-height: 1\.03;/
  )
  assert.match(css, /\.dv-detail-share__actions\s*\{[^}]*display: flex;/)
  assert.match(css, /\.dv-detail-tags\s*\{[^}]*display: flex;/)
  assert.match(css, /\.dv-detail-tags ul\s*\{[^}]*display: flex;/)
  assert.match(css, /\.dv-detail-tag\s*\{[^}]*border: 0;/)
}

// escapeRegExp turns externally sourced URL literals into safe assertion patterns.
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// verifyBlogIndex checks the DeerValley-compatible archive hierarchy and its semantic SEO surfaces.
async function verifyBlogIndex() {
  assertBlogPaginationScrollBehavior()
  assertRefinedBlogCategoryArchiveStyles(blogArchiveCss)
  assertCategorySwitcherOverlayLayout(blogArchiveCss, blogCategoryNavSource)
  assertMobileNavigationCloseMotion(blogArchiveCss)
  assertMobileMenuTriggerMotion(blogArchiveCss)

  const blogList = await text(`${storefrontBaseUrl}/blogs`)
  assert.match(blogList, /dxv-blog-index-page/)
  assert.match(blogList, /DeerValley Blog/)
  const blogListArchive = blogArchiveMain(blogList)
  assert.match(
    blogListArchive,
    /<h1 id="blog-index-title" class="dxv-blog-index-title">DeerValley Blog<\/h1>/
  )
  assert.match(blogList, /dxv-blog-index-category-nav/)
  assert.match(blogList, /dxv-blog-category-switcher/)
  assert.match(blogList, /Browse articles by category/)
  assert.match(blogList, /dxv-blog-category-switcher__panel/)
  assert.match(blogList, /\bAll\b/)
  assert.match(blogList, /Bathroom Sink/)
  assert.match(blogList, /Installation Instruction/)
  assert.match(blogList, /href="\/blogs\/categories\/bathroom-sink"/)
  assert.doesNotMatch(blogList, /href="\/blogs\/topic\/bathroom-sink"/)
  assert.match(blogListArchive, /--dxv-blog-card-delay:0ms/)
  assert.match(
    blogList,
    /10 Expert Tips for Transforming Your Bathroom into the Ultimate Spa Experience/
  )
  assert.match(blogList, /Choose the perfect bathroom sink for you/)
  assert.match(blogList, /How to Install a Shower Niche: Easy Steps/)
  assert.match(blogList, /What Are the Benefits and Drawbacks of a Fireclay Kitchen Sink\?/)
  assert.match(blogList, /How To Install a Drop-in Sink/)
  assert.match(blogList, /How to Accurately Measure Your Kitchen Sink/)
  assert.match(blogList, /How to Install an Undermount Sink/)
  assert.match(blogList, /How to Measure Bathroom Faucets Correctly/)
  assert.match(blogList, /A Guide on How to Measure a Toilet/)
  assert.match(blogList, /dxv-blog-index-grid/)
  assert.match(blogList, /dxv-blog-index-card__media-frame/)
  assert.match(blogList, /dxv-blog-index-card__category/)
  assert.doesNotMatch(blogList, /dxv-blog-index-card__topics/)
  assert.match(
    blogArchiveCard(
      blogListArchive,
      '10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience'
    ),
    />Bathroom Design</,
    'the bathroom spa article exposes its assigned category on the archive card'
  )
  const showerNicheCard = blogArchiveCard(
    blogListArchive,
    'how-to-install-a-shower-niche-easy-steps'
  )
  assert.match(showerNicheCard, />Installation Instruction</)
  assert.doesNotMatch(showerNicheCard, />Shower Niche</)
  assert.match(blogList, /0 comments/)
  assert.match(blogList, /Read more/)
  assert.match(blogList, /dxv-blog-index-pagination/)
  assert.match(blogList, /href="\/blogs\?page=2"/)
  assert.match(blogList, /<time datetime=/)
  assert.match(blogList, /CollectionPage/)
  assert.match(blogList, /canonical" href="https:\/\/meilong-ceramics\.com\/blogs"/)

  const routeIndex = await json(`${runtimeBaseUrl}/api/public/seo/route-index`)
  assert(
    routeIndex.routes.some(
      (route) =>
        route.path ===
        '/blogs/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience'
    )
  )
  assert(routeIndex.routes.some((route) => route.path === '/blogs/categories/bathroom-sink'))
  assert(!routeIndex.routes.some((route) => route.path.startsWith('/blog/')))
  assert.doesNotMatch(blogList, /The Material Edit/)

  const blogPageTwo = await text(`${storefrontBaseUrl}/blogs?page=2`)
  const blogPageTwoArchive = blogArchiveMain(blogPageTwo)
  const blogPageTwoPagination = blogArchivePagination(blogPageTwoArchive)
  assert.match(
    blogPageTwoArchive,
    /Elevate Your Space: A DIY Guide to Wall Mount Bathroom Sink Installation/
  )
  assert.match(
    blogPageTwoArchive,
    /Choosing the Perfect Kitchen Sink: A Comprehensive Buyer(?:&#39;|&apos;|')s Guide/
  )
  assert.doesNotMatch(
    blogPageTwoArchive,
    /10 Expert Tips for Transforming Your Bathroom into the Ultimate Spa Experience/
  )
  assert.match(blogPageTwoArchive, /href="\/blogs"[^>]*>\s*Previous/)
  assert.doesNotMatch(blogPageTwoPagination, /<a[^>]*aria-current="page"[^>]*href="\/blogs"/)
  assert.match(blogPageTwoArchive, /<span class="is-current" aria-current="page">2<\/span>/)
  assert.match(blogPageTwo, /Previous/)
  assert.match(blogPageTwo, /canonical" href="https:\/\/meilong-ceramics\.com\/blogs\?page=2"/)
  assert.match(blogPageTwo, /name="robots" content="index,follow"/)
  assert.match(
    blogPageTwo,
    /rel="alternate" hreflang="en-US" href="https:\/\/meilong-ceramics\.com\/blogs\?page=2"/
  )
  assert.match(
    blogPageTwo,
    /rel="alternate" hreflang="x-default" href="https:\/\/meilong-ceramics\.com\/blogs\?page=2"/
  )

  const defaultLocalePageTwo = await fetch(`${storefrontBaseUrl}/en-US/blogs?page=2`, {
    redirect: 'manual'
  })
  assert.equal(defaultLocalePageTwo.status, 301)
  assert.equal(defaultLocalePageTwo.headers.get('location'), '/blogs?page=2')

  const blogPageThree = await text(`${storefrontBaseUrl}/blogs?page=3`)
  assert.match(blogPageThree, /Enhance Your Bathroom Experience with Certified Toilets/)
  assert.match(blogPageThree, /8 Effective Methods to Unclog Your Toilet/)
  assert.match(blogPageThree, /canonical" href="https:\/\/meilong-ceramics\.com\/blogs\?page=3"/)

  const blogPageFour = await text(`${storefrontBaseUrl}/blogs?page=4`)
  assert.match(blogPageFour, /A Complete Guide to Installing a One-Piece Toilet \(Type A\)/)
  assert.match(blogPageFour, /canonical" href="https:\/\/meilong-ceramics\.com\/blogs\?page=4"/)

  const blogPageFive = await fetch(`${storefrontBaseUrl}/blogs?page=5`)
  assert.equal(blogPageFive.status, 404)

  const categoryArchive = await text(`${storefrontBaseUrl}/blogs/categories/bathroom-sink`)
  assert.match(categoryArchive, /dxv-blog-index-category-page/)
  assert.match(categoryArchive, /dxv-blog-category-archive/)
  assert.match(categoryArchive, /dxv-blog-category-archive__heading/)
  assert.match(categoryArchive, /dxv-blog-category-archive__count/)
  assert.match(categoryArchive, /dxv-blog-category-archive__archive-label/)
  assert.match(categoryArchive, /dxv-blog-category-grid/)
  assert.match(categoryArchive, /dxv-blog-category-grid__featured/)
  assert.match(categoryArchive, /Bathroom Sink/)
  assert.match(categoryArchive, /dxv-blog-index-category-nav/)
  assert.match(categoryArchive, /CollectionPage/)
  assert.match(categoryArchive, /ItemList/)
  assert.match(
    categoryArchive,
    /"url":"https:\/\/meilong-ceramics\.com\/blogs\/sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types"/
  )
  assert.match(
    categoryArchive,
    /canonical" href="https:\/\/meilong-ceramics\.com\/blogs\/categories\/bathroom-sink"/
  )

  const toiletCategoryArchive = await text(`${storefrontBaseUrl}/blogs/categories/toilet`)
  const bathroomHardwareCard = blogArchiveCard(
    toiletCategoryArchive,
    'choosing-and-utilizing-bathroom-hardware-accessories-crafting-the-perfect-bath-space'
  )
  assert.match(bathroomHardwareCard, />Toilet</)
  assert.doesNotMatch(bathroomHardwareCard, />Bathroom Sink</)
  assert.doesNotMatch(bathroomHardwareCard, />Kitchen Sink</)

  const kitchenSinkCategoryArchive = await text(`${storefrontBaseUrl}/blogs/categories/kitchen-sink`)
  assert.match(kitchenSinkCategoryArchive, /9\s+stories/)
  assert.equal(
    (kitchenSinkCategoryArchive.match(/dxv-blog-category-grid__featured(?:["\s])/g) ?? []).length,
    1,
    'a category archive promotes only its top story as the horizontal editorial feature'
  )
  assert.doesNotMatch(kitchenSinkCategoryArchive, /dxv-blog-category-grid__featured--reverse/)
  assert.match(kitchenSinkCategoryArchive, /Browse categories/)
  assert.doesNotMatch(kitchenSinkCategoryArchive, /aria-label="Category archive pages"/)
  const kitchenSinkCategoryPageTwo = await fetch(
    `${storefrontBaseUrl}/blogs/categories/kitchen-sink?page=2`
  )
  assert.equal(kitchenSinkCategoryPageTwo.status, 404)

  const localizedCategoryArchive = await text(
    `${storefrontBaseUrl}/en-US/blogs/categories/bathroom-sink`
  )
  const localizedCategorySwitcher = categoryArchiveSwitcher(localizedCategoryArchive)
  assert.match(localizedCategoryArchive, /dxv-blog-category-archive/)
  assert.match(localizedCategorySwitcher, /href="\/blogs"/)
  assert.match(localizedCategorySwitcher, /href="\/blogs\/categories\/bathroom-sink"/)
  assert.doesNotMatch(localizedCategorySwitcher, /href="\/en-US\/blogs(?:\/|\")/)
  assert.match(
    localizedCategoryArchive,
    /"url":"https:\/\/meilong-ceramics\.com\/blogs\/sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types"/
  )
  assert.doesNotMatch(
    localizedCategoryArchive,
    /"url":"https:\/\/meilong-ceramics\.com\/en-US\/blogs\/sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types"/
  )

  await verifyAdditionalDeerValleyArticleSeed()
  seedArchiveVolumeFixtures({ news: false })
  await verifyBlogPaginationClientNavigation()
}

// verifyBlogPaginationClientNavigation proves query-only Next and Back navigation refresh cards, page state, canonical, and JSON-LD together.
async function verifyBlogPaginationClientNavigation() {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  try {
    await page.goto(`${storefrontBaseUrl}/blogs`, { waitUntil: 'domcontentloaded' })
    await waitForNuxtHydration(page)
    await assertBlogArchiveClientNavigation(page, {
      pageOnePath: '/blogs',
      pageTwoPath: '/blogs?page=2',
      pageTwoPosition: 10
    })

    await page.goto(`${storefrontBaseUrl}/blogs/categories/bathroom-sink`, {
      waitUntil: 'domcontentloaded'
    })
    await waitForNuxtHydration(page)
    await assertBlogArchiveClientNavigation(page, {
      pageOnePath: '/blogs/categories/bathroom-sink',
      pageTwoPath: '/blogs/categories/bathroom-sink?page=2',
      pageTwoPosition: 10
    })

    setDisplayPublicationLocales('fr-FR', ['fr-FR', 'en-US'])
    await page.goto(`${storefrontBaseUrl}/en-US/blogs/categories/bathroom-sink`, {
      waitUntil: 'domcontentloaded'
    })
    await waitForNuxtHydration(page)
    await assertBlogArchiveClientNavigation(page, {
      pageOnePath: '/en-US/blogs/categories/bathroom-sink',
      pageTwoPath: '/en-US/blogs/categories/bathroom-sink?page=2',
      pageTwoPosition: 10
    })
  } finally {
    setDisplayPublicationLocales('en-US', ['en-US'])
    await context.close()
    await browser.close()
  }
}

// assertBlogArchiveClientNavigation checks one hydrated archive route in both navigation directions without reloading it.
async function assertBlogArchiveClientNavigation(page, { pageOnePath, pageTwoPath, pageTwoPosition }) {
  const firstPageCard = await page.locator('article.dxv-blog-index-card').first().textContent()
  assert(firstPageCard, `${pageOnePath} renders a first-page Blog card`)

  await clickNuxtLinkAndWait(page, '.dxv-blog-index-pagination__next')
  await page
    .locator('.dxv-blog-index-pagination [aria-current="page"]', { hasText: '2' })
    .waitFor()
  assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, pageTwoPath)
  assert.equal(
    (await page.locator('.dxv-blog-index-pagination [aria-current="page"]').textContent())?.trim(),
    '2'
  )
  assert.notEqual(await page.locator('article.dxv-blog-index-card').first().textContent(), firstPageCard)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    `${publicBaseUrl}${pageTwoPath}`
  )
  assert.equal(await firstCollectionPagePosition(page), pageTwoPosition)

  await clickNuxtLinkAndWait(page, '.dxv-blog-index-pagination__previous')
  await page
    .locator('.dxv-blog-index-pagination [aria-current="page"]', { hasText: '1' })
    .waitFor()
  assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, pageOnePath)
  assert.equal(
    (await page.locator('.dxv-blog-index-pagination [aria-current="page"]').textContent())?.trim(),
    '1'
  )
  assert.equal(await page.locator('article.dxv-blog-index-card').first().textContent(), firstPageCard)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    `${publicBaseUrl}${pageOnePath}`
  )
  assert.equal(await firstCollectionPagePosition(page), 1)

  const leadingZeroPath = `${pageOnePath}?page=02`
  await pushClientRoute(page, leadingZeroPath)
  await page.evaluate(() => new Promise(requestAnimationFrame))
  assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, leadingZeroPath)
  assert.equal(await page.locator('article.dxv-blog-index-card').first().textContent(), firstPageCard)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    `${publicBaseUrl}${pageOnePath}`
  )
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,follow')
  assert.equal(await firstCollectionPagePosition(page), 1)
}

// clickNuxtLinkAndWait follows a real Nuxt link and waits for the destination URL plus its next browser render frame.
async function clickNuxtLinkAndWait(page, selector) {
  const link = page.locator(selector)
  const href = await link.getAttribute('href')
  assert(href, `${selector} exposes a navigable href`)
  await Promise.all([
    page.waitForURL(new URL(href, page.url()).toString()),
    link.click()
  ])
  await page.evaluate(() => new Promise(requestAnimationFrame))
}

// firstCollectionPagePosition reads the first visible ItemList position from the active CollectionPage schema.
async function firstCollectionPagePosition(page) {
  return page.evaluate(() => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const value = JSON.parse(script.textContent ?? 'null')
        if (value?.['@type'] === 'CollectionPage') {
          return value.mainEntity?.itemListElement?.[0]?.position ?? null
        }
      } catch {
        // Non-JSON schema nodes are ignored so the archive-owned CollectionPage remains authoritative.
      }
    }
    return null
  })
}

// waitForNuxtHydration waits for the real Nuxt client boundary before exercising query-only routing.
async function waitForNuxtHydration(page) {
  await page.waitForFunction(() => {
    const nuxtApp = document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt
    return nuxtApp?.isHydrating === false
  })
}

// setDisplayPublicationLocales switches only the temporary display fixture between default and non-default locale route modes.
function setDisplayPublicationLocales(defaultLocale, activeLocales) {
  const database = new DatabaseSync(join(dataDir, 'runtime.sqlite'))
  database
    .prepare(
      `UPDATE site_exposure_publications
       SET default_locale = ?, active_locales_json = ?`
    )
    .run(defaultLocale, JSON.stringify(activeLocales))
  database.close()
}

// blogArchiveCard isolates one rendered blog card so archive assertions target card metadata rather than navigation text.
function blogArchiveCard(html, slug) {
  const articlePath = `href="/blogs/${slug}"`
  const linkIndex = html.indexOf(articlePath)
  const startIndex = html.lastIndexOf('<article', linkIndex)
  const endIndex = html.indexOf('</article>', linkIndex)
  assert(linkIndex >= 0 && startIndex >= 0 && endIndex >= 0, `blog archive card renders ${slug}`)
  return html.slice(startIndex, endIndex + '</article>'.length)
}

// assertMobileNavigationCloseMotion keeps the mobile drawer close control tactile without bypassing reduced-motion preferences.
function assertMobileNavigationCloseMotion(css) {
  assert.match(css, /\.dxv-mobile-close-button\s*\{[^}]*cursor: pointer;[^}]*transition:/)
  assert.match(css, /\.dxv-mobile-close-button svg\s*\{[^}]*transition: transform/)
  assert.match(
    css,
    /@media \(hover: hover\)\s*\{[\s\S]*?\.dxv-mobile-close-button:hover\s*\{[^}]*background:/
  )
  assert.match(css, /\.dxv-mobile-close-button:focus-visible\s*\{[^}]*outline:/)
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.dxv-mobile-close-button,[\s\S]*?\.dxv-mobile-close-button svg(?:,[\s\S]*?)?\s*\{[^}]*transition: none;/
  )
}

// assertMobileMenuTriggerMotion preserves the accessible tactile states without restoring a hover-circle treatment.
function assertMobileMenuTriggerMotion(css) {
  assert.match(
    css,
    /\.dxv-mobile-menu-button,\s*\.dxv-mobile-search-button,\s*\.dxv-mobile-favorites-button,\s*\.dxv-mobile-cart-button\s*\{[^}]*width: 40px;[^}]*height: 40px;[^}]*transition: transform/
  )
  assert.match(css, /\.dxv-mobile-menu-button svg\s*\{[^}]*transition:[^;}]*transform/)
  assert.match(
    css,
    /@media \(hover: hover\)\s*\{[\s\S]*?\.dxv-mobile-menu-button:hover,\s*\.dxv-mobile-search-button:hover,\s*\.dxv-mobile-favorites-button:hover,\s*\.dxv-mobile-cart-button:hover\s*\{[^}]*transform: translate3d\(0, -1px, 0\);/
  )
  assert.match(
    css,
    /\.dxv-mobile-menu-button:active,\s*\.dxv-mobile-search-button:active,\s*\.dxv-mobile-favorites-button:active,\s*\.dxv-mobile-cart-button:active\s*\{[^}]*transform: scale\(0\.92\);/
  )
  assert.match(
    css,
    /\.dxv-header\.open \.dxv-mobile-menu-button svg\s*\{[^}]*transform: rotate\(90deg\);/
  )
  assert.match(
    css,
    /\.dxv-mobile-menu-button:focus-visible,\s*\.dxv-mobile-search-button:focus-visible,\s*\.dxv-mobile-favorites-button:focus-visible,\s*\.dxv-mobile-cart-button:focus-visible\s*\{[^}]*outline:/
  )
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.dxv-mobile-menu-button,[\s\S]*?\.dxv-mobile-menu-button svg(?:,[\s\S]*?)?\s*\{[^}]*transition: none;/
  )
  assert.doesNotMatch(css, /\.dxv-mobile-menu-button::before/)
}

// assertBlogPaginationScrollBehavior prevents blog page changes from retaining the previous page's scroll position.
function assertBlogPaginationScrollBehavior() {
  assert(
    existsSync(archivePaginationScrollPath),
    'blog archive pagination defines a click scroll handler'
  )

  const scrollComposable = readFileSync(archivePaginationScrollPath, 'utf8')
  assert.match(scrollComposable, /function scrollArchivePaginationToTop/)
  assert.match(scrollComposable, /window\.scrollTo\(\{\s*top:\s*0,\s*behavior:\s*'smooth'/)

  for (const pagePath of blogArchivePagePaths) {
    const page = readFileSync(pagePath, 'utf8')
    assert.match(page, /@click="scrollArchivePaginationToTop"/)
  }
}

// verifyAdditionalDeerValleyArticleSeed ensures each authorized reference article has a public detail route and article schema.
async function verifyAdditionalDeerValleyArticleSeed() {
  for (const [slug, title] of additionalDeerValleyArticles) {
    const article = await text(`${storefrontBaseUrl}/blogs/${slug}`)
    assert.match(article, new RegExp(escapeRegExp(title)))
    assert.match(article, /BlogPosting/)
    assert.match(article, /dv-detail-page/)
  }
}

// assertRefinedBlogCategoryArchiveStyles protects the responsive category hierarchy and accessible motion fallback.
function assertRefinedBlogCategoryArchiveStyles(css) {
  assert.match(css, /\.dxv-site-layout \.dxv-blog-index-page\s*\{[^}]*margin-inline: auto;/)
  assert.match(
    css,
    /\.dxv-blog-category-archive\s*\.dxv-blog-index-heading\s*\{[^}]*grid-template-columns: minmax\(0, 1\.05fr\) minmax\(360px, 0\.95fr\);/
  )
  assert.match(
    css,
    /\.dxv-blog-category-archive\s*\.dxv-blog-index-heading\s*\{[^}]*width: min\(100%, 1600px\);[^}]*margin-inline: auto;/
  )
  assert.match(
    css,
    /\.dxv-blog-category-archive\s*\.dxv-blog-index-heading\s*\{[^}]*position: relative;[^}]*z-index: 3;[^}]*align-items: start;/
  )
  assert.match(
    css,
    /\.dxv-blog-category-archive__meta\s*\{[^}]*grid-template-areas:\s*'label switcher'\s*'count switcher';/
  )
  assert.match(css, /\.dxv-blog-category-archive__archive-label\s*\{[^}]*grid-area: label;/)
  assert.match(css, /\.dxv-blog-category-archive__count\s*\{[^}]*grid-area: count;/)
  assert.match(
    css,
    /\.dxv-blog-category-archive\s*\.dxv-blog-index-category-nav\s*\{[^}]*grid-area: switcher;/
  )
  assert.match(css, /\.dxv-blog-category-switcher__panel\s*\{[^}]*z-index: 1;/)
  assert.match(
    css,
    /\.dxv-blog-category-grid\s*\{[^}]*margin-inline: auto;[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/
  )
  assert.match(css, /\.dxv-blog-category-grid__featured\s*\{[^}]*grid-column: 1 \/ -1;/)
  assert.match(
    css,
    /\.dxv-blog-category-grid__featured\s*\{[^}]*height: 440px;[^}]*grid-template-columns: minmax\(0, 1\.2fr\) minmax\(340px, 0\.8fr\);[^}]*grid-template-areas: 'media content';/
  )
  assert.match(
    css,
    /\.dxv-blog-category-grid__featured\s*\{[^}]*align-content: stretch;[^}]*grid-template-rows: minmax\(0, 1fr\);/
  )
  assert.doesNotMatch(css, /\.dxv-blog-category-grid__featured--reverse/)
  assert.match(
    css,
    /\.dxv-blog-index-card:not\(\.dxv-blog-category-grid__featured\) \.dxv-blog-index-card__content\s*\{[^}]*min-height: 192px;[^}]*grid-template-rows: 20px minmax\(0, 3\.75rem\) minmax\(0, 3\.2rem\) 1\.125rem;/
  )
  assert.match(
    css,
    /\.dxv-blog-index-card:not\(\.dxv-blog-category-grid__featured\) h2\s*\{[^}]*-webkit-line-clamp: 2;/
  )
  assert.match(
    css,
    /\.dxv-blog-index-card:not\(\.dxv-blog-category-grid__featured\) \.dxv-blog-index-card__content > p\s*\{[^}]*-webkit-line-clamp: 2;/
  )
  assert.match(
    css,
    /@media \(hover: hover\)\s*\{[\s\S]*?\.dxv-blog-index-card:not\(\.dxv-blog-category-grid__featured\):hover,[\s\S]*?\{[^}]*transform: translate3d\(0, -4px, 0\);/
  )
  assert.match(
    css,
    /@media \(hover: hover\)\s*\{[\s\S]*?\.dxv-blog-index-card:not\(\.dxv-blog-category-grid__featured\):hover \.dxv-blog-index-card__media img,[\s\S]*?\{[^}]*transform: scale\(1\.04\);/
  )
  assert.match(
    css,
    /\.dxv-blog-category-archive__meta\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/
  )
  assert.match(
    css,
    /@media \(max-width: 767px\)\s*\{[\s\S]*?\.dxv-blog-category-grid__featured\s*\{[^}]*grid-column: auto;/
  )
  assert.match(
    css,
    /@media \(max-width: 767px\)\s*\{[\s\S]*?\.dxv-blog-category-grid__featured\s*\{[^}]*height: auto;[^}]*gap: 20px;[^}]*background: transparent;/
  )
  assert.match(
    css,
    /@media \(max-width: 767px\)\s*\{[\s\S]*?\.dxv-blog-category-grid__featured \.dxv-blog-index-card__media-frame\s*\{[^}]*aspect-ratio: 16 \/ 10;[^}]*border-radius: 12px;/
  )
  assert.match(
    css,
    /@media \(max-width: 767px\)\s*\{[\s\S]*?\.dxv-blog-category-grid__featured \.dxv-blog-index-card__content\s*\{[^}]*height: auto;[^}]*gap: 14px;[^}]*padding: 0;/
  )
  assert.match(
    css,
    /@media \(max-width: 767px\)\s*\{[\s\S]*?\.dxv-blog-category-grid__featured \.dxv-blog-index-card__content h2\s*\{[^}]*font-family: var\(--dxv-body\);[^}]*font-size: 1\.375rem;[^}]*line-height: 1\.25;/
  )
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.dxv-blog-category-archive__heading,[\s\S]*?\{[^}]*animation: none;/
  )
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.dxv-blog-index-card__media img,[\s\S]*?\{[^}]*transition: none;/
  )
}

// assertCategorySwitcherOverlayLayout keeps category navigation out of document flow and distinct from article tags.
function assertCategorySwitcherOverlayLayout(css, source) {
  assert.match(source, /aria-label="Browse articles by category"/)
  assert.match(source, /<span>Categories<\/span>/)
  assert.match(source, /return `\/blogs\/categories\/\$\{category\.slug\}`/)
  assert.match(
    css,
    /\.dxv-blog-category-switcher__trigger\s*\{[^}]*width: fit-content;[^}]*max-width: 100%;/
  )
  assert.match(
    css,
    /@media \(max-width: 767px\)\s*\{[\s\S]*?\.dxv-blog-category-switcher__panel\s*\{[^}]*position: absolute;[^}]*top: calc\(100% \+ 8px\);[^}]*left: 0;[^}]*width: min\(420px, calc\(100vw - 48px\)\);/
  )
}

// verifySeoSurfaces checks sitemap and robots use canonical, indexable public routes only.
async function verifySeoSurfaces() {
  const sitemap = await text(`${storefrontBaseUrl}/sitemap.xml`)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/about/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/contact/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/warranty/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/privacy-policy/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/terms-conditions/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/blogs/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/news/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/inspirations\/category\/pets<\/loc>/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/inspirations\/category\/kids<\/loc>/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/inspirations\/category\/tetro<\/loc>/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/blogs\/categories\/bathroom-sink/)
  assert.match(sitemap, /https:\/\/meilong-ceramics.com\/news\/categories\/roca-group/)
  assert.doesNotMatch(sitemap, /https:\/\/meilong-ceramics.com\/news\/categories\/kitchen-sink/)
  assert.doesNotMatch(sitemap, /https:\/\/meilong-ceramics.com\/blogs\/topic\/bathroom-sink/)
  assert.doesNotMatch(sitemap, /https:\/\/meilong-ceramics.com\/news\/topic\/kitchen-sink/)
  assert.doesNotMatch(sitemap, /page=2/)
  assert.doesNotMatch(sitemap, /<loc>https:\/\/meilong-ceramics.com\/collections\/[^<]+<\/loc>/)
  assert.doesNotMatch(sitemap, /porcelain-tile-specification-checklist/)
  assert.doesNotMatch(sitemap, /unused-topic/)

  const robots = await text(`${storefrontBaseUrl}/robots.txt`)
  assert.match(robots, /Disallow: \/preview\//)
  assert.match(robots, /Disallow: \/api\//)
  assert.match(robots, /Disallow: \/admin\//)
  assert.match(robots, /Sitemap: https:\/\/meilong-ceramics.com\/sitemap.xml/)
}

// verifyRedirects keeps only real historical identities and locale normalization redirectable while retired routes stay terminal 404s.
async function verifyRedirects() {
  for (const retiredPath of [
    '/blog',
    '/en-US/blog',
    '/blog/porcelain-tile-specification-checklist',
    '/blogs/category',
    '/blogs/category/spec-notes',
    '/en-US/blogs/category/spec-notes',
    '/news/category',
    '/news/category/project-news',
    '/en-US/news/category/project-news',
    '/blogs/topic',
    '/blogs/topic/bathroom-sink',
    '/en-US/blogs/topic/bathroom-sink',
    '/news/topic',
    '/news/topic/roca-group',
    '/en-US/news/topic/roca-group',
    '/blogs/categories',
    '/en-US/blogs/categories',
    '/news/categories',
    '/en-US/news/categories',
    '/categories',
    '/en-US/categories',
    '/categories/porcelain-tiles',
    '/products',
    '/en-US/products',
    '/collections',
    '/en-US/collections'
  ]) {
    const retired = await fetch(`${storefrontBaseUrl}${retiredPath}`, { redirect: 'manual' })
    assert.equal(retired.status, 404, `${retiredPath} is terminal 404`)
    assert.equal(retired.headers.get('location'), null, `${retiredPath} has no redirect Location`)
  }

  await verifyTerminalNamespaceConflicts('current')
  await verifyTerminalNamespaceConflicts('historical')

  const oldBlog = await fetch(`${storefrontBaseUrl}/blogs/porcelain-tile-specification-checklist`, {
    redirect: 'manual'
  })
  assert.equal(oldBlog.status, 301)
  assert.equal(
    oldBlog.headers.get('location'),
    '/blogs/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience'
  )

  const oldCategory = await fetch(`${storefrontBaseUrl}/blogs/categories/spec-notes`, {
    redirect: 'manual'
  })
  assert.equal(oldCategory.status, 301)
  assert.equal(oldCategory.headers.get('location'), '/blogs/categories/bathroom-faucet')

  const emptyCategory = await fetch(`${storefrontBaseUrl}/blogs/categories/unused-topic`, {
    redirect: 'manual'
  })
  assert.equal(emptyCategory.status, 404)
  assert.equal(emptyCategory.headers.get('location'), null)

  for (const retainedPath of [
    '/product/collections',
    '/products/calacatta-royal-sintered-slab',
    '/collections/bathroom-sinks-pedestal'
  ]) {
    const retained = await fetch(`${storefrontBaseUrl}${retainedPath}`, { redirect: 'manual' })
    assert.equal(retained.status, 200, `${retainedPath} remains public`)
  }
}

// verifyTerminalNamespaceConflicts proves reserved Blog and News roots beat both current and historical Runtime slug matches.
async function verifyTerminalNamespaceConflicts(mode) {
  seedTerminalNamespaceConflicts(mode)
  const retiredPaths = ['blogs', 'news'].flatMap((collection) =>
    terminalContentDetailSlugs.flatMap((slug) => [
      `/${collection}/${slug}`,
      `/en-US/${collection}/${slug}`
    ])
  )
  for (const retiredPath of retiredPaths) {
    const response = await fetch(`${storefrontBaseUrl}${retiredPath}`, { redirect: 'manual' })
    assert.equal(response.status, 404, `${mode} collision ${retiredPath} is terminal 404`)
    assert.equal(
      response.headers.get('location'),
      null,
      `${mode} collision ${retiredPath} has no redirect Location`
    )
  }

  const routeIndex = await json(`${runtimeBaseUrl}/api/public/seo/route-index`)
  const sitemap = await text(`${storefrontBaseUrl}/sitemap.xml`)
  for (const collection of ['blogs', 'news']) {
    for (const slug of terminalContentDetailSlugs) {
      const retiredPath = `/${collection}/${slug}`
      assert(
        !routeIndex.routes.some((route) => route.path === retiredPath),
        `${mode} collision ${retiredPath} stays out of route-index`
      )
      assert(
        !sitemap.includes(`https://meilong-ceramics.com${retiredPath}</loc>`),
        `${mode} collision ${retiredPath} stays out of sitemap`
      )
    }
  }
  assert(
    routeIndex.routes.some(
      (route) =>
        route.path ===
        '/blogs/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience'
    ),
    'terminal filtering preserves a legitimate Blog detail route'
  )
  assert(
    routeIndex.routes.some(
      (route) =>
        route.path === '/news/roca-strengthens-presence-central-asia-new-showroom-almaty'
    ),
    'terminal filtering preserves a legitimate News detail route'
  )
}

// seedTerminalNamespaceConflicts installs deterministic current or historical slug collisions in the live Runtime fixture.
function seedTerminalNamespaceConflicts(mode) {
  const database = new DatabaseSync(join(dataDir, 'runtime.sqlite'))
  const deleteConflict = database.prepare(
    `DELETE FROM published_resources WHERE site_id = ? AND resource_id LIKE 'terminal_namespace_%'`
  )
  const insertConflict = database.prepare(
    `INSERT INTO published_resources (
      site_id, resource_type, resource_id, slug, locale, status, publish_version, payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  database.exec('BEGIN IMMEDIATE')
  try {
    deleteConflict.run('meilong-ceramics-local')
    for (const resourceType of ['blog', 'news']) {
      for (const retiredSlug of terminalContentDetailSlugs) {
        const canonicalSlug =
          mode === 'current'
            ? retiredSlug
            : `terminal-${resourceType}-${retiredSlug}-history-target`
        const routeCollection = resourceType === 'blog' ? 'blogs' : 'news'
        insertConflict.run(
          'meilong-ceramics-local',
          resourceType,
          `terminal_namespace_${resourceType}_${retiredSlug}`,
          canonicalSlug,
          'en-US',
          'published',
          7,
          JSON.stringify({
            display_title: `Terminal ${resourceType} ${retiredSlug}`,
            title: `Terminal ${resourceType} ${retiredSlug}`,
            summary: 'Terminal namespace collision fixture.',
            published_at: '2026-06-16T00:00:00.000Z',
            historical_slugs: mode === 'historical' ? [retiredSlug] : [],
            seo: {
              title: `Terminal ${resourceType} ${retiredSlug}`,
              description: 'Terminal namespace collision fixture.',
              image: `${publicBaseUrl}/images/meilong-showroom-hero.png`,
              canonical_url: `${publicBaseUrl}/${routeCollection}/${canonicalSlug}`
            }
          }),
          '2026-06-16T00:00:00.000Z'
        )
      }
    }
    database.exec('COMMIT')
  } catch (failure) {
    database.exec('ROLLBACK')
    throw failure
  } finally {
    database.close()
  }
}

// verifyPreview checks the preview route keeps noindex and no-store even without a real OES draft preview.
async function verifyPreview() {
  const response = await fetch(
    `${storefrontBaseUrl}/preview/blog/blog_porcelain_specification_notes?locale=en-US&token=local-missing`
  )
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex, nofollow/)
  assert.match(await response.text(), /noindex, nofollow/)
}

// json requires a successful display endpoint before decoding its public response.
async function json(url) {
  const response = await fetch(url)
  assert.equal(response.status, 200, `${url} returned ${response.status}`)
  return response.json()
}

// text requires a successful display endpoint before returning its rendered body.
async function text(url) {
  const response = await fetch(url)
  assert.equal(response.status, 200, `${url} returned ${response.status}`)
  return response.text()
}

// blogArchiveMain isolates the archive body so shared header and footer content cannot mask pagination regressions.
function blogArchiveMain(html) {
  const match = html.match(
    /<main\b[^>]*class="[^"]*\bdxv-blog-index-page\b[^"]*"[^>]*>[\s\S]*?<\/main>/
  )
  assert(match, 'blog archive main content was not rendered')
  return match[0]
}

// blogArchivePagination isolates pagination semantics from the independent topic-navigation current state.
function blogArchivePagination(html) {
  const match = html.match(/<nav class="dxv-blog-index-pagination"[^>]*>[\s\S]*?<\/nav>/)
  assert(match, 'blog archive pagination was not rendered')
  return match[0]
}

// categoryArchiveSwitcher isolates the category-navigation links from localized archive pagination links.
function categoryArchiveSwitcher(html) {
  const match = html.match(/<nav class="dxv-blog-index-category-nav"[^>]*>[\s\S]*?<\/nav>/)
  assert(match, 'category archive switcher was not rendered')
  return match[0]
}

// waitForUrl polls only process readiness so display assertions never race server startup.
async function waitForUrl(url, label) {
  const deadline = Date.now() + 45_000
  let lastError
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
      lastError = new Error(`${label} returned ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await delay(750)
  }
  throw lastError ?? new Error(`${label} did not become ready`)
}

// spawnProcess starts a labeled local verification dependency with inherited diagnostics.
function spawnProcess(command, args, env) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  child.stdout.on('data', (chunk) => process.stdout.write(`[${args.at(-1)}] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[${args.at(-1)}] ${chunk}`))
  return child
}

// stopProcess releases a verification child and escalates only when graceful shutdown stalls.
async function stopProcess(child) {
  if (child.exitCode !== null) {
    return
  }
  child.kill('SIGTERM')
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    delay(5_000).then(() => child.kill('SIGKILL'))
  ])
}
