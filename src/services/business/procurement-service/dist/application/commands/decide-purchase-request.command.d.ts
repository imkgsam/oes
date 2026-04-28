import { PurchaseRequestDecision } from '../../domain/models/procurement-records';
/** DecidePurchaseRequestCommand carries the phase 1 approve-or-reject decision payload for one submitted PR. */
export declare class DecidePurchaseRequestCommand {
    readonly payload: {
        tenantId: string;
        purchaseRequestId: string;
        decision: PurchaseRequestDecision | string;
        comment?: string;
        approvalReference?: string;
        decidedBy: {
            operatorId: string;
            displayName: string;
        };
    };
    constructor(payload: DecidePurchaseRequestCommand['payload']);
}
