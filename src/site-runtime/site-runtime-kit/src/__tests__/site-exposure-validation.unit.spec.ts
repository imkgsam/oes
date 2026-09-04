import { normalizeSiteExposurePublication } from '../../src'

// validExposure supplies a complete camelCase publication that individual cases can corrupt.
function validExposure(): Record<string, unknown> {
  return {
    siteId: 'brand-us',
    publishVersion: 3,
    defaultLocale: 'en-US',
    activeLocales: ['en-US', 'zh-CN'],
    pages: [
      {
        pageKey: 'PRODUCT_DETAIL',
        enabled: true,
        indexable: true,
        supportedLocales: ['en-US', 'zh-CN']
      }
    ],
    publishedAt: '2026-06-15T00:00:00.000Z'
  }
}

describe('normalizeSiteExposurePublication', () => {
  it('strictly normalizes snake_case exposure fields and canonical locale ordering', () => {
    expect(
      normalizeSiteExposurePublication({
        site_id: 'brand-us',
        publish_version: 3,
        default_locale: 'en-us',
        active_locales: ['zh-cn', 'en-us'],
        pages: [
          {
            page_key: 'PRODUCT_DETAIL',
            enabled: true,
            indexable: false,
            supported_locales: ['zh-cn', 'en-us']
          }
        ],
        published_at: '2026-06-15T00:00:00.000Z'
      })
    ).toEqual({
      siteId: 'brand-us',
      publishVersion: 3,
      defaultLocale: 'en-US',
      activeLocales: ['en-US', 'zh-CN'],
      pages: [
        {
          pageKey: 'PRODUCT_DETAIL',
          enabled: true,
          indexable: false,
          supportedLocales: ['en-US', 'zh-CN']
        }
      ],
      publishedAt: '2026-06-15T00:00:00.000Z'
    })
  })

  it.each([
    ['string enabled', () => ({ ...validExposure(), pages: [{ pageKey: 'HOME', enabled: 'true', indexable: true, supportedLocales: ['en-US'] }] })],
    ['malformed active locale', () => ({ ...validExposure(), activeLocales: ['en-US', 42] })],
    ['malformed supported locale', () => ({ ...validExposure(), pages: [{ pageKey: 'HOME', enabled: true, indexable: true, supportedLocales: ['bad_locale'] }] })],
    ['non-object page', () => ({ ...validExposure(), pages: [null] })],
    ['empty siteId', () => ({ ...validExposure(), siteId: '' })],
    ['empty defaultLocale', () => ({ ...validExposure(), defaultLocale: '' })],
    ['empty publishedAt', () => ({ ...validExposure(), publishedAt: '' })],
    ['negative version', () => ({ ...validExposure(), publishVersion: -1 })],
    ['fractional version', () => ({ ...validExposure(), publishVersion: 1.5 })],
    ['unsafe version', () => ({ ...validExposure(), publishVersion: Number.MAX_SAFE_INTEGER + 1 })],
    ['invalid pageKey', () => ({ ...validExposure(), pages: [{ pageKey: 'bad key', enabled: true, indexable: true, supportedLocales: ['en-US'] }] })],
    ['duplicate pageKey', () => ({ ...validExposure(), pages: [
      { pageKey: 'HOME', enabled: true, indexable: true, supportedLocales: ['en-US'] },
      { pageKey: 'HOME', enabled: false, indexable: false, supportedLocales: ['en-US'] }
    ] })],
    ['duplicate active locale', () => ({ ...validExposure(), activeLocales: ['en-US', 'en-us'] })],
    ['duplicate supported locale', () => ({ ...validExposure(), pages: [{ pageKey: 'HOME', enabled: true, indexable: true, supportedLocales: ['en-US', 'en-us'] }] })]
  ])('rejects %s', (_label, createInput) => {
    expect(() => normalizeSiteExposurePublication(createInput())).toThrow(/site exposure/i)
  })
})
