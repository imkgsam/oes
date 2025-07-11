//作用： 管理所有微服务连接

import { ClientProxy } from '@nestjs/microservices'
import { Logger } from '@nestjs/common'

const logger = new Logger('ClientManager')
const MAX_RETRIES = 3
interface ManagedClient {
  id: string
  client: ClientProxy
  connected: boolean
  retries: number
}

const clients = new Map<string, ManagedClient>()

export async function initManagedClient(id: string, client: ClientProxy) {
  const managed: ManagedClient = {
    id,
    client,
    connected: false,
    retries: 0,
  }

  clients.set(id, managed)
  await tryConnect(managed)
}

async function tryConnect(managed: ManagedClient) {
  try {
    await managed.client.connect()
    managed.connected = true
    managed.retries = 0
    logger.log(`[${managed.id}] Connected`)
  } catch (err) {
    managed.connected = false
    managed.retries += 1
    if (managed.retries > MAX_RETRIES) {
      logger.error(
        `[${managed.id}] Connection failed. Reached max retries (${MAX_RETRIES}). Stop retrying.`,
      )
      return
    }
    logger.warn(`[${managed.id}] Connection failed. Retry #${managed.retries}`)
    setTimeout(() => tryConnect(managed), 1000 * Math.min(managed.retries, 10))
  }
}

export async function closeAllClients() {
  for (const managed of clients.values()) {
    try {
      await managed.client.close()
      logger.log(`[${managed.id}] Closed`)
    } catch (err) {
      logger.error(`[${managed.id}] Close failed:`, err)
    }
  }
}
