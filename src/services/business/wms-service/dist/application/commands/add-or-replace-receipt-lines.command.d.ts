import { InventoryStatus, ReceiptPhysicalDiscrepancyRecord, ReceiptTrackingRefRecord, RestrictedStatusReasonRecord } from '../../domain/models/wms-records';
export interface AddOrReplaceReceiptLineInput {
    receiptLineId?: string;
    itemId: string;
    receivingExpectationId?: string;
    targetLocationId: string;
    confirmedQuantity: string;
    uom: string;
    inventoryStatus: InventoryStatus;
    restrictedReason?: RestrictedStatusReasonRecord;
    trackingRefs: ReceiptTrackingRefRecord[];
    physicalDiscrepancy?: ReceiptPhysicalDiscrepancyRecord;
    evidenceAttachmentRefs: string[];
}
export interface AddOrReplaceReceiptLinesPayload {
    tenantId: string;
    receiptId: string;
    lines: AddOrReplaceReceiptLineInput[];
}
/** AddOrReplaceReceiptLinesCommand captures one full-replacement write to the line set of a draft receipt. */
export declare class AddOrReplaceReceiptLinesCommand {
    readonly payload: AddOrReplaceReceiptLinesPayload;
    constructor(payload: AddOrReplaceReceiptLinesPayload);
}
