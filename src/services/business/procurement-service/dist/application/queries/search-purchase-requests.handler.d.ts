import { IQueryHandler } from '@nestjs/cqrs';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { ReceivingRepository } from '../../domain/repositories/receiving.repository';
import { SearchPurchaseRequestsQuery } from './search-purchase-requests.query';
/** SearchPurchaseRequestsHandler returns the current PR directory page without mutating procurement demand state. */
export declare class SearchPurchaseRequestsHandler implements IQueryHandler<SearchPurchaseRequestsQuery, {
    purchaseRequests: Awaited<ReturnType<PurchaseRequestRepository['search']>>['items'];
    total: number;
    page: number;
    pageSize: number;
}> {
    private readonly purchaseRequestRepository;
    private readonly purchaseOrderRepository;
    private readonly receivingRepository;
    constructor(purchaseRequestRepository: PurchaseRequestRepository, purchaseOrderRepository: PurchaseOrderRepository, receivingRepository: ReceivingRepository);
    execute(query: SearchPurchaseRequestsQuery): Promise<{
        purchaseRequests: import("../../domain/models/procurement-records").PurchaseRequestRecord[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
