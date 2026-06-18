import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { TaskEntity, TaskListFilter, TaskListResult } from '../../domain/entities/task.entity'
import { TaskRepository } from '../../domain/repositories/task.repository'
import { TaskListScope, TaskPriority, TaskStatus, TaskVisibility } from '../../domain/value-objects/task.enums'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaTaskRepository persists and queries Task P1 aggregates in collaboration-service storage. */
@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(task: TaskEntity): Promise<TaskEntity> {
    const created = await this.prisma.collaborationTask.create({
      data: toPersistence(task)
    })
    return toDomain(created)
  }

  async save(task: TaskEntity): Promise<TaskEntity> {
    const saved = await this.prisma.collaborationTask.update({
      where: { id: task.id },
      data: toPersistence(task)
    })
    return toDomain(saved)
  }

  async findById(tenantId: string, taskId: string): Promise<TaskEntity | null> {
    const task = await this.prisma.collaborationTask.findFirst({
      where: { id: taskId, tenantId }
    })
    return task ? toDomain(task) : null
  }

  async list(filter: TaskListFilter): Promise<TaskListResult> {
    const page = Math.max(filter.page, 1)
    const pageSize = Math.max(filter.pageSize, 1)
    const where = buildWhere(filter)
    const [items, total] = await Promise.all([
      this.prisma.collaborationTask.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { dueAt: { sort: 'asc', nulls: 'last' } },
          { priority: 'desc' },
          { updatedAt: 'desc' },
          { id: 'asc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.collaborationTask.count({ where })
    ])

    return {
      items: items.map(toDomain),
      page,
      pageSize,
      total
    }
  }
}

/** buildWhere maps application query scope and filters to a structured Prisma where object. */
function buildWhere(filter: TaskListFilter): Prisma.CollaborationTaskWhereInput {
  const where: Prisma.CollaborationTaskWhereInput = {
    tenantId: filter.tenantId,
    ...buildScopeWhere(filter),
    ...(filter.statuses?.length ? { status: { in: filter.statuses } } : {}),
    ...(filter.priorities?.length ? { priority: { in: filter.priorities } } : {}),
    ...(filter.dueBefore || filter.dueAfter
      ? {
          dueAt: {
            ...(filter.dueBefore ? { lte: filter.dueBefore } : {}),
            ...(filter.dueAfter ? { gte: filter.dueAfter } : {})
          }
        }
      : {}),
    ...(filter.keyword
      ? {
          OR: [
            { title: { contains: filter.keyword, mode: 'insensitive' } },
            { description: { contains: filter.keyword, mode: 'insensitive' } }
          ]
        }
      : {})
  }

  if (filter.overdueOnly) {
    where.status = { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] }
    where.dueAt = { lt: filter.now }
  }

  if (filter.archivedOnly) {
    where.archivedAt = { not: null }
  } else if (!filter.includeArchived) {
    where.archivedAt = null
  }

  return where
}

/** buildScopeWhere maps Task P1 personal scopes to tenant-local participant filters. */
function buildScopeWhere(filter: TaskListFilter): Prisma.CollaborationTaskWhereInput {
  if (filter.scope === TaskListScope.MY_TODO) {
    return {
      createdByAccountId: filter.operatorAccountId,
      assigneeAccountId: filter.operatorAccountId,
      visibility: TaskVisibility.PRIVATE
    }
  }
  if (filter.scope === TaskListScope.ASSIGNED_TO_ME) {
    return {
      assigneeAccountId: filter.operatorAccountId,
      NOT: { createdByAccountId: filter.operatorAccountId }
    }
  }
  return {
    createdByAccountId: filter.operatorAccountId,
    NOT: { assigneeAccountId: filter.operatorAccountId }
  }
}

/** toPersistence maps a Task aggregate to Prisma write data without leaking Prisma into domain. */
function toPersistence(task: TaskEntity): Prisma.CollaborationTaskUncheckedCreateInput {
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

/** toDomain maps one Prisma task row to the Task aggregate. */
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
