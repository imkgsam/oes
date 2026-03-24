import { Inject, Injectable } from '@nestjs/common'
import { createBusinessException } from '@oes/common/exceptions'
import { AUTH_MFA_BINDING_NOT_FOUND } from 'src/common/constants/exception-enums'
import { LoginMethodType, MfaType, OTP_TYPES, OTP_USAGES, REPO } from 'src/common/constants'
import { OneTimeToken } from 'src/domain/aggregates/otp.aggregate'
import { IMfaBindingRepository } from 'src/domain/repositories/mfaBinding.repository'
import { IOtpRepository } from 'src/domain/repositories/otp.repository'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { EmailService } from 'src/infrastructure/services/email.service'
import { OtpRiskThrottleService } from '../otp-risk-throttle.service'

@Injectable()
export class EmailOtpMfaChallengeService {
  constructor(
    @Inject(REPO.MFA_BINDING)
    private readonly mfaBindingRepo: IMfaBindingRepository,
    @Inject(REPO.OTP)
    private readonly oneTimeTokenRepo: IOtpRepository,
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepo: ILoginMethodRepository,
    private readonly emailService: EmailService,
    private readonly otpRiskThrottleService: OtpRiskThrottleService
  ) {}

  async hasActiveBinding(userId: string): Promise<boolean> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.EMAIL_OTP)
    return binding?.isBindingActive() ?? false
  }

  async createChallenge(userId: string): Promise<{
    challengeId: string
    expiresAt: Date
    destination: string
  }> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.EMAIL_OTP)
    if (!binding || !binding.isBindingActive()) {
      throw createBusinessException(AUTH_MFA_BINDING_NOT_FOUND)
    }

    const emailLoginMethod = await this.loginMethodRepo.findByUserIdAndType(
      userId,
      LoginMethodType.EMAIL
    )
    if (!emailLoginMethod) {
      throw createBusinessException(AUTH_MFA_BINDING_NOT_FOUND)
    }

    await this.otpRiskThrottleService.assertCanSend(
      emailLoginMethod.identifier,
      OTP_USAGES.MFA_VERIFY
    )

    const otp = OneTimeToken.createMfaOtp({
      type: OTP_TYPES.EMAIL,
      identifier: emailLoginMethod.identifier,
      code: this.generateEmailCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    await this.oneTimeTokenRepo.save(otp)

    const sentCode = await this.emailService.sendEmailVerificationCode(
      emailLoginMethod.identifier,
      otp.getProps().code
    )

    if (this.isDevelopmentMode()) {
      otp.updateCode(sentCode)
      await this.oneTimeTokenRepo.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(emailLoginMethod.identifier, OTP_USAGES.MFA_VERIFY)

    return {
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      destination: emailLoginMethod.identifier
    }
  }

  private generateEmailCode(): string {
    if (this.isDevelopmentMode()) {
      return this.emailService.getDevEmailCode()
    }
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  }
}
