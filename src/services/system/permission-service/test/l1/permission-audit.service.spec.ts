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

  it('emits issuance decisions with exact binding evidence and no credential plaintext', () => {
    const eventEmitter = { emit: jest.fn() } as any
    const service = new PermissionAuditService({} as any, eventEmitter)

    service.emitIssuanceDecision({
      decisionType: 'PRINCIPAL_AUTHORIZATION',
      decisionReference: 'principal-authorization:1',
      allowed: false,
      reasonCode: 'AUTHORIZATION_PERMISSION_DENIED',
      principalType: 'HUMAN',
      principalId: 'human-1',
      tenantId: 'tenant-1',
      directWorkloadSpiffeId: 'spiffe://local.test/auth-service',
      certificateThumbprint: 'certificate-thumbprint',
      targetAudience: 'urn:oes:service:inventory-service',
      requestedPermissionCodes: ['inventory.read'],
      grantedPermissionCodes: [],
      deniedPermissionCodes: ['inventory.read'],
      policyDecisionReference: 'grant-decision-1',
      authzVersion: 'grant-v1',
      requestId: 'request-1',
      traceId: 'trace-1'
    })

    const event = eventEmitter.emit.mock.calls[0][1]
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      PermissionAuditService.MANAGEMENT_EVENT_NAME,
      expect.objectContaining({
        module: 'authorization',
        eventType: 'PRINCIPAL_AUTHORIZATION_RESOLVED',
        result: 'REJECTED',
        operator: {
          operatorId: 'human-1',
          operatorType: 'HUMAN'
        },
        scope: { tenantId: 'tenant-1', orgId: null },
        trace: expect.objectContaining({ traceId: 'trace-1' }),
        details: expect.objectContaining({
          decisionReference: 'principal-authorization:1',
          targetAudience: 'urn:oes:service:inventory-service',
          requestedPermissionCodes: ['inventory.read'],
          certificateThumbprint: 'certificate-thumbprint'
        })
      })
    )
    expect(JSON.stringify(event)).not.toContain('Bearer ')
    expect(JSON.stringify(event)).not.toContain('accessToken')
  })
})
