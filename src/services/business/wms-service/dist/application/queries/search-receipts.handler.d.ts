import { IQueryHandler } from '@nestjs/cqrs';
import { PageResult, ReceiptRecord } from '../../domain/models/wms-records';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { SearchReceiptsQuery } from './search-receipts.query';
/** SearchReceiptsHandler returns one filtered receipt page without exposing non-WMS lifecycle semantics. */
export declare class SearchReceiptsHandler implements IQueryHandler<SearchReceiptsQuery, PageResult<ReceiptRecord>> {
    private readonly receiptRepository;
    constructor(receiptRepository: ReceiptRepository);
    execute(query: SearchReceiptsQuery): Promise<PageResult<ReceiptRecord>>;
}
