import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  NodeSqlitePublishedStore,
  type SiteExposurePublication,
  type StoredPublishedResource
} from '../../src'

// exposurePublication supplies one valid publication for store transaction tests.
function exposurePublication(publishVersion: number): SiteExposurePublication {
  return {
    siteId: 'brand-us',
    publishVersion,
    defaultLocale: 'en-US',
    activeLocales: ['en-US'],
    pages: [],
    publishedAt: '2026-06-15T00:00:00.000Z'
  }
}

// productResource supplies one stored product identity with a selectable final slug.
function productResource(resourceId: string, slug: string, publishVersion: number): StoredPublishedResource {
  return {
    siteId: 'brand-us',
    resourceType: 'product',
    resourceId,
    slug,
    locale: 'en-US',
    status: 'published',
    publishVersion,
    payloadJson: JSON.stringify({ display_title: resourceId }),
    updatedAt: '2026-06-15T00:00:00.000Z'
  }
}

// dynamicResource supplies one P1 dynamic resource with canonical and historical slug state.
function dynamicResource(
  resourceType: 'blog' | 'news' | 'article-category' | 'product',
  resourceId: string,
  slug: string,
  historicalSlugs: string[],
  publishVersion: number,
  status: StoredPublishedResource['status'] = 'published',
  locale = 'en-US'
): StoredPublishedResource {
  return {
    siteId: 'brand-us',
    resourceType,
    resourceId,
    slug,
    locale,
    status,
    publishVersion,
    payloadJson: JSON.stringify({ historical_slugs: historicalSlugs }),
    updatedAt: '2026-06-15T00:00:00.000Z'
  }
}

// seedSlugPublication commits the two-row baseline used by slug transition tests.
async function seedSlugPublication(store: NodeSqlitePublishedStore): Promise<void> {
  await store.commitPublication({
    mode: 'snapshot',
    siteId: 'brand-us',
    expectedLocalPublishVersion: 0,
    publishVersion: 1,
    latestSyncId: 'sync_1',
    lastKnownRemotePublishVersion: 1,
    exposure: exposurePublication(1),
    resources: [
      productResource('product_a', 'alpha', 1),
      productResource('product_b', 'beta', 1)
    ],
    missingResources: []
  })
}

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

  it('observes a remote version only when the local publish version still matches the CAS expectation', async () => {
    const store = createStore()
    await store.init()
    await store.updatePublishState({
      siteId: 'brand-us',
      localPublishVersion: 2,
      latestSyncId: 'sync_2',
      lastSuccessfulSyncAt: '2026-06-15T00:00:00.000Z',
      lastKnownRemotePublishVersion: 2
    })

    await expect(
      store.observeRemotePublishVersion({
        siteId: 'brand-us',
        expectedLocalPublishVersion: 1,
        remotePublishVersion: 1
      })
    ).resolves.toBe(false)
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2
    })

    await expect(
      store.observeRemotePublishVersion({
        siteId: 'brand-us',
        expectedLocalPublishVersion: 2,
        remotePublishVersion: 3
      })
    ).resolves.toBe(true)
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 3
    })
    await store.close()
  })

  it('takes over an expired persisted registration claim after reopening the SQLite store', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-claim-lease-')), 'runtime.sqlite')
    const firstStore = new NodeSqlitePublishedStore({ path })
    await firstStore.init()
    await expect(
      firstStore.claimCapabilityRegistration({
        siteId: 'brand-us',
        clientId: 'client_123',
        manifestHash: 'manifest-hash',
        proposedIdempotencyKey: 'registration-1',
        claimToken: 'claim-1',
        claimedAtMs: 1_000,
        leaseDurationMs: 100,
        updatedAt: '2026-06-15T00:00:00.000Z'
      })
    ).resolves.toMatchObject({ claimed: true, state: { generation: 1 } })
    await firstStore.close()

    const restartedStore = new NodeSqlitePublishedStore({ path })
    await restartedStore.init()
    await expect(
      restartedStore.claimCapabilityRegistration({
        siteId: 'brand-us',
        clientId: 'client_123',
        manifestHash: 'manifest-hash',
        proposedIdempotencyKey: 'registration-2',
        claimToken: 'claim-2',
        claimedAtMs: 1_101,
        leaseDurationMs: 100,
        updatedAt: '2026-06-15T00:00:01.000Z'
      })
    ).resolves.toMatchObject({
      claimed: true,
      state: {
        generation: 2,
        claimToken: 'claim-2',
        idempotencyKey: 'registration-1'
      }
    })
    await restartedStore.close()
  })

  it('persists remote registration generation separately from the local claim generation', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-remote-generation-')), 'runtime.sqlite')
    const store = new NodeSqlitePublishedStore({ path })
    await store.init()
    const claim = await store.claimCapabilityRegistration({
      siteId: 'brand-us',
      clientId: 'client_123',
      manifestHash: 'manifest-hash',
      proposedIdempotencyKey: 'registration-1',
      claimToken: 'claim-1',
      claimedAtMs: 1_000,
      leaseDurationMs: 100,
      updatedAt: '2026-06-15T00:00:00.000Z'
    })
    expect(claim.state).toMatchObject({
      generation: 1,
      remoteRegistrationGeneration: '0',
      expectedRegistrationGeneration: '0',
      idempotencyKeyTerminal: false
    })
    await expect(
      store.completeCapabilityRegistrationClaim({
        siteId: 'brand-us',
        clientId: 'client_123',
        manifestHash: 'manifest-hash',
        generation: 1,
        claimToken: 'claim-1',
        responseJson: JSON.stringify({ accepted: true, registration_generation: '18446744073709551615' }),
        remoteRegistrationGeneration: '18446744073709551615',
        idempotencyKeyTerminal: false,
        updatedAt: '2026-06-15T00:00:01.000Z'
      })
    ).resolves.toBe(true)
    await store.close()

    const restartedStore = new NodeSqlitePublishedStore({ path })
    await restartedStore.init()
    await expect(
      restartedStore.getCapabilityRegistrationState('brand-us', 'client_123')
    ).resolves.toMatchObject({
      generation: 1,
      remoteRegistrationGeneration: '18446744073709551615',
      expectedRegistrationGeneration: '0',
      idempotencyKeyTerminal: false,
      responseJson: expect.stringContaining('18446744073709551615')
    })
    await restartedStore.close()
  })

  it('additively migrates legacy registration rows with remote generation zero', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-generation-migration-')), 'runtime.sqlite')
    const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')
    const legacyDatabase = new DatabaseSync(path)
    legacyDatabase.exec(`
      CREATE TABLE capability_registration_state (
        site_id TEXT PRIMARY KEY,
        manifest_hash TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        response_json TEXT,
        claim_generation INTEGER NOT NULL DEFAULT 0,
        claim_token TEXT,
        claim_expires_at_ms INTEGER,
        updated_at TEXT NOT NULL
      );
      INSERT INTO capability_registration_state (
        site_id, manifest_hash, idempotency_key, response_json,
        claim_generation, claim_token, claim_expires_at_ms, updated_at
      ) VALUES (
        'brand-us', 'manifest-hash', 'registration-legacy', NULL,
        1, NULL, NULL, '2026-06-15T00:00:00.000Z'
      );
    `)
    legacyDatabase.close()

    const store = new NodeSqlitePublishedStore({ path })
    await store.init()

    await expect(store.getCapabilityRegistrationState('brand-us', '')).resolves.toMatchObject({
      clientId: '',
      remoteRegistrationGeneration: '0',
      expectedRegistrationGeneration: '0',
      idempotencyKeyTerminal: false
    })
    await expect(
      store.getCapabilityRegistrationState('brand-us', 'client-current')
    ).resolves.toBeNull()
    await expect(
      store.claimCapabilityRegistration({
        siteId: 'brand-us',
        clientId: 'client-current',
        manifestHash: 'manifest-current',
        proposedIdempotencyKey: 'registration-current',
        claimToken: 'claim-current',
        claimedAtMs: 2_000,
        leaseDurationMs: 100,
        updatedAt: '2026-06-15T00:00:01.000Z'
      })
    ).resolves.toMatchObject({
      claimed: true,
      state: {
        clientId: 'client-current',
        remoteRegistrationGeneration: '0',
        expectedRegistrationGeneration: '0'
      }
    })
    await expect(store.getCapabilityRegistrationState('brand-us', '')).resolves.toMatchObject({
      idempotencyKey: 'registration-legacy'
    })
    await store.close()
  })

  it('isolates local claims and remote generations by site and client stream', async () => {
    const store = createStore()
    await store.init()
    const claimA = await store.claimCapabilityRegistration({
      siteId: 'brand-us',
      clientId: 'client-A',
      manifestHash: 'manifest-shared',
      proposedIdempotencyKey: 'registration-A',
      claimToken: 'claim-A',
      claimedAtMs: 1_000,
      leaseDurationMs: 100,
      updatedAt: '2026-06-15T00:00:00.000Z'
    })
    await store.completeCapabilityRegistrationClaim({
      siteId: 'brand-us',
      clientId: 'client-A',
      manifestHash: 'manifest-shared',
      generation: claimA.state.generation,
      claimToken: 'claim-A',
      responseJson: JSON.stringify({ accepted: true, registration_generation: '1' }),
      remoteRegistrationGeneration: '1',
      idempotencyKeyTerminal: false,
      updatedAt: '2026-06-15T00:00:01.000Z'
    })

    const claimB = await store.claimCapabilityRegistration({
      siteId: 'brand-us',
      clientId: 'client-B',
      manifestHash: 'manifest-shared',
      proposedIdempotencyKey: 'registration-B',
      claimToken: 'claim-B',
      claimedAtMs: 1_010,
      leaseDurationMs: 100,
      updatedAt: '2026-06-15T00:00:02.000Z'
    })

    expect(claimB).toMatchObject({
      claimed: true,
      state: {
        clientId: 'client-B',
        idempotencyKey: 'registration-B',
        generation: 1,
        remoteRegistrationGeneration: '0',
        expectedRegistrationGeneration: '0'
      }
    })
    await expect(
      store.getCapabilityRegistrationState('brand-us', 'client-A')
    ).resolves.toMatchObject({
      clientId: 'client-A',
      idempotencyKey: 'registration-A',
      remoteRegistrationGeneration: '1'
    })
    await expect(
      store.getCapabilityRegistrationState('brand-us', 'client-B')
    ).resolves.toMatchObject({
      clientId: 'client-B',
      idempotencyKey: 'registration-B',
      remoteRegistrationGeneration: '0'
    })
    await store.close()
  })

  it('rejects a malformed persisted remote registration generation instead of coercing it', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-generation-corrupt-')), 'runtime.sqlite')
    const store = new NodeSqlitePublishedStore({ path })
    await store.init()
    await store.saveCapabilityRegistrationState({
      siteId: 'brand-us',
      clientId: 'client_123',
      manifestHash: 'manifest-hash',
      idempotencyKey: 'registration-corrupt',
      responseJson: null,
      generation: 1,
      claimToken: null,
      claimExpiresAtMs: null,
      remoteRegistrationGeneration: '0',
      expectedRegistrationGeneration: '0',
      idempotencyKeyTerminal: false,
      updatedAt: '2026-06-15T00:00:00.000Z'
    })
    await store.close()
    const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')
    const database = new DatabaseSync(path)
    database
      .prepare(
        `UPDATE capability_registration_state
            SET remote_registration_generation = '18446744073709551616'
          WHERE site_id = 'brand-us'`
      )
      .run()
    database.close()

    const restartedStore = new NodeSqlitePublishedStore({ path })
    await restartedStore.init()
    await expect(
      restartedStore.getCapabilityRegistrationState('brand-us', 'client_123')
    ).rejects.toThrow(/remote registration generation/i)
    await restartedStore.close()
  })

  it('keeps a stale claim terminal for the same manifest but allows a new manifest claim', async () => {
    const store = createStore()
    await store.init()
    const firstClaim = await store.claimCapabilityRegistration({
      siteId: 'brand-us',
      clientId: 'client_123',
      manifestHash: 'manifest-hash',
      proposedIdempotencyKey: 'registration-1',
      claimToken: 'claim-1',
      claimedAtMs: 1_000,
      leaseDurationMs: 100,
      updatedAt: '2026-06-15T00:00:00.000Z'
    })
    await store.completeCapabilityRegistrationClaim({
      siteId: 'brand-us',
      clientId: 'client_123',
      manifestHash: 'manifest-hash',
      generation: firstClaim.state.generation,
      claimToken: 'claim-1',
      responseJson: JSON.stringify({ accepted: false, registration_generation: '3' }),
      remoteRegistrationGeneration: '3',
      idempotencyKeyTerminal: true,
      updatedAt: '2026-06-15T00:00:01.000Z'
    })

    const sameManifestClaim = store.claimCapabilityRegistration({
      siteId: 'brand-us',
      clientId: 'client_123',
      manifestHash: 'manifest-hash',
      proposedIdempotencyKey: 'registration-2',
      claimToken: 'claim-2',
      claimedAtMs: 1_101,
      leaseDurationMs: 100,
      updatedAt: '2026-06-15T00:00:02.000Z'
    })
    await expect(sameManifestClaim).resolves.toMatchObject({
      claimed: false,
      state: {
        generation: 1,
        idempotencyKey: 'registration-1',
        expectedRegistrationGeneration: '0',
        remoteRegistrationGeneration: '3',
        idempotencyKeyTerminal: true,
        responseJson: expect.stringContaining('"accepted":false')
      }
    })

    await expect(
      store.claimCapabilityRegistration({
        siteId: 'brand-us',
        clientId: 'client_123',
        manifestHash: 'new-manifest-hash',
        proposedIdempotencyKey: 'registration-3',
        claimToken: 'claim-3',
        claimedAtMs: 1_102,
        leaseDurationMs: 100,
        updatedAt: '2026-06-15T00:00:03.000Z'
      })
    ).resolves.toMatchObject({
      claimed: true,
      state: {
        generation: 2,
        manifestHash: 'new-manifest-hash',
        idempotencyKey: 'registration-3',
        expectedRegistrationGeneration: '3',
        remoteRegistrationGeneration: '3',
        idempotencyKeyTerminal: false,
        responseJson: null
      }
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

  it('commits exposure, public views, removals, and publish state in one version-checked transaction', async () => {
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
          payloadJson: JSON.stringify({ display_title: 'Basin' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ],
      missingResources: []
    })

    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({
      publishVersion: 2,
      defaultLocale: 'en-US',
      activeLocales: ['en-US', 'zh-CN']
    })
    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({
      localPublishVersion: 2,
      latestSyncId: 'sync_2'
    })

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 2,
      publishVersion: 3,
      latestSyncId: 'sync_3',
      lastKnownRemotePublishVersion: 3,
      exposure: {
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
      },
      resources: [],
      missingResources: [
        { resourceType: 'product', resourceId: 'product_1', locale: 'en-US' }
      ]
    })

    await expect(
      store.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_1',
        locale: 'en-US'
      })
    ).resolves.toBeNull()
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({
      publishVersion: 3,
      activeLocales: ['en-US'],
      pages: [expect.objectContaining({ pageKey: 'PRODUCT_DETAIL', enabled: false })]
    })
    await store.close()
  })

  it('atomically swaps slugs between two changed resource identities', async () => {
    const store = createStore()
    await store.init()
    await seedSlugPublication(store)

    await expect(
      store.commitPublication({
        mode: 'delta',
        siteId: 'brand-us',
        expectedLocalPublishVersion: 1,
        publishVersion: 2,
        latestSyncId: 'sync_2',
        lastKnownRemotePublishVersion: 2,
        exposure: exposurePublication(2),
        resources: [
          productResource('product_a', 'beta', 2),
          productResource('product_b', 'alpha', 2)
        ],
        missingResources: []
      })
    ).resolves.toBeUndefined()

    await expect(
      store.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_a',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({ slug: 'beta', publishVersion: 2 })
    await expect(
      store.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_b',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({ slug: 'alpha', publishVersion: 2 })
    await store.close()
  })

  it('atomically transfers a removed identity slug to one changed resource', async () => {
    const store = createStore()
    await store.init()
    await seedSlugPublication(store)

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 1,
      publishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2,
      exposure: exposurePublication(2),
      resources: [productResource('product_b', 'alpha', 2)],
      missingResources: [
        { resourceType: 'product', resourceId: 'product_a', locale: 'en-US' }
      ]
    })

    await expect(
      store.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_a',
        locale: 'en-US'
      })
    ).resolves.toBeNull()
    await expect(
      store.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_b',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({ slug: 'alpha', publishVersion: 2 })
    await store.close()
  })

  it('rejects a final duplicate slug and rolls back resources, exposure, and publish state', async () => {
    const store = createStore()
    await store.init()
    await seedSlugPublication(store)

    await expect(
      store.commitPublication({
        mode: 'delta',
        siteId: 'brand-us',
        expectedLocalPublishVersion: 1,
        publishVersion: 2,
        latestSyncId: 'sync_2',
        lastKnownRemotePublishVersion: 2,
        exposure: exposurePublication(2),
        resources: [
          productResource('product_a', 'duplicate', 2),
          productResource('product_b', 'duplicate', 2)
        ],
        missingResources: []
      })
    ).rejects.toThrow(/PUBLIC_SLUG_CONFLICT/)

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 1 })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({ publishVersion: 1 })
    await expect(
      store.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_a',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({ slug: 'alpha', publishVersion: 1 })
    await expect(
      store.getPublishedResource({
        siteId: 'brand-us',
        resourceType: 'product',
        resourceId: 'product_b',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({ slug: 'beta', publishVersion: 1 })
    await store.close()
  })

  it('rolls back the entire publication when the expected local version is stale', async () => {
    const store = createStore()
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 1,
      latestSyncId: 'sync_1',
      lastKnownRemotePublishVersion: 1,
      exposure: {
        siteId: 'brand-us',
        publishVersion: 1,
        defaultLocale: 'en-US',
        activeLocales: ['en-US'],
        pages: [],
        publishedAt: '2026-06-15T00:00:00.000Z'
      },
      resources: [],
      missingResources: []
    })

    await expect(
      store.commitPublication({
        mode: 'delta',
        siteId: 'brand-us',
        expectedLocalPublishVersion: 0,
        publishVersion: 2,
        latestSyncId: 'sync_2',
        lastKnownRemotePublishVersion: 2,
        exposure: {
          siteId: 'brand-us',
          publishVersion: 2,
          defaultLocale: 'zh-CN',
          activeLocales: ['zh-CN'],
          pages: [],
          publishedAt: '2026-06-15T01:00:00.000Z'
        },
        resources: [],
        missingResources: []
      })
    ).rejects.toThrow(/PUBLISH_VERSION_CONFLICT/)

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 1 })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({
      publishVersion: 1,
      defaultLocale: 'en-US'
    })
    await store.close()
  })

  it('builds a normalized snapshot alias index isolated by blog, news, and article-category namespace', async () => {
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
      resources: [
        dynamicResource('blog', 'article_1', 'current-blog', ['  ＯＬＤ-SLUG  '], 1),
        dynamicResource('news', 'article_2', 'current-news', ['old-slug'], 1),
        dynamicResource('article-category', 'category_1', 'current-category', ['old-slug'], 1),
        dynamicResource('product', 'product_1', 'current-product', ['old-product'], 1)
      ],
      missingResources: []
    })

    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'blog',
        locale: 'en-US',
        slug: 'old-slug'
      })
    ).resolves.toEqual({
      resourceType: 'blog',
      resourceId: 'article_1',
      locale: 'en-US',
      canonicalSlug: 'current-blog'
    })
    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'news',
        locale: 'en-US',
        slug: 'OLD-SLUG'
      })
    ).resolves.toEqual(expect.objectContaining({ resourceId: 'article_2', canonicalSlug: 'current-news' }))
    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'article-category',
        locale: 'en-US',
        slug: 'old-slug'
      })
    ).resolves.toEqual(
      expect.objectContaining({ resourceId: 'category_1', canonicalSlug: 'current-category' })
    )
    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'blog',
        locale: 'en-US',
        slug: 'old-product'
      })
    ).resolves.toBeNull()
    await store.close()
  })

  it('backfills the alias index from committed local resources when an existing database gains the table', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-alias-migration-')), 'runtime.sqlite')
    const store = new NodeSqlitePublishedStore({ path })
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 0,
      publishVersion: 1,
      latestSyncId: 'sync_1',
      lastKnownRemotePublishVersion: 1,
      exposure: exposurePublication(1),
      resources: [dynamicResource('blog', 'article_1', 'current', ['old'], 1)],
      missingResources: []
    })
    await store.close()
    const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')
    const legacyDatabase = new DatabaseSync(path)
    legacyDatabase.exec('DROP TABLE historical_slug_aliases')
    legacyDatabase.close()

    const migratedStore = new NodeSqlitePublishedStore({ path })
    await migratedStore.init()
    await expect(
      migratedStore.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'blog',
        locale: 'en-US',
        slug: 'old'
      })
    ).resolves.toEqual(expect.objectContaining({ resourceId: 'article_1', canonicalSlug: 'current' }))
    await migratedStore.close()
  })

  it('keeps successive slug changes and a switch back to an old slug as direct single-hop aliases', async () => {
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
      resources: [dynamicResource('blog', 'article_1', 'alpha', [], 1)],
      missingResources: []
    })
    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 1,
      publishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2,
      exposure: exposurePublication(2),
      resources: [dynamicResource('blog', 'article_1', 'beta', ['alpha'], 2)],
      missingResources: []
    })
    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 2,
      publishVersion: 3,
      latestSyncId: 'sync_3',
      lastKnownRemotePublishVersion: 3,
      exposure: exposurePublication(3),
      resources: [dynamicResource('blog', 'article_1', 'gamma', ['alpha', 'beta'], 3)],
      missingResources: []
    })

    for (const slug of ['alpha', 'beta']) {
      await expect(
        store.resolveHistoricalAlias({
          siteId: 'brand-us',
          namespace: 'blog',
          locale: 'en-US',
          slug
        })
      ).resolves.toEqual(expect.objectContaining({ resourceId: 'article_1', canonicalSlug: 'gamma' }))
    }

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 3,
      publishVersion: 4,
      latestSyncId: 'sync_4',
      lastKnownRemotePublishVersion: 4,
      exposure: exposurePublication(4),
      resources: [dynamicResource('blog', 'article_1', 'alpha', ['alpha', 'beta', 'gamma'], 4)],
      missingResources: []
    })

    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'blog',
        locale: 'en-US',
        slug: 'alpha'
      })
    ).resolves.toBeNull()
    for (const slug of ['beta', 'gamma']) {
      await expect(
        store.resolveHistoricalAlias({
          siteId: 'brand-us',
          namespace: 'blog',
          locale: 'en-US',
          slug
        })
      ).resolves.toEqual(expect.objectContaining({ resourceId: 'article_1', canonicalSlug: 'alpha' }))
    }
    await store.close()
  })

  it('makes aliases unresolvable after missing, unpublish, delete, resource disable, or locale disablement', async () => {
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
      resources: [dynamicResource('news', 'article_1', 'current', ['old'], 1)],
      missingResources: []
    })
    const lookup = {
      siteId: 'brand-us',
      namespace: 'news' as const,
      locale: 'en-US',
      slug: 'old'
    }
    await expect(store.resolveHistoricalAlias(lookup)).resolves.toEqual(
      expect.objectContaining({ canonicalSlug: 'current' })
    )

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 1,
      publishVersion: 2,
      latestSyncId: 'sync_2',
      lastKnownRemotePublishVersion: 2,
      exposure: exposurePublication(2),
      resources: [dynamicResource('news', 'article_1', 'current', ['old'], 2, 'unpublished')],
      missingResources: []
    })
    await expect(store.resolveHistoricalAlias(lookup)).resolves.toBeNull()

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 2,
      publishVersion: 3,
      latestSyncId: 'sync_3',
      lastKnownRemotePublishVersion: 3,
      exposure: exposurePublication(3),
      resources: [dynamicResource('news', 'article_1', 'current', ['old'], 3)],
      missingResources: []
    })
    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 3,
      publishVersion: 4,
      latestSyncId: 'sync_4',
      lastKnownRemotePublishVersion: 4,
      exposure: exposurePublication(4),
      resources: [dynamicResource('news', 'article_1', 'current', ['old'], 4, 'deleted')],
      missingResources: []
    })
    await expect(store.resolveHistoricalAlias(lookup)).resolves.toBeNull()

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 4,
      publishVersion: 5,
      latestSyncId: 'sync_5',
      lastKnownRemotePublishVersion: 5,
      exposure: exposurePublication(5),
      resources: [dynamicResource('news', 'article_1', 'current', ['old'], 5)],
      missingResources: []
    })
    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 5,
      publishVersion: 6,
      latestSyncId: 'sync_6',
      lastKnownRemotePublishVersion: 6,
      exposure: exposurePublication(6),
      resources: [dynamicResource('news', 'article_1', 'current', ['old'], 6, 'disabled')],
      missingResources: []
    })
    await expect(store.resolveHistoricalAlias(lookup)).resolves.toBeNull()

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 6,
      publishVersion: 7,
      latestSyncId: 'sync_7',
      lastKnownRemotePublishVersion: 7,
      exposure: exposurePublication(7),
      resources: [dynamicResource('news', 'article_1', 'current', ['old'], 7)],
      missingResources: []
    })
    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 7,
      publishVersion: 8,
      latestSyncId: 'sync_8',
      lastKnownRemotePublishVersion: 8,
      exposure: {
        ...exposurePublication(8),
        defaultLocale: 'zh-CN',
        activeLocales: ['zh-CN']
      },
      resources: [],
      missingResources: []
    })
    await expect(store.resolveHistoricalAlias(lookup)).resolves.toBeNull()

    await store.commitPublication({
      mode: 'delta',
      siteId: 'brand-us',
      expectedLocalPublishVersion: 8,
      publishVersion: 9,
      latestSyncId: 'sync_9',
      lastKnownRemotePublishVersion: 9,
      exposure: exposurePublication(9),
      resources: [],
      missingResources: [
        { resourceType: 'news', resourceId: 'article_1', locale: 'en-US' }
      ]
    })
    await expect(store.resolveHistoricalAlias(lookup)).resolves.toBeNull()
    await store.close()
  })

  it('rolls back resources, state, exposure, and the complete alias index when alias rebuild fails', async () => {
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
      resources: [
        dynamicResource('blog', 'article_1', 'current', ['old'], 1),
        dynamicResource('blog', 'article_2', 'current-two', ['old-two'], 1)
      ],
      missingResources: []
    })

    await expect(
      store.commitPublication({
        mode: 'delta',
        siteId: 'brand-us',
        expectedLocalPublishVersion: 1,
        publishVersion: 2,
        latestSyncId: 'sync_2',
        lastKnownRemotePublishVersion: 2,
        exposure: exposurePublication(2),
        resources: [
          dynamicResource('blog', 'article_1', 'next-a', ['collision'], 2),
          dynamicResource('blog', 'article_2', 'next-b', ['ＣＯＬＬＩＳＩＯＮ'], 2)
        ],
        missingResources: []
      })
    ).rejects.toThrow(/SLUG_ALIAS_CONFLICT/)

    await expect(store.getPublishState('brand-us')).resolves.toMatchObject({ localPublishVersion: 1 })
    await expect(store.getSiteExposurePublication('brand-us')).resolves.toMatchObject({ publishVersion: 1 })
    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'blog',
        locale: 'en-US',
        slug: 'old'
      })
    ).resolves.toEqual(expect.objectContaining({ resourceId: 'article_1', canonicalSlug: 'current' }))
    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'blog',
        locale: 'en-US',
        slug: 'old-two'
      })
    ).resolves.toEqual(
      expect.objectContaining({ resourceId: 'article_2', canonicalSlug: 'current-two' })
    )
    await expect(
      store.resolveHistoricalAlias({
        siteId: 'brand-us',
        namespace: 'blog',
        locale: 'en-US',
        slug: 'collision'
      })
    ).resolves.toBeNull()
    await store.close()
  })
})
