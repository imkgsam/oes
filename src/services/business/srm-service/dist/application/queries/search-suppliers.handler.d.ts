import { IQueryHandler } from '@nestjs/cqrs';
import { SupplierProfileRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { SearchSuppliersQuery } from './search-suppliers.query';
export interface SearchSuppliersResult {
    suppliers: SupplierProfileRecord[];
    total: number;
    page: number;
    pageSize: number;
}
/** SearchSuppliersHandler exposes the SRM supplier directory including inactive and unbound profiles. */
export declare class SearchSuppliersHandler implements IQueryHandler<SearchSuppliersQuery, SearchSuppliersResult> {
    private readonly profileRepository;
    constructor(profileRepository: SupplierProfileRepository);
    execute(query: SearchSuppliersQuery): Promise<SearchSuppliersResult>;
}
