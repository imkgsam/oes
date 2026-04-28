import { IQueryHandler } from '@nestjs/cqrs';
import { CustomerAddressRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { CustomerAddressRepository } from '../../domain/repositories/customer-address.repository';
import { ListCustomerAddressesQuery } from './list-customer-addresses.query';
export interface ListCustomerAddressesResult {
    addresses: CustomerAddressRecord[];
}
/** ListCustomerAddressesHandler returns CRM business-address records for one existing customer account. */
export declare class ListCustomerAddressesHandler implements IQueryHandler<ListCustomerAddressesQuery, ListCustomerAddressesResult> {
    private readonly accountRepository;
    private readonly addressRepository;
    constructor(accountRepository: CustomerAccountRepository, addressRepository: CustomerAddressRepository);
    execute(query: ListCustomerAddressesQuery): Promise<ListCustomerAddressesResult>;
}
