import { LoginMethodType, OTP_TYPES, OTP_USAGES } from '../../common/constants'
import { OneTimeToken } from '../../domain/aggregates/otp.aggregate'
import { LoginMethod } from '../../domain/aggregates/loginmethod.aggregate'
import { PasswordRecoveryService } from './password-recovery.service'

describe('PasswordRecoveryService', () => {
  const auditService = {
    emitPasswordRecoveryChallengeCreated: jest.fn(),
    emitPasswordRecoveryChallengeVerified: jest.fn()
  }

  beforeEach(() => {
    process.env.AUTH_FORGOT_PASSWORD_OTP_MODE = 'mock'
    auditService.emitPasswordRecoveryChallengeCreated.mockClear()
    auditService.emitPasswordRecoveryChallengeVerified.mockClear()
  })

  afterEach(() => {
    delete process.env.AUTH_FORGOT_PASSWORD_OTP_MODE
  })

  it('inspects the matched user and returns both verified recovery channels without defaulting when both exist', async () => {
    const loginMethodRepository = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(
        buildLoginMethod({
          enabled: true,
          identifier: 'user@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1',
          verified: true
        })
      ),
      findByUserId: jest.fn().mockResolvedValue([
        buildLoginMethod({
          enabled: true,
          identifier: 'user@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1',
          verified: true
        }),
        buildLoginMethod({
          enabled: true,
          identifier: '+15555550100',
          type: LoginMethodType.PHONE,
          userId: 'user-1',
          verified: true
        })
      ])
    }

    const service = new PasswordRecoveryService(
      loginMethodRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      auditService as any
    )

    const result = await service.inspectChannels(' user@example.com ')

    expect(loginMethodRepository.findValidOneByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.EMAIL,
      'user@example.com'
    )
    expect(result).toEqual({
      channels: [
        { channel: 'EMAIL', maskedDestination: 'u***@example.com' },
        { channel: 'PHONE', maskedDestination: '+15****0100' }
      ]
    })
  })

  it('returns one default recovery channel when the matched user has only one verified destination', async () => {
    const loginMethodRepository = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(
        buildLoginMethod({
          enabled: true,
          identifier: '+15555550100',
          type: LoginMethodType.PHONE,
          userId: 'user-1',
          verified: true
        })
      ),
      findByUserId: jest.fn().mockResolvedValue([
        buildLoginMethod({
          enabled: true,
          identifier: 'user@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1',
          verified: true
        }),
        buildLoginMethod({
          enabled: false,
          identifier: '+15555550100',
          type: LoginMethodType.PHONE,
          userId: 'user-1',
          verified: true
        })
      ])
    }

    const service = new PasswordRecoveryService(
      loginMethodRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      auditService as any
    )

    const result = await service.inspectChannels(' +1 (555) 555-0100 ')

    expect(result).toEqual({
      channels: [{ channel: 'EMAIL', maskedDestination: 'u***@example.com' }],
      defaultChannel: 'EMAIL'
    })
  })

  it('creates a reset challenge for one verified email login method and dispatches notification', async () => {
    const loginMethodRepository = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(
        buildLoginMethod({
          enabled: true,
          identifier: 'user@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1',
          verified: true
        })
      ),
      findByUserId: jest.fn().mockResolvedValue([
        buildLoginMethod({
          enabled: true,
          identifier: 'user@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1',
          verified: true
        })
      ])
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

    const service = new PasswordRecoveryService(
      loginMethodRepository as any,
      otpRepository as any,
      {} as any,
      notificationDispatchPort as any,
      otpRiskThrottleService as any,
      auditService as any
    )

    const result = await service.requestChallenge('EMAIL', ' User@example.com ')

    expect(loginMethodRepository.findValidOneByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.EMAIL,
      'user@example.com'
    )
    expect(otpRiskThrottleService.assertCanSend).toHaveBeenCalledWith(
      'user@example.com',
      OTP_USAGES.RESET_PASSWORD
    )
    expect(notificationDispatchPort.sendAuthOtpEmail).toHaveBeenCalled()
    const savedOtp = (otpRepository.save as jest.Mock).mock.calls[0][0] as OneTimeToken
    expect(savedOtp.getUsage()).toBe(OTP_USAGES.RESET_PASSWORD)
    expect(savedOtp.getType()).toBe(OTP_TYPES.EMAIL)
    expect(savedOtp.getProps().code).toBe('123456')
    expect(result.accepted).toBe(true)
    expect(result.challengeId).toBe(savedOtp.getProps().id)
    expect(result.maskedDestination).toBe('u***@example.com')
  })

  it('keeps the forgot-password OTP fixed at 123456 for phone recovery in mock mode', async () => {
    const loginMethodRepository = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(
        buildLoginMethod({
          enabled: true,
          identifier: '+15555550100',
          type: LoginMethodType.PHONE,
          userId: 'user-1',
          verified: true
        })
      ),
      findByUserId: jest.fn().mockResolvedValue([
        buildLoginMethod({
          enabled: true,
          identifier: 'user@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1',
          verified: true
        }),
        buildLoginMethod({
          enabled: true,
          identifier: '+15555550100',
          type: LoginMethodType.PHONE,
          userId: 'user-1',
          verified: true
        })
      ])
    }
    const otpRepository = {
      save: jest.fn().mockImplementation(async (otp) => otp)
    }
    const notificationDispatchPort = {
      sendAuthOtpSms: jest.fn().mockResolvedValue({
        accepted: true
      })
    }
    const otpRiskThrottleService = {
      assertCanSend: jest.fn().mockResolvedValue(undefined),
      recordSend: jest.fn().mockResolvedValue(undefined)
    }

    const service = new PasswordRecoveryService(
      loginMethodRepository as any,
      otpRepository as any,
      {} as any,
      notificationDispatchPort as any,
      otpRiskThrottleService as any,
      auditService as any
    )

    const result = await service.requestChallenge('PHONE', ' +1 (555) 555-0100 ')

    const savedOtp = (otpRepository.save as jest.Mock).mock.calls[0][0] as OneTimeToken
    expect(loginMethodRepository.findValidOneByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.PHONE,
      '+15555550100'
    )
    expect(notificationDispatchPort.sendAuthOtpSms).toHaveBeenCalled()
    expect(savedOtp.getType()).toBe(OTP_TYPES.PHONE)
    expect(savedOtp.getProps().code).toBe('123456')
    expect(result.maskedDestination).toBe('+15****0100')
  })

  it('returns a neutral accepted response for an unknown identifier without dispatching notification', async () => {
    const loginMethodRepository = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(null)
    }
    const notificationDispatchPort = {
      sendAuthOtpEmail: jest.fn()
    }

    const service = new PasswordRecoveryService(
      loginMethodRepository as any,
      {} as any,
      {} as any,
      notificationDispatchPort as any,
      {} as any,
      auditService as any
    )

    const result = await service.requestChallenge('EMAIL', 'missing@example.com')

    expect(result.accepted).toBe(true)
    expect(result.challengeId).toBeTruthy()
    expect(notificationDispatchPort.sendAuthOtpEmail).not.toHaveBeenCalled()
  })

  it('verifies OTP 123456 in mock mode and creates a one-time recovery grant', async () => {
    const otp = OneTimeToken.createResetPasswordOtp({
      type: OTP_TYPES.EMAIL,
      identifier: 'user@example.com',
      code: '123456',
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })
    const loginMethodRepository = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(
        buildLoginMethod({
          enabled: true,
          identifier: 'user@example.com',
          type: LoginMethodType.EMAIL,
          userId: 'user-1',
          verified: true
        })
      )
    }
    const otpRepository = {
      findById: jest.fn().mockResolvedValue(otp),
      markUsed: jest.fn().mockResolvedValue(undefined)
    }
    const passwordRecoveryGrantRepository = {
      save: jest.fn().mockImplementation(async (grant) => grant)
    }

    const service = new PasswordRecoveryService(
      loginMethodRepository as any,
      otpRepository as any,
      passwordRecoveryGrantRepository as any,
      {} as any,
      {} as any,
      auditService as any
    )

    const result = await service.verifyChallenge(otp.getProps().id, '123456')

    expect(otpRepository.markUsed).toHaveBeenCalledWith(otp.getProps().id)
    expect(passwordRecoveryGrantRepository.save).toHaveBeenCalled()
    expect(result.verified).toBe(true)
    expect(result.resetToken).toBeTruthy()
  })
})

function buildLoginMethod(input: {
  enabled: boolean
  identifier: string
  type: LoginMethodType
  userId: string
  verified: boolean
}) {
  const method = new LoginMethod(
    `method-${input.type.toLowerCase()}`,
    input.userId,
    input.type,
    input.identifier,
    input.verified,
    input.enabled,
    new Date('2026-04-20T00:00:00.000Z'),
    new Date('2026-04-20T00:00:00.000Z')
  )

  return method
}
