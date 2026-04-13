import { AppLogger } from '@oes/common/logging'
import { AuthAuditRepository } from '../../domain/repositories/auth-audit.repository'
import { AuthAuditEvent } from '../../application/events/auth-audit.event'
import { AuthAuditListener } from './auth-audit.listener'

describe('AuthAuditListener', () => {
  it('should write trace identifiers into structured auth audit logs', async () => {
    const logger = {
      info: jest.fn(),
      error: jest.fn()
    } as unknown as AppLogger
    const repository = {
      append: jest.fn().mockResolvedValue(undefined)
    } as unknown as AuthAuditRepository
    const listener = new AuthAuditListener(logger, repository as any)

    listener.handle(
      new AuthAuditEvent(
        'event-1',
        'auth',
        'LOGIN_FAILED',
        new Date('2026-04-08T12:00:00.000Z'),
        'REJECTED',
        {
          operatorId: null,
          operatorType: 'SYSTEM'
        },
        {
          tenantId: null,
          orgId: null
        },
        {
          traceId: 'trace-auth-audit',
          spanId: 'span-auth-audit'
        },
        {
          resourceType: 'login_attempt',
          resourceId: null
        },
        {
          identifier: 'user@example.com',
          reason: 'BAD_CREDENTIALS'
        }
      )
    )

    await Promise.resolve()

    expect((repository as any).append).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'auth-service',
        eventType: 'LOGIN_FAILED'
      })
    )

    expect((logger as any).info).toHaveBeenCalledWith(
      'Auth audit event: LOGIN_FAILED',
      expect.objectContaining({
        module: 'auth-service',
        operation: 'auth.audit',
        traceId: 'trace-auth-audit',
        spanId: 'span-auth-audit'
      })
    )
  })
})
