import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { NatsDurablePullRunner, type NatsDurablePullWorker } from '@oes/common'
import {
  CollaborationTaskEventConsumer,
  NOTIFICATION_COLLABORATION_TASK_CONSUMER_NAME
} from './collaboration-task-event.consumer'

/** Runs the single pre-provisioned Notification Collaboration Task durable and leaves all broker topology ownership outside the service. */
@Injectable()
export class NotificationCollaborationTaskEventWorker implements OnModuleInit, OnModuleDestroy {
  private worker: NatsDurablePullWorker | undefined

  /** Creates the worker with the shared pull runtime and Notification's typed delivery consumer. */
  constructor(
    private readonly runner: NatsDurablePullRunner,
    private readonly consumer: CollaborationTaskEventConsumer
  ) {}

  /** Starts only the exact durable configured by EV-3 after the shared NATS client lifecycle has initialized. */
  async onModuleInit(): Promise<void> {
    this.worker = this.runner.start({
      stream: 'OES_BUSINESS_EVENTS',
      consumer: NOTIFICATION_COLLABORATION_TASK_CONSUMER_NAME,
      expiresMs: 1_000,
      handle: async (delivery) => {
        await this.consumer.handleDelivery(delivery)
      }
    })
  }

  /** Stops bounded pulls before the shared runtime drains the ACL-scoped NATS connection. */
  async onModuleDestroy(): Promise<void> {
    await this.worker?.stop()
    this.worker = undefined
  }
}
