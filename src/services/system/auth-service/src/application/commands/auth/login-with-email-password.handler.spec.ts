import { LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { validate } from 'class-validator'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { LoginWithEmailPasswordCommand } from './login-with-email-password.command'
import { LoginWithEmailPasswordHandler } from './login-with-email-password.handler'

describe('LoginWithEmailPasswordHandler', () => {
  it('allows device context fields through command validation', async () => {
    const errors = await validate(
      new LoginWithEmailPasswordCommand('user@example.com', 'bad-password', {
        deviceName: 'Firefox on macOS',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '127.0.0.1'
      }),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })

  it('resolves the user id before recording a failed login audit event for known email identities', async () => {
    const invalidCredentialsError = ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    const strategy = {
      authenticate: jest.fn().mockRejectedValue(invalidCredentialsError)
    }
    const authStrategyFactory = {
      get: jest.fn().mockReturnValue(strategy)
    }
    const authAuditService = {
      emitLoginBlocked: jest.fn(),
      emitLoginFailed: jest.fn()
    }
    const loginRiskThrottleService = {
      assertPasswordLoginAllowed: jest.fn().mockResolvedValue(undefined),
      recordPasswordLoginFailure: jest.fn().mockResolvedValue(undefined),
      clearPasswordLoginFailures: jest.fn()
    }
    const identityService = {
      getUserByEmail: jest.fn().mockResolvedValue({ userId: 'user-1' }),
      getAvailableAccountsByUserId: jest.fn()
    }
    const handler = new LoginWithEmailPasswordHandler(
      authStrategyFactory as any,
      authAuditService as any,
      loginRiskThrottleService as any,
      identityService as any
    )

    await expect(
      handler.execute(
        new LoginWithEmailPasswordCommand('user@example.com', 'bad-password', {
          userAgent: 'Mozilla/5.0 Firefox/149.0 (Macintosh; Intel Mac OS X 10_15)',
          ipAddress: '127.0.0.1'
        })
      )
    ).rejects.toBe(invalidCredentialsError)

    expect(loginRiskThrottleService.recordPasswordLoginFailure).toHaveBeenCalledWith(
      LoginMethodType.EMAIL,
      'user@example.com'
    )
    expect(identityService.getUserByEmail).toHaveBeenCalledWith('user@example.com')
    expect(authAuditService.emitLoginFailed).toHaveBeenCalledWith(
      'user@example.com',
      'INVALID_CREDENTIALS',
      {
        method: LoginMethodEnum.EmailPassword,
        userId: 'user-1',
        deviceName: 'macOS / Firefox',
        userAgent: 'Mozilla/5.0 Firefox/149.0 (Macintosh; Intel Mac OS X 10_15)',
        ipAddress: '127.0.0.1',
        platform: 'macOS',
        browser: 'Firefox'
      }
    )
  })

  it('returns account selection even when MFA bindings exist because tenant MFA is resolved after account selection', async () => {
    const strategy = {
      authenticate: jest.fn().mockResolvedValue('user-1')
    }
    const authStrategyFactory = {
      get: jest.fn().mockReturnValue(strategy)
    }
    const authAuditService = {
      emitLoginBlocked: jest.fn(),
      emitLoginFailed: jest.fn(),
      emitMfaChallengeCreated: jest.fn()
    }
    const loginRiskThrottleService = {
      assertPasswordLoginAllowed: jest.fn().mockResolvedValue(undefined),
      recordPasswordLoginFailure: jest.fn(),
      clearPasswordLoginFailures: jest.fn().mockResolvedValue(undefined)
    }
    const identityService = {
      getUserByEmail: jest.fn(),
      getAvailableAccountsByUserId: jest.fn().mockResolvedValue([
        {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          tenantName: 'Tenant One',
          scopeLevel: 'TENANT',
          displayName: 'Tenant Account'
        }
      ])
    }
    const handler = new LoginWithEmailPasswordHandler(
      authStrategyFactory as any,
      authAuditService as any,
      loginRiskThrottleService as any,
      identityService as any
    )

    const result = await handler.execute(
      new LoginWithEmailPasswordCommand('user@example.com', 'correct-password')
    )

    expect(result).toEqual({
      userId: 'user-1',
      method: LoginMethodEnum.EmailPassword,
      nextStep: 'ACCOUNT_SELECTION_REQUIRED',
      accounts: [
        {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          tenantName: 'Tenant One',
          scopeLevel: 'TENANT',
          displayName: 'Tenant Account'
        }
      ]
    })
    expect(authAuditService.emitMfaChallengeCreated).not.toHaveBeenCalled()
  })
})
