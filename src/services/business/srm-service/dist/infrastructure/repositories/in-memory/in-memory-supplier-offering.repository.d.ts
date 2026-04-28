import { PageResult, SupplierOfferingRecord, SupplierOfferingStatus } from '../../../domain/models/srm-records';
import { SupplierOfferingRepository } from '../../../domain/repositories/supplier-offering.repository';
import { SrmInMemoryStore } from '../../store/srm-in-memory-store';
/** InMemorySupplierOfferingRepository stores current supplyability facts inside the process-local SRM store. */
export declare class InMemorySupplierOfferingRepository implements SupplierOfferingRepository {
    private readonly store;
    constructor(store: SrmInMemoryStore);
    findById(tenantId: string, supplierOfferingId: string): Promise<SupplierOfferingRecord | null>;
    findBySupplierAndItem(tenantId: string, supplierId: string, itemId: string): Promise<SupplierOfferingRecord | null>;
    save(offering: SupplierOfferingRecord): Promise<SupplierOfferingRecord>;
    listBySupplierId(tenantId: string, supplierId: string, status?: SupplierOfferingStatus, page?: number, pageSize?: number): Promise<PageResult<SupplierOfferingRecord>>;
    listByItemId(tenantId: string, itemId: string, status?: SupplierOfferingStatus, page?: number, pageSize?: number): Promise<PageResult<SupplierOfferingRecord>>;
    hasActiveBySupplierId(tenantId: string, supplierId: string): Promise<boolean>;
}
