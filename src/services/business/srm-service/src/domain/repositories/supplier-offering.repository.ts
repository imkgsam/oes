import {
  PageResult,
  SupplierOfferingRecord,
  SupplierOfferingStatus
} from '../models/srm-records'

/** SupplierOfferingRepository persists the current supplierId + itemId supplyability fact for one tenant. */
export interface SupplierOfferingRepository {
  findById(tenantId: string, supplierOfferingId: string): Promise<SupplierOfferingRecord | null>
  findBySupplierAndItem(
    tenantId: string,
    supplierId: string,
    itemId: string
  ): Promise<SupplierOfferingRecord | null>
  save(offering: SupplierOfferingRecord): Promise<SupplierOfferingRecord>
  listBySupplierId(
    tenantId: string,
    supplierId: string,
    status?: SupplierOfferingStatus,
    page?: number,
    pageSize?: number
  ): Promise<PageResult<SupplierOfferingRecord>>
  listByItemId(
    tenantId: string,
    itemId: string,
    status?: SupplierOfferingStatus,
    page?: number,
    pageSize?: number
  ): Promise<PageResult<SupplierOfferingRecord>>
  hasActiveBySupplierId(tenantId: string, supplierId: string): Promise<boolean>
}
