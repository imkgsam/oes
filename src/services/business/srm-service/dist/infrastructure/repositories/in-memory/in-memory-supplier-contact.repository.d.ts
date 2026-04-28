import { SupplierContactRecord } from '../../../domain/models/srm-records';
import { SupplierContactRepository } from '../../../domain/repositories/supplier-contact.repository';
import { SrmInMemoryStore } from '../../store/srm-in-memory-store';
/** InMemorySupplierContactRepository stores SRM business-contact records inside the process-local runtime store. */
export declare class InMemorySupplierContactRepository implements SupplierContactRepository {
    private readonly store;
    constructor(store: SrmInMemoryStore);
    findById(tenantId: string, supplierId: string, supplierContactId: string): Promise<SupplierContactRecord | null>;
    save(contact: SupplierContactRecord): Promise<SupplierContactRecord>;
    listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierContactRecord[]>;
}
