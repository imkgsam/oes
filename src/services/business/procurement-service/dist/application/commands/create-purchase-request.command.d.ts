import { PurchaseRequestType } from '../../domain/models/procurement-records';
/** CreatePurchaseRequestCommand carries the phase 1 procurement demand-intake payload. */
export declare class CreatePurchaseRequestCommand {
    readonly payload: {
        tenantId: string;
        orgId?: string;
        requester: {
            operatorId: string;
            displayName: string;
        };
        requestType: PurchaseRequestType | string;
        title?: string;
        reason?: string;
        lines: Array<{
            lineType: string;
            itemId?: string;
            description: string;
            requestedQuantity: string;
            uom: string;
            neededByDate?: string;
            demandReferenceType?: string;
            demandReferenceId?: string;
        }>;
    };
    constructor(payload: CreatePurchaseRequestCommand['payload']);
}
