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
        details: expect.objectContaining({
          identifier: 'user@example.com',
          reason: 'BAD_CREDENTIALS'
        })
      })
    )
  })

  it('should emit successful login events under the authenticated user id instead of the account id', () => {
    const eventEmitter = {
      emit: jest.fn()
    } as any
    const service = new AuthAuditService(eventEmitter)
    const session = {
      getId: () => 'session-1',
      getUserId: () => 'user-1',
      getAccountId: () => 'account-1',
      getTenantId: () => 'tenant-1',
      getOrgId: () => null,
      getTerminal: () => 'PDA',
      getLoginMethod: () => 'EMAIL_PASSWORD',
      getLoginFlow: () => 'EMPLOYEE_CODE_PIN',
      getTerminalDeviceId: () => 'terminal-device-1',
      getDeviceBoundTenantId: () => 'tenant-1',
      getDeviceInfo: () => ({
        deviceId: 'device-1',
        deviceName: 'MacBook Pro',
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1'
      }),
      getPlatform: () => 'macOS',
      getBrowser: () => 'Firefox'
    } as any

    withMockedActiveSpan(() => {
      service.emitLoginSucceeded(session, 'EMAIL_PASSWORD' as any)
    })

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'auth.audit',
      expect.objectContaining({
        eventType: 'LOGIN_SUCCEEDED',
        operator: expect.objectContaining({
          operatorId: 'user-1',
          operatorType: 'HUMAN'
        }),
        details: expect.objectContaining({
          userId: 'user-1',
          accountId: 'account-1',
          method: 'EMAIL_PASSWORD',
          terminal: 'PDA',
          loginFlow: 'EMPLOYEE_CODE_PIN',
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1'
        })
      })
    )
  })

  it('should attach the resolved user id and login method to failed login audit events when available', () => {
    const eventEmitter = {
      emit: jest.fn()
    } as any
    const service = new AuthAuditService(eventEmitter)

    withMockedActiveSpan(() => {
      service.emitLoginFailed('user@example.com', 'BAD_CREDENTIALS', {
        method: 'EMAIL_PASSWORD',
        userId: 'user-1',
        terminal: 'WEB',
        loginFlow: 'EMAIL_PASSWORD',
        deviceName: 'macOS / Firefox',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '127.0.0.1',
        platform: 'macOS',
        browser: 'Firefox'
      })
    })

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'auth.audit',
      expect.objectContaining({
        eventType: 'LOGIN_FAILED',
        operator: expect.objectContaining({
          operatorId: 'user-1',
          operatorType: 'HUMAN'
        }),
        details: expect.objectContaining({
          identifier: 'user@example.com',
          reason: 'BAD_CREDENTIALS',
          method: 'EMAIL_PASSWORD',
          userId: 'user-1',
          terminal: 'WEB',
          loginFlow: 'EMAIL_PASSWORD',
          deviceName: 'macOS / Firefox',
          userAgent: 'Mozilla/5.0 Firefox/149.0',
          ipAddress: '127.0.0.1',
          platform: 'macOS',
          browser: 'Firefox'
        })
      })
    )
  })

  it('should preserve terminal-device unavailable trace context in cleanup audit events', () => {
    const eventEmitter = {
      emit: jest.fn()
    } as any
    const service = new AuthAuditService(eventEmitter)

    withMockedActiveSpan(() => {
      service.emitTerminalDeviceSessionsRevoked({
        tenantId: 'tenant-1',
        terminalDeviceId: 'terminal-device-1',
        previousStatus: 'ACTIVE',
        newStatus: 'LOST',
        reason: 'lost device',
        sessionIds: ['session-1'],
        traceId: 'trace-terminal-device'
      })
    })

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'auth.audit',
      expect.objectContaining({
        eventType: 'TERMINAL_DEVICE_SESSIONS_REVOKED',
        trace: {
          traceId: 'trace-terminal-device',
          spanId: 'span-auth-audit'
        },
        details: expect.objectContaining({
          terminalDeviceId: 'terminal-device-1',
          newStatus: 'LOST',
          sessionIds: ['session-1']
        })
      })
    )
  })
})
