import {
  ApplyPurchaseOrderChangeResponse,
  CancelPurchaseOrderResponse,
  CancelPurchaseRequestResponse,
  ConfirmSupplierAcknowledgementResponse,
  ConvertPurchaseRequestToPurchaseOrderResponse,
  CreatePurchaseOrderDraftResponse,
  CreatePurchaseRequestResponse,
  CreateReceivingExpectationResponse,
  GetPurchaseOrderResponse,
  GetPurchaseRequestResponse,
  GetReceivingExpectationResponse,
  ListPurchaseOrderChangesResponse,
  PurchaseOrder,
  PurchaseOrderChange,
  PurchaseOrderChangeStatus as ProtoPurchaseOrderChangeStatus,
  PurchaseOrderLine,
  PurchaseOrderLineAllocation,
  PurchaseOrderLineAllocationType as ProtoPurchaseOrderLineAllocationType,
  PurchaseOrderStatus as ProtoPurchaseOrderStatus,
  PurchaseOrderSupplierAcknowledgement,
  PurchaseOrderSupplierAcknowledgementStatus as ProtoPurchaseOrderSupplierAcknowledgementStatus,
  PurchaseOrderSummary,
  PurchaseRequest,
  PurchaseRequestApprovalSnapshot,
  PurchaseRequestDecision as ProtoPurchaseRequestDecision,
  PurchaseRequestLine,
  PurchaseRequestLineType as ProtoPurchaseRequestLineType,
  PurchaseRequestStatus as ProtoPurchaseRequestStatus,
  PurchaseRequestSummary,
  PurchaseRequestType as ProtoPurchaseRequestType,
  ReceivingDiscrepancy,
  ReceivingDiscrepancyStatus as ProtoReceivingDiscrepancyStatus,
  ReceivingDiscrepancyType as ProtoReceivingDiscrepancyType,
  ReceivingExpectation,
  ReceivingExpectationStatus as ProtoReceivingExpectationStatus,
  ReceivingExpectationSummary,
  ReceivingResolutionCode as ProtoReceivingResolutionCode,
  RecordReceivingDiscrepancyResolutionResponse,
  SearchPurchaseOrdersResponse,
  SearchPurchaseRequestsResponse,
  SearchReceivingExpectationsResponse,
  SubmitPurchaseRequestResponse,
  UpdatePurchaseOrderDraftResponse,
  UpdatePurchaseRequestDraftResponse
} from '@oes/common/generated/procurement_service'
import {
  PurchaseOrderChangeRecord,
  PurchaseOrderLineAllocationType,
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseOrderSupplierAcknowledgementStatus,
  PurchaseRequestDecision,
  PurchaseRequestRecord,
  PurchaseRequestLineType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReceivingDiscrepancyRecord,
  ReceivingDiscrepancyStatus,
  ReceivingDiscrepancyType,
  ReceivingExpectationRecord,
  ReceivingExpectationStatus,
  ReceivingResolutionCode
} from '../../domain/models/procurement-records'

/** ProcurementGrpcPresenter translates procurement phase 1 aggregates into the generated gRPC response surface. */
export class ProcurementGrpcPresenter {
  /** toCreatePurchaseRequestResponse presents one created PR aggregate on the gRPC command surface. */
  static toCreatePurchaseRequestResponse(record: PurchaseRequestRecord): CreatePurchaseRequestResponse {
    return {
      purchaseRequest: this.toPurchaseRequest(record)
    }
  }

  /** toUpdatePurchaseRequestDraftResponse presents one updated PR aggregate on the gRPC command surface. */
  static toUpdatePurchaseRequestDraftResponse(record: PurchaseRequestRecord): UpdatePurchaseRequestDraftResponse {
    return {
      purchaseRequest: this.toPurchaseRequest(record)
    }
  }

  /** toSubmitPurchaseRequestResponse presents one submitted PR aggregate on the gRPC command surface. */
  static toSubmitPurchaseRequestResponse(record: PurchaseRequestRecord): SubmitPurchaseRequestResponse {
    return {
      purchaseRequest: this.toPurchaseRequest(record)
    }
  }

  /** toCancelPurchaseRequestResponse presents one cancelled PR aggregate on the gRPC command surface. */
  static toCancelPurchaseRequestResponse(record: PurchaseRequestRecord): CancelPurchaseRequestResponse {
    return {
      purchaseRequest: this.toPurchaseRequest(record)
    }
  }

  /** toConvertPurchaseRequestToPurchaseOrderResponse presents one converted PO draft aggregate on the gRPC command surface. */
  static toConvertPurchaseRequestToPurchaseOrderResponse(
    record: PurchaseOrderRecord
  ): ConvertPurchaseRequestToPurchaseOrderResponse {
    return {
      purchaseOrder: this.toPurchaseOrder(record)
    }
  }

  /** toCreatePurchaseOrderDraftResponse presents one created PO draft aggregate on the gRPC command surface. */
  static toCreatePurchaseOrderDraftResponse(record: PurchaseOrderRecord): CreatePurchaseOrderDraftResponse {
    return {
      purchaseOrder: this.toPurchaseOrder(record)
    }
  }

  /** toUpdatePurchaseOrderDraftResponse presents one updated PO draft aggregate on the gRPC command surface. */
  static toUpdatePurchaseOrderDraftResponse(record: PurchaseOrderRecord): UpdatePurchaseOrderDraftResponse {
    return {
      purchaseOrder: this.toPurchaseOrder(record)
    }
  }

  /** toConfirmSupplierAcknowledgementResponse presents one acknowledged PO aggregate on the gRPC command surface. */
  static toConfirmSupplierAcknowledgementResponse(
    record: PurchaseOrderRecord
  ): ConfirmSupplierAcknowledgementResponse {
    return {
      purchaseOrder: this.toPurchaseOrder(record)
    }
  }

  /** toCancelPurchaseOrderResponse presents one cancelled PO aggregate on the gRPC command surface. */
  static toCancelPurchaseOrderResponse(record: PurchaseOrderRecord): CancelPurchaseOrderResponse {
    return {
      purchaseOrder: this.toPurchaseOrder(record)
    }
  }

  /** toApplyPurchaseOrderChangeResponse presents one updated PO plus applied change on the gRPC command surface. */
  static toApplyPurchaseOrderChangeResponse(input: {
    purchaseOrder: PurchaseOrderRecord
    change: PurchaseOrderChangeRecord
  }): ApplyPurchaseOrderChangeResponse {
    return {
      purchaseOrder: this.toPurchaseOrder(input.purchaseOrder),
      change: this.toPurchaseOrderChange(input.change)
    }
  }

  /** toCreateReceivingExpectationResponse presents one created procurement expectation aggregate on the gRPC command surface. */
  static toCreateReceivingExpectationResponse(
    record: ReceivingExpectationRecord
  ): CreateReceivingExpectationResponse {
    return {
      receivingExpectation: this.toReceivingExpectation(record)
    }
  }

  /** toRecordReceivingDiscrepancyResolutionResponse presents one resolved discrepancy summary on the gRPC command surface. */
  static toRecordReceivingDiscrepancyResolutionResponse(input: {
    receivingExpectation: ReceivingExpectationRecord
    receivingDiscrepancy: ReceivingDiscrepancyRecord
  }): RecordReceivingDiscrepancyResolutionResponse {
    return {
      receivingExpectation: this.toReceivingExpectation(input.receivingExpectation),
      receivingDiscrepancy: this.toReceivingDiscrepancy(input.receivingDiscrepancy)
    }
  }

  /** toGetPurchaseRequestResponse presents one PR aggregate on the gRPC query surface. */
  static toGetPurchaseRequestResponse(record: PurchaseRequestRecord): GetPurchaseRequestResponse {
    return {
      purchaseRequest: this.toPurchaseRequest(record)
    }
  }

  /** toSearchPurchaseRequestsResponse presents one PR summary page on the gRPC query surface. */
  static toSearchPurchaseRequestsResponse(input: {
    purchaseRequests: PurchaseRequestRecord[]
    total: number
    page: number
    pageSize: number
  }): SearchPurchaseRequestsResponse {
    return {
      purchaseRequests: input.purchaseRequests.map((record) => this.toPurchaseRequestSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetPurchaseOrderResponse presents one PO aggregate on the gRPC query surface. */
  static toGetPurchaseOrderResponse(record: PurchaseOrderRecord): GetPurchaseOrderResponse {
    return {
      purchaseOrder: this.toPurchaseOrder(record)
    }
  }

  /** toSearchPurchaseOrdersResponse presents one PO summary page on the gRPC query surface. */
  static toSearchPurchaseOrdersResponse(input: {
    purchaseOrders: PurchaseOrderRecord[]
    total: number
    page: number
    pageSize: number
  }): SearchPurchaseOrdersResponse {
    return {
      purchaseOrders: input.purchaseOrders.map((record) => this.toPurchaseOrderSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toListPurchaseOrderChangesResponse presents one applied-change page on the gRPC query surface. */
  static toListPurchaseOrderChangesResponse(input: {
    changes: PurchaseOrderChangeRecord[]
    total: number
    page: number
    pageSize: number
  }): ListPurchaseOrderChangesResponse {
    return {
      changes: input.changes.map((change) => this.toPurchaseOrderChange(change)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetReceivingExpectationResponse presents one receiving expectation aggregate on the gRPC query surface. */
  static toGetReceivingExpectationResponse(
    record: ReceivingExpectationRecord
  ): GetReceivingExpectationResponse {
    return {
      receivingExpectation: this.toReceivingExpectation(record)
    }
  }

  /** toSearchReceivingExpectationsResponse presents one receiving summary page on the gRPC query surface. */
  static toSearchReceivingExpectationsResponse(input: {
    receivingExpectations: ReceivingExpectationRecord[]
    total: number
    page: number
    pageSize: number
  }): SearchReceivingExpectationsResponse {
    return {
      receivingExpectations: input.receivingExpectations.map((record) =>
        this.toReceivingExpectationSummary(record)
      ),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toPurchaseRequest converts one procurement PR aggregate into the generated gRPC read shape. */
  static toPurchaseRequest(record: PurchaseRequestRecord): PurchaseRequest {
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
    }
  }

  private static toPurchaseRequestSummary(record: PurchaseRequestRecord): PurchaseRequestSummary {
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
    }
  }

  private static toPurchaseRequestApprovalSnapshot(
    snapshot: NonNullable<PurchaseRequestRecord['approvalSnapshot']>
  ): PurchaseRequestApprovalSnapshot {
    return {
      decision: toProtoPurchaseRequestDecision(snapshot.decision),
      decidedBy: {
        operatorId: snapshot.decidedBy.operatorId,
        displayName: snapshot.decidedBy.displayName
      },
      decidedAt: snapshot.decidedAt,
      comment: snapshot.comment ?? '',
      approvalReference: snapshot.approvalReference ?? ''
    }
  }

  private static toPurchaseRequestLine(record: PurchaseRequestRecord['lines'][number]): PurchaseRequestLine {
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
    }
  }

  private static toPurchaseOrder(record: PurchaseOrderRecord): PurchaseOrder {
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
    }
  }

  private static toPurchaseOrderSummary(record: PurchaseOrderRecord): PurchaseOrderSummary {
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
    }
  }

  private static toPurchaseOrderLine(record: PurchaseOrderRecord['lines'][number]): PurchaseOrderLine {
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
    }
  }

  private static toPurchaseOrderLineAllocation(
    record: PurchaseOrderRecord['lines'][number]['allocations'][number]
  ): PurchaseOrderLineAllocation {
    return {
      purchaseOrderLineAllocationId: record.purchaseOrderLineAllocationId,
      allocationType: toProtoPurchaseOrderAllocationType(record.allocationType),
      referenceId: record.referenceId ?? '',
      quantity: record.quantity,
      reason: record.reason ?? ''
    }
  }

  private static toPurchaseOrderSupplierAcknowledgement(
    record: PurchaseOrderRecord['supplierAcknowledgement']
  ): PurchaseOrderSupplierAcknowledgement {
    return {
      acknowledgementStatus: toProtoSupplierAcknowledgementStatus(record.acknowledgementStatus),
      acknowledgedAt: record.acknowledgedAt ?? '',
      externalReference: record.externalReference ?? '',
      comment: record.comment ?? ''
    }
  }

  private static toPurchaseOrderChange(record: PurchaseOrderChangeRecord): PurchaseOrderChange {
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
      status: ProtoPurchaseOrderChangeStatus.PURCHASE_ORDER_CHANGE_STATUS_APPLIED
    }
  }

  private static toReceivingExpectation(record: ReceivingExpectationRecord): ReceivingExpectation {
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
    }
  }

  private static toReceivingExpectationSummary(
    record: ReceivingExpectationRecord
  ): ReceivingExpectationSummary {
    return {
      receivingExpectationId: record.receivingExpectationId,
      purchaseOrderId: record.purchaseOrderId,
      purchaseOrderLineId: record.purchaseOrderLineId,
      supplierId: record.supplierId,
      expectedReceiptDate: record.expectedReceiptDate ?? '',
      openQuantity: record.openQuantity,
      status: toProtoReceivingExpectationStatus(record.status),
      hasOpenDiscrepancy: record.discrepancy?.status === ReceivingDiscrepancyStatus.OPEN
    }
  }

  private static toReceivingDiscrepancy(record: ReceivingDiscrepancyRecord): ReceivingDiscrepancy {
    return {
      receivingDiscrepancyId: record.receivingDiscrepancyId,
      discrepancyType: toProtoReceivingDiscrepancyType(record.discrepancyType),
      summary: record.summary,
      status: toProtoReceivingDiscrepancyStatus(record.status),
      resolutionCode: record.resolutionCode
        ? toProtoReceivingResolutionCode(record.resolutionCode)
        : ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_UNSPECIFIED,
      resolutionNote: record.resolutionNote ?? '',
      resolvedAt: record.resolvedAt ?? ''
    }
  }
}

function toProtoPurchaseRequestType(value: PurchaseRequestType): ProtoPurchaseRequestType {
  switch (value) {
    case PurchaseRequestType.SALES_DEDICATED:
      return ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED
    case PurchaseRequestType.PRODUCTION_PACKAGING:
      return ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING
    case PurchaseRequestType.MAINTENANCE:
      return ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE
    case PurchaseRequestType.SAMPLE:
      return ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE
    default:
      return ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_DEPARTMENTAL
  }
}

function toProtoPurchaseRequestStatus(value: PurchaseRequestStatus): ProtoPurchaseRequestStatus {
  switch (value) {
    case PurchaseRequestStatus.SUBMITTED:
      return ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_SUBMITTED
    case PurchaseRequestStatus.APPROVED:
      return ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_APPROVED
    case PurchaseRequestStatus.REJECTED:
      return ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_REJECTED
    case PurchaseRequestStatus.CANCELLED:
      return ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CANCELLED
    default:
      return ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_DRAFT
  }
}

function toProtoPurchaseRequestLineType(value: PurchaseRequestLineType): ProtoPurchaseRequestLineType {
  return value === PurchaseRequestLineType.TEXT
    ? ProtoPurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT
    : ProtoPurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_STANDARD_ITEM
}

function toProtoPurchaseRequestDecision(value: PurchaseRequestDecision): ProtoPurchaseRequestDecision {
  return value === PurchaseRequestDecision.REJECTED
    ? ProtoPurchaseRequestDecision.PURCHASE_REQUEST_DECISION_REJECTED
    : ProtoPurchaseRequestDecision.PURCHASE_REQUEST_DECISION_APPROVED
}

function toProtoPurchaseOrderStatus(value: PurchaseOrderStatus): ProtoPurchaseOrderStatus {
  switch (value) {
    case PurchaseOrderStatus.ISSUED:
      return ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED
    case PurchaseOrderStatus.ACKNOWLEDGED:
      return ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_ACKNOWLEDGED
    case PurchaseOrderStatus.CANCELLED:
      return ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_CANCELLED
    default:
      return ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_DRAFT
  }
}

function toProtoPurchaseOrderAllocationType(
  value: PurchaseOrderLineAllocationType
): ProtoPurchaseOrderLineAllocationType {
  switch (value) {
    case PurchaseOrderLineAllocationType.SALES_ORDER_LINE:
      return ProtoPurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_SALES_ORDER_LINE
    case PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND:
      return ProtoPurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_FULFILLMENT_DEMAND
    default:
      return ProtoPurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_GENERAL_STOCK
  }
}

function toProtoSupplierAcknowledgementStatus(
  value: PurchaseOrderSupplierAcknowledgementStatus
): ProtoPurchaseOrderSupplierAcknowledgementStatus {
  return value === PurchaseOrderSupplierAcknowledgementStatus.ACKNOWLEDGED
    ? ProtoPurchaseOrderSupplierAcknowledgementStatus.PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_ACKNOWLEDGED
    : ProtoPurchaseOrderSupplierAcknowledgementStatus.PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_PENDING
}

function toProtoReceivingExpectationStatus(
  value: ReceivingExpectationStatus
): ProtoReceivingExpectationStatus {
  switch (value) {
    case ReceivingExpectationStatus.PARTIALLY_RECEIVED:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED
    case ReceivingExpectationStatus.COMPLETED:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_COMPLETED
    case ReceivingExpectationStatus.CANCELLED:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_CANCELLED
    default:
      return ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_OPEN
  }
}

function toProtoReceivingDiscrepancyType(
  value: ReceivingDiscrepancyType
): ProtoReceivingDiscrepancyType {
  switch (value) {
    case ReceivingDiscrepancyType.OVER_RECEIPT:
      return ProtoReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_OVER_RECEIPT
    case ReceivingDiscrepancyType.DAMAGED:
      return ProtoReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_DAMAGED
    case ReceivingDiscrepancyType.RESTRICTED:
      return ProtoReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_RESTRICTED
    case ReceivingDiscrepancyType.OTHER:
      return ProtoReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_OTHER
    default:
      return ProtoReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_SHORT_RECEIPT
  }
}

function toProtoReceivingDiscrepancyStatus(
  value: ReceivingDiscrepancyStatus
): ProtoReceivingDiscrepancyStatus {
  return value === ReceivingDiscrepancyStatus.RESOLVED
    ? ProtoReceivingDiscrepancyStatus.RECEIVING_DISCREPANCY_STATUS_RESOLVED
    : ProtoReceivingDiscrepancyStatus.RECEIVING_DISCREPANCY_STATUS_OPEN
}

function toProtoReceivingResolutionCode(
  value: ReceivingResolutionCode
): ProtoReceivingResolutionCode {
  switch (value) {
    case ReceivingResolutionCode.ACCEPT_SHORT_CLOSE:
      return ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_SHORT_CLOSE
    case ReceivingResolutionCode.RETURN_OR_REJECT_EXCESS:
      return ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RETURN_OR_REJECT_EXCESS
    case ReceivingResolutionCode.MANUAL_FOLLOW_UP:
      return ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_MANUAL_FOLLOW_UP
    default:
      return ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_REDELIVERY
  }
}
