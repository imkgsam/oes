import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { NacosConfigClient } from 'nacos'
import { ConfigService } from './config.interface'
import { ConfigChangedEvent } from './config.events'

@Injectable()
export class NacosConfigService implements ConfigService, OnModuleDestroy {
  private client: NacosConfigClient
  private cache: Record<string, any> = {}

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async init() {
    this.client = new NacosConfigClient({
      serverAddr: process.env.NACOS_SERVER!,
      namespace: process.env.NACOS_NAMESPACE!,
      username: process.env.NACOS_USERNAME!,
      password: process.env.NACOS_PASSWORD!
    })

    await this.client.ready()

    const content = await this.client.getConfig(
      process.env.NACOS_DATA_ID!,
      process.env.NACOS_GROUP || 'DEFAULT_GROUP'
    )

    this.updateCache(content)

    await this.client.subscribe(
      {
        dataId: process.env.NACOS_DATA_ID!,
        group: process.env.NACOS_GROUP!
      },
      (content: string) => {
        console.log('[Nacos] Config Changed')

        this.updateCache(content)

        // ✅ 发布事件
        this.eventEmitter.emit('config.changed', new ConfigChangedEvent(this.cache))
      }
    )
  }

  private updateCache(content: string) {
    try {
      this.cache = JSON.parse(content)
    } catch (e) {
      console.error('[Nacos] Invalid JSON format')
    }
  }

  get<T = any>(key: string): T {
    return this.cache[key]
  }

  getAll(): Record<string, any> {
    return this.cache
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close()
    }
  }
}
