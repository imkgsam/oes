"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementGrpcPresenter = void 0;
const procurement_service_1 = require("@oes/common/generated/procurement_service");
const procurement_records_1 = require("../../domain/models/procurement-records");
/** ProcurementGrpcPresenter translates procurement phase 1 aggregates into the generated gRPC response surface. */
class ProcurementGrpcPresenter {
    /** toCreatePurchaseRequestResponse presents one created PR aggregate on the gRPC command surface. */
    static toCreatePurchaseRequestResponse(record) {
        return {
            purchaseRequest: this.toPurchaseRequest(record)
        };
    }
    /** toUpdatePurchaseRequestDraftResponse presents one updated PR aggregate on the gRPC command surface. */
    static toUpdatePurchaseRequestDraftResponse(record) {
        return {
            purchaseRequest: this.toPurchaseRequest(record)
        };
    }
    /** toSubmitPurchaseRequestResponse presents one submitted PR aggregate on the gRPC command surface. */
    static toSubmitPurchaseRequestResponse(record) {
        return {
            purchaseRequest: this.toPurchaseRequest(record)
        };
    }
    /** toCancelPurchaseRequestResponse presents one cancelled PR aggregate on the gRPC command surface. */
    static toCancelPurchaseRequestResponse(record) {
        return {
            purchaseRequest: this.toPurchaseRequest(record)
        };
    }
    /** toConvertPurchaseRequestToPurchaseOrderResponse presents one converted PO draft aggregate on the gRPC command surface. */
    static toConvertPurchaseRequestToPurchaseOrderResponse(record) {
        return {
            purchaseOrder: this.toPurchaseOrder(record)
        };
    }
    /** toCreatePurchaseOrderDraftResponse presents one created PO draft aggregate on the gRPC command surface. */
    static toCreatePurchaseOrderDraftResponse(record) {
        return {
            purchaseOrder: this.toPurchaseOrder(record)
        };
    }
    /** toUpdatePurchaseOrderDraftResponse presents one updated PO draft aggregate on the gRPC command surface. */
    static toUpdatePurchaseOrderDraftResponse(record) {
        return {
            purchaseOrder: this.toPurchaseOrder(record)
        };
    }
    /** toConfirmSupplierAcknowledgementResponse presents one acknowledged PO aggregate on the gRPC command surface. */
    static toConfirmSupplierAcknowledgementResponse(record) {
        return {
            purchaseOrder: this.toPurchaseOrder(record)
        };
    }
    /** toCancelPurchaseOrderResponse presents one cancelled PO aggregate on the gRPC command surface. */
    static toCancelPurchaseOrderResponse(record) {
        return {
            purchaseOrder: this.toPurchaseOrder(record)
        };
    }
    /** toApplyPurchaseOrderChangeResponse presents one updated PO plus applied change on the gRPC command surface. */
    static toApplyPurchaseOrderChangeResponse(input) {
        return {
            purchaseOrder: this.toPurchaseOrder(input.purchaseOrder),
            change: this.toPurchaseOrderChange(input.change)
        };
    }
    /** toCreateReceivingExpectationResponse presents one created procurement expectation aggregate on the gRPC command surface. */
    static toCreateReceivingExpectationResponse(record) {
        return {
            receivingExpectation: this.toReceivingExpectation(record)
        };
    }
    /** toRecordReceivingDiscrepancyResolutionResponse presents one resolved discrepancy summary on the gRPC command surface. */
    static toRecordReceivingDiscrepancyResolutionResponse(input) {
        return {
            receivingExpectation: this.toReceivingExpectation(input.receivingExpectation),
            receivingDiscrepancy: this.toReceivingDiscrepancy(input.receivingDiscrepancy)
        };
    }
    /** toGetPurchaseRequestResponse presents one PR aggregate on the gRPC query surface. */
    static toGetPurchaseRequestResponse(record) {
        return {
            purchaseRequest: this.toPurchaseRequest(record)
        };
    }
    /** toSearchPurchaseRequestsResponse presents one PR summary page on the gRPC query surface. */
    static toSearchPurchaseRequestsResponse(input) {
        return {
            purchaseRequests: input.purchaseRequests.map((record) => this.toPurchaseRequestSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toGetPurchaseOrderResponse presents one PO aggregate on the gRPC query surface. */
    static toGetPurchaseOrderResponse(record) {
        return {
            purchaseOrder: this.toPurchaseOrder(record)
        };
    }
    /** toSearchPurchaseOrdersResponse presents one PO summary page on the gRPC query surface. */
    static toSearchPurchaseOrdersResponse(input) {
        return {
            purchaseOrders: input.purchaseOrders.map((record) => this.toPurchaseOrderSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toListPurchaseOrderChangesResponse presents one applied-change page on the gRPC query surface. */
    static toListPurchaseOrderChangesResponse(input) {
        return {
            changes: input.changes.map((change) => this.toPurchaseOrderChange(change)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toGetReceivingExpectationResponse presents one receiving expectation aggregate on the gRPC query surface. */
    static toGetReceivingExpectationResponse(record) {
        return {
            receivingExpectation: this.toReceivingExpectation(record)
        };
    }
    /** toSearchReceivingExpectationsResponse presents one receiving summary page on the gRPC query surface. */
    static toSearchReceivingExpectationsResponse(input) {
        return {
            receivingExpectations: input.receivingExpectations.map((record) => this.toReceivingExpectationSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toPurchaseRequest converts one procurement PR aggregate into the generated gRPC read shape. */
    static toPurchaseRequest(record) {
        return {
            purchaseRequestId: record.purchaseRequestId,
            requestNo: record.requestNo,
            tenantId: record.tenantId,
            orgId: record.orgId ?? '',
            requestType: toProtoPurchaseRequestType(record.requestType),
            status: toProtoPurchaseRequestStatus(record.status),
            requester: {
                operatorId: record.requester.operatorId,
                displayName: record.requester.displayName
            },
            title: record.title ?? '',
            reason: record.reason ?? '',
            approvalSnapshot: record.approvalSnapshot
                ? this.toPurchaseRequestApprovalSnapshot(record.approvalSnapshot)
                : undefined,
            lines: record.lines.map((line) => this.toPurchaseRequestLine(line)),
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            submittedAt: record.submittedAt ?? '',
            decidedAt: record.decidedAt ?? '',
            cancelledAt: record.cancelledAt ?? ''
        };
    }
    static toPurchaseRequestSummary(record) {
        return {
            purchaseRequestId: record.purchaseRequestId,
            requestNo: record.requestNo,
            requestType: toProtoPurchaseRequestType(record.requestType),
            status: toProtoPurchaseRequestStatus(record.status),
            requesterDisplayName: record.requester.displayName,
            lineCount: record.lines.length,
            createdAt: record.createdAt,
            submittedAt: record.submittedAt ?? '',
            decidedAt: record.decidedAt ?? ''
        };
    }
    static toPurchaseRequestApprovalSnapshot(snapshot) {
        return {
            decision: toProtoPurchaseRequestDecision(snapshot.decision),
            decidedBy: {
                operatorId: snapshot.decidedBy.operatorId,
                displayName: snapshot.decidedBy.displayName
            },
            decidedAt: snapshot.decidedAt,
            comment: snapshot.comment ?? '',
            approvalReference: snapshot.approvalReference ?? ''
        };
    }
    static toPurchaseRequestLine(record) {
        return {
            purchaseRequestLineId: record.purchaseRequestLineId,
            lineNo: record.lineNo,
            lineType: toProtoPurchaseRequestLineType(record.lineType),
            itemId: record.itemId ?? '',
            itemCode: record.itemCode ?? '',
            itemName: record.itemName ?? '',
            description: record.description,
            requestedQuantity: record.requestedQuantity,
            uom: record.uom,
            neededByDate: record.neededByDate ?? '',
            demandReferenceType: record.demandReferenceType ?? '',
            demandReferenceId: record.demandReferenceId ?? ''
        };
    }
    static toPurchaseOrder(record) {
        return {
            purchaseOrderId: record.purchaseOrderId,
            orderNo: record.orderNo,
            tenantId: record.tenantId,
            orgId: record.orgId ?? '',
            status: toProtoPurchaseOrderStatus(record.status),
            currencyCode: record.currencyCode,
            supplierId: record.supplierId,
            supplierSnapshot: {
                supplierId: record.supplierSnapshot.supplierId,
                supplierDisplayName: record.supplierSnapshot.supplierDisplayName,
                supplierStatusAtIssue: record.supplierSnapshot.supplierStatusAtIssue ?? ''
            },
            sourcePurchaseRequestIds: record.sourcePurchaseRequestIds,
            lines: record.lines.map((line) => this.toPurchaseOrderLine(line)),
            supplierAcknowledgement: this.toPurchaseOrderSupplierAcknowledgement(record.supplierAcknowledgement),
            issuedAt: record.issuedAt ?? '',
            cancelledAt: record.cancelledAt ?? '',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };
    }
    static toPurchaseOrderSummary(record) {
        return {
            purchaseOrderId: record.purchaseOrderId,
            orderNo: record.orderNo,
            status: toProtoPurchaseOrderStatus(record.status),
            supplierId: record.supplierId,
            supplierDisplayName: record.supplierSnapshot.supplierDisplayName,
            currencyCode: record.currencyCode,
            lineCount: record.lines.length,
            issuedAt: record.issuedAt ?? '',
            createdAt: record.createdAt
        };
    }
    static toPurchaseOrderLine(record) {
        return {
            purchaseOrderLineId: record.purchaseOrderLineId,
            lineNo: record.lineNo,
            lineType: toProtoPurchaseRequestLineType(record.lineType),
            itemId: record.itemId ?? '',
            itemCode: record.itemCode ?? '',
            itemName: record.itemName ?? '',
            description: record.description,
            supplierOfferingId: record.supplierOfferingId ?? '',
            orderedQuantity: record.orderedQuantity,
            uom: record.uom,
            orderedUnitPrice: record.orderedUnitPrice ?? '',
            sourcePurchaseRequestLineId: record.sourcePurchaseRequestLineId ?? '',
            generalStockExcessReason: record.generalStockExcessReason ?? '',
            allocations: record.allocations.map((allocation) => this.toPurchaseOrderLineAllocation(allocation))
        };
    }
    static toPurchaseOrderLineAllocation(record) {
        return {
            purchaseOrderLineAllocationId: record.purchaseOrderLineAllocationId,
            allocationType: toProtoPurchaseOrderAllocationType(record.allocationType),
            referenceId: record.referenceId ?? '',
            quantity: record.quantity,
            reason: record.reason ?? ''
        };
    }
    static toPurchaseOrderSupplierAcknowledgement(record) {
        return {
            acknowledgementStatus: toProtoSupplierAcknowledgementStatus(record.acknowledgementStatus),
            acknowledgedAt: record.acknowledgedAt ?? '',
            externalReference: record.externalReference ?? '',
            comment: record.comment ?? ''
        };
    }
    static toPurchaseOrderChange(record) {
        return {
            purchaseOrderChangeId: record.purchaseOrderChangeId,
            purchaseOrderId: record.purchaseOrderId,
            changeType: record.changeType,
            changeSummary: record.changeSummary,
            changeReason: record.changeReason ?? '',
            appliedBy: {
                operatorId: record.appliedBy.operatorId,
                displayName: record.appliedBy.displayName
            },
            appliedAt: record.appliedAt,
            status: procurement_service_1.PurchaseOrderChangeStatus.PURCHASE_ORDER_CHANGE_STATUS_APPLIED
        };
    }
    static toReceivingExpectation(record) {
        return {
            receivingExpectationId: record.receivingExpectationId,
            purchaseOrderId: record.purchaseOrderId,
            purchaseOrderLineId: record.purchaseOrderLineId,
            supplierId: record.supplierId,
            expectedQuantity: record.expectedQuantity,
            receivedQuantitySummary: record.receivedQuantitySummary,
            openQuantity: record.openQuantity,
            expectedReceiptDate: record.expectedReceiptDate ?? '',
            status: toProtoReceivingExpectationStatus(record.status),
            discrepancy: record.discrepancy ? this.toReceivingDiscrepancy(record.discrepancy) : undefined,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };
    }
    static toReceivingExpectationSummary(record) {
        return {
            receivingExpectationId: record.receivingExpectationId,
            purchaseOrderId: record.purchaseOrderId,
            purchaseOrderLineId: record.purchaseOrderLineId,
            supplierId: record.supplierId,
            expectedReceiptDate: record.expectedReceiptDate ?? '',
            openQuantity: record.openQuantity,
            status: toProtoReceivingExpectationStatus(record.status),
            hasOpenDiscrepancy: record.discrepancy?.status === procurement_records_1.ReceivingDiscrepancyStatus.OPEN
        };
    }
    static toReceivingDiscrepancy(record) {
        return {
            receivingDiscrepancyId: record.receivingDiscrepancyId,
            discrepancyType: toProtoReceivingDiscrepancyType(record.discrepancyType),
            summary: record.summary,
            status: toProtoReceivingDiscrepancyStatus(record.status),
            resolutionCode: record.resolutionCode
                ? toProtoReceivingResolutionCode(record.resolutionCode)
                : procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_UNSPECIFIED,
            resolutionNote: record.resolutionNote ?? '',
            resolvedAt: record.resolvedAt ?? ''
        };
    }
}
exports.ProcurementGrpcPresenter = ProcurementGrpcPresenter;
function toProtoPurchaseRequestType(value) {
    switch (value) {
        case procurement_records_1.PurchaseRequestType.SALES_DEDICATED:
            return procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED;
        case procurement_records_1.PurchaseRequestType.PRODUCTION_PACKAGING:
            return procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING;
        case procurement_records_1.PurchaseRequestType.MAINTENANCE:
            return procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE;
        case procurement_records_1.PurchaseRequestType.SAMPLE:
            return procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE;
        default:
            return procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_DEPARTMENTAL;
    }
}
function toProtoPurchaseRequestStatus(value) {
    switch (value) {
        case procurement_records_1.PurchaseRequestStatus.SUBMITTED:
            return procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_SUBMITTED;
        case procurement_records_1.PurchaseRequestStatus.APPROVED:
            return procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_APPROVED;
        case procurement_records_1.PurchaseRequestStatus.REJECTED:
            return procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_REJECTED;
        case procurement_records_1.PurchaseRequestStatus.CANCELLED:
            return procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CANCELLED;
        default:
            return procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_DRAFT;
    }
}
function toProtoPurchaseRequestLineType(value) {
    return value === procurement_records_1.PurchaseRequestLineType.TEXT
        ? procurement_service_1.PurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT
        : procurement_service_1.PurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_STANDARD_ITEM;
}
function toProtoPurchaseRequestDecision(value) {
    return value === procurement_records_1.PurchaseRequestDecision.REJECTED
        ? procurement_service_1.PurchaseRequestDecision.PURCHASE_REQUEST_DECISION_REJECTED
        : procurement_service_1.PurchaseRequestDecision.PURCHASE_REQUEST_DECISION_APPROVED;
}
function toProtoPurchaseOrderStatus(value) {
    switch (value) {
        case procurement_records_1.PurchaseOrderStatus.ISSUED:
            return procurement_service_1.PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED;
        case procurement_records_1.PurchaseOrderStatus.ACKNOWLEDGED:
            return procurement_service_1.PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ACKNOWLEDGED;
        case procurement_records_1.PurchaseOrderStatus.CANCELLED:
            return procurement_service_1.PurchaseOrderStatus.PURCHASE_ORDER_STATUS_CANCELLED;
        default:
            return procurement_service_1.PurchaseOrderStatus.PURCHASE_ORDER_STATUS_DRAFT;
    }
}
function toProtoPurchaseOrderAllocationType(value) {
    switch (value) {
        case procurement_records_1.PurchaseOrderLineAllocationType.SALES_ORDER_LINE:
            return procurement_service_1.PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_SALES_ORDER_LINE;
        case procurement_records_1.PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND:
            return procurement_service_1.PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_FULFILLMENT_DEMAND;
        default:
            return procurement_service_1.PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_GENERAL_STOCK;
    }
}
function toProtoSupplierAcknowledgementStatus(value) {
    return value === procurement_records_1.PurchaseOrderSupplierAcknowledgementStatus.ACKNOWLEDGED
        ? procurement_service_1.PurchaseOrderSupplierAcknowledgementStatus.PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_ACKNOWLEDGED
        : procurement_service_1.PurchaseOrderSupplierAcknowledgementStatus.PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_PENDING;
}
function toProtoReceivingExpectationStatus(value) {
    switch (value) {
        case procurement_records_1.ReceivingExpectationStatus.PARTIALLY_RECEIVED:
            return procurement_service_1.ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED;
        case procurement_records_1.ReceivingExpectationStatus.COMPLETED:
            return procurement_service_1.ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_COMPLETED;
        case procurement_records_1.ReceivingExpectationStatus.CANCELLED:
            return procurement_service_1.ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_CANCELLED;
        default:
            return procurement_service_1.ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_OPEN;
    }
}
function toProtoReceivingDiscrepancyType(value) {
    switch (value) {
        case procurement_records_1.ReceivingDiscrepancyType.OVER_RECEIPT:
            return procurement_service_1.ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_OVER_RECEIPT;
        case procurement_records_1.ReceivingDiscrepancyType.DAMAGED:
            return procurement_service_1.ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_DAMAGED;
        case procurement_records_1.ReceivingDiscrepancyType.RESTRICTED:
            return procurement_service_1.ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_RESTRICTED;
        case procurement_records_1.ReceivingDiscrepancyType.OTHER:
            return procurement_service_1.ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_OTHER;
        default:
            return procurement_service_1.ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_SHORT_RECEIPT;
    }
}
function toProtoReceivingDiscrepancyStatus(value) {
    return value === procurement_records_1.ReceivingDiscrepancyStatus.RESOLVED
        ? procurement_service_1.ReceivingDiscrepancyStatus.RECEIVING_DISCREPANCY_STATUS_RESOLVED
        : procurement_service_1.ReceivingDiscrepancyStatus.RECEIVING_DISCREPANCY_STATUS_OPEN;
}
function toProtoReceivingResolutionCode(value) {
    switch (value) {
        case procurement_records_1.ReceivingResolutionCode.ACCEPT_SHORT_CLOSE:
            return procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_SHORT_CLOSE;
        case procurement_records_1.ReceivingResolutionCode.RETURN_OR_REJECT_EXCESS:
            return procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RETURN_OR_REJECT_EXCESS;
        case procurement_records_1.ReceivingResolutionCode.MANUAL_FOLLOW_UP:
            return procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_MANUAL_FOLLOW_UP;
        default:
            return procurement_service_1.ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_REDELIVERY;
    }
}
//# sourceMappingURL=procurement-grpc.presenter.js.map