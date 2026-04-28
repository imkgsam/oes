import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseRequestRecord } from '../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port';
import { UpdatePurchaseRequestDraftCommand } from './update-purchase-request-draft.command';
/** UpdatePurchaseRequestDraftHandler replaces the editable contents of one PR draft without changing its demand nature. */
export declare class UpdatePurchaseRequestDraftHandler implements ICommandHandler<UpdatePurchaseRequestDraftCommand, PurchaseRequestRecord> {
    private readonly purchaseRequestRepository;
    private readonly itemLookup;
    constructor(purchaseRequestRepository: PurchaseRequestRepository, itemLookup: ItemReferenceLookupPort);
    execute(command: UpdatePurchaseRequestDraftCommand): Promise<PurchaseRequestRecord>;
}
