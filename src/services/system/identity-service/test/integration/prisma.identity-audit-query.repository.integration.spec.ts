import { AuditEventResult, AuditOperatorType } from '../../prisma/generated/prisma'
import { PrismaIdentityAuditRepository } from '../../src/infrastructure/repositories/prisma/prisma.identity-audit.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaIdentityAuditRepository list', () => {
  it('应按过滤条件返回审计事件，并支持 cursor 分页', async () => {
    const prisma = await createPrismaForIntegration()
    const repository = new PrismaIdentityAuditRepository(prisma)
    const prefix = createTestPrefix()
    const tenantId = `${prefix}-tenant`
    const operatorId = `${prefix}-operator`
    const resourceId1 = `${prefix}-resource-1`
    const resourceId2 = `${prefix}-resource-2`
    const eventId1 = `${prefix}-event-1`
    const eventId2 = `${prefix}-event-2`
    const eventId3 = `${prefix}-event-3`

    try {
      await prisma.auditEvent.createMany({
        data: [
          {
            eventId: eventId1,
            service: 'identity-service',
            module: 'machine',
            eventType: 'API_KEY_CREATED',
            occurredAt: new Date('2026-04-06T12:02:00.000Z'),
            result: AuditEventResult.SUCCEEDED,
            operatorId,
            operatorType: AuditOperatorType.HUMAN,
            tenantId,
            orgId: null,
            traceId: `${prefix}-trace-1`,
            resourceType: 'api_key',
            resourceId: resourceId1,
            details: { step: 1 }
          },
          {
            eventId: eventId2,
            service: 'identity-service',
            module: 'machine',
            eventType: 'API_KEY_ROTATED',
            occurredAt: new Date('2026-04-06T12:01:00.000Z'),
            result: AuditEventResult.REJECTED,
            operatorId,
            operatorType: AuditOperatorType.HUMAN,
            tenantId,
            orgId: null,
            traceId: `${prefix}-trace-2`,
            resourceType: 'api_key',
            resourceId: resourceId2,
            details: { step: 2 }
          },
          {
            eventId: eventId3,
            service: 'identity-service',
            module: 'contact',
            eventType: 'ACCOUNT_WORK_EMAIL_ASSIGNED',
            occurredAt: new Date('2026-04-06T12:00:00.000Z'),
            result: AuditEventResult.SUCCEEDED,
            operatorId,
            operatorType: AuditOperatorType.HUMAN,
            tenantId,
            orgId: null,
            traceId: `${prefix}-trace-3`,
            resourceType: 'account_contact_asset',
            resourceId: `${prefix}-contact-resource`,
            details: { step: 3 }
          }
        ]
      })

      const firstPage = await repository.list({
        tenantId,
        pageSize: 2
      })

      expect(firstPage.items).toHaveLength(2)
      expect(firstPage.items.map((item) => item.eventId)).toEqual([eventId1, eventId2])
      expect(firstPage.nextCursor).toBeTruthy()

      const secondPage = await repository.list({
        tenantId,
        pageSize: 2,
        cursor: firstPage.nextCursor
      })

      expect(secondPage.items).toHaveLength(1)
      expect(secondPage.items[0]?.eventId).toBe(eventId3)
      expect(secondPage.nextCursor).toBeUndefined()

      const filtered = await repository.list({
        tenantId,
        resourceType: 'api_key',
        result: 'REJECTED',
        pageSize: 10
      })

      expect(filtered.items).toHaveLength(1)
      expect(filtered.items[0]?.eventId).toBe(eventId2)
      expect(filtered.items[0]?.details).toEqual({ step: 2 })
    } finally {
      await cleanupByPrefix(prisma, prefix)
      await prisma.$disconnect()
    }
  })
})
