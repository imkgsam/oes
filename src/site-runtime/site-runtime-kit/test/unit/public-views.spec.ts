import { PublicViewsReader } from '../../src'
import type { LocalPublishedStore } from '../../src'

describe('publicViews query layer', () => {
  it('lists and resolves published resources without exposing non-published records', async () => {
    const store: LocalPublishedStore = {
      init: jest.fn(),
      close: jest.fn(),
      getPublishState: jest.fn(),
      updatePublishState: jest.fn(),
      beginSyncRun: jest.fn(),
      completeSyncRun: jest.fn(),
      getSyncRun: jest.fn(),
      rememberWebhookEvent: jest.fn(),
      hasWebhookEvent: jest.fn(),
      hasWebhookNonce: jest.fn(),
      rememberWebhookNonce: jest.fn(),
      upsertPublishedResources: jest.fn(),
      replaceSnapshot: jest.fn(),
      listPublishedResources: jest.fn(async (query) => ({
        items:
          query.resourceType === 'product'
            ? [
                {
                  siteId: 'brand-us',
                  resourceType: 'product',
                  resourceId: 'product_1',
                  slug: 'basin',
                  locale: 'en-US',
                  status: 'published',
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
        resourceType: 'product',
        resourceId: 'product_1',
        slug: 'basin',
        locale: 'en-US',
        status: 'published',
        publishVersion: 3,
        payloadJson: JSON.stringify({ display_title: 'Basin' }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      }))
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
})
