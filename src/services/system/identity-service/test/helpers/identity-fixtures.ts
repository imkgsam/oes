import { AccountContactAssetEntity } from '../../src/domain/entities/account-contact-asset.entity'
import { AccountOrgMembershipEntity } from '../../src/domain/entities/account-org-membership.entity'
import { AccountSummaryEntity } from '../../src/domain/entities/account-summary.entity'
import { OrgNodeEntity } from '../../src/domain/entities/org-node.entity'
import { AccountContactAssetRepository } from '../../src/domain/repositories/account-contact-asset.repository'
import { AccountOrgMembershipRepository } from '../../src/domain/repositories/account-org-membership.repository'
import { AccountRepository } from '../../src/domain/repositories/account.repository'
import { OrgRepository } from '../../src/domain/repositories/org.repository'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { UserSummaryEntity } from '../../src/domain/entities/user-summary.entity'

const DEFAULT_ASSIGNED_AT = new Date('2026-03-24T00:00:00.000Z')

export function createAccountRepositoryMock(): jest.Mocked<AccountRepository> {
  return {
    createUserAccount: jest.fn(),
    findAvailableByUserId: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    setEnabled: jest.fn(),
    updateProfile: jest.fn()
  } as unknown as jest.Mocked<AccountRepository>
}

export function createUserRepositoryMock(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByPhone: jest.fn(),
    updateBasicInfo: jest.fn()
  } as unknown as jest.Mocked<UserRepository>
}

export function createAccountContactAssetRepositoryMock(): jest.Mocked<AccountContactAssetRepository> {
  return {
    findById: jest.fn(),
    findCurrentByTenantAndTypeAndValue: jest.fn(),
    listByAccountIdAndType: jest.fn(),
    assign: jest.fn(),
    revoke: jest.fn(),
    setStatus: jest.fn(),
    setPrimary: jest.fn()
  } as unknown as jest.Mocked<AccountContactAssetRepository>
}

export function createOrgRepositoryMock(): jest.Mocked<OrgRepository> {
  return {
    findById: jest.fn(),
    findTreeByTenantId: jest.fn()
  } as unknown as jest.Mocked<OrgRepository>
}

export function createAccountOrgMembershipRepositoryMock(): jest.Mocked<AccountOrgMembershipRepository> {
  return {
    clearPrimaryByAccountId: jest.fn(),
    findByAccountAndOrg: jest.fn(),
    listByAccountId: jest.fn(),
    addSecondaryMembership: jest.fn(),
    removeMembership: jest.fn(),
    setPrimaryOrg: jest.fn()
  } as unknown as jest.Mocked<AccountOrgMembershipRepository>
}

export function createAccountSummaryFixture(
  overrides: Partial<{
    id: string
    userId: string
    tenantId: string
    scopeLevel: 'SYSTEM' | 'TENANT'
    avatarUrl: string | null
    displayName: string | null
    bio: string | null
    isEnabled: boolean
  }> = {}
): AccountSummaryEntity {
  return new AccountSummaryEntity(
    overrides.id ?? 'acc-1',
    overrides.userId ?? 'user-1',
    overrides.tenantId ?? 'tenant-1',
    overrides.scopeLevel ?? 'TENANT',
    Object.prototype.hasOwnProperty.call(overrides, 'avatarUrl') ? overrides.avatarUrl! : null,
    Object.prototype.hasOwnProperty.call(overrides, 'displayName') ? overrides.displayName! : 'demo',
    Object.prototype.hasOwnProperty.call(overrides, 'bio') ? overrides.bio! : null,
    overrides.isEnabled ?? true
  )
}

export function createContactAssetFixture(
  overrides: Partial<{
    id: string
    tenantId: string
    accountId: string
    type: string
    value: string
    status: string
    isPrimary: boolean
    assignedAt: Date
    revokedAt: Date | null
  }> = {}
): AccountContactAssetEntity {
  return new AccountContactAssetEntity(
    overrides.id ?? 'asset-1',
    overrides.tenantId ?? 'tenant-1',
    overrides.accountId ?? 'acc-1',
    overrides.type ?? 'WORK_EMAIL',
    overrides.value ?? 'user@corp.com',
    overrides.status ?? 'ACTIVE',
    overrides.isPrimary ?? false,
    overrides.assignedAt ?? DEFAULT_ASSIGNED_AT,
    Object.prototype.hasOwnProperty.call(overrides, 'revokedAt') ? overrides.revokedAt! : null
  )
}

export function createOrgNodeFixture(
  overrides: Partial<{
    id: string
    tenantId: string
    parentId: string | null
    name: string
    code: string | null
    type: string
    sortOrder: number
  }> = {}
): OrgNodeEntity {
  return new OrgNodeEntity(
    overrides.id ?? 'org-1',
    overrides.tenantId ?? 'tenant-1',
    Object.prototype.hasOwnProperty.call(overrides, 'parentId') ? overrides.parentId! : null,
    overrides.name ?? 'HQ',
    Object.prototype.hasOwnProperty.call(overrides, 'code') ? overrides.code! : null,
    overrides.type ?? 'DEPARTMENT',
    overrides.sortOrder ?? 1
  )
}

export function createAccountOrgMembershipFixture(
  overrides: Partial<{
    id: string
    accountId: string
    orgId: string
    orgName: string | null
    orgType: string | null
    relationType: string
    isPrimary: boolean
  }> = {}
): AccountOrgMembershipEntity {
  return new AccountOrgMembershipEntity(
    overrides.id ?? 'mem-1',
    overrides.accountId ?? 'acc-1',
    overrides.orgId ?? 'org-1',
    Object.prototype.hasOwnProperty.call(overrides, 'orgName') ? overrides.orgName! : 'HQ',
    Object.prototype.hasOwnProperty.call(overrides, 'orgType') ? overrides.orgType! : 'DEPARTMENT',
    overrides.relationType ?? 'SECONDARY',
    overrides.isPrimary ?? false
  )
}

export function createUserSummaryFixture(
  overrides: Partial<{
    id: string
    username: string | null
    personalEmail: string | null
    personalPhone: string | null
    isActive: boolean
  }> = {}
): UserSummaryEntity {
  return new UserSummaryEntity(
    overrides.id ?? 'user-1',
    Object.prototype.hasOwnProperty.call(overrides, 'username') ? overrides.username! : 'demo-user',
    Object.prototype.hasOwnProperty.call(overrides, 'personalEmail')
      ? overrides.personalEmail!
      : 'demo@example.com',
    Object.prototype.hasOwnProperty.call(overrides, 'personalPhone')
      ? overrides.personalPhone!
      : '13800138000',
    overrides.isActive ?? true
  )
}
