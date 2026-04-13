import { trace } from '@opentelemetry/api'
import { AuthAuditService } from './auth-audit.service'

describe('AuthAuditService', () => {
  /**
   * withMockedActiveSpan temporarily provides a trace context so auth audit events can be asserted deterministically.
   */
  function withMockedActiveSpan<T>(callback: () => T): T {
    const getActiveSpanSpy = jest.spyOn(trace, 'getActiveSpan').mockReturnValue({
      spanContext: () => ({
        traceId: 'trace-auth-audit',
        spanId: 'span-auth-audit',
        traceFlags: 1
      })
    } as any)

    try {
      return callback()
    } finally {
      getActiveSpanSpy.mockRestore()
    }
  }

  it('should emit auth audit events with trace context', () => {
    const eventEmitter = {
      emit: jest.fn()
    } as any
    const service = new AuthAuditService(eventEmitter)

    withMockedActiveSpan(() => {
      service.emitLoginFailed('user@example.com', 'BAD_CREDENTIALS')
    })

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'auth.audit',
      expect.objectContaining({
        service: 'auth-service',
        eventType: 'LOGIN_FAILED',
        module: 'auth',
        result: 'REJECTED',
        trace: {
          traceId: 'trace-auth-audit',
          spanId: 'span-auth-audit'
        },
        operator: {
          operatorId: null,
          operatorType: 'SYSTEM'
        },
        resource: {
          resourceType: 'login_attempt',
          resourceId: null
        },
        details: {
          identifier: 'user@example.com',
          reason: 'BAD_CREDENTIALS'
        }
      })
    )
  })
})
