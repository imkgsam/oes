"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaProcurementRecordMapper = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const procurement_records_1 = require("../../../domain/models/procurement-records");
const purchaseRequestInclude = {
    lines: {
        orderBy: {
            lineNo: 'asc'
        }
    },
    approvalSnapshot: true
};
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
};
const receivingExpectationInclude = {
    discrepancy: true
};
/** PrismaProcurementRecordMapper translates Prisma procurement rows into the frozen phase 1 aggregate shapes. */
class PrismaProcurementRecordMapper {
    /** purchaseRequestIncludeValue exposes the canonical include graph for PR aggregate round-trips. */
    static purchaseRequestIncludeValue() {
        return purchaseRequestInclude;
    }
    /** purchaseOrderIncludeValue exposes the canonical include graph for PO aggregate round-trips. */
    static purchaseOrderIncludeValue() {
        return purchaseOrderInclude;
    }
    /** receivingExpectationIncludeValue exposes the canonical include graph for receiving aggregate round-trips. */
    static receivingExpectationIncludeValue() {
        return receivingExpectationInclude;
    }
    /** toPurchaseRequest converts one persisted PR aggregate row into the domain record shape. */
    static toPurchaseRequest(row) {
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
        };
    }
    /** toPurchaseOrder converts one persisted PO aggregate row into the domain record shape. */
    static toPurchaseOrder(row) {
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
            sourcePurchaseRequestIds: this.fromJson(row.sourcePurchaseRequestIds),
            sourcePurchaseRequestNos: this.fromJson(row.sourcePurchaseRequestNos),
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
        };
    }
    /** toReceivingExpectation converts one persisted receiving aggregate row into the domain record shape. */
    static toReceivingExpectation(row) {
        return {
            receivingExpectationId: row.id,
            tenantId: row.tenantId,
            orgId: row.orgId,
            purchaseOrderId: row.purchaseOrderId,
            purchaseOrderLineId: row.purchaseOrderLineId,
            supplierId: row.supplierId,
            expectedQuantity: row.expectedQuantity,
            receivedQuantitySummary: row.receivedQuantitySummary,
            openQuantity: row.openQuantity,
            expectedReceiptDate: row.expectedReceiptDate,
            status: this.toDomainReceivingExpectationStatus(row.status),
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            discrepancy: row.discrepancy ? this.toReceivingDiscrepancy(row.discrepancy) : null
        };
    }
    /** toInputJson deep-clones one plain procurement payload into a Prisma JSON input payload. */
    static toInputJson(value) {
        return structuredClone(value);
    }
    /** toPersistedPurchaseRequestType converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestType(value) {
        return value;
    }
    /** toPersistedPurchaseRequestStatus converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestStatus(value) {
        return value;
    }
    /** toPersistedPurchaseRequestLineType converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestLineType(value) {
        return value;
    }
    /** toPersistedPurchaseRequestDecision converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestDecision(value) {
        return value;
    }
    /** toPersistedPurchaseOrderStatus converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseOrderStatus(value) {
        return value;
    }
    /** toPersistedPurchaseOrderAllocationType converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseOrderAllocationType(value) {
        return value;
    }
    /** toPersistedSupplierAcknowledgementStatus converts the domain enum into the Prisma enum value. */
    static toPersistedSupplierAcknowledgementStatus(value) {
        return value;
    }
    /** toPersistedPurchaseOrderChangeStatus converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseOrderChangeStatus(value) {
        return prisma_1.ProcurementPurchaseOrderChangeStatus.APPLIED;
    }
    /** toPersistedReceivingExpectationStatus converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingExpectationStatus(value) {
        return value;
    }
    /** toPersistedReceivingDiscrepancyType converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingDiscrepancyType(value) {
        return value;
    }
    /** toPersistedReceivingDiscrepancyStatus converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingDiscrepancyStatus(value) {
        return value;
    }
    /** toPersistedReceivingResolutionCode converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingResolutionCode(value) {
        return value ? value : null;
    }
    /** fromJson casts one stored JSON payload back into the snapshot shape used by procurement records. */
    static fromJson(value) {
        return structuredClone(value);
    }
    static toPurchaseRequestLine(row) {
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
            demandReferenceId: row.demandReferenceId
        };
    }
    static toPurchaseOrderLine(row) {
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
        };
    }
    static toPurchaseOrderLineAllocation(row) {
        return {
            purchaseOrderLineAllocationId: row.id,
            allocationType: this.toDomainPurchaseOrderAllocationType(row.allocationType),
            referenceId: row.referenceId,
            quantity: row.quantity,
            reason: row.reason
        };
    }
    static toPurchaseOrderChange(row) {
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
            status: procurement_records_1.PurchaseOrderChangeStatus.APPLIED
        };
    }
    static toReceivingDiscrepancy(row) {
        return {
            receivingDiscrepancyId: row.id,
            discrepancyType: this.toDomainReceivingDiscrepancyType(row.discrepancyType),
            summary: row.summary,
            status: this.toDomainReceivingDiscrepancyStatus(row.status),
            resolutionCode: row.resolutionCode ? this.toDomainReceivingResolutionCode(row.resolutionCode) : null,
            resolutionNote: row.resolutionNote,
            resolvedAt: row.resolvedAt?.toISOString() ?? null
        };
    }
    static toDomainPurchaseRequestType(value) {
        return value;
    }
    static toDomainPurchaseRequestStatus(value) {
        return value;
    }
    static toDomainPurchaseRequestLineType(value) {
        return value;
    }
    static toDomainPurchaseRequestDecision(value) {
        return value;
    }
    static toDomainPurchaseOrderStatus(value) {
        return value;
    }
    static toDomainPurchaseOrderAllocationType(value) {
        return value;
    }
    static toDomainSupplierAcknowledgementStatus(value) {
        return value;
    }
    static toDomainReceivingExpectationStatus(value) {
        return value;
    }
    static toDomainReceivingDiscrepancyType(value) {
        return value;
    }
    static toDomainReceivingDiscrepancyStatus(value) {
        return value;
    }
    static toDomainReceivingResolutionCode(value) {
        return value;
    }
}
exports.PrismaProcurementRecordMapper = PrismaProcurementRecordMapper;
//# sourceMappingURL=prisma-procurement-record.mapper.js.map