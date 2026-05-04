import { InventoryStatus, ReceiptPhysicalDiscrepancyType, ReceiptSourceType, ReceiptTrackingRefType, RestrictedStatusReasonCode, WmsAuditContext, WmsOperatorContext, WmsTraceContext } from '../../domain/models/wms-records';
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export declare function assertRequiredString(value: string, field: string): void;
/** normalizeOptionalString collapses empty strings into undefined so controllers can map gRPC defaults safely. */
export declare function normalizeOptionalString(value?: string | null): string | undefined;
/** normalizePageInput applies the shared 1-based paging default used by the frozen WMS query surface. */
export declare function normalizePageInput(page?: number, pageSize?: number): {
    page: number;
    pageSize: number;
};
/** paginate slices a fully filtered record list into the standard phase 1 page envelope. */
export declare function paginate<T>(items: T[], page: number, pageSize: number): {
    pageItems: T[];
    total: number;
};
/** assertOperatorContext enforces the explicit query and command operator context contract frozen for WMS. */
export declare function assertOperatorContext(value?: WmsOperatorContext | null): WmsOperatorContext;
/** assertTraceContext enforces the explicit trace context contract frozen for WMS. */
export declare function assertTraceContext(value?: WmsTraceContext | null): WmsTraceContext;
/** assertAuditContext enforces the explicit audit context contract required by every WMS management command. */
export declare function assertAuditContext(value?: WmsAuditContext | null): WmsAuditContext;
/** assertKnownReceiptSourceType rejects unsupported enum values outside the frozen receipt source set. */
export declare function assertKnownReceiptSourceType(value: ReceiptSourceType): ReceiptSourceType;
/** assertKnownInventoryStatus rejects unsupported enum values outside the frozen inventory status set. */
export declare function assertKnownInventoryStatus(value: InventoryStatus): InventoryStatus;
/** assertKnownRestrictedReasonCode rejects unsupported enum values outside the frozen restricted reason set. */
export declare function assertKnownRestrictedReasonCode(value: RestrictedStatusReasonCode): RestrictedStatusReasonCode;
/** assertKnownTrackingRefType rejects unsupported tracking-ref enum values outside the frozen set. */
export declare function assertKnownTrackingRefType(value: ReceiptTrackingRefType): ReceiptTrackingRefType;
/** assertKnownPhysicalDiscrepancyType rejects unsupported physical discrepancy enum values outside the frozen set. */
export declare function assertKnownPhysicalDiscrepancyType(value: ReceiptPhysicalDiscrepancyType): ReceiptPhysicalDiscrepancyType;
/** assertPositiveQuantity keeps frozen WMS quantity inputs away from zero and negative values. */
export declare function assertPositiveQuantity(value: string, field: string): string;
/** normalizeQuantity removes redundant leading and trailing zeros from one decimal-like scalar string. */
export declare function normalizeQuantity(value: string): string;
/** sumQuantities adds one group of quantity strings with minimal decimal-safe precision for current phase 1 tests. */
export declare function sumQuantities(values: string[]): string;
/** compareQuantity compares two normalized quantity strings using the current phase 1 decimal-safe rules. */
export declare function compareQuantity(left: string, right: string): number;
/** assertExists rejects missing aggregates or reference data with the frozen NOT_FOUND semantics. */
export declare function assertExists<T>(value: T | null | undefined, resource: string, identifier?: string): T;
/** assertPrecondition enforces frozen business gates without leaking local implementation detail. */
export declare function assertPrecondition(condition: unknown, reason: string, details?: Record<string, unknown>): void;
/** assertDateRange ensures query date filters remain ordered in the frozen phase 1 surface. */
export declare function assertDateRange(from: string | undefined, to: string | undefined, field: string): void;
