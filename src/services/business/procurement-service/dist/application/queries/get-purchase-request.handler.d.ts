import { IQueryHandler } from '@nestjs/cqrs';
import { PurchaseRequestRecord } from '../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { GetPurchaseRequestQuery } from './get-purchase-request.query';
/** GetPurchaseRequestHandler loads one PR aggregate without mutating procurement demand state. */
export declare class GetPurchaseRequestHandler implements IQueryHandler<GetPurchaseRequestQuery, PurchaseRequestRecord> {
    private readonly purchaseRequestRepository;
    constructor(purchaseRequestRepository: PurchaseRequestRepository);
    execute(query: GetPurchaseRequestQuery): Promise<PurchaseRequestRecord>;
}
