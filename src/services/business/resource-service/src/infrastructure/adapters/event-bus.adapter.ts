import { Injectable } from '@nestjs/common'
import { IDomainEventPort } from '../../domain/ports/domain.ports'
import { DomainEvent } from '../../domain/events/domain.event'

/**
 * 事件总线适配器
 *
 * 职责：
 * 1. 实现域名事件的发布功能
 * 2. 提供事件序列化和传输
 * 3. 支持批量事件发布
 * 4. 处理事件发布失败
 *
 * 设计原则：
 * - 单一职责：专注于事件发布
 * - 可靠性：确保事件不丢失
 * - 性能：支持批量操作
 * - 可扩展性：支持多种事件总线实现
 *
 * 注意：当前实现为内存版本，生产环境应集成真实的事件总线
 */
@Injectable()
export class EventBusAdapter implements IDomainEventPort {
  private readonly eventHandlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> =
    new Map()

  async publishDomainEvent(event: DomainEvent): Promise<boolean> {
    try {
      console.log('Publishing domain event:', {
        eventType: event.eventType,
        eventId: event.id,
        occurredAt: event.occurredAt,
        payload: event.payload
      })

      // 序列化事件
      const serializedEvent = event.toJSON()

      // 发布到事件总线（当前为控制台输出，实际应发送到消息队列）
      await this.sendToEventBus(serializedEvent)

      // 触发本地事件处理器
      await this.triggerLocalHandlers(event)

      return true
    } catch (error) {
      console.error('Failed to publish domain event:', error)
      return false
    }
  }

  async publishDomainEvents(events: DomainEvent[]): Promise<boolean> {
    if (events.length === 0) {
      return true
    }

    try {
      console.log(`Publishing ${events.length} domain events`)

      // 批量序列化事件
      const serializedEvents = events.map((event) => event.toJSON())

      // 批量发送到事件总线
      await this.sendBatchToEventBus(serializedEvents)

      // 批量触发本地事件处理器
      await Promise.all(events.map((event) => this.triggerLocalHandlers(event)))

      return true
    } catch (error) {
      console.error('Failed to publish domain events:', error)
      return false
    }
  }

  /**
   * 注册事件处理器
   * 用于本地事件处理（如缓存更新、通知发送等）
   */
  registerEventHandler(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  /**
   * 移除事件处理器
   */
  unregisterEventHandler(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 发送事件到事件总线
   * 当前实现为控制台输出，实际应发送到消息队列（如RabbitMQ、Kafka等）
   */
  private async sendToEventBus(serializedEvent: string): Promise<void> {
    // TODO: 集成真实的事件总线
    // 例如：await this.rabbitmqService.publish('domain.events', serializedEvent)
    // 或者：await this.kafkaService.send('domain-events', serializedEvent)

    console.log('Event sent to event bus:', serializedEvent)

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  /**
   * 批量发送事件到事件总线
   */
  private async sendBatchToEventBus(serializedEvents: string[]): Promise<void> {
    // TODO: 集成真实的事件总线批量发送
    // 例如：await this.rabbitmqService.publishBatch('domain.events', serializedEvents)

    console.log(`Batch events sent to event bus: ${serializedEvents.length} events`)

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  /**
   * 触发本地事件处理器
   */
  private async triggerLocalHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.eventType)
    if (handlers && handlers.length > 0) {
      await Promise.all(
        handlers.map(async (handler) => {
          try {
            await handler(event)
          } catch (error) {
            console.error(`Event handler failed for ${event.eventType}:`, error)
          }
        })
      )
    }
  }

  /**
   * 获取事件统计信息
   */
  getEventStatistics(): {
    totalEventTypes: number
    totalHandlers: number
    eventTypes: string[]
  } {
    const eventTypes = Array.from(this.eventHandlers.keys())
    const totalHandlers = Array.from(this.eventHandlers.values()).reduce(
      (sum, handlers) => sum + handlers.length,
      0
    )

    return {
      totalEventTypes: eventTypes.length,
      totalHandlers,
      eventTypes
    }
  }

  /**
   * 清空所有事件处理器
   * 主要用于测试
   */
  clearEventHandlers(): void {
    this.eventHandlers.clear()
  }
}
