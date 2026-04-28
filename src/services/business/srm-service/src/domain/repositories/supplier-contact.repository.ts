import { SupplierContactRecord } from '../models/srm-records'

/** SupplierContactRepository persists SRM business-contact records under one supplier profile. */
export interface SupplierContactRepository {
  findById(tenantId: string, supplierId: string, supplierContactId: string): Promise<SupplierContactRecord | null>
  save(contact: SupplierContactRecord): Promise<SupplierContactRecord>
  listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierContactRecord[]>
}
