import {
  Prisma,
  ProcurementPurchaseOrderChangeStatus as PrismaPurchaseOrderChangeStatus,
  ProcurementPurchaseOrderLineAllocationType as PrismaPurchaseOrderLineAllocationType,
  ProcurementPurchaseOrderStatus as PrismaPurchaseOrderStatus,
  ProcurementPurchaseRequestDecision as PrismaPurchaseRequestDecision,
  ProcurementPurchaseRequestLineConversionStatus as PrismaPurchaseRequestLineConversionStatus,
  ProcurementPurchaseRequestLineType as PrismaPurchaseRequestLineType,
  ProcurementPurchaseRequestStatus as PrismaPurchaseRequestStatus,
  ProcurementPurchaseRequestType as PrismaPurchaseRequestType,
  ProcurementReceivingDiscrepancyStatus as PrismaReceivingDiscrepancyStatus,
  ProcurementReceivingDiscrepancyType as PrismaReceivingDiscrepancyType,
  ProcurementReceivingExpectationStatus as PrismaReceivingExpectationStatus,
  ProcurementReceivingResolutionCode as PrismaReceivingResolutionCode,
  ProcurementSupplierAcknowledgementStatus as PrismaSupplierAcknowledgementStatus
} from '../../../../prisma/generated/prisma'
import {
  PurchaseOrderChangeRecord,
  PurchaseOrderChangeStatus,
  PurchaseOrderLineAllocationRecord,
  PurchaseOrderLineAllocationType,
  PurchaseOrderLineRecord,
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseOrderSupplierAcknowledgementStatus,
  PurchaseRequestDecision,
  PurchaseRequestLineRecord,
  PurchaseRequestLineConversionStatus,
  PurchaseRequestLineType,
  PurchaseRequestRecord,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReceivingDiscrepancyRecord,
  ReceivingDiscrepancyStatus,
  ReceivingDiscrepancyType,
  ReceivingExpectationRecord,
  ReceivingExpectationStatus,
  ReceivingResolutionCode
} from '../../../domain/models/procurement-records'

const purchaseRequestInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    }
  },
  approvalSnapshot: true
} satisfies Prisma.PurchaseRequestInclude

const purchaseOrderInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    },
    include: {
      allocations: true
    }
  },
  changes: {
    orderBy: {
      appliedAt: 'asc'
    }
  }
} satisfies Prisma.PurchaseOrderInclude

const receivingExpectationInclude = {
  discrepancy: true
} satisfies Prisma.ReceivingExpectationInclude

export type PurchaseRequestAggregateRow = Prisma.PurchaseRequestGetPayload<{
  include: typeof purchaseRequestInclude
}>

export type PurchaseOrderAggregateRow = Prisma.PurchaseOrderGetPayload<{
  include: typeof purchaseOrderInclude
}>

export type ReceivingExpectationAggregateRow = Prisma.ReceivingExpectationGetPayload<{
  include: typeof receivingExpectationInclude
}>

/** PrismaProcurementRecordMapper translates Prisma procurement rows into the frozen phase 1 aggregate shapes. */
export class PrismaProcurementRecordMapper {
  /** purchaseRequestIncludeValue exposes the canonical include graph for PR aggregate round-trips. */
  static purchaseRequestIncludeValue(): typeof purchaseRequestInclude {
    return purchaseRequestInclude
  }

  /** purchaseOrderIncludeValue exposes the canonical include graph for PO aggregate round-trips. */
  static purchaseOrderIncludeValue(): typeof purchaseOrderInclude {
    return purchaseOrderInclude
  }

  /** receivingExpectationIncludeValue exposes the canonical include graph for receiving aggregate round-trips. */
  static receivingExpectationIncludeValue(): typeof receivingExpectationInclude {
    return receivingExpectationInclude
  }

  /** toPurchaseRequest converts one persisted PR aggregate row into the domain record shape. */
  static toPurchaseRequest(row: PurchaseRequestAggregateRow): PurchaseRequestRecord {
    return {
      purchaseRequestId: row.id,
      requestNo: row.requestNo,
      tenantId: row.tenantId,
      orgId: row.orgId,
      requestType: this.toDomainPurchaseRequestType(row.requestType),
      status: this.toDomainPurchaseRequestStatus(row.status),
      requester: {
        operatorId: row.requesterOperatorId,
        displayName: row.requesterDisplayName
      },
      title: row.title,
      reason: row.reason,
      submissionComment: row.submissionComment,
      cancelReason: row.cancelReason,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      submittedAt: row.submittedAt?.toISOString() ?? null,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      linkedPurchaseOrders: this.fromJson(row.linkedPurchaseOrders),
      nextExpectedReceiptDate: row.nextExpectedReceiptDate,
      receivingStatusSummary: row.receivingStatusSummary,
      approvalSnapshot: row.approvalSnapshot
        ? {
            purchaseRequestApprovalSnapshotId: row.approvalSnapshot.id,
            decision: this.toDomainPurchaseRequestDecision(row.approvalSnapshot.decision),
            decidedBy: {
              operatorId: row.approvalSnapshot.decidedByOperatorId,
              displayName: row.approvalSnapshot.decidedByDisplayName
            },
            decidedAt: row.approvalSnapshot.decidedAt.toISOString(),
            comment: row.approvalSnapshot.comment,
            approvalReference: row.approvalSnapshot.approvalReference
          }
        : null,
      lines: row.lines.map((line) => this.toPurchaseRequestLine(line))
    }
  }

  /** toPurchaseOrder converts one persisted PO aggregate row into the domain record shape. */
  static toPurchaseOrder(row: PurchaseOrderAggregateRow): PurchaseOrderRecord {
    return {
      purchaseOrderId: row.id,
      orderNo: row.orderNo,
      tenantId: row.tenantId,
      orgId: row.orgId,
      status: this.toDomainPurchaseOrderStatus(row.status),
      currencyCode: row.currencyCode,
      supplierId: row.supplierId,
      supplierSnapshot: {
        supplierId: row.supplierId,
        supplierDisplayName: row.supplierDisplayName,
        supplierStatusAtIssue: row.supplierStatusAtIssue
      },
      paymentTermsSnapshot:
        row.paymentTermsCode || row.paymentTermsText
          ? {
              paymentTermsCode: row.paymentTermsCode,
              paymentTermsText: row.paymentTermsText
            }
          : null,
      supplierCommercialTermsSnapshot:
        row.incotermCode || row.commercialTermsText
          ? {
              incotermCode: row.incotermCode,
              commercialTermsText: row.commercialTermsText
            }
          : null,
      paymentSummary:
        row.paymentStatusSummary && row.paymentSummaryCurrencyCode
          ? {
              paymentStatusSummary: row.paymentStatusSummary,
              depositPaidAmount: row.depositPaidAmount,
              balancePaidAmount: row.balancePaidAmount,
              currencyCode: row.paymentSummaryCurrencyCode,
              attachmentRefs: this.fromJson<string[]>(row.attachmentRefs),
              lastPaymentAt: row.lastPaymentAt?.toISOString() ?? null
            }
          : null,
      sourcePurchaseRequestIds: this.fromJson<string[]>(row.sourcePurchaseRequestIds),
      sourcePurchaseRequestNos: this.fromJson<string[]>(row.sourcePurchaseRequestNos),
      supplierAcknowledgement: {
        acknowledgementStatus: this.toDomainSupplierAcknowledgementStatus(row.acknowledgementStatus),
        acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
        externalReference: row.acknowledgementExternalReference,
        comment: row.acknowledgementComment
      },
      issueComment: row.issueComment,
      cancelReason: row.cancelReason,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      issuedAt: row.issuedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      lines: row.lines.map((line) => this.toPurchaseOrderLine(line)),
      changes: row.changes.map((change) => this.toPurchaseOrderChange(change))
    }
  }

  /** toReceivingExpectation converts one persisted receiving aggregate row into the domain record shape. */
  static toReceivingExpectation(row: ReceivingExpectationAggregateRow): ReceivingExpectationRecord {
    return {
      receivingExpectationId: row.id,
      tenantId: row.tenantId,
      orgId: row.orgId,
      purchaseOrderId: row.purchaseOrderId,
      purchaseOrderLineId: row.purchaseOrderLineId,
      supplierId: row.supplierId,
      allocationGroupingKey: row.allocationGroupingKey,
      sourceAllocationIds: this.fromJson<string[]>(row.sourceAllocationIds),
      targetWarehouseId: row.targetWarehouseId,
      targetReceivingAddressId: row.targetReceivingAddressId,
      expectedQuantity: row.expectedQuantity,
      receivedQuantitySummary: row.receivedQuantitySummary,
      openQuantity: row.openQuantity,
      expectedReceiptDate: row.expectedReceiptDate,
      status: this.toDomainReceivingExpectationStatus(row.status),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      discrepancy: row.discrepancy ? this.toReceivingDiscrepancy(row.discrepancy) : null
    }
  }

  /** toInputJson deep-clones one plain procurement payload into a Prisma JSON input payload. */
  static toInputJson(value: unknown): Prisma.InputJsonValue {
    return structuredClone(value) as Prisma.InputJsonValue
  }

  /** toPersistedPurchaseRequestType converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseRequestType(value: PurchaseRequestType): PrismaPurchaseRequestType {
    return value as unknown as PrismaPurchaseRequestType
  }

  /** toPersistedPurchaseRequestStatus converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseRequestStatus(value: PurchaseRequestStatus): PrismaPurchaseRequestStatus {
    return value as unknown as PrismaPurchaseRequestStatus
  }

  /** toPersistedPurchaseRequestLineType converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseRequestLineType(value: PurchaseRequestLineType): PrismaPurchaseRequestLineType {
    return value as unknown as PrismaPurchaseRequestLineType
  }

  /** toPersistedPurchaseRequestLineConversionStatus converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseRequestLineConversionStatus(
    value: PurchaseRequestLineConversionStatus
  ): PrismaPurchaseRequestLineConversionStatus {
    return value as unknown as PrismaPurchaseRequestLineConversionStatus
  }

  /** toPersistedPurchaseRequestDecision converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseRequestDecision(value: PurchaseRequestDecision): PrismaPurchaseRequestDecision {
    return value as unknown as PrismaPurchaseRequestDecision
  }

  /** toPersistedPurchaseOrderStatus converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseOrderStatus(value: PurchaseOrderStatus): PrismaPurchaseOrderStatus {
    return value as unknown as PrismaPurchaseOrderStatus
  }

  /** toPersistedPurchaseOrderAllocationType converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseOrderAllocationType(
    value: PurchaseOrderLineAllocationType
  ): PrismaPurchaseOrderLineAllocationType {
    return value as unknown as PrismaPurchaseOrderLineAllocationType
  }

  /** toPersistedSupplierAcknowledgementStatus converts the domain enum into the Prisma enum value. */
  static toPersistedSupplierAcknowledgementStatus(
    value: PurchaseOrderSupplierAcknowledgementStatus
  ): PrismaSupplierAcknowledgementStatus {
    return value as unknown as PrismaSupplierAcknowledgementStatus
  }

  /** toPersistedPurchaseOrderChangeStatus converts the domain enum into the Prisma enum value. */
  static toPersistedPurchaseOrderChangeStatus(
    value: PurchaseOrderChangeStatus | 'APPLIED'
  ): PrismaPurchaseOrderChangeStatus {
    return PrismaPurchaseOrderChangeStatus.APPLIED
  }

  /** toPersistedReceivingExpectationStatus converts the domain enum into the Prisma enum value. */
  static toPersistedReceivingExpectationStatus(
    value: ReceivingExpectationStatus
  ): PrismaReceivingExpectationStatus {
    return value as unknown as PrismaReceivingExpectationStatus
  }

  /** toPersistedReceivingDiscrepancyType converts the domain enum into the Prisma enum value. */
  static toPersistedReceivingDiscrepancyType(
    value: ReceivingDiscrepancyType
  ): PrismaReceivingDiscrepancyType {
    return value as unknown as PrismaReceivingDiscrepancyType
  }

  /** toPersistedReceivingDiscrepancyStatus converts the domain enum into the Prisma enum value. */
  static toPersistedReceivingDiscrepancyStatus(
    value: ReceivingDiscrepancyStatus
  ): PrismaReceivingDiscrepancyStatus {
    return value as unknown as PrismaReceivingDiscrepancyStatus
  }

  /** toPersistedReceivingResolutionCode converts the domain enum into the Prisma enum value. */
  static toPersistedReceivingResolutionCode(
    value: ReceivingResolutionCode | null | undefined
  ): PrismaReceivingResolutionCode | null {
    return value ? (value as unknown as PrismaReceivingResolutionCode) : null
  }

  /** fromJson casts one stored JSON payload back into the snapshot shape used by procurement records. */
  static fromJson<T>(value: Prisma.JsonValue): T {
    return structuredClone(value) as T
  }

  private static toPurchaseRequestLine(row: PurchaseRequestAggregateRow['lines'][number]): PurchaseRequestLineRecord {
    return {
      purchaseRequestLineId: row.id,
      lineNo: row.lineNo,
      lineType: this.toDomainPurchaseRequestLineType(row.lineType),
      itemId: row.itemId,
      itemCode: row.itemCode,
      itemName: row.itemName,
      description: row.description,
      requestedQuantity: row.requestedQuantity,
      uom: row.uom,
      neededByDate: row.neededByDate,
      demandReferenceType: row.demandReferenceType,
      demandReferenceId: row.demandReferenceId,
      conversionStatus: this.toDomainPurchaseRequestLineConversionStatus(row.conversionStatus),
      linkedPurchaseOrderLines: this.fromJson(row.linkedPurchaseOrderLines)
    }
  }

  private static toPurchaseOrderLine(row: PurchaseOrderAggregateRow['lines'][number]): PurchaseOrderLineRecord {
    return {
      purchaseOrderLineId: row.id,
      lineNo: row.lineNo,
      lineType: this.toDomainPurchaseRequestLineType(row.lineType),
      itemId: row.itemId,
      itemCode: row.itemCode,
      itemName: row.itemName,
      description: row.description,
      supplierOfferingId: row.supplierOfferingId,
      orderedQuantity: row.orderedQuantity,
      uom: row.uom,
      orderedUnitPrice: row.orderedUnitPrice,
      sourcePurchaseRequestLineId: row.sourcePurchaseRequestLineId,
      sourceRequestedQuantity: row.sourceRequestedQuantity,
      generalStockExcessReason: row.generalStockExcessReason,
      allocations: row.allocations.map((allocation) => this.toPurchaseOrderLineAllocation(allocation))
    }
  }

  private static toPurchaseOrderLineAllocation(
    row: PurchaseOrderAggregateRow['lines'][number]['allocations'][number]
  ): PurchaseOrderLineAllocationRecord {
    return {
      purchaseOrderLineAllocationId: row.id,
      allocationType: this.toDomainPurchaseOrderAllocationType(row.allocationType),
      sourceReferenceId: row.sourceReferenceId,
      quantity: row.quantity,
      reason: row.reason,
      targetWarehouseId: row.targetWarehouseId,
      targetReceivingAddressId: row.targetReceivingAddressId
    }
  }

  private static toPurchaseOrderChange(
    row: PurchaseOrderAggregateRow['changes'][number]
  ): PurchaseOrderChangeRecord {
    return {
      purchaseOrderChangeId: row.id,
      purchaseOrderId: row.purchaseOrderId,
      changeType: row.changeType,
      changeSummary: row.changeSummary,
      changeReason: row.changeReason,
      appliedBy: {
        operatorId: row.appliedByOperatorId,
        displayName: row.appliedByDisplayName
      },
      appliedAt: row.appliedAt.toISOString(),
      status: PurchaseOrderChangeStatus.APPLIED
    }
  }

  private static toReceivingDiscrepancy(
    row: NonNullable<ReceivingExpectationAggregateRow['discrepancy']>
  ): ReceivingDiscrepancyRecord {
    return {
      receivingDiscrepancyId: row.id,
      discrepancyType: this.toDomainReceivingDiscrepancyType(row.discrepancyType),
      summary: row.summary,
      status: this.toDomainReceivingDiscrepancyStatus(row.status),
      resolutionCode: row.resolutionCode ? this.toDomainReceivingResolutionCode(row.resolutionCode) : null,
      resolutionNote: row.resolutionNote,
      resolutionReferences: this.fromJson(row.resolutionReferences),
      resolvedAt: row.resolvedAt?.toISOString() ?? null
    }
  }

  private static toDomainPurchaseRequestType(value: PrismaPurchaseRequestType): PurchaseRequestType {
    return value as unknown as PurchaseRequestType
  }

  private static toDomainPurchaseRequestStatus(value: PrismaPurchaseRequestStatus): PurchaseRequestStatus {
    return value as unknown as PurchaseRequestStatus
  }

  private static toDomainPurchaseRequestLineType(value: PrismaPurchaseRequestLineType): PurchaseRequestLineType {
    return value as unknown as PurchaseRequestLineType
  }

  private static toDomainPurchaseRequestLineConversionStatus(
    value: PrismaPurchaseRequestLineConversionStatus
  ): PurchaseRequestLineConversionStatus {
    return value as unknown as PurchaseRequestLineConversionStatus
  }

  private static toDomainPurchaseRequestDecision(value: PrismaPurchaseRequestDecision): PurchaseRequestDecision {
    return value as unknown as PurchaseRequestDecision
  }

  private static toDomainPurchaseOrderStatus(value: PrismaPurchaseOrderStatus): PurchaseOrderStatus {
    return value as unknown as PurchaseOrderStatus
  }

  private static toDomainPurchaseOrderAllocationType(
    value: PrismaPurchaseOrderLineAllocationType
  ): PurchaseOrderLineAllocationType {
    return value as unknown as PurchaseOrderLineAllocationType
  }

  private static toDomainSupplierAcknowledgementStatus(
    value: PrismaSupplierAcknowledgementStatus
  ): PurchaseOrderSupplierAcknowledgementStatus {
    return value as unknown as PurchaseOrderSupplierAcknowledgementStatus
  }

  private static toDomainReceivingExpectationStatus(
    value: PrismaReceivingExpectationStatus
  ): ReceivingExpectationStatus {
    return value as unknown as ReceivingExpectationStatus
  }

  private static toDomainReceivingDiscrepancyType(
    value: PrismaReceivingDiscrepancyType
  ): ReceivingDiscrepancyType {
    return value as unknown as ReceivingDiscrepancyType
  }

  private static toDomainReceivingDiscrepancyStatus(
    value: PrismaReceivingDiscrepancyStatus
  ): ReceivingDiscrepancyStatus {
    return value as unknown as ReceivingDiscrepancyStatus
  }

  private static toDomainReceivingResolutionCode(
    value: PrismaReceivingResolutionCode
  ): ReceivingResolutionCode {
    return value as unknown as ReceivingResolutionCode
  }
}
