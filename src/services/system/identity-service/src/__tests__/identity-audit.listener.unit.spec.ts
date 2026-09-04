import { IdentityAuditEvent } from '../application/events/identity-audit.event'
import { IdentityAuditListener } from '../infrastructure/listeners/identity-audit.listener'

describe('identity audit listener', () => {
  it('应持久化 audit event 并输出结构化日志', async () => {
    const logger = {
      info: jest.fn(),
      error: jest.fn()
    } as any
    const repository = {
      append: jest.fn().mockResolvedValue(undefined)
    } as any
    const listener = new IdentityAuditListener(logger, repository)

    const event = new IdentityAuditEvent(
      'evt-1',
      'machine',
      'API_KEY_AUTHENTICATED',
      new Date('2026-03-31T00:00:00.000Z'),
      'SUCCEEDED',
      { operatorId: null, operatorType: 'SYSTEM' },
      { tenantId: 'tenant-1', orgId: null },
      { traceId: 'trace-1' },
      { resourceType: 'api_key', resourceId: 'key-1' },
      { apiKeyId: 'key-1', serviceAccountId: 'svc-1' }
    )

    listener.handle(event)

    await new Promise((resolve) => setImmediate(resolve))

    expect(repository.append).toHaveBeenCalledWith(event)
    expect(logger.info).toHaveBeenCalledWith(
      'Identity audit event: API_KEY_AUTHENTICATED',
      expect.objectContaining({
        operation: 'identity.audit',
        details: expect.objectContaining({
          eventId: 'evt-1',
          service: 'identity-service',
          eventType: 'API_KEY_AUTHENTICATED'
        })
      })
    )
    expect(logger.error).not.toHaveBeenCalled()
  })
})
