import { IQueryHandler } from '@nestjs/cqrs';
import { SelectableCustomerRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { SearchSelectableCustomersQuery } from './search-selectable-customers.query';
export interface SearchSelectableCustomersResult {
    customers: SelectableCustomerRecord[];
    total: number;
    page: number;
    pageSize: number;
}
/** SearchSelectableCustomersHandler exposes only ACTIVE_CUSTOMER accounts with one active primary binding. */
export declare class SearchSelectableCustomersHandler implements IQueryHandler<SearchSelectableCustomersQuery, SearchSelectableCustomersResult> {
    private readonly accountRepository;
    constructor(accountRepository: CustomerAccountRepository);
    execute(query: SearchSelectableCustomersQuery): Promise<SearchSelectableCustomersResult>;
}
