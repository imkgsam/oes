/** ReceivingExpectationLookupResult captures the controlled procurement fields WMS may rely on during receipt validation. */
export interface ReceivingExpectationLookupResult {
    receivingExpectationId: string;
    purchaseOrderId: string;
    purchaseOrderLineId: string;
    targetWarehouseId?: string | null;
    openQuantity: string;
    status: string;
}
/** ReceivingExpectationLookupPort validates referenced procurement expectations without copying their owner truth. */
export interface ReceivingExpectationLookupPort {
    getReceivingExpectationById(tenantId: string, receivingExpectationId: string): Promise<ReceivingExpectationLookupResult | null>;
}
