import { status } from '@grpc/grpc-js'
import { TerminalLoginFlow } from '@oes/common/auth'
import { ExceptionDefinition, ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { RequestEmailOtpLoginChallengeCommand } from './request-email-otp-login-challenge.command'
import { RequestEmailOtpLoginChallengeHandler } from './request-email-otp-login-challenge.handler'

const terminalLoginFlowDisabled: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
  message: 'Terminal login flow is disabled for this terminal',
  messageKey: 'auth.terminal_login_flow_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

describe('RequestEmailOtpLoginChallengeHandler', () => {
  it('asserts the terminal email-otp flow before creating a challenge', async () => {
    const emailOtpLoginService = {
      createChallenge: jest.fn().mockResolvedValue({
        challengeId: 'challenge-1',
        expiresAt: new Date('2026-05-16T00:00:00.000Z'),
        destination: 'user@example.com'
      })
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockResolvedValue(undefined)
    }
    const handler = new RequestEmailOtpLoginChallengeHandler(
      emailOtpLoginService as any,
      terminalLoginPolicyService as any
    )

    await handler.execute(new RequestEmailOtpLoginChallengeCommand('user@example.com'))

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'WEB',
      TerminalLoginFlow.EmailOtp
    )
    expect(emailOtpLoginService.createChallenge).toHaveBeenCalledWith('user@example.com')
  })

  it('rejects disabled terminal email-otp flow before OTP send or challenge creation', async () => {
    const disabledError = ExceptionFactory.domain(terminalLoginFlowDisabled)
    const emailOtpLoginService = {
      createChallenge: jest.fn()
    }
    const terminalLoginPolicyService = {
      assertFlowAllowed: jest.fn().mockRejectedValue(disabledError)
    }
    const handler = new RequestEmailOtpLoginChallengeHandler(
      emailOtpLoginService as any,
      terminalLoginPolicyService as any
    )

    await handler
      .execute(new RequestEmailOtpLoginChallengeCommand('user@example.com', 'PDA'))
      .catch((error) => {
        expect((error as OESExceptionBase).getCode()).toBe('AUTH_TERMINAL_LOGIN_FLOW_DISABLED')
      })

    expect(terminalLoginPolicyService.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.EmailOtp
    )
    expect(emailOtpLoginService.createChallenge).not.toHaveBeenCalled()
  })
})
