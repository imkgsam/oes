import { SalesTransactionRunner } from '../../application/ports/sales-transaction-runner.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaSalesTransactionRunner executes management commands inside a shared Prisma transaction boundary. */
export declare class PrismaSalesTransactionRunner implements SalesTransactionRunner {
    private readonly prisma;
    constructor(prisma: PrismaService);
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
