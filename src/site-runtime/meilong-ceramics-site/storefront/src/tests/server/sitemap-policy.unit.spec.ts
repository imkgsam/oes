import { buildSitemapEntries } from '../../../server/utils/sitemap-policy'
import type { SeoRouteIndex } from '../../../types/public-view'

describe('Storefront sitemap policy', () => {
  it('excludes noindex pages and keeps sitemap entries on one committed version', () => {
    const index: SeoRouteIndex = {
      publicBaseUrl: 'https://meilong-ceramics.com',
      defaultLocale: 'en-US',
      activeLocales: ['en-US'],
      committedPublishVersion: 31,
      publishedAt: '2026-07-20T10:00:00.000Z',
      pages: [
        { pageKey: 'HOME', locale: 'en-US', indexEligible: true },
        { pageKey: 'ABOUT', locale: 'en-US', indexEligible: false },
        { pageKey: 'NEWS_LIST', locale: 'en-US', indexEligible: true },
        { pageKey: 'COLLECTION_LIST', locale: 'en-US', indexEligible: true },
        { pageKey: 'PRODUCT_LIST', locale: 'en-US', indexEligible: true },
        { pageKey: 'CATEGORY_LIST', locale: 'en-US', indexEligible: true }
      ],
      routes: [
        {
          resourceType: 'news',
          pageKey: 'NEWS_DETAIL',
          locale: 'en-US',
          slug: 'factory-update',
          path: '/news/factory-update',
          canonicalUrl: 'https://meilong-ceramics.com/news/factory-update',
          updatedAt: '2026-07-20T09:00:00.000Z',
          committedPublishVersion: 31
        }
      ]
    }

    expect(buildSitemapEntries(index)).toEqual([
      {
        canonicalUrl: 'https://meilong-ceramics.com/',
        updatedAt: '2026-07-20T10:00:00.000Z'
      },
      {
        canonicalUrl: 'https://meilong-ceramics.com/news',
        updatedAt: '2026-07-20T10:00:00.000Z'
      },
      {
        canonicalUrl: 'https://meilong-ceramics.com/product/collections',
        updatedAt: '2026-07-20T10:00:00.000Z'
      },
      {
        canonicalUrl: 'https://meilong-ceramics.com/news/factory-update',
        updatedAt: '2026-07-20T09:00:00.000Z'
      }
    ])
  })

  it('fails sitemap generation when a dynamic route is from a different publication version', () => {
    const index = {
      publicBaseUrl: 'https://meilong-ceramics.com',
      defaultLocale: 'en-US',
      activeLocales: ['en-US'],
      committedPublishVersion: 31,
      publishedAt: '2026-07-20T10:00:00.000Z',
      pages: [],
      routes: [
        {
          resourceType: 'news',
          pageKey: 'NEWS_DETAIL',
          locale: 'en-US',
          slug: 'stale',
          path: '/news/stale',
          canonicalUrl: 'https://meilong-ceramics.com/news/stale',
          updatedAt: '2026-07-20T09:00:00.000Z',
          committedPublishVersion: 30
        }
      ]
    } as SeoRouteIndex

    expect(() => buildSitemapEntries(index)).toThrow(/committed publication version/i)
  })
})
