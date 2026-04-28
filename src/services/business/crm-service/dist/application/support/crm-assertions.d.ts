import { CrmAuditContext, CrmOperatorContext, CrmTraceContext, CustomerStatus } from '../../domain/models/crm-records';
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export declare function assertRequiredString(value: string, field: string): void;
/** normalizeOptionalString collapses empty strings into undefined so controllers can map gRPC defaults safely. */
export declare function normalizeOptionalString(value?: string | null): string | undefined;
/** normalizeTags trims, de-duplicates, and preserves the incoming CRM business-tag order. */
export declare function normalizeTags(tags?: string[] | null): string[];
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
/** assertOperatorContext enforces the explicit command and query operator context contract frozen for crm-service. */
export declare function assertOperatorContext(value?: CrmOperatorContext | null): CrmOperatorContext;
/** assertTraceContext enforces the explicit trace context contract frozen for crm-service. */
export declare function assertTraceContext(value?: CrmTraceContext | null): CrmTraceContext;
/** assertAuditContext enforces the explicit audit context contract required by every CRM management command. */
export declare function assertAuditContext(value?: CrmAuditContext | null): CrmAuditContext;
/** assertKnownCustomerStatus rejects unsupported enum values outside the frozen phase 1 CRM status set. */
export declare function assertKnownCustomerStatus(status: CustomerStatus): CustomerStatus;
