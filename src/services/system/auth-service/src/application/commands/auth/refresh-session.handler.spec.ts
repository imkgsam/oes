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
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: input.userId,
    accountId: input.accountId,
    tenantId: input.tenantId,
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
      trustedDeviceService
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
        passwordSetupRequired: true,
        roles: ['role-system-admin'],
        tokenType: 'access'
      }),
      expect.any(Object)
    )
    expect((jwtService as any).signRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        aid: 'account-1',
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
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      expiresIn: 900
    })
  })
})
