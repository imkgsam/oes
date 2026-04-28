import { LoginMethodType } from '../../../common/constants'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { PhoneOtpMfaChallengeService } from './phone-otp-mfa-challenge.service'

describe('PhoneOtpMfaChallengeService', () => {
  it('creates an sms challenge from the verified phone login method even when no explicit sms mfa binding exists', async () => {
    const otpRepository = {
      save: jest.fn()
    }
    const phoneLoginMethod = new LoginMethod(
      'phone-method-1',
      'user-1',
      LoginMethodType.PHONE,
      '+8613800138000',
      true,
      true,
      new Date('2026-04-20T00:00:00.000Z'),
      new Date('2026-04-20T00:00:00.000Z'),
      [
        new Credential(
          'phone-otp-cred',
          CredentialType.PHONE_OTP,
          '',
          true,
          new Date('2026-04-20T00:00:00.000Z'),
          new Date('2026-04-20T00:00:00.000Z')
        )
      ]
    )
    const notificationDispatchPort = {
      sendAuthOtpSms: jest.fn().mockResolvedValue({
        accepted: true
      })
    }
    const service = new PhoneOtpMfaChallengeService(
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(null)
      } as any,
      otpRepository as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(phoneLoginMethod)
      } as any,
      notificationDispatchPort as any,
      {
        assertCanSend: jest.fn(),
        recordSend: jest.fn()
      } as any
    )

    const result = await service.createChallenge('user-1')

    expect(result.destination).toBe('+8613800138000')
    expect(result.challengeId).toBeTruthy()
    expect(otpRepository.save).toHaveBeenCalledTimes(1)
    expect(notificationDispatchPort.sendAuthOtpSms).toHaveBeenCalledTimes(1)
  })
})
