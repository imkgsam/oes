import { PageResult, PurchaseOrderChangeRecord, PurchaseOrderRecord, SearchPurchaseOrdersInput } from '../models/procurement-records';
export interface ListPurchaseOrderChangesInput {
    tenantId: string;
    purchaseOrderId: string;
    page?: number;
    pageSize?: number;
}
/** PurchaseOrderRepository persists tenant-scoped PO aggregates, applied changes, and directory reads. */
export interface PurchaseOrderRepository {
    nextOrderNo(tenantId: string): Promise<string>;
    findById(tenantId: string, purchaseOrderId: string): Promise<PurchaseOrderRecord | null>;
    save(record: PurchaseOrderRecord): Promise<PurchaseOrderRecord>;
    search(input: SearchPurchaseOrdersInput): Promise<PageResult<PurchaseOrderRecord>>;
    listChanges(input: ListPurchaseOrderChangesInput): Promise<PageResult<PurchaseOrderChangeRecord>>;
    existsBySourcePurchaseRequestId(tenantId: string, purchaseRequestId: string): Promise<boolean>;
    findBySourcePurchaseRequestId(tenantId: string, purchaseRequestId: string): Promise<PurchaseOrderRecord[]>;
}
