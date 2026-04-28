import { ICommandHandler } from '@nestjs/cqrs';
import { CustomerAddressRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { CustomerAddressRepository } from '../../domain/repositories/customer-address.repository';
import { UpsertCustomerAddressCommand } from './upsert-customer-address.command';
/** UpsertCustomerAddressHandler persists CRM business-address records without claiming Party address truth. */
export declare class UpsertCustomerAddressHandler implements ICommandHandler<UpsertCustomerAddressCommand, CustomerAddressRecord> {
    private readonly accountRepository;
    private readonly addressRepository;
    constructor(accountRepository: CustomerAccountRepository, addressRepository: CustomerAddressRepository);
    execute(command: UpsertCustomerAddressCommand): Promise<CustomerAddressRecord>;
}
