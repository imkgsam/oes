import { TenantSummaryEntity } from '../entities/tenant-summary.entity'

export interface TenantRepository {
  findById(tenantId: string): Promise<TenantSummaryEntity | null>
  list(input?: {
    tenantId?: string
    keyword?: string
    pageSize?: number
    isActive?: boolean
  }): Promise<TenantSummaryEntity[]>
}
