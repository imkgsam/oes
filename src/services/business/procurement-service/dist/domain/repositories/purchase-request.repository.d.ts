import { PageResult, PurchaseRequestRecord, SearchPurchaseRequestsInput } from '../models/procurement-records';
/** PurchaseRequestRepository persists tenant-scoped PR aggregates and directory reads. */
export interface PurchaseRequestRepository {
    nextRequestNo(tenantId: string): Promise<string>;
    findById(tenantId: string, purchaseRequestId: string): Promise<PurchaseRequestRecord | null>;
    save(record: PurchaseRequestRecord): Promise<PurchaseRequestRecord>;
    search(input: SearchPurchaseRequestsInput): Promise<PageResult<PurchaseRequestRecord>>;
}
