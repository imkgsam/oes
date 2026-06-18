import { TaskEntity } from '../../domain/entities/task.entity'
import { TaskListScope, TaskPriority, TaskStatus } from '../../domain/value-objects/task.enums'

export type ListTasksInput = {
  tenantId: string
  operatorAccountId: string
  scope: TaskListScope
  statuses?: TaskStatus[]
  priorities?: TaskPriority[]
  dueBefore?: Date
  dueAfter?: Date
  keyword?: string
  overdueOnly?: boolean
  includeArchived?: boolean
  archivedOnly?: boolean
  page?: number
  pageSize?: number
  now?: Date
}

export type GetTaskInput = {
  tenantId: string
  taskId: string
  operatorAccountId: string
  now?: Date
}

export type TaskQueryItem = {
  task: TaskEntity
  overdue: boolean
}

export type ListTasksResult = {
  items: TaskQueryItem[]
  page: number
  pageSize: number
  total: number
}
