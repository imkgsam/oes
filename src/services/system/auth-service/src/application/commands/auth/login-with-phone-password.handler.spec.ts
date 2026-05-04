import { LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { validate } from 'class-validator'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { LoginWithPhonePasswordCommand } from './login-with-phone-password.command'
import { LoginWithPhonePasswordHandler } from './login-with-phone-password.handler'

describe('LoginWithPhonePasswordHandler', () => {
  it('allows device context fields through command validation', async () => {
    const errors = await validate(
      new LoginWithPhonePasswordCommand('+8613800138000', 'bad-password', {
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

  it('resolves the user id before recording a failed login audit event for known phone identities', async () => {
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
      getUserByPhone: jest.fn().mockResolvedValue({ userId: 'user-1' }),
      getAvailableAccountsByUserId: jest.fn()
    }
    const handler = new LoginWithPhonePasswordHandler(
      authStrategyFactory as any,
      authAuditService as any,
      loginRiskThrottleService as any,
      identityService as any,
      { filterActiveAccountCandidates: jest.fn() } as any
    )

    await expect(
      handler.execute(
        new LoginWithPhonePasswordCommand('+8613800138000', 'bad-password', {
          userAgent: 'Mozilla/5.0 Firefox/149.0 (Macintosh; Intel Mac OS X 10_15)',
          ipAddress: '127.0.0.1'
        })
      )
    ).rejects.toBe(invalidCredentialsError)

    expect(loginRiskThrottleService.recordPasswordLoginFailure).toHaveBeenCalledWith(
      LoginMethodType.PHONE,
      '+8613800138000'
    )
    expect(identityService.getUserByPhone).toHaveBeenCalledWith('+8613800138000')
    expect(authAuditService.emitLoginFailed).toHaveBeenCalledWith(
      '+8613800138000',
      'INVALID_CREDENTIALS',
      {
        method: LoginMethodEnum.PhonePassword,
        userId: 'user-1',
        deviceName: 'macOS / Firefox',
        userAgent: 'Mozilla/5.0 Firefox/149.0 (Macintosh; Intel Mac OS X 10_15)',
        ipAddress: '127.0.0.1',
        platform: 'macOS',
        browser: 'Firefox'
      }
    )
  })
})
