import { AccountCandidateEntity } from '../../domain/entities/account-candidate.entity'
import { AccountSummaryEntity } from '../../domain/entities/account-summary.entity'

type UserAccountWithTenant = {
  id: string
  userId: string
  tenantId: string
  displayName: string | null
  isEnable: boolean
  Tenant: {
    isActive: boolean
  }
}

export class PrismaAccountCandidateMapper {
  static toDomain(record: UserAccountWithTenant): AccountCandidateEntity {
    return new AccountCandidateEntity(
      record.id,
      record.tenantId,
      record.displayName ?? null,
      record.isEnable && record.Tenant?.isActive !== false
    )
  }
}

export class PrismaAccountSummaryMapper {
  static toDomain(record: UserAccountWithTenant): AccountSummaryEntity {
    return new AccountSummaryEntity(
      record.id,
      record.userId,
      record.tenantId,
      record.displayName ?? null,
      record.isEnable && record.Tenant?.isActive !== false
    )
  }
}
