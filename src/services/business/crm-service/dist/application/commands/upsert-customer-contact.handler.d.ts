import { ICommandHandler } from '@nestjs/cqrs';
import { CustomerContactRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { CustomerContactRepository } from '../../domain/repositories/customer-contact.repository';
import { UpsertCustomerContactCommand } from './upsert-customer-contact.command';
/** UpsertCustomerContactHandler persists CRM business-contact records without turning them into Party truth. */
export declare class UpsertCustomerContactHandler implements ICommandHandler<UpsertCustomerContactCommand, CustomerContactRecord> {
    private readonly accountRepository;
    private readonly contactRepository;
    constructor(accountRepository: CustomerAccountRepository, contactRepository: CustomerContactRepository);
    execute(command: UpsertCustomerContactCommand): Promise<CustomerContactRecord>;
}
