import { ProcurementAuditContext, ProcurementOperatorContext, ProcurementTraceContext, PurchaseOrderLineAllocationType, PurchaseRequestDecision, PurchaseRequestLineType, ReceivingResolutionCode } from '../../domain/models/procurement-records';
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export declare function assertRequiredString(value: string, field: string): void;
/** normalizeOptionalString collapses empty strings into undefined so controllers can map gRPC defaults safely. */
export declare function normalizeOptionalString(value?: string | null): string | undefined;
/** normalizePageInput applies the shared 1-based paging default used by the frozen phase 1 query surface. */
export declare function normalizePageInput(page?: number, pageSize?: number): {
    page: number;
    pageSize: number;
};
/** paginate slices a fully filtered record list into the standard phase 1 page envelope. */
export declare function paginate<T>(items: T[], page: number, pageSize: number): {
    pageItems: T[];
    total: number;
};
/** assertOperatorContext enforces the explicit command and query operator context contract frozen for procurement-service. */
export declare function assertOperatorContext(value?: ProcurementOperatorContext | null): ProcurementOperatorContext;
/** assertTraceContext enforces the explicit trace context contract frozen for procurement-service. */
export declare function assertTraceContext(value?: ProcurementTraceContext | null): ProcurementTraceContext;
/** assertAuditContext enforces the explicit audit context contract required by every procurement management command. */
export declare function assertAuditContext(value?: ProcurementAuditContext | null): ProcurementAuditContext;
/** assertKnownPurchaseRequestLineType rejects unsupported enum values outside the frozen PR line type set. */
export declare function assertKnownPurchaseRequestLineType(value: PurchaseRequestLineType): PurchaseRequestLineType;
/** assertKnownPurchaseRequestDecision rejects unsupported enum values outside the frozen PR decision set. */
export declare function assertKnownPurchaseRequestDecision(value: PurchaseRequestDecision): PurchaseRequestDecision;
/** assertKnownAllocationType rejects unsupported enum values outside the frozen PO allocation type set. */
export declare function assertKnownAllocationType(value: PurchaseOrderLineAllocationType): PurchaseOrderLineAllocationType;
/** assertKnownReceivingResolutionCode rejects unsupported discrepancy resolution codes outside the frozen set. */
export declare function assertKnownReceivingResolutionCode(value: ReceivingResolutionCode): ReceivingResolutionCode;
/** assertPositiveQuantity keeps frozen procurement quantity inputs away from zero and negative values. */
export declare function assertPositiveQuantity(value: string, field: string): string;
/** normalizeQuantity removes redundant leading and trailing zeros from one decimal-like scalar string. */
export declare function normalizeQuantity(value: string): string;
/** sumQuantities adds one group of quantity strings with minimal decimal-safe precision for current phase 1 tests. */
export declare function sumQuantities(values: string[]): string;
/** compareQuantity compares two normalized quantity strings using the current phase 1 decimal-safe rules. */
export declare function compareQuantity(left: string, right: string): number;
/** subtractQuantity subtracts right from left and returns the normalized non-negative result string. */
export declare function subtractQuantity(left: string, right: string): string;
/** inferAllocationType converts frozen PR demand-reference types into the supported allocation enum set. */
export declare function inferAllocationType(value?: string | null): PurchaseOrderLineAllocationType;
/** assertExists rejects missing aggregates or reference data with the frozen NOT_FOUND semantics. */
export declare function assertExists<T>(value: T | null | undefined, resource: string, identifier?: string): T;
/** assertPrecondition enforces frozen business gates without leaking local implementation detail. */
export declare function assertPrecondition(condition: unknown, reason: string, details?: Record<string, unknown>): void;
