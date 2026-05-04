import { PageResult, ReceiptLineSummaryRecord, ReceiptRecord, SearchReceiptLinesInput, SearchReceiptsInput } from '../../../domain/models/wms-records';
import { ReceiptRepository } from '../../../domain/repositories/receipt.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaReceiptRepository persists and queries WMS-owned receipt truth inside the service database. */
export declare class PrismaReceiptRepository implements ReceiptRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextReceiptNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, receiptId: string): Promise<ReceiptRecord | null>;
    findLineById(tenantId: string, receiptLineId: string): Promise<ReceiptLineSummaryRecord | null>;
    save(record: ReceiptRecord): Promise<ReceiptRecord>;
    searchReceipts(input: SearchReceiptsInput): Promise<PageResult<ReceiptRecord>>;
    searchReceiptLines(input: SearchReceiptLinesInput): Promise<PageResult<ReceiptLineSummaryRecord>>;
}
