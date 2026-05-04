/** StockableItemLookupResult captures the controlled item-master fields WMS may rely on during receipt validation. */
export interface StockableItemLookupResult {
    itemId: string;
    itemCode: string;
    itemName: string;
    status: string;
    stockable: boolean;
}
/** StockableItemLookupPort validates WMS receipt items through item-master-service query truth. */
export interface StockableItemLookupPort {
    getItemById(tenantId: string, itemId: string): Promise<StockableItemLookupResult | null>;
}
