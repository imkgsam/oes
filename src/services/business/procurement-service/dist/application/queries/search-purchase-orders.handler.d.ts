import { IQueryHandler } from '@nestjs/cqrs';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { SearchPurchaseOrdersQuery } from './search-purchase-orders.query';
/** SearchPurchaseOrdersHandler returns the current PO directory page without mutating procurement commitment state. */
export declare class SearchPurchaseOrdersHandler implements IQueryHandler<SearchPurchaseOrdersQuery, {
    purchaseOrders: Awaited<ReturnType<PurchaseOrderRepository['search']>>['items'];
    total: number;
    page: number;
    pageSize: number;
}> {
    private readonly purchaseOrderRepository;
    constructor(purchaseOrderRepository: PurchaseOrderRepository);
    execute(query: SearchPurchaseOrdersQuery): Promise<{
        purchaseOrders: import("../../domain/models/procurement-records").PurchaseOrderRecord[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
