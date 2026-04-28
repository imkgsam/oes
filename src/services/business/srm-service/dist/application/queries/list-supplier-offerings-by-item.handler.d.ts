import { IQueryHandler } from '@nestjs/cqrs';
import { SupplierOfferingRecord } from '../../domain/models/srm-records';
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository';
import { ListSupplierOfferingsByItemQuery } from './list-supplier-offerings-by-item.query';
export interface ListSupplierOfferingsByItemResult {
    offerings: SupplierOfferingRecord[];
    total: number;
    page: number;
    pageSize: number;
}
/** ListSupplierOfferingsByItemHandler returns the current offering facts for one item directory view. */
export declare class ListSupplierOfferingsByItemHandler implements IQueryHandler<ListSupplierOfferingsByItemQuery, ListSupplierOfferingsByItemResult> {
    private readonly offeringRepository;
    constructor(offeringRepository: SupplierOfferingRepository);
    execute(query: ListSupplierOfferingsByItemQuery): Promise<ListSupplierOfferingsByItemResult>;
}
