import { BadRequestException } from '@nestjs/common'
import { attachVerifiedExecution, RPC_OPERATOR_CONTEXT_KEY } from '@oes/common/authorization'
import {
  TaskListScope as ProtoTaskListScope,
  TaskPriority as ProtoTaskPriority,
  TaskStatus as ProtoTaskStatus
} from '@oes/common/generated/collaboration_service'
import { TaskQueryService } from '../../src/application/services/task-query.service'
import { TaskEntity } from '../../src/domain/entities/task.entity'
import { TaskListScope, TaskPriority, TaskStatus, TaskVisibility } from '../../src/domain/value-objects/task.enums'
import { TaskQueryGrpcController } from '../../src/interfaces/grpc/task-query.grpc.controller'

const TENANT_ID = 'tenant-1'
const ACCOUNT_ID = 'account-1'
const TRACE_ID = 'trace-1'

describe('TaskQueryGrpcController', () => {
  let service: jest.Mocked<TaskQueryService>
  let controller: TaskQueryGrpcController

  beforeEach(() => {
    service = {
      listTasks: jest.fn(),
      getTask: jest.fn()
    } as unknown as jest.Mocked<TaskQueryService>
    controller = new TaskQueryGrpcController(service)
  })

  it('maps list scope and filters into the query service', async () => {
    service.listTasks.mockResolvedValue({
      items: [{ task: buildTask(), overdue: true }],
      page: 2,
      pageSize: 10,
      total: 1
    })

    const response = await controller.listTasks(trusted({
      scope: ProtoTaskListScope.TASK_LIST_SCOPE_ASSIGNED_TO_ME,
      status: [ProtoTaskStatus.TASK_STATUS_OPEN],
      priority: [ProtoTaskPriority.TASK_PRIORITY_HIGH],
      dueBefore: '2026-06-16T00:00:00.000Z',
      keyword: 'handoff',
      overdueOnly: true,
      includeArchived: false,
      archivedOnly: false,
      page: 2,
      pageSize: 10
    }))

    expect(service.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        operatorAccountId: ACCOUNT_ID,
        scope: TaskListScope.ASSIGNED_TO_ME,
        statuses: [TaskStatus.OPEN],
        priorities: [TaskPriority.HIGH],
        dueBefore: new Date('2026-06-16T00:00:00.000Z'),
        keyword: 'handoff',
        overdueOnly: true,
        page: 2,
        pageSize: 10
      })
    )
    expect(response).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 1,
      items: [{ taskId: 'task-1', overdue: true }]
    })
  })

  it('rejects list requests without a valid scope even with trusted context', async () => {
    await expect(
      controller.listTasks(trusted({}))
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(service.listTasks).not.toHaveBeenCalled()
  })
})

/** buildTask creates one aggregate returned by mocked query handlers. */
function buildTask(overrides: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}) {
  return new TaskEntity({
    id: 'task-1',
    tenantId: TENANT_ID,
    title: 'Prepare handoff',
    description: 'shift note',
    createdByAccountId: 'account-2',
    assigneeAccountId: ACCOUNT_ID,
    visibility: TaskVisibility.ASSIGNMENT_PARTICIPANTS,
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
    dueAt: new Date('2026-06-15T10:00:00.000Z'),
    startedAt: null,
    completedAt: null,
    completedByAccountId: null,
    completionNote: null,
    cancelledAt: null,
    cancelledByAccountId: null,
    cancelReason: null,
    archivedAt: null,
    archivedByAccountId: null,
    createdAt: new Date('2026-06-14T09:00:00.000Z'),
    updatedAt: new Date('2026-06-14T09:00:00.000Z'),
    ...overrides
  })
}

/** trusted binds verified execution claims as the guard does before controller invocation. */
function trusted<T extends object>(request: T): T {
  attachVerifiedExecution(request, {
    verifiedExecutionToken: { tenantId: TENANT_ID, subject: ACCOUNT_ID, principalType: 'HUMAN', sessionTerminal: 'WEB' } as any,
    verifiedWorkloadIdentity: {} as any
  })
  Object.assign((request as Record<string, unknown>)[RPC_OPERATOR_CONTEXT_KEY] as object, { traceId: TRACE_ID, requestId: 'request-1' })
  return request
}
