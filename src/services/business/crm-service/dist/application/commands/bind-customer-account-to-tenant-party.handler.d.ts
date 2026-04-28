import { ICommandHandler } from '@nestjs/cqrs';
import { CustomerAccountRecord } from '../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository';
import { TenantPartyLookupPort } from '../ports/tenant-party-lookup.port';
import { BindCustomerAccountToTenantPartyCommand } from './bind-customer-account-to-tenant-party.command';
/** BindCustomerAccountToTenantPartyHandler enforces the phase 1 single-active-primary-binding invariant. */
export declare class BindCustomerAccountToTenantPartyHandler implements ICommandHandler<BindCustomerAccountToTenantPartyCommand, CustomerAccountRecord> {
    private readonly accountRepository;
    private readonly tenantPartyLookup;
    constructor(accountRepository: CustomerAccountRepository, tenantPartyLookup: TenantPartyLookupPort);
    execute(command: BindCustomerAccountToTenantPartyCommand): Promise<CustomerAccountRecord>;
}
