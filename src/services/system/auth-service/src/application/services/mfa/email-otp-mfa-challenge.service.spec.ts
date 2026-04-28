import { LoginMethodType } from '../../../common/constants'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { EmailOtpMfaChallengeService } from './email-otp-mfa-challenge.service'

describe('EmailOtpMfaChallengeService', () => {
  it('creates an email challenge from the verified email login method even when no explicit email mfa binding exists', async () => {
    const otpRepository = {
      save: jest.fn()
    }
    const emailLoginMethod = new LoginMethod(
      'email-method-1',
      'user-1',
      LoginMethodType.EMAIL,
      'user@example.com',
      true,
      true,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z'),
      [
        new Credential(
          'email-otp-cred',
          CredentialType.EMAIL_OTP,
          '',
          true,
          new Date('2026-04-20T00:00:00.000Z'),
          new Date('2026-04-20T00:00:00.000Z')
        )
      ]
    )
    const notificationDispatchPort = {
      sendAuthOtpEmail: jest.fn().mockResolvedValue({
        accepted: true
      })
    }
    const service = new EmailOtpMfaChallengeService(
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      otpRepository as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(emailLoginMethod)
      } as any,
      notificationDispatchPort as any,
      {
        assertCanSend: jest.fn(),
        recordSend: jest.fn()
      } as any
    )

    const result = await service.createChallenge('user-1')

    expect(result.destination).toBe('user@example.com')
    expect(result.challengeId).toBeTruthy()
    expect(otpRepository.save).toHaveBeenCalledTimes(1)
    expect(notificationDispatchPort.sendAuthOtpEmail).toHaveBeenCalledTimes(1)
  })
})
