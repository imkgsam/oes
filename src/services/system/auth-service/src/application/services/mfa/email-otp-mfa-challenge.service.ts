import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AUTH_MFA_BINDING_NOT_FOUND,
  AUTH_OTP_DELIVERY_REJECTED
} from '../../../common/constants/exception-enums'
import { LoginMethodType, MfaType, OTP_TYPES, OTP_USAGES, REPO } from '../../../common/constants'
import { NOTIFICATION_DISPATCH_PORT } from '../../../common/constants/injection-tokens'
import { OneTimeToken } from '../../../domain/aggregates/otp.aggregate'
import { IMfaBindingRepository } from '../../../domain/repositories/mfaBinding.repository'
import { IOtpRepository } from '../../../domain/repositories/otp.repository'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { NotificationDispatchPort } from '../../../domain/services/notification-dispatch.port'
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
    @Inject(NOTIFICATION_DISPATCH_PORT)
    private readonly notificationDispatchPort: NotificationDispatchPort,
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
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND)
    }

    const emailLoginMethod = await this.loginMethodRepo.findByUserIdAndType(
      userId,
      LoginMethodType.EMAIL
    )
    if (!emailLoginMethod) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND)
    }

    await this.otpRiskThrottleService.assertCanSend(
      emailLoginMethod.identifier,
      OTP_USAGES.MFA_VERIFY
    )

    const otp = OneTimeToken.createMfaOtp({
      type: OTP_TYPES.EMAIL,
      identifier: emailLoginMethod.identifier,
      code: this.generateOtpCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    await this.oneTimeTokenRepo.save(otp)

    const dispatch = await this.notificationDispatchPort.sendAuthOtpEmail({
      recipient: emailLoginMethod.identifier,
      code: otp.getProps().code,
      challengeId: otp.getProps().id,
      maskedDestination: emailLoginMethod.identifier,
      ttlMinutes: 5
    })

    if (!dispatch.accepted) {
      throw ExceptionFactory.infrastructure(AUTH_OTP_DELIVERY_REJECTED, {
        channel: 'email',
        recipient: emailLoginMethod.identifier,
        rejectionReason: dispatch.rejectionReason ?? 'UNKNOWN'
      })
    }

    if (dispatch.effectiveCode && dispatch.effectiveCode !== otp.getProps().code) {
      otp.updateCode(dispatch.effectiveCode)
      await this.oneTimeTokenRepo.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(emailLoginMethod.identifier, OTP_USAGES.MFA_VERIFY)

    return {
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      destination: emailLoginMethod.identifier
    }
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
}
