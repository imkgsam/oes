import { Observable } from "rxjs";
export declare enum PurchaseRequestType {
    PURCHASE_REQUEST_TYPE_UNSPECIFIED = 0,
    PURCHASE_REQUEST_TYPE_DEPARTMENTAL = 1,
    PURCHASE_REQUEST_TYPE_SALES_DEDICATED = 2,
    PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING = 3,
    PURCHASE_REQUEST_TYPE_MAINTENANCE = 4,
    PURCHASE_REQUEST_TYPE_SAMPLE = 5
}
export declare enum PurchaseRequestStatus {
    PURCHASE_REQUEST_STATUS_UNSPECIFIED = 0,
    PURCHASE_REQUEST_STATUS_DRAFT = 1,
    PURCHASE_REQUEST_STATUS_SUBMITTED = 2,
    PURCHASE_REQUEST_STATUS_APPROVED = 3,
    PURCHASE_REQUEST_STATUS_PARTIALLY_CONVERTED = 4,
    PURCHASE_REQUEST_STATUS_CONVERTED = 5,
    PURCHASE_REQUEST_STATUS_REJECTED = 6,
    PURCHASE_REQUEST_STATUS_CANCELLED = 7
}
export declare enum PurchaseRequestLineType {
    PURCHASE_REQUEST_LINE_TYPE_UNSPECIFIED = 0,
    PURCHASE_REQUEST_LINE_TYPE_STANDARD_ITEM = 1,
    PURCHASE_REQUEST_LINE_TYPE_TEXT = 2
}
export declare enum PurchaseRequestDecision {
    PURCHASE_REQUEST_DECISION_UNSPECIFIED = 0,
    PURCHASE_REQUEST_DECISION_APPROVED = 1,
    PURCHASE_REQUEST_DECISION_REJECTED = 2
}
export declare enum PurchaseOrderStatus {
    PURCHASE_ORDER_STATUS_UNSPECIFIED = 0,
    PURCHASE_ORDER_STATUS_DRAFT = 1,
    PURCHASE_ORDER_STATUS_ISSUED = 2,
    PURCHASE_ORDER_STATUS_ACKNOWLEDGED = 3,
    PURCHASE_ORDER_STATUS_CANCELLED = 4
}
export declare enum PurchaseOrderLineAllocationType {
    PURCHASE_ORDER_LINE_ALLOCATION_TYPE_UNSPECIFIED = 0,
    PURCHASE_ORDER_LINE_ALLOCATION_TYPE_PURCHASE_REQUEST_LINE = 1,
    PURCHASE_ORDER_LINE_ALLOCATION_TYPE_SALES_ORDER_LINE = 2,
    PURCHASE_ORDER_LINE_ALLOCATION_TYPE_FULFILLMENT_DEMAND = 3,
    PURCHASE_ORDER_LINE_ALLOCATION_TYPE_GENERAL_STOCK = 4
}
export declare enum PurchaseOrderSupplierAcknowledgementStatus {
    PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_UNSPECIFIED = 0,
    PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_PENDING = 1,
    PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_ACKNOWLEDGED = 2
}
export declare enum PurchaseOrderChangeStatus {
    PURCHASE_ORDER_CHANGE_STATUS_UNSPECIFIED = 0,
    PURCHASE_ORDER_CHANGE_STATUS_APPLIED = 1
}
export declare enum ReceivingExpectationStatus {
    RECEIVING_EXPECTATION_STATUS_UNSPECIFIED = 0,
    RECEIVING_EXPECTATION_STATUS_OPEN = 1,
    RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED = 2,
    RECEIVING_EXPECTATION_STATUS_COMPLETED = 3,
    RECEIVING_EXPECTATION_STATUS_CANCELLED = 4
}
export declare enum ReceivingDiscrepancyType {
    RECEIVING_DISCREPANCY_TYPE_UNSPECIFIED = 0,
    RECEIVING_DISCREPANCY_TYPE_SHORT_RECEIVED = 1,
    RECEIVING_DISCREPANCY_TYPE_OVER_RECEIVED = 2,
    RECEIVING_DISCREPANCY_TYPE_DAMAGED = 3,
    RECEIVING_DISCREPANCY_TYPE_WRONG_ITEM = 4,
    RECEIVING_DISCREPANCY_TYPE_QUALITY_HOLD = 5
}
export declare enum ReceivingDiscrepancyStatus {
    RECEIVING_DISCREPANCY_STATUS_UNSPECIFIED = 0,
    RECEIVING_DISCREPANCY_STATUS_OPEN = 1,
    RECEIVING_DISCREPANCY_STATUS_RESOLVED = 2
}
export declare enum ReceivingResolutionCode {
    RECEIVING_RESOLUTION_CODE_UNSPECIFIED = 0,
    RECEIVING_RESOLUTION_CODE_WAIT_REDELIVERY = 1,
    RECEIVING_RESOLUTION_CODE_CLOSE_UNRECEIVED = 2,
    RECEIVING_RESOLUTION_CODE_REQUEST_RESEND = 3,
    RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_PO_CHANGE = 4,
    RECEIVING_RESOLUTION_CODE_REJECT_EXCESS = 5,
    RECEIVING_RESOLUTION_CODE_TEMP_HOLD = 6,
    RECEIVING_RESOLUTION_CODE_REJECT_DAMAGED = 7,
    RECEIVING_RESOLUTION_CODE_RECEIVE_WITH_RESTRICTION = 8,
    RECEIVING_RESOLUTION_CODE_CLAIM = 9,
    RECEIVING_RESOLUTION_CODE_REJECT_WRONG_ITEM = 10,
    RECEIVING_RESOLUTION_CODE_TEMP_RECEIVE_PENDING_DECISION = 11,
    RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_CONTROLLED_CHANGE = 12,
    RECEIVING_RESOLUTION_CODE_WAIT_INSPECTION = 13,
    RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_ALLOWANCE = 14,
    RECEIVING_RESOLUTION_CODE_RETURN_TO_SUPPLIER = 15
}
export declare enum PurchaseRequestLineConversionStatus {
    PURCHASE_REQUEST_LINE_CONVERSION_STATUS_UNSPECIFIED = 0,
    PURCHASE_REQUEST_LINE_CONVERSION_STATUS_NOT_CONVERTED = 1,
    PURCHASE_REQUEST_LINE_CONVERSION_STATUS_PARTIALLY_CONVERTED = 2,
    PURCHASE_REQUEST_LINE_CONVERSION_STATUS_CONVERTED = 3
}
export interface OperatorContext {
    operatorId?: string | undefined;
    operatorType?: string | undefined;
    orgId?: string | undefined;
}
export interface TraceContext {
    traceId?: string | undefined;
    requestId?: string | undefined;
}
export interface AuditContext {
    auditId?: string | undefined;
    reason?: string | undefined;
    source?: string | undefined;
}
export interface OperatorSummary {
    operatorId?: string | undefined;
    displayName?: string | undefined;
}
export interface PurchaseRequestApprovalSnapshot {
    decision?: PurchaseRequestDecision | undefined;
    decidedBy?: OperatorSummary | undefined;
    decidedAt?: string | undefined;
    comment?: string | undefined;
    approvalReference?: string | undefined;
}
export interface PurchaseRequestLine {
    purchaseRequestLineId?: string | undefined;
    lineNo?: number | undefined;
    lineType?: PurchaseRequestLineType | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    description?: string | undefined;
    requestedQuantity?: string | undefined;
    uom?: string | undefined;
    neededByDate?: string | undefined;
    demandReferenceType?: string | undefined;
    demandReferenceId?: string | undefined;
    conversionStatus?: PurchaseRequestLineConversionStatus | undefined;
    linkedPurchaseOrderLines?: PurchaseRequestPurchaseOrderLink[] | undefined;
}
export interface PurchaseRequestRequesterSummary {
    operatorId?: string | undefined;
    displayName?: string | undefined;
}
export interface PurchaseRequest {
    purchaseRequestId?: string | undefined;
    requestNo?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    requestType?: PurchaseRequestType | undefined;
    status?: PurchaseRequestStatus | undefined;
    requester?: PurchaseRequestRequesterSummary | undefined;
    title?: string | undefined;
    reason?: string | undefined;
    approvalSnapshot?: PurchaseRequestApprovalSnapshot | undefined;
    lines?: PurchaseRequestLine[] | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    submittedAt?: string | undefined;
    decidedAt?: string | undefined;
    cancelledAt?: string | undefined;
    linkedPurchaseOrders?: PurchaseRequestPurchaseOrderLink[] | undefined;
    nextExpectedReceiptDate?: string | undefined;
    receivingStatusSummary?: string | undefined;
}
export interface PurchaseRequestSummary {
    purchaseRequestId?: string | undefined;
    requestNo?: string | undefined;
    requestType?: PurchaseRequestType | undefined;
    status?: PurchaseRequestStatus | undefined;
    requesterDisplayName?: string | undefined;
    lineCount?: number | undefined;
    createdAt?: string | undefined;
    submittedAt?: string | undefined;
    decidedAt?: string | undefined;
    linkedPurchaseOrders?: PurchaseRequestPurchaseOrderLink[] | undefined;
    nextExpectedReceiptDate?: string | undefined;
    receivingStatusSummary?: string | undefined;
}
export interface PurchaseRequestPurchaseOrderLink {
    purchaseOrderId?: string | undefined;
    orderNo?: string | undefined;
    purchaseOrderLineId?: string | undefined;
    allocatedQuantity?: string | undefined;
    expectedReceiptDate?: string | undefined;
    receivingStatusSummary?: string | undefined;
}
export interface PurchaseRequestLineInput {
    lineType?: PurchaseRequestLineType | undefined;
    itemId?: string | undefined;
    description?: string | undefined;
    requestedQuantity?: string | undefined;
    uom?: string | undefined;
    neededByDate?: string | undefined;
    demandReferenceType?: string | undefined;
    demandReferenceId?: string | undefined;
}
export interface GetPurchaseRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    purchaseRequestId?: string | undefined;
}
export interface GetPurchaseRequestResponse {
    purchaseRequest?: PurchaseRequest | undefined;
}
export interface SearchPurchaseRequestsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    keyword?: string | undefined;
    requestType?: PurchaseRequestType | undefined;
    status?: PurchaseRequestStatus | undefined;
    requesterOperatorId?: string | undefined;
    itemId?: string | undefined;
    purchaseOrderId?: string | undefined;
    neededByDateFrom?: string | undefined;
    neededByDateTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPurchaseRequestsResponse {
    purchaseRequests?: PurchaseRequestSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreatePurchaseRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    orgId?: string | undefined;
    requestType?: PurchaseRequestType | undefined;
    title?: string | undefined;
    reason?: string | undefined;
    lines?: PurchaseRequestLineInput[] | undefined;
}
export interface CreatePurchaseRequestResponse {
    purchaseRequest?: PurchaseRequest | undefined;
}
export interface UpdatePurchaseRequestDraftRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseRequestId?: string | undefined;
    title?: string | undefined;
    reason?: string | undefined;
    lines?: PurchaseRequestLineInput[] | undefined;
}
export interface UpdatePurchaseRequestDraftResponse {
    purchaseRequest?: PurchaseRequest | undefined;
}
export interface SubmitPurchaseRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseRequestId?: string | undefined;
    submissionComment?: string | undefined;
}
export interface SubmitPurchaseRequestResponse {
    purchaseRequest?: PurchaseRequest | undefined;
}
export interface DecidePurchaseRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseRequestId?: string | undefined;
    decision?: PurchaseRequestDecision | undefined;
    comment?: string | undefined;
    approvalReference?: string | undefined;
}
export interface DecidePurchaseRequestResponse {
    purchaseRequest?: PurchaseRequest | undefined;
}
export interface CancelPurchaseRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseRequestId?: string | undefined;
    cancelReason?: string | undefined;
}
export interface CancelPurchaseRequestResponse {
    purchaseRequest?: PurchaseRequest | undefined;
}
export interface PurchaseRequestSourceLineSelection {
    purchaseRequestId?: string | undefined;
    purchaseRequestLineId?: string | undefined;
    purchaseOrderQuantity?: string | undefined;
    orderedUnitPrice?: string | undefined;
    generalStockExcessReason?: string | undefined;
}
export interface PurchaseOrderPaymentTermsSnapshot {
    paymentTermsCode?: string | undefined;
    paymentTermsText?: string | undefined;
}
export interface PurchaseOrderCommercialTermsSnapshot {
    incotermCode?: string | undefined;
    commercialTermsText?: string | undefined;
}
export interface PurchaseRequestLineSelection {
    purchaseRequestLineId?: string | undefined;
    purchaseOrderQuantity?: string | undefined;
    orderedUnitPrice?: string | undefined;
    generalStockExcessReason?: string | undefined;
}
export interface ConvertPurchaseRequestToPurchaseOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    targetPurchaseOrderId?: string | undefined;
    supplierId?: string | undefined;
    sourceLines?: PurchaseRequestSourceLineSelection[] | undefined;
    currencyCode?: string | undefined;
    paymentTermsSnapshot?: PurchaseOrderPaymentTermsSnapshot | undefined;
    supplierCommercialTermsSnapshot?: PurchaseOrderCommercialTermsSnapshot | undefined;
}
export interface ConvertPurchaseRequestToPurchaseOrderResponse {
    purchaseOrder?: PurchaseOrder | undefined;
}
export interface PurchaseOrderSupplierSnapshot {
    supplierId?: string | undefined;
    supplierDisplayName?: string | undefined;
    supplierStatusAtIssue?: string | undefined;
}
export interface PurchaseOrderLineAllocation {
    purchaseOrderLineAllocationId?: string | undefined;
    allocationSourceType?: PurchaseOrderLineAllocationType | undefined;
    sourceReferenceId?: string | undefined;
    quantity?: string | undefined;
    reason?: string | undefined;
    targetWarehouseId?: string | undefined;
    targetReceivingAddressId?: string | undefined;
}
export interface PurchaseOrderLine {
    purchaseOrderLineId?: string | undefined;
    lineNo?: number | undefined;
    lineType?: PurchaseRequestLineType | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    description?: string | undefined;
    supplierOfferingId?: string | undefined;
    orderedQuantity?: string | undefined;
    uom?: string | undefined;
    orderedUnitPrice?: string | undefined;
    sourcePurchaseRequestLineId?: string | undefined;
    generalStockExcessReason?: string | undefined;
    allocations?: PurchaseOrderLineAllocation[] | undefined;
}
export interface PurchaseOrderSupplierAcknowledgement {
    acknowledgementStatus?: PurchaseOrderSupplierAcknowledgementStatus | undefined;
    acknowledgedAt?: string | undefined;
    externalReference?: string | undefined;
    comment?: string | undefined;
}
export interface PurchaseOrderPaymentSummary {
    paymentStatusSummary?: string | undefined;
    depositPaidAmount?: string | undefined;
    balancePaidAmount?: string | undefined;
    currencyCode?: string | undefined;
    attachmentRefs?: string[] | undefined;
    lastPaymentAt?: string | undefined;
}
export interface PurchaseOrder {
    purchaseOrderId?: string | undefined;
    orderNo?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    status?: PurchaseOrderStatus | undefined;
    currencyCode?: string | undefined;
    supplierId?: string | undefined;
    supplierSnapshot?: PurchaseOrderSupplierSnapshot | undefined;
    paymentTermsSnapshot?: PurchaseOrderPaymentTermsSnapshot | undefined;
    supplierCommercialTermsSnapshot?: PurchaseOrderCommercialTermsSnapshot | undefined;
    paymentSummary?: PurchaseOrderPaymentSummary | undefined;
    sourcePurchaseRequestIds?: string[] | undefined;
    lines?: PurchaseOrderLine[] | undefined;
    supplierAcknowledgement?: PurchaseOrderSupplierAcknowledgement | undefined;
    issuedAt?: string | undefined;
    cancelledAt?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface PurchaseOrderSummary {
    purchaseOrderId?: string | undefined;
    orderNo?: string | undefined;
    status?: PurchaseOrderStatus | undefined;
    supplierId?: string | undefined;
    supplierDisplayName?: string | undefined;
    currencyCode?: string | undefined;
    lineCount?: number | undefined;
    paymentStatusSummary?: string | undefined;
    issuedAt?: string | undefined;
    createdAt?: string | undefined;
}
export interface PurchaseOrderChange {
    purchaseOrderChangeId?: string | undefined;
    purchaseOrderId?: string | undefined;
    changeType?: string | undefined;
    changeSummary?: string | undefined;
    changeReason?: string | undefined;
    appliedBy?: OperatorSummary | undefined;
    appliedAt?: string | undefined;
    status?: PurchaseOrderChangeStatus | undefined;
}
export interface PurchaseOrderLineAllocationInput {
    allocationSourceType?: PurchaseOrderLineAllocationType | undefined;
    sourceReferenceId?: string | undefined;
    quantity?: string | undefined;
    reason?: string | undefined;
    targetWarehouseId?: string | undefined;
    targetReceivingAddressId?: string | undefined;
}
export interface PurchaseOrderLineInput {
    purchaseOrderLineId?: string | undefined;
    lineType?: PurchaseRequestLineType | undefined;
    itemId?: string | undefined;
    description?: string | undefined;
    orderedQuantity?: string | undefined;
    uom?: string | undefined;
    orderedUnitPrice?: string | undefined;
    sourcePurchaseRequestLineId?: string | undefined;
    generalStockExcessReason?: string | undefined;
    allocations?: PurchaseOrderLineAllocationInput[] | undefined;
}
export interface GetPurchaseOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    purchaseOrderId?: string | undefined;
}
export interface GetPurchaseOrderResponse {
    purchaseOrder?: PurchaseOrder | undefined;
}
export interface SearchPurchaseOrdersRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    keyword?: string | undefined;
    status?: PurchaseOrderStatus | undefined;
    supplierId?: string | undefined;
    itemId?: string | undefined;
    requestNo?: string | undefined;
    issuedFrom?: string | undefined;
    issuedTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPurchaseOrdersResponse {
    purchaseOrders?: PurchaseOrderSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListPurchaseOrderChangesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    purchaseOrderId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListPurchaseOrderChangesResponse {
    changes?: PurchaseOrderChange[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreatePurchaseOrderDraftRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    orgId?: string | undefined;
    supplierId?: string | undefined;
    currencyCode?: string | undefined;
    paymentTermsSnapshot?: PurchaseOrderPaymentTermsSnapshot | undefined;
    supplierCommercialTermsSnapshot?: PurchaseOrderCommercialTermsSnapshot | undefined;
    sourcePurchaseRequestIds?: string[] | undefined;
    lines?: PurchaseOrderLineInput[] | undefined;
}
export interface CreatePurchaseOrderDraftResponse {
    purchaseOrder?: PurchaseOrder | undefined;
}
export interface UpdatePurchaseOrderDraftRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseOrderId?: string | undefined;
    supplierId?: string | undefined;
    currencyCode?: string | undefined;
    paymentTermsSnapshot?: PurchaseOrderPaymentTermsSnapshot | undefined;
    supplierCommercialTermsSnapshot?: PurchaseOrderCommercialTermsSnapshot | undefined;
    sourcePurchaseRequestIds?: string[] | undefined;
    lines?: PurchaseOrderLineInput[] | undefined;
}
export interface UpdatePurchaseOrderDraftResponse {
    purchaseOrder?: PurchaseOrder | undefined;
}
export interface IssuePurchaseOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseOrderId?: string | undefined;
    issueComment?: string | undefined;
}
export interface IssuePurchaseOrderResponse {
    purchaseOrder?: PurchaseOrder | undefined;
}
export interface ConfirmSupplierAcknowledgementRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseOrderId?: string | undefined;
    externalReference?: string | undefined;
    comment?: string | undefined;
    acknowledgedAt?: string | undefined;
}
export interface ConfirmSupplierAcknowledgementResponse {
    purchaseOrder?: PurchaseOrder | undefined;
}
export interface PurchaseOrderChangeTargetState {
    lines?: PurchaseOrderLineInput[] | undefined;
    supplierAcknowledgement?: PurchaseOrderSupplierAcknowledgement | undefined;
}
export interface ApplyPurchaseOrderChangeRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseOrderId?: string | undefined;
    changeType?: string | undefined;
    changeReason?: string | undefined;
    targetState?: PurchaseOrderChangeTargetState | undefined;
}
export interface ApplyPurchaseOrderChangeResponse {
    purchaseOrder?: PurchaseOrder | undefined;
    change?: PurchaseOrderChange | undefined;
}
export interface CancelPurchaseOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseOrderId?: string | undefined;
    cancelReason?: string | undefined;
}
export interface CancelPurchaseOrderResponse {
    purchaseOrder?: PurchaseOrder | undefined;
}
export interface ReceivingDiscrepancy {
    receivingDiscrepancyId?: string | undefined;
    discrepancyType?: ReceivingDiscrepancyType | undefined;
    summary?: string | undefined;
    status?: ReceivingDiscrepancyStatus | undefined;
    resolutionCode?: ReceivingResolutionCode | undefined;
    resolutionNote?: string | undefined;
    resolutionReferences?: ReceivingDiscrepancyResolutionReference[] | undefined;
    resolvedAt?: string | undefined;
}
export interface ReceivingDiscrepancyResolutionReference {
    referenceType?: string | undefined;
    referenceId?: string | undefined;
}
export interface ReceivingExpectation {
    receivingExpectationId?: string | undefined;
    purchaseOrderId?: string | undefined;
    purchaseOrderLineId?: string | undefined;
    supplierId?: string | undefined;
    allocationGroupingKey?: string | undefined;
    sourceAllocationIds?: string[] | undefined;
    targetWarehouseId?: string | undefined;
    targetReceivingAddressId?: string | undefined;
    expectedQuantity?: string | undefined;
    receivedQuantitySummary?: string | undefined;
    openQuantity?: string | undefined;
    expectedReceiptDate?: string | undefined;
    status?: ReceivingExpectationStatus | undefined;
    discrepancy?: ReceivingDiscrepancy | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface ReceivingExpectationSummary {
    receivingExpectationId?: string | undefined;
    purchaseOrderId?: string | undefined;
    purchaseOrderLineId?: string | undefined;
    supplierId?: string | undefined;
    targetWarehouseId?: string | undefined;
    targetReceivingAddressId?: string | undefined;
    expectedReceiptDate?: string | undefined;
    openQuantity?: string | undefined;
    status?: ReceivingExpectationStatus | undefined;
    hasOpenDiscrepancy?: boolean | undefined;
}
export interface GetReceivingExpectationRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    receivingExpectationId?: string | undefined;
}
export interface GetReceivingExpectationResponse {
    receivingExpectation?: ReceivingExpectation | undefined;
}
export interface SearchReceivingExpectationsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    purchaseOrderId?: string | undefined;
    supplierId?: string | undefined;
    status?: ReceivingExpectationStatus | undefined;
    hasOpenDiscrepancy?: boolean | undefined;
    targetWarehouseId?: string | undefined;
    targetReceivingAddressId?: string | undefined;
    expectedReceiptDateFrom?: string | undefined;
    expectedReceiptDateTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchReceivingExpectationsResponse {
    receivingExpectations?: ReceivingExpectationSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreateReceivingExpectationRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    purchaseOrderId?: string | undefined;
    purchaseOrderLineId?: string | undefined;
    allocationGroupingKey?: string | undefined;
    sourceAllocationIds?: string[] | undefined;
    targetWarehouseId?: string | undefined;
    targetReceivingAddressId?: string | undefined;
    expectedQuantity?: string | undefined;
    expectedReceiptDate?: string | undefined;
}
export interface CreateReceivingExpectationResponse {
    receivingExpectation?: ReceivingExpectation | undefined;
}
export interface RecordReceivingDiscrepancyResolutionRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    receivingExpectationId?: string | undefined;
    receivingDiscrepancyId?: string | undefined;
    resolutionCode?: ReceivingResolutionCode | undefined;
    resolutionNote?: string | undefined;
    resolutionReferences?: ReceivingDiscrepancyResolutionReference[] | undefined;
}
export interface RecordReceivingDiscrepancyResolutionResponse {
    receivingExpectation?: ReceivingExpectation | undefined;
    receivingDiscrepancy?: ReceivingDiscrepancy | undefined;
}
export interface PurchaseRequestQueryServiceClient {
    getPurchaseRequest(request: GetPurchaseRequestRequest, ...rest: any): Observable<GetPurchaseRequestResponse>;
    searchPurchaseRequests(request: SearchPurchaseRequestsRequest, ...rest: any): Observable<SearchPurchaseRequestsResponse>;
}
export interface PurchaseRequestQueryServiceController {
    getPurchaseRequest(request: GetPurchaseRequestRequest, ...rest: any): Promise<GetPurchaseRequestResponse> | Observable<GetPurchaseRequestResponse> | GetPurchaseRequestResponse;
    searchPurchaseRequests(request: SearchPurchaseRequestsRequest, ...rest: any): Promise<SearchPurchaseRequestsResponse> | Observable<SearchPurchaseRequestsResponse> | SearchPurchaseRequestsResponse;
}
export declare function PurchaseRequestQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const PURCHASE_REQUEST_QUERY_SERVICE_NAME = "PurchaseRequestQueryService";
export interface PurchaseRequestManagementServiceClient {
    createPurchaseRequest(request: CreatePurchaseRequestRequest, ...rest: any): Observable<CreatePurchaseRequestResponse>;
    updatePurchaseRequestDraft(request: UpdatePurchaseRequestDraftRequest, ...rest: any): Observable<UpdatePurchaseRequestDraftResponse>;
    submitPurchaseRequest(request: SubmitPurchaseRequestRequest, ...rest: any): Observable<SubmitPurchaseRequestResponse>;
    decidePurchaseRequest(request: DecidePurchaseRequestRequest, ...rest: any): Observable<DecidePurchaseRequestResponse>;
    cancelPurchaseRequest(request: CancelPurchaseRequestRequest, ...rest: any): Observable<CancelPurchaseRequestResponse>;
    convertPurchaseRequestToPurchaseOrder(request: ConvertPurchaseRequestToPurchaseOrderRequest, ...rest: any): Observable<ConvertPurchaseRequestToPurchaseOrderResponse>;
}
export interface PurchaseRequestManagementServiceController {
    createPurchaseRequest(request: CreatePurchaseRequestRequest, ...rest: any): Promise<CreatePurchaseRequestResponse> | Observable<CreatePurchaseRequestResponse> | CreatePurchaseRequestResponse;
    updatePurchaseRequestDraft(request: UpdatePurchaseRequestDraftRequest, ...rest: any): Promise<UpdatePurchaseRequestDraftResponse> | Observable<UpdatePurchaseRequestDraftResponse> | UpdatePurchaseRequestDraftResponse;
    submitPurchaseRequest(request: SubmitPurchaseRequestRequest, ...rest: any): Promise<SubmitPurchaseRequestResponse> | Observable<SubmitPurchaseRequestResponse> | SubmitPurchaseRequestResponse;
    decidePurchaseRequest(request: DecidePurchaseRequestRequest, ...rest: any): Promise<DecidePurchaseRequestResponse> | Observable<DecidePurchaseRequestResponse> | DecidePurchaseRequestResponse;
    cancelPurchaseRequest(request: CancelPurchaseRequestRequest, ...rest: any): Promise<CancelPurchaseRequestResponse> | Observable<CancelPurchaseRequestResponse> | CancelPurchaseRequestResponse;
    convertPurchaseRequestToPurchaseOrder(request: ConvertPurchaseRequestToPurchaseOrderRequest, ...rest: any): Promise<ConvertPurchaseRequestToPurchaseOrderResponse> | Observable<ConvertPurchaseRequestToPurchaseOrderResponse> | ConvertPurchaseRequestToPurchaseOrderResponse;
}
export declare function PurchaseRequestManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME = "PurchaseRequestManagementService";
export interface PurchaseOrderQueryServiceClient {
    getPurchaseOrder(request: GetPurchaseOrderRequest, ...rest: any): Observable<GetPurchaseOrderResponse>;
    searchPurchaseOrders(request: SearchPurchaseOrdersRequest, ...rest: any): Observable<SearchPurchaseOrdersResponse>;
    listPurchaseOrderChanges(request: ListPurchaseOrderChangesRequest, ...rest: any): Observable<ListPurchaseOrderChangesResponse>;
}
export interface PurchaseOrderQueryServiceController {
    getPurchaseOrder(request: GetPurchaseOrderRequest, ...rest: any): Promise<GetPurchaseOrderResponse> | Observable<GetPurchaseOrderResponse> | GetPurchaseOrderResponse;
    searchPurchaseOrders(request: SearchPurchaseOrdersRequest, ...rest: any): Promise<SearchPurchaseOrdersResponse> | Observable<SearchPurchaseOrdersResponse> | SearchPurchaseOrdersResponse;
    listPurchaseOrderChanges(request: ListPurchaseOrderChangesRequest, ...rest: any): Promise<ListPurchaseOrderChangesResponse> | Observable<ListPurchaseOrderChangesResponse> | ListPurchaseOrderChangesResponse;
}
export declare function PurchaseOrderQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const PURCHASE_ORDER_QUERY_SERVICE_NAME = "PurchaseOrderQueryService";
export interface PurchaseOrderManagementServiceClient {
    createPurchaseOrderDraft(request: CreatePurchaseOrderDraftRequest, ...rest: any): Observable<CreatePurchaseOrderDraftResponse>;
    updatePurchaseOrderDraft(request: UpdatePurchaseOrderDraftRequest, ...rest: any): Observable<UpdatePurchaseOrderDraftResponse>;
    issuePurchaseOrder(request: IssuePurchaseOrderRequest, ...rest: any): Observable<IssuePurchaseOrderResponse>;
    confirmSupplierAcknowledgement(request: ConfirmSupplierAcknowledgementRequest, ...rest: any): Observable<ConfirmSupplierAcknowledgementResponse>;
    applyPurchaseOrderChange(request: ApplyPurchaseOrderChangeRequest, ...rest: any): Observable<ApplyPurchaseOrderChangeResponse>;
    cancelPurchaseOrder(request: CancelPurchaseOrderRequest, ...rest: any): Observable<CancelPurchaseOrderResponse>;
}
export interface PurchaseOrderManagementServiceController {
    createPurchaseOrderDraft(request: CreatePurchaseOrderDraftRequest, ...rest: any): Promise<CreatePurchaseOrderDraftResponse> | Observable<CreatePurchaseOrderDraftResponse> | CreatePurchaseOrderDraftResponse;
    updatePurchaseOrderDraft(request: UpdatePurchaseOrderDraftRequest, ...rest: any): Promise<UpdatePurchaseOrderDraftResponse> | Observable<UpdatePurchaseOrderDraftResponse> | UpdatePurchaseOrderDraftResponse;
    issuePurchaseOrder(request: IssuePurchaseOrderRequest, ...rest: any): Promise<IssuePurchaseOrderResponse> | Observable<IssuePurchaseOrderResponse> | IssuePurchaseOrderResponse;
    confirmSupplierAcknowledgement(request: ConfirmSupplierAcknowledgementRequest, ...rest: any): Promise<ConfirmSupplierAcknowledgementResponse> | Observable<ConfirmSupplierAcknowledgementResponse> | ConfirmSupplierAcknowledgementResponse;
    applyPurchaseOrderChange(request: ApplyPurchaseOrderChangeRequest, ...rest: any): Promise<ApplyPurchaseOrderChangeResponse> | Observable<ApplyPurchaseOrderChangeResponse> | ApplyPurchaseOrderChangeResponse;
    cancelPurchaseOrder(request: CancelPurchaseOrderRequest, ...rest: any): Promise<CancelPurchaseOrderResponse> | Observable<CancelPurchaseOrderResponse> | CancelPurchaseOrderResponse;
}
export declare function PurchaseOrderManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const PURCHASE_ORDER_MANAGEMENT_SERVICE_NAME = "PurchaseOrderManagementService";
export interface ReceivingExpectationQueryServiceClient {
    getReceivingExpectation(request: GetReceivingExpectationRequest, ...rest: any): Observable<GetReceivingExpectationResponse>;
    searchReceivingExpectations(request: SearchReceivingExpectationsRequest, ...rest: any): Observable<SearchReceivingExpectationsResponse>;
}
export interface ReceivingExpectationQueryServiceController {
    getReceivingExpectation(request: GetReceivingExpectationRequest, ...rest: any): Promise<GetReceivingExpectationResponse> | Observable<GetReceivingExpectationResponse> | GetReceivingExpectationResponse;
    searchReceivingExpectations(request: SearchReceivingExpectationsRequest, ...rest: any): Promise<SearchReceivingExpectationsResponse> | Observable<SearchReceivingExpectationsResponse> | SearchReceivingExpectationsResponse;
}
export declare function ReceivingExpectationQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const RECEIVING_EXPECTATION_QUERY_SERVICE_NAME = "ReceivingExpectationQueryService";
export interface ReceivingExpectationManagementServiceClient {
    createReceivingExpectation(request: CreateReceivingExpectationRequest, ...rest: any): Observable<CreateReceivingExpectationResponse>;
    recordReceivingDiscrepancyResolution(request: RecordReceivingDiscrepancyResolutionRequest, ...rest: any): Observable<RecordReceivingDiscrepancyResolutionResponse>;
}
export interface ReceivingExpectationManagementServiceController {
    createReceivingExpectation(request: CreateReceivingExpectationRequest, ...rest: any): Promise<CreateReceivingExpectationResponse> | Observable<CreateReceivingExpectationResponse> | CreateReceivingExpectationResponse;
    recordReceivingDiscrepancyResolution(request: RecordReceivingDiscrepancyResolutionRequest, ...rest: any): Promise<RecordReceivingDiscrepancyResolutionResponse> | Observable<RecordReceivingDiscrepancyResolutionResponse> | RecordReceivingDiscrepancyResolutionResponse;
}
export declare function ReceivingExpectationManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const RECEIVING_EXPECTATION_MANAGEMENT_SERVICE_NAME = "ReceivingExpectationManagementService";
