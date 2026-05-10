/** ManufacturableItemLookupResult captures the controlled item-master fields MES may rely on for spec eligibility. */
export interface ManufacturableItemLookupResult {
  itemId: string
  itemCode: string
  itemName: string
  active: boolean
  manufacturable: boolean
  physical: boolean
}

/** ManufacturableItemLookupPort validates that ProductionSpec items come from item-master query truth. */
export interface ManufacturableItemLookupPort {
  getManufacturableItem(tenantId: string, itemId: string): Promise<ManufacturableItemLookupResult | null>
}
