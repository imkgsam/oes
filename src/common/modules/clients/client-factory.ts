// 工厂函数： 创建不同协议的客户端代理

import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
  ClientOptions,
} from '@nestjs/microservices';

export type ServiceProtocol =
  | 'TCP'
  | 'REDIS'
  | 'NATS'
  | 'KAFKA'
  | 'RABBITMQ'
  | 'GRPC'
  | 'MQTT';

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

export function createClient(endpointConfig: IServiceEndpointConfig): ClientProxy {
  let options: ClientOptions;

  switch (endpointConfig.protocol) {
    case 'TCP':
      options = {
        transport: Transport.TCP,
        options: {
          host: endpointConfig.host,
          port: endpointConfig.port!,
        },
      };
      break;

    case 'REDIS':
      options = {
        transport: Transport.REDIS,
        options: {
          host: endpointConfig.host,
          port: endpointConfig.port!
        },
      };
      break;

    case 'NATS':
      options = {
        transport: Transport.NATS,
        options: {
          url: endpointConfig.url || `nats://${endpointConfig.host}:${endpointConfig.port}`,
        },
      };
      break;

    case 'KAFKA':
      options = {
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: endpointConfig.kafkaBrokers || [`${endpointConfig.host}:${endpointConfig.port}`],
          },
          consumer: {
            groupId: `${endpointConfig.serviceName}-consumer`,
          },
        },
      };
      break;

    case 'RABBITMQ':
      options = {
        transport: Transport.RMQ,
        options: {
          urls: [endpointConfig.url || `amqp://${endpointConfig.host}:${endpointConfig.port}`],
          queue: endpointConfig.queue!,
          queueOptions: { durable: true },
        },
      };
      break;

    case 'GRPC':
      options = {
        transport: Transport.GRPC,
        options: {
          url: endpointConfig.url || `${endpointConfig.host}:${endpointConfig.port}`,
          protoPath: endpointConfig.grpcProtoPath!,
          package: endpointConfig.grpcPackage!,
        },
      };
      break;

    case 'MQTT':
      options = {
        transport: Transport.MQTT,
        options: {
          url: endpointConfig.url || `mqtt://${endpointConfig.host}:${endpointConfig.port}`,
        },
      };
      break;

    default:
      throw new Error(`Unsupported protocol: ${endpointConfig.protocol}`);
  }

  return ClientProxyFactory.create(options as ClientOptions);
}
