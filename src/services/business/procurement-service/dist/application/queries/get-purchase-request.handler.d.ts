import { IQueryHandler } from '@nestjs/cqrs';
import { PurchaseRequestRecord } from '../../domain/models/procurement-records';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { ReceivingRepository } from '../../domain/repositories/receiving.repository';
import { GetPurchaseRequestQuery } from './get-purchase-request.query';
/** GetPurchaseRequestHandler loads one PR aggregate without mutating procurement demand state. */
export declare class GetPurchaseRequestHandler implements IQueryHandler<GetPurchaseRequestQuery, PurchaseRequestRecord> {
    private readonly purchaseRequestRepository;
    private readonly purchaseOrderRepository;
    private readonly receivingRepository;
    constructor(purchaseRequestRepository: PurchaseRequestRepository, purchaseOrderRepository: PurchaseOrderRepository, receivingRepository: ReceivingRepository);
    execute(query: GetPurchaseRequestQuery): Promise<PurchaseRequestRecord>;
}
