import { PageResult, PurchaseRequestRecord, SearchPurchaseRequestsInput } from '../../../domain/models/procurement-records';
import { PurchaseRequestRepository } from '../../../domain/repositories/purchase-request.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaPurchaseRequestRepository persists PR aggregates and directory reads inside the procurement database. */
export declare class PrismaPurchaseRequestRepository implements PurchaseRequestRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextRequestNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, purchaseRequestId: string): Promise<PurchaseRequestRecord | null>;
    save(record: PurchaseRequestRecord): Promise<PurchaseRequestRecord>;
    search(input: SearchPurchaseRequestsInput): Promise<PageResult<PurchaseRequestRecord>>;
}
