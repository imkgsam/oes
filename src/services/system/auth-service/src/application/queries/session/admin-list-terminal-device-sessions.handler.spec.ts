import { SessionStatus } from '@oes/common/constants'
import { AuthorizationQueryScopeService } from '../../authorization'
import { AdminUserSessionQueryScopeBuilder } from '../../authorization/query-scope/builders/admin-user-session-query-scope.builder'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AdminListTerminalDeviceSessionsHandler } from './admin-list-terminal-device-sessions.handler'
import { AdminListTerminalDeviceSessionsQuery } from './admin-list-terminal-device-sessions.query'

// Creates a terminal-aware session fixture for managed terminal device session queries.
function createSessionFixture(input: {
  id: string
  tenantId: string
  terminal?: string
  lastActiveAt: string
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: `${input.id}-user`,
    accountId: `${input.id}-account`,
    tenantId: input.tenantId,
    terminal: input.terminal,
    loginFlow: 'EMPLOYEE_CODE_PIN',
    terminalDeviceId: 'terminal-device-1',
    deviceBoundTenantId: input.tenantId,
    refreshToken: `${input.id}-refresh`,
    status: SessionStatus.ACTIVE,
    deviceInfo: {
      deviceId: `${input.id}-device`,
      deviceName: `${input.id}-device-name`,
      userAgent: 'jest',
      ipAddress: '127.0.0.1'
    },
    createdAt: '2026-04-08T00:00:00.000Z',
    lastActiveAt: input.lastActiveAt,
    expiresAt: '2026-04-10T00:00:00.000Z',
    refreshExpiresAt: '2026-04-11T00:00:00.000Z',
    metadata: {
      tenantId: input.tenantId,
      loginMethod: 'EMAIL_PASSWORD'
    },
    isAdminControlled: false
  })
}

describe('AdminListTerminalDeviceSessionsHandler', () => {
  it('lists active terminal device sessions inside the operator tenant scope', async () => {
    const sessionRepository = {
      findActiveByTerminalDeviceId: jest.fn().mockResolvedValue([
        createSessionFixture({
          id: 'session-newer',
          tenantId: 'tenant-a',
          terminal: 'PDA',
          lastActiveAt: '2026-04-08T12:00:00.000Z'
        }),
        createSessionFixture({
          id: 'session-other-tenant',
          tenantId: 'tenant-b',
          terminal: 'PDA',
          lastActiveAt: '2026-04-08T13:00:00.000Z'
        }),
        createSessionFixture({
          id: 'session-other-terminal',
          tenantId: 'tenant-a',
          terminal: 'WEB',
          lastActiveAt: '2026-04-08T14:00:00.000Z'
        })
      ])
    } as any
    const handler = new AdminListTerminalDeviceSessionsHandler(
      sessionRepository,
      new AuthorizationQueryScopeService([new AdminUserSessionQueryScopeBuilder()])
    )

    const result = await handler.execute(
      new AdminListTerminalDeviceSessionsQuery(
        'terminal-device-1',
        {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        },
        'PDA'
      )
    )

    expect(sessionRepository.findActiveByTerminalDeviceId).toHaveBeenCalledWith('terminal-device-1')
    expect(result).toEqual([
      expect.objectContaining({
        sessionId: 'session-newer',
        tenantId: 'tenant-a',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1'
      })
    ])
  })
})
