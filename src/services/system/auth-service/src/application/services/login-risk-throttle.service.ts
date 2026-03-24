import { Inject, Injectable } from '@nestjs/common'
import { REPO } from 'src/common/constants'
import { LoginFailureState } from 'src/domain/aggregates/login-failure-state.aggregate'
import { ILoginRiskRepository } from 'src/domain/repositories/login-risk.repository'

@Injectable()
export class LoginRiskThrottleService {
  constructor(
    @Inject(REPO.LOGIN_RISK)
    private readonly loginRiskRepository: ILoginRiskRepository
  ) {}

  async assertPasswordLoginAllowed(identifier: string): Promise<void> {
    const state = await this.getState(identifier)
    state.assertCanAttempt()
  }

  async recordPasswordLoginFailure(identifier: string): Promise<void> {
    const state = await this.getState(identifier)
    state.recordFailure()
    await this.loginRiskRepository.save(state)
  }

  async clearPasswordLoginFailures(identifier: string): Promise<void> {
    const state = await this.loginRiskRepository.findByIdentifier(identifier)
    if (!state) {
      return
    }

    state.recordSuccess()
    await this.loginRiskRepository.delete(identifier)
  }

  private async getState(identifier: string): Promise<LoginFailureState> {
    return (
      (await this.loginRiskRepository.findByIdentifier(identifier)) ??
      LoginFailureState.create(identifier)
    )
  }
}
