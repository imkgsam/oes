import { IQueryHandler } from '@nestjs/cqrs';
import { CustomerAccountRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { SearchCustomerAccountsQuery } from './search-customer-accounts.query';
export interface SearchCustomerAccountsResult {
    customerAccounts: CustomerAccountRecord[];
    total: number;
    page: number;
    pageSize: number;
}
/** SearchCustomerAccountsHandler exposes the CRM account directory including blocked, archived, and unbound accounts. */
export declare class SearchCustomerAccountsHandler implements IQueryHandler<SearchCustomerAccountsQuery, SearchCustomerAccountsResult> {
    private readonly accountRepository;
    constructor(accountRepository: CustomerAccountRepository);
    execute(query: SearchCustomerAccountsQuery): Promise<SearchCustomerAccountsResult>;
}
