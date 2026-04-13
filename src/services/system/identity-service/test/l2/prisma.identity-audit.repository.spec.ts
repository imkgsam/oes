import { IdentityAuditEvent } from '../../src/application/events/identity-audit.event'
import { PrismaIdentityAuditRepository } from '../../src/infrastructure/repositories/prisma/prisma.identity-audit.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaIdentityAuditRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaIdentityAuditRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaIdentityAuditRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('应能持久化统一 envelope 形状的 audit event', async () => {
    const event = new IdentityAuditEvent(
      `${prefix}_evt`,
      'contact',
      'ACCOUNT_WORK_EMAIL_ASSIGNED',
      new Date('2026-03-31T01:00:00.000Z'),
      'SUCCEEDED',
      { operatorId: `${prefix}_operator`, operatorType: 'HUMAN' },
      { tenantId: `${prefix}_tenant`, orgId: null },
      { traceId: `${prefix}_trace` },
      { resourceType: 'account_contact_asset', resourceId: `${prefix}_asset` },
      {
        accountId: `${prefix}_account`,
        assetType: 'WORK_EMAIL',
        assetValue: `${prefix}@corp.local`
      }
    )

    await repository.append(event)

    const saved = await prisma.auditEvent.findUnique({
      where: {
        eventId: `${prefix}_evt`
      }
    })

    expect(saved).toMatchObject({
      eventId: `${prefix}_evt`,
      service: 'identity-service',
      module: 'contact',
      eventType: 'ACCOUNT_WORK_EMAIL_ASSIGNED',
      result: 'SUCCEEDED',
      operatorId: `${prefix}_operator`,
      operatorType: 'HUMAN',
      tenantId: `${prefix}_tenant`,
      traceId: `${prefix}_trace`,
      resourceType: 'account_contact_asset',
      resourceId: `${prefix}_asset`
    })
    expect(saved?.details).toMatchObject({
      accountId: `${prefix}_account`,
      assetType: 'WORK_EMAIL',
      assetValue: `${prefix}@corp.local`
    })
  })
})
