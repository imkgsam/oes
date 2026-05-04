import { IQueryHandler } from '@nestjs/cqrs';
import { ReceiptRecord } from '../../domain/models/wms-records';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { GetReceiptQuery } from './get-receipt.query';
/** GetReceiptHandler returns one WMS-owned receipt aggregate for the query surface. */
export declare class GetReceiptHandler implements IQueryHandler<GetReceiptQuery, ReceiptRecord> {
    private readonly receiptRepository;
    constructor(receiptRepository: ReceiptRepository);
    execute(query: GetReceiptQuery): Promise<ReceiptRecord>;
}
