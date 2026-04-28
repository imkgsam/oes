import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseRequestRecord } from '../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { SubmitPurchaseRequestCommand } from './submit-purchase-request.command';
/** SubmitPurchaseRequestHandler freezes one PR draft for decision without creating a procurement commitment. */
export declare class SubmitPurchaseRequestHandler implements ICommandHandler<SubmitPurchaseRequestCommand, PurchaseRequestRecord> {
    private readonly purchaseRequestRepository;
    constructor(purchaseRequestRepository: PurchaseRequestRepository);
    execute(command: SubmitPurchaseRequestCommand): Promise<PurchaseRequestRecord>;
}
