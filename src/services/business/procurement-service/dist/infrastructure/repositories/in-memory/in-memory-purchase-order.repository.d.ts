import { PageResult, PurchaseOrderChangeRecord, PurchaseOrderRecord, SearchPurchaseOrdersInput } from '../../../domain/models/procurement-records';
import { ListPurchaseOrderChangesInput, PurchaseOrderRepository } from '../../../domain/repositories/purchase-order.repository';
import { ProcurementInMemoryStore } from '../../store/procurement-in-memory-store';
/** InMemoryPurchaseOrderRepository stores PO aggregates and applied changes in-process for behavior tests. */
export declare class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
    private readonly store;
    constructor(store: ProcurementInMemoryStore);
    nextOrderNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, purchaseOrderId: string): Promise<PurchaseOrderRecord | null>;
    save(record: PurchaseOrderRecord): Promise<PurchaseOrderRecord>;
    search(input: SearchPurchaseOrdersInput): Promise<PageResult<PurchaseOrderRecord>>;
    listChanges(input: ListPurchaseOrderChangesInput): Promise<PageResult<PurchaseOrderChangeRecord>>;
    existsBySourcePurchaseRequestId(tenantId: string, purchaseRequestId: string): Promise<boolean>;
}
