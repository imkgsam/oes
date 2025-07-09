import { ClientProxy } from '@nestjs/microservices';
import { IServiceEndpointConfig } from './client-factory';
export declare function getOrCreateClient(id: string, endpointConfig: IServiceEndpointConfig): ClientProxy;
