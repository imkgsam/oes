import { IQueryHandler } from '@nestjs/cqrs';
import { SupplierAddressRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { SupplierAddressRepository } from '../../domain/repositories/supplier-address.repository';
import { ListSupplierAddressesQuery } from './list-supplier-addresses.query';
export interface ListSupplierAddressesResult {
    addresses: SupplierAddressRecord[];
}
/** ListSupplierAddressesHandler returns SRM business-address records for one existing supplier profile. */
export declare class ListSupplierAddressesHandler implements IQueryHandler<ListSupplierAddressesQuery, ListSupplierAddressesResult> {
    private readonly accountRepository;
    private readonly addressRepository;
    constructor(accountRepository: SupplierProfileRepository, addressRepository: SupplierAddressRepository);
    execute(query: ListSupplierAddressesQuery): Promise<ListSupplierAddressesResult>;
}
