import { SupplierContactRecord } from '../../../domain/models/srm-records';
import { SupplierContactRepository } from '../../../domain/repositories/supplier-contact.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaSupplierContactRepository persists SRM business-contact relationship records in PostgreSQL. */
export declare class PrismaSupplierContactRepository implements SupplierContactRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(tenantId: string, supplierId: string, supplierContactId: string): Promise<SupplierContactRecord | null>;
    save(contact: SupplierContactRecord): Promise<SupplierContactRecord>;
    listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierContactRecord[]>;
}
