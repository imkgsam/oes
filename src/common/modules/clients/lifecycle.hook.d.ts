import { OnApplicationShutdown } from '@nestjs/common';
export declare class ClientConnectionLifecycle implements OnApplicationShutdown {
    onApplicationShutdown(signal: string): Promise<void>;
}
