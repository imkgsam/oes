import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port';
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port';
import { buildAppliedChange } from '../support/procurement-write-support';
import { ApplyPurchaseOrderChangeCommand } from './apply-purchase-order-change.command';
/** ApplyPurchaseOrderChangeHandler persists one applied phase 1 PO change together with the updated controlled target state. */
export declare class ApplyPurchaseOrderChangeHandler implements ICommandHandler<ApplyPurchaseOrderChangeCommand, {
    purchaseOrder: PurchaseOrderRecord;
    change: ReturnType<typeof buildAppliedChange>;
}> {
    private readonly purchaseOrderRepository;
    private readonly purchaseRequestRepository;
    private readonly itemLookup;
    private readonly supplierLookup;
    constructor(purchaseOrderRepository: PurchaseOrderRepository, purchaseRequestRepository: PurchaseRequestRepository, itemLookup: ItemReferenceLookupPort, supplierLookup: SupplierReferenceLookupPort);
    execute(command: ApplyPurchaseOrderChangeCommand): Promise<{
        purchaseOrder: PurchaseOrderRecord;
        change: ReturnType<typeof buildAppliedChange>;
    }>;
}
