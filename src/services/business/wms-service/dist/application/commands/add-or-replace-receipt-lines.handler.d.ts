import { ICommandHandler } from '@nestjs/cqrs';
import { ReceiptRecord } from '../../domain/models/wms-records';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { AddOrReplaceReceiptLinesCommand } from './add-or-replace-receipt-lines.command';
/** AddOrReplaceReceiptLinesHandler rewrites the full line set of a draft receipt without posting inventory truth. */
export declare class AddOrReplaceReceiptLinesHandler implements ICommandHandler<AddOrReplaceReceiptLinesCommand, ReceiptRecord> {
    private readonly receiptRepository;
    constructor(receiptRepository: ReceiptRepository);
    execute(command: AddOrReplaceReceiptLinesCommand): Promise<ReceiptRecord>;
    private buildLine;
}
