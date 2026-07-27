import type { LocalPublishedStore } from '../../src'
import { PublicViewsReader } from '../../src'

describe('SiteExposureReader', () => {
  it('exposes one committed routing and SEO policy without locale fallback', async () => {
    const store = {
      getSiteExposurePublication: jest.fn(async () => ({
        siteId: 'brand-us',
        publishVersion: 7,
        defaultLocale: 'en-US',
        activeLocales: ['en-US', 'zh-CN'],
        pages: [
          {
            pageKey: 'PRODUCT_DETAIL',
            enabled: true,
            indexable: true,
            supportedLocales: ['en-US']
          }
        ],
        publishedAt: '2026-06-15T00:00:00.000Z'
      })),
      getPublishedResource: jest.fn(async ({ locale }: { locale: string }) =>
        locale === 'en-US'
          ? {
              siteId: 'brand-us',
              resourceType: 'product',
              resourceId: 'product_1',
              slug: 'basin',
              locale,
              status: 'published',
              publishVersion: 7,
              payloadJson: '{}',
              updatedAt: '2026-06-15T00:00:00.000Z'
            }
          : null
      )
    } as unknown as LocalPublishedStore
    const exposure = new PublicViewsReader(store, 'brand-us').exposure

    await expect(exposure.getPublication()).resolves.toMatchObject({
      defaultLocale: 'en-US',
      activeLocales: ['en-US', 'zh-CN'],
      publishVersion: 7
    })
    await expect(exposure.getPagePolicy('PRODUCT_DETAIL', 'en-US')).resolves.toMatchObject({
      enabled: true,
      accessible: true,
      indexEligible: true,
      supportedLocales: ['en-US'],
      committedPublishVersion: 7
    })
    await expect(exposure.getPagePolicy('PRODUCT_DETAIL', 'zh-CN')).resolves.toMatchObject({
      enabled: true,
      localeActive: true,
      localeSupported: false,
      accessible: false,
      indexEligible: false
    })
    await expect(
      exposure.isResourceLocaleAvailable({
        resourceType: 'product',
        resourceId: 'product_1',
        locale: 'en-US'
      })
    ).resolves.toBe(true)
    await expect(
      exposure.isResourceLocaleAvailable({
        resourceType: 'product',
        resourceId: 'product_1',
        locale: 'zh-CN'
      })
    ).resolves.toBe(false)
  })

  it('fails closed when no committed exposure publication exists', async () => {
    const store = {
      getSiteExposurePublication: jest.fn(async () => null),
      getPublishedResource: jest.fn(async () => null)
    } as unknown as LocalPublishedStore
    const exposure = new PublicViewsReader(store, 'brand-us').exposure

    await expect(exposure.getPagePolicy('HOME', 'en-US')).resolves.toMatchObject({
      enabled: false,
      localeActive: false,
      accessible: false,
      indexEligible: false,
      committedPublishVersion: 0
    })
  })
})
