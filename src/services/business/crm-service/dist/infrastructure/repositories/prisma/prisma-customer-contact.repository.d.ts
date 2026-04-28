import { CustomerContactRecord } from '../../../domain/models/crm-records';
import { CustomerContactRepository } from '../../../domain/repositories/customer-contact.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaCustomerContactRepository persists CRM business-contact relationship records in PostgreSQL. */
export declare class PrismaCustomerContactRepository implements CustomerContactRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(tenantId: string, customerAccountId: string, customerContactId: string): Promise<CustomerContactRecord | null>;
    save(contact: CustomerContactRecord): Promise<CustomerContactRecord>;
    listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerContactRecord[]>;
}
