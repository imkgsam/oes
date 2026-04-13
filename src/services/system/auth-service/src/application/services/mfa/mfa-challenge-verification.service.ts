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
    if (!binding || binding.getType() !== MfaType.TOTP || !binding.isBindingActive()) {
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

      await this.mfaBindingRepo.save(backupBinding)
      return binding.getUserId()
    } catch {
      return null
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
}
