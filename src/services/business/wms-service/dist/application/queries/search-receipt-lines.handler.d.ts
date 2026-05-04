import { IQueryHandler } from '@nestjs/cqrs';
import { PageResult, ReceiptLineSummaryRecord } from '../../domain/models/wms-records';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { SearchReceiptLinesQuery } from './search-receipt-lines.query';
/** SearchReceiptLinesHandler returns one filtered receipt-line page for the query surface. */
export declare class SearchReceiptLinesHandler implements IQueryHandler<SearchReceiptLinesQuery, PageResult<ReceiptLineSummaryRecord>> {
    private readonly receiptRepository;
    constructor(receiptRepository: ReceiptRepository);
    execute(query: SearchReceiptLinesQuery): Promise<PageResult<ReceiptLineSummaryRecord>>;
}
