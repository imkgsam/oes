import { UserSummaryEntity } from '../entities/user-summary.entity'

export interface UserRepository {
  findById(userId: string): Promise<UserSummaryEntity | null>
  findByEmail(email: string): Promise<UserSummaryEntity | null>
  findByPhone(phone: string): Promise<UserSummaryEntity | null>
}
