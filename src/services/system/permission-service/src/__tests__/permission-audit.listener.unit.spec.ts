import { AppLogger } from '@oes/common/logging'
import { PermissionAuditEvent } from '../application/events/permission-audit.event'
import { PermissionAuditListener } from '../infrastructure/listeners/permission-audit.listener'

describe('PermissionAuditListener', () => {
  it('should persist management audit envelopes and log trace identifiers', async () => {
    const logger = {
      info: jest.fn(),
      error: jest.fn()
    } as unknown as AppLogger
    const repository = {
      appendAudit: jest.fn().mockResolvedValue(undefined)
    } as any
    const listener = new PermissionAuditListener(logger, repository)

    listener.handle(
      new PermissionAuditEvent(
        'event-1',
        'role',
        'ROLE_CREATED',
        new Date('2026-04-08T12:00:00.000Z'),
        'SUCCEEDED',
        {
          operatorId: 'operator-1',
          operatorType: 'HUMAN'
        },
        {
          tenantId: 'tenant-1',
          orgId: null
        },
        {
          traceId: 'trace-permission-audit',
          spanId: 'span-permission-audit'
        },
        {
          resourceType: 'role',
          resourceId: 'role-1'
        },
        {
          targetCode: 'ADMIN'
        }
      )
    )

    await Promise.resolve()

    expect(repository.appendAudit).toHaveBeenCalled()
    expect((logger as any).info).toHaveBeenCalledWith(
      'Permission audit event: ROLE_CREATED',
      expect.objectContaining({
        module: 'permission-service',
        operation: 'permission.audit',
        traceId: 'trace-permission-audit',
        spanId: 'span-permission-audit'
      })
    )
  })
})
