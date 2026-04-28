import { IQueryHandler } from '@nestjs/cqrs';
import { PurchaseOrderRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { GetPurchaseOrderQuery } from './get-purchase-order.query';
/** GetPurchaseOrderHandler loads one PO aggregate without mutating procurement commitment state. */
export declare class GetPurchaseOrderHandler implements IQueryHandler<GetPurchaseOrderQuery, PurchaseOrderRecord> {
    private readonly purchaseOrderRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository);
    execute(query: GetPurchaseOrderQuery): Promise<PurchaseOrderRecord>;
}
