import { IQueryHandler } from '@nestjs/cqrs';
import { ReceiptLineSummaryRecord } from '../../domain/models/wms-records';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { GetReceiptLineQuery } from './get-receipt-line.query';
/** GetReceiptLineHandler returns one WMS-owned receipt-line truth row for the query surface. */
export declare class GetReceiptLineHandler implements IQueryHandler<GetReceiptLineQuery, ReceiptLineSummaryRecord> {
    private readonly receiptRepository;
    constructor(receiptRepository: ReceiptRepository);
    execute(query: GetReceiptLineQuery): Promise<ReceiptLineSummaryRecord>;
}
