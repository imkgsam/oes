import { AccountCandidateEntity } from '../../domain/entities/account-candidate.entity'
import { AccountSummaryEntity } from '../../domain/entities/account-summary.entity'

type UserAccountWithTenant = {
  id: string
  userId: string
  tenantId: string
  isEnable: boolean
  Tenant: {
    name: string
    isActive: boolean
  }
}

export class PrismaAccountMapper {
  static toEntity(record: UserAccountWithTenant): AccountCandidateEntity {
    return new AccountCandidateEntity(
      record.id,
      record.tenantId,
      record.Tenant?.name ?? null,
      record.isEnable && record.Tenant?.isActive !== false
    )
  }

  static toSummaryEntity(record: UserAccountWithTenant): AccountSummaryEntity {
    return new AccountSummaryEntity(
      record.id,
      record.userId,
      record.tenantId,
      record.Tenant?.name ?? null,
      record.isEnable && record.Tenant?.isActive !== false
    )
  }
}
