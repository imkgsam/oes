import { IQueryHandler } from '@nestjs/cqrs';
import { CustomerAccountRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { GetCustomerAccountQuery } from './get-customer-account.query';
/** GetCustomerAccountHandler loads one CRM customer-account shell and its active primary binding summary. */
export declare class GetCustomerAccountHandler implements IQueryHandler<GetCustomerAccountQuery, CustomerAccountRecord> {
    private readonly accountRepository;
    constructor(accountRepository: CustomerAccountRepository);
    execute(query: GetCustomerAccountQuery): Promise<CustomerAccountRecord>;
}
