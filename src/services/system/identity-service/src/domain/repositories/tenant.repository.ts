import { TenantSummaryEntity } from '../entities/tenant-summary.entity'

export interface TenantRepository {
  findById(tenantId: string): Promise<TenantSummaryEntity | null>
}
