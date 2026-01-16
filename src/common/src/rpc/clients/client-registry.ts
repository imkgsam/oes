// 作用: 创建和管理微服务客户端代理
// Filed: src/common/modules/clients/client-registry.ts
import { ClientProxy } from '@nestjs/microservices'
import { createClient, IServiceEndpointConfig } from './client-factory'
import { initManagedClient } from './connection-manager'

const clientCache = new Map<string, ClientProxy>()

export async function getOrCreateClient(
  id: string,
  endpointConfig: IServiceEndpointConfig
): Promise<ClientProxy> {
  if (!clientCache.has(id)) {
    const client = createClient(endpointConfig)
    clientCache.set(id, client)
    await initManagedClient(id, client)
  }
  return clientCache.get(id)
}
