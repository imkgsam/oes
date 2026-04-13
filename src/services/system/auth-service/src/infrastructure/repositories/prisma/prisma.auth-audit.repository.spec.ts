import { PrismaAuthAuditRepository } from './prisma.auth-audit.repository'

describe('PrismaAuthAuditRepository', () => {
  it('should list auth audit events with shared filters and cursor pagination', async () => {
    const prisma = {
      auditEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'event-auth-1',
            service: 'auth-service',
            module: 'session',
            eventType: 'SESSION_REVOKED',
            occurredAt: new Date('2026-04-08T18:00:00.000Z'),
            result: 'SUCCEEDED',
            operatorId: 'operator-auth-1',
            operatorType: 'HUMAN',
            tenantId: 'tenant-auth-1',
            orgId: null,
            traceId: 'trace-auth-1',
            resourceType: 'session',
            resourceId: 'resource-auth-1',
            details: {
              reason: 'ADMIN_REVOKED'
            }
          },
          {
            id: 'event-auth-0',
            service: 'auth-service',
            module: 'session',
            eventType: 'SESSION_REVOKED',
            occurredAt: new Date('2026-04-08T17:00:00.000Z'),
            result: 'SUCCEEDED',
            operatorId: 'operator-auth-0',
            operatorType: 'HUMAN',
            tenantId: 'tenant-auth-0',
            orgId: null,
            traceId: 'trace-auth-0',
            resourceType: 'session',
            resourceId: 'resource-auth-0',
            details: {}
          }
        ])
      }
    } as any

    const repository = new PrismaAuthAuditRepository(prisma)
    const result = await repository.list({
      service: 'auth-service',
      module: 'session',
      eventType: 'SESSION_REVOKED',
      result: 'SUCCEEDED',
      operatorId: 'operator-auth-1',
      tenantId: 'tenant-auth-1',
      resourceType: 'session',
      resourceId: 'resource-auth-1',
      occurredAtFrom: new Date('2026-04-08T00:00:00.000Z'),
      occurredAtTo: new Date('2026-04-08T23:59:59.000Z'),
      pageSize: 1
    })

    expect(prisma.auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        take: 2
      })
    )
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        eventId: 'event-auth-1',
        service: 'auth-service',
        module: 'session',
        eventType: 'SESSION_REVOKED',
        traceId: 'trace-auth-1',
        details: {
          reason: 'ADMIN_REVOKED'
        }
      })
    )
    expect(result.nextCursor).toBeTruthy()
  })
})
