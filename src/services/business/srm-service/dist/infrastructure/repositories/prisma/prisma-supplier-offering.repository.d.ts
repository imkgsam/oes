import { PageResult, SupplierOfferingRecord, SupplierOfferingStatus } from '../../../domain/models/srm-records';
import { SupplierOfferingRepository } from '../../../domain/repositories/supplier-offering.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaSupplierOfferingRepository persists and lists the current SRM supplier-item supplyability facts. */
export declare class PrismaSupplierOfferingRepository implements SupplierOfferingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(tenantId: string, supplierOfferingId: string): Promise<SupplierOfferingRecord | null>;
    findBySupplierAndItem(tenantId: string, supplierId: string, itemId: string): Promise<SupplierOfferingRecord | null>;
    save(offering: SupplierOfferingRecord): Promise<SupplierOfferingRecord>;
    listBySupplierId(tenantId: string, supplierId: string, status?: SupplierOfferingStatus, page?: number, pageSize?: number): Promise<PageResult<SupplierOfferingRecord>>;
    listByItemId(tenantId: string, itemId: string, status?: SupplierOfferingStatus, page?: number, pageSize?: number): Promise<PageResult<SupplierOfferingRecord>>;
    hasActiveBySupplierId(tenantId: string, supplierId: string): Promise<boolean>;
}
