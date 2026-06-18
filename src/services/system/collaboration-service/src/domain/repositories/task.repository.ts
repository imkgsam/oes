import { TaskEntity, TaskListFilter, TaskListResult } from '../entities/task.entity'

/** TaskRepository persists and queries Task P1 records inside collaboration-service. */
export interface TaskRepository {
  create(task: TaskEntity): Promise<TaskEntity>
  save(task: TaskEntity): Promise<TaskEntity>
  findById(tenantId: string, taskId: string): Promise<TaskEntity | null>
  list(filter: TaskListFilter): Promise<TaskListResult>
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY')
