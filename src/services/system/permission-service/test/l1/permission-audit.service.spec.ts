import { trace } from '@opentelemetry/api'
import { PermissionAuditService } from '../../src/application/services/permission-audit.service'

describe('PermissionAuditService', () => {
  /**
   * withMockedActiveSpan injects deterministic trace identifiers for permission audit event assertions.
   */
  function withMockedActiveSpan<T>(callback: () => T): T {
    const getActiveSpanSpy = jest.spyOn(trace, 'getActiveSpan').mockReturnValue({
      spanContext: () => ({
        traceId: 'trace-permission-audit',
        spanId: 'span-permission-audit',
        traceFlags: 1
      })
    } as any)

    try {
      return callback()
    } finally {
      getActiveSpanSpy.mockRestore()
    }
  }

  it('should emit management audit events as permission audit envelopes', () => {
    const repository = {
      appendDecision: jest.fn()
    } as any
    const eventEmitter = {
      emit: jest.fn()
    } as any
    const service = new PermissionAuditService(repository, eventEmitter)

    withMockedActiveSpan(() => {
      service.emitManagementMutation({
        actorId: 'operator-1',
        tenantId: 'tenant-1',
        action: 'ROLE_CREATED',
        targetType: 'ROLE',
        targetId: 'role-1',
        targetCode: 'ADMIN'
      })
    })

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      PermissionAuditService.MANAGEMENT_EVENT_NAME,
      expect.objectContaining({
        service: 'permission-service',
        module: 'role',
        eventType: 'ROLE_CREATED',
        trace: {
          traceId: 'trace-permission-audit',
          spanId: 'span-permission-audit'
        },
        operator: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN'
        }
      })
    )
  })
})
