/** ApplyPurchaseOrderChangeCommand carries one applied change payload plus the target PO state to persist. */
export declare class ApplyPurchaseOrderChangeCommand {
    readonly payload: {
        tenantId: string;
        purchaseOrderId: string;
        changeType: string;
        changeReason: string;
        appliedBy: {
            operatorId: string;
            displayName: string;
        };
        targetState: {
            lines?: Array<{
                purchaseOrderLineId?: string;
                lineType: string;
                itemId?: string;
                description: string;
                orderedQuantity: string;
                uom: string;
                orderedUnitPrice?: string;
                sourcePurchaseRequestLineId?: string;
                generalStockExcessReason?: string;
                allocations: Array<{
                    allocationType: string;
                    sourceReferenceId?: string;
                    quantity: string;
                    reason?: string;
                    targetWarehouseId?: string;
                    targetReceivingAddressId?: string;
                }>;
            }>;
            supplierAcknowledgement?: {
                acknowledgementStatus?: string;
                acknowledgedAt?: string;
                externalReference?: string;
                comment?: string;
            };
        };
    };
    constructor(payload: ApplyPurchaseOrderChangeCommand['payload']);
}
