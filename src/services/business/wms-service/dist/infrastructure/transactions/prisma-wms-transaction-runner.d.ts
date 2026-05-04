import { WmsTransactionRunner } from '../../application/ports/wms-transaction-runner.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaWmsTransactionRunner executes management commands inside a shared Prisma transaction boundary. */
export declare class PrismaWmsTransactionRunner implements WmsTransactionRunner {
    private readonly prisma;
    constructor(prisma: PrismaService);
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
