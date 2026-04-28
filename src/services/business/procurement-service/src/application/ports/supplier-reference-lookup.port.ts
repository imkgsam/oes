export interface SupplierReferenceLookupResult {
  supplierId: string
  supplierDisplayName: string
  status: string
}

export interface SupplierOfferingReferenceLookupResult {
  supplierOfferingId: string
  supplierId: string
  itemId: string
  status: string
}

/** SupplierReferenceLookupPort validates supplier activity and standard-item offerability through srm-service query truth. */
export interface SupplierReferenceLookupPort {
  getSupplierById(tenantId: string, supplierId: string): Promise<SupplierReferenceLookupResult | null>
  getActiveSupplierOffering(
    tenantId: string,
    supplierId: string,
    itemId: string
  ): Promise<SupplierOfferingReferenceLookupResult | null>
}
