import { ICommandHandler } from '@nestjs/cqrs';
import { ReceiptRecord } from '../../domain/models/wms-records';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { CreateReceiptDraftCommand } from './create-receipt-draft.command';
/** CreateReceiptDraftHandler creates one WMS receipt draft header without posting any inventory truth. */
export declare class CreateReceiptDraftHandler implements ICommandHandler<CreateReceiptDraftCommand, ReceiptRecord> {
    private readonly receiptRepository;
    constructor(receiptRepository: ReceiptRepository);
    execute(command: CreateReceiptDraftCommand): Promise<ReceiptRecord>;
}
