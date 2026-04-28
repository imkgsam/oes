import { IQueryHandler } from '@nestjs/cqrs';
import { SupplierOfferingRecord } from '../../domain/models/srm-records';
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { ListSupplierOfferingsBySupplierQuery } from './list-supplier-offerings-by-supplier.query';
export interface ListSupplierOfferingsBySupplierResult {
    offerings: SupplierOfferingRecord[];
    total: number;
    page: number;
    pageSize: number;
}
/** ListSupplierOfferingsBySupplierHandler returns the current offering facts for one existing supplier profile. */
export declare class ListSupplierOfferingsBySupplierHandler implements IQueryHandler<ListSupplierOfferingsBySupplierQuery, ListSupplierOfferingsBySupplierResult> {
    private readonly profileRepository;
    private readonly offeringRepository;
    constructor(profileRepository: SupplierProfileRepository, offeringRepository: SupplierOfferingRepository);
    execute(query: ListSupplierOfferingsBySupplierQuery): Promise<ListSupplierOfferingsBySupplierResult>;
}
