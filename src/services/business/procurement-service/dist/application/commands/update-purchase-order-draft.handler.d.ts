import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { UpdatePurchaseOrderDraftCommand } from './update-purchase-order-draft.command';
/** UpdatePurchaseOrderDraftHandler replaces the editable lines and references on one PO draft. */
export declare class UpdatePurchaseOrderDraftHandler implements ICommandHandler<UpdatePurchaseOrderDraftCommand, PurchaseOrderRecord> {
    private readonly purchaseOrderRepository;
    private readonly purchaseRequestRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository, purchaseRequestRepository: PurchaseRequestRepository);
    execute(command: UpdatePurchaseOrderDraftCommand): Promise<PurchaseOrderRecord>;
}
