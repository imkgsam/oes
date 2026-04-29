import { PageResult, ReceivingExpectationRecord, SearchReceivingExpectationsInput } from '../../../domain/models/procurement-records';
import { ReceivingRepository } from '../../../domain/repositories/receiving.repository';
import { ProcurementInMemoryStore } from '../../store/procurement-in-memory-store';
/** InMemoryReceivingRepository stores procurement expectation and discrepancy summaries in-process for behavior tests. */
export declare class InMemoryReceivingRepository implements ReceivingRepository {
    private readonly store;
    constructor(store: ProcurementInMemoryStore);
    nextExpectationNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, receivingExpectationId: string): Promise<ReceivingExpectationRecord | null>;
    listByPurchaseOrderLineId(tenantId: string, purchaseOrderLineId: string): Promise<ReceivingExpectationRecord[]>;
    save(record: ReceivingExpectationRecord): Promise<ReceivingExpectationRecord>;
    search(input: SearchReceivingExpectationsInput): Promise<PageResult<ReceivingExpectationRecord>>;
    existsByPurchaseOrderId(tenantId: string, purchaseOrderId: string): Promise<boolean>;
}
