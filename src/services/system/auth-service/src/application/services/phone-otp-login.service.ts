import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CredentialType } from '../../../prisma/generated/prisma'
import { LoginMethodType, OTP_TYPES, OTP_USAGES, REPO } from '../../common/constants'
import { NOTIFICATION_DISPATCH_PORT } from '../../common/constants/injection-tokens'
import {
  AUTH_INVALID_CREDENTIALS,
  AUTH_OTP_DELIVERY_REJECTED,
  AUTH_OTP_INVALID
} from '../../common/constants/exception-enums'
import { OneTimeToken } from '../../domain/aggregates/otp.aggregate'
import { ILoginMethodRepository } from '../../domain/repositories/loginmethod.repository'
import { IOtpRepository } from '../../domain/repositories/otp.repository'
import { AuthIdentifierNormalizer } from '../../domain/services/auth-identifier-normalizer'
import { NotificationDispatchPort } from '../../domain/services/notification-dispatch.port'
import { OtpRiskThrottleService } from './otp-risk-throttle.service'

@Injectable()
export class PhoneOtpLoginService {
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepo: ILoginMethodRepository,
    @Inject(REPO.OTP)
    private readonly otpRepository: IOtpRepository,
    @Inject(NOTIFICATION_DISPATCH_PORT)
    private readonly notificationDispatchPort: NotificationDispatchPort,
    private readonly otpRiskThrottleService: OtpRiskThrottleService
  ) {}

  async createChallenge(phone: string): Promise<{
    challengeId: string
    expiresAt: Date
    destination: string
  }> {
    const normalizedPhone = AuthIdentifierNormalizer.normalize(LoginMethodType.PHONE, phone)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.PHONE,
      normalizedPhone
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }
    const otpCredential = loginMethod.getCredentialByType(CredentialType.PHONE_OTP)
    if (otpCredential && !otpCredential.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }

    await this.otpRiskThrottleService.assertCanSend(normalizedPhone, OTP_USAGES.LOGIN)

    const otp = OneTimeToken.createLoginOtp({
      type: OTP_TYPES.PHONE,
      identifier: normalizedPhone,
      code: this.generateOtpCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    await this.otpRepository.save(otp)

    const dispatch = await this.notificationDispatchPort.sendAuthOtpSms({
      recipient: normalizedPhone,
      code: otp.getProps().code,
      challengeId: otp.getProps().id,
      maskedDestination: normalizedPhone,
      ttlMinutes: 5
    })

    if (!dispatch.accepted) {
      throw ExceptionFactory.infrastructure(AUTH_OTP_DELIVERY_REJECTED, {
        channel: 'sms',
        recipient: normalizedPhone,
        rejectionReason: dispatch.rejectionReason ?? 'UNKNOWN'
      })
    }

    if (dispatch.effectiveCode && dispatch.effectiveCode !== otp.getProps().code) {
      otp.updateCode(dispatch.effectiveCode)
      await this.otpRepository.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(normalizedPhone, OTP_USAGES.LOGIN)

    return {
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      destination: normalizedPhone
    }
  }

  async authenticate(phone: string, code: string): Promise<string> {
    const normalizedPhone = AuthIdentifierNormalizer.normalize(LoginMethodType.PHONE, phone)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.PHONE,
      normalizedPhone
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }
    const otpCredential = loginMethod.getCredentialByType(CredentialType.PHONE_OTP)
    if (otpCredential && !otpCredential.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }

    const otp = await this.otpRepository.findByIdentifierAndUsage(
      normalizedPhone,
      OTP_USAGES.LOGIN
    )
    if (!otp) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    const valid = otp.verify(code)
    if (!valid) {
      await this.otpRepository.save(otp)
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    await this.otpRepository.markUsed(otp.getProps().id)

    return loginMethod.userId
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
}
