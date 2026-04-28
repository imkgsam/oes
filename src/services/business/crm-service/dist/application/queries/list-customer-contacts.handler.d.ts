import { IQueryHandler } from '@nestjs/cqrs';
import { CustomerContactRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { CustomerContactRepository } from '../../domain/repositories/customer-contact.repository';
import { ListCustomerContactsQuery } from './list-customer-contacts.query';
export interface ListCustomerContactsResult {
    contacts: CustomerContactRecord[];
}
/** ListCustomerContactsHandler returns CRM business-contact records for one existing customer account. */
export declare class ListCustomerContactsHandler implements IQueryHandler<ListCustomerContactsQuery, ListCustomerContactsResult> {
    private readonly accountRepository;
    private readonly contactRepository;
    constructor(accountRepository: CustomerAccountRepository, contactRepository: CustomerContactRepository);
    execute(query: ListCustomerContactsQuery): Promise<ListCustomerContactsResult>;
}
