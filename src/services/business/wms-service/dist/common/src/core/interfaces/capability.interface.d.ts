export interface Cability<Input, Output> {
    description: string;
    transport: Transport[];
    retriable?: boolean;
}
export declare enum Transport {
    GRPC = "grpc",
    HTTP = "http",
    KAFKA = "kafka",
    MQTT = "mqtt",
    NATS = "nats",
    REDIS = "redis",
    RMQ = "rmq",
    TCP = "tcp"
}
