import { PageResult, ReceiptLineSummaryRecord, ReceiptRecord, SearchReceiptLinesInput, SearchReceiptsInput } from '../../../domain/models/wms-records';
import { ReceiptRepository } from '../../../domain/repositories/receipt.repository';
import { WmsInMemoryStore } from '../../store/wms-in-memory-store';
/** InMemoryReceiptRepository provides deterministic receipt persistence for WMS L1 tests. */
export declare class InMemoryReceiptRepository implements ReceiptRepository {
    private readonly store;
    constructor(store: WmsInMemoryStore);
    nextReceiptNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, receiptId: string): Promise<ReceiptRecord | null>;
    findLineById(tenantId: string, receiptLineId: string): Promise<ReceiptLineSummaryRecord | null>;
    save(record: ReceiptRecord): Promise<ReceiptRecord>;
    searchReceipts(input: SearchReceiptsInput): Promise<PageResult<ReceiptRecord>>;
    searchReceiptLines(input: SearchReceiptLinesInput): Promise<PageResult<ReceiptLineSummaryRecord>>;
}
