import { CustomerContactRecord } from '../models/crm-records';
/** CustomerContactRepository persists CRM business-contact records under one customer account. */
export interface CustomerContactRepository {
    findById(tenantId: string, customerAccountId: string, customerContactId: string): Promise<CustomerContactRecord | null>;
    save(contact: CustomerContactRecord): Promise<CustomerContactRecord>;
    listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerContactRecord[]>;
}
