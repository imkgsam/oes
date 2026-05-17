import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import Redis from 'ioredis'
import {
  TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME,
  TerminalDeviceUnavailableEvent
} from '../../application/events/terminal-device-unavailable.event'
import { HandleTerminalDeviceUnavailableCommand } from '../../application/commands/auth'
import { TERMINAL_DEVICE_UNAVAILABLE_REDIS_CLIENT } from '../../common/constants/injection-tokens'

@Injectable()
// TerminalDeviceUnavailableSubscriber consumes cross-process terminal-device unavailable facts and dispatches auth cleanup.
export class TerminalDeviceUnavailableSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(TERMINAL_DEVICE_UNAVAILABLE_REDIS_CLIENT)
    redis: Redis
  ) {
    this.redis = redis
  }

  async onModuleInit(): Promise<void> {
    await this.redis.subscribe(TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME)
    this.redis.on('message', (channel, message) => {
      if (channel !== TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME) {
        return
      }

      void this.handleMessage(message)
    })
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit()
  }

  async handle(event: TerminalDeviceUnavailableEvent): Promise<void> {
    await this.commandBus.execute(
      new HandleTerminalDeviceUnavailableCommand({
        tenantId: event.tenantId,
        terminalDeviceId: event.terminalDeviceId,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        reason: event.reason,
        traceId: event.traceId
      })
    )
  }

  private async handleMessage(message: string): Promise<void> {
    await this.handle(JSON.parse(message) as TerminalDeviceUnavailableEvent)
  }
}
