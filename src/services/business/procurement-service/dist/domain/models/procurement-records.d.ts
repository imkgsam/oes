export declare enum PurchaseRequestType {
    DEPARTMENTAL = "DEPARTMENTAL",
    SALES_DEDICATED = "SALES_DEDICATED",
    PRODUCTION_PACKAGING = "PRODUCTION_PACKAGING",
    MAINTENANCE = "MAINTENANCE",
    SAMPLE = "SAMPLE"
}
export declare enum PurchaseRequestStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export declare enum PurchaseRequestLineType {
    STANDARD_ITEM = "STANDARD_ITEM",
    TEXT = "TEXT"
}
export declare enum PurchaseRequestDecision {
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum PurchaseOrderStatus {
    DRAFT = "DRAFT",
    ISSUED = "ISSUED",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    CANCELLED = "CANCELLED"
}
export declare enum PurchaseOrderLineAllocationType {
    SALES_ORDER_LINE = "SALES_ORDER_LINE",
    FULFILLMENT_DEMAND = "FULFILLMENT_DEMAND",
    GENERAL_STOCK = "GENERAL_STOCK"
}
export declare enum PurchaseOrderSupplierAcknowledgementStatus {
    PENDING = "PENDING",
    ACKNOWLEDGED = "ACKNOWLEDGED"
}
export declare enum PurchaseOrderChangeStatus {
    APPLIED = "APPLIED"
}
export declare enum ReceivingExpectationStatus {
    OPEN = "OPEN",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum ReceivingDiscrepancyType {
    SHORT_RECEIPT = "SHORT_RECEIPT",
    OVER_RECEIPT = "OVER_RECEIPT",
    DAMAGED = "DAMAGED",
    RESTRICTED = "RESTRICTED",
    OTHER = "OTHER"
}
export declare enum ReceivingDiscrepancyStatus {
    OPEN = "OPEN",
    RESOLVED = "RESOLVED"
}
export declare enum ReceivingResolutionCode {
    WAIT_REDELIVERY = "WAIT_REDELIVERY",
    ACCEPT_SHORT_CLOSE = "ACCEPT_SHORT_CLOSE",
    RETURN_OR_REJECT_EXCESS = "RETURN_OR_REJECT_EXCESS",
    MANUAL_FOLLOW_UP = "MANUAL_FOLLOW_UP"
}
export interface ProcurementOperatorContext {
    operatorId: string;
    operatorType: string;
    orgId?: string | null;
}
export interface ProcurementTraceContext {
    traceId: string;
    requestId: string;
}
export interface ProcurementAuditContext {
    auditId: string;
    reason: string;
    source: string;
}
export interface OperatorSummary {
    operatorId: string;
    displayName: string;
}
export interface PurchaseRequestApprovalSnapshotRecord {
    purchaseRequestApprovalSnapshotId: string;
    decision: PurchaseRequestDecision;
    decidedBy: OperatorSummary;
    decidedAt: string;
    comment?: string | null;
    approvalReference?: string | null;
}
export interface PurchaseRequestLineRecord {
    purchaseRequestLineId: string;
    lineNo: number;
    lineType: PurchaseRequestLineType;
    itemId?: string | null;
    itemCode?: string | null;
    itemName?: string | null;
    description: string;
    requestedQuantity: string;
    uom: string;
    neededByDate?: string | null;
    demandReferenceType?: string | null;
    demandReferenceId?: string | null;
}
export interface PurchaseRequestRecord {
    purchaseRequestId: string;
    requestNo: string;
    tenantId: string;
    orgId?: string | null;
    requestType: PurchaseRequestType;
    status: PurchaseRequestStatus;
    requester: OperatorSummary;
    title?: string | null;
    reason?: string | null;
    submissionComment?: string | null;
    cancelReason?: string | null;
    createdAt: string;
    updatedAt: string;
    submittedAt?: string | null;
    decidedAt?: string | null;
    cancelledAt?: string | null;
    approvalSnapshot?: PurchaseRequestApprovalSnapshotRecord | null;
    lines: PurchaseRequestLineRecord[];
}
export interface PurchaseOrderLineAllocationRecord {
    purchaseOrderLineAllocationId: string;
    allocationType: PurchaseOrderLineAllocationType;
    referenceId?: string | null;
    quantity: string;
    reason?: string | null;
}
export interface PurchaseOrderLineRecord {
    purchaseOrderLineId: string;
    lineNo: number;
    lineType: PurchaseRequestLineType;
    itemId?: string | null;
    itemCode?: string | null;
    itemName?: string | null;
    description: string;
    supplierOfferingId?: string | null;
    orderedQuantity: string;
    uom: string;
    orderedUnitPrice?: string | null;
    sourcePurchaseRequestLineId?: string | null;
    sourceRequestedQuantity?: string | null;
    generalStockExcessReason?: string | null;
    allocations: PurchaseOrderLineAllocationRecord[];
}
export interface PurchaseOrderSupplierSnapshotRecord {
    supplierId: string;
    supplierDisplayName: string;
    supplierStatusAtIssue?: string | null;
}
export interface PurchaseOrderSupplierAcknowledgementRecord {
    acknowledgementStatus: PurchaseOrderSupplierAcknowledgementStatus;
    acknowledgedAt?: string | null;
    externalReference?: string | null;
    comment?: string | null;
}
export interface PurchaseOrderChangeRecord {
    purchaseOrderChangeId: string;
    purchaseOrderId: string;
    changeType: string;
    changeSummary: string;
    changeReason?: string | null;
    appliedBy: OperatorSummary;
    appliedAt: string;
    status: PurchaseOrderChangeStatus | 'APPLIED';
}
export interface PurchaseOrderRecord {
    purchaseOrderId: string;
    orderNo: string;
    tenantId: string;
    orgId?: string | null;
    status: PurchaseOrderStatus;
    currencyCode: string;
    supplierId: string;
    supplierSnapshot: PurchaseOrderSupplierSnapshotRecord;
    sourcePurchaseRequestIds: string[];
    sourcePurchaseRequestNos?: string[];
    supplierAcknowledgement: PurchaseOrderSupplierAcknowledgementRecord;
    issueComment?: string | null;
    cancelReason?: string | null;
    createdAt: string;
    updatedAt: string;
    issuedAt?: string | null;
    cancelledAt?: string | null;
    lines: PurchaseOrderLineRecord[];
    changes: PurchaseOrderChangeRecord[];
}
export interface ReceivingDiscrepancyRecord {
    receivingDiscrepancyId: string;
    discrepancyType: ReceivingDiscrepancyType;
    summary: string;
    status: ReceivingDiscrepancyStatus;
    resolutionCode?: ReceivingResolutionCode | null;
    resolutionNote?: string | null;
    resolvedAt?: string | null;
}
export interface ReceivingExpectationRecord {
    receivingExpectationId: string;
    tenantId: string;
    orgId?: string | null;
    purchaseOrderId: string;
    purchaseOrderLineId: string;
    supplierId: string;
    expectedQuantity: string;
    receivedQuantitySummary: string;
    openQuantity: string;
    expectedReceiptDate?: string | null;
    status: ReceivingExpectationStatus;
    createdAt: string;
    updatedAt: string;
    discrepancy?: ReceivingDiscrepancyRecord | null;
}
export interface PageResult<TItem> {
    items: TItem[];
    total: number;
    page: number;
    pageSize: number;
}
export interface SearchPurchaseRequestsInput {
    tenantId: string;
    orgId?: string;
    keyword?: string;
    requestType?: PurchaseRequestType;
    status?: PurchaseRequestStatus;
    requesterOperatorId?: string;
    itemId?: string;
    neededByDateFrom?: string;
    neededByDateTo?: string;
    page?: number;
    pageSize?: number;
}
export interface SearchPurchaseOrdersInput {
    tenantId: string;
    orgId?: string;
    keyword?: string;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    itemId?: string;
    requestNo?: string;
    issuedFrom?: string;
    issuedTo?: string;
    page?: number;
    pageSize?: number;
}
export interface SearchReceivingExpectationsInput {
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
}
/** cloneRecord deep-clones plain procurement records so repositories do not leak mutable state across calls. */
export declare function cloneRecord<T>(value: T): T;
