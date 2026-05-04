import { LoginMethodEnum } from '@oes/common/constants'
import { AccountSessionEstablishmentService } from './account-session-establishment.service'

describe('AccountSessionEstablishmentService', () => {
  it('remembers the tenant device only when the login flow explicitly trusts the current device', async () => {
    const trustedDeviceService = {
      rememberTrustedDevice: jest.fn().mockResolvedValue(undefined)
    }
    const service = new AccountSessionEstablishmentService(
      {
        getAccountAuthorizationSummary: jest.fn().mockResolvedValue({
          roleIds: ['role-1']
        })
      } as any,
      {
        userRequiresPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any,
      {
        signAccessToken: jest.fn().mockReturnValue('access-token'),
        signRefreshToken: jest.fn().mockReturnValue('refresh-token')
      } as any,
      {
        get: jest.fn().mockReturnValue({
          accessTokenValidity: 900,
          refreshTokenValidity: 604800,
          issuer: '',
          audience: ''
        })
      } as any,
      {
        save: jest.fn().mockImplementation(async (session) => session),
        findById: jest.fn().mockResolvedValue(null)
      } as any,
      {
        emitLoginSucceeded: jest.fn()
      } as any,
      trustedDeviceService as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    await service.establish({
      userId: 'user-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account'
      },
      loginMethod: LoginMethodEnum.EmailPassword,
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1',
      trustCurrentDevice: true
    } as any)

    expect(trustedDeviceService.rememberTrustedDevice).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      browser: 'Firefox',
      platform: undefined,
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1'
    })
  })

  it('does not remember the tenant device when the MFA flow did not opt into trust', async () => {
    const trustedDeviceService = {
      rememberTrustedDevice: jest.fn().mockResolvedValue(undefined)
    }
    const service = new AccountSessionEstablishmentService(
      {
        getAccountAuthorizationSummary: jest.fn().mockResolvedValue({
          roleIds: ['role-1']
        })
      } as any,
      {
        userRequiresPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any,
      {
        signAccessToken: jest.fn().mockReturnValue('access-token'),
        signRefreshToken: jest.fn().mockReturnValue('refresh-token')
      } as any,
      {
        get: jest.fn().mockReturnValue({
          accessTokenValidity: 900,
          refreshTokenValidity: 604800,
          issuer: '',
          audience: ''
        })
      } as any,
      {
        save: jest.fn().mockImplementation(async (session) => session),
        findById: jest.fn().mockResolvedValue(null)
      } as any,
      {
        emitLoginSucceeded: jest.fn()
      } as any,
      trustedDeviceService as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    await service.establish({
      userId: 'user-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account'
      },
      loginMethod: LoginMethodEnum.EmailPassword,
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1',
      trustCurrentDevice: false
    } as any)

    expect(trustedDeviceService.rememberTrustedDevice).not.toHaveBeenCalled()
  })
})
