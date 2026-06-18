import { AccountContactAssetEntity } from '../../src/domain/entities/account-contact-asset.entity'
import { AccountSummaryEntity } from '../../src/domain/entities/account-summary.entity'
import { AccountContactAssetRepository } from '../../src/domain/repositories/account-contact-asset.repository'
import { AccountRepository } from '../../src/domain/repositories/account.repository'
import { UserRepository } from '../../src/domain/repositories/user.repository'
import { UserSummaryEntity } from '../../src/domain/entities/user-summary.entity'

const DEFAULT_ASSIGNED_AT = new Date('2026-03-24T00:00:00.000Z')

export function createAccountRepositoryMock(): jest.Mocked<AccountRepository> {
  return {
    createUserAccount: jest.fn(),
    findAvailableByUserId: jest.fn(),
    findById: jest.fn(),
    findByUserScope: jest.fn(),
    getDeletionImpact: jest.fn(),
    list: jest.fn(),
    countByTenantIds: jest.fn(),
    delete: jest.fn(),
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
    listByIds: jest.fn(),
    findCurrentByTenantAndTypeAndValue: jest.fn(),
    listByAccountIdAndType: jest.fn(),
    listByAccountContactAssetFilter: jest.fn(),
    assign: jest.fn(),
    revoke: jest.fn(),
    setStatus: jest.fn(),
    setPrimary: jest.fn()
  } as unknown as jest.Mocked<AccountContactAssetRepository>
}

export function createAccountSummaryFixture(
  overrides: Partial<{
    id: string
    userId: string
    tenantId: string
    tenantPartyId: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
    avatarUrl: string | null
    avatarAssetId: string | null
    displayName: string | null
    bio: string | null
    isEnabled: boolean
  }> = {}
): AccountSummaryEntity {
  return new AccountSummaryEntity(
    overrides.id ?? 'acc-1',
    overrides.userId ?? 'user-1',
    overrides.tenantId ?? 'tenant-1',
    Object.prototype.hasOwnProperty.call(overrides, 'tenantPartyId') ? overrides.tenantPartyId! : 'tenant-party-1',
    overrides.scopeLevel ?? 'TENANT',
    Object.prototype.hasOwnProperty.call(overrides, 'avatarUrl') ? overrides.avatarUrl! : null,
    Object.prototype.hasOwnProperty.call(overrides, 'avatarAssetId') ? overrides.avatarAssetId! : null,
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
    userId: string | null
    employeeId: string | null
    type: string
    provider: string | null
    value: string
    displayName: string | null
    ownership: 'COMPANY_CONTROLLED' | 'EMPLOYEE_OWNED'
    usage: string[]
    status: string
    isPrimary: boolean
    assignedAt: Date
    releasedAt: Date | null
    revokedAt: Date | null
  }> = {}
): AccountContactAssetEntity {
  return new AccountContactAssetEntity(
    overrides.id ?? 'asset-1',
    overrides.tenantId ?? 'tenant-1',
    overrides.accountId ?? 'acc-1',
    Object.prototype.hasOwnProperty.call(overrides, 'userId') ? overrides.userId! : null,
    Object.prototype.hasOwnProperty.call(overrides, 'employeeId') ? overrides.employeeId! : null,
    overrides.type ?? 'WORK_EMAIL',
    Object.prototype.hasOwnProperty.call(overrides, 'provider') ? overrides.provider! : null,
    overrides.value ?? 'user@corp.com',
    Object.prototype.hasOwnProperty.call(overrides, 'displayName') ? overrides.displayName! : null,
    overrides.ownership ?? 'COMPANY_CONTROLLED',
    overrides.usage ?? ['WORK_CONTACT'],
    overrides.status ?? 'ACTIVE',
    overrides.isPrimary ?? false,
    overrides.assignedAt ?? DEFAULT_ASSIGNED_AT,
    Object.prototype.hasOwnProperty.call(overrides, 'releasedAt')
      ? overrides.releasedAt!
      : Object.prototype.hasOwnProperty.call(overrides, 'revokedAt')
        ? overrides.revokedAt!
        : null
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
