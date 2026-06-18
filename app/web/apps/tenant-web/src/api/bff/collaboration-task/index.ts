import { requestClient } from '#/api/request'

import { buildCollaborationTaskListQuery } from './query'

export { buildCollaborationTaskListQuery } from './query'

export namespace CollaborationTaskApi {
  export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  export type TaskScope = 'MY_TODO' | 'ASSIGNED_TO_ME' | 'CREATED_BY_ME'
  export type TaskVisibility = 'PRIVATE' | 'ASSIGNMENT_PARTICIPANTS'

  export interface TaskView {
    taskId: string
    tenantId: string
    title: string
    description?: string
    createdByAccountId: string
    assigneeAccountId: string
    visibility: TaskVisibility | string
    status: TaskStatus | string
    priority: TaskPriority | string
    dueAt?: string
    overdue?: boolean
    startedAt?: string
    completedAt?: string
    completedByAccountId?: string
    completionNote?: string
    cancelledAt?: string
    cancelledByAccountId?: string
    cancelReason?: string
    archivedAt?: string
    archivedByAccountId?: string
    createdAt: string
    updatedAt: string
  }

  export interface ListTasksQuery {
    scope: TaskScope
    status?: TaskStatus[]
    priority?: TaskPriority[]
    dueBefore?: string
    dueAfter?: string
    keyword?: string
    overdueOnly?: boolean
    includeArchived?: boolean
    archivedOnly?: boolean
    page?: number
    pageSize?: number
  }

  export interface ListTasksResult {
    items: TaskView[]
    page: number
    pageSize: number
    total: number
  }

  export interface TaskResponse {
    task: TaskView
  }

  export interface CreateTaskPayload {
    title: string
    description?: string
    assigneeAccountId?: string
    dueAt?: string
    priority?: TaskPriority
  }

  export interface UpdateTaskPayload {
    title?: string
    description?: string
    dueAt?: string
    priority?: TaskPriority
  }
}

const taskBase = (tenantId: string) =>
  `/collaboration/tenants/${encodeURIComponent(tenantId)}/tasks`

/** listCollaborationTasksApi lists Task P1 personal workspace rows through the Gateway BFF. */
export async function listCollaborationTasksApi(
  tenantId: string,
  params: CollaborationTaskApi.ListTasksQuery
) {
  return requestClient.get<CollaborationTaskApi.ListTasksResult>(
    `${taskBase(tenantId)}?${buildCollaborationTaskListQuery(params)}`
  )
}

/** createCollaborationTaskApi creates either a private self todo or an assigned task. */
export async function createCollaborationTaskApi(
  tenantId: string,
  data: CollaborationTaskApi.CreateTaskPayload
) {
  return requestClient.post<CollaborationTaskApi.TaskResponse>(taskBase(tenantId), data)
}

/** updateCollaborationTaskApi updates creator-owned Task P1 basics. */
export async function updateCollaborationTaskApi(
  tenantId: string,
  taskId: string,
  data: CollaborationTaskApi.UpdateTaskPayload
) {
  return requestClient.request<CollaborationTaskApi.TaskResponse>(
    `${taskBase(tenantId)}/${encodeURIComponent(taskId)}`,
    { data, method: 'PATCH' }
  )
}

/** startCollaborationTaskApi moves one open task to in progress. */
export async function startCollaborationTaskApi(tenantId: string, taskId: string) {
  return requestClient.post<CollaborationTaskApi.TaskResponse>(
    `${taskBase(tenantId)}/${encodeURIComponent(taskId)}/start`,
    {}
  )
}

/** completeCollaborationTaskApi marks one task completed with an optional note. */
export async function completeCollaborationTaskApi(
  tenantId: string,
  taskId: string,
  data: { completionNote?: string }
) {
  return requestClient.post<CollaborationTaskApi.TaskResponse>(
    `${taskBase(tenantId)}/${encodeURIComponent(taskId)}/complete`,
    data
  )
}

/** cancelCollaborationTaskApi cancels one creator-owned active task. */
export async function cancelCollaborationTaskApi(
  tenantId: string,
  taskId: string,
  data: { cancelReason?: string }
) {
  return requestClient.post<CollaborationTaskApi.TaskResponse>(
    `${taskBase(tenantId)}/${encodeURIComponent(taskId)}/cancel`,
    data
  )
}

/** reopenCollaborationTaskApi reopens one terminal unarchived task. */
export async function reopenCollaborationTaskApi(
  tenantId: string,
  taskId: string,
  data: { reopenReason?: string }
) {
  return requestClient.post<CollaborationTaskApi.TaskResponse>(
    `${taskBase(tenantId)}/${encodeURIComponent(taskId)}/reopen`,
    data
  )
}

/** archiveCollaborationTaskApi archives one terminal creator-owned task. */
export async function archiveCollaborationTaskApi(tenantId: string, taskId: string) {
  return requestClient.post<CollaborationTaskApi.TaskResponse>(
    `${taskBase(tenantId)}/${encodeURIComponent(taskId)}/archive`,
    {}
  )
}

/** unarchiveCollaborationTaskApi clears archive markers on one creator-owned task. */
export async function unarchiveCollaborationTaskApi(tenantId: string, taskId: string) {
  return requestClient.post<CollaborationTaskApi.TaskResponse>(
    `${taskBase(tenantId)}/${encodeURIComponent(taskId)}/unarchive`,
    {}
  )
}
