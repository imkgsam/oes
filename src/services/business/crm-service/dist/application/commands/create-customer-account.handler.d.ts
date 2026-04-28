import { ICommandHandler } from '@nestjs/cqrs';
import { CustomerAccountRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { CreateCustomerAccountCommand } from './create-customer-account.command';
/** CreateCustomerAccountHandler creates one CRM customer-account shell without creating or mutating Party truth. */
export declare class CreateCustomerAccountHandler implements ICommandHandler<CreateCustomerAccountCommand, CustomerAccountRecord> {
    private readonly accountRepository;
    constructor(accountRepository: CustomerAccountRepository);
    execute(command: CreateCustomerAccountCommand): Promise<CustomerAccountRecord>;
}
