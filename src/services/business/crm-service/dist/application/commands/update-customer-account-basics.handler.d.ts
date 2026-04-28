import { ICommandHandler } from '@nestjs/cqrs';
import { CustomerAccountRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { UpdateCustomerAccountBasicsCommand } from './update-customer-account-basics.command';
/** UpdateCustomerAccountBasicsHandler updates phase 1 CRM account-shell basics without touching status or binding. */
export declare class UpdateCustomerAccountBasicsHandler implements ICommandHandler<UpdateCustomerAccountBasicsCommand, CustomerAccountRecord> {
    private readonly accountRepository;
    constructor(accountRepository: CustomerAccountRepository);
    execute(command: UpdateCustomerAccountBasicsCommand): Promise<CustomerAccountRecord>;
}
