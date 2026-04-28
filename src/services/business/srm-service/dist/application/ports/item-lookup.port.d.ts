export interface ItemLookupResult {
    itemId: string;
    itemCode: string;
    itemName: string;
    status: string;
    purchasable: boolean;
}
/** ItemLookupPort validates item identity and purchasable capability through item-master-service query truth. */
export interface ItemLookupPort {
    getItemById(tenantId: string, itemId: string): Promise<ItemLookupResult | null>;
}
