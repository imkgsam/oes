import { ClientProxy } from '@nestjs/microservices';
export type ServiceProtocol = 'TCP' | 'REDIS' | 'NATS' | 'KAFKA' | 'RABBITMQ' | 'GRPC' | 'MQTT';
export interface IServiceEndpointConfig {
    protocol: ServiceProtocol;
    serviceName: string;
    host: string;
    port?: number;
    url?: string;
    queue?: string;
    kafkaBrokers?: string[];
    grpcPackage?: string;
    grpcProtoPath?: string;
}
export declare function createClient(endpointConfig: IServiceEndpointConfig): ClientProxy;
