import { ICommandHandler } from '@nestjs/cqrs';
import { CustomerAccountRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { ChangeCustomerStatusCommand } from './change-customer-status.command';
/** ChangeCustomerStatusHandler updates only the CRM customer status while keeping binding ownership unchanged. */
export declare class ChangeCustomerStatusHandler implements ICommandHandler<ChangeCustomerStatusCommand, CustomerAccountRecord> {
    private readonly accountRepository;
    constructor(accountRepository: CustomerAccountRepository);
    execute(command: ChangeCustomerStatusCommand): Promise<CustomerAccountRecord>;
}
