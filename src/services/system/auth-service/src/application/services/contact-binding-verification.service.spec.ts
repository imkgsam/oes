import { LoginMethodType, OTP_TYPES, OTP_USAGES } from '../../common/constants'
import { OneTimeToken } from '../../domain/aggregates/otp.aggregate'
import { ContactBindingVerificationService } from './contact-binding-verification.service'

describe('ContactBindingVerificationService', () => {
  it('rejects creating a binding challenge when the same user submits the already-bound email', async () => {
    const loginMethodRepo = {
      findByTypeAndIdentifier: jest.fn().mockResolvedValue({
        identifier: 'alice@example.com',
        type: LoginMethodType.EMAIL,
        userId: 'user-1'
      })
    }

    const service = new ContactBindingVerificationService(
      loginMethodRepo as any,
      {} as any,
      {} as any,
      {} as any
    )

    await expect(
      service.createEmailChallenge('user-1', 'alice@example.com')
    ).rejects.toMatchObject({
      additionalDetails: expect.objectContaining({
        field: 'email',
        reason: 'IDENTIFIER_ALREADY_BOUND',
        value: 'alice@example.com'
      }),
      definition: expect.objectContaining({
        code: 'APP_VALIDATION_001'
      })
    })
  })

  it('creates a register-usage email OTP for self-service binding without requiring an existing login method', async () => {
    const loginMethodRepo = {
      findByTypeAndIdentifier: jest.fn().mockResolvedValue(null)
    }
    const otpRepository = {
      save: jest.fn().mockImplementation(async (otp) => otp)
    }
    const notificationDispatchPort = {
      sendAuthOtpEmail: jest.fn().mockResolvedValue({ accepted: true })
    }
    const otpRiskThrottleService = {
      assertCanSend: jest.fn().mockResolvedValue(undefined),
      recordSend: jest.fn().mockResolvedValue(undefined)
    }

    const service = new ContactBindingVerificationService(
      loginMethodRepo as any,
      otpRepository as any,
      notificationDispatchPort as any,
      otpRiskThrottleService as any
    )

    const result = await service.createEmailChallenge('user-1', ' Alice@example.com ')

    expect(loginMethodRepo.findByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.EMAIL,
      'alice@example.com'
    )
    expect(otpRiskThrottleService.assertCanSend).toHaveBeenCalledWith(
      'alice@example.com',
      OTP_USAGES.REGISTER
    )
    expect(notificationDispatchPort.sendAuthOtpEmail).toHaveBeenCalled()
    const savedOtp = (otpRepository.save as jest.Mock).mock.calls[0][0] as OneTimeToken
    expect(savedOtp.getType()).toBe(OTP_TYPES.EMAIL)
    expect(savedOtp.getUsage()).toBe(OTP_USAGES.REGISTER)
    expect(result.destination).toBe('alice@example.com')
  })

  it('verifies a phone binding challenge with register usage and returns the normalized identifier', async () => {
    const loginMethodRepo = {
      findByTypeAndIdentifier: jest.fn().mockResolvedValue(null)
    }
    const otp = OneTimeToken.createRegisterOtp({
      type: OTP_TYPES.PHONE,
      identifier: '+8613900000001',
      code: '123456',
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })
    const otpRepository = {
      findByIdentifierAndUsage: jest.fn().mockResolvedValue(otp),
      markUsed: jest.fn().mockResolvedValue(undefined)
    }

    const service = new ContactBindingVerificationService(
      loginMethodRepo as any,
      otpRepository as any,
      {} as any,
      {} as any
    )

    await expect(
      service.verifyPhoneChallenge('user-1', ' +8613900000001 ', '123456')
    ).resolves.toEqual({
      identifier: '+8613900000001',
      success: true,
      type: LoginMethodType.PHONE
    })

    expect(otpRepository.findByIdentifierAndUsage).toHaveBeenCalledWith(
      '+8613900000001',
      OTP_USAGES.REGISTER
    )
    expect(otpRepository.markUsed).toHaveBeenCalledWith(otp.getProps().id)
  })
})
