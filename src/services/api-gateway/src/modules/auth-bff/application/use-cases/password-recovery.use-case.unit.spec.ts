import { BadRequestException } from '@nestjs/common'
import { PasswordRecoveryChannel } from '@oes/common/generated/auth_service'
import { PasswordRecoveryUseCase } from './password-recovery.use-case'

describe('PasswordRecoveryUseCase', () => {
  it('inspects the verified password recovery channels and normalizes the response', async () => {
    const authAdapter = {
      inspectPasswordRecoveryChannels: jest.fn().mockResolvedValue({
        channels: [
          {
            channel: PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_EMAIL,
            maskedDestination: 'u***@example.com'
          },
          {
            channel: PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE,
            maskedDestination: '+15****0100'
          }
        ]
      })
    }
    const useCase = new PasswordRecoveryUseCase(authAdapter as any)

    const result = await useCase.inspectChannels(
      {
        identifier: ' user@example.com '
      } as any,
      { requestId: 'req-1', traceId: 'trace-1' } as any
    )

    expect(authAdapter.inspectPasswordRecoveryChannels).toHaveBeenCalledWith(
      {
        identifier: 'user@example.com'
      },
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(result).toEqual({
      channels: [
        { channel: 'EMAIL', maskedDestination: 'u***@example.com' },
        { channel: 'PHONE', maskedDestination: '+15****0100' }
      ]
    })
  })

  it('starts a password recovery challenge through auth-service and normalizes the response', async () => {
    const authAdapter = {
      requestPasswordRecoveryChallenge: jest.fn().mockResolvedValue({
        accepted: true,
        challengeId: 'challenge-1',
        expiresAt: '2026-04-20T08:30:00.000Z',
        maskedDestination: 'u***@example.com'
      })
    }
    const useCase = new PasswordRecoveryUseCase(authAdapter as any)

    const result = await useCase.requestChallenge(
      {
        channel: 'EMAIL',
        identifier: ' user@example.com '
      } as any,
      { requestId: 'req-1', traceId: 'trace-1' } as any
    )

    expect(authAdapter.requestPasswordRecoveryChallenge).toHaveBeenCalledWith(
      {
        channel: 'EMAIL',
        identifier: 'user@example.com'
      },
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(result).toEqual({
      accepted: true,
      challengeId: 'challenge-1',
      expiresAt: '2026-04-20T08:30:00.000Z',
      maskedDestination: 'u***@example.com'
    })
  })

  it('verifies one password recovery challenge with the provided otp', async () => {
    const authAdapter = {
      verifyPasswordRecoveryChallenge: jest.fn().mockResolvedValue({
        verified: true,
        resetToken: 'reset-token-1'
      })
    }
    const useCase = new PasswordRecoveryUseCase(authAdapter as any)

    const result = await useCase.verifyChallenge(
      'challenge-1',
      { otp: '123456' } as any,
      { requestId: 'req-1', traceId: 'trace-1' } as any
    )

    expect(authAdapter.verifyPasswordRecoveryChallenge).toHaveBeenCalledWith(
      {
        challengeId: 'challenge-1',
        otp: '123456'
      },
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(result).toEqual({
      verified: true,
      resetToken: 'reset-token-1'
    })
  })

  it('rejects recovery completion when the password confirmation does not match', async () => {
    const useCase = new PasswordRecoveryUseCase({} as any)

    await expect(
      useCase.complete(
        {
          confirmPassword: 'DifferentSecret123!',
          newPassword: 'NewSecret123!',
          resetToken: 'reset-token-1'
        } as any,
        { requestId: 'req-1', traceId: 'trace-1' } as any
      )
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
