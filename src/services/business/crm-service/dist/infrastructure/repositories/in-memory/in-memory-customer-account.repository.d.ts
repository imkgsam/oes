import { CustomerAccountRecord, PageResult, SearchCustomerAccountsInput, SearchSelectableCustomersInput, SelectableCustomerRecord } from '../../../domain/models/crm-records';
import { CustomerAccountRepository } from '../../../domain/repositories/customer-account.repository';
import { CrmInMemoryStore } from '../../store/crm-in-memory-store';
/** InMemoryCustomerAccountRepository stores current CRM customer-account aggregates inside the process-local store. */
export declare class InMemoryCustomerAccountRepository implements CustomerAccountRepository {
    private readonly store;
    constructor(store: CrmInMemoryStore);
    nextCustomerAccountNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, customerAccountId: string): Promise<CustomerAccountRecord | null>;
    findActiveByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<CustomerAccountRecord | null>;
    save(account: CustomerAccountRecord): Promise<CustomerAccountRecord>;
    search(input: SearchCustomerAccountsInput): Promise<PageResult<CustomerAccountRecord>>;
    searchSelectable(input: SearchSelectableCustomersInput): Promise<PageResult<SelectableCustomerRecord>>;
}
