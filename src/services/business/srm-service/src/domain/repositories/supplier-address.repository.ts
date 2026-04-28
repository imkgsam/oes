import { SupplierAddressRecord } from '../models/srm-records'

/** SupplierAddressRepository persists SRM business-address records under one supplier profile. */
export interface SupplierAddressRepository {
  findById(tenantId: string, supplierId: string, supplierAddressId: string): Promise<SupplierAddressRecord | null>
  save(address: SupplierAddressRecord): Promise<SupplierAddressRecord>
  listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierAddressRecord[]>
}
