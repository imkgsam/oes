import { ProcurementTransactionRunner } from '../../application/ports/procurement-transaction-runner.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaProcurementTransactionRunner executes management commands inside a shared Prisma transaction boundary. */
export declare class PrismaProcurementTransactionRunner implements ProcurementTransactionRunner {
    private readonly prisma;
    constructor(prisma: PrismaService);
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
