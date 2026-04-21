import { RequestPasswordRecoveryChallengeCommand } from './request-password-recovery-challenge.command'
import { RequestPasswordRecoveryChallengeHandler } from './request-password-recovery-challenge.handler'

describe('RequestPasswordRecoveryChallengeHandler', () => {
  it('delegates one recovery challenge request to PasswordRecoveryService', async () => {
    const passwordRecoveryService = {
      requestChallenge: jest.fn().mockResolvedValue({
        accepted: true,
        challengeId: 'challenge-1',
        expiresAt: new Date('2026-04-20T12:05:00.000Z'),
        maskedDestination: 'u***@example.com'
      })
    }
    const handler = new RequestPasswordRecoveryChallengeHandler(passwordRecoveryService as any)

    const result = await handler.execute(
      new RequestPasswordRecoveryChallengeCommand({
        channel: 'EMAIL',
        identifier: 'user@example.com'
      })
    )

    expect(passwordRecoveryService.requestChallenge).toHaveBeenCalledWith(
      'EMAIL',
      'user@example.com'
    )
    expect(result).toEqual({
      accepted: true,
      challengeId: 'challenge-1',
      expiresAt: new Date('2026-04-20T12:05:00.000Z'),
      maskedDestination: 'u***@example.com'
    })
  })
})
