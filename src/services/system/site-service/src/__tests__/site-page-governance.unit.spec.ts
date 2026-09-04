import {
  buildSiteExposurePublication,
  evaluateCapabilityRegistration,
  evaluateSitePagePreflight,
  SitePageCapabilityRecord
} from '../domain/site-page/site-page-governance'
import * as sitePageGovernance from '../domain/site-page/site-page-governance'

const discoveredAt = new Date('2026-07-19T06:00:00.000Z')

/** capability builds one discovery/governance test record without coupling tests to persistence. */
function capability(overrides: Partial<SitePageCapabilityRecord> = {}): SitePageCapabilityRecord {
  return {
    pageKey: 'home',
    supportedLocales: ['en-US', 'zh-CN'],
    available: true,
    enabled: false,
    indexable: false,
    syncStatus: 'synced',
    lastDiscoveredAt: discoveredAt,
    ...overrides
  }
}

describe('SitePage capability discovery and governance', () => {
  it('matches the frozen canonical manifest hash interoperability vectors', () => {
    const canonicalManifestHash = (sitePageGovernance as any).canonicalManifestHash

    expect(canonicalManifestHash).toEqual(expect.any(Function))
    expect(canonicalManifestHash([])).toEqual({
      canonicalJson: '[]',
      hash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945'
    })
    expect(
      canonicalManifestHash([
        { pageKey: 'PRODUCT_DETAIL', supportedLocales: ['zh-CN', 'en-US'] },
        { pageKey: 'HOME', supportedLocales: ['en-US'] }
      ])
    ).toEqual({
      canonicalJson:
        '[{"page_key":"HOME","supported_locales":["en-US"]},{"page_key":"PRODUCT_DETAIL","supported_locales":["en-US","zh-CN"]}]',
      hash: 'b8760cd0370e7c54852695c1fcfe895daa9f3d130a90ef1c58bdaa17d60ccacb'
    })
  })

  it('sorts canonical page identities by unsigned UTF-8 bytes without Unicode normalization', () => {
    const canonicalManifestHash = (sitePageGovernance as any).canonicalManifestHash
    expect(canonicalManifestHash).toEqual(expect.any(Function))

    expect(
      canonicalManifestHash([
        { pageKey: '\u{10000}', supportedLocales: ['en-US'] },
        { pageKey: '\uE000', supportedLocales: ['en-US'] }
      ]).canonicalJson
    ).toBe(
      '[{"page_key":"","supported_locales":["en-US"]},{"page_key":"𐀀","supported_locales":["en-US"]}]'
    )
  })

  it('preserves opaque pageKey casing across discovery and governance evaluation', () => {
    const result = evaluateCapabilityRegistration({
      existing: [],
      declared: [{ pageKey: 'Product_Detail.V2', supportedLocales: ['en-US'] }]
    })

    expect(result.pages).toEqual([
      expect.objectContaining({ pageKey: 'Product_Detail.V2', enabled: false, indexable: false })
    ])
  })

  it('treats a complete repeated manifest as idempotent discovery and preserves governance', () => {
    const result = evaluateCapabilityRegistration({
      existing: [capability({ enabled: true, indexable: true })],
      declared: [{ pageKey: 'home', supportedLocales: ['zh-CN', 'en-US'] }]
    })

    expect(result.pages).toEqual([
      expect.objectContaining({
        pageKey: 'home',
        supportedLocales: ['en-US', 'zh-CN'],
        available: true,
        enabled: true,
        indexable: true,
        drift: false
      })
    ])
    expect(result.disappearedPageKeys).toEqual([])
    expect(result.recoveredPageKeys).toEqual([])
  })

  it.each([
    ['canonical duplicate locale', [{ pageKey: 'HOME', supportedLocales: ['en-US', 'en-us'] }]],
    ['invalid BCP47 locale', [{ pageKey: 'HOME', supportedLocales: ['en_US'] }]],
    ['whitespace pageKey', [{ pageKey: ' HOME', supportedLocales: ['en-US'] }]],
    [
      'duplicate pageKey',
      [
        { pageKey: 'HOME', supportedLocales: ['en-US'] },
        { pageKey: 'HOME', supportedLocales: ['zh-CN'] }
      ]
    ],
    ['pageKey over limit', [{ pageKey: 'P'.repeat(129), supportedLocales: ['en-US'] }]],
    ['locale over limit', [{ pageKey: 'HOME', supportedLocales: [`en-${'a'.repeat(30)}`] }]],
    [
      'page count over limit',
      Array.from({ length: 257 }, (_, index) => ({
        pageKey: `PAGE_${index}`,
        supportedLocales: ['en-US']
      }))
    ],
    [
      'locale count over limit',
      [
        {
          pageKey: 'HOME',
          supportedLocales: Array.from({ length: 33 }, (_, index) => `x-${index}`)
        }
      ]
    ]
  ])('rejects malformed capability declarations without normalizing: %s', (_case, declared) => {
    let thrown: unknown
    try {
      evaluateCapabilityRegistration({ existing: [], declared })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toMatchObject({ code: 'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED' })
  })

  it('preserves original valid locale bytes in canonical hashing while sorting by unsigned UTF-8', () => {
    expect(
      sitePageGovernance.canonicalManifestHash([
        { pageKey: 'HOME', supportedLocales: ['zh-CN', 'en-us'] }
      ]).canonicalJson
    ).toBe('[{"page_key":"HOME","supported_locales":["en-us","zh-CN"]}]')
  })

  it('creates a new capability disabled and marks only disappeared enabled capabilities as drift', () => {
    const result = evaluateCapabilityRegistration({
      existing: [
        capability({ pageKey: 'home', enabled: true, indexable: true }),
        capability({ pageKey: 'about', enabled: false })
      ],
      declared: [{ pageKey: 'contact', supportedLocales: ['en-US'] }]
    })

    expect(result.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pageKey: 'contact',
          enabled: false,
          indexable: false,
          available: true,
          drift: false
        }),
        expect.objectContaining({ pageKey: 'home', enabled: true, available: false, drift: true }),
        expect.objectContaining({
          pageKey: 'about',
          enabled: false,
          available: false,
          drift: false
        })
      ])
    )
    expect(result.disappearedPageKeys).toEqual(['about', 'home'])
    expect(result.driftPageKeys).toEqual(['home'])
  })

  it('recovers drift without changing the previous page-wide enabled and index configuration', () => {
    const result = evaluateCapabilityRegistration({
      existing: [capability({ available: false, enabled: true, indexable: false })],
      declared: [{ pageKey: 'home', supportedLocales: ['en-US', 'zh-CN'] }]
    })

    expect(result.pages[0]).toEqual(
      expect.objectContaining({ available: true, enabled: true, indexable: false, drift: false })
    )
    expect(result.recoveredPageKeys).toEqual(['home'])
  })
})

describe('SitePage locale readiness and exposure publication', () => {
  it('blocks locale activation and Sync with machine-readable coverage and drift issues', () => {
    const result = evaluateSitePagePreflight({
      activeLocales: ['en-US'],
      activatingLocale: 'zh-CN',
      pages: [
        capability({ pageKey: 'home', enabled: true, supportedLocales: ['en-US'] }),
        capability({
          pageKey: 'contact',
          enabled: true,
          available: false,
          supportedLocales: ['en-US', 'zh-CN']
        })
      ]
    })

    expect(result.ok).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        { code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE', pageKey: 'home', locale: 'zh-CN' },
        { code: 'SITE_PAGE_CAPABILITY_DRIFT', pageKey: 'contact', locale: '' }
      ])
    )
    expect(result.issues).toHaveLength(2)
  })

  it('builds a versioned public-safe exposure without slug or independent sitemap fields', () => {
    const publication = buildSiteExposurePublication({
      siteId: 'site-1',
      publishVersion: 7,
      defaultLocale: 'en-US',
      activeLocales: ['zh-CN', 'en-US'],
      pages: [capability({ enabled: true, indexable: false })],
      publishedAt: discoveredAt
    })

    expect(publication).toEqual({
      siteId: 'site-1',
      publishVersion: 7,
      defaultLocale: 'en-US',
      activeLocales: ['en-US', 'zh-CN'],
      pages: [
        { pageKey: 'home', enabled: true, indexable: false, supportedLocales: ['en-US', 'zh-CN'] }
      ],
      publishedAt: '2026-07-19T06:00:00.000Z'
    })
    expect(JSON.stringify(publication)).not.toContain('slug')
    expect(JSON.stringify(publication)).not.toContain('sitemap')
  })
})
