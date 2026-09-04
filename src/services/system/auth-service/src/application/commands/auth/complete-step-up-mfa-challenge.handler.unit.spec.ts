import { MfaType } from '@oes/common/constants'
import { CompleteStepUpMfaChallengeCommand } from './complete-step-up-mfa-challenge.command'
import { CompleteStepUpMfaChallengeHandler } from './complete-step-up-mfa-challenge.handler'

describe('CompleteStepUpMfaChallengeHandler', () => {
  it('issues one short-lived step-up grant after MFA verification succeeds', async () => {
    const loginMfaOrchestrationService = {
      verifySelectedFactor: jest.fn().mockResolvedValue({
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        scopeLevel: 'TENANT',
        scenario: 'CHANGE_CONTACT',
        tokenType: 'mfa_flow'
      })
    }
    const stepUpMfaGrantService = {
      issueGrant: jest.fn().mockReturnValue({
        mfaGrantToken: 'step-up-grant-token'
      })
    }

    const handler = new CompleteStepUpMfaChallengeHandler(
      loginMfaOrchestrationService as any,
      stepUpMfaGrantService as any
    )

    const result = await handler.execute(
      new CompleteStepUpMfaChallengeCommand(
        'step-up-flow-token',
        MfaType.TOTP,
        '123456',
        'factor-1'
      )
    )

    expect(loginMfaOrchestrationService.verifySelectedFactor).toHaveBeenCalledWith({
      challengeId: 'step-up-flow-token',
      factor: MfaType.TOTP,
      code: '123456',
      factorChallengeId: 'factor-1'
    })
    expect(stepUpMfaGrantService.issueGrant).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      scenario: 'CHANGE_CONTACT'
    })
    expect(result).toEqual({
      success: true,
      scenario: 'CHANGE_CONTACT',
      mfaGrantToken: 'step-up-grant-token'
    })
  })
})
