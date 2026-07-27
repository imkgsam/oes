import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  NodeSqlitePublishedStore,
  PublicViewsReader,
  SignedOesClient,
  SiteRuntimeError,
  SyncEngine,
  type ChangedResourceRef,
  type SyncEngineClient
} from '../../src'

function createStore(): NodeSqlitePublishedStore {
  return new NodeSqlitePublishedStore({
    path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-sync-')), 'runtime.sqlite')
  })
}

// exposurePublication supplies one valid slug-free governance payload for sync fixtures.
function exposurePublication(publishVersion: number) {
  return {
    siteId: 'brand-us',
    publishVersion,
    defaultLocale: 'en-US',
    activeLocales: ['en-US'],
    pages: [],
    publishedAt: '2026-06-15T00:00:00.000Z'
  }
}

// publicViewPayload supplies one valid resource response for strict sync-boundary tests.
function publicViewPayload(resourceId: string, publishVersion: number, locale = 'en-US') {
  return {
    site_id: 'brand-us',
    resource_type: 'product',
    resource_id: resourceId,
    slug: resourceId,
    locale,
    status: 'published',
    publish_version: publishVersion,
    updated_at: '2026-06-15T01:00:00.000Z',
    payload: { display_title: resourceId }
  }
}

// seedCommittedPublication creates the complete old publication used to prove fail-closed behavior.
async function seedCommittedPublication(store: NodeSqlitePublishedStore): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId: 'brand-us',
    expectedLocalPublishVersion: 0,
    publishVersion: 2,
    latestSyncId: 'sync_2',
    lastKnownRemotePublishVersion: 2,
    exposure: exposurePublication(2),
    resources: [
      {
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_1',
        slug: 'stale-basin',
        locale: 'en-US',
        status: 'published',
        publishVersion: 2,
        payloadJson: JSON.stringify({ display_title: 'Stale Basin' }),
        updatedAt: '2026-06-15T00:00:00.000Z'
      }
    ],
    missingResources: []
  })
}

// expectCommittedPublicationUnchanged verifies that no malformed remote payload crossed the atomic commit boundary.
async function expectCommittedPublicationUnchanged(store: NodeSqlitePublishedStore): Promise<void> {
  await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
    localPublishVersion: 2,
    latestSyncId: 'sync_2'
  })
  await expect(store.getSiteExposurePublication('brand-us')).resolves.toEqual(exposurePublication(2))
  await expect(
    new PublicViewsReader(store, 'brand-us').products.getBySlug('stale-basin', 'en-US')
  ).resolves.toMatchObject({
    publishVersion: 2,
    payload: { display_title: 'Stale Basin' }
  })
}

describe('SyncEngine integration', () => {
  it('commits a target-pinned FAQ directory locally and does not fall back across locales', async () => {
    const store = createStore(); await store.init()
    const client = {
      getLatestPublishState: jest.fn(async () => ({ site_id: 'brand-us', latest_publish_version: 3, latest_sync_id: 'sync_3', has_updates: true })),
      getSnapshot: jest.fn(async () => ({ site_id: 'brand-us', snapshot_publish_version: 3, public_views: [{ site_id: 'brand-us', resource_type: 'faq', resource_id: 'brand-us:faq-directory', slug: '', locale: 'en-US', status: 'published', publish_version: 3, updated_at: '2026-07-25T00:00:00.000Z', payload: { categories: [{ category_id: 'care', title: 'Care', anchor_key: 'care', sort_order: 1, entries: [] }] } }], next_page_token: null, is_complete: true, exposure_publication: exposurePublication(3) })),
      reportSyncResult: jest.fn(async () => ({ accepted: true }))
    }
    await new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('manual')
    const reader = new PublicViewsReader(store, 'brand-us')
    await expect(reader.faq.get('en-US')).resolves.toMatchObject({ publishVersion: 3, payload: { categories: [expect.objectContaining({ anchor_key: 'care' })] } })
    await expect(reader.faq.get('fr-FR')).resolves.toBeNull()
    await store.close()
  })
  it('pins snapshot pages to N and automatically catches up after latest advances to N+1', async () => {
    const store = createStore(); await store.init()
    const latest = jest.fn()
      .mockResolvedValueOnce({ site_id: 'brand-us', latest_publish_version: 5, latest_sync_id: 'sync_5', has_updates: true })
      .mockResolvedValueOnce({ site_id: 'brand-us', latest_publish_version: 6, latest_sync_id: 'sync_6', has_updates: true })
      .mockResolvedValue({ site_id: 'brand-us', latest_publish_version: 6, latest_sync_id: 'sync_6', has_updates: false })
    const snapshot = jest.fn(async (input: Record<string, unknown>) => {
      const target = input.target_publish_version
      return { site_id: 'brand-us', snapshot_publish_version: target, public_views: [publicViewPayload(`product_${target}`, target as number)], next_page_token: null, is_complete: true, exposure_publication: exposurePublication(target as number) }
    })
    const client = { getLatestPublishState: latest, getSnapshot: snapshot, reportSyncResult: jest.fn(async () => ({ accepted: true })) }
    await expect(new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('manual')).resolves.toMatchObject({ localPublishVersion: 6 })
    expect(snapshot).toHaveBeenNthCalledWith(1, expect.objectContaining({ target_publish_version: 5 }))
    expect(snapshot).toHaveBeenNthCalledWith(2, expect.objectContaining({ target_publish_version: 6 }))
    await store.close()
  })
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
        is_complete: true,
        exposure_publication: exposurePublication(2)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
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

  it('keeps the committed publication authoritative when post-commit sync-run audit fails', async () => {
    const store = createStore()
    await store.init()
    const beginSyncRun = jest.spyOn(store, 'beginSyncRun')
    jest.spyOn(store, 'completeSyncRun').mockRejectedValueOnce(new Error('audit unavailable'))
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 2,
        latest_sync_id: 'sync_2',
        has_updates: true
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 2,
        public_views: [publicViewPayload('product_2', 2)],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(2)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('manual')
    ).resolves.toEqual({ status: 'degraded', localPublishVersion: 2 })

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      latestSyncId: 'sync_2'
    })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toEqual(
      exposurePublication(2)
    )
    await expect(
      new PublicViewsReader(store, 'brand-us').products.getBySlug('product_2', 'en-US')
    ).resolves.toMatchObject({ publishVersion: 2 })
    const runId = await beginSyncRun.mock.results[0]!.value
    await expect(store.getSyncRun(runId)).resolves.toMatchObject({
      status: 'degraded',
      localPublishVersion: 2,
      errorCode: 'SYNC_AUDIT_FAILED'
    })
    expect(client.reportSyncResult).toHaveBeenCalledWith(
      expect.objectContaining({ local_publish_version: 2, status: 'degraded' })
    )
    await store.close()
  })

  it('keeps the committed publication authoritative when post-commit reporting fails', async () => {
    const store = createStore()
    await store.init()
    const beginSyncRun = jest.spyOn(store, 'beginSyncRun')
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 2,
        latest_sync_id: 'sync_2',
        has_updates: true
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 2,
        public_views: [publicViewPayload('product_2', 2)],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(2)
      })),
      reportSyncResult: jest.fn(async () => {
        throw new Error('report unavailable')
      })
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('manual')
    ).resolves.toEqual({ status: 'degraded', localPublishVersion: 2 })

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      latestSyncId: 'sync_2'
    })
    await expect(
      new PublicViewsReader(store, 'brand-us').products.getBySlug('product_2', 'en-US')
    ).resolves.toMatchObject({ publishVersion: 2 })
    const runId = await beginSyncRun.mock.results[0]!.value
    await expect(store.getSyncRun(runId)).resolves.toMatchObject({
      status: 'degraded',
      localPublishVersion: 2,
      errorCode: 'SYNC_REPORT_FAILED'
    })
    await store.close()
  })

  it.each([
    ['accepted false', { accepted: false, server_time: '2026-06-15T00:00:00.000Z' }],
    ['accepted string', { accepted: 'true', server_time: '2026-06-15T00:00:00.000Z' }],
    ['missing server time', { accepted: true }]
  ])('marks committed sync degraded when reporting returns %s', async (_label, reportResponse) => {
    const store = createStore()
    await store.init()
    const beginSyncRun = jest.spyOn(store, 'beginSyncRun')
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 2,
        latest_sync_id: 'sync_2',
        has_updates: true
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 2,
        public_views: [publicViewPayload('product_2', 2)],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(2)
      })),
      reportSyncResult: jest.fn(async () => reportResponse)
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('manual')
    ).resolves.toEqual({ status: 'degraded', localPublishVersion: 2 })
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      latestSyncId: 'sync_2'
    })
    await expect(
      new PublicViewsReader(store, 'brand-us').products.getBySlug('product_2', 'en-US')
    ).resolves.toMatchObject({ publishVersion: 2 })
    const runId = await beginSyncRun.mock.results[0]!.value
    await expect(store.getSyncRun(runId)).resolves.toMatchObject({
      status: 'degraded',
      localPublishVersion: 2,
      errorCode: 'SYNC_REPORT_FAILED'
    })
    await store.close()
  })

  it('fails closed when latest reports a publish version below the committed local version', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 1,
        latest_sync_id: 'sync_1',
        has_updates: false
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/REMOTE_PUBLISH_VERSION_ROLLBACK/)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('retries a stale no-update observation without rolling back a concurrent committed publication', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-race-')), 'runtime.sqlite')
    const firstStore = new NodeSqlitePublishedStore({ path })
    const secondStore = new NodeSqlitePublishedStore({ path })
    await firstStore.init()
    await secondStore.init()
    await firstStore.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 1,
      latestSyncId: 'sync_1',
      lastKnownRemotePublishVersion: 1,
      exposure: exposurePublication(1),
      resources: [
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
      ],
      missingResources: []
    })
    let releaseFirstLatest: (() => void) | undefined
    let markFirstLatestRequested: (() => void) | undefined
    const firstLatestRequested = new Promise<void>((resolve) => {
      markFirstLatestRequested = resolve
    })
    const firstLatestGate = new Promise<void>((resolve) => {
      releaseFirstLatest = resolve
    })
    const firstClient = {
      getLatestPublishState: jest
        .fn()
        .mockImplementationOnce(async () => {
          markFirstLatestRequested?.()
          await firstLatestGate
          return {
            site_id: 'brand-us',
            latest_publish_version: 1,
            latest_sync_id: 'sync_1',
            has_updates: false
          }
        })
        .mockResolvedValue({
          site_id: 'brand-us',
          latest_publish_version: 2,
          latest_sync_id: 'sync_2',
          has_updates: false
        }),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }
    const secondClient = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 2,
        latest_sync_id: 'sync_2',
        has_updates: true
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 1,
        to_publish_version: 2,
        requires_snapshot: false,
        changed_resources: [
          {
            resource_type: 'product',
            resource_id: 'product_1',
            locale: 'en-US',
            latest_publish_version: 2
          }
        ]
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [publicViewPayload('product_1', 2)],
        missing_resources: [],
        server_publish_version: 2,
        exposure_publication: exposurePublication(2)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }
    const firstEngine = new SyncEngine({ siteId: 'brand-us', store: firstStore, client: firstClient })
    const secondEngine = new SyncEngine({ siteId: 'brand-us', store: secondStore, client: secondClient })

    const staleObservation = firstEngine.syncToLatest('pull')
    await firstLatestRequested
    await expect(secondEngine.syncToLatest('pull')).resolves.toMatchObject({
      status: 'completed',
      localPublishVersion: 2
    })
    releaseFirstLatest?.()
    await expect(staleObservation).resolves.toMatchObject({ localPublishVersion: 2 })

    expect(firstClient.getLatestPublishState).toHaveBeenCalledTimes(2)
    await expect(firstStore.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      latestSyncId: 'sync_2'
    })
    await expect(firstStore.getSiteExposurePublication('brand-us')).resolves.toMatchObject({
      publishVersion: 2
    })
    await expect(
      firstStore.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_1',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({ publishVersion: 2, slug: 'product_1' })
    await firstStore.close()
    await secondStore.close()
  })

  it('rejects a snapshot publishVersion that races past the selected latest target', async () => {
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
        snapshot_publish_version: 3,
        public_views: [],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('startup')
    ).rejects.toThrow(/PUBLISH_VERSION_MISMATCH/)
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 0 })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toBeNull()
    await store.close()
  })

  it.each([
    ['missing', undefined],
    ['non-array', { resource: 'not-an-array' }],
    ['malformed member', [{}]]
  ])('rejects %s snapshot public_views and preserves the old publication', async (_label, publicViews) => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const snapshot: Record<string, unknown> = {
      site_id: 'brand-us',
      snapshot_publish_version: 3,
      next_page_token: null,
      is_complete: true,
      exposure_publication: exposurePublication(3)
    }
    if (publicViews !== undefined) {
      snapshot.public_views = publicViews
    }
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot: jest.fn(async () => snapshot),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/snapshot public_views/i)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('preserves the committed publication when the signed delta returns a non-boolean requires_snapshot', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            site_id: 'brand-us',
            latest_publish_version: 3,
            latest_sync_id: 'sync_3',
            has_updates: true,
            server_time: '2026-06-15T01:00:00.000Z'
          }),
          { headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            site_id: 'brand-us',
            from_publish_version: 2,
            to_publish_version: 3,
            requires_snapshot: 'true',
            changed_resources: []
          }),
          { headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accepted: true,
            server_time: '2026-06-15T01:00:00.000Z'
          }),
          { headers: { 'content-type': 'application/json' } }
        )
      )
    const client = new SignedOesClient({
      credential: {
        siteId: 'brand-us',
        clientId: 'client_123',
        credentialId: 'credential_123',
        clientSecret: 'client_secret',
        webhookSigningSecret: 'webhook_secret',
        oesBaseUrl: 'https://oes.example.test/site-api',
        environment: 'test'
      },
      fetch: fetchMock
    })

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/requires_snapshot.*boolean/i)
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'https://oes.example.test/site-api/sync/latest',
      'https://oes.example.test/site-api/sync/changed-resources',
      'https://oes.example.test/site-api/sync/report-result'
    ])
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it.each([
    ['missing', undefined],
    ['non-array', { resource: 'not-an-array' }],
    ['malformed member', [{}]]
  ])('rejects %s delta changed_resources and preserves the old publication', async (_label, changedResources) => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const delta: Record<string, unknown> = {
      site_id: 'brand-us',
      from_publish_version: 2,
      to_publish_version: 3,
      requires_snapshot: false
    }
    if (changedResources !== undefined) {
      delta.changed_resources = changedResources
    }
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      listChangedResources: jest.fn(async () => delta),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [],
        missing_resources: [],
        server_publish_version: 3,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/changed_resources/i)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it.each([
    ['public_views', { public_views: {}, missing_resources: [] }],
    ['missing_resources', { public_views: [], missing_resources: {} }],
    ['missing public_views', { missing_resources: [] }],
    ['missing missing_resources', { public_views: [] }],
    ['malformed public_views member', { public_views: [{}], missing_resources: [] }],
    [
      'malformed missing_resources member',
      { public_views: [publicViewPayload('product_1', 3)], missing_resources: [{}] }
    ]
  ])('rejects malformed batch %s and preserves the old publication', async (_label, arrays) => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 2,
        to_publish_version: 3,
        requires_snapshot: false,
        changed_resources: [
          {
            resource_type: 'product',
            resource_id: 'product_1',
            locale: 'en-US',
            latest_publish_version: 3
          }
        ]
      })),
      batchGetPublicViews: jest.fn(async () => ({
        ...arrays,
        server_publish_version: 3,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client: client as unknown as SyncEngineClient
      }).syncToLatest('pull')
    ).rejects.toThrow(/batch (public_views|missing_resources)/i)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('rejects malformed exposure before the transaction and preserves the old publication', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 2,
        to_publish_version: 3,
        requires_snapshot: false,
        changed_resources: []
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [],
        missing_resources: [],
        server_publish_version: 3,
        exposure_publication: {
          ...exposurePublication(3),
          pages: [
            {
              pageKey: 'PRODUCT_DETAIL',
              enabled: 'true',
              indexable: true,
              supportedLocales: ['en-US']
            }
          ]
        }
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client: client as unknown as SyncEngineClient
      }).syncToLatest('pull')
    ).rejects.toThrow(/enabled must be boolean/i)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it.each([
    ['complete page with token', true, 'unexpected-next'],
    ['incomplete page without token', false, null]
  ])('rejects snapshot pagination contradiction: %s', async (_label, isComplete, nextPageToken) => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [],
        next_page_token: nextPageToken,
        is_complete: isComplete,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/SNAPSHOT_PAGINATION_INVALID/)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('rejects a repeated snapshot page token without fetching a third page', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const getSnapshot = jest
      .fn()
      .mockResolvedValueOnce({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [],
        next_page_token: 'repeated-token',
        is_complete: false,
        exposure_publication: exposurePublication(3)
      })
      .mockResolvedValueOnce({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [],
        next_page_token: 'repeated-token',
        is_complete: false,
        exposure_publication: exposurePublication(3)
      })
      .mockRejectedValueOnce(new Error('test guard: a cyclic token caused a third request'))
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot,
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/SNAPSHOT_PAGINATION_INVALID.*repeated/i)
    expect(getSnapshot).toHaveBeenCalledTimes(2)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('fails closed before fetching a snapshot page beyond the configured page budget', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const getSnapshot = jest
      .fn()
      .mockResolvedValueOnce({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [],
        next_page_token: 'page-2',
        is_complete: false,
        exposure_publication: exposurePublication(3)
      })
      .mockResolvedValueOnce({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [],
        next_page_token: 'page-3',
        is_complete: false,
        exposure_publication: exposurePublication(3)
      })
      .mockResolvedValueOnce({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(3)
      })
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot,
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client,
        limits: { maxSnapshotPages: 2 }
      }).syncToLatest('pull')
    ).rejects.toThrow(/SNAPSHOT_LIMIT_EXCEEDED.*pages/i)
    expect(getSnapshot).toHaveBeenCalledTimes(2)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('rejects a snapshot page token that exceeds the configured length budget', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const getSnapshot = jest.fn(async () => ({
      site_id: 'brand-us',
      snapshot_publish_version: 3,
      public_views: [],
      next_page_token: 'token-too-long',
      is_complete: false,
      exposure_publication: exposurePublication(3)
    }))
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot,
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client,
        limits: { maxPageTokenLength: 8 }
      }).syncToLatest('pull')
    ).rejects.toThrow(/SNAPSHOT_LIMIT_EXCEEDED.*token/i)
    expect(getSnapshot).toHaveBeenCalledTimes(1)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('rejects a snapshot whose resource count exceeds the configured total budget', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [
          publicViewPayload('product_1', 3),
          publicViewPayload('product_2', 3)
        ],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client,
        limits: { maxSnapshotResources: 1 }
      }).syncToLatest('pull')
    ).rejects.toThrow(/SNAPSHOT_LIMIT_EXCEEDED.*resources/i)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('rejects an oversized public view payload before committing the target snapshot', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const oversized = {
      ...publicViewPayload('product_1', 3),
      payload: { display_title: 'x'.repeat(256) }
    }
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [oversized],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client,
        limits: { maxResourcePayloadBytes: 64 }
      }).syncToLatest('pull')
    ).rejects.toThrow(/PUBLICATION_LIMIT_EXCEEDED.*payload/i)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('counts the complete stored resource envelope toward the aggregate publication budget', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [publicViewPayload('product_1', 3)],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({
        accepted: true,
        server_time: '2026-06-15T00:00:00.000Z'
      }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client,
        limits: {
          maxResourcePayloadBytes: 1_024,
          maxPublicationPayloadBytes: 64
        }
      }).syncToLatest('pull')
    ).rejects.toThrow(/PUBLICATION_LIMIT_EXCEEDED.*aggregate/i)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('fetches a large delta in bounded batches and commits all validated batches once', async () => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const commitPublication = jest.spyOn(store, 'commitPublication')
    commitPublication.mockClear()
    const changed = Array.from({ length: 5 }, (_value, index) => ({
      resource_type: 'product' as const,
      resource_id: `product_${index + 1}`,
      locale: 'en-US',
      latest_publish_version: 3
    }))
    const batchGetPublicViews = jest.fn(async (resources: ChangedResourceRef[]) => ({
      public_views: resources.map((resource) =>
        publicViewPayload(resource.resource_id, 3, resource.locale)
      ),
      missing_resources: [],
      server_publish_version: 3,
      exposure_publication: exposurePublication(3)
    }))
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 2,
        to_publish_version: 3,
        requires_snapshot: false,
        changed_resources: changed
      })),
      batchGetPublicViews,
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client,
        limits: { deltaBatchSize: 2, maxDeltaResources: 10 }
      }).syncToLatest('pull')
    ).resolves.toMatchObject({ status: 'completed', localPublishVersion: 3 })

    expect(batchGetPublicViews.mock.calls.map(([resources]) => resources.length)).toEqual([2, 2, 1])
    expect(commitPublication).toHaveBeenCalledTimes(1)
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 3 })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({ publishVersion: 3 })
    await store.close()
  })

  it('hydrates exposure atomically for a legacy database already at the latest publishVersion', async () => {
    const store = createStore()
    await store.init()
    await store.replaceSnapshot({
      siteId: 'brand-us',
      publishVersion: 3,
      resources: [
        {
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          slug: 'legacy-basin',
          locale: 'en-US',
          status: 'published',
          publishVersion: 3,
          payloadJson: JSON.stringify({ display_title: 'Legacy Basin' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ]
    })
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3',
        has_updates: false,
        server_time: '2026-06-15T00:00:00.000Z'
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 3,
        public_views: [
          {
            site_id: 'brand-us',
            resource_type: 'product',
            resource_id: 'product_1',
            slug: 'legacy-basin',
            locale: 'en-US',
            status: 'published',
            publish_version: 3,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: { display_title: 'Legacy Basin' }
          }
        ],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('startup')
    ).resolves.toMatchObject({ status: 'completed', localPublishVersion: 3 })

    expect(client.getSnapshot).toHaveBeenCalled()
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({
      publishVersion: 3,
      defaultLocale: 'en-US'
    })
    await expect(new PublicViewsReader(store, 'brand-us').products.getBySlug('legacy-basin', 'en-US')).resolves.toMatchObject({
      payload: { display_title: 'Legacy Basin' }
    })
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
      {
        resource_type: 'product',
        resource_id: 'product_1',
        locale: 'en-US',
        latest_publish_version: 3
      }
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
        server_publish_version: 3,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
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
      changed_resources: [{ ...changed[0]!, latest_publish_version: 4 }]
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

  it('atomically switches exposure and changed views while deleting missing published resources', async () => {
    const store = createStore()
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2,
      exposure: {
        siteId: 'brand-us',
        publishVersion: 2,
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
      },
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
        },
        {
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_2',
          slug: 'stale-product',
          locale: 'zh-CN',
          status: 'published',
          publishVersion: 2,
          payloadJson: JSON.stringify({ display_title: 'Stale Product' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ],
      missingResources: []
    })
    const changed: ChangedResourceRef[] = [
      {
        resource_type: 'product',
        resource_id: 'product_1',
        locale: 'en-US',
        latest_publish_version: 3
      },
      {
        resource_type: 'product',
        resource_id: 'product_2',
        locale: 'zh-CN',
        latest_publish_version: 3
      }
    ]
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3',
        has_updates: true,
        server_time: '2026-06-15T01:00:00.000Z'
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
        missing_resources: [changed[1]!],
        server_publish_version: 3,
        exposure_publication: {
          siteId: 'brand-us',
          publishVersion: 3,
          defaultLocale: 'en-US',
          activeLocales: ['en-US'],
          pages: [
            {
              pageKey: 'PRODUCT_DETAIL',
              enabled: false,
              indexable: false,
              supportedLocales: ['en-US', 'zh-CN']
            }
          ],
          publishedAt: '2026-06-15T01:00:00.000Z'
        }
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')

    const views = new PublicViewsReader(store, 'brand-us')
    await expect(views.products.getBySlug('basin', 'en-US')).resolves.toMatchObject({
      publishVersion: 3,
      payload: { display_title: 'New Basin' }
    })
    await expect(views.products.getBySlug('stale-product', 'zh-CN')).resolves.toBeNull()
    await expect(views.exposure.getPublication()).resolves.toMatchObject({
      publishVersion: 3,
      activeLocales: ['en-US'],
      pages: [expect.objectContaining({ pageKey: 'PRODUCT_DETAIL', enabled: false })]
    })
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 3,
      latestSyncId: 'sync_3'
    })
    await store.close()
  })

  it('treats the site-exposure delta marker as a pull signal rather than a business resource', async () => {
    const store = createStore()
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 1,
      latestSyncId: 'sync_1',
      lastKnownRemotePublishVersion: 1,
      exposure: exposurePublication(1),
      resources: [],
      missingResources: []
    })
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 2,
        latest_sync_id: 'sync_2',
        has_updates: true,
        server_time: '2026-06-15T01:00:00.000Z'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 1,
        to_publish_version: 2,
        requires_snapshot: false,
        changed_resources: [
          {
            resource_type: 'site-exposure',
            resource_id: 'brand-us',
            locale: '',
            latest_publish_version: 2,
            change_type: 'update'
          }
        ]
      })),
      batchGetPublicViews: jest.fn(async (resources: ChangedResourceRef[]) => ({
        public_views: [],
        missing_resources: resources,
        server_publish_version: 2,
        exposure_publication: {
          ...exposurePublication(2),
          activeLocales: ['en-US', 'zh-CN']
        }
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).resolves.toMatchObject({ status: 'completed', localPublishVersion: 2 })

    expect(client.batchGetPublicViews).toHaveBeenCalledWith([], 2)
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({
      publishVersion: 2,
      activeLocales: ['en-US', 'zh-CN']
    })
    await store.close()
  })

  it('rejects an incomplete batch resource set instead of preserving stale published data', async () => {
    const store = createStore()
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2,
      exposure: exposurePublication(2),
      resources: [
        {
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          slug: 'stale-basin',
          locale: 'en-US',
          status: 'published',
          publishVersion: 2,
          payloadJson: JSON.stringify({ display_title: 'Stale Basin' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ],
      missingResources: []
    })
    const changed: ChangedResourceRef[] = [
      {
        resource_type: 'product',
        resource_id: 'product_1',
        locale: 'en-US',
        latest_publish_version: 3
      }
    ]
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3',
        has_updates: true,
        server_time: '2026-06-15T01:00:00.000Z'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 2,
        to_publish_version: 3,
        requires_snapshot: false,
        changed_resources: changed
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [],
        missing_resources: [],
        server_publish_version: 3,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/BATCH_RESOURCE_SET_MISMATCH/)

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 2 })
    await expect(new PublicViewsReader(store, 'brand-us').products.getBySlug('stale-basin', 'en-US')).resolves.toMatchObject({
      payload: { display_title: 'Stale Basin' }
    })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({ publishVersion: 2 })
    await store.close()
  })

  it.each([
    [
      'duplicate public view identity',
      [publicViewPayload('product_1', 3), publicViewPayload('product_1', 3)],
      []
    ],
    [
      'duplicate missing resource identity',
      [],
      [
        { resource_type: 'product', resource_id: 'product_1', locale: 'en-US' },
        { resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }
      ]
    ],
    [
      'overlap between public and missing identities',
      [publicViewPayload('product_1', 3)],
      [{ resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }]
    ],
    [
      'unrequested public view',
      [publicViewPayload('product_2', 3)],
      [{ resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }]
    ],
    [
      'unrequested missing resource',
      [publicViewPayload('product_1', 3)],
      [{ resource_type: 'product', resource_id: 'product_2', locale: 'en-US' }]
    ]
  ])('rejects batch collection mismatch: %s', async (_label, publicViews, missingResources) => {
    const store = createStore()
    await store.init()
    await seedCommittedPublication(store)
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 2,
        to_publish_version: 3,
        requires_snapshot: false,
        changed_resources: [
          {
            resource_type: 'product',
            resource_id: 'product_1',
            locale: 'en-US',
            latest_publish_version: 3
          }
        ]
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: publicViews,
        missing_resources: missingResources,
        server_publish_version: 3,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({
        siteId: 'brand-us',
        store,
        client: client as unknown as SyncEngineClient
      }).syncToLatest('pull')
    ).rejects.toThrow(/BATCH_RESOURCE_SET_MISMATCH/)
    await expectCommittedPublicationUnchanged(store)
    await store.close()
  })

  it('rejects a public view older than the changed ref latest publishVersion', async () => {
    const store = createStore()
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2,
      exposure: exposurePublication(2),
      resources: [],
      missingResources: []
    })
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 3,
        latest_sync_id: 'sync_3',
        has_updates: true,
        server_time: '2026-06-15T01:00:00.000Z'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 2,
        to_publish_version: 3,
        requires_snapshot: false,
        changed_resources: [
          {
            resource_type: 'product',
            resource_id: 'product_1',
            locale: 'en-US',
            latest_publish_version: 3,
            change_type: 'update'
          }
        ]
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [
          {
            site_id: 'brand-us',
            resource_type: 'product',
            resource_id: 'product_1',
            slug: 'stale-basin',
            locale: 'en-US',
            status: 'published',
            publish_version: 2,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: { display_title: 'Stale Basin' }
          }
        ],
        missing_resources: [],
        server_publish_version: 3,
        exposure_publication: exposurePublication(3)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/PUBLISH_VERSION_MISMATCH/)
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 2 })
    await store.close()
  })

  it('fails closed on a delta target version race and preserves the old committed publication', async () => {
    const store = createStore()
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 3,
      latestSyncId: 'sync_3',
      lastKnownRemotePublishVersion: 3,
      exposure: {
        siteId: 'brand-us',
        publishVersion: 3,
        defaultLocale: 'en-US',
        activeLocales: ['en-US'],
        pages: [],
        publishedAt: '2026-06-15T00:00:00.000Z'
      },
      resources: [],
      missingResources: []
    })
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 4,
        latest_sync_id: 'sync_4',
        has_updates: true,
        server_time: '2026-06-15T01:00:00.000Z'
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 3,
        to_publish_version: 4,
        requires_snapshot: false,
        changed_resources: []
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [],
        missing_resources: [],
        server_publish_version: 5,
        exposure_publication: {
          siteId: 'brand-us',
          publishVersion: 5,
          defaultLocale: 'zh-CN',
          activeLocales: ['zh-CN'],
          pages: [],
          publishedAt: '2026-06-15T01:00:00.000Z'
        }
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/PUBLISH_VERSION_MISMATCH/)

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 3 })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({
      publishVersion: 3,
      defaultLocale: 'en-US'
    })
    expect(client.batchGetPublicViews).toHaveBeenCalledWith([], 4)
    await store.close()
  })

  it('fails closed on a malformed latest publishVersion without rewriting local diagnostics', async () => {
    const store = createStore()
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2,
      exposure: exposurePublication(2),
      resources: [],
      missingResources: []
    })
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: -1,
        latest_sync_id: 'invalid',
        has_updates: false,
        server_time: '2026-06-15T01:00:00.000Z'
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    await expect(
      new SyncEngine({ siteId: 'brand-us', store, client }).syncToLatest('pull')
    ).rejects.toThrow(/PUBLISH_VERSION_MISMATCH/)
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      lastKnownRemotePublishVersion: 2
    })
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
        is_complete: true,
        exposure_publication: exposurePublication(1)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }
    const sync = new SyncEngine({ siteId: 'brand-us', store, client })

    const running = sync.syncToLatest('webhook')
    await expect(sync.syncToLatest('pull')).resolves.toMatchObject({ status: 'queued' })
    releaseRemote?.()
    await running

    expect(client.getLatestPublishState).toHaveBeenCalledTimes(3)
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
        is_complete: true,
        exposure_publication: exposurePublication(5)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
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

  it('syncs article-category public views from snapshot and changed resource deltas', async () => {
    const store = createStore()
    await store.init()
    const client = {
      getLatestPublishState: jest.fn(async () => ({
        site_id: 'brand-us',
        latest_publish_version: 8,
        latest_sync_id: 'sync_8',
        has_updates: true,
        server_time: '2026-06-15T00:00:00.000Z'
      })),
      getSnapshot: jest.fn(async () => ({
        site_id: 'brand-us',
        snapshot_publish_version: 8,
        public_views: [
          {
            site_id: 'brand-us',
            resource_type: 'article-category',
            resource_id: 'content_category_specification',
            slug: 'specification',
            locale: 'en-US',
            status: 'published',
            publish_version: 8,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: {
              content_category_id: 'content_category_specification',
              display_name: 'Specification',
              sort_order: 10,
              historical_slugs: ['spec']
            }
          },
          {
            site_id: 'brand-us',
            resource_type: 'blog',
            resource_id: 'article_specification',
            slug: 'specification-article',
            locale: 'en-US',
            status: 'published',
            publish_version: 8,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: {
              content_id: 'article_specification',
              title: 'Specification article',
              category_ids: ['content_category_specification']
            }
          }
        ],
        next_page_token: null,
        is_complete: true,
        exposure_publication: exposurePublication(8)
      })),
      listChangedResources: jest.fn(async () => ({
        site_id: 'brand-us',
        from_publish_version: 8,
        to_publish_version: 9,
        requires_snapshot: false,
        changed_resources: [
          {
            resource_type: 'article-category',
            resource_id: 'content_category_specification',
            locale: 'en-US',
            latest_publish_version: 9
          }
        ]
      })),
      batchGetPublicViews: jest.fn(async () => ({
        public_views: [
          {
            site_id: 'brand-us',
            resource_type: 'article-category',
            resource_id: 'content_category_specification',
            slug: 'specification-guide',
            locale: 'en-US',
            status: 'published',
            publish_version: 9,
            updated_at: '2026-06-15T01:00:00.000Z',
            payload: {
              content_category_id: 'content_category_specification',
              display_name: 'Specification Guide',
              sort_order: 10,
              historical_slugs: ['spec', 'specification']
            }
          }
        ],
        missing_resources: [],
        server_publish_version: 9,
        exposure_publication: exposurePublication(9)
      })),
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
    }

    const sync = new SyncEngine({ siteId: 'brand-us', store, client })
    await sync.syncToLatest('manual')
    await expect(
      new PublicViewsReader(store, 'brand-us').articleCategories.getBySlug('specification', 'en-US')
    ).resolves.toMatchObject({
      payload: expect.objectContaining({ display_name: 'Specification' })
    })
    await expect(
      new PublicViewsReader(store, 'brand-us').historicalAliases.resolve({
        namespace: 'article-category',
        locale: 'en-US',
        slug: 'spec'
      })
    ).resolves.toMatchObject({
      resourceId: 'content_category_specification',
      canonicalSlug: 'specification'
    })

    client.getLatestPublishState.mockResolvedValueOnce({
      site_id: 'brand-us',
      latest_publish_version: 9,
      latest_sync_id: 'sync_9',
      has_updates: true,
      server_time: '2026-06-15T01:00:00.000Z'
    })
    await sync.syncToLatest('pull')

    await expect(
      new PublicViewsReader(store, 'brand-us').articleCategories.getBySlug('specification-guide', 'en-US')
    ).resolves.toMatchObject({
      payload: expect.objectContaining({
        display_name: 'Specification Guide',
        historical_slugs: ['spec', 'specification']
      })
    })
    await expect(
      new PublicViewsReader(store, 'brand-us').articleCategories.getBySlug('specification', 'en-US')
    ).resolves.toBeNull()
    for (const slug of ['spec', 'specification']) {
      await expect(
        new PublicViewsReader(store, 'brand-us').historicalAliases.resolve({
          namespace: 'article-category',
          locale: 'en-US',
          slug
        })
      ).resolves.toMatchObject({
        resourceId: 'content_category_specification',
        canonicalSlug: 'specification-guide'
      })
    }
    expect(client.batchGetPublicViews).toHaveBeenCalledWith([
      { resource_type: 'article-category', resource_id: 'content_category_specification', locale: 'en-US' }
    ], 9)
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
      reportSyncResult: jest.fn(async () => ({ accepted: true, server_time: '2026-06-15T00:00:00.000Z' }))
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
