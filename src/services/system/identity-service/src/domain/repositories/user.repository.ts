import { UserSummaryEntity } from '../entities/user-summary.entity'

export interface UserRepository {
  create(input: {
    username?: string | null
    email?: string | null
    phone?: string | null
    isActive?: boolean
  }): Promise<UserSummaryEntity>
  updateBasicInfo(
    userId: string,
    input: {
      email?: string | null
      phone?: string | null
    }
  ): Promise<UserSummaryEntity>
  findById(userId: string): Promise<UserSummaryEntity | null>
  findByEmail(email: string): Promise<UserSummaryEntity | null>
  findByPhone(phone: string): Promise<UserSummaryEntity | null>
}
