import { Inject, Injectable } from '@nestjs/common'
import { createBusinessException } from '@oes/common/exceptions'
import { AUTH_MFA_BINDING_NOT_FOUND } from 'src/common/constants/exception-enums'
import { LoginMethodType, OTP_TYPES } from 'src/common/constants'
import { OTP_REPOSITORY, USER_REPOSITORY } from 'src/common/constants/injection-tokens'
import { IOtpRepository } from 'src/domain/repositories/otp.repository'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'

@Injectable()
export class MfaChallengeVerificationService {
  constructor(
    @Inject(OTP_REPOSITORY)
    private readonly oneTimeTokenRepo: IOtpRepository,
    @Inject(USER_REPOSITORY)
    private readonly loginMethodRepo: ILoginMethodRepository
  ) {}

  async verifyChallenge(tokenId: string, code: string): Promise<string | null> {
    const token = await this.oneTimeTokenRepo.findById(tokenId)
    if (!token) return null

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

  private async getUserIdByEmail(email: string): Promise<string> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier(
      LoginMethodType.EMAIL,
      email
    )
    if (!loginMethod) {
      throw createBusinessException(AUTH_MFA_BINDING_NOT_FOUND)
    }
    return loginMethod.userId
  }

  private async getUserIdByPhone(phone: string): Promise<string> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier(
      LoginMethodType.PHONE,
      phone
    )
    if (!loginMethod) {
      throw createBusinessException(AUTH_MFA_BINDING_NOT_FOUND)
    }
    return loginMethod.userId
  }
}
