import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port';
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port';
import { IssuePurchaseOrderCommand } from './issue-purchase-order.command';
/** IssuePurchaseOrderHandler turns one PO draft into a formal phase 1 procurement commitment under current reference truth. */
export declare class IssuePurchaseOrderHandler implements ICommandHandler<IssuePurchaseOrderCommand, PurchaseOrderRecord> {
    private readonly purchaseOrderRepository;
    private readonly purchaseRequestRepository;
    private readonly itemLookup;
    private readonly supplierLookup;
    constructor(purchaseOrderRepository: PurchaseOrderRepository, purchaseRequestRepository: PurchaseRequestRepository, itemLookup: ItemReferenceLookupPort, supplierLookup: SupplierReferenceLookupPort);
    execute(command: IssuePurchaseOrderCommand): Promise<PurchaseOrderRecord>;
}
