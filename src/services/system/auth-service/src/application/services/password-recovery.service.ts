import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { LoginMethodType, OTP_TYPES, OTP_USAGES, REPO } from '../../common/constants'
import { NOTIFICATION_DISPATCH_PORT } from '../../common/constants/injection-tokens'
import {
  AUTH_PASSWORD_RECOVERY_GRANT_EXPIRED,
  AUTH_PASSWORD_RECOVERY_GRANT_INVALID,
  AUTH_OTP_DELIVERY_REJECTED,
  AUTH_OTP_INVALID
} from '../../common/constants/exception-enums'
import { OneTimeToken } from '../../domain/aggregates/otp.aggregate'
import { PasswordRecoveryGrant } from '../../domain/entities/password-recovery-grant.entity'
import { ILoginMethodRepository } from '../../domain/repositories/loginmethod.repository'
import { IOtpRepository } from '../../domain/repositories/otp.repository'
import { PasswordRecoveryGrantRepository } from '../../domain/repositories/password-recovery-grant.repository'
import { AuthIdentifierNormalizer } from '../../domain/services/auth-identifier-normalizer'
import { NotificationDispatchPort } from '../../domain/services/notification-dispatch.port'
import { OtpRiskThrottleService } from './otp-risk-throttle.service'
import { AuthAuditService } from './auth-audit.service'

export interface PasswordRecoveryChannelOption {
  channel: 'EMAIL' | 'PHONE'
  maskedDestination: string
}

export interface PasswordRecoveryChannelInspectionResult {
  channels: PasswordRecoveryChannelOption[]
  defaultChannel?: 'EMAIL' | 'PHONE'
}

export interface PasswordRecoveryChallengeResult {
  accepted: boolean
  challengeId: string
  expiresAt: Date
  maskedDestination: string
}

export interface PasswordRecoveryVerificationResult {
  resetToken: string
  verified: true
}

export interface PasswordRecoveryCompletionResult {
  success: true
  sessionsRevoked: boolean
}

@Injectable()
// Issues forgot-password OTP challenges and turns verified challenges into one-time password-reset grants.
export class PasswordRecoveryService {
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.OTP)
    private readonly otpRepository: IOtpRepository,
    @Inject(REPO.PASSWORD_RECOVERY_GRANT)
    private readonly passwordRecoveryGrantRepository: PasswordRecoveryGrantRepository,
    @Inject(NOTIFICATION_DISPATCH_PORT)
    private readonly notificationDispatchPort: NotificationDispatchPort,
    private readonly otpRiskThrottleService: OtpRiskThrottleService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async inspectChannels(
    rawIdentifier: string
  ): Promise<PasswordRecoveryChannelInspectionResult> {
    const profile = await this.resolveRecoveryProfile(rawIdentifier)
    if (!profile) {
      return { channels: [] }
    }

    return {
      channels: profile.channels.map(({ channel, maskedDestination }) => ({
        channel,
        maskedDestination
      })),
      defaultChannel: profile.defaultChannel
    }
  }

  async requestChallenge(
    channel: 'EMAIL' | 'PHONE',
    rawIdentifier: string
  ): Promise<PasswordRecoveryChallengeResult> {
    const neutralResult = {
      accepted: true,
      challengeId: randomUUID(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      maskedDestination: ''
    }
    const profile = await this.resolveRecoveryProfile(rawIdentifier)
    const target = profile?.channels.find((candidate) => candidate.channel === channel)

    if (!profile || !target) {
      return neutralResult
    }

    const type = target.channel === 'EMAIL' ? LoginMethodType.EMAIL : LoginMethodType.PHONE
    await this.otpRiskThrottleService.assertCanSend(
      target.identifier,
      OTP_USAGES.RESET_PASSWORD
    )

    const otp = OneTimeToken.createResetPasswordOtp({
      type: type === LoginMethodType.EMAIL ? OTP_TYPES.EMAIL : OTP_TYPES.PHONE,
      identifier: target.identifier,
      code: this.resolveOtpCode(),
      expiredAt: neutralResult.expiresAt
    })
    await this.otpRepository.save(otp)

    const dispatch =
      target.channel === 'EMAIL'
        ? await this.notificationDispatchPort.sendAuthOtpEmail({
            recipient: target.identifier,
            code: otp.getProps().code,
            challengeId: otp.getProps().id,
            maskedDestination: target.maskedDestination,
            ttlMinutes: 5
          })
        : await this.notificationDispatchPort.sendAuthOtpSms({
            recipient: target.identifier,
            code: otp.getProps().code,
            challengeId: otp.getProps().id,
            maskedDestination: target.maskedDestination,
            ttlMinutes: 5
          })

    if (!dispatch.accepted) {
      throw ExceptionFactory.infrastructure(AUTH_OTP_DELIVERY_REJECTED, {
        channel: target.channel === 'EMAIL' ? 'email' : 'sms',
        recipient: target.identifier,
        rejectionReason: dispatch.rejectionReason ?? 'UNKNOWN'
      })
    }

    if (
      !this.isMockOtpMode() &&
      dispatch.effectiveCode &&
      dispatch.effectiveCode !== otp.getProps().code
    ) {
      otp.updateCode(dispatch.effectiveCode)
      await this.otpRepository.save(otp)
    }

    await this.otpRiskThrottleService.recordSend(
      target.identifier,
      OTP_USAGES.RESET_PASSWORD
    )
    this.authAuditService.emitPasswordRecoveryChallengeCreated(
      profile.userId,
      otp.getProps().id,
      target.channel
    )

    return {
      accepted: true,
      challengeId: otp.getProps().id,
      expiresAt: otp.getProps().expiredAt,
      maskedDestination: target.maskedDestination
    }
  }

  async verifyChallenge(
    challengeId: string,
    otpCode: string
  ): Promise<PasswordRecoveryVerificationResult> {
    const otp = await this.otpRepository.findById(challengeId)
    if (!otp || otp.getUsage() !== OTP_USAGES.RESET_PASSWORD) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    const valid = otp.verify(otpCode)
    if (!valid) {
      await this.otpRepository.save(otp)
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    const loginMethod = await this.loginMethodRepository.findValidOneByTypeAndIdentifier(
      otp.getType() === OTP_TYPES.EMAIL ? LoginMethodType.EMAIL : LoginMethodType.PHONE,
      otp.getIdentifier()
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    await this.otpRepository.markUsed(otp.getProps().id)

    const grant = PasswordRecoveryGrant.create({
      userId: loginMethod.userId,
      loginMethodId: loginMethod.id,
      challengeId: otp.getProps().id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    })
    await this.passwordRecoveryGrantRepository.save(grant)
    this.authAuditService.emitPasswordRecoveryChallengeVerified(
      loginMethod.userId,
      otp.getProps().id,
      grant.id
    )

    return {
      verified: true,
      resetToken: grant.id
    }
  }

  async consumeGrant(resetToken: string): Promise<PasswordRecoveryGrant> {
    const grant = await this.passwordRecoveryGrantRepository.findById(resetToken)
    if (!grant || grant.isConsumed()) {
      throw ExceptionFactory.domain(AUTH_PASSWORD_RECOVERY_GRANT_INVALID, {
        resetToken
      })
    }

    if (grant.isExpired()) {
      throw ExceptionFactory.domain(AUTH_PASSWORD_RECOVERY_GRANT_EXPIRED, {
        resetToken
      })
    }

    grant.consume()
    await this.passwordRecoveryGrantRepository.save(grant)

    return grant
  }

  private resolveOtpCode(): string {
    return this.isMockOtpMode()
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString()
  }

  private async resolveRecoveryProfile(
    rawIdentifier: string
  ): Promise<ResolvedPasswordRecoveryProfile | null> {
    for (const candidate of this.buildLookupCandidates(rawIdentifier)) {
      const matched = await this.loginMethodRepository.findValidOneByTypeAndIdentifier(
        candidate.type,
        candidate.identifier
      )

      if (!matched || !matched.isVerified() || !matched.isEnabled()) {
        continue
      }

      const methods = await this.loginMethodRepository.findByUserId(matched.userId)
      const channels = methods.flatMap((method) => this.toRecoveryTargets(method))
      if (!channels.length) {
        return null
      }

      return {
        userId: matched.userId,
        channels,
        defaultChannel: channels.length === 1 ? channels[0]?.channel : undefined
      }
    }

    return null
  }

  private buildLookupCandidates(
    rawIdentifier: string
  ): Array<{ identifier: string; type: LoginMethodType }> {
    const trimmed = rawIdentifier.trim()
    const candidates: Array<{ identifier: string; type: LoginMethodType }> = []

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      candidates.push({
        type: LoginMethodType.EMAIL,
        identifier: AuthIdentifierNormalizer.normalize(LoginMethodType.EMAIL, trimmed)
      })
    }

    const normalizedPhone = AuthIdentifierNormalizer.normalize(LoginMethodType.PHONE, trimmed)
    if (/^\+?\d{6,20}$/.test(normalizedPhone)) {
      candidates.push({
        type: LoginMethodType.PHONE,
        identifier: normalizedPhone
      })
    }

    return candidates
  }

  private toRecoveryTargets(
    method: Awaited<ReturnType<ILoginMethodRepository['findByUserId']>>[number]
  ): PasswordRecoveryTarget[] {
    if (!method.isVerified() || !method.isEnabled()) {
      return []
    }

    if (method.type === LoginMethodType.EMAIL) {
      return [
        {
          channel: 'EMAIL',
          identifier: method.identifier,
          maskedDestination: this.maskDestination('EMAIL', method.identifier)
        }
      ]
    }

    if (method.type === LoginMethodType.PHONE) {
      return [
        {
          channel: 'PHONE',
          identifier: method.identifier,
          maskedDestination: this.maskDestination('PHONE', method.identifier)
        }
      ]
    }

    return []
  }

  private maskDestination(channel: 'EMAIL' | 'PHONE', identifier: string): string {
    if (channel === 'EMAIL' && identifier.includes('@')) {
      const [local, domain] = identifier.split('@')
      return `${local.slice(0, 1)}***@${domain}`
    }

    if (channel === 'PHONE' && identifier.length >= 7) {
      return `${identifier.slice(0, 3)}****${identifier.slice(-4)}`
    }

    return identifier
  }

  private isMockOtpMode(): boolean {
    return process.env.AUTH_FORGOT_PASSWORD_OTP_MODE === 'mock'
  }
}

interface PasswordRecoveryTarget {
  channel: 'EMAIL' | 'PHONE'
  identifier: string
  maskedDestination: string
}

interface ResolvedPasswordRecoveryProfile {
  userId: string
  channels: PasswordRecoveryTarget[]
  defaultChannel?: 'EMAIL' | 'PHONE'
}
