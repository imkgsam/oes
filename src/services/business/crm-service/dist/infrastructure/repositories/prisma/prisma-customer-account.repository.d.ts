import { CustomerAccountRecord, PageResult, SearchCustomerAccountsInput, SearchSelectableCustomersInput, SelectableCustomerRecord } from '../../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../../domain/repositories/customer-account.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaCustomerAccountRepository persists CRM account shells and allocates globally unique account numbers in PostgreSQL. */
export declare class PrismaCustomerAccountRepository implements CustomerAccountRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextCustomerAccountNo(tenantId: string): Promise<string>;
    findById(tenantId: string, customerAccountId: string): Promise<CustomerAccountRecord | null>;
    findActiveByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<CustomerAccountRecord | null>;
    save(account: CustomerAccountRecord): Promise<CustomerAccountRecord>;
    search(input: SearchCustomerAccountsInput): Promise<PageResult<CustomerAccountRecord>>;
    searchSelectable(input: SearchSelectableCustomersInput): Promise<PageResult<SelectableCustomerRecord>>;
}
