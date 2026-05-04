import { DynamicModule } from '@nestjs/common';
import { ServiceKey } from './service-map';
export declare class ClientModule {
    static register(serviceKeys: readonly ServiceKey[]): DynamicModule;
}
