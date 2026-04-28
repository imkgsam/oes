import { CrmTransactionRunner } from '../../application/ports/crm-transaction-runner.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaCrmTransactionRunner executes CRM management commands inside a shared Prisma transaction boundary. */
export declare class PrismaCrmTransactionRunner implements CrmTransactionRunner {
    private readonly prisma;
    constructor(prisma: PrismaService);
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
