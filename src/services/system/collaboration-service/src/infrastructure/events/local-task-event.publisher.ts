import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { TaskFactEvent } from '../../application/events/task.events'
import { TaskEventPublisherPort } from '../../application/ports/task-event-publisher.port'
import { PrismaService } from '../prisma/prisma.service'

/** LocalTaskEventPublisher stores Task P1 facts as local event envelopes for downstream publication. */
@Injectable()
export class LocalTaskEventPublisher implements TaskEventPublisherPort {
  private readonly logger = new Logger(LocalTaskEventPublisher.name)

  constructor(private readonly prisma: PrismaService) {}

  /** publish persists one frozen Task P1 fact without dispatching notification workflows. */
  async publish(event: TaskFactEvent): Promise<void> {
    await this.prisma.collaborationTaskEventEnvelope.create({
      data: {
        id: event.eventId,
        eventType: event.eventType,
        occurredAt: new Date(event.occurredAt),
        tenantId: event.tenantId,
        taskId: event.taskId,
        actorAccountId: event.actorAccountId,
        createdByAccountId: event.createdByAccountId,
        assigneeAccountId: event.assigneeAccountId,
        status: event.status,
        previousStatus: event.previousStatus,
        priority: event.priority,
        dueAt: event.dueAt ? new Date(event.dueAt) : null,
        titleSnapshot: event.titleSnapshot,
        traceId: event.traceId,
        payload: event as unknown as Prisma.InputJsonValue
      }
    })
    this.logger.log(
      `Task fact recorded: type=${event.eventType}; tenantId=${event.tenantId}; taskId=${event.taskId}; traceId=${event.traceId ?? ''}`
    )
  }
}
