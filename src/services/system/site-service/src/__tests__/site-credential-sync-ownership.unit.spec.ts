import { NotFoundException } from '@nestjs/common'
import { ACCESS_DENIED, UNAUTHENTICATED } from '@oes/common/exceptions'
import {
  SiteAdminApplicationRepository,
  SiteAdminApplicationService
} from '../application/services/site-admin-application.service'
import { PrismaSiteRepository } from '../infrastructure/repositories/prisma-site.repository'

const MATCHING_CONTEXT = {
  tenantId: 'tenant_a',
  orgId: 'org_a',
  operatorId: 'operator_a',
  traceId: 'trace_a'
}

type Harness = ReturnType<typeof createHarness>

/** createHarness isolates Admin descendant-ownership behavior from persistence and HTTP delivery. */
function createHarness() {
  const calls = {
    runInTransaction: jest.fn(),
    findTenantIdForSite: jest.fn(),
    findCredentialOwnership: jest.fn(),
    findSyncOwnership: jest.fn(),
    saveCredentialMetadata: jest.fn(),
    revokeSiteCredential: jest.fn(),
    getSyncDetail: jest.fn(),
    getWebhookDispatchConfig: jest.fn(),
    recordWebhookDelivery: jest.fn(),
    saveAuditEnvelope: jest.fn()
  }
  const repository = calls as unknown as SiteAdminApplicationRepository

  calls.findTenantIdForSite.mockResolvedValue('tenant_a')
  calls.findCredentialOwnership.mockResolvedValue({ siteId: 'site_a' })
  calls.findSyncOwnership.mockResolvedValue({
    syncId: 'sync_a',
    siteId: 'site_a',
    tenantId: 'tenant_a'
  })
  calls.revokeSiteCredential.mockResolvedValue(true)
  calls.runInTransaction.mockImplementation(async (callback: () => Promise<unknown>) => callback())
  calls.getSyncDetail.mockResolvedValue({
    syncId: 'sync_a',
    siteId: 'site_a',
    publishVersion: 7,
    status: 'completed',
    triggeredBy: 'operator_a',
    resources: []
  })
  calls.getWebhookDispatchConfig.mockResolvedValue({
    targetUrl: 'https://runtime.example/oes/webhooks/site',
    signingSecret: 'webhook_signing_secret'
  })

  const randomSecret = jest.fn(() => 'replacement_secret')
  const webhookPublisher = { publish: jest.fn().mockResolvedValue(undefined) }
  const application = new SiteAdminApplicationService(
    repository,
    {
      previewTokenSecret: 'site-service-local-preview-secret',
      now: () => new Date('2026-07-22T08:00:00.000Z'),
      randomId: (prefix) => `${prefix}_fixed`,
      randomSecret,
      oesBaseUrl: 'https://oes.example/api/v1/site',
      environment: 'test'
    },
    webhookPublisher
  )

  return { application, calls, randomSecret, webhookPublisher }
}

/** expectAccessDenied verifies the stable typed denial without exposing ownership facts. */
function expectAccessDenied(error: unknown) {
  expect(error).toMatchObject({
    definition: expect.objectContaining({
      code: ACCESS_DENIED.code,
      rpcStatus: ACCESS_DENIED.rpcStatus
    }),
    additionalDetails: undefined
  })
  expect(JSON.stringify((error as { toRpcPayload: () => unknown }).toRpcPayload())).not.toContain(
    'tenant_'
  )
}

/** expectUnauthenticated verifies Admin authentication wins over malformed descendant identifiers. */
function expectUnauthenticated(error: unknown) {
  expect(error).toMatchObject({
    definition: expect.objectContaining({
      code: UNAUTHENTICATED.code,
      rpcStatus: UNAUTHENTICATED.rpcStatus
    }),
    additionalDetails: undefined
  })
}

/** expectNoCredentialEffects proves denied credential commands cannot create, revoke, or audit secrets. */
function expectNoCredentialEffects(harness: Harness) {
  expect(harness.randomSecret).not.toHaveBeenCalled()
  expect(harness.calls.saveCredentialMetadata).not.toHaveBeenCalled()
  expect(harness.calls.revokeSiteCredential).not.toHaveBeenCalled()
  expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
}

/** expectNoSyncEffects proves denied sync commands cannot read detail, dispatch, deliver, or audit. */
function expectNoSyncEffects(harness: Harness) {
  expect(harness.calls.getSyncDetail).not.toHaveBeenCalled()
  expect(harness.calls.getWebhookDispatchConfig).not.toHaveBeenCalled()
  expect(harness.webhookPublisher.publish).not.toHaveBeenCalled()
  expect(harness.calls.recordWebhookDelivery).not.toHaveBeenCalled()
  expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
}

/** expectNoRepositoryCalls proves invalid Admin context is rejected before any ownership fact read. */
function expectNoRepositoryCalls(harness: Harness) {
  for (const call of Object.values(harness.calls)) {
    expect(call).not.toHaveBeenCalled()
  }
  expect(harness.randomSecret).not.toHaveBeenCalled()
  expect(harness.webhookPublisher.publish).not.toHaveBeenCalled()
}

// Verifies all high-risk 1B-1 paths require complete Admin identity before any repository access.
describe('SiteAdmin complete context precedence', () => {
  const operations = [
    {
      name: 'RotateSiteCredential',
      invoke: (harness: Harness, context: typeof MATCHING_CONTEXT) =>
        harness.application.rotateSiteCredential({
          context,
          siteId: 'site_a',
          credentialId: 'credential_a'
        })
    },
    {
      name: 'RevokeSiteCredential',
      invoke: (harness: Harness, context: typeof MATCHING_CONTEXT) =>
        harness.application.revokeSiteCredential({
          context,
          siteId: 'site_a',
          credentialId: 'credential_a'
        })
    },
    {
      name: 'GetSyncDetail',
      invoke: (harness: Harness, context: typeof MATCHING_CONTEXT) =>
        harness.application.getSyncDetail({ context, syncId: 'sync_a' })
    },
    {
      name: 'ResendWebhook',
      invoke: (harness: Harness, context: typeof MATCHING_CONTEXT) =>
        harness.application.resendWebhook({ context, syncId: 'sync_a' })
    }
  ]

  it.each(
    [
      { contextCase: 'missing', operatorId: undefined },
      { contextCase: 'blank', operatorId: '   ' }
    ].flatMap(({ contextCase, operatorId }) =>
      operations.map((operation) => ({ ...operation, contextCase, operatorId }))
    )
  )(
    'rejects $contextCase operator before $name ownership lookup or effects',
    async ({ invoke, operatorId }) => {
      const harness = createHarness()
      const context = { ...MATCHING_CONTEXT, operatorId }

      const error = await invoke(harness, context as typeof MATCHING_CONTEXT).catch(
        (caught: unknown) => caught
      )

      expectUnauthenticated(error)
      expectNoRepositoryCalls(harness)
    }
  )
})

// Verifies credential commands authorize both the target Site and credential descendant before effects.
describe('SiteAdmin credential descendant ownership', () => {
  it('rotates in descendant-check, generate, revoke, then audit order with one normalized Site target', async () => {
    const harness = createHarness()

    await expect(
      harness.application.rotateSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: '  site_a  ',
        credentialId: '  credential_a  '
      })
    ).resolves.toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ credentialId: 'cred_fixed', status: 'active' }),
        credentialBundle: expect.stringMatching(/^oes_site_cred_v1\./)
      })
    )

    expect(harness.calls.findTenantIdForSite).toHaveBeenCalledTimes(1)
    expect(harness.calls.findTenantIdForSite).toHaveBeenCalledWith('site_a')
    expect(harness.calls.findCredentialOwnership).toHaveBeenCalledTimes(1)
    expect(harness.calls.findCredentialOwnership).toHaveBeenCalledWith('credential_a')
    expect(harness.calls.saveCredentialMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site_a' })
    )
    expect(harness.calls.revokeSiteCredential).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site_a', credentialId: 'credential_a' })
    )
    expect(harness.calls.saveAuditEnvelope).toHaveBeenCalledTimes(1)
    expect(harness.calls.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'site_credential.rotated',
        resourceId: 'credential_a',
        details: expect.not.objectContaining({ clientSecret: expect.anything() })
      })
    )

    const credentialFactOrder = harness.calls.findCredentialOwnership.mock.invocationCallOrder[0]
    const generateOrder = harness.calls.saveCredentialMetadata.mock.invocationCallOrder[0]
    const revokeOrder = harness.calls.revokeSiteCredential.mock.invocationCallOrder[0]
    const auditOrder = harness.calls.saveAuditEnvelope.mock.invocationCallOrder[0]
    expect(credentialFactOrder).toBeLessThan(generateOrder)
    expect(generateOrder).toBeLessThan(revokeOrder)
    expect(revokeOrder).toBeLessThan(auditOrder)
  })

  it.each([
    ['another Site in the same tenant', { siteId: 'site_b' }],
    ['a Site in a foreign tenant', { siteId: 'site_foreign' }]
  ])('denies rotation when the credential belongs to %s before every effect', async (_, fact) => {
    const harness = createHarness()
    harness.calls.findCredentialOwnership.mockResolvedValue(fact)

    const error = await harness.application
      .rotateSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: 'credential_other'
      })
      .catch((caught: unknown) => caught)

    expectAccessDenied(error)
    expect(harness.calls.findCredentialOwnership).toHaveBeenCalledWith('credential_other')
    expectNoCredentialEffects(harness)
  })

  it('returns NOT_FOUND for a missing rotation credential before every effect', async () => {
    const harness = createHarness()
    harness.calls.findCredentialOwnership.mockResolvedValue(null)

    await expect(
      harness.application.rotateSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: 'credential_missing'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expectNoCredentialEffects(harness)
  })

  it('authenticates before validating a malformed rotation credential', async () => {
    const harness = createHarness()

    const error = await harness.application
      .rotateSiteCredential({
        context: { operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        credentialId: '   '
      })
      .catch((caught: unknown) => caught)

    expectUnauthenticated(error)
    expect(harness.calls.findTenantIdForSite).not.toHaveBeenCalled()
    expect(harness.calls.findCredentialOwnership).not.toHaveBeenCalled()
    expectNoCredentialEffects(harness)
  })

  it('rejects a malformed rotation credential after the Site gate and before effects', async () => {
    const harness = createHarness()

    await expect(
      harness.application.rotateSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: '   '
      })
    ).rejects.toThrow('credentialId is required')

    expect(harness.calls.findTenantIdForSite).toHaveBeenCalledTimes(1)
    expect(harness.calls.findCredentialOwnership).not.toHaveBeenCalled()
    expectNoCredentialEffects(harness)
  })

  it('revokes a matching credential with the Site and credential predicate before auditing', async () => {
    const harness = createHarness()

    await expect(
      harness.application.revokeSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: 'credential_a'
      })
    ).resolves.toEqual({ revoked: true })

    expect(harness.calls.findCredentialOwnership).toHaveBeenCalledWith('credential_a')
    expect(harness.calls.revokeSiteCredential).toHaveBeenCalledWith({
      siteId: 'site_a',
      credentialId: 'credential_a',
      revokedAt: new Date('2026-07-22T08:00:00.000Z')
    })
    expect(harness.calls.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'site_credential.revoked',
        resourceId: 'credential_a'
      })
    )
    expect(harness.calls.revokeSiteCredential.mock.invocationCallOrder[0]).toBeLessThan(
      harness.calls.saveAuditEnvelope.mock.invocationCallOrder[0]
    )
  })

  it.each([
    ['another Site in the same tenant', { siteId: 'site_b' }],
    ['a Site in a foreign tenant', { siteId: 'site_foreign' }]
  ])('denies revoke when the credential belongs to %s', async (_, fact) => {
    const harness = createHarness()
    harness.calls.findCredentialOwnership.mockResolvedValue(fact)

    const error = await harness.application
      .revokeSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: 'credential_other'
      })
      .catch((caught: unknown) => caught)

    expectAccessDenied(error)
    expectNoCredentialEffects(harness)
  })

  it('returns NOT_FOUND for a missing revoke credential', async () => {
    const harness = createHarness()
    harness.calls.findCredentialOwnership.mockResolvedValue(null)

    await expect(
      harness.application.revokeSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: 'credential_missing'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expectNoCredentialEffects(harness)
  })

  it('maps a concurrent site-scoped revoke miss to NOT_FOUND without audit', async () => {
    const harness = createHarness()
    harness.calls.revokeSiteCredential.mockResolvedValue(false)

    await expect(
      harness.application.revokeSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: 'credential_a'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(harness.calls.revokeSiteCredential).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site_a', credentialId: 'credential_a' })
    )
    expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
  })

  it('runs replacement persistence inside the transaction that rolls back a scoped revoke miss', async () => {
    const harness = createHarness()
    const storedCredentialIds = new Set<string>()
    harness.calls.saveCredentialMetadata.mockImplementation(async ({ credentialId }) => {
      storedCredentialIds.add(credentialId)
    })
    harness.calls.revokeSiteCredential.mockResolvedValue(false)
    harness.calls.runInTransaction.mockImplementation(async (callback) => {
      const snapshot = new Set(storedCredentialIds)
      try {
        return await callback()
      } catch (error) {
        storedCredentialIds.clear()
        for (const credentialId of snapshot) {
          storedCredentialIds.add(credentialId)
        }
        throw error
      }
    })

    await expect(
      harness.application.rotateSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: 'site_a',
        credentialId: 'credential_a'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(harness.calls.runInTransaction).toHaveBeenCalledTimes(1)
    expect(harness.calls.saveCredentialMetadata).toHaveBeenCalledTimes(1)
    expect(storedCredentialIds).toEqual(new Set())
    expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
  })
})

// Verifies sync-only Admin paths authorize a minimal ownership fact before reading detail or dispatching.
describe('SiteAdmin sync descendant ownership', () => {
  it.each([
    ['the first owned Site', { syncId: 'sync_a', siteId: 'site_a', tenantId: 'tenant_a' }],
    [
      'another Site in the same tenant',
      { syncId: 'sync_a', siteId: 'site_b', tenantId: 'tenant_a' }
    ]
  ])('reads sync detail for %s through the resolved Site predicate', async (_, fact) => {
    const harness = createHarness()
    harness.calls.findSyncOwnership.mockResolvedValue(fact)
    harness.calls.getSyncDetail.mockResolvedValue({ ...fact, publishVersion: 7, resources: [] })

    await expect(
      harness.application.getSyncDetail({ context: MATCHING_CONTEXT, syncId: '  sync_a  ' })
    ).resolves.toEqual({
      batch: expect.objectContaining({ syncId: 'sync_a', siteId: fact.siteId })
    })

    expect(harness.calls.findSyncOwnership).toHaveBeenCalledTimes(1)
    expect(harness.calls.findSyncOwnership).toHaveBeenCalledWith('sync_a')
    expect(harness.calls.getSyncDetail).toHaveBeenCalledWith({
      siteId: fact.siteId,
      syncId: 'sync_a'
    })
    expect(harness.calls.findSyncOwnership.mock.invocationCallOrder[0]).toBeLessThan(
      harness.calls.getSyncDetail.mock.invocationCallOrder[0]
    )
  })

  it('denies foreign-tenant sync detail before reading the detail', async () => {
    const harness = createHarness()
    harness.calls.findSyncOwnership.mockResolvedValue({
      syncId: 'sync_foreign',
      siteId: 'site_foreign',
      tenantId: 'tenant_foreign'
    })

    const error = await harness.application
      .getSyncDetail({ context: MATCHING_CONTEXT, syncId: 'sync_foreign' })
      .catch((caught: unknown) => caught)

    expectAccessDenied(error)
    expectNoSyncEffects(harness)
  })

  it('returns NOT_FOUND for a missing sync before reading the detail', async () => {
    const harness = createHarness()
    harness.calls.findSyncOwnership.mockResolvedValue(null)

    await expect(
      harness.application.getSyncDetail({ context: MATCHING_CONTEXT, syncId: 'sync_missing' })
    ).rejects.toBeInstanceOf(NotFoundException)

    expectNoSyncEffects(harness)
  })

  it('returns NOT_FOUND when a scoped detail disappears after the ownership fact', async () => {
    const harness = createHarness()
    harness.calls.getSyncDetail.mockResolvedValue(null)

    await expect(
      harness.application.getSyncDetail({ context: MATCHING_CONTEXT, syncId: 'sync_a' })
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(harness.calls.getSyncDetail).toHaveBeenCalledWith({ siteId: 'site_a', syncId: 'sync_a' })
  })

  it('authenticates before validating a malformed sync detail id', async () => {
    const harness = createHarness()

    const error = await harness.application
      .getSyncDetail({ context: { operatorId: 'operator_a' }, syncId: '   ' })
      .catch((caught: unknown) => caught)

    expectUnauthenticated(error)
    expect(harness.calls.findSyncOwnership).not.toHaveBeenCalled()
    expectNoSyncEffects(harness)
  })

  it('rejects a malformed sync detail id before ownership or detail reads', async () => {
    const harness = createHarness()

    await expect(
      harness.application.getSyncDetail({ context: MATCHING_CONTEXT, syncId: '   ' })
    ).rejects.toThrow('syncId is required')

    expect(harness.calls.findSyncOwnership).not.toHaveBeenCalled()
    expectNoSyncEffects(harness)
  })

  it('resends only after the sync fact and scoped detail, then records delivery and audit', async () => {
    const harness = createHarness()

    await expect(
      harness.application.resendWebhook({ context: MATCHING_CONTEXT, syncId: 'sync_a' })
    ).resolves.toEqual({ resent: true })

    expect(harness.calls.findSyncOwnership).toHaveBeenCalledTimes(1)
    expect(harness.calls.getSyncDetail).toHaveBeenCalledWith({ siteId: 'site_a', syncId: 'sync_a' })
    expect(harness.calls.getWebhookDispatchConfig).toHaveBeenCalledWith({ siteId: 'site_a' })
    expect(harness.webhookPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ syncId: 'sync_a', siteId: 'site_a' })
    )
    expect(harness.calls.recordWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ syncId: 'sync_a', siteId: 'site_a', tenantId: 'tenant_a' })
    )
    expect(harness.calls.saveAuditEnvelope).toHaveBeenCalled()

    const factOrder = harness.calls.findSyncOwnership.mock.invocationCallOrder[0]
    expect(factOrder).toBeLessThan(harness.calls.getSyncDetail.mock.invocationCallOrder[0])
    expect(factOrder).toBeLessThan(harness.webhookPublisher.publish.mock.invocationCallOrder[0])
    expect(factOrder).toBeLessThan(harness.calls.recordWebhookDelivery.mock.invocationCallOrder[0])
    expect(factOrder).toBeLessThan(harness.calls.saveAuditEnvelope.mock.invocationCallOrder[0])
  })

  it.each([
    [
      'a foreign tenant',
      { syncId: 'sync_foreign', siteId: 'site_foreign', tenantId: 'tenant_foreign' },
      ACCESS_DENIED.code
    ],
    ['a missing sync', null, 'HTTP_NOT_FOUND']
  ])('blocks resend for %s before detail, HTTP, delivery, or audit', async (_, fact, code) => {
    const harness = createHarness()
    harness.calls.findSyncOwnership.mockResolvedValue(fact)

    const error = await harness.application
      .resendWebhook({ context: MATCHING_CONTEXT, syncId: 'sync_other' })
      .catch((caught: unknown) => caught)

    if (code === ACCESS_DENIED.code) {
      expectAccessDenied(error)
    } else {
      expect(error).toBeInstanceOf(NotFoundException)
    }
    expectNoSyncEffects(harness)
  })

  it('authenticates before validating a malformed resend id', async () => {
    const harness = createHarness()

    const error = await harness.application
      .resendWebhook({ context: { operatorId: 'operator_a' }, syncId: '   ' })
      .catch((caught: unknown) => caught)

    expectUnauthenticated(error)
    expect(harness.calls.findSyncOwnership).not.toHaveBeenCalled()
    expectNoSyncEffects(harness)
  })

  it('returns NOT_FOUND when the scoped resend detail disappears before dispatch', async () => {
    const harness = createHarness()
    harness.calls.getSyncDetail.mockResolvedValue(null)

    await expect(
      harness.application.resendWebhook({ context: MATCHING_CONTEXT, syncId: 'sync_a' })
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(harness.webhookPublisher.publish).not.toHaveBeenCalled()
    expect(harness.calls.recordWebhookDelivery).not.toHaveBeenCalled()
    expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
  })

  it('stores only an allowlisted failure reason when the publisher error contains hostile details', async () => {
    const harness = createHarness()
    const hostileDetails = [
      'https://attacker.invalid/private',
      'body_secret',
      'credential_from_body',
      'sync_from_body'
    ]
    harness.webhookPublisher.publish.mockRejectedValue(new Error(hostileDetails.join(' ')))

    await expect(
      harness.application.resendWebhook({ context: MATCHING_CONTEXT, syncId: 'sync_a' })
    ).resolves.toEqual({ resent: true })

    expect(harness.calls.recordWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', failureReason: 'webhook dispatch failed' })
    )
    const persisted = JSON.stringify({
      delivery: harness.calls.recordWebhookDelivery.mock.calls,
      audit: harness.calls.saveAuditEnvelope.mock.calls
    })
    for (const detail of hostileDetails) {
      expect(persisted).not.toContain(detail)
    }
  })
})

// Verifies delivery persistence locks the authorized sync tuple before any delivery or audit insert.
describe('Prisma webhook delivery tuple lock', () => {
  it('uses a tuple-scoped FOR UPDATE query before delivery and audit creation', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ syncId: 'sync_a' }])
    const deliveryCreate = jest.fn().mockResolvedValue({})
    const auditCreate = jest.fn().mockResolvedValue({})
    const client = {
      $queryRaw: queryRaw,
      siteSyncBatch: {
        findFirst: jest.fn().mockResolvedValue({ syncId: 'sync_a' })
      },
      siteWebhookDelivery: { create: deliveryCreate },
      siteAuditEnvelope: { create: auditCreate }
    }
    const prisma = {
      runInTransaction: jest.fn().mockImplementation(async (callback) => callback()),
      getExecutionClient: jest.fn(() => client)
    }
    const repository = new PrismaSiteRepository(prisma as never)

    await repository.recordWebhookDelivery({
      deliveryId: 'delivery_a',
      syncId: 'sync_a',
      siteId: 'site_a',
      tenantId: 'tenant_a',
      eventId: 'event_a',
      eventType: 'site.publish.available',
      publishVersion: 7,
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      status: 'dispatched',
      payload: {},
      headers: {},
      resent: true,
      deliveredAt: new Date('2026-07-22T08:00:00.000Z')
    })

    expect(queryRaw).toHaveBeenCalledTimes(1)
    expect(client.siteSyncBatch.findFirst).not.toHaveBeenCalled()
    const query = queryRaw.mock.calls[0][0] as {
      text?: string
      sql?: string
      strings?: string[]
      values?: unknown[]
    }
    const queryText = query.text ?? query.sql ?? query.strings?.join('?') ?? ''
    expect(queryText).toContain('FROM "SiteSyncBatch"')
    expect(queryText).toContain('"syncId"')
    expect(queryText).toContain('"siteId"')
    expect(queryText).toContain('"tenantId"')
    expect(queryText).toContain('FOR UPDATE')
    expect(query.values).toEqual(['sync_a', 'site_a', 'tenant_a'])
    expect(queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      deliveryCreate.mock.invocationCallOrder[0]
    )
    expect(deliveryCreate.mock.invocationCallOrder[0]).toBeLessThan(
      auditCreate.mock.invocationCallOrder[0]
    )
  })
})
