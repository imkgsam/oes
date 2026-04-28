import { CustomerAddressRecord } from '../models/crm-records';
/** CustomerAddressRepository persists CRM business-address records under one customer account. */
export interface CustomerAddressRepository {
    findById(tenantId: string, customerAccountId: string, customerAddressId: string): Promise<CustomerAddressRecord | null>;
    save(address: CustomerAddressRecord): Promise<CustomerAddressRecord>;
    listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerAddressRecord[]>;
}
