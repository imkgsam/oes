import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { CreatePurchaseOrderDraftCommand } from './create-purchase-order-draft.command';
/** CreatePurchaseOrderDraftHandler creates one editable PO draft without making it a formal supplier commitment. */
export declare class CreatePurchaseOrderDraftHandler implements ICommandHandler<CreatePurchaseOrderDraftCommand, PurchaseOrderRecord> {
    private readonly purchaseOrderRepository;
    private readonly purchaseRequestRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository, purchaseRequestRepository: PurchaseRequestRepository);
    execute(command: CreatePurchaseOrderDraftCommand): Promise<PurchaseOrderRecord>;
}
