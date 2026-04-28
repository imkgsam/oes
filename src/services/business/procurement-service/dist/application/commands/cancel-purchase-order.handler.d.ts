import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { ReceivingRepository } from '../../domain/repositories/receiving.repository';
import { CancelPurchaseOrderCommand } from './cancel-purchase-order.command';
/** CancelPurchaseOrderHandler closes one PO only when downstream receiving expectation ownership has not started. */
export declare class CancelPurchaseOrderHandler implements ICommandHandler<CancelPurchaseOrderCommand, PurchaseOrderRecord> {
    private readonly purchaseOrderRepository;
    private readonly receivingRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository, receivingRepository: ReceivingRepository);
    execute(command: CancelPurchaseOrderCommand): Promise<PurchaseOrderRecord>;
}
