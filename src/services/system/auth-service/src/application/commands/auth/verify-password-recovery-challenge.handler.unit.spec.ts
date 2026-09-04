import { VerifyPasswordRecoveryChallengeCommand } from './verify-password-recovery-challenge.command'
import { VerifyPasswordRecoveryChallengeHandler } from './verify-password-recovery-challenge.handler'

describe('VerifyPasswordRecoveryChallengeHandler', () => {
  it('delegates OTP verification to PasswordRecoveryService', async () => {
    const passwordRecoveryService = {
      verifyChallenge: jest.fn().mockResolvedValue({
        verified: true,
        resetToken: 'reset-token-1'
      })
    }
    const handler = new VerifyPasswordRecoveryChallengeHandler(passwordRecoveryService as any)

    const result = await handler.execute(
      new VerifyPasswordRecoveryChallengeCommand({
        challengeId: 'challenge-1',
        otp: '123456'
      })
    )

    expect(passwordRecoveryService.verifyChallenge).toHaveBeenCalledWith('challenge-1', '123456')
    expect(result).toEqual({
      verified: true,
      resetToken: 'reset-token-1'
    })
  })
})
