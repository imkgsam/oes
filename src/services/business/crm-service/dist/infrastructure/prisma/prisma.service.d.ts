import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '../../../prisma/generated/prisma';
export type PrismaExecutionClient = Prisma.TransactionClient | PrismaService;
/** PrismaService manages the crm-service database connection and ambient transaction reuse. */
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly transactionStorage;
    constructor(configService?: ConfigService);
    /** getExecutionClient returns the ambient Prisma transaction client when one is active. */
    getExecutionClient(): PrismaExecutionClient;
    /** hasActiveTransaction tells persistence adapters whether they are already inside a Prisma transaction. */
    hasActiveTransaction(): boolean;
    /** runInTransaction executes one callback inside a shared Prisma transaction boundary. */
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
