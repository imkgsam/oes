import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ServiceRegistry } from './interfaces/registry.interface';
import { NacosNamingClientProvider } from './nacos-naming-client.provider';
import { AppLogger } from '../logging';
export declare class NacosRegistryService implements ServiceRegistry, OnModuleInit, OnModuleDestroy {
    private readonly namingClientProvider;
    private readonly logger;
    private instance;
    constructor(namingClientProvider: NacosNamingClientProvider, logger: AppLogger);
    onModuleInit(): Promise<void>;
    register(): Promise<void>;
    deregister(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
