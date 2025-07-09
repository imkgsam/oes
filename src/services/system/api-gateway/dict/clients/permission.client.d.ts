import { ClientProxy } from '@nestjs/microservices';
export declare class PermissionClient {
    private readonly client;
    constructor(client: ClientProxy);
    send<T>(pattern: any, data: any): Promise<T>;
}
