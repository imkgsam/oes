import { UserSummaryEntity } from '../entities/user-summary.entity'

export interface UserRepository {
  findByEmail(email: string): Promise<UserSummaryEntity | null>
}
