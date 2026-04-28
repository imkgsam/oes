import { CustomerAccountRecord, PageResult, SearchCustomerAccountsInput, SearchSelectableCustomersInput, SelectableCustomerRecord } from '../models/crm-records';
/** CustomerAccountRepository persists tenant-scoped CRM customer-account aggregates and selector reads. */
export interface CustomerAccountRepository {
    nextCustomerAccountNo(tenantId: string): Promise<string>;
    findById(tenantId: string, customerAccountId: string): Promise<CustomerAccountRecord | null>;
    findActiveByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<CustomerAccountRecord | null>;
    save(account: CustomerAccountRecord): Promise<CustomerAccountRecord>;
    search(input: SearchCustomerAccountsInput): Promise<PageResult<CustomerAccountRecord>>;
    searchSelectable(input: SearchSelectableCustomersInput): Promise<PageResult<SelectableCustomerRecord>>;
}
