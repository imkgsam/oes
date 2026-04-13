import { Inject, Injectable } from '@nestjs/common'
import { LoginMethodType, REPO } from '../../common/constants'
import { LoginFailureState } from '../../domain/aggregates/login-failure-state.aggregate'
import { ILoginRiskRepository } from '../../domain/repositories/login-risk.repository'
import { AuthIdentifierNormalizer } from '../../domain/services/auth-identifier-normalizer'

@Injectable()
export class LoginRiskThrottleService {
  constructor(
    @Inject(REPO.LOGIN_RISK)
    private readonly loginRiskRepository: ILoginRiskRepository
  ) {}

  async assertPasswordLoginAllowed(type: LoginMethodType, identifier: string): Promise<void> {
    const state = await this.getState(type, identifier)
    state.assertCanAttempt()
  }

  async recordPasswordLoginFailure(type: LoginMethodType, identifier: string): Promise<void> {
    const state = await this.getState(type, identifier)
    state.recordFailure()
    await this.loginRiskRepository.save(state)
  }

  async clearPasswordLoginFailures(type: LoginMethodType, identifier: string): Promise<void> {
    const normalizedIdentifier = this.normalizeIdentifier(type, identifier)
    const state = await this.loginRiskRepository.findByIdentifier(normalizedIdentifier)
    if (!state) {
      return
    }

    state.recordSuccess()
    await this.loginRiskRepository.delete(normalizedIdentifier)
  }

  private async getState(type: LoginMethodType, identifier: string): Promise<LoginFailureState> {
    const normalizedIdentifier = this.normalizeIdentifier(type, identifier)

    return (
      (await this.loginRiskRepository.findByIdentifier(normalizedIdentifier)) ??
      LoginFailureState.create(normalizedIdentifier)
    )
  }

  private normalizeIdentifier(type: LoginMethodType, identifier: string): string {
    return AuthIdentifierNormalizer.normalize(type, identifier)
  }
}
