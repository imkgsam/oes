import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('Prisma SitePage governance repositories L2', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
  })

  beforeEach(() => {
    prefix = createTestPrefix()
  })

  afterEach(async () => cleanupByPrefix(prisma, prefix))
  afterAll(async () => prisma?.$disconnect())

  it('persists idempotent complete discovery separately from page governance and recovers drift', async () => {
    const siteId = `${prefix}_site`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId: `${prefix}_tenant`,
      siteCode: `${prefix}_site`,
      siteName: 'Governed Site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })

    await expect(
      repository.registerPageCapabilities({
        siteId,
        clientId: `${prefix}_client`,
        idempotencyKey: 'deployment-1',
        expectedRegistrationGeneration: 0n,
        manifestHash: 'hash-1',
        capabilities: [{ pageKey: 'Product_Detail.V2', supportedLocales: ['en-US', 'zh-CN'] }],
        discoveredAt: new Date('2026-07-19T06:00:00.000Z')
      })
    ).resolves.toEqual(
      expect.objectContaining({ accepted: true, idempotentReplay: false, discoveredCount: 1 })
    )

    await repository.updateSitePageGovernance({
      siteId,
      pageKey: 'Product_Detail.V2',
      enabled: true,
      indexable: false
    })
    await repository.markSiteExposurePending({ siteId })

    await expect(
      repository.registerPageCapabilities({
        siteId,
        clientId: `${prefix}_client`,
        idempotencyKey: 'deployment-1',
        expectedRegistrationGeneration: 0n,
        manifestHash: 'hash-1',
        capabilities: [{ pageKey: 'Product_Detail.V2', supportedLocales: ['en-US', 'zh-CN'] }],
        discoveredAt: new Date('2026-07-19T06:05:00.000Z')
      })
    ).resolves.toEqual(expect.objectContaining({ idempotentReplay: true }))
    await expect(repository.listSitePages({ siteId })).resolves.toEqual([
      expect.objectContaining({
        pageKey: 'Product_Detail.V2',
        available: true,
        enabled: true,
        indexable: false,
        syncStatus: 'pending'
      })
    ])

    await expect(
      repository.registerPageCapabilities({
        siteId,
        clientId: `${prefix}_client`,
        idempotencyKey: 'deployment-2',
        expectedRegistrationGeneration: 1n,
        manifestHash: 'hash-1',
        capabilities: [{ pageKey: 'Product_Detail.V2', supportedLocales: ['en-US', 'zh-CN'] }],
        discoveredAt: new Date('2026-07-19T06:06:00.000Z')
      })
    ).resolves.toEqual(expect.objectContaining({ idempotentReplay: false }))
    await expect(repository.listSitePages({ siteId })).resolves.toEqual([
      expect.objectContaining({
        pageKey: 'Product_Detail.V2',
        enabled: true,
        lastDiscoveredAt: new Date('2026-07-19T06:06:00.000Z')
      })
    ])

    await repository.registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-3',
      expectedRegistrationGeneration: 2n,
      manifestHash: 'hash-2',
      capabilities: [],
      discoveredAt: new Date('2026-07-19T06:10:00.000Z')
    })
    await expect(repository.checkSitePagePreflight({ siteId })).resolves.toEqual({
      ok: false,
      issues: [{ code: 'SITE_PAGE_CAPABILITY_DRIFT', pageKey: 'Product_Detail.V2', locale: '' }]
    })

    await repository.registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-4',
      expectedRegistrationGeneration: 3n,
      manifestHash: 'hash-3',
      capabilities: [{ pageKey: 'Product_Detail.V2', supportedLocales: ['en-US', 'zh-CN'] }],
      discoveredAt: new Date('2026-07-19T06:15:00.000Z')
    })
    await expect(repository.listSitePages({ siteId })).resolves.toEqual([
      expect.objectContaining({
        pageKey: 'Product_Detail.V2',
        available: true,
        enabled: true,
        indexable: false,
        drift: false
      })
    ])
  })

  it('publishes slug-free exposure as its own versioned sync payload', async () => {
    const siteId = `${prefix}_site`
    const tenantId = `${prefix}_tenant`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_site`,
      siteName: 'Governed Site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })
    await repository.registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-1',
      expectedRegistrationGeneration: 0n,
      manifestHash: 'hash-1',
      capabilities: [{ pageKey: 'home', supportedLocales: ['en-US'] }],
      discoveredAt: new Date('2026-07-19T06:00:00.000Z')
    })
    await repository.updateSitePageGovernance({
      siteId,
      pageKey: 'home',
      enabled: true,
      indexable: true
    })
    await repository.markSiteExposurePending({ siteId })

    const publication = await repository.publishSiteExposure({
      siteId,
      publishVersion: 1,
      publishedAt: new Date('2026-07-19T06:30:00.000Z')
    })
    await repository.markSiteExposureSynced({ siteId })

    expect(publication).toEqual(
      expect.objectContaining({ siteId, publishVersion: 1, activeLocales: ['en-US'] })
    )
    expect(JSON.stringify(publication)).not.toContain('slug')
    await expect(repository.getLatestSiteExposurePublication({ siteId })).resolves.toEqual(
      publication
    )
  })

  it('rejects delayed and wrong-expected manifests without changing governance or published exposure', async () => {
    const siteId = `${prefix}_site`
    const tenantId = `${prefix}_tenant`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_site`,
      siteName: 'Fenced Site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })

    const acceptedB = await (repository as any).registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-b',
      expectedRegistrationGeneration: 0n,
      manifestHash: 'b'.repeat(64),
      capabilities: [{ pageKey: 'B_CURRENT', supportedLocales: ['en-US'] }],
      discoveredAt: new Date('2026-07-19T07:00:00.000Z')
    })
    expect(acceptedB).toEqual(
      expect.objectContaining({ accepted: true, registrationGeneration: '1' })
    )
    await repository.updateSitePageGovernance({
      siteId,
      pageKey: 'B_CURRENT',
      enabled: true,
      indexable: true
    })
    await repository.markSiteExposurePending({ siteId })
    await repository.publishSiteExposure({
      siteId,
      publishVersion: 1,
      publishedAt: new Date('2026-07-19T07:05:00.000Z')
    })
    await repository.markSiteExposureSynced({ siteId })

    const staleA = await (repository as any).registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-a-delayed',
      expectedRegistrationGeneration: 0n,
      manifestHash: 'a'.repeat(64),
      capabilities: [{ pageKey: 'A_DELAYED', supportedLocales: ['en-US'] }],
      discoveredAt: new Date('2026-07-19T07:10:00.000Z')
    })
    expect(staleA).toEqual(
      expect.objectContaining({
        accepted: false,
        idempotentReplay: false,
        manifestHash: 'a'.repeat(64),
        registrationGeneration: '1'
      })
    )
    await expect(repository.listSitePages({ siteId })).resolves.toEqual([
      expect.objectContaining({
        pageKey: 'B_CURRENT',
        available: true,
        enabled: true,
        indexable: true
      })
    ])
    await expect(repository.getLatestPublishState(siteId)).resolves.toEqual({
      latestPublishVersion: 1,
      latestSyncId: ''
    })
    await expect(repository.getLatestSiteExposurePublication({ siteId })).resolves.toEqual(
      expect.objectContaining({
        publishVersion: 1,
        pages: [expect.objectContaining({ pageKey: 'B_CURRENT', enabled: true })]
      })
    )

    await expect(
      (repository as any).registerPageCapabilities({
        siteId,
        clientId: `${prefix}_client`,
        idempotencyKey: 'deployment-a-delayed',
        expectedRegistrationGeneration: 1n,
        manifestHash: 'a'.repeat(64),
        capabilities: [{ pageKey: 'A_DELAYED', supportedLocales: ['en-US'] }],
        discoveredAt: new Date('2026-07-19T07:15:00.000Z')
      })
    ).rejects.toMatchObject({
      name: 'SiteCapabilityRegistrationError',
      code: 'SITE_CAPABILITY_IDEMPOTENCY_CONFLICT'
    })
  })

  it('replays the original accepted generation after response loss without applying the manifest twice', async () => {
    const siteId = `${prefix}_site`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId: `${prefix}_tenant`,
      siteCode: `${prefix}_site`,
      siteName: 'Replay Site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })

    const first = await (repository as any).registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-1',
      expectedRegistrationGeneration: 0n,
      manifestHash: '1'.repeat(64),
      capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }],
      discoveredAt: new Date('2026-07-19T08:00:00.000Z')
    })
    expect(first).toEqual(
      expect.objectContaining({
        accepted: true,
        idempotentReplay: false,
        registrationGeneration: '1',
        unavailablePageKeys: []
      })
    )

    await (repository as any).registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-2',
      expectedRegistrationGeneration: 1n,
      manifestHash: '2'.repeat(64),
      capabilities: [{ pageKey: 'CONTACT', supportedLocales: ['en-US'] }],
      discoveredAt: new Date('2026-07-19T08:05:00.000Z')
    })

    const replay = await (repository as any).registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-1',
      expectedRegistrationGeneration: 0n,
      manifestHash: '1'.repeat(64),
      capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }],
      discoveredAt: new Date('2026-07-19T08:10:00.000Z')
    })
    expect(replay).toEqual({ ...first, idempotentReplay: true })
    await expect(repository.listSitePages({ siteId })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pageKey: 'CONTACT', available: true }),
        expect.objectContaining({
          pageKey: 'HOME',
          available: false,
          lastDiscoveredAt: new Date('2026-07-19T08:00:00.000Z')
        })
      ])
    )
  })

  it('isolates registration generations and idempotency keys by signed siteId and clientId', async () => {
    const siteA = `${prefix}_site_a`
    const siteB = `${prefix}_site_b`
    for (const siteId of [siteA, siteB]) {
      await repository.createSiteWithDefaultLocale({
        siteId,
        tenantId: `${prefix}_tenant`,
        siteCode: siteId,
        siteName: siteId,
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: null,
        previewBaseUrl: null,
        createdBy: `${prefix}_operator`
      })
    }

    const register = (siteId: string, clientId: string, pageKey: string) =>
      (repository as any).registerPageCapabilities({
        siteId,
        clientId,
        idempotencyKey: 'shared-deployment-key',
        expectedRegistrationGeneration: 0n,
        manifestHash: pageKey.charAt(0).toLowerCase().repeat(64),
        capabilities: [{ pageKey, supportedLocales: ['en-US'] }],
        discoveredAt: new Date('2026-07-19T09:00:00.000Z')
      })

    await expect(register(siteA, `${prefix}_client_a`, 'A_ONE')).resolves.toEqual(
      expect.objectContaining({ accepted: true, registrationGeneration: '1' })
    )
    await expect(register(siteA, `${prefix}_client_b`, 'B_ONE')).resolves.toEqual(
      expect.objectContaining({ accepted: true, registrationGeneration: '1' })
    )
    await expect(register(siteB, `${prefix}_client_a`, 'C_ONE')).resolves.toEqual(
      expect.objectContaining({ accepted: true, registrationGeneration: '1' })
    )
  })

  it('serializes concurrent claims so only one expected generation can be accepted', async () => {
    const siteId = `${prefix}_site`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId: `${prefix}_tenant`,
      siteCode: `${prefix}_site`,
      siteName: 'Concurrent Site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })

    const results = await Promise.all(
      ['BLUE', 'GREEN'].map((pageKey) =>
        (repository as any).registerPageCapabilities({
          siteId,
          clientId: `${prefix}_client`,
          idempotencyKey: `deployment-${pageKey.toLowerCase()}`,
          expectedRegistrationGeneration: 0n,
          manifestHash: (pageKey === 'BLUE' ? 'b' : 'c').repeat(64),
          capabilities: [{ pageKey, supportedLocales: ['en-US'] }],
          discoveredAt: new Date('2026-07-19T10:00:00.000Z')
        })
      )
    )

    expect(results.filter((result) => result.accepted)).toHaveLength(1)
    expect(results.filter((result) => !result.accepted)).toHaveLength(1)
    expect(results.map((result) => result.registrationGeneration)).toEqual(['1', '1'])
    const acceptedPageKey = results[0].accepted ? 'BLUE' : 'GREEN'
    await expect(repository.listSitePages({ siteId })).resolves.toEqual([
      expect.objectContaining({ pageKey: acceptedPageKey, available: true })
    ])
  })

  it('persists and returns the full unsigned uint64 registration generation range', async () => {
    const siteId = `${prefix}_site`
    const clientId = `${prefix}_client`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId: `${prefix}_tenant`,
      siteCode: `${prefix}_site`,
      siteName: 'Uint64 Site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })
    await prisma.siteCapabilityRegistrationStream.create({
      data: {
        siteId,
        clientId,
        currentGeneration: '18446744073709551614'
      } as any
    })

    await expect(
      (repository as any).registerPageCapabilities({
        siteId,
        clientId,
        idempotencyKey: 'deployment-uint64-max',
        expectedRegistrationGeneration: 18_446_744_073_709_551_614n,
        manifestHash: 'f'.repeat(64),
        capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }],
        discoveredAt: new Date('2026-07-19T10:30:00.000Z')
      })
    ).resolves.toEqual(
      expect.objectContaining({
        accepted: true,
        registrationGeneration: '18446744073709551615'
      })
    )

    await expect(
      (repository as any).registerPageCapabilities({
        siteId,
        clientId,
        idempotencyKey: 'deployment-uint64-overflow',
        expectedRegistrationGeneration: 18_446_744_073_709_551_615n,
        manifestHash: 'e'.repeat(64),
        capabilities: [{ pageKey: 'CONTACT', supportedLocales: ['en-US'] }],
        discoveredAt: new Date('2026-07-19T10:35:00.000Z')
      })
    ).rejects.toMatchObject({
      name: 'SiteCapabilityRegistrationError',
      code: 'SITE_CAPABILITY_REGISTRATION_GENERATION_EXHAUSTED'
    })
  })

  it('rolls back exposure publication, publishVersion, and pending state when the atomic Sync transaction fails', async () => {
    const siteId = `${prefix}_site`
    const tenantId = `${prefix}_tenant`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_site`,
      siteName: 'Governed Site',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })
    await repository.registerPageCapabilities({
      siteId,
      clientId: `${prefix}_client`,
      idempotencyKey: 'deployment-1',
      expectedRegistrationGeneration: 0n,
      manifestHash: 'hash-1',
      capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }],
      discoveredAt: new Date('2026-07-19T06:00:00.000Z')
    })
    await repository.updateSitePageGovernance({
      siteId,
      pageKey: 'HOME',
      enabled: true,
      indexable: true
    })
    await repository.markSiteExposurePending({ siteId })

    const admin = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret',
      now: () => new Date('2026-07-19T06:30:00.000Z'),
      randomId: (name) => `${prefix}_${name}`
    })
    const createSyncBatch = jest
      .spyOn(repository, 'createSyncBatch')
      .mockRejectedValueOnce(new Error('forced sync failure'))
    try {
      await expect(
        admin.syncAllPendingChanges({
          context: { tenantId, operatorId: `${prefix}_operator`, traceId: `${prefix}_trace` },
          siteId
        })
      ).rejects.toThrow('forced sync failure')
    } finally {
      createSyncBatch.mockRestore()
    }

    await expect(repository.getLatestPublishState(siteId)).resolves.toEqual({
      latestPublishVersion: 0,
      latestSyncId: ''
    })
    await expect(repository.getLatestSiteExposurePublication({ siteId })).resolves.toBeUndefined()
    await expect(repository.listSitePages({ siteId })).resolves.toEqual([
      expect.objectContaining({ pageKey: 'HOME', syncStatus: 'pending' })
    ])
    await expect(repository.listPendingSyncResources(siteId)).resolves.toEqual([
      expect.objectContaining({ resourceType: 'site-exposure', resourceId: siteId })
    ])
  })
})
