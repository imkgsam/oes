import { CustomerContactRecord } from '../../../domain/models/crm-records';
import { CustomerContactRepository } from '../../../domain/repositories/customer-contact.repository';
import { CrmInMemoryStore } from '../../store/crm-in-memory-store';
/** InMemoryCustomerContactRepository stores CRM business-contact records inside the process-local runtime store. */
export declare class InMemoryCustomerContactRepository implements CustomerContactRepository {
    private readonly store;
    constructor(store: CrmInMemoryStore);
    findById(tenantId: string, customerAccountId: string, customerContactId: string): Promise<CustomerContactRecord | null>;
    save(contact: CustomerContactRecord): Promise<CustomerContactRecord>;
    listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerContactRecord[]>;
}
