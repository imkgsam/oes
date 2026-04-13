import { AccountContactAssetEntity } from '../../src/domain/entities/account-contact-asset.entity'
import { AccountOrgMembershipEntity } from '../../src/domain/entities/account-org-membership.entity'
import { AccountSummaryEntity } from '../../src/domain/entities/account-summary.entity'
import { OrgNodeEntity } from '../../src/domain/entities/org-node.entity'
import { AccountContactAssetRepository } from '../../src/domain/repositories/account-contact-asset.repository'
import { AccountOrgMembershipRepository } from '../../src/domain/repositories/account-org-membership.repository'
import { AccountRepository } from '../../src/domain/repositories/account.repository'
import { OrgRepository } from '../../src/domain/repositories/org.repository'

const DEFAULT_ASSIGNED_AT = new Date('2026-03-24T00:00:00.000Z')

export function createAccountRepositoryMock(): jest.Mocked<AccountRepository> {
  return {
    findAvailableByUserId: jest.fn(),
    findById: jest.fn()
  } as unknown as jest.Mocked<AccountRepository>
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
    displayName: string | null
    isEnabled: boolean
  }> = {}
): AccountSummaryEntity {
  return new AccountSummaryEntity(
    overrides.id ?? 'acc-1',
    overrides.userId ?? 'user-1',
    overrides.tenantId ?? 'tenant-1',
    Object.prototype.hasOwnProperty.call(overrides, 'displayName') ? overrides.displayName! : 'demo',
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
