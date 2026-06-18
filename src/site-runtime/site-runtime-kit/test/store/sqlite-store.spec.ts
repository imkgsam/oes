import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { NodeSqlitePublishedStore } from '../../src'

describe('NodeSqlitePublishedStore', () => {
  function createStore(): NodeSqlitePublishedStore {
    return new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-')), 'runtime.sqlite')
    })
  }

  it('initializes schema and persists publish state, sync runs, webhook events, and resources', async () => {
    const store = createStore()
    await store.init()

    await expect(store.getPublishState('brand-us')).resolves.toEqual({
      siteId: 'brand-us',
      localPublishVersion: 0,
      latestSyncId: null,
      lastSuccessfulSyncAt: null,
      lastKnownRemotePublishVersion: null
    })

    await store.updatePublishState({
      siteId: 'brand-us',
      localPublishVersion: 3,
      latestSyncId: 'sync_3',
      lastSuccessfulSyncAt: '2026-06-15T00:00:00.000Z',
      lastKnownRemotePublishVersion: 3
    })
    const runId = await store.beginSyncRun({
      siteId: 'brand-us',
      trigger: 'manual',
      fromPublishVersion: 0,
      toPublishVersion: 3
    })
    await store.completeSyncRun(runId, {
      status: 'completed',
      localPublishVersion: 3
    })
    await expect(store.getSyncRun(runId)).resolves.toEqual(
      expect.objectContaining({
        siteId: 'brand-us',
        trigger: 'manual',
        status: 'completed',
        localPublishVersion: 3
      })
    )
    await expect(store.rememberWebhookEvent('brand-us', 'evt_1', 'nonce_1')).resolves.toBe(true)
    await expect(store.rememberWebhookEvent('brand-us', 'evt_1', 'nonce_2')).resolves.toBe(false)

    await store.upsertPublishedResources([
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
      },
      {
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_2',
        slug: 'hidden',
        locale: 'en-US',
        status: 'unpublished',
        publishVersion: 3,
        payloadJson: JSON.stringify({ display_title: 'Hidden' }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      },
      {
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_3',
        slug: 'deleted',
        locale: 'en-US',
        status: 'deleted',
        publishVersion: 3,
        payloadJson: JSON.stringify({ display_title: 'Deleted' }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      },
      {
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_4',
        slug: 'disabled',
        locale: 'en-US',
        status: 'disabled',
        publishVersion: 3,
        payloadJson: JSON.stringify({ display_title: 'Disabled' }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      }
    ])

    await expect(
      store.listPublishedResources({
        siteId: 'brand-us',
        resourceType: 'product',
        locale: 'en-US',
        status: 'published'
      })
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          resourceId: 'product_1',
          slug: 'basin',
          status: 'published'
        })
      ],
      nextCursor: null
    })

    await store.close()
  })

  it('rolls back snapshot rebuild when any snapshot row is invalid', async () => {
    const store = createStore()
    await store.init()
    await store.upsertPublishedResources([
      {
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_1',
        slug: 'old-basin',
        locale: 'en-US',
        status: 'published',
        publishVersion: 1,
        payloadJson: JSON.stringify({ display_title: 'Old Basin' }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      }
    ])

    await expect(
      store.replaceSnapshot({
        siteId: 'brand-us',
        publishVersion: 2,
        resources: [
          {
            siteId: 'brand-us',
            resourceType: 'product',
            resourceId: 'product_2',
            slug: '',
            locale: 'en-US',
            status: 'published',
            publishVersion: 2,
            payloadJson: JSON.stringify({ display_title: 'Broken' }),
            updatedAt: '2026-06-15T00:00:00.000Z'
          }
        ]
      })
    ).rejects.toThrow(/slug/)

    await expect(
      store.getPublishedResourceBySlug({
        siteId: 'brand-us',
        resourceType: 'product',
        slug: 'old-basin',
        locale: 'en-US',
        status: 'published'
      })
    ).resolves.toEqual(expect.objectContaining({ resourceId: 'product_1' }))

    await store.close()
  })
})
