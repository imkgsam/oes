import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { CommonJwtService } from '@oes/common/auth'
import { LoginMethodEnum, SessionStatus } from '@oes/common/constants'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AuthAuditService } from '../../services/auth-audit.service'
import { PasswordSetupRequirementService } from '../../services/password-setup-requirement.service'
import { TrustedDeviceService } from '../../services/trusted-device.service'
import { RefreshSessionCommand } from './refresh-session.command'
import { RefreshSessionHandler } from './refresh-session.handler'

// Creates a persisted session fixture for refresh-token rotation tests.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId?: string
  refreshToken: string
  terminal?: string
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: input.userId,
    accountId: input.accountId,
    tenantId: input.tenantId,
    terminal: input.terminal,
    refreshToken: input.refreshToken,
    status: SessionStatus.ACTIVE,
    deviceInfo: {
      deviceId: `${input.id}-device`,
      deviceName: `${input.id}-device-name`,
      userAgent: 'Mozilla/5.0 Chrome/123.0',
      ipAddress: '127.0.0.1'
    },
    createdAt: '2099-04-08T00:00:00.000Z',
    lastActiveAt: '2099-04-08T12:00:00.000Z',
    expiresAt: '2099-04-10T00:00:00.000Z',
    refreshExpiresAt: '2099-04-11T00:00:00.000Z',
    metadata: {
      loginMethod: LoginMethodEnum.EmailPassword,
      scopeLevel: input.tenantId ? 'TENANT' : 'SYSTEM'
    },
    isAdminControlled: false
  })
}

describe('RefreshSessionHandler', () => {
  it('rejects refresh and deletes the session when terminal access is no longer allowed', async () => {
    const existingRefreshToken = 'refresh-token-terminal-denied'
    const session = createSessionFixture({
      id: 'session-terminal-denied',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      refreshToken: existingRefreshToken,
      terminal: 'PDA'
    })
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sid: 'session-terminal-denied',
        tokenType: 'refresh'
      }),
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn()
    } as unknown as CommonJwtService
    const permissionService = {
      resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
        allowed: false,
        reasonCode: 'TERMINAL_ACCESS_DENIED',
        effectiveAllowedTerminals: ['WEB'],
        resolutionSource: 'ACCOUNT_OVERRIDE',
        matchedRoleIds: []
      }),
      getAccountAuthorizationSummary: jest.fn()
    }
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(session),
      findByRefreshToken: jest.fn().mockResolvedValue(session),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined)
    }
    const handler = new RefreshSessionHandler(
      jwtService,
      { get: jest.fn().mockReturnValue({}) } as unknown as ConfigService,
      permissionService as any,
      {
        userRequiresPasswordSetup: jest.fn()
      } as unknown as PasswordSetupRequirementService,
      sessionRepository as any,
      new AuthAuditService({ emit: jest.fn() } as unknown as EventEmitter2),
      {
        markTrustedDeviceSeen: jest.fn()
      } as unknown as TrustedDeviceService,
      {
        assertSessionCanContinue: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    await expect(handler.execute(new RefreshSessionCommand(existingRefreshToken))).rejects.toThrow(
      'Terminal access denied'
    )

    expect(permissionService.resolveAccountTerminalAccess).toHaveBeenCalledWith({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      terminal: 'PDA'
    })
    expect(sessionRepository.delete).toHaveBeenCalledWith('session-terminal-denied')
    expect(sessionRepository.save).not.toHaveBeenCalled()
    expect((jwtService as any).signAccessToken).not.toHaveBeenCalled()
  })

  it('rejects refresh for a tenant-scope session when the tenant is no longer active', async () => {
    const existingRefreshToken = 'refresh-token-tenant'
    const session = createSessionFixture({
      id: 'session-tenant',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      refreshToken: existingRefreshToken
    })
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sid: 'session-tenant',
        tokenType: 'refresh'
      }),
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn()
    } as unknown as CommonJwtService
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(session),
      findByRefreshToken: jest.fn().mockResolvedValue(session),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined)
    }
    const tenantSessionAccessService = {
      assertSessionCanContinue: jest.fn().mockRejectedValue(new Error('tenant inactive'))
    }
    const handler = new RefreshSessionHandler(
      jwtService,
      { get: jest.fn().mockReturnValue({}) } as unknown as ConfigService,
      {
        getAccountAuthorizationSummary: jest.fn(),
        resolveAccountTerminalAccess: jest.fn()
      } as any,
      {
        userRequiresPasswordSetup: jest.fn()
      } as unknown as PasswordSetupRequirementService,
      sessionRepository as any,
      new AuthAuditService({ emit: jest.fn() } as unknown as EventEmitter2),
      {
        markTrustedDeviceSeen: jest.fn()
      } as unknown as TrustedDeviceService,
      tenantSessionAccessService as any
    )

    await expect(handler.execute(new RefreshSessionCommand(existingRefreshToken))).rejects.toThrow(
      'tenant inactive'
    )

    expect(tenantSessionAccessService.assertSessionCanContinue).toHaveBeenCalledWith({
      sessionId: 'session-tenant',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    expect(sessionRepository.delete).toHaveBeenCalledWith('session-tenant')
    expect(sessionRepository.save).not.toHaveBeenCalled()
    expect((jwtService as any).signAccessToken).not.toHaveBeenCalled()
  })

  it('reissues access and refresh tokens with role ids resolved from permission-service', async () => {
    const existingRefreshToken = 'refresh-token-1'
    const session = createSessionFixture({
      id: 'session-1',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: undefined,
      refreshToken: existingRefreshToken
    })

    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sid: 'session-1',
        tokenType: 'refresh'
      }),
      signAccessToken: jest.fn().mockReturnValue('next-access-token'),
      signRefreshToken: jest.fn().mockReturnValue('next-refresh-token')
    } as unknown as CommonJwtService
    const configService = {
      get: jest.fn().mockReturnValue({
        accessTokenValidity: 900,
        refreshTokenValidity: 604800,
        issuer: 'oes',
        audience: 'tenant-web'
      })
    } as unknown as ConfigService
    const permissionService = {
      resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
        allowed: true,
        reasonCode: 'ALLOWED',
        effectiveAllowedTerminals: ['WEB'],
        resolutionSource: 'ROLE_UNION',
        matchedRoleIds: ['role-system-admin']
      }),
      getAccountAuthorizationSummary: jest.fn().mockResolvedValue({
        accountId: 'account-1',
        roleIds: ['role-system-admin'],
        roleCodes: ['system.admin'],
        permissionCodes: ['auth.session.admin.view']
      })
    }
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(session),
      findByRefreshToken: jest.fn().mockResolvedValue(session),
      save: jest.fn().mockImplementation(async (savedSession: Session) => savedSession),
      delete: jest.fn().mockResolvedValue(undefined)
    }
    const authAuditService = new AuthAuditService({
      emit: jest.fn()
    } as unknown as EventEmitter2)
    const emitSessionRefreshedSpy = jest.spyOn(authAuditService, 'emitSessionRefreshed')
    const trustedDeviceService = {
      markTrustedDeviceSeen: jest.fn().mockResolvedValue(undefined)
    } as unknown as TrustedDeviceService

    const handler = new RefreshSessionHandler(
      jwtService,
      configService,
      permissionService as any,
      {
        userRequiresPasswordSetup: jest.fn().mockResolvedValue(true)
      } as unknown as PasswordSetupRequirementService,
      sessionRepository as any,
      authAuditService,
      trustedDeviceService,
      {
        assertSessionCanContinue: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    const result = await handler.execute(new RefreshSessionCommand(existingRefreshToken))

    expect(permissionService.getAccountAuthorizationSummary).toHaveBeenCalledWith({
      accountId: 'account-1',
      tenantId: undefined,
      scopeLevel: 'SYSTEM'
    })
    expect((jwtService as any).signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        aid: 'account-1',
        terminal: 'WEB',
        allowedTerminals: ['WEB'],
        passwordSetupRequired: true,
        roles: ['role-system-admin'],
        tokenType: 'access'
      }),
      expect.any(Object)
    )
    expect((jwtService as any).signRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        aid: 'account-1',
        terminal: 'WEB',
        allowedTerminals: ['WEB'],
        passwordSetupRequired: true,
        roles: ['role-system-admin'],
        tokenType: 'refresh'
      }),
      expect.any(Object)
    )
    expect(sessionRepository.save).toHaveBeenCalledTimes(1)
    expect(trustedDeviceService.markTrustedDeviceSeen).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeLevel: 'SYSTEM',
      tenantId: undefined,
      deviceId: 'session-1-device',
      deviceName: 'session-1-device-name',
      userAgent: 'Mozilla/5.0 Chrome/123.0',
      ipAddress: '127.0.0.1',
      observedAt: session.getLastActiveAt()
    })
    expect(emitSessionRefreshedSpy).toHaveBeenCalledWith(expect.any(Session))
    expect(result).toEqual({
      sessionId: 'session-1',
      terminal: 'WEB',
      allowedTerminals: ['WEB'],
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      expiresIn: 900
    })
  })
})
