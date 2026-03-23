import { LoginFailureState } from '../aggregates/login-failure-state.aggregate'

export interface ILoginRiskRepository {
  findByIdentifier(identifier: string): Promise<LoginFailureState | null>
  save(state: LoginFailureState): Promise<void>
  delete(identifier: string): Promise<void>
}
