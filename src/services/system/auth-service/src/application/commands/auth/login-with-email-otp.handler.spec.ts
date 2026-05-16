import { status } from '@grpc/grpc-js'
import { TerminalLoginFlow } from '@oes/common/auth'
import { LoginMethodEnum } from '@oes/common/constants'
import { ExceptionDefinition, ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { LoginWithEmailOtpCommand } from './login-with-email-otp.command'
import { LoginWithEmailOtpHandler } from './login-with-email-otp.handler'

const terminalLoginFlowDisabled: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
  message: 'Terminal login flow is disabled for this terminal',
  messageKey: 'auth.terminal_login_flow_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

describe('LoginWithEmailOtpHandler', () => {
  it('asserts the terminal email-otp flow before OTP authentication', async () => {
    const emailOtpLoginService = {
      authenticate: jest.fn().mockResolvedValue('user-1')
    }
    const identityService = {
      getAvailableAccountsByUserId: jest.fn().mockResolvedValue([
        {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Tenant Account'
        }
      ])
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockResolvedValue(undefined)
    }
    const handler = new LoginWithEmailOtpHandler(
      emailOtpLoginService as any,
      { emitLoginFailed: jest.fn() } as any,
      identityService as any,
      { filterActiveAccountCandidates: jest.fn(async (accounts) => accounts) } as any,
      terminalLoginPolicyService as any
    )

    const result = await handler.execute(new LoginWithEmailOtpCommand('user@example.com', '123456'))

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'WEB',
      TerminalLoginFlow.EmailOtp
    )
    expect(emailOtpLoginService.authenticate).toHaveBeenCalledWith('user@example.com', '123456')
    expect((result as any).method).toBe(LoginMethodEnum.EmailOtp)
  })

  it('rejects disabled terminal email-otp flow before OTP lookup or consume', async () => {
    const disabledError = ExceptionFactory.domain(terminalLoginFlowDisabled)
    const emailOtpLoginService = {
      authenticate: jest.fn()
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockRejectedValue(disabledError)
    }
    const handler = new LoginWithEmailOtpHandler(
      emailOtpLoginService as any,
      { emitLoginFailed: jest.fn() } as any,
      { getAvailableAccountsByUserId: jest.fn() } as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      terminalLoginPolicyService as any
    )

    await handler
      .execute(new LoginWithEmailOtpCommand('user@example.com', '123456', 'PDA'))
      .catch((error) => {
        expect((error as OESExceptionBase).getCode()).toBe('AUTH_TERMINAL_LOGIN_FLOW_DISABLED')
      })

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.EmailOtp
    )
    expect(emailOtpLoginService.authenticate).not.toHaveBeenCalled()
  })

  it('completes PDA email-otp login without returning account selection', async () => {
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
    const handler = new LoginWithEmailOtpHandler(
      { authenticate: jest.fn().mockResolvedValue('user-1') } as any,
      { emitLoginFailed: jest.fn() } as any,
      { getAvailableAccountsByUserId: jest.fn() } as any,
      {
        filterActiveAccountCandidates: jest.fn(),
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      { assertFlowAllowed: jest.fn().mockResolvedValue(undefined) } as any,
      pdaPrimaryLoginCompletionService as any
    )

    const result = await handler.execute(
      new LoginWithEmailOtpCommand('user@example.com', '123456', {
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'PDA_EMAIL_OTP'
      })
    )

    expect(result).toEqual(expect.objectContaining({ status: 'SUCCESS', terminal: 'PDA' }))
    expect(pdaPrimaryLoginCompletionService.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        loginMethod: LoginMethodEnum.EmailOtp,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'PDA_EMAIL_OTP'
      })
    )
  })
})
