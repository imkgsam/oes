import { IQueryHandler } from '@nestjs/cqrs';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { SearchPurchaseRequestsQuery } from './search-purchase-requests.query';
/** SearchPurchaseRequestsHandler returns the current PR directory page without mutating procurement demand state. */
export declare class SearchPurchaseRequestsHandler implements IQueryHandler<SearchPurchaseRequestsQuery, {
    purchaseRequests: Awaited<ReturnType<PurchaseRequestRepository['search']>>['items'];
    total: number;
    page: number;
    pageSize: number;
}> {
    private readonly purchaseRequestRepository;
    constructor(purchaseRequestRepository: PurchaseRequestRepository);
    execute(query: SearchPurchaseRequestsQuery): Promise<{
        purchaseRequests: import("../../domain/models/procurement-records").PurchaseRequestRecord[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
