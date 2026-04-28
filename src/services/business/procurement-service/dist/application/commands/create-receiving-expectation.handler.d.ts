import { ICommandHandler } from '@nestjs/cqrs';
import { ReceivingExpectationRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { ReceivingRepository } from '../../domain/repositories/receiving.repository';
import { CreateReceivingExpectationCommand } from './create-receiving-expectation.command';
/** CreateReceivingExpectationHandler creates the procurement-side expectation summary from one issued PO line only. */
export declare class CreateReceivingExpectationHandler implements ICommandHandler<CreateReceivingExpectationCommand, ReceivingExpectationRecord> {
    private readonly purchaseOrderRepository;
    private readonly receivingRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository, receivingRepository: ReceivingRepository);
    execute(command: CreateReceivingExpectationCommand): Promise<ReceivingExpectationRecord>;
}
