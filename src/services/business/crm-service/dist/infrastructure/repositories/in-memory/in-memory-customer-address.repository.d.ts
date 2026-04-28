import { CustomerAddressRecord } from '../../../domain/models/crm-records';
import { CustomerAddressRepository } from '../../../domain/repositories/customer-address.repository';
import { CrmInMemoryStore } from '../../store/crm-in-memory-store';
/** InMemoryCustomerAddressRepository stores CRM business-address records inside the process-local runtime store. */
export declare class InMemoryCustomerAddressRepository implements CustomerAddressRepository {
    private readonly store;
    constructor(store: CrmInMemoryStore);
    findById(tenantId: string, customerAccountId: string, customerAddressId: string): Promise<CustomerAddressRecord | null>;
    save(address: CustomerAddressRecord): Promise<CustomerAddressRecord>;
    listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerAddressRecord[]>;
}
