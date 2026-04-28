import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port';
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port';
import { OperatorSummary, PurchaseOrderChangeRecord, PurchaseOrderLineAllocationType, PurchaseOrderLineRecord, PurchaseOrderRecord, PurchaseOrderSupplierAcknowledgementRecord, PurchaseOrderSupplierSnapshotRecord, PurchaseRequestLineRecord, PurchaseRequestLineType } from '../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
export interface PurchaseRequestLineInputLike {
    lineType: string;
    itemId?: string;
    description: string;
    requestedQuantity: string;
    uom: string;
    neededByDate?: string;
    demandReferenceType?: string;
    demandReferenceId?: string;
}
export interface PurchaseOrderLineAllocationInputLike {
    allocationType: string;
    referenceId?: string;
    quantity: string;
    reason?: string;
}
export interface PurchaseOrderLineInputLike {
    purchaseOrderLineId?: string;
    lineType: string;
    itemId?: string;
    description: string;
    orderedQuantity: string;
    uom: string;
    orderedUnitPrice?: string;
    sourcePurchaseRequestLineId?: string;
    generalStockExcessReason?: string;
    allocations: PurchaseOrderLineAllocationInputLike[];
}
/** nowIso returns the current wall-clock ISO timestamp for phase 1 record mutations. */
export declare function nowIso(): string;
/** cloneOrderForMutation returns a writable deep copy of one PO aggregate. */
export declare function cloneOrderForMutation(order: PurchaseOrderRecord): PurchaseOrderRecord;
/** buildSupplierAcknowledgement returns the minimal pending acknowledgement summary required by phase 1 POs. */
export declare function buildSupplierAcknowledgement(current?: Partial<PurchaseOrderSupplierAcknowledgementRecord>): PurchaseOrderSupplierAcknowledgementRecord;
/** buildDraftSupplierSnapshot preserves the supplier reference on drafts without inventing SRM commercial truth. */
export declare function buildDraftSupplierSnapshot(supplierId: string): PurchaseOrderSupplierSnapshotRecord;
/** materializePurchaseRequestLines validates PR line inputs and snapshots standard-item summaries at intake time. */
export declare function materializePurchaseRequestLines(tenantId: string, lines: PurchaseRequestLineInputLike[], itemLookup: ItemReferenceLookupPort): Promise<PurchaseRequestLineRecord[]>;
/** materializeDraftPurchaseOrderLines validates PO draft line inputs and enforces allocation, excess, and standard-item invariants. */
export declare function materializeDraftPurchaseOrderLines(input: {
    tenantId: string;
    lines: PurchaseOrderLineInputLike[];
    itemLookup?: ItemReferenceLookupPort;
    purchaseRequestRepository?: PurchaseRequestRepository;
    sourcePurchaseRequestIds?: string[];
    existingLineById?: Map<string, PurchaseOrderLineRecord>;
}): Promise<PurchaseOrderLineRecord[]>;
/** assertIssuableSupplierSnapshot validates the supplier truth and returns the transaction snapshot frozen at PO issue time. */
export declare function assertIssuableSupplierSnapshot(supplierLookup: SupplierReferenceLookupPort, tenantId: string, supplierId: string): Promise<PurchaseOrderSupplierSnapshotRecord>;
/** assertStandardLineOfferings validates standard-item issue gates and stamps offering ids onto line snapshots. */
export declare function assertStandardLineOfferings(supplierLookup: SupplierReferenceLookupPort, tenantId: string, supplierId: string, lines: PurchaseOrderLineRecord[]): Promise<PurchaseOrderLineRecord[]>;
/** buildChangeSummary renders the minimal applied-change summary frozen for phase 1 change history. */
export declare function buildChangeSummary(changeType: string, lineCount: number): string;
/** buildAppliedChange creates one APPLIED change fact without inventing a workflow layer. */
export declare function buildAppliedChange(input: {
    purchaseOrderId: string;
    changeType: string;
    changeReason: string;
    appliedBy: OperatorSummary;
    appliedAt?: string;
    lineCount: number;
}): PurchaseOrderChangeRecord;
/** buildConvertedPurchaseOrderLines materializes a PO draft from one approved PR selection set. */
export declare function buildConvertedPurchaseOrderLines(input: {
    tenantId: string;
    supplierId: string;
    purchaseRequestLines: PurchaseRequestLineRecord[];
    selections: Array<{
        purchaseRequestLineId: string;
        purchaseOrderQuantity: string;
        orderedUnitPrice?: string;
        generalStockExcessReason?: string;
    }>;
    itemLookup: ItemReferenceLookupPort;
    supplierLookup: SupplierReferenceLookupPort;
}): Promise<PurchaseOrderLineRecord[]>;
/** toPurchaseRequestLineType normalizes string inputs into the frozen line-type enum set. */
export declare function toPurchaseRequestLineType(value: string): PurchaseRequestLineType;
/** toAllocationType normalizes string inputs into the frozen allocation enum set. */
export declare function toAllocationType(value: string): PurchaseOrderLineAllocationType;
