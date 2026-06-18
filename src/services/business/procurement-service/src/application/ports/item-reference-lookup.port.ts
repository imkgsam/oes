export interface ItemReferenceLookupResult {
  itemId: string
  itemCode: string
  itemName: string
  active: boolean
  purchasable: boolean
}

/** ItemReferenceLookupPort validates standard-item existence and purchasable capability through item-master-service query truth. */
export interface ItemReferenceLookupPort {
  getItemById(tenantId: string, itemId: string): Promise<ItemReferenceLookupResult | null>
}
