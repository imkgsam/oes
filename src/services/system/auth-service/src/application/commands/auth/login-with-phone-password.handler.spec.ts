import { status } from '@grpc/grpc-js'
import { TerminalLoginFlow } from '@oes/common/auth'
import { LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionDefinition, ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { validate } from 'class-validator'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { LoginWithPhonePasswordCommand } from './login-with-phone-password.command'
import { LoginWithPhonePasswordHandler } from './login-with-phone-password.handler'

const terminalLoginFlowDisabled: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
  message: 'Terminal login flow is disabled for this terminal',
  messageKey: 'auth.terminal_login_flow_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

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
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockResolvedValue(undefined)
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
      { filterActiveAccountCandidates: jest.fn() } as any,
      terminalLoginPolicyService as any
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
    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'WEB',
      TerminalLoginFlow.PhonePassword
    )
  })

  it('rejects disabled terminal phone-password flow before throttling or strategy lookup', async () => {
    const disabledError = ExceptionFactory.domain(terminalLoginFlowDisabled)
    const authStrategyFactory = {
      get: jest.fn()
    }
    const loginRiskThrottleService = {
      assertPasswordLoginAllowed: jest.fn(),
      recordPasswordLoginFailure: jest.fn(),
      clearPasswordLoginFailures: jest.fn()
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockRejectedValue(disabledError)
    }
    const handler = new LoginWithPhonePasswordHandler(
      authStrategyFactory as any,
      { emitLoginBlocked: jest.fn(), emitLoginFailed: jest.fn() } as any,
      loginRiskThrottleService as any,
      { getAvailableAccountsByUserId: jest.fn() } as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      terminalLoginPolicyService as any
    )

    await handler
      .execute(
        new LoginWithPhonePasswordCommand('+8613800138000', 'correct-password', {
          terminal: 'PDA'
        })
      )
      .catch((error) => {
        expect((error as OESExceptionBase).getCode()).toBe('AUTH_TERMINAL_LOGIN_FLOW_DISABLED')
      })

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.PhonePassword
    )
    expect(loginRiskThrottleService.assertPasswordLoginAllowed).not.toHaveBeenCalled()
    expect(authStrategyFactory.get).not.toHaveBeenCalled()
  })

  it('completes PDA phone-password login without returning account selection', async () => {
    const strategy = {
      authenticate: jest.fn().mockResolvedValue('user-1')
    }
    const pdaPrimaryLoginCompletionService = {
      complete: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-bound',
        scopeLevel: 'TENANT',
        terminal: 'PDA',
        allowedTerminals: ['PDA'],
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        passwordSetupRequired: false
      })
    }
    const handler = new LoginWithPhonePasswordHandler(
      { get: jest.fn().mockReturnValue(strategy) } as any,
      { emitLoginBlocked: jest.fn(), emitLoginFailed: jest.fn() } as any,
      {
        assertPasswordLoginAllowed: jest.fn().mockResolvedValue(undefined),
        recordPasswordLoginFailure: jest.fn(),
        clearPasswordLoginFailures: jest.fn().mockResolvedValue(undefined)
      } as any,
      { getAvailableAccountsByUserId: jest.fn() } as any,
      {
        filterActiveAccountCandidates: jest.fn(),
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      { assertFlowAllowed: jest.fn().mockResolvedValue(undefined) } as any,
      pdaPrimaryLoginCompletionService as any
    )

    const result = await handler.execute(
      new LoginWithPhonePasswordCommand('+8613800138000', 'correct-password', {
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'PDA_PHONE_PASSWORD'
      })
    )

    expect(result).toEqual(expect.objectContaining({ status: 'SUCCESS', terminal: 'PDA' }))
    expect(pdaPrimaryLoginCompletionService.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        loginMethod: LoginMethodEnum.PhonePassword,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'PDA_PHONE_PASSWORD'
      })
    )
  })
})
