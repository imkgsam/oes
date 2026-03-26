import {
  MachinePrincipalScopeLevel,
  MachinePrincipalStatus,
  MachinePrincipalType,
  ServiceAccount
} from '../../../prisma/generated/prisma'
import { ServiceAccountEntity } from '../../domain/entities/service-account.entity'

export class PrismaServiceAccountMapper {
  static toDomain(record: ServiceAccount): ServiceAccountEntity {
    return new ServiceAccountEntity(
      record.id,
      record.tenantId ?? null,
      MachinePrincipalScopeLevel[record.scopeLevel],
      MachinePrincipalType[record.type],
      record.name,
      record.description ?? null,
      MachinePrincipalStatus[record.status],
      record.createdAt,
      record.updatedAt,
      record.createdBy ?? null,
      record.disabledAt ?? null,
      record.disabledBy ?? null
    )
  }

  static toPersistent(input: {
    tenantId?: string
    scopeLevel: MachinePrincipalScopeLevel
    type: MachinePrincipalType
    name: string
    description?: string
    status: MachinePrincipalStatus
    createdBy?: string
  }) {
    return {
      tenantId: input.tenantId ?? null,
      scopeLevel: input.scopeLevel,
      type: input.type,
      name: input.name,
      description: input.description?.trim() || null,
      status: input.status,
      createdBy: input.createdBy ?? null
    }
  }
}
