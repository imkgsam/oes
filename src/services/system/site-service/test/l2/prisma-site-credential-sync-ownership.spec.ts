import { NotFoundException } from '@nestjs/common'
import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

// Verifies Prisma ownership facts and mutations keep credential and sync descendants scoped to their Site.
describe('Prisma site credential and sync ownership L2', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  /** seedOwnedCredential creates one tenant-owned Site with one active credential for rollback tests. */
  async function seedOwnedCredential(input: {
    tenantId: string
    siteId: string
    credentialId: string
  }): Promise<void> {
    await repository.createSiteWithDefaultLocale({
      siteId: input.siteId,
      tenantId: input.tenantId,
      siteCode: `${prefix}_rollback`,
      siteName: `${prefix} rollback`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })
    await repository.saveCredentialMetadata({
      credentialId: input.credentialId,
      siteId: input.siteId,
      clientId: `${prefix}_client_old`,
      secretHash: `${prefix}_hash_old`,
      secretCiphertext: Buffer.from(JSON.stringify({ secret: `${prefix}_secret_old` })).toString(
        'base64url'
      ),
      scopes: ['site:read'],
      status: 'active',
      createdBy: `${prefix}_operator`
    })
  }

  it('resolves two-tenant facts and refuses cross-Site credential or sync predicates', async () => {
    const tenantA = `${prefix}_tenant_a`
    const tenantB = `${prefix}_tenant_b`
    const siteA = `${prefix}_site_a`
    const siteB = `${prefix}_site_b`
    const siteForeign = `${prefix}_site_foreign`

    for (const [siteId, tenantId, siteCode] of [
      [siteA, tenantA, `${prefix}_a`],
      [siteB, tenantA, `${prefix}_b`],
      [siteForeign, tenantB, `${prefix}_foreign`]
    ]) {
      await repository.createSiteWithDefaultLocale({
        siteId,
        tenantId,
        siteCode,
        siteName: siteCode,
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: null,
        previewBaseUrl: null,
        createdBy: `${prefix}_operator`
      })
    }

    const credentials = [
      { credentialId: `${prefix}_credential_a`, siteId: siteA },
      { credentialId: `${prefix}_credential_b`, siteId: siteB },
      { credentialId: `${prefix}_credential_foreign`, siteId: siteForeign }
    ]
    for (const credential of credentials) {
      await repository.saveCredentialMetadata({
        ...credential,
        clientId: `${credential.credentialId}_client`,
        secretHash: `${prefix}_hash`,
        secretCiphertext: Buffer.from(
          JSON.stringify({ secret: `${prefix}_secret` }),
          'utf8'
        ).toString('base64url'),
        scopes: ['site:read'],
        status: 'active',
        createdBy: `${prefix}_operator`
      })
    }

    const syncs = [
      { syncId: `${prefix}_sync_a`, siteId: siteA, tenantId: tenantA },
      { syncId: `${prefix}_sync_b`, siteId: siteB, tenantId: tenantA },
      { syncId: `${prefix}_sync_foreign`, siteId: siteForeign, tenantId: tenantB }
    ]
    for (const sync of syncs) {
      await repository.createSyncBatch({
        ...sync,
        publishVersion: 1,
        status: 'completed',
        triggeredBy: `${prefix}_operator`,
        resources: []
      })
    }

    await expect(repository.findCredentialOwnership(credentials[0].credentialId)).resolves.toEqual({
      siteId: siteA
    })
    await expect(repository.findCredentialOwnership(credentials[1].credentialId)).resolves.toEqual({
      siteId: siteB
    })
    await expect(repository.findCredentialOwnership(credentials[2].credentialId)).resolves.toEqual({
      siteId: siteForeign
    })
    await expect(repository.findCredentialOwnership(`${prefix}_missing`)).resolves.toBeNull()

    await expect(repository.findSyncOwnership(syncs[0].syncId)).resolves.toEqual(syncs[0])
    await expect(repository.findSyncOwnership(syncs[1].syncId)).resolves.toEqual(syncs[1])
    await expect(repository.findSyncOwnership(syncs[2].syncId)).resolves.toEqual(syncs[2])
    await expect(repository.findSyncOwnership(`${prefix}_missing`)).resolves.toBeNull()

    await expect(
      repository.revokeSiteCredential({
        siteId: siteA,
        credentialId: credentials[1].credentialId,
        revokedAt: new Date('2026-07-22T08:00:00.000Z')
      })
    ).resolves.toBe(false)
    await expect(repository.listSiteCredentials({ siteId: siteB })).resolves.toEqual([
      expect.objectContaining({ credentialId: credentials[1].credentialId, status: 'active' })
    ])

    await expect(
      repository.revokeSiteCredential({
        siteId: siteB,
        credentialId: credentials[1].credentialId,
        revokedAt: new Date('2026-07-22T08:00:00.000Z')
      })
    ).resolves.toBe(true)
    await expect(repository.listSiteCredentials({ siteId: siteB })).resolves.toEqual([
      expect.objectContaining({ credentialId: credentials[1].credentialId, status: 'revoked' })
    ])

    await expect(
      repository.getSyncDetail({ siteId: siteA, syncId: syncs[1].syncId })
    ).resolves.toBeNull()
    await expect(
      repository.getSyncDetail({ siteId: siteB, syncId: syncs[1].syncId })
    ).resolves.toEqual(expect.objectContaining({ syncId: syncs[1].syncId, siteId: siteB }))

    await expect(
      repository.recordWebhookDelivery({
        deliveryId: `${prefix}_delivery_mismatch`,
        syncId: syncs[0].syncId,
        siteId: siteB,
        tenantId: tenantA,
        eventId: `${prefix}_event_mismatch`,
        eventType: 'site.publish.available',
        publishVersion: 1,
        targetUrl: 'https://runtime.example/oes/webhooks/site',
        status: 'dispatched',
        payload: {},
        headers: {},
        resent: true,
        deliveredAt: new Date('2026-07-22T08:00:00.000Z')
      })
    ).rejects.toThrow('sync batch not found')
    const client = prisma.getExecutionClient()
    await expect(
      client.siteWebhookDelivery.count({ where: { deliveryId: `${prefix}_delivery_mismatch` } })
    ).resolves.toBe(0)

    const atomicEventId = `${prefix}_event_atomic`
    const atomicDeliveryId = `${prefix}_delivery_atomic`
    await repository.saveAuditEnvelope({
      eventId: `audit_${atomicEventId}`,
      service: 'site-service',
      module: 'test',
      eventType: 'test.audit.collision',
      occurredAt: new Date('2026-07-22T08:00:00.000Z'),
      result: 'SUCCEEDED',
      operatorId: `${prefix}_operator`,
      operatorType: 'HUMAN',
      tenantId: tenantA,
      orgId: null,
      traceId: `${prefix}_trace`,
      resourceType: 'site_sync_batch',
      resourceId: syncs[0].syncId,
      details: { siteId: siteA }
    })
    await expect(
      repository.recordWebhookDelivery({
        deliveryId: atomicDeliveryId,
        syncId: syncs[0].syncId,
        siteId: siteA,
        tenantId: tenantA,
        eventId: atomicEventId,
        eventType: 'site.publish.available',
        publishVersion: 1,
        targetUrl: 'https://runtime.example/oes/webhooks/site',
        status: 'dispatched',
        payload: {},
        headers: {},
        resent: true,
        deliveredAt: new Date('2026-07-22T08:00:00.000Z')
      })
    ).rejects.toBeDefined()
    await expect(
      client.siteWebhookDelivery.count({ where: { deliveryId: atomicDeliveryId } })
    ).resolves.toBe(0)
  })

  it('holds the tuple row lock until delivery and audit writes commit', async () => {
    const tenantId = `${prefix}_tenant`
    const siteId = `${prefix}_site`
    const syncId = `${prefix}_sync_lock`
    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_lock`,
      siteName: `${prefix} lock`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })
    await repository.createSyncBatch({
      syncId,
      siteId,
      tenantId,
      publishVersion: 1,
      status: 'completed',
      triggeredBy: `${prefix}_operator`,
      resources: []
    })

    const contender = await createPrismaForIntegration()
    let release!: () => void
    let markLockHeld!: () => void
    const holdTransaction = new Promise<void>((resolve) => {
      release = resolve
    })
    const lockHeld = new Promise<void>((resolve) => {
      markLockHeld = resolve
    })
    const ownerTransaction = prisma.runInTransaction(async () => {
      await repository.recordWebhookDelivery({
        deliveryId: `${prefix}_delivery_lock`,
        syncId,
        siteId,
        tenantId,
        eventId: `${prefix}_event_lock`,
        eventType: 'site.publish.available',
        publishVersion: 1,
        targetUrl: 'https://runtime.example/oes/webhooks/site',
        status: 'dispatched',
        payload: {},
        headers: {},
        resent: true,
        deliveredAt: new Date('2026-07-22T08:00:00.000Z')
      })
      markLockHeld()
      await holdTransaction
    })

    try {
      await lockHeld
      await expect(
        contender.$transaction(async (transaction) => {
          await transaction.$executeRawUnsafe(`SET LOCAL lock_timeout = '150ms'`)
          await transaction.siteSyncBatch.update({
            where: { syncId },
            data: { tenantId: `${prefix}_tenant_mutated` }
          })
        })
      ).rejects.toThrow(/lock timeout|canceling statement due to lock timeout/i)
    } finally {
      release()
      await ownerTransaction
      await contender.$disconnect()
    }
  })

  it('Rotate application transaction / rolls back replacement when scoped revoke misses after the initial fact', async () => {
    const tenantId = `${prefix}_tenant`
    const siteId = `${prefix}_site`
    const oldCredentialId = `${prefix}_credential_old`
    await seedOwnedCredential({ tenantId, siteId, credentialId: oldCredentialId })

    const originalSaveCredentialMetadata = repository.saveCredentialMetadata.bind(repository)
    jest.spyOn(repository, 'saveCredentialMetadata').mockImplementationOnce(async (input) => {
      await originalSaveCredentialMetadata(input)
      await prisma.getExecutionClient().siteCredential.delete({
        where: { credentialId: oldCredentialId }
      })
    })
    const application = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret',
      now: () => new Date('2026-07-22T08:00:00.000Z'),
      randomId: (kind) => `${kind}_${prefix}_replacement`,
      randomSecret: () => `${prefix}_replacement_secret`
    })

    await expect(
      application.rotateSiteCredential({
        context: { tenantId, operatorId: `${prefix}_operator` },
        siteId,
        credentialId: oldCredentialId
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    await expect(repository.listSiteCredentials({ siteId })).resolves.toEqual([
      expect.objectContaining({
        credentialId: oldCredentialId,
        status: 'active',
        revokedAt: null
      })
    ])
    const client = prisma.getExecutionClient()
    await expect(
      client.siteAuditEnvelope.count({
        where: { tenantId, eventType: 'site_credential.rotated' }
      })
    ).resolves.toBe(0)
  })

  it('Rotate application transaction / rolls back replacement and old revoke when audit persistence fails', async () => {
    const tenantId = `${prefix}_tenant`
    const siteId = `${prefix}_site`
    const oldCredentialId = `${prefix}_credential_old`
    const auditCollisionId = `${prefix}_audit_collision`
    await seedOwnedCredential({ tenantId, siteId, credentialId: oldCredentialId })
    await repository.saveAuditEnvelope({
      eventId: auditCollisionId,
      service: 'site-service',
      module: 'test',
      eventType: 'test.audit.collision',
      occurredAt: new Date('2026-07-22T07:59:00.000Z'),
      result: 'SUCCEEDED',
      operatorId: `${prefix}_operator`,
      operatorType: 'HUMAN',
      tenantId,
      orgId: null,
      traceId: `${prefix}_trace`,
      resourceType: 'site_credential',
      resourceId: oldCredentialId,
      details: { siteId }
    })
    const application = new SiteAdminApplicationService(repository, {
      previewTokenSecret: 'site-service-local-preview-secret',
      now: () => new Date('2026-07-22T08:00:00.000Z'),
      randomId: (kind) => (kind === 'audit' ? auditCollisionId : `${kind}_${prefix}_replacement`),
      randomSecret: () => `${prefix}_replacement_secret`
    })

    await expect(
      application.rotateSiteCredential({
        context: { tenantId, operatorId: `${prefix}_operator` },
        siteId,
        credentialId: oldCredentialId
      })
    ).rejects.toBeDefined()

    await expect(repository.listSiteCredentials({ siteId })).resolves.toEqual([
      expect.objectContaining({
        credentialId: oldCredentialId,
        status: 'active',
        revokedAt: null
      })
    ])
    const client = prisma.getExecutionClient()
    await expect(
      client.siteAuditEnvelope.count({ where: { eventId: auditCollisionId } })
    ).resolves.toBe(1)
    await expect(
      client.siteAuditEnvelope.count({
        where: { tenantId, eventType: 'site_credential.rotated' }
      })
    ).resolves.toBe(0)
  })
})
