import { SupplierProfileRecord, PageResult, SearchSuppliersInput } from '../../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../../domain/repositories/supplier-profile.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaSupplierProfileRepository persists SRM supplier-profile shells and allocates globally unique supplier numbers. */
export declare class PrismaSupplierProfileRepository implements SupplierProfileRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextSupplierProfileNo(tenantId: string): Promise<string>;
    findById(tenantId: string, supplierId: string): Promise<SupplierProfileRecord | null>;
    findByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<SupplierProfileRecord | null>;
    save(profile: SupplierProfileRecord): Promise<SupplierProfileRecord>;
    search(input: SearchSuppliersInput): Promise<PageResult<SupplierProfileRecord>>;
}
