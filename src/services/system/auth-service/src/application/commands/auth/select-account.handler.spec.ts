import { LoginMethodEnum } from '@oes/common/constants'
import { SelectAccountCommand } from './select-account.command'
import { SelectAccountHandler } from './select-account.handler'

describe('SelectAccountHandler', () => {
  it('replaces the previous context-switch session and preserves the original login method', async () => {
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      {
        establish: jest.fn().mockResolvedValue({
          status: 'SUCCESS',
          userId: 'user-1',
          accountId: 'account-2',
          tenantId: 'tenant-2',
          scopeLevel: 'TENANT',
          sessionId: 'session-next',
          accessToken: 'next-access-token',
          refreshToken: 'next-refresh-token',
          expiresIn: 900,
          displayName: 'Target Account',
          passwordSetupRequired: true
        })
      } as any,
      {
        resolveChallengeForSelectedAccount: jest.fn().mockResolvedValue(null)
      } as any
    )

    const result = await handler.execute(
      new SelectAccountCommand(
        'user-1',
        'account-2',
        LoginMethodEnum.ContextSwitch,
        {
          currentSessionId: 'session-current',
          userAgent: 'Mozilla/5.0 Chrome/123.0',
          ipAddress: '10.0.0.2'
        }
      )
    )

    expect(result).toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        accountId: 'account-2',
        tenantId: 'tenant-2',
        accessToken: 'next-access-token',
        refreshToken: 'next-refresh-token',
        displayName: 'Target Account',
        passwordSetupRequired: true
      })
    )
  })

  it('returns MFA_REQUIRED after account selection when the tenant login policy requires MFA', async () => {
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      {
        establish: jest.fn()
      } as any,
      {
        resolveChallengeForSelectedAccount: jest.fn().mockResolvedValue({
          challengeId: 'login-mfa-flow-token',
          scenario: 'LOGIN',
          defaultFactor: 'EMAIL_OTP',
          availableFactors: [
            { type: 'EMAIL_OTP', label: '邮箱验证码' },
            { type: 'TOTP', label: '认证器 App' }
          ]
        })
      } as any
    )

    const result = await handler.execute(
      new SelectAccountCommand('user-1', 'account-2', LoginMethodEnum.EmailPassword)
    )

    expect(result).toEqual({
      status: 'MFA_REQUIRED',
      userId: 'user-1',
      accountId: 'account-2',
      tenantId: 'tenant-2',
      scopeLevel: 'TENANT',
      displayName: 'Target Account',
      challengeId: 'login-mfa-flow-token',
      scenario: 'LOGIN',
      defaultFactor: 'EMAIL_OTP',
      availableFactors: [
        { type: 'EMAIL_OTP', label: '邮箱验证码' },
        { type: 'TOTP', label: '认证器 App' }
      ],
      passwordSetupRequired: false
    })
  })
})
