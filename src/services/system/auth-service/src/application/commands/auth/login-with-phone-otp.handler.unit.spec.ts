import { status } from '@grpc/grpc-js'
import { TerminalLoginFlow } from '@oes/common/auth'
import { LoginMethodEnum } from '@oes/common/constants'
import { ExceptionDefinition, ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { LoginWithPhoneOtpCommand } from './login-with-phone-otp.command'
import { LoginWithPhoneOtpHandler } from './login-with-phone-otp.handler'

const terminalLoginFlowDisabled: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
  message: 'Terminal login flow is disabled for this terminal',
  messageKey: 'auth.terminal_login_flow_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

describe('LoginWithPhoneOtpHandler', () => {
  it('asserts the terminal phone-otp flow before OTP authentication', async () => {
    const phoneOtpLoginService = {
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
    const handler = new LoginWithPhoneOtpHandler(
      phoneOtpLoginService as any,
      { emitLoginFailed: jest.fn() } as any,
      identityService as any,
      { filterActiveAccountCandidates: jest.fn(async (accounts) => accounts) } as any,
      terminalLoginPolicyService as any
    )

    const result = await handler.execute(new LoginWithPhoneOtpCommand('+8613800138000', '123456'))

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'WEB',
      TerminalLoginFlow.PhoneOtp
    )
    expect(phoneOtpLoginService.authenticate).toHaveBeenCalledWith('+8613800138000', '123456')
    expect((result as any).method).toBe(LoginMethodEnum.PhoneOtp)
  })

  it('rejects disabled terminal phone-otp flow before OTP lookup or consume', async () => {
    const disabledError = ExceptionFactory.domain(terminalLoginFlowDisabled)
    const phoneOtpLoginService = {
      authenticate: jest.fn()
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockRejectedValue(disabledError)
    }
    const handler = new LoginWithPhoneOtpHandler(
      phoneOtpLoginService as any,
      { emitLoginFailed: jest.fn() } as any,
      { getAvailableAccountsByUserId: jest.fn() } as any,
      { filterActiveAccountCandidates: jest.fn() } as any,
      terminalLoginPolicyService as any
    )

    await handler
      .execute(new LoginWithPhoneOtpCommand('+8613800138000', '123456', 'PDA'))
      .catch((error) => {
        expect((error as OESExceptionBase).getCode()).toBe('AUTH_TERMINAL_LOGIN_FLOW_DISABLED')
      })

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.PhoneOtp
    )
    expect(phoneOtpLoginService.authenticate).not.toHaveBeenCalled()
  })
})
