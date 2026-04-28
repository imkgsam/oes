import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CredentialType } from '../../../../prisma/generated/prisma'
import {
  AUTH_MFA_BINDING_NOT_FOUND,
  AUTH_OTP_DELIVERY_REJECTED
} from '../../../common/constants/exception-enums'
import { LoginMethodType, MfaType, OTP_TYPES, OTP_USAGES, REPO } from '../../../common/constants'
import { NOTIFICATION_DISPATCH_PORT } from '../../../common/constants/injection-tokens'
import { OneTimeToken } from '../../../domain/aggregates/otp.aggregate'
import { IMfaBindingRepository } from '../../../domain/repositories/mfaBinding.repository'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { IOtpRepository } from '../../../domain/repositories/otp.repository'
import { NotificationDispatchPort } from '../../../domain/services/notification-dispatch.port'
import { OtpRiskThrottleService } from '../otp-risk-throttle.service'

@Injectable()
export class PhoneOtpMfaChallengeService {
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
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.SMS_OTP)
    return binding?.isBindingActive() ?? false
  }

  async createChallenge(userId: string): Promise<{
    challengeId: string
    expiresAt: Date
    destination: string
  }> {
    const phoneLoginMethod = await this.resolveChallengeLoginMethod(userId)
    if (!phoneLoginMethod) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND)
    }

    await this.otpRiskThrottleService.assertCanSend(
      phoneLoginMethod.identifier,
      OTP_USAGES.MFA_VERIFY
    )

    const otp = OneTimeToken.createMfaOtp({
      type: OTP_TYPES.PHONE,
      identifier: phoneLoginMethod.identifier,
      code: this.generateOtpCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    await this.oneTimeTokenRepo.save(otp)

    const dispatch = await this.notificationDispatchPort.sendAuthOtpSms({
      recipient: phoneLoginMethod.identifier,
      code: otp.getProps().code,
      challengeId: otp.getProps().id,
      maskedDestination: phoneLoginMethod.identifier,
      ttlMinutes: 5
    })

    if (!dispatch.accepted) {
      throw ExceptionFactory.infrastructure(AUTH_OTP_DELIVERY_REJECTED, {
        channel: 'sms',
        recipient: phoneLoginMethod.identifier,
        rejectionReason: dispatch.rejectionReason ?? 'UNKNOWN'
      })
    }

    if (dispatch.effectiveCode && dispatch.effectiveCode !== otp.getProps().code) {
      otp.updateCode(dispatch.effectiveCode)
      await this.oneTimeTokenRepo.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(phoneLoginMethod.identifier, OTP_USAGES.MFA_VERIFY)

    return {
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      destination: phoneLoginMethod.identifier
    }
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Reuses the verified phone login method as the MFA delivery channel when login-scene policy allows SMS OTP without an explicit binding.
  private async resolveChallengeLoginMethod(userId: string) {
    const phoneLoginMethod = await this.loginMethodRepo.findByUserIdAndType(
      userId,
      LoginMethodType.PHONE
    )

    if (!phoneLoginMethod || !phoneLoginMethod.isEnabled() || !phoneLoginMethod.isVerified()) {
      return null
    }

    const otpCredential = phoneLoginMethod.getCredentialByType(CredentialType.PHONE_OTP)
    if (otpCredential && !otpCredential.isEnabled()) {
      return null
    }

    return phoneLoginMethod
  }
}
