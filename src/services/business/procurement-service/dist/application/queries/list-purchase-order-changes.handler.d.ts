import { IQueryHandler } from '@nestjs/cqrs';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { ListPurchaseOrderChangesQuery } from './list-purchase-order-changes.query';
/** ListPurchaseOrderChangesHandler returns the applied-change page for one existing PO. */
export declare class ListPurchaseOrderChangesHandler implements IQueryHandler<ListPurchaseOrderChangesQuery, {
    changes: Awaited<ReturnType<PurchaseOrderRepository['listChanges']>>['items'];
    total: number;
    page: number;
    pageSize: number;
}> {
    private readonly purchaseOrderRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository);
    execute(query: ListPurchaseOrderChangesQuery): Promise<{
        changes: import("../../domain/models/procurement-records").PurchaseOrderChangeRecord[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
