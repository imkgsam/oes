import { Inject, Injectable } from '@nestjs/common'
import { createBusinessException } from '@oes/common/exceptions'
import { AUTH_MFA_BINDING_NOT_FOUND } from 'src/common/constants/exception-enums'
import { LoginMethodType, MfaType, OTP_TYPES, OTP_USAGES } from 'src/common/constants'
import {
  MFA_BINDING_REPOSITORY,
  OTP_REPOSITORY,
  USER_REPOSITORY
} from 'src/common/constants/injection-tokens'
import { OneTimeToken } from 'src/domain/aggregates/otp.aggregate'
import { IMfaBindingRepository } from 'src/domain/repositories/mfaBinding.repository'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { IOtpRepository } from 'src/domain/repositories/otp.repository'
import { SmsService } from 'src/infrastructure/services/sms.service'
import { OtpRiskThrottleService } from '../otp-risk-throttle.service'

@Injectable()
export class PhoneOtpMfaChallengeService {
  constructor(
    @Inject(MFA_BINDING_REPOSITORY)
    private readonly mfaBindingRepo: IMfaBindingRepository,
    @Inject(OTP_REPOSITORY)
    private readonly oneTimeTokenRepo: IOtpRepository,
    @Inject(USER_REPOSITORY)
    private readonly loginMethodRepo: ILoginMethodRepository,
    private readonly smsService: SmsService,
    private readonly otpRiskThrottleService: OtpRiskThrottleService
  ) {}

  async hasActiveBinding(userId: string): Promise<boolean> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.SMS_OTP)
    return binding?.isBindingActive() ?? false
  }

  async createChallenge(userId: string): Promise<{
    challengeId: string
    expiresAt: Date
    destination: string
  }> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.SMS_OTP)
    if (!binding || !binding.isBindingActive()) {
      throw createBusinessException(AUTH_MFA_BINDING_NOT_FOUND)
    }

    const phoneLoginMethod = await this.loginMethodRepo.findByUserIdAndType(
      userId,
      LoginMethodType.PHONE
    )
    if (!phoneLoginMethod) {
      throw createBusinessException(AUTH_MFA_BINDING_NOT_FOUND)
    }

    await this.otpRiskThrottleService.assertCanSend(
      phoneLoginMethod.identifier,
      OTP_USAGES.MFA_VERIFY
    )

    const otp = OneTimeToken.createMfaOtp({
      type: OTP_TYPES.PHONE,
      identifier: phoneLoginMethod.identifier,
      code: this.generateSmsCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    await this.oneTimeTokenRepo.save(otp)

    const sentCode = await this.smsService.sendPhoneVerificationCode(
      phoneLoginMethod.identifier,
      otp.getProps().code
    )

    if (this.isDevelopmentMode()) {
      otp.updateCode(sentCode)
      await this.oneTimeTokenRepo.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(phoneLoginMethod.identifier, OTP_USAGES.MFA_VERIFY)

    return {
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      destination: phoneLoginMethod.identifier
    }
  }

  private generateSmsCode(): string {
    if (this.isDevelopmentMode()) {
      return this.smsService.getDevSmsCode()
    }
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  }
}
