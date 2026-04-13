import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { MfaType, REPO } from '../../../common/constants'
import { AUTH_MFA_BINDING_NOT_FOUND } from '../../../common/constants/exception-enums'
import { IMfaBindingRepository } from '../../../domain/repositories/mfaBinding.repository'

@Injectable()
export class TotpMfaChallengeService {
  constructor(
    @Inject(REPO.MFA_BINDING)
    private readonly mfaBindingRepo: IMfaBindingRepository
  ) {}

  async hasActiveBinding(userId: string): Promise<boolean> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    return binding?.isBindingActive() ?? false
  }

  async createChallenge(userId: string): Promise<{ challengeId: string }> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    if (!binding || !binding.isBindingActive()) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND, { userId, type: MfaType.TOTP })
    }

    return {
      challengeId: binding.getId()
    }
  }
}
