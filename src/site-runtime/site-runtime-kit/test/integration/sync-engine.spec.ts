import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  NodeSqlitePublishedStore,
  PublicViewsReader,
  SiteRuntimeError,
  SyncEngine,
  type ChangedResourceRef
} from '../../src'

function createStore(): NodeSqlitePublishedStore {
  return new NodeSqlitePublishedStore({
    path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-sync-')), 'runtime.sqlite')
  })
}

describe('SyncEngine integration', () => {
  it('performs first snapshot sync and serves data through runtime.publicViews', async () => {
    const store = createStore()
    await store.init()
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 2,
        latest_sync_id: 'sync_2',
        has_updates: true,
        server_time: '2026-06-15T00:00:00.000Z'
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 2,
        public_views: [
          {
            site_id: 'brand-us',
            resource_type: 'product',
            resource_id: 'product_1',
            slug: 'basin',
            locale: 'en-US',
            status: 'published',
            publish_version: 2,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: { display_title: 'Basin' }
          }
        ],
        next_page_token: null,
        is_complete: true
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true }))
    }

    const sync = new SyncEngine({ siteId: 'brand-us', store, client })
    await expect(sync.syncToLatest('manual')).resolves.toMatchObject({
      status: 'completed',
      localPublishVersion: 2
    })

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      lastKnownRemotePublishVersion: 2
    })
    const views = new PublicViewsReader(store, 'brand-us')
    await expect(views.products.getBySlug('basin', 'en-US')).resolves.toMatchObject({
      payload: { display_title: 'Basin' }
    })
    expect(client.reportSyncResult).toHaveBeenCalledWith(
      expect.objectContaining({ local_publish_version: 2, status: 'completed' })
    )
    await store.close()
  })

  it('applies changed resources with latest public views and does not advance on failure', async () => {
    const store = createStore()
    await store.init()
    await store.replaceSnapshot({
      siteId: 'brand-us',
      publishVersion: 2,
      resources: [
        {
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          slug: 'basin',
          locale: 'en-US',
          status: 'published',
          publishVersion: 2,
          payloadJson: JSON.stringify({ display_title: 'Old Basin' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ]
    })
    const changed: ChangedResourceRef[] = [
      { resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }
    ]
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3',
        has_updates: true,
        server_time: '2026-06-15T00:00:00.000Z'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 2,
        to_publish_version: 3,
        requires_snapshot: false,
        changed_resources: changed
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [
          {
            site_id: 'brand-us',
            resource_type: 'product',
            resource_id: 'product_1',
            slug: 'basin',
            locale: 'en-US',
            status: 'published',
            publish_version: 3,
            updated_at: '2026-06-15T01:00:00.000Z',
            payload: { display_title: 'New Basin' }
          }
        ],
        missing_resources: [],
        server_publish_version: 3
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true }))
    }

    const sync = new SyncEngine({ siteId: 'brand-us', store, client })
    await sync.syncToLatest('pull')
    await expect(new PublicViewsReader(store, 'brand-us').products.getBySlug('basin', 'en-US')).resolves.toMatchObject({
      payload: { display_title: 'New Basin' }
    })

    client.batchGetPublicViews.mockRejectedValueOnce(new Error('remote unavailable'))
    client.getLatestPublishState.mockResolvedValueOnce({
      site_id: 'brand-us',
      latest_publish_version: 4,
      latest_sync_id: 'sync_4',
      has_updates: true,
      server_time: '2026-06-15T00:00:00.000Z'
    })
    client.listChangedResources.mockResolvedValueOnce({
      site_id: 'brand-us',
      from_publish_version: 3,
      to_publish_version: 4,
      requires_snapshot: false,
      changed_resources: changed
    })

    await expect(sync.syncToLatest('pull')).rejects.toThrow(/remote unavailable/)
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 3
    })
    expect(client.reportSyncResult).toHaveBeenLastCalledWith(
      expect.objectContaining({ local_publish_version: 3, status: 'failed' })
    )
    await store.close()
  })

  it('coalesces concurrent triggers into one pending sync after the current run', async () => {
    const store = createStore()
    await store.init()
    let releaseRemote: (() => void) | undefined
    const remoteGate = new Promise<void>((resolve) => {
      releaseRemote = resolve
    })
    const client = {
      getLatestPublishState: jest
        .fn()
        .mockImplementationOnce(async () => {
          await remoteGate
          return {
            site_id: 'brand-us',
            latest_publish_version: 1,
            latest_sync_id: 'sync_1',
            has_updates: true,
            server_time: '2026-06-15T00:00:00.000Z'
          }
        })
        .mockResolvedValue({
          site_id: 'brand-us',
          latest_publish_version: 1,
          latest_sync_id: 'sync_1',
          has_updates: false,
          server_time: '2026-06-15T00:00:00.000Z'
        }),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 1,
        public_views: [],
        next_page_token: null,
        is_complete: true
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true }))
    }
    const sync = new SyncEngine({ siteId: 'brand-us', store, client })

    const running = sync.syncToLatest('webhook')
    await expect(sync.syncToLatest('pull')).resolves.toMatchObject({ status: 'queued' })
    releaseRemote?.()
    await running

    expect(client.getLatestPublishState).toHaveBeenCalledTimes(2)
    expect(sync.getState()).toMatchObject({ syncInProgress: false, pendingSync: false })
    await store.close()
  })

  it('rebuilds from snapshot when delta requires a snapshot fallback', async () => {
    const store = createStore()
    await store.init()
    await store.replaceSnapshot({
      siteId: 'brand-us',
      publishVersion: 1,
      resources: []
    })
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 5,
        latest_sync_id: 'sync_5',
        has_updates: true,
        server_time: '2026-06-15T00:00:00.000Z'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 1,
        to_publish_version: 5,
        requires_snapshot: true,
        changed_resources: []
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 5,
        public_views: [
          {
            site_id: 'brand-us',
            resource_type: 'blog',
            resource_id: 'blog_1',
            slug: 'launch',
            locale: 'en-US',
            status: 'published',
            publish_version: 5,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: { title: 'Launch' }
          }
        ],
        next_page_token: null,
        is_complete: true
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true }))
    }

    const sync = new SyncEngine({ siteId: 'brand-us', store, client })
    await expect(sync.syncToLatest('pull')).resolves.toMatchObject({
      status: 'completed',
      localPublishVersion: 5
    })
    await expect(new PublicViewsReader(store, 'brand-us').blogs.getBySlug('launch', 'en-US')).resolves.toMatchObject({
      payload: { title: 'Launch' }
    })
    expect(client.getSnapshot).toHaveBeenCalled()
    await store.close()
  })

  it('records failed sync runs and blocked status when latest state rejects with site disabled', async () => {
    const store = createStore()
    await store.init()
    const client = {
      getLatestPublishState: jest.fn(async () => {
        throw new SiteRuntimeError({
          code: 'SITE_DISABLED',
          message: 'site disabled',
          httpStatus: 403
        })
      }),
      reportSyncResult: jest.fn(async () => ({ accepted: true }))
    }
    const sync = new SyncEngine({ siteId: 'brand-us', store, client })

    await expect(sync.syncToLatest('pull')).rejects.toMatchObject({
      code: 'SITE_DISABLED',
      runtimeStatus: 'blocked'
    })
    expect(client.reportSyncResult).toHaveBeenCalledWith(
      expect.objectContaining({ local_publish_version: 0, status: 'blocked' })
    )
    await store.close()
  })
})
