import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory, VALIDATION_FAILED } from '@oes/common/exceptions'
import { LoginMethodType, OTP_TYPES, OTP_USAGES, REPO } from '../../common/constants'
import { NOTIFICATION_DISPATCH_PORT } from '../../common/constants/injection-tokens'
import { AUTH_OTP_DELIVERY_REJECTED, AUTH_OTP_INVALID } from '../../common/constants/exception-enums'
import { OneTimeToken } from '../../domain/aggregates/otp.aggregate'
import { AuthIdentifierNormalizer } from '../../domain/services/auth-identifier-normalizer'
import { NotificationDispatchPort } from '../../domain/services/notification-dispatch.port'
import { ILoginMethodRepository } from '../../domain/repositories/loginmethod.repository'
import { IOtpRepository } from '../../domain/repositories/otp.repository'
import { OtpRiskThrottleService } from './otp-risk-throttle.service'

export interface ContactBindingChallengeResult {
  challengeId: string
  destination: string
  expiresAt: Date
}

export interface ContactBindingVerificationResult {
  identifier: string
  success: true
  type: LoginMethodType.EMAIL | LoginMethodType.PHONE
}

@Injectable()
// Issues and verifies self-service contact binding OTPs without depending on pre-existing login methods.
export class ContactBindingVerificationService {
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepo: ILoginMethodRepository,
    @Inject(REPO.OTP)
    private readonly otpRepository: IOtpRepository,
    @Inject(NOTIFICATION_DISPATCH_PORT)
    private readonly notificationDispatchPort: NotificationDispatchPort,
    private readonly otpRiskThrottleService: OtpRiskThrottleService
  ) {}

  async createEmailChallenge(
    userId: string,
    email: string
  ): Promise<ContactBindingChallengeResult> {
    return this.createChallenge(userId, LoginMethodType.EMAIL, email)
  }

  async createPhoneChallenge(
    userId: string,
    phone: string
  ): Promise<ContactBindingChallengeResult> {
    return this.createChallenge(userId, LoginMethodType.PHONE, phone)
  }

  async verifyEmailChallenge(
    userId: string,
    email: string,
    code: string
  ): Promise<ContactBindingVerificationResult> {
    return this.verifyChallenge(userId, LoginMethodType.EMAIL, email, code)
  }

  async verifyPhoneChallenge(
    userId: string,
    phone: string,
    code: string
  ): Promise<ContactBindingVerificationResult> {
    return this.verifyChallenge(userId, LoginMethodType.PHONE, phone, code)
  }

  private async createChallenge(
    userId: string,
    type: LoginMethodType.EMAIL | LoginMethodType.PHONE,
    rawIdentifier: string
  ): Promise<ContactBindingChallengeResult> {
    const identifier = AuthIdentifierNormalizer.normalize(type, rawIdentifier)
    await this.assertIdentifierAvailable(userId, type, identifier)
    await this.otpRiskThrottleService.assertCanSend(identifier, OTP_USAGES.REGISTER)

    const otp = OneTimeToken.createRegisterOtp({
      type: type === LoginMethodType.EMAIL ? OTP_TYPES.EMAIL : OTP_TYPES.PHONE,
      identifier,
      code: this.generateOtpCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })
    await this.otpRepository.save(otp)

    const dispatch =
      type === LoginMethodType.EMAIL
        ? await this.notificationDispatchPort.sendAuthOtpEmail({
            recipient: identifier,
            code: otp.getProps().code,
            challengeId: otp.getProps().id,
            maskedDestination: identifier,
            ttlMinutes: 5
          })
        : await this.notificationDispatchPort.sendAuthOtpSms({
            recipient: identifier,
            code: otp.getProps().code,
            challengeId: otp.getProps().id,
            maskedDestination: identifier,
            ttlMinutes: 5
          })

    if (!dispatch.accepted) {
      throw ExceptionFactory.infrastructure(AUTH_OTP_DELIVERY_REJECTED, {
        channel: type === LoginMethodType.EMAIL ? 'email' : 'sms',
        recipient: identifier,
        rejectionReason: dispatch.rejectionReason ?? 'UNKNOWN'
      })
    }

    if (dispatch.effectiveCode && dispatch.effectiveCode !== otp.getProps().code) {
      otp.updateCode(dispatch.effectiveCode)
      await this.otpRepository.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(identifier, OTP_USAGES.REGISTER)

    return {
      challengeId: otp.getProps().id,
      destination: identifier,
      expiresAt: otp.getProps().expiredAt
    }
  }

  private async verifyChallenge(
    userId: string,
    type: LoginMethodType.EMAIL | LoginMethodType.PHONE,
    rawIdentifier: string,
    code: string
  ): Promise<ContactBindingVerificationResult> {
    const identifier = AuthIdentifierNormalizer.normalize(type, rawIdentifier)
    await this.assertIdentifierAvailable(userId, type, identifier)

    const otp = await this.otpRepository.findByIdentifierAndUsage(identifier, OTP_USAGES.REGISTER)
    if (!otp) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    const valid = otp.verify(code)
    if (!valid) {
      await this.otpRepository.save(otp)
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    await this.otpRepository.markUsed(otp.getProps().id)

    return {
      identifier,
      success: true,
      type
    }
  }

  private async assertIdentifierAvailable(
    userId: string,
    type: LoginMethodType.EMAIL | LoginMethodType.PHONE,
    identifier: string
  ): Promise<void> {
    const existing = await this.loginMethodRepo.findByTypeAndIdentifier(type, identifier)
    if (existing && existing.userId !== userId) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: type === LoginMethodType.EMAIL ? 'email' : 'phone',
        value: identifier
      })
    }
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
}
