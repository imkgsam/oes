import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseRequestRecord } from '../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { DecidePurchaseRequestCommand } from './decide-purchase-request.command';
/** DecidePurchaseRequestHandler freezes one APPROVED or REJECTED snapshot on a submitted PR. */
export declare class DecidePurchaseRequestHandler implements ICommandHandler<DecidePurchaseRequestCommand, PurchaseRequestRecord> {
    private readonly purchaseRequestRepository;
    constructor(purchaseRequestRepository: PurchaseRequestRepository);
    execute(command: DecidePurchaseRequestCommand): Promise<PurchaseRequestRecord>;
}
