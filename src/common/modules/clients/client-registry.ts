// 作用: 创建和管理微服务客户端代理

import { ClientProxy } from '@nestjs/microservices';
import { createClient, IServiceEndpointConfig } from './client-factory';
import { initManagedClient } from './connection-manager';

const clientCache = new Map<string, ClientProxy>();

export function getOrCreateClient(id: string, endpointConfig: IServiceEndpointConfig): ClientProxy {
  if (!clientCache.has(id)) {
    const client = createClient(endpointConfig);
    clientCache.set(id, client);
    initManagedClient(id, client);
  }
  return clientCache.get(id)!;
}
