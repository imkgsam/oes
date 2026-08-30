import { status } from '@grpc/grpc-js'
import { TerminalLoginFlow } from '@oes/common/auth'
import { LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionDefinition, ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { validate } from 'class-validator'
import {
  AUTH_INVALID_CREDENTIALS,
  AUTH_LOGIN_TEMPORARILY_LOCKED
} from '../../../common/constants/exception-enums'
import { LoginWithEmailPasswordCommand } from './login-with-email-password.command'
import { LoginWithEmailPasswordHandler } from './login-with-email-password.handler'

const terminalLoginFlowDisabled: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
  message: 'Terminal login flow is disabled for this terminal',
  messageKey: 'auth.terminal_login_flow_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

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

  it('uses the Auth-owned login method user id when auditing a known email credential failure', async () => {
    const strategy = {
      authenticate: jest.fn().mockResolvedValue({ authenticated: false, auditUserId: 'user-1' })
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
    const legacyGetUserByEmail = jest.fn()
    const identityService = {
      getUserByEmail: legacyGetUserByEmail,
      getAvailableAccountsByUserId: jest.fn()
    }
    const handler = new LoginWithEmailPasswordHandler(
      authStrategyFactory as any,
      authAuditService as any,
      loginRiskThrottleService as any,
      identityService as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      terminalLoginPolicyService as any
    )

    await expect(
      handler.execute(
        new LoginWithEmailPasswordCommand('user@example.com', 'bad-password', {
          userAgent: 'Mozilla/5.0 Firefox/149.0 (Macintosh; Intel Mac OS X 10_15)',
          ipAddress: '127.0.0.1',
          terminal: 'PDA',
          loginFlow: TerminalLoginFlow.Password
        })
      )
    ).rejects.toMatchObject({
      definition: AUTH_INVALID_CREDENTIALS,
      additionalDetails: undefined
    })

    expect(loginRiskThrottleService.recordPasswordLoginFailure).toHaveBeenCalledWith(
      LoginMethodType.EMAIL,
      'user@example.com'
    )
    expect(legacyGetUserByEmail).not.toHaveBeenCalled()
    expect(authAuditService.emitLoginFailed).toHaveBeenCalledWith(
      'user@example.com',
      'INVALID_CREDENTIALS',
      {
        method: LoginMethodEnum.EmailPassword,
        userId: 'user-1',
        terminal: 'PDA',
        loginFlow: TerminalLoginFlow.Password,
        deviceName: 'macOS / Firefox',
        userAgent: 'Mozilla/5.0 Firefox/149.0 (Macintosh; Intel Mac OS X 10_15)',
        ipAddress: '127.0.0.1',
        platform: 'macOS',
        browser: 'Firefox'
      }
    )
    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.Password
    )
  })

  it('preserves uniform invalid credentials when the legacy identity email lookup is unavailable', async () => {
    const legacyIdentityFailure = new Error('legacy identity dependency unavailable')
    const identityService = {
      getUserByEmail: jest.fn().mockRejectedValue(legacyIdentityFailure),
      getAvailableAccountsByUserId: jest.fn()
    }
    const handler = new LoginWithEmailPasswordHandler(
      {
        get: jest.fn().mockReturnValue({
          authenticate: jest.fn().mockResolvedValue({ authenticated: false })
        })
      } as any,
      { emitLoginBlocked: jest.fn(), emitLoginFailed: jest.fn() } as any,
      {
        assertPasswordLoginAllowed: jest.fn().mockResolvedValue(undefined),
        recordPasswordLoginFailure: jest.fn().mockResolvedValue(undefined),
        clearPasswordLoginFailures: jest.fn()
      } as any,
      identityService as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      { assertFlowAllowed: jest.fn().mockResolvedValue(undefined) } as any
    )

    await expect(
      handler.execute(new LoginWithEmailPasswordCommand('unknown@example.com', 'bad-password'))
    ).rejects.toMatchObject({
      definition: AUTH_INVALID_CREDENTIALS,
      additionalDetails: undefined
    })
    expect(identityService.getUserByEmail).not.toHaveBeenCalled()
  })

  it('fails closed without audit fallback when the Auth-owned credential route is unavailable', async () => {
    const ownerFailure = new Error('auth credential repository unavailable')
    const identityService = {
      getUserByEmail: jest.fn(),
      getAvailableAccountsByUserId: jest.fn()
    }
    const authAuditService = { emitLoginBlocked: jest.fn(), emitLoginFailed: jest.fn() }
    const loginRiskThrottleService = {
      assertPasswordLoginAllowed: jest.fn().mockResolvedValue(undefined),
      recordPasswordLoginFailure: jest.fn(),
      clearPasswordLoginFailures: jest.fn()
    }
    const handler = new LoginWithEmailPasswordHandler(
      {
        get: jest.fn().mockReturnValue({ authenticate: jest.fn().mockRejectedValue(ownerFailure) })
      } as any,
      authAuditService as any,
      loginRiskThrottleService as any,
      identityService as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      { assertFlowAllowed: jest.fn().mockResolvedValue(undefined) } as any
    )

    await expect(
      handler.execute(new LoginWithEmailPasswordCommand('user@example.com', 'password'))
    ).rejects.toBe(ownerFailure)
    expect(identityService.getUserByEmail).not.toHaveBeenCalled()
    expect(loginRiskThrottleService.recordPasswordLoginFailure).not.toHaveBeenCalled()
    expect(authAuditService.emitLoginFailed).not.toHaveBeenCalled()
  })

  it('keeps the risk lock boundary ahead of the Auth-owned credential lookup', async () => {
    const lockedError = ExceptionFactory.domain(AUTH_LOGIN_TEMPORARILY_LOCKED)
    const strategy = { authenticate: jest.fn() }
    const authAuditService = { emitLoginBlocked: jest.fn(), emitLoginFailed: jest.fn() }
    const handler = new LoginWithEmailPasswordHandler(
      { get: jest.fn().mockReturnValue(strategy) } as any,
      authAuditService as any,
      {
        assertPasswordLoginAllowed: jest.fn().mockRejectedValue(lockedError),
        recordPasswordLoginFailure: jest.fn(),
        clearPasswordLoginFailures: jest.fn()
      } as any,
      { getAvailableAccountsByUserId: jest.fn() } as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      { assertFlowAllowed: jest.fn().mockResolvedValue(undefined) } as any
    )

    await expect(
      handler.execute(new LoginWithEmailPasswordCommand('user@example.com', 'password'))
    ).rejects.toBe(lockedError)
    expect(strategy.authenticate).not.toHaveBeenCalled()
    expect(authAuditService.emitLoginBlocked).toHaveBeenCalledWith(
      'user@example.com',
      AUTH_LOGIN_TEMPORARILY_LOCKED.code
    )
  })

  it('rejects disabled terminal email-password flow before throttling or strategy lookup', async () => {
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
    const handler = new LoginWithEmailPasswordHandler(
      authStrategyFactory as any,
      { emitLoginBlocked: jest.fn(), emitLoginFailed: jest.fn() } as any,
      loginRiskThrottleService as any,
      { getAvailableAccountsByUserId: jest.fn() } as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      terminalLoginPolicyService as any
    )

    try {
      await handler.execute(
        new LoginWithEmailPasswordCommand('user@example.com', 'correct-password', {
          terminal: 'PDA'
        })
      )
      throw new Error('Expected disabled terminal login flow to reject')
    } catch (error) {
      expect((error as OESExceptionBase).getCode()).toBe('AUTH_TERMINAL_LOGIN_FLOW_DISABLED')
    }

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.EmailPassword
    )
    expect(loginRiskThrottleService.assertPasswordLoginAllowed).not.toHaveBeenCalled()
    expect(authStrategyFactory.get).not.toHaveBeenCalled()
  })

  it('uses the explicit PDA password login flow when enforcing terminal policy', async () => {
    const strategy = {
      authenticate: jest.fn().mockResolvedValue({ authenticated: false })
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockResolvedValue(undefined)
    }
    const handler = new LoginWithEmailPasswordHandler(
      { get: jest.fn().mockReturnValue(strategy) } as any,
      { emitLoginBlocked: jest.fn(), emitLoginFailed: jest.fn() } as any,
      {
        assertPasswordLoginAllowed: jest.fn().mockResolvedValue(undefined),
        recordPasswordLoginFailure: jest.fn().mockResolvedValue(undefined),
        clearPasswordLoginFailures: jest.fn()
      } as any,
      {
        getUserByEmail: jest.fn().mockResolvedValue(null),
        getAvailableAccountsByUserId: jest.fn()
      } as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      terminalLoginPolicyService as any
    )

    await expect(
      handler.execute(
        new LoginWithEmailPasswordCommand('worker@example.com', 'bad-password', {
          terminal: 'PDA',
          loginFlow: TerminalLoginFlow.Password
        })
      )
    ).rejects.toMatchObject({ definition: AUTH_INVALID_CREDENTIALS })

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.Password
    )
  })

  it('returns account selection even when MFA bindings exist because tenant MFA is resolved after account selection', async () => {
    const strategy = {
      authenticate: jest.fn().mockResolvedValue({ authenticated: true, userId: 'user-1' })
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
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockResolvedValue(undefined)
    }
    const identityService = {
      getUserByEmail: jest.fn(),
      getAvailableAccountsByUserId: jest.fn().mockResolvedValue([
        {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Tenant Account'
        }
      ])
    }
    const handler = new LoginWithEmailPasswordHandler(
      authStrategyFactory as any,
      authAuditService as any,
      loginRiskThrottleService as any,
      identityService as any,
      {
        filterActiveAccountCandidates: jest.fn(async (accounts) => accounts)
      } as any,
      terminalLoginPolicyService as any
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
          scopeLevel: 'TENANT',
          displayName: 'Tenant Account'
        }
      ]
    })
    expect(authAuditService.emitMfaChallengeCreated).not.toHaveBeenCalled()
    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'WEB',
      TerminalLoginFlow.EmailPassword
    )
  })

  it('filters account selection candidates through tenant-org lifecycle truth', async () => {
    const strategy = {
      authenticate: jest.fn().mockResolvedValue({ authenticated: true, userId: 'user-1' })
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
      recordPasswordLoginFailure: jest.fn(),
      clearPasswordLoginFailures: jest.fn().mockResolvedValue(undefined)
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockResolvedValue(undefined)
    }
    const accounts = [
      {
        accountId: 'active-account',
        tenantId: 'tenant-active',
        scopeLevel: 'TENANT',
        displayName: 'Active Tenant'
      },
      {
        accountId: 'suspended-account',
        tenantId: 'tenant-suspended',
        scopeLevel: 'TENANT',
        displayName: 'Suspended Tenant'
      }
    ]
    const identityService = {
      getUserByEmail: jest.fn(),
      getAvailableAccountsByUserId: jest.fn().mockResolvedValue(accounts)
    }
    const tenantSessionAccessService = {
      filterActiveAccountCandidates: jest.fn().mockResolvedValue([accounts[0]])
    }
    const handler = new LoginWithEmailPasswordHandler(
      authStrategyFactory as any,
      authAuditService as any,
      loginRiskThrottleService as any,
      identityService as any,
      tenantSessionAccessService as any,
      terminalLoginPolicyService as any
    )

    const result = await handler.execute(
      new LoginWithEmailPasswordCommand('user@example.com', 'correct-password')
    )

    expect(tenantSessionAccessService.filterActiveAccountCandidates).toHaveBeenCalledWith(accounts)
    expect((result as any).accounts).toEqual([accounts[0]])
  })

  it('completes PDA email-password login without returning account selection', async () => {
    const strategy = {
      authenticate: jest.fn().mockResolvedValue({ authenticated: true, userId: 'user-1' })
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
    const handler = new LoginWithEmailPasswordHandler(
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
      new LoginWithEmailPasswordCommand('user@example.com', 'correct-password', {
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: TerminalLoginFlow.Password,
        deviceName: 'PDA-001'
      })
    )

    expect(result).toEqual(expect.objectContaining({ status: 'SUCCESS', terminal: 'PDA' }))
    expect(pdaPrimaryLoginCompletionService.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        loginMethod: LoginMethodEnum.EmailPassword,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: TerminalLoginFlow.Password
      })
    )
  })
})
