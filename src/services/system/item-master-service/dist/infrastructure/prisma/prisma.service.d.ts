import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '../../../prisma/generated/prisma';
export type PrismaExecutionClient = Prisma.TransactionClient | PrismaService;
/** PrismaService manages the item-master-service database connection lifecycle. */
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly transactionStorage;
    /** getExecutionClient exposes the ambient transaction client when one is active for command-side atomicity. */
    getExecutionClient(): PrismaExecutionClient;
    /** hasActiveTransaction tells repositories whether they should avoid starting a nested Prisma transaction. */
    hasActiveTransaction(): boolean;
    /** runInTransaction executes one callback inside a shared Prisma transaction and reuses any existing transaction. */
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
