import { User } from '../../../prisma/generated/prisma/index'
import { UserSummaryEntity } from '../../domain/entities/user-summary.entity'

export class PrismaUserMapper {
  static toDomain(record: User): UserSummaryEntity {
    return new UserSummaryEntity(
      record.id,
      record.username ?? null,
      record.email ?? null,
      record.phone ?? null,
      record.isActive
    )
  }
}
