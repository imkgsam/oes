import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTH_MFA_BINDING_NOT_FOUND } from '../../../common/constants/exception-enums'
import { LoginMethodType, MfaType, OTP_TYPES, REPO } from '../../../common/constants'
import { IMfaBindingRepository } from '../../../domain/repositories/mfaBinding.repository'
import { IOtpRepository } from '../../../domain/repositories/otp.repository'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'

@Injectable()
export class MfaChallengeVerificationService {
  constructor(
    @Inject(REPO.OTP)
    private readonly oneTimeTokenRepo: IOtpRepository,
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepo: ILoginMethodRepository,
    @Inject(REPO.MFA_BINDING)
    private readonly mfaBindingRepo: IMfaBindingRepository
  ) {}

  async verifyChallenge(tokenId: string, code: string): Promise<string | null> {
    const token = await this.oneTimeTokenRepo.findById(tokenId)
    if (token) {
      if (!token.isMfaOtp()) {
        return null
      }

      const isValid = token.verify(code)
      if (!isValid) {
        await this.oneTimeTokenRepo.save(token)
        return null
      }

      await this.oneTimeTokenRepo.markUsed(tokenId)

      const identifier = token.getIdentifier()
      if (token.getProps().type === OTP_TYPES.EMAIL) {
        return this.getUserIdByEmail(identifier)
      }
      if (token.getProps().type === OTP_TYPES.PHONE) {
        return this.getUserIdByPhone(identifier)
      }

      return null
    }

    const binding = await this.mfaBindingRepo.findById(tokenId)
    if (
      !binding ||
      binding.getType() !== MfaType.TOTP ||
      !binding.isBindingActive() ||
      binding.isSeededTestBinding()
    ) {
      return null
    }

    try {
      const validTotp = binding.verifyTotp(code)
      if (validTotp) {
        return binding.getUserId()
      }
    } catch {
      return null
    }

    try {
      const backupBinding = await this.mfaBindingRepo.findByUserIdAndType(
        binding.getUserId(),
        MfaType.BACKUP_CODE
      )
      if (!backupBinding?.isBindingActive()) {
        return null
      }

      const consumed = await backupBinding.consumeBackupCode(code)
      if (!consumed) {
        return null
      }

      backupBinding.invalidateBackupCodes()
      await this.mfaBindingRepo.save(backupBinding)
      return binding.getUserId()
    } catch {
      return null
    }
  }

  async verifySelectedFactor(input: {
    userId: string
    factor: MfaType
    code: string
    factorChallengeId?: string
  }): Promise<boolean> {
    switch (input.factor) {
      case MfaType.EMAIL_OTP:
        return this.verifyOtpFactor(input.userId, OTP_TYPES.EMAIL, input.code, input.factorChallengeId)
      case MfaType.SMS_OTP:
        return this.verifyOtpFactor(input.userId, OTP_TYPES.PHONE, input.code, input.factorChallengeId)
      case MfaType.TOTP:
        return this.verifyTotpFactor(input.userId, input.code)
      case MfaType.BACKUP_CODE:
        return this.verifyBackupCodeFactor(input.userId, input.code)
      default:
        return false
    }
  }

  private async getUserIdByEmail(email: string): Promise<string> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier(
      LoginMethodType.EMAIL,
      email
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND)
    }
    return loginMethod.userId
  }

  private async getUserIdByPhone(phone: string): Promise<string> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier(
      LoginMethodType.PHONE,
      phone
    )
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND)
    }
    return loginMethod.userId
  }

  private async verifyOtpFactor(
    userId: string,
    type: OTP_TYPES.EMAIL | OTP_TYPES.PHONE,
    code: string,
    factorChallengeId?: string
  ): Promise<boolean> {
    if (!factorChallengeId) {
      return false
    }

    const token = await this.oneTimeTokenRepo.findById(factorChallengeId)
    if (!token || !token.isMfaOtp() || token.getType() !== type) {
      return false
    }

    const isValid = token.verify(code)
    if (!isValid) {
      await this.oneTimeTokenRepo.save(token)
      return false
    }

    await this.oneTimeTokenRepo.markUsed(factorChallengeId)
    const resolvedUserId =
      type === OTP_TYPES.EMAIL
        ? await this.getUserIdByEmail(token.getIdentifier())
        : await this.getUserIdByPhone(token.getIdentifier())

    return resolvedUserId === userId
  }

  private async verifyTotpFactor(userId: string, code: string): Promise<boolean> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    if (!binding || !binding.isBindingActive() || binding.isSeededTestBinding()) {
      return false
    }

    try {
      return binding.verifyTotp(code)
    } catch {
      return false
    }
  }

  private async verifyBackupCodeFactor(userId: string, code: string): Promise<boolean> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.BACKUP_CODE)
    if (!binding || !binding.isBindingActive()) {
      return false
    }

    try {
      const consumed = await binding.consumeBackupCode(code)
      if (!consumed) {
        return false
      }

      binding.invalidateBackupCodes()
      await this.mfaBindingRepo.save(binding)
      return true
    } catch {
      return false
    }
  }
}
