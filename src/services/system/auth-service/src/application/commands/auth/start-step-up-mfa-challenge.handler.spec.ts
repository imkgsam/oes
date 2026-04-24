import { MfaType } from '@oes/common/constants'
import { StartStepUpMfaChallengeCommand } from './start-step-up-mfa-challenge.command'
import { StartStepUpMfaChallengeHandler } from './start-step-up-mfa-challenge.handler'

describe('StartStepUpMfaChallengeHandler', () => {
  it('returns one required challenge when the tenant policy protects the requested scenario', async () => {
    const loginMfaOrchestrationService = {
      resolveChallengeForAccount: jest.fn().mockResolvedValue({
        challengeId: 'step-up-flow-token',
        scenario: 'CHANGE_PASSWORD',
        defaultFactor: MfaType.TOTP,
        availableFactors: [
          { type: MfaType.TOTP, label: '认证器 App', priority: 1 },
          { type: MfaType.EMAIL_OTP, label: '邮箱验证码', priority: 2 }
        ]
      })
    }

    const handler = new StartStepUpMfaChallengeHandler(
      loginMfaOrchestrationService as any
    )

    const result = await handler.execute(
      new StartStepUpMfaChallengeCommand(
        'user-1',
        'account-1',
        'tenant-1',
        'TENANT',
        'CHANGE_PASSWORD'
      )
    )

    expect(loginMfaOrchestrationService.resolveChallengeForAccount).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      scenario: 'CHANGE_PASSWORD'
    })
    expect(result).toEqual({
      required: true,
      challengeId: 'step-up-flow-token',
      scenario: 'CHANGE_PASSWORD',
      defaultFactor: MfaType.TOTP,
      availableFactors: [
        { type: MfaType.TOTP, label: '认证器 App', priority: 1 },
        { type: MfaType.EMAIL_OTP, label: '邮箱验证码', priority: 2 }
      ]
    })
  })

  it('returns not-required when the current scenario does not need step-up MFA', async () => {
    const loginMfaOrchestrationService = {
      resolveChallengeForAccount: jest.fn().mockResolvedValue(null)
    }

    const handler = new StartStepUpMfaChallengeHandler(
      loginMfaOrchestrationService as any
    )

    const result = await handler.execute(
      new StartStepUpMfaChallengeCommand(
        'user-1',
        'account-1',
        'tenant-1',
        'TENANT',
        'CHANGE_CONTACT'
      )
    )

    expect(result).toEqual({ required: false })
  })
})
