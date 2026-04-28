import { SupplierProfileRecord, PageResult, SearchSuppliersInput } from '../../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../../domain/repositories/supplier-profile.repository';
import { SrmInMemoryStore } from '../../store/srm-in-memory-store';
/** InMemorySupplierProfileRepository stores current SRM supplier-profile aggregates inside the process-local store. */
export declare class InMemorySupplierProfileRepository implements SupplierProfileRepository {
    private readonly store;
    constructor(store: SrmInMemoryStore);
    nextSupplierProfileNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, supplierId: string): Promise<SupplierProfileRecord | null>;
    findByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<SupplierProfileRecord | null>;
    save(profile: SupplierProfileRecord): Promise<SupplierProfileRecord>;
    search(input: SearchSuppliersInput): Promise<PageResult<SupplierProfileRecord>>;
}
