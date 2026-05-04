import { ICommandHandler } from '@nestjs/cqrs';
import { ReceiptRecord } from '../../domain/models/wms-records';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { CancelReceiptDraftCommand } from './cancel-receipt-draft.command';
/** CancelReceiptDraftHandler closes a draft receipt without touching immutable ledger or inventory truth. */
export declare class CancelReceiptDraftHandler implements ICommandHandler<CancelReceiptDraftCommand, ReceiptRecord> {
    private readonly receiptRepository;
    constructor(receiptRepository: ReceiptRepository);
    execute(command: CancelReceiptDraftCommand): Promise<ReceiptRecord>;
}
