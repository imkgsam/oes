import { PageResult, PurchaseOrderChangeRecord, PurchaseOrderRecord, SearchPurchaseOrdersInput } from '../../../domain/models/procurement-records';
import { ListPurchaseOrderChangesInput, PurchaseOrderRepository } from '../../../domain/repositories/purchase-order.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaPurchaseOrderRepository persists PO aggregates, applied changes, and search reads inside the procurement database. */
export declare class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextOrderNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, purchaseOrderId: string): Promise<PurchaseOrderRecord | null>;
    save(record: PurchaseOrderRecord): Promise<PurchaseOrderRecord>;
    search(input: SearchPurchaseOrdersInput): Promise<PageResult<PurchaseOrderRecord>>;
    listChanges(input: ListPurchaseOrderChangesInput): Promise<PageResult<PurchaseOrderChangeRecord>>;
    existsBySourcePurchaseRequestId(tenantId: string, purchaseRequestId: string): Promise<boolean>;
    findBySourcePurchaseRequestId(tenantId: string, purchaseRequestId: string): Promise<PurchaseOrderRecord[]>;
}
