import { AccountCandidateEntity } from '../../domain/entities/account-candidate.entity'
import { AccountSummaryEntity } from '../../domain/entities/account-summary.entity'

type UserAccountWithTenant = {
  id: string
  userId: string
  tenantId: string | null
  scopeLevel?: 'SYSTEM' | 'TENANT'
  displayName: string | null
  isEnable: boolean
  Tenant: {
    isActive: boolean
  } | null
}

export class PrismaAccountCandidateMapper {
  // Converts a Prisma account record into the scope-aware account candidate domain model.
  static toDomain(record: UserAccountWithTenant): AccountCandidateEntity {
    const scopeLevel = normalizeScopeLevel(record.scopeLevel)
    return new AccountCandidateEntity(
      record.id,
      record.tenantId,
      scopeLevel,
      record.displayName ?? null,
      isAccountEnabled(record, scopeLevel)
    )
  }
}

export class PrismaAccountSummaryMapper {
  // Converts a Prisma account record into the scope-aware account summary domain model.
  static toDomain(record: UserAccountWithTenant): AccountSummaryEntity {
    const scopeLevel = normalizeScopeLevel(record.scopeLevel)
    return new AccountSummaryEntity(
      record.id,
      record.userId,
      record.tenantId,
      scopeLevel,
      record.displayName ?? null,
      isAccountEnabled(record, scopeLevel)
    )
  }
}

function normalizeScopeLevel(scopeLevel?: string): 'SYSTEM' | 'TENANT' {
  return scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
}

function isAccountEnabled(record: UserAccountWithTenant, scopeLevel: 'SYSTEM' | 'TENANT'): boolean {
  if (!record.isEnable) {
    return false
  }

  if (scopeLevel === 'SYSTEM') {
    return record.tenantId === null
  }

  return Boolean(record.tenantId) && record.Tenant?.isActive !== false
}
