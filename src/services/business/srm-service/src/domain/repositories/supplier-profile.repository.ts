import {
  SupplierProfileRecord,
  PageResult,
  SearchSuppliersInput
} from '../models/srm-records'

/** SupplierProfileRepository persists tenant-scoped SRM supplier-profile aggregates and directory reads. */
export interface SupplierProfileRepository {
  nextSupplierProfileNo(tenantId: string): Promise<string>
  findById(tenantId: string, supplierId: string): Promise<SupplierProfileRecord | null>
  findByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<SupplierProfileRecord | null>
  save(profile: SupplierProfileRecord): Promise<SupplierProfileRecord>
  search(input: SearchSuppliersInput): Promise<PageResult<SupplierProfileRecord>>
}
