import { LoginMethodEnum, MfaType } from '@oes/common/constants'
import { SubmitMfaChallengeCommand } from './submit-mfa-challenge.command'
import { SubmitMfaChallengeHandler } from './submit-mfa-challenge.handler'

describe('SubmitMfaChallengeHandler', () => {
  it('establishes the selected account session after MFA succeeds', async () => {
    const loginMfaOrchestrationService = {
      verifySelectedFactor: jest.fn().mockResolvedValue({
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        scopeLevel: 'TENANT',
        loginMethod: LoginMethodEnum.EmailPassword,
        scenario: 'LOGIN',
        tokenType: 'mfa_flow',
        deviceId: 'browser-1',
        deviceName: 'Firefox on macOS',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '127.0.0.1'
      })
    }
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account',
        isEnabled: true
      })
    }
    const accountSessionEstablishmentService = {
      establish: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        sessionId: 'session-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        displayName: 'Tenant Account',
        passwordSetupRequired: false
      })
    }
    const handler = new SubmitMfaChallengeHandler(
      loginMfaOrchestrationService as any,
      identityService as any,
      accountSessionEstablishmentService as any
    )

    const result = await handler.execute(
      new SubmitMfaChallengeCommand(
        'login-mfa-flow-token',
        MfaType.TOTP,
        '123456',
        LoginMethodEnum.EmailPassword,
        undefined,
        true
      )
    )

    expect(loginMfaOrchestrationService.verifySelectedFactor).toHaveBeenCalledWith({
      challengeId: 'login-mfa-flow-token',
      factor: MfaType.TOTP,
      code: '123456',
      factorChallengeId: undefined
    })
    expect(accountSessionEstablishmentService.establish).toHaveBeenCalledWith({
      userId: 'user-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account',
        isEnabled: true
      },
      loginMethod: LoginMethodEnum.EmailPassword,
      currentSessionId: undefined,
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1',
      trustCurrentDevice: true
    })
    expect(result).toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        accountId: 'account-1',
        accessToken: 'access-token'
      })
    )
  })
})
