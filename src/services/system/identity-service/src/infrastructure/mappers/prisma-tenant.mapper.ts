import { Tenant } from '../../../prisma/generated/prisma/index'
import { TenantSummaryEntity } from '../../domain/entities/tenant-summary.entity'

export class PrismaTenantMapper {
  static toDomain(record: Tenant): TenantSummaryEntity {
    return new TenantSummaryEntity(
      record.id,
      record.code,
      record.name,
      record.isActive
    )
  }
}
