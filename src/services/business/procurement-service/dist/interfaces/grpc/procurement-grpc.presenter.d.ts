import { ApplyPurchaseOrderChangeResponse, CancelPurchaseOrderResponse, CancelPurchaseRequestResponse, ConfirmSupplierAcknowledgementResponse, ConvertPurchaseRequestToPurchaseOrderResponse, CreatePurchaseOrderDraftResponse, CreatePurchaseRequestResponse, CreateReceivingExpectationResponse, GetPurchaseOrderResponse, GetPurchaseRequestResponse, GetReceivingExpectationResponse, ListPurchaseOrderChangesResponse, PurchaseRequest, RecordReceivingDiscrepancyResolutionResponse, SearchPurchaseOrdersResponse, SearchPurchaseRequestsResponse, SearchReceivingExpectationsResponse, SubmitPurchaseRequestResponse, UpdatePurchaseOrderDraftResponse, UpdatePurchaseRequestDraftResponse } from '@oes/common/generated/procurement_service';
import { PurchaseOrderChangeRecord, PurchaseOrderRecord, PurchaseRequestRecord, ReceivingDiscrepancyRecord, ReceivingExpectationRecord } from '../../domain/models/procurement-records';
/** ProcurementGrpcPresenter translates procurement phase 1 aggregates into the generated gRPC response surface. */
export declare class ProcurementGrpcPresenter {
    /** toCreatePurchaseRequestResponse presents one created PR aggregate on the gRPC command surface. */
    static toCreatePurchaseRequestResponse(record: PurchaseRequestRecord): CreatePurchaseRequestResponse;
    /** toUpdatePurchaseRequestDraftResponse presents one updated PR aggregate on the gRPC command surface. */
    static toUpdatePurchaseRequestDraftResponse(record: PurchaseRequestRecord): UpdatePurchaseRequestDraftResponse;
    /** toSubmitPurchaseRequestResponse presents one submitted PR aggregate on the gRPC command surface. */
    static toSubmitPurchaseRequestResponse(record: PurchaseRequestRecord): SubmitPurchaseRequestResponse;
    /** toCancelPurchaseRequestResponse presents one cancelled PR aggregate on the gRPC command surface. */
    static toCancelPurchaseRequestResponse(record: PurchaseRequestRecord): CancelPurchaseRequestResponse;
    /** toConvertPurchaseRequestToPurchaseOrderResponse presents one converted PO draft aggregate on the gRPC command surface. */
    static toConvertPurchaseRequestToPurchaseOrderResponse(record: PurchaseOrderRecord): ConvertPurchaseRequestToPurchaseOrderResponse;
    /** toCreatePurchaseOrderDraftResponse presents one created PO draft aggregate on the gRPC command surface. */
    static toCreatePurchaseOrderDraftResponse(record: PurchaseOrderRecord): CreatePurchaseOrderDraftResponse;
    /** toUpdatePurchaseOrderDraftResponse presents one updated PO draft aggregate on the gRPC command surface. */
    static toUpdatePurchaseOrderDraftResponse(record: PurchaseOrderRecord): UpdatePurchaseOrderDraftResponse;
    /** toConfirmSupplierAcknowledgementResponse presents one acknowledged PO aggregate on the gRPC command surface. */
    static toConfirmSupplierAcknowledgementResponse(record: PurchaseOrderRecord): ConfirmSupplierAcknowledgementResponse;
    /** toCancelPurchaseOrderResponse presents one cancelled PO aggregate on the gRPC command surface. */
    static toCancelPurchaseOrderResponse(record: PurchaseOrderRecord): CancelPurchaseOrderResponse;
    /** toApplyPurchaseOrderChangeResponse presents one updated PO plus applied change on the gRPC command surface. */
    static toApplyPurchaseOrderChangeResponse(input: {
        purchaseOrder: PurchaseOrderRecord;
        change: PurchaseOrderChangeRecord;
    }): ApplyPurchaseOrderChangeResponse;
    /** toCreateReceivingExpectationResponse presents one created procurement expectation aggregate on the gRPC command surface. */
    static toCreateReceivingExpectationResponse(record: ReceivingExpectationRecord): CreateReceivingExpectationResponse;
    /** toRecordReceivingDiscrepancyResolutionResponse presents one resolved discrepancy summary on the gRPC command surface. */
    static toRecordReceivingDiscrepancyResolutionResponse(input: {
        receivingExpectation: ReceivingExpectationRecord;
        receivingDiscrepancy: ReceivingDiscrepancyRecord;
    }): RecordReceivingDiscrepancyResolutionResponse;
    /** toGetPurchaseRequestResponse presents one PR aggregate on the gRPC query surface. */
    static toGetPurchaseRequestResponse(record: PurchaseRequestRecord): GetPurchaseRequestResponse;
    /** toSearchPurchaseRequestsResponse presents one PR summary page on the gRPC query surface. */
    static toSearchPurchaseRequestsResponse(input: {
        purchaseRequests: PurchaseRequestRecord[];
        total: number;
        page: number;
        pageSize: number;
    }): SearchPurchaseRequestsResponse;
    /** toGetPurchaseOrderResponse presents one PO aggregate on the gRPC query surface. */
    static toGetPurchaseOrderResponse(record: PurchaseOrderRecord): GetPurchaseOrderResponse;
    /** toSearchPurchaseOrdersResponse presents one PO summary page on the gRPC query surface. */
    static toSearchPurchaseOrdersResponse(input: {
        purchaseOrders: PurchaseOrderRecord[];
        total: number;
        page: number;
        pageSize: number;
    }): SearchPurchaseOrdersResponse;
    /** toListPurchaseOrderChangesResponse presents one applied-change page on the gRPC query surface. */
    static toListPurchaseOrderChangesResponse(input: {
        changes: PurchaseOrderChangeRecord[];
        total: number;
        page: number;
        pageSize: number;
    }): ListPurchaseOrderChangesResponse;
    /** toGetReceivingExpectationResponse presents one receiving expectation aggregate on the gRPC query surface. */
    static toGetReceivingExpectationResponse(record: ReceivingExpectationRecord): GetReceivingExpectationResponse;
    /** toSearchReceivingExpectationsResponse presents one receiving summary page on the gRPC query surface. */
    static toSearchReceivingExpectationsResponse(input: {
        receivingExpectations: ReceivingExpectationRecord[];
        total: number;
        page: number;
        pageSize: number;
    }): SearchReceivingExpectationsResponse;
    /** toPurchaseRequest converts one procurement PR aggregate into the generated gRPC read shape. */
    static toPurchaseRequest(record: PurchaseRequestRecord): PurchaseRequest;
    private static toPurchaseRequestSummary;
    private static toPurchaseRequestApprovalSnapshot;
    private static toPurchaseRequestLine;
    private static toPurchaseRequestPurchaseOrderLink;
    private static toPurchaseOrder;
    private static toPurchaseOrderSummary;
    private static toPurchaseOrderLine;
    private static toPurchaseOrderLineAllocation;
    private static toPurchaseOrderPaymentTermsSnapshot;
    private static toPurchaseOrderCommercialTermsSnapshot;
    private static toPurchaseOrderPaymentSummary;
    private static toPurchaseOrderSupplierAcknowledgement;
    private static toPurchaseOrderChange;
    private static toReceivingExpectation;
    private static toReceivingExpectationSummary;
    private static toReceivingDiscrepancy;
    private static toReceivingResolutionReference;
}
