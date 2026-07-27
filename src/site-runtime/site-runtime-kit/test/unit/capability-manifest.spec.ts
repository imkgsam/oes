import {
  hashSiteCapabilityManifest,
  normalizeSiteCapabilityManifest,
  type SiteCapabilityManifest
} from '../../src'

describe('site capability manifest', () => {
  it('matches the frozen empty and multi-page canonical hash vectors', () => {
    expect(hashSiteCapabilityManifest({ pages: [] })).toBe(
      '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945'
    )
    expect(
      hashSiteCapabilityManifest({
        pages: [
          { pageKey: 'PRODUCT_DETAIL', supportedLocales: ['zh-CN', 'en-US'] },
          { pageKey: 'HOME', supportedLocales: ['en-US'] }
        ]
      })
    ).toBe('b8760cd0370e7c54852695c1fcfe895daa9f3d130a90ef1c58bdaa17d60ccacb')
  })

  it('orders opaque Unicode page keys by unsigned UTF-8 bytes without normalization', () => {
    const manifest = {
      pages: [
        { pageKey: '\u{10000}', supportedLocales: ['en-US'] },
        { pageKey: '\uE000', supportedLocales: ['en-US'] }
      ]
    }

    expect(normalizeSiteCapabilityManifest(manifest).pages.map((page) => page.pageKey)).toEqual([
      '\uE000',
      '\u{10000}'
    ])
    expect(hashSiteCapabilityManifest(manifest)).toBe(
      'd342f14290f53520f3d7d3dc3ebc37967978a4c15964e56d428166aed56e41a4'
    )
  })

  it('validates locale syntax without case-folding the bytes used by the manifest hash', () => {
    const lowerCaseLocaleManifest = {
      pages: [{ pageKey: 'HOME', supportedLocales: ['en-us'] }]
    }

    expect(normalizeSiteCapabilityManifest(lowerCaseLocaleManifest)).toEqual(
      lowerCaseLocaleManifest
    )
    expect(hashSiteCapabilityManifest(lowerCaseLocaleManifest)).not.toBe(
      hashSiteCapabilityManifest({
        pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }]
      })
    )
  })

  it('accepts only a complete pageKey and supportedLocales manifest and normalizes ordering', () => {
    const manifest: SiteCapabilityManifest = {
      pages: [
        { pageKey: 'PRODUCT_DETAIL', supportedLocales: ['zh-CN', 'en-US'] },
        { pageKey: 'HOME', supportedLocales: ['en-US'] }
      ]
    }

    expect(normalizeSiteCapabilityManifest(manifest)).toEqual({
      pages: [
        { pageKey: 'HOME', supportedLocales: ['en-US'] },
        { pageKey: 'PRODUCT_DETAIL', supportedLocales: ['en-US', 'zh-CN'] }
      ]
    })
  })

  it.each([
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'], pageKind: 'static' }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'], route: '/' }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'], layout: 'default' }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'], component: 'HomePage' }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'], content: {} }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'], resourceId: 'resource_1' }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US', 'en-US'] }] },
    { pages: [{ pageKey: ' HOME ', supportedLocales: ['en-US'] }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: [] }] },
    { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }], sitemap: true }
  ])('rejects forbidden or malformed manifest data: %#', (manifest) => {
    expect(() => normalizeSiteCapabilityManifest(manifest)).toThrow(/capability manifest/i)
  })

  it('accepts an empty complete manifest so disappearance can be registered explicitly', () => {
    expect(normalizeSiteCapabilityManifest({ pages: [] })).toEqual({ pages: [] })
  })
})
