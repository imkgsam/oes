import { ServiceDiscovery, ServiceInstance } from './interfaces/discovery.interface';
import { NacosNamingClientProvider } from './nacos-naming-client.provider';
import { AppLogger } from '../logging';
export declare class NacosDiscoveryService implements ServiceDiscovery {
    private readonly namingClientProvider;
    private readonly logger;
    private readonly cache;
    constructor(namingClientProvider: NacosNamingClientProvider, logger: AppLogger);
    subscribe(serviceName: string): Promise<void>;
    getInstances(serviceName: string): ServiceInstance[];
}
