import { PageResult, ReceiptLineSummaryRecord, ReceiptRecord, SearchReceiptLinesInput, SearchReceiptsInput } from '../models/wms-records';
/** ReceiptRepository persists and queries WMS-owned receipt truth including line snapshots and posting metadata. */
export interface ReceiptRepository {
    nextReceiptNo(tenantId: string): Promise<string>;
    findById(tenantId: string, receiptId: string): Promise<ReceiptRecord | null>;
    findLineById(tenantId: string, receiptLineId: string): Promise<ReceiptLineSummaryRecord | null>;
    save(record: ReceiptRecord): Promise<ReceiptRecord>;
    searchReceipts(input: SearchReceiptsInput): Promise<PageResult<ReceiptRecord>>;
    searchReceiptLines(input: SearchReceiptLinesInput): Promise<PageResult<ReceiptLineSummaryRecord>>;
}
