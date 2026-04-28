import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { ConfirmSupplierAcknowledgementCommand } from './confirm-supplier-acknowledgement.command';
/** ConfirmSupplierAcknowledgementHandler records the phase 1 supplier acknowledgement summary on one issued PO. */
export declare class ConfirmSupplierAcknowledgementHandler implements ICommandHandler<ConfirmSupplierAcknowledgementCommand, PurchaseOrderRecord> {
    private readonly purchaseOrderRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository);
    execute(command: ConfirmSupplierAcknowledgementCommand): Promise<PurchaseOrderRecord>;
}
