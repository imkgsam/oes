import { PrismaAuthAuditRepository } from './prisma.auth-audit.repository'

describe('PrismaAuthAuditRepository', () => {
  it.each([
    ['SYSTEM', undefined],
    ['TENANT', 'tenant-1']
  ] as const)(
    'durably records %s subject scope, optional tenant, correlation and actor attribution',
    async (subjectScope, tenantId) => {
      const prisma = { auditEvent: { create: jest.fn().mockResolvedValue({}) } } as any
      const repository = new PrismaAuthAuditRepository(prisma)

      await repository.appendOboLink({
        sourceTokenId: 'subject-jti',
        targetTokenId: 'target-jti',
        subject: 'account-1',
        subjectScope,
        ...(tenantId === undefined ? {} : { tenantId }),
        actor: { sub: 'machine-mes', principal_type: 'MACHINE', scope_level: 'SYSTEM' },
        workload: 'spiffe://oes/mes-service',
        audience: 'urn:oes:service:item-master-service',
        decisionReference: 'decision-1',
        requestId: 'request-1',
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7'
      })

      const data = prisma.auditEvent.create.mock.calls[0][0].data
      expect(data).toEqual(
        expect.objectContaining({
          service: 'auth-service',
          module: 'auth',
          eventType: 'EXECUTION_TOKEN_OBO_ISSUED',
          result: 'SUCCEEDED',
          operatorId: 'account-1',
          tenantId,
          traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
          resourceId: 'target-jti',
          details: {
            sourceTokenId: 'subject-jti',
            subjectScope,
            actor: { sub: 'machine-mes', principal_type: 'MACHINE', scope_level: 'SYSTEM' },
            workload: 'spiffe://oes/mes-service',
            audience: 'urn:oes:service:item-master-service',
            decisionReference: 'decision-1',
            requestId: 'request-1'
          }
        })
      )
      expect(JSON.stringify(data)).not.toContain('Bearer')
    }
  )

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
