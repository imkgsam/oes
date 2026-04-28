import { SrmTransactionRunner } from '../../application/ports/srm-transaction-runner.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaSrmTransactionRunner executes SRM management commands inside a shared Prisma transaction boundary. */
export declare class PrismaSrmTransactionRunner implements SrmTransactionRunner {
    private readonly prisma;
    constructor(prisma: PrismaService);
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
