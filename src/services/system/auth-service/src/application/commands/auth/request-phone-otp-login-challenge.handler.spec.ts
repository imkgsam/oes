import { status } from '@grpc/grpc-js'
import { TerminalLoginFlow } from '@oes/common/auth'
import { ExceptionDefinition, ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { RequestPhoneOtpLoginChallengeCommand } from './request-phone-otp-login-challenge.command'
import { RequestPhoneOtpLoginChallengeHandler } from './request-phone-otp-login-challenge.handler'

const terminalLoginFlowDisabled: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
  message: 'Terminal login flow is disabled for this terminal',
  messageKey: 'auth.terminal_login_flow_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

describe('RequestPhoneOtpLoginChallengeHandler', () => {
  it('asserts the terminal phone-otp flow before creating a challenge', async () => {
    const phoneOtpLoginService = {
      createChallenge: jest.fn().mockResolvedValue({
        challengeId: 'challenge-1',
        expiresAt: new Date('2026-05-16T00:00:00.000Z'),
        destination: '+8613800138000'
      })
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockResolvedValue(undefined)
    }
    const handler = new RequestPhoneOtpLoginChallengeHandler(
      phoneOtpLoginService as any,
      terminalLoginPolicyService as any
    )

    await handler.execute(new RequestPhoneOtpLoginChallengeCommand('+8613800138000'))

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'WEB',
      TerminalLoginFlow.PhoneOtp
    )
    expect(phoneOtpLoginService.createChallenge).toHaveBeenCalledWith('+8613800138000')
  })

  it('rejects disabled terminal phone-otp flow before OTP send or challenge creation', async () => {
    const disabledError = ExceptionFactory.domain(terminalLoginFlowDisabled)
    const phoneOtpLoginService = {
      createChallenge: jest.fn()
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockRejectedValue(disabledError)
    }
    const handler = new RequestPhoneOtpLoginChallengeHandler(
      phoneOtpLoginService as any,
      terminalLoginPolicyService as any
    )

    await handler
      .execute(new RequestPhoneOtpLoginChallengeCommand('+8613800138000', 'PDA'))
      .catch((error) => {
        expect((error as OESExceptionBase).getCode()).toBe('AUTH_TERMINAL_LOGIN_FLOW_DISABLED')
      })

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.PhoneOtp
    )
    expect(phoneOtpLoginService.createChallenge).not.toHaveBeenCalled()
  })
})
