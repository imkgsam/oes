import { PageResult, ReceivingExpectationRecord, SearchReceivingExpectationsInput } from '../../../domain/models/procurement-records';
import { ReceivingRepository } from '../../../domain/repositories/receiving.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaReceivingRepository persists procurement-owned expectation and discrepancy summaries inside the service database. */
export declare class PrismaReceivingRepository implements ReceivingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextExpectationNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, receivingExpectationId: string): Promise<ReceivingExpectationRecord | null>;
    findByPurchaseOrderLineId(tenantId: string, purchaseOrderLineId: string): Promise<ReceivingExpectationRecord | null>;
    save(record: ReceivingExpectationRecord): Promise<ReceivingExpectationRecord>;
    search(input: SearchReceivingExpectationsInput): Promise<PageResult<ReceivingExpectationRecord>>;
    existsByPurchaseOrderId(tenantId: string, purchaseOrderId: string): Promise<boolean>;
}
