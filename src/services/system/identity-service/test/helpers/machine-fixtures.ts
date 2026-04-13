import {
  API_KEY_STATUSES,
  MACHINE_PRINCIPAL_SCOPE_LEVELS,
  MACHINE_PRINCIPAL_STATUSES,
  MACHINE_PRINCIPAL_TYPES
} from '../../src/common/constants'
import { ApiKeyEntity } from '../../src/domain/entities/api-key.entity'
import { ServiceAccountEntity } from '../../src/domain/entities/service-account.entity'
import { ApiKeyRepository } from '../../src/domain/repositories/api-key.repository'
import { ServiceAccountRepository } from '../../src/domain/repositories/service-account.repository'
import { TenantRepository } from '../../src/domain/repositories/tenant.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

const DEFAULT_CREATED_AT = new Date('2026-03-28T00:00:00.000Z')
const DEFAULT_UPDATED_AT = new Date('2026-03-28T00:00:00.000Z')

export function createApiKeyRepositoryMock(): jest.Mocked<ApiKeyRepository> {
  return {
    findById: jest.fn(),
    findByHashedValue: jest.fn(),
    listByServiceAccountId: jest.fn(),
    create: jest.fn(),
    revoke: jest.fn(),
    touchLastUsed: jest.fn()
  } as unknown as jest.Mocked<ApiKeyRepository>
}

export function createServiceAccountRepositoryMock(): jest.Mocked<ServiceAccountRepository> {
  return {
    findById: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    setStatus: jest.fn()
  } as unknown as jest.Mocked<ServiceAccountRepository>
}

export function createTenantRepositoryMock(): jest.Mocked<TenantRepository> {
  return {
    findById: jest.fn()
  } as unknown as jest.Mocked<TenantRepository>
}

export function createServiceAccountFixture(
  overrides: Partial<{
    id: string
    tenantId: string | null
    scopeLevel: string
    type: string
    name: string
    description: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    createdBy: string | null
    disabledAt: Date | null
    disabledBy: string | null
  }> = {}
): ServiceAccountEntity {
  return new ServiceAccountEntity(
    overrides.id ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    Object.prototype.hasOwnProperty.call(overrides, 'tenantId') ? overrides.tenantId! : null,
    overrides.scopeLevel ?? MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM,
    overrides.type ?? MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE,
    overrides.name ?? 'internal-bot',
    Object.prototype.hasOwnProperty.call(overrides, 'description') ? overrides.description! : null,
    overrides.status ?? MACHINE_PRINCIPAL_STATUSES.ACTIVE,
    overrides.createdAt ?? DEFAULT_CREATED_AT,
    overrides.updatedAt ?? DEFAULT_UPDATED_AT,
    Object.prototype.hasOwnProperty.call(overrides, 'createdBy')
      ? overrides.createdBy!
      : '11111111-1111-4111-8111-111111111111',
    Object.prototype.hasOwnProperty.call(overrides, 'disabledAt') ? overrides.disabledAt! : null,
    Object.prototype.hasOwnProperty.call(overrides, 'disabledBy') ? overrides.disabledBy! : null
  )
}

export function createApiKeyFixture(
  overrides: Partial<{
    id: string
    serviceAccountId: string
    keyCode: string
    status: string
    expiresAt: Date | null
    lastUsedAt: Date | null
    createdAt: Date
    updatedAt: Date
    createdBy: string | null
    revokedAt: Date | null
    revokedBy: string | null
  }> = {}
): ApiKeyEntity {
  return new ApiKeyEntity(
    overrides.id ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    overrides.serviceAccountId ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    overrides.keyCode ?? 'key_fixture',
    overrides.status ?? API_KEY_STATUSES.ACTIVE,
    Object.prototype.hasOwnProperty.call(overrides, 'expiresAt') ? overrides.expiresAt! : null,
    Object.prototype.hasOwnProperty.call(overrides, 'lastUsedAt') ? overrides.lastUsedAt! : null,
    overrides.createdAt ?? DEFAULT_CREATED_AT,
    overrides.updatedAt ?? DEFAULT_UPDATED_AT,
    Object.prototype.hasOwnProperty.call(overrides, 'createdBy')
      ? overrides.createdBy!
      : '11111111-1111-4111-8111-111111111111',
    Object.prototype.hasOwnProperty.call(overrides, 'revokedAt') ? overrides.revokedAt! : null,
    Object.prototype.hasOwnProperty.call(overrides, 'revokedBy') ? overrides.revokedBy! : null
  )
}

export async function seedMachineTenant(
  prisma: PrismaService,
  prefix: string
) {
  return prisma.tenant.create({
    data: {
      id: `${prefix}_tenant`,
      entityId: `${prefix}_tenant_entity`,
      name: `${prefix}_tenant_name`,
      code: `${prefix}_tenant_code`
    }
  })
}

export async function seedMachineServiceAccount(
  prisma: PrismaService,
  prefix: string
) {
  return prisma.serviceAccount.create({
    data: {
      id: `${prefix}_service_account`,
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM,
      type: MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE,
      name: `${prefix}_service_account_name`
    }
  })
}
