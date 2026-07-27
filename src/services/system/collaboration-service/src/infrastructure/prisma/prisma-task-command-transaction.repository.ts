import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { TaskCommandTransactionPort } from '../../application/ports/task-command-transaction.port'
import { TaskEntity } from '../../domain/entities/task.entity'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../domain/value-objects/task.enums'
import { PrismaService } from './prisma.service'

/** Commits Collaboration Task state, mandatory audit, and optional immutable public outbox material atomically. */
@Injectable()
export class PrismaTaskCommandTransaction implements TaskCommandTransactionPort {
  constructor(private readonly prisma: PrismaService) {}

  /** commit uses one Collaboration database transaction and never publishes to a broker inside it. */
  async commit(input: Parameters<TaskCommandTransactionPort['commit']>[0]): Promise<TaskEntity> {
    return this.prisma.$transaction(async (transaction) => {
      const task = input.operation === 'CREATE'
        ? await transaction.collaborationTask.create({ data: taskPersistence(input.task) })
        : await transaction.collaborationTask.update({ where: { id: input.task.id }, data: taskPersistence(input.task) })
      await transaction.collaborationTaskAuditEnvelope.create({
        data: {
          tenantId: input.audit.tenantId,
          taskId: input.audit.taskId,
          action: input.audit.action,
          result: input.audit.result,
          operatorAccountId: input.audit.operatorAccountId,
          createdByAccountId: input.audit.createdByAccountId,
          assigneeAccountId: input.audit.assigneeAccountId,
          traceId: input.audit.traceId,
          auditId: input.audit.auditId,
          reasonSnapshot: input.audit.reasonSnapshot,
          payload: input.audit.payload as Prisma.InputJsonValue | undefined
        }
      })
      if (input.publicEvent) {
        await transaction.collaborationTaskOutbox.create({
          data: {
            eventId: input.publicEvent.id,
            eventType: input.publicEvent.type,
            eventVersion: input.publicEvent.oeseventversion,
            ownerService: ownerFromSource(input.publicEvent.source),
            tenantId: input.publicEvent.oestenantid,
            aggregateType: input.publicEvent.oesaggregatetype,
            aggregateId: input.publicEvent.oesaggregateid,
            occurredAt: new Date(input.publicEvent.time),
            cloudEventBody: input.publicEvent as unknown as Prisma.InputJsonValue
          }
        })
      }
      return toDomain(task)
    })
  }
}

/** taskPersistence maps a Task aggregate to transaction-local Prisma write data without leaking Prisma into domain. */
function taskPersistence(task: TaskEntity): Prisma.CollaborationTaskUncheckedCreateInput {
  const snapshot = task.snapshot()
  return {
    id: snapshot.id,
    tenantId: snapshot.tenantId,
    title: snapshot.title,
    description: snapshot.description,
    createdByAccountId: snapshot.createdByAccountId,
    assigneeAccountId: snapshot.assigneeAccountId,
    visibility: snapshot.visibility,
    status: snapshot.status,
    priority: snapshot.priority,
    dueAt: snapshot.dueAt,
    startedAt: snapshot.startedAt,
    completedAt: snapshot.completedAt,
    completedByAccountId: snapshot.completedByAccountId,
    completionNote: snapshot.completionNote,
    cancelledAt: snapshot.cancelledAt,
    cancelledByAccountId: snapshot.cancelledByAccountId,
    cancelReason: snapshot.cancelReason,
    archivedAt: snapshot.archivedAt,
    archivedByAccountId: snapshot.archivedByAccountId,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt
  }
}

/** ownerFromSource extracts the stable service identity after the common builder has already validated it. */
function ownerFromSource(source: string): string {
  const prefix = 'urn:oes:service:'
  if (!source.startsWith(prefix) || source.length === prefix.length) {
    throw new Error('public event source must be a stable OES service URN')
  }
  return source.slice(prefix.length)
}

/** toDomain maps a transaction-persisted Prisma Task row back to the domain aggregate. */
function toDomain(task: Prisma.CollaborationTaskGetPayload<Record<string, never>>): TaskEntity {
  return new TaskEntity({
    id: task.id,
    tenantId: task.tenantId,
    title: task.title,
    description: task.description,
    createdByAccountId: task.createdByAccountId,
    assigneeAccountId: task.assigneeAccountId,
    visibility: task.visibility as TaskVisibility,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    dueAt: task.dueAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    completedByAccountId: task.completedByAccountId,
    completionNote: task.completionNote,
    cancelledAt: task.cancelledAt,
    cancelledByAccountId: task.cancelledByAccountId,
    cancelReason: task.cancelReason,
    archivedAt: task.archivedAt,
    archivedByAccountId: task.archivedByAccountId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  })
}
