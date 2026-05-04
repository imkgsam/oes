import { OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from './config.interface';
export declare class NacosConfigService implements ConfigService, OnModuleDestroy {
    private readonly eventEmitter;
    private client;
    private cache;
    constructor(eventEmitter: EventEmitter2);
    init(): Promise<void>;
    private updateCache;
    get<T = any>(key: string): T;
    getAll(): Record<string, any>;
    onModuleDestroy(): Promise<void>;
}
