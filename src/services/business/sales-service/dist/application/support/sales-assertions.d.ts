import { SalesAuditContext, SalesOperatorContext, SalesTraceContext } from '../../domain/models/sales-records';
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export declare function assertRequiredString(value: string, field: string): void;
/** normalizePageInput applies the shared 1-based paging default used by the frozen phase 1 query surface. */
export declare function normalizePageInput(page?: number, pageSize?: number): {
    page: number;
    pageSize: number;
};
/** assertOperatorContext enforces the explicit command and query operator context contract frozen for sales-service. */
export declare function assertOperatorContext(value?: SalesOperatorContext | null): SalesOperatorContext;
/** assertTraceContext enforces the explicit trace context contract frozen for sales-service. */
export declare function assertTraceContext(value?: SalesTraceContext | null): SalesTraceContext;
/** assertAuditContext enforces the explicit audit context contract required by every management command. */
export declare function assertAuditContext(value?: SalesAuditContext | null): SalesAuditContext;
/** paginate slices a fully filtered record list into the standard phase 1 page envelope. */
export declare function paginate<T>(items: T[], page: number, pageSize: number): {
    pageItems: T[];
    total: number;
};
