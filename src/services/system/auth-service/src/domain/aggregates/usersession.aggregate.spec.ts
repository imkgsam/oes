import { SessionStatus } from '@oes/common/constants'
import { Session, SessionConfig } from './usersession.aggregate'

const sessionConfig: SessionConfig = {
  accessTokenExpiry: 900,
  refreshTokenExpiry: 604800,
  maxSessionsPerUser: 0,
  enableAutoRenewal: true,
  enableDeviceTracking: true
}

describe('Session aggregate terminal-aware metadata', () => {
  it('creates a WEB session with terminal and login flow metadata', () => {
    const session = Session.createSession({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      terminal: 'WEB',
      loginFlow: 'EMAIL_PASSWORD',
      deviceInfo: {
        deviceId: 'browser-1',
        deviceName: 'Firefox on macOS',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '127.0.0.1'
      },
      config: sessionConfig,
      metadata: {
        loginMethod: 'email-password'
      }
    })

    expect(session.getTerminal()).toBe('WEB')
    expect(session.getLoginFlow()).toBe('EMAIL_PASSWORD')
    expect(session.getUserId()).toBe('user-1')
    expect(session.getAccountId()).toBe('account-1')
    expect(session.getTenantId()).toBe('tenant-1')
  })

  it('creates a PDA session with terminal device binding metadata', () => {
    const session = Session.createSession({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      terminal: 'PDA',
      loginFlow: 'EMPLOYEE_CODE_PIN',
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-1',
      deviceInfo: {
        deviceId: 'pda-browser-1',
        deviceName: 'Warehouse PDA',
        userAgent: 'OES-PDA/1.0',
        ipAddress: '127.0.0.1'
      },
      config: sessionConfig
    })

    expect(session.getTerminal()).toBe('PDA')
    expect(session.getLoginFlow()).toBe('EMPLOYEE_CODE_PIN')
    expect(session.getTerminalDeviceId()).toBe('terminal-device-1')
    expect(session.getDeviceBoundTenantId()).toBe('tenant-1')
  })

  it('deserializes old Redis sessions without terminal-aware fields', () => {
    const session = Session.fromRedis({
      id: 'session-old',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      refreshToken: 'refresh-token',
      status: SessionStatus.ACTIVE,
      deviceInfo: {
        deviceId: 'browser-1',
        deviceName: 'Firefox',
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1'
      },
      createdAt: '2026-04-17T08:00:00.000Z',
      lastActiveAt: '2026-04-17T08:00:00.000Z',
      expiresAt: '2026-04-17T08:15:00.000Z',
      refreshExpiresAt: '2026-04-24T08:00:00.000Z',
      metadata: {
        loginMethod: 'email-password'
      }
    })

    expect(session.getTerminal()).toBe('WEB')
    expect(session.getLoginFlow()).toBe('email-password')
    expect(session.getTerminalDeviceId()).toBeUndefined()
    expect(session.getDeviceBoundTenantId()).toBeUndefined()
  })
})
