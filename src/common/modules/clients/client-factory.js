"use strict";
// 工厂函数： 创建不同协议的客户端代理
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const microservices_1 = require("@nestjs/microservices");
function createClient(endpointConfig) {
    let options;
    switch (endpointConfig.protocol) {
        case 'TCP':
            options = {
                transport: microservices_1.Transport.TCP,
                options: {
                    host: endpointConfig.host,
                    port: endpointConfig.port,
                },
            };
            break;
        case 'REDIS':
            options = {
                transport: microservices_1.Transport.REDIS,
                options: {
                    host: endpointConfig.host,
                    port: endpointConfig.port
                },
            };
            break;
        case 'NATS':
            options = {
                transport: microservices_1.Transport.NATS,
                options: {
                    url: endpointConfig.url || `nats://${endpointConfig.host}:${endpointConfig.port}`,
                },
            };
            break;
        case 'KAFKA':
            options = {
                transport: microservices_1.Transport.KAFKA,
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
                transport: microservices_1.Transport.RMQ,
                options: {
                    urls: [endpointConfig.url || `amqp://${endpointConfig.host}:${endpointConfig.port}`],
                    queue: endpointConfig.queue,
                    queueOptions: { durable: true },
                },
            };
            break;
        case 'GRPC':
            options = {
                transport: microservices_1.Transport.GRPC,
                options: {
                    url: endpointConfig.url || `${endpointConfig.host}:${endpointConfig.port}`,
                    protoPath: endpointConfig.grpcProtoPath,
                    package: endpointConfig.grpcPackage,
                },
            };
            break;
        case 'MQTT':
            options = {
                transport: microservices_1.Transport.MQTT,
                options: {
                    url: endpointConfig.url || `mqtt://${endpointConfig.host}:${endpointConfig.port}`,
                },
            };
            break;
        default:
            throw new Error(`Unsupported protocol: ${endpointConfig.protocol}`);
    }
    return microservices_1.ClientProxyFactory.create(options);
}
//# sourceMappingURL=client-factory.js.map