import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierOfferingRecord } from '../../domain/models/srm-records';
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { ItemLookupPort } from '../ports/item-lookup.port';
import { UpsertSupplierOfferingCommand } from './upsert-supplier-offering.command';
/** UpsertSupplierOfferingHandler keeps exactly one current supplierId + itemId supplyability fact per tenant. */
export declare class UpsertSupplierOfferingHandler implements ICommandHandler<UpsertSupplierOfferingCommand, SupplierOfferingRecord> {
    private readonly profileRepository;
    private readonly offeringRepository;
    private readonly itemLookup;
    constructor(profileRepository: SupplierProfileRepository, offeringRepository: SupplierOfferingRepository, itemLookup: ItemLookupPort);
    execute(command: UpsertSupplierOfferingCommand): Promise<SupplierOfferingRecord>;
}
