import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common'
import Redis from 'ioredis'
import {
  TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME,
  TerminalDeviceUnavailableEvent,
  TerminalDeviceUnavailableEventPublisher
} from '../../application/events'

@Injectable()
// RedisTerminalDeviceUnavailablePublisher publishes unavailable device facts to a cross-process Redis channel.
export class RedisTerminalDeviceUnavailablePublisher implements TerminalDeviceUnavailableEventPublisher, OnModuleDestroy {
  private readonly redis: Redis
  private readonly ownsRedisClient: boolean

  constructor(@Optional() redis?: Redis) {
    this.ownsRedisClient = !redis
    this.redis =
      redis ??
      new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        enableReadyCheck: false,
        db: parseInt(process.env.REDIS_DB || '0')
      })
  }

  async publish(event: TerminalDeviceUnavailableEvent): Promise<void> {
    await this.redis.publish(
      process.env.TERMINAL_DEVICE_UNAVAILABLE_REDIS_CHANNEL ||
        TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME,
      JSON.stringify({
        ...event,
        occurredAt: event.occurredAt.toISOString()
      })
    )
  }

  onModuleDestroy(): void {
    if (this.ownsRedisClient) {
      this.redis.disconnect()
    }
  }
}
