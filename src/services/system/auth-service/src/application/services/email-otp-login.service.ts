import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { LoginMethodType, OTP_TYPES, OTP_USAGES } from 'src/common/constants'
import {
  LOGIN_METHOD_REPOSITORY,
  OTP_REPOSITORY
} from 'src/common/constants/injection-tokens'
import { AUTH_INVALID_CREDENTIALS, AUTH_OTP_INVALID } from 'src/common/constants/exception-enums'
import { OneTimeToken } from 'src/domain/aggregates/otp.aggregate'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { IOtpRepository } from 'src/domain/repositories/otp.repository'
import { AuthIdentifierNormalizer } from 'src/domain/services/auth-identifier-normalizer'
import { EmailService } from 'src/infrastructure/services/email.service'
import { OtpRiskThrottleService } from './otp-risk-throttle.service'

@Injectable()
export class EmailOtpLoginService {
  constructor(
    @Inject(LOGIN_METHOD_REPOSITORY)
    private readonly loginMethodRepo: ILoginMethodRepository,
    @Inject(OTP_REPOSITORY)
    private readonly otpRepository: IOtpRepository,
    private readonly emailService: EmailService,
    private readonly otpRiskThrottleService: OtpRiskThrottleService
  ) {}

  async createChallenge(email: string): Promise<{
    challengeId: string
    expiresAt: Date
    destination: string
  }> {
    const normalizedEmail = AuthIdentifierNormalizer.normalize(LoginMethodType.EMAIL, email)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.EMAIL,
      normalizedEmail
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }

    await this.otpRiskThrottleService.assertCanSend(normalizedEmail, OTP_USAGES.LOGIN)

    const otp = OneTimeToken.createLoginOtp({
      type: OTP_TYPES.EMAIL,
      identifier: normalizedEmail,
      code: this.generateEmailCode(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    await this.otpRepository.save(otp)

    const sentCode = await this.emailService.sendEmailVerificationCode(
      normalizedEmail,
      otp.getProps().code
    )

    if (this.isDevelopmentMode()) {
      otp.updateCode(sentCode)
      await this.otpRepository.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(normalizedEmail, OTP_USAGES.LOGIN)

    return {
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      destination: normalizedEmail
    }
  }

  async authenticate(email: string, code: string): Promise<string> {
    const normalizedEmail = AuthIdentifierNormalizer.normalize(LoginMethodType.EMAIL, email)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.EMAIL,
      normalizedEmail
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }

    const otp = await this.otpRepository.findByIdentifierAndUsage(
      normalizedEmail,
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
