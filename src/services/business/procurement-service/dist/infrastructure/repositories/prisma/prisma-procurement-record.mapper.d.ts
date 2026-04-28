import { Prisma, ProcurementPurchaseOrderChangeStatus as PrismaPurchaseOrderChangeStatus, ProcurementPurchaseOrderLineAllocationType as PrismaPurchaseOrderLineAllocationType, ProcurementPurchaseOrderStatus as PrismaPurchaseOrderStatus, ProcurementPurchaseRequestDecision as PrismaPurchaseRequestDecision, ProcurementPurchaseRequestLineType as PrismaPurchaseRequestLineType, ProcurementPurchaseRequestStatus as PrismaPurchaseRequestStatus, ProcurementPurchaseRequestType as PrismaPurchaseRequestType, ProcurementReceivingDiscrepancyStatus as PrismaReceivingDiscrepancyStatus, ProcurementReceivingDiscrepancyType as PrismaReceivingDiscrepancyType, ProcurementReceivingExpectationStatus as PrismaReceivingExpectationStatus, ProcurementReceivingResolutionCode as PrismaReceivingResolutionCode, ProcurementSupplierAcknowledgementStatus as PrismaSupplierAcknowledgementStatus } from '../../../../prisma/generated/prisma';
import { PurchaseOrderChangeStatus, PurchaseOrderLineAllocationType, PurchaseOrderRecord, PurchaseOrderStatus, PurchaseOrderSupplierAcknowledgementStatus, PurchaseRequestDecision, PurchaseRequestLineType, PurchaseRequestRecord, PurchaseRequestStatus, PurchaseRequestType, ReceivingDiscrepancyStatus, ReceivingDiscrepancyType, ReceivingExpectationRecord, ReceivingExpectationStatus, ReceivingResolutionCode } from '../../../domain/models/procurement-records';
declare const purchaseRequestInclude: {
    lines: {
        orderBy: {
            lineNo: "asc";
        };
    };
    approvalSnapshot: true;
};
declare const purchaseOrderInclude: {
    lines: {
        orderBy: {
            lineNo: "asc";
        };
        include: {
            allocations: true;
        };
    };
    changes: {
        orderBy: {
            appliedAt: "asc";
        };
    };
};
declare const receivingExpectationInclude: {
    discrepancy: true;
};
export type PurchaseRequestAggregateRow = Prisma.PurchaseRequestGetPayload<{
    include: typeof purchaseRequestInclude;
}>;
export type PurchaseOrderAggregateRow = Prisma.PurchaseOrderGetPayload<{
    include: typeof purchaseOrderInclude;
}>;
export type ReceivingExpectationAggregateRow = Prisma.ReceivingExpectationGetPayload<{
    include: typeof receivingExpectationInclude;
}>;
/** PrismaProcurementRecordMapper translates Prisma procurement rows into the frozen phase 1 aggregate shapes. */
export declare class PrismaProcurementRecordMapper {
    /** purchaseRequestIncludeValue exposes the canonical include graph for PR aggregate round-trips. */
    static purchaseRequestIncludeValue(): typeof purchaseRequestInclude;
    /** purchaseOrderIncludeValue exposes the canonical include graph for PO aggregate round-trips. */
    static purchaseOrderIncludeValue(): typeof purchaseOrderInclude;
    /** receivingExpectationIncludeValue exposes the canonical include graph for receiving aggregate round-trips. */
    static receivingExpectationIncludeValue(): typeof receivingExpectationInclude;
    /** toPurchaseRequest converts one persisted PR aggregate row into the domain record shape. */
    static toPurchaseRequest(row: PurchaseRequestAggregateRow): PurchaseRequestRecord;
    /** toPurchaseOrder converts one persisted PO aggregate row into the domain record shape. */
    static toPurchaseOrder(row: PurchaseOrderAggregateRow): PurchaseOrderRecord;
    /** toReceivingExpectation converts one persisted receiving aggregate row into the domain record shape. */
    static toReceivingExpectation(row: ReceivingExpectationAggregateRow): ReceivingExpectationRecord;
    /** toInputJson deep-clones one plain procurement payload into a Prisma JSON input payload. */
    static toInputJson(value: unknown): Prisma.InputJsonValue;
    /** toPersistedPurchaseRequestType converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestType(value: PurchaseRequestType): PrismaPurchaseRequestType;
    /** toPersistedPurchaseRequestStatus converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestStatus(value: PurchaseRequestStatus): PrismaPurchaseRequestStatus;
    /** toPersistedPurchaseRequestLineType converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestLineType(value: PurchaseRequestLineType): PrismaPurchaseRequestLineType;
    /** toPersistedPurchaseRequestDecision converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseRequestDecision(value: PurchaseRequestDecision): PrismaPurchaseRequestDecision;
    /** toPersistedPurchaseOrderStatus converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseOrderStatus(value: PurchaseOrderStatus): PrismaPurchaseOrderStatus;
    /** toPersistedPurchaseOrderAllocationType converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseOrderAllocationType(value: PurchaseOrderLineAllocationType): PrismaPurchaseOrderLineAllocationType;
    /** toPersistedSupplierAcknowledgementStatus converts the domain enum into the Prisma enum value. */
    static toPersistedSupplierAcknowledgementStatus(value: PurchaseOrderSupplierAcknowledgementStatus): PrismaSupplierAcknowledgementStatus;
    /** toPersistedPurchaseOrderChangeStatus converts the domain enum into the Prisma enum value. */
    static toPersistedPurchaseOrderChangeStatus(value: PurchaseOrderChangeStatus | 'APPLIED'): PrismaPurchaseOrderChangeStatus;
    /** toPersistedReceivingExpectationStatus converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingExpectationStatus(value: ReceivingExpectationStatus): PrismaReceivingExpectationStatus;
    /** toPersistedReceivingDiscrepancyType converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingDiscrepancyType(value: ReceivingDiscrepancyType): PrismaReceivingDiscrepancyType;
    /** toPersistedReceivingDiscrepancyStatus converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingDiscrepancyStatus(value: ReceivingDiscrepancyStatus): PrismaReceivingDiscrepancyStatus;
    /** toPersistedReceivingResolutionCode converts the domain enum into the Prisma enum value. */
    static toPersistedReceivingResolutionCode(value: ReceivingResolutionCode | null | undefined): PrismaReceivingResolutionCode | null;
    /** fromJson casts one stored JSON payload back into the snapshot shape used by procurement records. */
    static fromJson<T>(value: Prisma.JsonValue): T;
    private static toPurchaseRequestLine;
    private static toPurchaseOrderLine;
    private static toPurchaseOrderLineAllocation;
    private static toPurchaseOrderChange;
    private static toReceivingDiscrepancy;
    private static toDomainPurchaseRequestType;
    private static toDomainPurchaseRequestStatus;
    private static toDomainPurchaseRequestLineType;
    private static toDomainPurchaseRequestDecision;
    private static toDomainPurchaseOrderStatus;
    private static toDomainPurchaseOrderAllocationType;
    private static toDomainSupplierAcknowledgementStatus;
    private static toDomainReceivingExpectationStatus;
    private static toDomainReceivingDiscrepancyType;
    private static toDomainReceivingDiscrepancyStatus;
    private static toDomainReceivingResolutionCode;
}
export {};
