import { PageResult, PurchaseRequestRecord, SearchPurchaseRequestsInput } from '../../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../../domain/repositories/purchase-request.repository';
import { ProcurementInMemoryStore } from '../../store/procurement-in-memory-store';
/** InMemoryPurchaseRequestRepository stores PR aggregates in-process for behavior and surface tests. */
export declare class InMemoryPurchaseRequestRepository implements PurchaseRequestRepository {
    private readonly store;
    constructor(store: ProcurementInMemoryStore);
    nextRequestNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, purchaseRequestId: string): Promise<PurchaseRequestRecord | null>;
    save(record: PurchaseRequestRecord): Promise<PurchaseRequestRecord>;
    search(input: SearchPurchaseRequestsInput): Promise<PageResult<PurchaseRequestRecord>>;
}
