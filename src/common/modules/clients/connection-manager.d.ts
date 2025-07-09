import { ClientProxy } from '@nestjs/microservices';
export declare function initManagedClient(id: string, client: ClientProxy): Promise<void>;
export declare function closeAllClients(): Promise<void>;
