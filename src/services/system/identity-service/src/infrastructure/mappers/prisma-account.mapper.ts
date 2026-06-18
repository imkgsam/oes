import { AccountCandidateEntity } from '../../domain/entities/account-candidate.entity'
import { AccountDirectoryEntity } from '../../domain/entities/account-directory.entity'
import { AccountSummaryEntity } from '../../domain/entities/account-summary.entity'

type UserAccountWithTenant = {
  id: string
  userId: string
  tenantId: string | null
  tenantPartyId: string | null
  scopeLevel?: 'SYSTEM' | 'TENANT'
  avatarUrl: string | null
  avatarAssetId: string | null
  displayName: string | null
  bio: string | null
  isEnable: boolean
  User?: {
    username?: string | null
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
      record.tenantPartyId,
      scopeLevel,
      record.avatarUrl ?? null,
      record.avatarAssetId ?? null,
      record.displayName ?? null,
      record.bio ?? null,
      isAccountEnabled(record, scopeLevel)
    )
  }
}

export class PrismaAccountDirectoryMapper {
  // Converts a Prisma account record into the account-directory read model used by admin account management.
  static toDomain(record: UserAccountWithTenant): AccountDirectoryEntity {
    const scopeLevel = normalizeScopeLevel(record.scopeLevel)
    return new AccountDirectoryEntity(
      record.id,
      record.userId,
      record.tenantId,
      record.tenantPartyId,
      scopeLevel,
      record.displayName ?? null,
      record.User?.username ?? null,
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

  return Boolean(record.tenantId)
}
