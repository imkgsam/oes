import { PrismaPermissionAuditRepository } from '../../src/infrastructure/repositories/prisma/prisma.permission-audit.repository'
import {
  createPrismaForIntegration,
  ensureIntegrationDatabaseUrl
} from '../helpers/integration-db'

describe('PrismaPermissionAuditRepository list', () => {
  it('应按过滤条件返回管理审计事件，并支持 cursor 分页', async () => {
    ensureIntegrationDatabaseUrl()
    const prisma = await createPrismaForIntegration()
    const repository = new PrismaPermissionAuditRepository(prisma)
    const prefix = `perm_audit_l2_${Date.now()}`
    const tenantId = '33333333-3333-4333-8333-333333333333'
    const operatorId = '22222222-2222-4222-8222-222222222222'
    const resourceId1 = '44444444-4444-4444-8444-444444444444'
    const resourceId2 = '55555555-5555-4555-8555-555555555555'
    const eventId1 = `${prefix}-1`
    const eventId2 = `${prefix}-2`
    const eventId3 = `${prefix}-3`

    try {
      await prisma.auditEvent.createMany({
        data: [
          {
            id: eventId1,
            service: 'permission-service',
            module: 'role',
            eventType: `${prefix}_ROLE_UPDATED`,
            occurredAt: new Date('2026-04-08T12:02:00.000Z'),
            result: 'SUCCEEDED',
            operatorId,
            operatorType: 'HUMAN',
            tenantId,
            orgId: null,
            traceId: null,
            resourceType: 'role',
            resourceId: resourceId1,
            details: {
              targetCode: `${prefix}.role.admin`,
              beforeData: { version: 1 },
              afterData: { version: 2 },
              metadata: { source: 'integration' }
            },
            createdAt: new Date('2026-04-08T12:02:00.000Z')
          },
          {
            id: eventId2,
            service: 'permission-service',
            module: 'role',
            eventType: `${prefix}_ROLE_DELETED`,
            occurredAt: new Date('2026-04-08T12:01:00.000Z'),
            result: 'SUCCEEDED',
            operatorId,
            operatorType: 'HUMAN',
            tenantId,
            orgId: null,
            traceId: null,
            resourceType: 'role',
            resourceId: resourceId2,
            details: {
              targetCode: `${prefix}.role.viewer`,
              beforeData: { version: 2 },
              afterData: null,
              metadata: { source: 'integration' }
            },
            createdAt: new Date('2026-04-08T12:01:00.000Z')
          },
          {
            id: eventId3,
            service: 'permission-service',
            module: 'permission',
            eventType: `${prefix}_PERMISSION_CREATED`,
            occurredAt: new Date('2026-04-08T12:00:00.000Z'),
            result: 'SUCCEEDED',
            operatorId,
            operatorType: 'HUMAN',
            tenantId,
            orgId: null,
            traceId: null,
            resourceType: 'permission',
            resourceId: '66666666-6666-4666-8666-666666666666',
            details: {
              targetCode: `${prefix}.permission.view`,
              beforeData: null,
              afterData: { code: `${prefix}.permission.view` },
              metadata: { source: 'integration' }
            },
            createdAt: new Date('2026-04-08T12:00:00.000Z')
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

      const filtered = await repository.list({
        tenantId,
        resourceType: 'role',
        resourceId: resourceId2,
        eventType: `${prefix}_ROLE_DELETED`,
        pageSize: 10
      })

      expect(filtered.items).toHaveLength(1)
      expect(filtered.items[0]).toEqual(
        expect.objectContaining({
          eventId: eventId2,
          service: 'permission-service',
          module: 'role',
          eventType: `${prefix}_ROLE_DELETED`,
          result: 'SUCCEEDED',
          operatorId,
          operatorType: 'HUMAN',
          tenantId,
          resourceType: 'role',
          resourceId: resourceId2,
          traceId: undefined,
          details: expect.objectContaining({
            targetCode: `${prefix}.role.viewer`
          })
        })
      )
    } finally {
      await prisma.auditEvent.deleteMany({
        where: {
          eventType: {
            startsWith: prefix
          }
        }
      })
      await prisma.$disconnect()
    }
  })
})
