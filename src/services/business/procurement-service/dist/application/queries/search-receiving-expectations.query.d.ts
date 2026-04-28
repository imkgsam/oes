import { ReceivingExpectationStatus } from '../../domain/models/procurement-records';
/** SearchReceivingExpectationsQuery carries the paged procurement expectation filters frozen for phase 1. */
export declare class SearchReceivingExpectationsQuery {
    readonly input: {
        tenantId: string;
        orgId?: string;
        purchaseOrderId?: string;
        supplierId?: string;
        status?: ReceivingExpectationStatus;
        hasOpenDiscrepancy?: boolean;
        expectedReceiptDateFrom?: string;
        expectedReceiptDateTo?: string;
        page?: number;
        pageSize?: number;
    };
    constructor(input: SearchReceivingExpectationsQuery['input']);
}
