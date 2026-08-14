import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  PurchaseOrderChangeStatus,
  PurchaseOrderLineAllocationType,
  PurchaseOrderStatus,
  PurchaseOrderSupplierAcknowledgementStatus,
  PurchaseRequestDecision,
  PurchaseRequestLineConversionStatus,
  PurchaseRequestLineType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReceivingDiscrepancyStatus,
  ReceivingDiscrepancyType,
  ReceivingExpectationStatus,
  ReceivingResolutionCode
} from '@oes/common/generated/procurement_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { ProcurementManagementGrpcAdapter } from './adapters/procurement-management-grpc.adapter'
import { ProcurementQueryGrpcAdapter } from './adapters/procurement-query-grpc.adapter'

type PurchaseRequestTypeValue =
  | 'DEPARTMENTAL'
  | 'MAINTENANCE'
  | 'PRODUCTION_PACKAGING'
  | 'SALES_DEDICATED'
  | 'SAMPLE'
type PurchaseRequestStatusValue =
  | 'APPROVED'
  | 'CANCELLED'
  | 'CONVERTED'
  | 'DRAFT'
  | 'PARTIALLY_CONVERTED'
  | 'REJECTED'
  | 'SUBMITTED'
type PurchaseRequestDecisionValue = 'APPROVED' | 'REJECTED'
type PurchaseRequestLineTypeValue = 'STANDARD_ITEM' | 'TEXT'
type PurchaseOrderStatusValue = 'ACKNOWLEDGED' | 'CANCELLED' | 'DRAFT' | 'ISSUED'
type PurchaseOrderAllocationTypeValue =
  | 'FULFILLMENT_DEMAND'
  | 'GENERAL_STOCK'
  | 'PURCHASE_REQUEST_LINE'
  | 'SALES_ORDER_LINE'
type SupplierAcknowledgementStatusValue = 'ACKNOWLEDGED' | 'PENDING'
type PurchaseOrderChangeStatusValue = 'APPLIED'
type ReceivingExpectationStatusValue = 'CANCELLED' | 'COMPLETED' | 'OPEN' | 'PARTIALLY_RECEIVED'
type ReceivingDiscrepancyTypeValue =
  | 'DAMAGED'
  | 'OVER_RECEIVED'
  | 'QUALITY_HOLD'
  | 'SHORT_RECEIVED'
  | 'WRONG_ITEM'
type ReceivingDiscrepancyStatusValue = 'OPEN' | 'RESOLVED'
type ReceivingResolutionCodeValue =
  | 'ACCEPT_WITH_ALLOWANCE'
  | 'ACCEPT_WITH_CONTROLLED_CHANGE'
  | 'ACCEPT_WITH_PO_CHANGE'
  | 'CLAIM'
  | 'CLOSE_UNRECEIVED'
  | 'RECEIVE_WITH_RESTRICTION'
  | 'REJECT_DAMAGED'
  | 'REJECT_EXCESS'
  | 'REJECT_WRONG_ITEM'
  | 'REQUEST_RESEND'
  | 'RETURN_TO_SUPPLIER'
  | 'TEMP_HOLD'
  | 'TEMP_RECEIVE_PENDING_DECISION'
  | 'WAIT_REDELIVERY'
  | 'WAIT_INSPECTION'

@Injectable()
// Builds the tenant-scoped procurement phase 1 BFF model without widening the underlying procurement-service contract or ownership boundaries.
export class ProcurementService {
  constructor(
    private readonly procurementQueryAdapter: ProcurementQueryGrpcAdapter,
    private readonly procurementManagementAdapter: ProcurementManagementGrpcAdapter
  ) {}

  async searchPurchaseRequests(
    tenantId: string,
    query: {
      itemId?: string
      keyword?: string
      neededByDateFrom?: string
      neededByDateTo?: string
      page?: number
      pageSize?: number
      requestType?: string
      requesterOperatorId?: string
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementQueryAdapter.searchPurchaseRequests(
      {
        itemId: normalize(query.itemId),
        keyword: normalize(query.keyword),
        neededByDateFrom: normalize(query.neededByDateFrom),
        neededByDateTo: normalize(query.neededByDateTo),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        requestType: toGrpcPurchaseRequestType(query.requestType),
        requesterOperatorId: normalize(query.requesterOperatorId),
        status: toGrpcPurchaseRequestStatus(query.status)
      },
      this.trustedSource(tenantId, source)
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      purchaseRequests: (result.purchaseRequests ?? []).map((record) => ({
        createdAt: record.createdAt ?? '',
        decidedAt: record.decidedAt ?? '',
        lineCount: Number(record.lineCount ?? 0),
        linkedPurchaseOrders: (record.linkedPurchaseOrders ?? []).map((linkedOrder) => ({
          allocatedQuantity: linkedOrder.allocatedQuantity ?? '',
          expectedReceiptDate: linkedOrder.expectedReceiptDate ?? '',
          orderNo: linkedOrder.orderNo ?? '',
          purchaseOrderId: linkedOrder.purchaseOrderId ?? '',
          purchaseOrderLineId: linkedOrder.purchaseOrderLineId ?? '',
          receivingStatusSummary: linkedOrder.receivingStatusSummary ?? ''
        })),
        nextExpectedReceiptDate: record.nextExpectedReceiptDate ?? '',
        purchaseRequestId: record.purchaseRequestId ?? '',
        receivingStatusSummary: record.receivingStatusSummary ?? '',
        requestNo: record.requestNo ?? '',
        requestType: fromGrpcPurchaseRequestType(record.requestType),
        requesterDisplayName: record.requesterDisplayName ?? '',
        status: fromGrpcPurchaseRequestStatus(record.status),
        submittedAt: record.submittedAt ?? ''
      })),
      total: Number(result.total ?? 0)
    }
  }

  async getPurchaseRequest(
    tenantId: string,
    purchaseRequestId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementQueryAdapter.getPurchaseRequest(
      {
        purchaseRequestId: requireNonBlank(purchaseRequestId, 'purchaseRequestId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseRequest(result.purchaseRequest)
  }

  async createPurchaseRequest(
    tenantId: string,
    input: {
      lines: Array<{
        demandReferenceId?: string
        demandReferenceType?: string
        description: string
        itemId?: string
        lineType: string
        neededByDate?: string
        requestedQuantity: string
        uom: string
      }>
      orgId?: string
      reason?: string
      requestType: string
      title?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.createPurchaseRequest(
      {
        lines: mapPurchaseRequestLineInputs(input.lines),
        reason: normalize(input.reason),
        requestType: requireGrpcPurchaseRequestType(input.requestType),
        title: normalize(input.title)
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseRequest(result.purchaseRequest)
  }

  async updatePurchaseRequestDraft(
    tenantId: string,
    purchaseRequestId: string,
    input: {
      lines: Array<{
        demandReferenceId?: string
        demandReferenceType?: string
        description: string
        itemId?: string
        lineType: string
        neededByDate?: string
        requestedQuantity: string
        uom: string
      }>
      reason?: string
      title?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.updatePurchaseRequestDraft(
      {
        lines: mapPurchaseRequestLineInputs(input.lines),
        purchaseRequestId: requireNonBlank(purchaseRequestId, 'purchaseRequestId'),
        reason: normalize(input.reason),
        title: normalize(input.title)
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseRequest(result.purchaseRequest)
  }

  async submitPurchaseRequest(
    tenantId: string,
    purchaseRequestId: string,
    auditReason: string | undefined,
    submissionComment: string | undefined,
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.submitPurchaseRequest(
      {
        auditReason,
        purchaseRequestId: requireNonBlank(purchaseRequestId, 'purchaseRequestId'),
        submissionComment: normalize(submissionComment)
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseRequest(result.purchaseRequest)
  }

  async decidePurchaseRequest(
    tenantId: string,
    purchaseRequestId: string,
    input: {
      approvalReference?: string
      auditReason?: string
      comment?: string
      decision: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.decidePurchaseRequest(
      {
        approvalReference: normalize(input.approvalReference),
        auditReason: input.auditReason,
        comment: normalize(input.comment),
        decision: requireGrpcPurchaseRequestDecision(input.decision),
        purchaseRequestId: requireNonBlank(purchaseRequestId, 'purchaseRequestId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseRequest(result.purchaseRequest)
  }

  async cancelPurchaseRequest(
    tenantId: string,
    purchaseRequestId: string,
    input: {
      auditReason?: string
      cancelReason: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.cancelPurchaseRequest(
      {
        auditReason: input.auditReason,
        cancelReason: requireNonBlank(input.cancelReason, 'cancelReason'),
        purchaseRequestId: requireNonBlank(purchaseRequestId, 'purchaseRequestId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseRequest(result.purchaseRequest)
  }

  async convertPurchaseRequestToPurchaseOrder(
    tenantId: string,
    purchaseRequestId: string,
    input: {
      auditReason?: string
      currencyCode: string
      selectedLines: Array<{
        generalStockExcessReason?: string
        orderedUnitPrice?: string
        purchaseOrderQuantity: string
        purchaseRequestLineId: string
      }>
      supplierId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.convertPurchaseRequestToPurchaseOrder(
      {
        auditReason: input.auditReason,
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        sourceLines: (input.selectedLines ?? []).map((line) => ({
          generalStockExcessReason: normalize(line.generalStockExcessReason),
          orderedUnitPrice: normalize(line.orderedUnitPrice),
          purchaseOrderQuantity: requireNonBlank(
            line.purchaseOrderQuantity,
            'selectedLines.purchaseOrderQuantity'
          ),
          purchaseRequestId: requireNonBlank(purchaseRequestId, 'purchaseRequestId'),
          purchaseRequestLineId: requireNonBlank(
            line.purchaseRequestLineId,
            'selectedLines.purchaseRequestLineId'
          )
        })),
        supplierId: requireNonBlank(input.supplierId, 'supplierId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseOrder(result.purchaseOrder)
  }

  async searchPurchaseOrders(
    tenantId: string,
    query: {
      issuedFrom?: string
      issuedTo?: string
      itemId?: string
      keyword?: string
      page?: number
      pageSize?: number
      requestNo?: string
      status?: string
      supplierId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementQueryAdapter.searchPurchaseOrders(
      {
        issuedFrom: normalize(query.issuedFrom),
        issuedTo: normalize(query.issuedTo),
        itemId: normalize(query.itemId),
        keyword: normalize(query.keyword),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        requestNo: normalize(query.requestNo),
        status: toGrpcPurchaseOrderStatus(query.status),
        supplierId: normalize(query.supplierId)
      },
      this.trustedSource(tenantId, source)
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      purchaseOrders: (result.purchaseOrders ?? []).map((record) => ({
        createdAt: record.createdAt ?? '',
        currencyCode: record.currencyCode ?? '',
        issuedAt: record.issuedAt ?? '',
        lineCount: Number(record.lineCount ?? 0),
        orderNo: record.orderNo ?? '',
        purchaseOrderId: record.purchaseOrderId ?? '',
        status: fromGrpcPurchaseOrderStatus(record.status),
        supplierDisplayName: record.supplierDisplayName ?? '',
        supplierId: record.supplierId ?? ''
      })),
      total: Number(result.total ?? 0)
    }
  }

  async getPurchaseOrder(
    tenantId: string,
    purchaseOrderId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementQueryAdapter.getPurchaseOrder(
      {
        purchaseOrderId: requireNonBlank(purchaseOrderId, 'purchaseOrderId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseOrder(result.purchaseOrder)
  }

  async createPurchaseOrderDraft(
    tenantId: string,
    input: {
      currencyCode: string
      lines?: PurchaseOrderLineDraftInput[]
      orgId?: string
      sourcePurchaseRequestIds?: string[]
      supplierId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.createPurchaseOrderDraft(
      {
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        lines: mapPurchaseOrderDraftLines(input.lines),
        sourcePurchaseRequestIds: normalizeStringArray(input.sourcePurchaseRequestIds),
        supplierId: requireNonBlank(input.supplierId, 'supplierId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseOrder(result.purchaseOrder)
  }

  async updatePurchaseOrderDraft(
    tenantId: string,
    purchaseOrderId: string,
    input: {
      currencyCode: string
      lines: PurchaseOrderLineDraftInput[]
      sourcePurchaseRequestIds?: string[]
      supplierId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.updatePurchaseOrderDraft(
      {
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        lines: mapPurchaseOrderDraftLines(input.lines),
        purchaseOrderId: requireNonBlank(purchaseOrderId, 'purchaseOrderId'),
        sourcePurchaseRequestIds: normalizeStringArray(input.sourcePurchaseRequestIds),
        supplierId: requireNonBlank(input.supplierId, 'supplierId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseOrder(result.purchaseOrder)
  }

  async issuePurchaseOrder(
    tenantId: string,
    purchaseOrderId: string,
    auditReason: string | undefined,
    issueComment: string | undefined,
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.issuePurchaseOrder(
      {
        auditReason,
        issueComment: normalize(issueComment),
        purchaseOrderId: requireNonBlank(purchaseOrderId, 'purchaseOrderId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseOrder(result.purchaseOrder)
  }

  async confirmSupplierAcknowledgement(
    tenantId: string,
    purchaseOrderId: string,
    input: {
      acknowledgedAt?: string
      auditReason?: string
      comment?: string
      externalReference?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.confirmSupplierAcknowledgement(
      {
        acknowledgedAt: normalize(input.acknowledgedAt),
        auditReason: input.auditReason,
        comment: normalize(input.comment),
        externalReference: normalize(input.externalReference),
        purchaseOrderId: requireNonBlank(purchaseOrderId, 'purchaseOrderId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseOrder(result.purchaseOrder)
  }

  async applyPurchaseOrderChange(
    tenantId: string,
    purchaseOrderId: string,
    input: {
      auditReason?: string
      changeReason: string
      changeType: string
      targetState: {
        lines?: PurchaseOrderLineDraftInput[]
        supplierAcknowledgement?: {
          acknowledgedAt?: string
          comment?: string
          externalReference?: string
        }
      }
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.applyPurchaseOrderChange(
      {
        auditReason: input.auditReason,
        changeReason: requireNonBlank(input.changeReason, 'changeReason'),
        changeType: requireNonBlank(input.changeType, 'changeType'),
        purchaseOrderId: requireNonBlank(purchaseOrderId, 'purchaseOrderId'),
        targetState: {
          lines: mapPurchaseOrderDraftLines(input.targetState?.lines),
          supplierAcknowledgement: input.targetState?.supplierAcknowledgement
            ? {
                acknowledgementStatus:
                  PurchaseOrderSupplierAcknowledgementStatus.PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_ACKNOWLEDGED,
                acknowledgedAt: normalize(input.targetState.supplierAcknowledgement.acknowledgedAt),
                comment: normalize(input.targetState.supplierAcknowledgement.comment),
                externalReference: normalize(
                  input.targetState.supplierAcknowledgement.externalReference
                )
              }
            : undefined
        }
      },
      this.trustedSource(tenantId, source)
    )

    return {
      change: mapPurchaseOrderChange(result.change),
      purchaseOrder: mapPurchaseOrder(result.purchaseOrder)
    }
  }

  async cancelPurchaseOrder(
    tenantId: string,
    purchaseOrderId: string,
    input: {
      auditReason?: string
      cancelReason: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.cancelPurchaseOrder(
      {
        auditReason: input.auditReason,
        cancelReason: requireNonBlank(input.cancelReason, 'cancelReason'),
        purchaseOrderId: requireNonBlank(purchaseOrderId, 'purchaseOrderId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapPurchaseOrder(result.purchaseOrder)
  }

  async listPurchaseOrderChanges(
    tenantId: string,
    purchaseOrderId: string,
    query: {
      page?: number
      pageSize?: number
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementQueryAdapter.listPurchaseOrderChanges(
      {
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        purchaseOrderId: requireNonBlank(purchaseOrderId, 'purchaseOrderId')
      },
      this.trustedSource(tenantId, source)
    )

    return {
      changes: (result.changes ?? []).map((record) => mapPurchaseOrderChange(record)),
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0)
    }
  }

  async searchReceivingExpectations(
    tenantId: string,
    query: {
      expectedReceiptDateFrom?: string
      expectedReceiptDateTo?: string
      hasOpenDiscrepancy?: boolean
      page?: number
      pageSize?: number
      purchaseOrderId?: string
      status?: string
      supplierId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementQueryAdapter.searchReceivingExpectations(
      {
        expectedReceiptDateFrom: normalize(query.expectedReceiptDateFrom),
        expectedReceiptDateTo: normalize(query.expectedReceiptDateTo),
        hasOpenDiscrepancy: query.hasOpenDiscrepancy,
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        purchaseOrderId: normalize(query.purchaseOrderId),
        status: toGrpcReceivingExpectationStatus(query.status),
        supplierId: normalize(query.supplierId)
      },
      this.trustedSource(tenantId, source)
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      receivingExpectations: (result.receivingExpectations ?? []).map((record) => ({
        expectedReceiptDate: record.expectedReceiptDate ?? '',
        hasOpenDiscrepancy: Boolean(record.hasOpenDiscrepancy),
        openQuantity: record.openQuantity ?? '',
        purchaseOrderId: record.purchaseOrderId ?? '',
        purchaseOrderLineId: record.purchaseOrderLineId ?? '',
        receivingExpectationId: record.receivingExpectationId ?? '',
        status: fromGrpcReceivingExpectationStatus(record.status),
        supplierId: record.supplierId ?? '',
        targetReceivingAddressId: record.targetReceivingAddressId ?? '',
        targetWarehouseId: record.targetWarehouseId ?? ''
      })),
      total: Number(result.total ?? 0)
    }
  }

  async getReceivingExpectation(
    tenantId: string,
    receivingExpectationId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementQueryAdapter.getReceivingExpectation(
      {
        receivingExpectationId: requireNonBlank(receivingExpectationId, 'receivingExpectationId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapReceivingExpectation(result.receivingExpectation)
  }

  async createReceivingExpectation(
    tenantId: string,
    input: {
      auditReason?: string
      expectedQuantity: string
      expectedReceiptDate?: string
      purchaseOrderId: string
      purchaseOrderLineId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.createReceivingExpectation(
      {
        auditReason: input.auditReason,
        expectedQuantity: requireNonBlank(input.expectedQuantity, 'expectedQuantity'),
        expectedReceiptDate: normalize(input.expectedReceiptDate),
        purchaseOrderId: requireNonBlank(input.purchaseOrderId, 'purchaseOrderId'),
        purchaseOrderLineId: requireNonBlank(input.purchaseOrderLineId, 'purchaseOrderLineId')
      },
      this.trustedSource(tenantId, source)
    )

    return mapReceivingExpectation(result.receivingExpectation)
  }

  async recordReceivingDiscrepancyResolution(
    tenantId: string,
    receivingExpectationId: string,
    receivingDiscrepancyId: string,
    input: {
      auditReason?: string
      resolutionCode: string
      resolutionNote?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.procurementManagementAdapter.recordReceivingDiscrepancyResolution(
      {
        auditReason: input.auditReason,
        receivingDiscrepancyId: requireNonBlank(receivingDiscrepancyId, 'receivingDiscrepancyId'),
        receivingExpectationId: requireNonBlank(receivingExpectationId, 'receivingExpectationId'),
        resolutionCode: requireGrpcReceivingResolutionCode(input.resolutionCode),
        resolutionNote: normalize(input.resolutionNote)
      },
      this.trustedSource(tenantId, source)
    )

    return {
      receivingDiscrepancy: mapReceivingDiscrepancy(result.receivingDiscrepancy),
      receivingExpectation: mapReceivingExpectation(result.receivingExpectation)
    }
  }

  /** trustedSource validates the route tenant while preserving the verified Gateway source object. */
  private trustedSource(
    tenantId: string,
    source: DownstreamRequestSource
  ): DownstreamRequestSource {
    this.resolveTenantId(tenantId, source)
    return source
  }

  /** resolveTenantId keeps tenant-scoped procurement requests pinned to the operator tenant. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only access procurement workspace data in their current tenant'
      )
    }

    return operatorTenantId
  }
}

type PurchaseOrderLineDraftInput = {
  allocations: Array<{
    allocationType: string
    quantity: string
    reason?: string
    referenceId?: string
  }>
  description: string
  generalStockExcessReason?: string
  itemId?: string
  lineType: string
  orderedQuantity: string
  orderedUnitPrice?: string
  purchaseOrderLineId?: string
  sourcePurchaseRequestLineId?: string
  uom: string
}

/** mapPurchaseRequest converts one procurement purchase request aggregate into the tenant-web BFF shape. */
function mapPurchaseRequest(record?: any) {
  const cancelledAt = normalize(record?.cancelledAt)
  const decidedAt = normalize(record?.decidedAt)
  const nextExpectedReceiptDate = normalize(record?.nextExpectedReceiptDate)
  const orgId = normalize(record?.orgId)
  const receivingStatusSummary = normalize(record?.receivingStatusSummary)
  const submittedAt = normalize(record?.submittedAt)

  return {
    approvalSnapshot: record?.approvalSnapshot
      ? {
          approvalReference: record.approvalSnapshot.approvalReference ?? '',
          comment: record.approvalSnapshot.comment ?? '',
          decidedAt: record.approvalSnapshot.decidedAt ?? '',
          decidedBy: {
            displayName: record.approvalSnapshot.decidedBy?.displayName ?? '',
            operatorId: record.approvalSnapshot.decidedBy?.operatorId ?? ''
          },
          decision: fromGrpcPurchaseRequestDecision(record.approvalSnapshot.decision)
        }
      : undefined,
    createdAt: record?.createdAt ?? '',
    ...(cancelledAt ? { cancelledAt } : {}),
    ...(decidedAt ? { decidedAt } : {}),
    lines: (record?.lines ?? []).map((line: any) => ({
      conversionStatus: fromGrpcPurchaseRequestLineConversionStatus(line.conversionStatus),
      demandReferenceId: line.demandReferenceId ?? '',
      demandReferenceType: line.demandReferenceType ?? '',
      description: line.description ?? '',
      itemCode: line.itemCode ?? '',
      itemId: line.itemId ?? '',
      itemName: line.itemName ?? '',
      linkedPurchaseOrderLines: (line.linkedPurchaseOrderLines ?? []).map((linkedLine: any) => ({
        allocatedQuantity: linkedLine.allocatedQuantity ?? '',
        expectedReceiptDate: linkedLine.expectedReceiptDate ?? '',
        orderNo: linkedLine.orderNo ?? '',
        purchaseOrderId: linkedLine.purchaseOrderId ?? '',
        purchaseOrderLineId: linkedLine.purchaseOrderLineId ?? '',
        receivingStatusSummary: linkedLine.receivingStatusSummary ?? ''
      })),
      lineNo: Number(line.lineNo ?? 0),
      lineType: fromGrpcPurchaseRequestLineType(line.lineType),
      neededByDate: line.neededByDate ?? '',
      purchaseRequestLineId: line.purchaseRequestLineId ?? '',
      requestedQuantity: line.requestedQuantity ?? '',
      uom: line.uom ?? ''
    })),
    purchaseRequestId: record?.purchaseRequestId ?? '',
    reason: record?.reason ?? '',
    requestNo: record?.requestNo ?? '',
    requestType: fromGrpcPurchaseRequestType(record?.requestType),
    requester: {
      displayName: record?.requester?.displayName ?? '',
      operatorId: record?.requester?.operatorId ?? ''
    },
    status: fromGrpcPurchaseRequestStatus(record?.status),
    ...(orgId ? { orgId } : {}),
    linkedPurchaseOrders: (record?.linkedPurchaseOrders ?? []).map((linkedOrder: any) => ({
      allocatedQuantity: linkedOrder.allocatedQuantity ?? '',
      expectedReceiptDate: linkedOrder.expectedReceiptDate ?? '',
      orderNo: linkedOrder.orderNo ?? '',
      purchaseOrderId: linkedOrder.purchaseOrderId ?? '',
      purchaseOrderLineId: linkedOrder.purchaseOrderLineId ?? '',
      receivingStatusSummary: linkedOrder.receivingStatusSummary ?? ''
    })),
    ...(nextExpectedReceiptDate ? { nextExpectedReceiptDate } : {}),
    ...(receivingStatusSummary ? { receivingStatusSummary } : {}),
    ...(submittedAt ? { submittedAt } : {}),
    tenantId: record?.tenantId ?? '',
    title: record?.title ?? '',
    updatedAt: record?.updatedAt ?? ''
  }
}

/** mapPurchaseOrder converts one procurement purchase order aggregate into the tenant-web BFF shape. */
function mapPurchaseOrder(record?: any) {
  const cancelledAt = normalize(record?.cancelledAt)
  const orgId = normalize(record?.orgId)

  return {
    createdAt: record?.createdAt ?? '',
    currencyCode: record?.currencyCode ?? '',
    issuedAt: record?.issuedAt ?? '',
    ...(cancelledAt ? { cancelledAt } : {}),
    lines: (record?.lines ?? []).map((line: any) => ({
      allocations: (line.allocations ?? []).map((allocation: any) => ({
        allocationType: fromGrpcPurchaseOrderAllocationType(
          allocation.allocationSourceType ?? allocation.allocationType
        ),
        quantity: allocation.quantity ?? '',
        reason: allocation.reason ?? '',
        referenceId: allocation.sourceReferenceId ?? allocation.referenceId ?? '',
        targetReceivingAddressId: allocation.targetReceivingAddressId ?? '',
        targetWarehouseId: allocation.targetWarehouseId ?? ''
      })),
      description: line.description ?? '',
      generalStockExcessReason: line.generalStockExcessReason ?? '',
      itemCode: line.itemCode ?? '',
      itemId: line.itemId ?? '',
      itemName: line.itemName ?? '',
      lineNo: Number(line.lineNo ?? 0),
      lineType: fromGrpcPurchaseRequestLineType(line.lineType),
      orderedQuantity: line.orderedQuantity ?? '',
      orderedUnitPrice: line.orderedUnitPrice ?? '',
      purchaseOrderLineId: line.purchaseOrderLineId ?? '',
      sourcePurchaseRequestLineId: line.sourcePurchaseRequestLineId ?? '',
      supplierOfferingId: line.supplierOfferingId ?? '',
      uom: line.uom ?? ''
    })),
    orderNo: record?.orderNo ?? '',
    ...(orgId ? { orgId } : {}),
    paymentSummary: record?.paymentSummary
      ? {
          attachmentRefs: (record.paymentSummary.attachmentRefs ?? []).map(
            (ref: string) => ref ?? ''
          ),
          balancePaidAmount: record.paymentSummary.balancePaidAmount ?? '',
          currencyCode: record.paymentSummary.currencyCode ?? '',
          depositPaidAmount: record.paymentSummary.depositPaidAmount ?? '',
          lastPaymentAt: record.paymentSummary.lastPaymentAt ?? '',
          paymentStatusSummary: record.paymentSummary.paymentStatusSummary ?? ''
        }
      : undefined,
    purchaseOrderId: record?.purchaseOrderId ?? '',
    sourcePurchaseRequestIds: (record?.sourcePurchaseRequestIds ?? []).map(
      (id: string) => id ?? ''
    ),
    status: fromGrpcPurchaseOrderStatus(record?.status),
    supplierAcknowledgement: record?.supplierAcknowledgement
      ? {
          acknowledgementStatus: fromGrpcSupplierAcknowledgementStatus(
            record.supplierAcknowledgement.acknowledgementStatus
          ),
          acknowledgedAt: record.supplierAcknowledgement.acknowledgedAt ?? '',
          comment: record.supplierAcknowledgement.comment ?? '',
          externalReference: record.supplierAcknowledgement.externalReference ?? ''
        }
      : undefined,
    supplierId: record?.supplierId ?? '',
    supplierSnapshot: record?.supplierSnapshot
      ? {
          supplierDisplayName: record.supplierSnapshot.supplierDisplayName ?? '',
          supplierId: record.supplierSnapshot.supplierId ?? '',
          supplierStatusAtIssue: record.supplierSnapshot.supplierStatusAtIssue ?? ''
        }
      : undefined,
    tenantId: record?.tenantId ?? '',
    updatedAt: record?.updatedAt ?? ''
  }
}

/** mapPurchaseOrderChange converts one procurement applied change record into the tenant-web BFF shape. */
function mapPurchaseOrderChange(record?: any) {
  return {
    appliedAt: record?.appliedAt ?? '',
    appliedBy: {
      displayName: record?.appliedBy?.displayName ?? '',
      operatorId: record?.appliedBy?.operatorId ?? ''
    },
    changeReason: record?.changeReason ?? '',
    changeSummary: record?.changeSummary ?? '',
    changeType: record?.changeType ?? '',
    purchaseOrderChangeId: record?.purchaseOrderChangeId ?? '',
    purchaseOrderId: record?.purchaseOrderId ?? '',
    status: fromGrpcPurchaseOrderChangeStatus(record?.status)
  }
}

/** mapReceivingExpectation converts one procurement receiving expectation aggregate into the tenant-web BFF shape. */
function mapReceivingExpectation(record?: any) {
  const allocationGroupingKey = normalize(record?.allocationGroupingKey)
  const targetReceivingAddressId = normalize(record?.targetReceivingAddressId)
  const targetWarehouseId = normalize(record?.targetWarehouseId)

  return {
    ...(allocationGroupingKey ? { allocationGroupingKey } : {}),
    createdAt: record?.createdAt ?? '',
    discrepancy: mapReceivingDiscrepancy(record?.discrepancy),
    expectedQuantity: record?.expectedQuantity ?? '',
    expectedReceiptDate: record?.expectedReceiptDate ?? '',
    openQuantity: record?.openQuantity ?? '',
    purchaseOrderId: record?.purchaseOrderId ?? '',
    purchaseOrderLineId: record?.purchaseOrderLineId ?? '',
    receivedQuantitySummary: record?.receivedQuantitySummary ?? '',
    receivingExpectationId: record?.receivingExpectationId ?? '',
    sourceAllocationIds: (record?.sourceAllocationIds ?? []).map((id: string) => id ?? ''),
    status: fromGrpcReceivingExpectationStatus(record?.status),
    supplierId: record?.supplierId ?? '',
    ...(targetReceivingAddressId ? { targetReceivingAddressId } : {}),
    ...(targetWarehouseId ? { targetWarehouseId } : {}),
    updatedAt: record?.updatedAt ?? ''
  }
}

/** mapReceivingDiscrepancy converts one procurement receiving discrepancy summary into the tenant-web BFF shape. */
function mapReceivingDiscrepancy(record?: any) {
  if (!record) {
    return undefined
  }

  return {
    discrepancyType: fromGrpcReceivingDiscrepancyType(record.discrepancyType),
    receivingDiscrepancyId: record.receivingDiscrepancyId ?? '',
    resolutionCode: fromGrpcReceivingResolutionCode(record.resolutionCode),
    resolutionNote: record.resolutionNote ?? '',
    resolutionReferences: (record.resolutionReferences ?? []).map((reference: any) => ({
      referenceId: reference.referenceId ?? '',
      referenceType: reference.referenceType ?? ''
    })),
    resolvedAt: record.resolvedAt ?? '',
    status: fromGrpcReceivingDiscrepancyStatus(record.status),
    summary: record.summary ?? ''
  }
}

/** mapPurchaseRequestLineInputs translates the BFF PR line inputs into the frozen procurement gRPC line input shape. */
function mapPurchaseRequestLineInputs(lines?: Array<any>) {
  return (lines ?? []).map((line) => ({
    demandReferenceId: normalize(line.demandReferenceId),
    demandReferenceType: normalize(line.demandReferenceType),
    description: requireNonBlank(line.description, 'description'),
    itemId: normalize(line.itemId),
    lineType: requireGrpcPurchaseRequestLineType(line.lineType),
    neededByDate: normalize(line.neededByDate),
    requestedQuantity: requireNonBlank(line.requestedQuantity, 'requestedQuantity'),
    uom: requireNonBlank(line.uom, 'uom')
  }))
}

/** mapPurchaseOrderDraftLines translates the BFF PO line inputs into the frozen procurement gRPC line draft shape. */
function mapPurchaseOrderDraftLines(lines?: PurchaseOrderLineDraftInput[]) {
  return (lines ?? []).map((line) => ({
    allocations: (line.allocations ?? []).map((allocation) => ({
      allocationSourceType: requireGrpcPurchaseOrderAllocationType(allocation.allocationType),
      quantity: requireNonBlank(allocation.quantity, 'allocations.quantity'),
      reason: normalize(allocation.reason),
      sourceReferenceId: normalize(allocation.referenceId)
    })),
    description: requireNonBlank(line.description, 'description'),
    generalStockExcessReason: normalize(line.generalStockExcessReason),
    itemId: normalize(line.itemId),
    lineType: requireGrpcPurchaseRequestLineType(line.lineType),
    orderedQuantity: requireNonBlank(line.orderedQuantity, 'orderedQuantity'),
    orderedUnitPrice: normalize(line.orderedUnitPrice),
    purchaseOrderLineId: normalize(line.purchaseOrderLineId),
    sourcePurchaseRequestLineId: normalize(line.sourcePurchaseRequestLineId),
    uom: requireNonBlank(line.uom, 'uom')
  }))
}

function toGrpcPurchaseRequestType(value?: string): PurchaseRequestType | undefined {
  switch (normalize(value)) {
    case 'SALES_DEDICATED':
      return PurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED
    case 'PRODUCTION_PACKAGING':
      return PurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING
    case 'MAINTENANCE':
      return PurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE
    case 'SAMPLE':
      return PurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE
    case 'DEPARTMENTAL':
      return PurchaseRequestType.PURCHASE_REQUEST_TYPE_DEPARTMENTAL
    default:
      return undefined
  }
}

function requireGrpcPurchaseRequestType(value?: string): PurchaseRequestType {
  return toGrpcPurchaseRequestType(value) ?? PurchaseRequestType.PURCHASE_REQUEST_TYPE_DEPARTMENTAL
}

function toGrpcPurchaseRequestStatus(value?: string): PurchaseRequestStatus | undefined {
  switch (normalize(value)) {
    case 'SUBMITTED':
      return PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_SUBMITTED
    case 'APPROVED':
      return PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_APPROVED
    case 'PARTIALLY_CONVERTED':
      return PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_PARTIALLY_CONVERTED
    case 'CONVERTED':
      return PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CONVERTED
    case 'REJECTED':
      return PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_REJECTED
    case 'CANCELLED':
      return PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CANCELLED
    case 'DRAFT':
      return PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_DRAFT
    default:
      return undefined
  }
}

function requireGrpcPurchaseRequestDecision(value?: string): PurchaseRequestDecision {
  return normalize(value) === 'REJECTED'
    ? PurchaseRequestDecision.PURCHASE_REQUEST_DECISION_REJECTED
    : PurchaseRequestDecision.PURCHASE_REQUEST_DECISION_APPROVED
}

function requireGrpcPurchaseRequestLineType(value?: string): PurchaseRequestLineType {
  return normalize(value) === 'TEXT'
    ? PurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT
    : PurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_STANDARD_ITEM
}

function toGrpcPurchaseOrderStatus(value?: string): PurchaseOrderStatus | undefined {
  switch (normalize(value)) {
    case 'ISSUED':
      return PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED
    case 'ACKNOWLEDGED':
      return PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ACKNOWLEDGED
    case 'CANCELLED':
      return PurchaseOrderStatus.PURCHASE_ORDER_STATUS_CANCELLED
    case 'DRAFT':
      return PurchaseOrderStatus.PURCHASE_ORDER_STATUS_DRAFT
    default:
      return undefined
  }
}

function requireGrpcPurchaseOrderAllocationType(value?: string): PurchaseOrderLineAllocationType {
  switch (normalize(value)) {
    case 'PURCHASE_REQUEST_LINE':
      return PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_PURCHASE_REQUEST_LINE
    case 'SALES_ORDER_LINE':
      return PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_SALES_ORDER_LINE
    case 'FULFILLMENT_DEMAND':
      return PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_FULFILLMENT_DEMAND
    default:
      return PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_GENERAL_STOCK
  }
}

function toGrpcReceivingExpectationStatus(value?: string): ReceivingExpectationStatus | undefined {
  switch (normalize(value)) {
    case 'PARTIALLY_RECEIVED':
      return ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED
    case 'COMPLETED':
      return ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_COMPLETED
    case 'CANCELLED':
      return ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_CANCELLED
    case 'OPEN':
      return ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_OPEN
    default:
      return undefined
  }
}

function requireGrpcReceivingResolutionCode(value?: string): ReceivingResolutionCode {
  switch (normalize(value)) {
    case 'CLOSE_UNRECEIVED':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLOSE_UNRECEIVED
    case 'REQUEST_RESEND':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REQUEST_RESEND
    case 'ACCEPT_WITH_PO_CHANGE':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_PO_CHANGE
    case 'REJECT_EXCESS':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_EXCESS
    case 'TEMP_HOLD':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_HOLD
    case 'REJECT_DAMAGED':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_DAMAGED
    case 'RECEIVE_WITH_RESTRICTION':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RECEIVE_WITH_RESTRICTION
    case 'CLAIM':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLAIM
    case 'REJECT_WRONG_ITEM':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_WRONG_ITEM
    case 'TEMP_RECEIVE_PENDING_DECISION':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_RECEIVE_PENDING_DECISION
    case 'ACCEPT_WITH_CONTROLLED_CHANGE':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_CONTROLLED_CHANGE
    case 'WAIT_INSPECTION':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_INSPECTION
    case 'ACCEPT_WITH_ALLOWANCE':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_ALLOWANCE
    case 'RETURN_TO_SUPPLIER':
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RETURN_TO_SUPPLIER
    default:
      return ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_REDELIVERY
  }
}

function fromGrpcPurchaseRequestType(
  value?: PurchaseRequestType | string
): PurchaseRequestTypeValue | string {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case PurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED:
      return 'SALES_DEDICATED'
    case PurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING:
      return 'PRODUCTION_PACKAGING'
    case PurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE:
      return 'MAINTENANCE'
    case PurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE:
      return 'SAMPLE'
    default:
      return 'DEPARTMENTAL'
  }
}

function fromGrpcPurchaseRequestStatus(
  value?: PurchaseRequestStatus | string
): PurchaseRequestStatusValue | string {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_SUBMITTED:
      return 'SUBMITTED'
    case PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_APPROVED:
      return 'APPROVED'
    case PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_PARTIALLY_CONVERTED:
      return 'PARTIALLY_CONVERTED'
    case PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CONVERTED:
      return 'CONVERTED'
    case PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_REJECTED:
      return 'REJECTED'
    case PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CANCELLED:
      return 'CANCELLED'
    default:
      return 'DRAFT'
  }
}

function fromGrpcPurchaseRequestDecision(
  value?: PurchaseRequestDecision | string
): PurchaseRequestDecisionValue | string {
  if (typeof value === 'string') {
    return value
  }
  return value === PurchaseRequestDecision.PURCHASE_REQUEST_DECISION_REJECTED
    ? 'REJECTED'
    : 'APPROVED'
}

function fromGrpcPurchaseRequestLineType(
  value?: PurchaseRequestLineType | string
): PurchaseRequestLineTypeValue | string {
  if (typeof value === 'string') {
    return value
  }
  return value === PurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT
    ? 'TEXT'
    : 'STANDARD_ITEM'
}

function fromGrpcPurchaseOrderStatus(
  value?: PurchaseOrderStatus | string
): PurchaseOrderStatusValue | string {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED:
      return 'ISSUED'
    case PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ACKNOWLEDGED:
      return 'ACKNOWLEDGED'
    case PurchaseOrderStatus.PURCHASE_ORDER_STATUS_CANCELLED:
      return 'CANCELLED'
    default:
      return 'DRAFT'
  }
}

function fromGrpcPurchaseOrderAllocationType(
  value?: PurchaseOrderLineAllocationType | string
): PurchaseOrderAllocationTypeValue | string {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_PURCHASE_REQUEST_LINE:
      return 'PURCHASE_REQUEST_LINE'
    case PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_SALES_ORDER_LINE:
      return 'SALES_ORDER_LINE'
    case PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_FULFILLMENT_DEMAND:
      return 'FULFILLMENT_DEMAND'
    default:
      return 'GENERAL_STOCK'
  }
}

function fromGrpcSupplierAcknowledgementStatus(
  value?: PurchaseOrderSupplierAcknowledgementStatus | string
): SupplierAcknowledgementStatusValue | string {
  if (typeof value === 'string') {
    return value
  }
  return value ===
    PurchaseOrderSupplierAcknowledgementStatus.PURCHASE_ORDER_SUPPLIER_ACKNOWLEDGEMENT_STATUS_ACKNOWLEDGED
    ? 'ACKNOWLEDGED'
    : 'PENDING'
}

function fromGrpcPurchaseOrderChangeStatus(
  value?: PurchaseOrderChangeStatus | string
): PurchaseOrderChangeStatusValue | string {
  if (typeof value === 'string') {
    return value
  }
  return 'APPLIED'
}

function fromGrpcReceivingExpectationStatus(
  value?: ReceivingExpectationStatus | string
): ReceivingExpectationStatusValue | string {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED:
      return 'PARTIALLY_RECEIVED'
    case ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_COMPLETED:
      return 'COMPLETED'
    case ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_CANCELLED:
      return 'CANCELLED'
    default:
      return 'OPEN'
  }
}

function fromGrpcReceivingDiscrepancyType(
  value?: ReceivingDiscrepancyType | string
): ReceivingDiscrepancyTypeValue | string {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_OVER_RECEIVED:
      return 'OVER_RECEIVED'
    case ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_DAMAGED:
      return 'DAMAGED'
    case ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_WRONG_ITEM:
      return 'WRONG_ITEM'
    case ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_QUALITY_HOLD:
      return 'QUALITY_HOLD'
    default:
      return 'SHORT_RECEIVED'
  }
}

function fromGrpcReceivingDiscrepancyStatus(
  value?: ReceivingDiscrepancyStatus | string
): ReceivingDiscrepancyStatusValue | string {
  if (typeof value === 'string') {
    return value
  }
  return value === ReceivingDiscrepancyStatus.RECEIVING_DISCREPANCY_STATUS_RESOLVED
    ? 'RESOLVED'
    : 'OPEN'
}

function fromGrpcReceivingResolutionCode(
  value?: ReceivingResolutionCode | string
): ReceivingResolutionCodeValue | string {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLOSE_UNRECEIVED:
      return 'CLOSE_UNRECEIVED'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REQUEST_RESEND:
      return 'REQUEST_RESEND'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_PO_CHANGE:
      return 'ACCEPT_WITH_PO_CHANGE'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_EXCESS:
      return 'REJECT_EXCESS'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_HOLD:
      return 'TEMP_HOLD'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_DAMAGED:
      return 'REJECT_DAMAGED'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RECEIVE_WITH_RESTRICTION:
      return 'RECEIVE_WITH_RESTRICTION'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLAIM:
      return 'CLAIM'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_WRONG_ITEM:
      return 'REJECT_WRONG_ITEM'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_RECEIVE_PENDING_DECISION:
      return 'TEMP_RECEIVE_PENDING_DECISION'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_CONTROLLED_CHANGE:
      return 'ACCEPT_WITH_CONTROLLED_CHANGE'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_INSPECTION:
      return 'WAIT_INSPECTION'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_ALLOWANCE:
      return 'ACCEPT_WITH_ALLOWANCE'
    case ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RETURN_TO_SUPPLIER:
      return 'RETURN_TO_SUPPLIER'
    default:
      return 'WAIT_REDELIVERY'
  }
}

function fromGrpcPurchaseRequestLineConversionStatus(
  value?: PurchaseRequestLineConversionStatus | string
) {
  if (typeof value === 'string') {
    return value
  }
  switch (value) {
    case PurchaseRequestLineConversionStatus.PURCHASE_REQUEST_LINE_CONVERSION_STATUS_PARTIALLY_CONVERTED:
      return 'PARTIALLY_CONVERTED'
    case PurchaseRequestLineConversionStatus.PURCHASE_REQUEST_LINE_CONVERSION_STATUS_CONVERTED:
      return 'CONVERTED'
    default:
      return 'NOT_CONVERTED'
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeStringArray(values?: string[]): string[] | undefined {
  const normalized = (values ?? []).map((value) => value?.trim()).filter(Boolean) as string[]
  return normalized.length > 0 ? normalized : undefined
}

function requireNonBlank(value: string | undefined, field: string): string {
  const normalized = normalize(value)
  if (!normalized) {
    throw new Error(`${field} is required`)
  }
  return normalized
}
