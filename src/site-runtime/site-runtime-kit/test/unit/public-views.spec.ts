import { PublicViewsReader } from '../../src'
import type { LocalPublishedStore } from '../../src'

describe('publicViews query layer', () => {
  it('reads one committed locale FAQ directory without slug lookup or locale fallback', async () => {
    const store = { getPublishedResource: jest.fn(async () => ({ siteId: 'brand-us', resourceType: 'faq' as const, resourceId: 'brand-us:faq-directory', slug: '', locale: 'en-US', status: 'published' as const, publishVersion: 9, payloadJson: JSON.stringify({ categories: [] }), updatedAt: '2026-07-25T00:00:00.000Z' })) } as unknown as LocalPublishedStore
    const views = new PublicViewsReader(store, 'brand-us')
    await expect(views.faq.get('en-US')).resolves.toMatchObject({ resourceType: 'faq', locale: 'en-US', slug: '' })
    expect(store.getPublishedResource).toHaveBeenCalledWith({ siteId: 'brand-us', resourceType: 'faq', resourceId: 'brand-us:faq-directory', locale: 'en-US' })
  })
  it('lists and resolves published resources without exposing non-published records', async () => {
    const store: LocalPublishedStore = {
      init: jest.fn(),
      close: jest.fn(),
      getPublishState: jest.fn(),
      updatePublishState: jest.fn(),
      observeRemotePublishVersion: jest.fn(),
      beginSyncRun: jest.fn(),
      completeSyncRun: jest.fn(),
      getSyncRun: jest.fn(),
      rememberWebhookEvent: jest.fn(),
      hasWebhookEvent: jest.fn(),
      hasWebhookNonce: jest.fn(),
      rememberWebhookNonce: jest.fn(),
      upsertPublishedResources: jest.fn(),
      replaceSnapshot: jest.fn(),
      commitPublication: jest.fn(),
      getCapabilityRegistrationState: jest.fn(),
      saveCapabilityRegistrationState: jest.fn(),
      claimCapabilityRegistration: jest.fn(),
      completeCapabilityRegistrationClaim: jest.fn(),
      releaseCapabilityRegistrationClaim: jest.fn(),
      observeCapabilityRegistrationGeneration: jest.fn(),
      getSiteExposurePublication: jest.fn(),
      getPublishedResource: jest.fn(),
      listPublishedResources: jest.fn(async (query) => ({
        items:
          query.resourceType === 'product'
            ? [
                {
                  siteId: 'brand-us',
                  resourceType: 'product' as const,
                  resourceId: 'product_1',
                  slug: 'basin',
                  locale: 'en-US',
                  status: 'published' as const,
                  publishVersion: 3,
                  payloadJson: JSON.stringify({ display_title: 'Basin' }),
                  updatedAt: '2026-06-15T00:00:00.000Z'
                }
              ]
            : [],
        nextCursor: null
      })),
      getPublishedResourceBySlug: jest.fn(async () => ({
        siteId: 'brand-us',
        resourceType: 'product' as const,
        resourceId: 'product_1',
        slug: 'basin',
        locale: 'en-US',
        status: 'published' as const,
        publishVersion: 3,
        payloadJson: JSON.stringify({ display_title: 'Basin' }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      })),
      resolveHistoricalAlias: jest.fn()
    }

    const views = new PublicViewsReader(store, 'brand-us')

    await expect(views.products.list({ locale: 'en-US' })).resolves.toEqual({
      items: [
        expect.objectContaining({
          resourceType: 'product',
          payload: { display_title: 'Basin' }
        })
      ],
      nextCursor: null
    })
    await expect(views.products.getBySlug('basin', 'en-US')).resolves.toEqual(
      expect.objectContaining({
        resourceType: 'product',
        payload: { display_title: 'Basin' }
      })
    )
    expect(store.listPublishedResources).toHaveBeenCalledWith({
      siteId: 'brand-us',
      resourceType: 'product',
      locale: 'en-US',
      status: 'published',
      cursor: undefined,
      limit: undefined
    })
  })

  it('exposes localized content categories through the same published local reader boundary', async () => {
    const store: LocalPublishedStore = {
      init: jest.fn(),
      close: jest.fn(),
      getPublishState: jest.fn(),
      updatePublishState: jest.fn(),
      observeRemotePublishVersion: jest.fn(),
      beginSyncRun: jest.fn(),
      completeSyncRun: jest.fn(),
      getSyncRun: jest.fn(),
      rememberWebhookEvent: jest.fn(),
      hasWebhookEvent: jest.fn(),
      hasWebhookNonce: jest.fn(),
      rememberWebhookNonce: jest.fn(),
      upsertPublishedResources: jest.fn(),
      replaceSnapshot: jest.fn(),
      commitPublication: jest.fn(),
      getCapabilityRegistrationState: jest.fn(),
      saveCapabilityRegistrationState: jest.fn(),
      claimCapabilityRegistration: jest.fn(),
      completeCapabilityRegistrationClaim: jest.fn(),
      releaseCapabilityRegistrationClaim: jest.fn(),
      observeCapabilityRegistrationGeneration: jest.fn(),
      getSiteExposurePublication: jest.fn(),
      getPublishedResource: jest.fn(),
      listPublishedResources: jest.fn(async (query: { resourceType: string }) => ({
        items: query.resourceType === 'article-category' ? [
          {
            siteId: 'brand-us',
            resourceType: 'article-category' as const,
            resourceId: 'content_category_specification',
            slug: 'bathroom-faucet',
            locale: 'en-US',
            status: 'published' as const,
            publishVersion: 8,
            payloadJson: JSON.stringify({
              content_category_id: 'content_category_specification',
              display_name: 'Bathroom Faucet',
              archive_intro: 'Practical guidance for bathroom faucet planning.',
              sort_order: 10
            }),
            updatedAt: '2026-06-15T00:00:00.000Z'
          }
        ] : query.resourceType === 'blog' ? [{
          siteId: 'brand-us', resourceType: 'blog' as const, resourceId: 'article_1', slug: 'article-1', locale: 'en-US', status: 'published' as const, publishVersion: 8,
          payloadJson: JSON.stringify({ content_id: 'article_1', category_ids: ['content_category_specification'] }), updatedAt: '2026-06-15T00:00:00.000Z'
        }] : [],
        nextCursor: null
      })),
      getPublishedResourceBySlug: jest.fn(async () => ({
        siteId: 'brand-us',
        resourceType: 'article-category' as const,
        resourceId: 'content_category_specification',
        slug: 'bathroom-faucet',
        locale: 'en-US',
        status: 'published' as const,
        publishVersion: 8,
        payloadJson: JSON.stringify({
          content_category_id: 'content_category_specification',
          display_name: 'Bathroom Faucet',
          archive_intro: 'Practical guidance for bathroom faucet planning.',
          sort_order: 10
        }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      })),
      resolveHistoricalAlias: jest.fn()
    }

    const views = new PublicViewsReader(store, 'brand-us')

    await expect(views.articleCategories.list({ locale: 'en-US' })).resolves.toEqual({
      items: [
        expect.objectContaining({
          resourceType: 'article-category',
          payload: expect.objectContaining({ content_category_id: 'content_category_specification' })
        })
      ],
      nextCursor: null
    })
    await expect(views.articleCategories.getBySlug('bathroom-faucet', 'en-US')).resolves.toEqual(
      expect.objectContaining({
        resourceType: 'article-category',
        payload: expect.objectContaining({ display_name: 'Bathroom Faucet' })
      })
    )
    expect(store.listPublishedResources).toHaveBeenCalledWith(expect.objectContaining({ siteId: 'brand-us', resourceType: 'article-category', locale: 'en-US', status: 'published' }))
  })

  it('returns only current-locale non-empty Article Categories in deterministic global rank order', async () => {
    const category = (resourceId: string, slug: string, sortOrder: number) => ({
      siteId: 'brand-us', resourceType: 'article-category' as const, resourceId, slug, locale: 'en-US', status: 'published' as const, publishVersion: 12,
      payloadJson: JSON.stringify({ content_category_id: resourceId, display_name: resourceId, sort_order: sortOrder }), updatedAt: '2026-07-26T00:00:00.000Z'
    })
    const article = (resourceType: 'blog' | 'news', resourceId: string, categoryIds: string[]) => ({
      siteId: 'brand-us', resourceType, resourceId, slug: resourceId, locale: 'en-US', status: 'published' as const, publishVersion: 12,
      payloadJson: JSON.stringify({ content_id: resourceId, category_ids: categoryIds }), updatedAt: '2026-07-26T00:00:00.000Z'
    })
    const store = {
      listPublishedResources: jest.fn(async (query: { resourceType: string }) => ({
        items: query.resourceType === 'article-category'
          ? [category('category_empty', 'empty', 1), category('category_guides', 'guides', 20)]
          : query.resourceType === 'blog'
            ? [article('blog', 'blog_1', ['category_guides'])]
            : query.resourceType === 'news'
              ? [article('news', 'news_1', ['category_guides'])]
              : [],
        nextCursor: null
      })),
      getPublishedResourceBySlug: jest.fn(async () => category('category_empty', 'empty', 1))
    } as unknown as LocalPublishedStore

    const views = new PublicViewsReader(store, 'brand-us')
    await expect(views.articleCategories.list({ locale: 'en-US' })).resolves.toEqual({
      items: [expect.objectContaining({ resourceId: 'category_guides', articleCount: 2, blogCount: 1, newsCount: 1 })],
      nextCursor: null
    })
    await expect(views.articleCategories.getBySlug('empty', 'en-US')).resolves.toBeNull()
  })

  it('resolves a historical alias to stable identity and the current canonical without exposing a view payload', async () => {
    const store = {
      resolveHistoricalAlias: jest.fn(async () => ({
        resourceType: 'blog' as const,
        resourceId: 'article_1',
        locale: 'en-US',
        canonicalSlug: 'current-blog'
      }))
    } as unknown as LocalPublishedStore
    const views = new PublicViewsReader(store, 'brand-us')

    await expect(
      views.historicalAliases.resolve({
        namespace: 'blog',
        locale: 'en-US',
        slug: 'old-blog'
      })
    ).resolves.toEqual({
      resourceType: 'blog',
      resourceId: 'article_1',
      locale: 'en-US',
      canonicalSlug: 'current-blog'
    })
    expect(store.resolveHistoricalAlias).toHaveBeenCalledWith({
      siteId: 'brand-us',
      namespace: 'blog',
      locale: 'en-US',
      slug: 'old-blog'
    })
  })
})
