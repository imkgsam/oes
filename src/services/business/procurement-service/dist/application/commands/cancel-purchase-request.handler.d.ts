import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseRequestRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { CancelPurchaseRequestCommand } from './cancel-purchase-request.command';
/** CancelPurchaseRequestHandler closes one PR only when it has not already become a procurement commitment source. */
export declare class CancelPurchaseRequestHandler implements ICommandHandler<CancelPurchaseRequestCommand, PurchaseRequestRecord> {
    private readonly purchaseRequestRepository;
    private readonly purchaseOrderRepository;
    constructor(purchaseRequestRepository: PurchaseRequestRepository, purchaseOrderRepository: PurchaseOrderRepository);
    execute(command: CancelPurchaseRequestCommand): Promise<PurchaseRequestRecord>;
}
