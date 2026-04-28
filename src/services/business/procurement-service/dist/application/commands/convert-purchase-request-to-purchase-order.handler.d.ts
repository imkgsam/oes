import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port';
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port';
import { ConvertPurchaseRequestToPurchaseOrderCommand } from './convert-purchase-request-to-purchase-order.command';
/** ConvertPurchaseRequestToPurchaseOrderHandler turns one approved PR into a phase 1 PO draft under frozen supplier-item gates. */
export declare class ConvertPurchaseRequestToPurchaseOrderHandler implements ICommandHandler<ConvertPurchaseRequestToPurchaseOrderCommand, PurchaseOrderRecord> {
    private readonly purchaseRequestRepository;
    private readonly purchaseOrderRepository;
    private readonly itemLookup;
    private readonly supplierLookup;
    constructor(purchaseRequestRepository: PurchaseRequestRepository, purchaseOrderRepository: PurchaseOrderRepository, itemLookup: ItemReferenceLookupPort, supplierLookup: SupplierReferenceLookupPort);
    execute(command: ConvertPurchaseRequestToPurchaseOrderCommand): Promise<PurchaseOrderRecord>;
}
