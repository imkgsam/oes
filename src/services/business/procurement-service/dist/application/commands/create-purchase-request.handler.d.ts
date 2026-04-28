import { ICommandHandler } from '@nestjs/cqrs';
import { PurchaseRequestRecord } from '../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository';
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port';
import { CreatePurchaseRequestCommand } from './create-purchase-request.command';
/** CreatePurchaseRequestHandler creates one procurement demand draft without turning it into a procurement commitment. */
export declare class CreatePurchaseRequestHandler implements ICommandHandler<CreatePurchaseRequestCommand, PurchaseRequestRecord> {
    private readonly purchaseRequestRepository;
    private readonly itemLookup;
    constructor(purchaseRequestRepository: PurchaseRequestRepository, itemLookup: ItemReferenceLookupPort);
    execute(command: CreatePurchaseRequestCommand): Promise<PurchaseRequestRecord>;
}
