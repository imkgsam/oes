import { SupplierAddressRecord } from '../../../domain/models/srm-records';
import { SupplierAddressRepository } from '../../../domain/repositories/supplier-address.repository';
import { SrmInMemoryStore } from '../../store/srm-in-memory-store';
/** InMemorySupplierAddressRepository stores SRM business-address records inside the process-local runtime store. */
export declare class InMemorySupplierAddressRepository implements SupplierAddressRepository {
    private readonly store;
    constructor(store: SrmInMemoryStore);
    findById(tenantId: string, supplierId: string, supplierAddressId: string): Promise<SupplierAddressRecord | null>;
    save(address: SupplierAddressRecord): Promise<SupplierAddressRecord>;
    listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierAddressRecord[]>;
}
