import { CustomerAddressRecord } from '../../../domain/models/crm-records';
import { CustomerAddressRepository } from '../../../domain/repositories/customer-address.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaCustomerAddressRepository persists CRM business-address relationship records in PostgreSQL. */
export declare class PrismaCustomerAddressRepository implements CustomerAddressRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(tenantId: string, customerAccountId: string, customerAddressId: string): Promise<CustomerAddressRecord | null>;
    save(address: CustomerAddressRecord): Promise<CustomerAddressRecord>;
    listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerAddressRecord[]>;
}
