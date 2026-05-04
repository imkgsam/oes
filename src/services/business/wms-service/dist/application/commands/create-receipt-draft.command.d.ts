import { ReceiptSourceType } from '../../domain/models/wms-records';
export interface CreateReceiptDraftPayload {
    tenantId: string;
    orgId?: string;
    warehouseId: string;
    receiptSourceType: ReceiptSourceType;
    receiptDate?: string;
    referencedReceivingExpectationIds: string[];
    note?: string;
    attachmentRefs: string[];
}
/** CreateReceiptDraftCommand captures one request to create a WMS-owned draft receipt header. */
export declare class CreateReceiptDraftCommand {
    readonly payload: CreateReceiptDraftPayload;
    constructor(payload: CreateReceiptDraftPayload);
}
