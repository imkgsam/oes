import { SupplierAddressRecord } from '../../../domain/models/srm-records';
import { SupplierAddressRepository } from '../../../domain/repositories/supplier-address.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaSupplierAddressRepository persists SRM business-address relationship records in PostgreSQL. */
export declare class PrismaSupplierAddressRepository implements SupplierAddressRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(tenantId: string, supplierId: string, supplierAddressId: string): Promise<SupplierAddressRecord | null>;
    save(address: SupplierAddressRecord): Promise<SupplierAddressRecord>;
    listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierAddressRecord[]>;
}
