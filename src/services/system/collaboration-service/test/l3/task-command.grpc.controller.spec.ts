import { BadRequestException } from '@nestjs/common'
import {
  TaskPriority as ProtoTaskPriority,
  TaskStatus as ProtoTaskStatus,
  TaskVisibility as ProtoTaskVisibility
} from '@oes/common/generated/collaboration_service'
import { TaskCommandService } from '../../src/application/services/task-command.service'
import { TaskEntity } from '../../src/domain/entities/task.entity'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../src/domain/value-objects/task.enums'
import { TaskCommandGrpcController } from '../../src/interfaces/grpc/task-command.grpc.controller'

const TENANT_ID = 'tenant-1'
const ACCOUNT_ID = 'account-1'
const TRACE_ID = 'trace-1'
const AUDIT_ID = 'audit-1'

describe('TaskCommandGrpcController', () => {
  let service: jest.Mocked<TaskCommandService>
  let controller: TaskCommandGrpcController

  beforeEach(() => {
    service = {
      createTask: jest.fn(),
      updateTask: jest.fn(),
      startTask: jest.fn(),
      completeTask: jest.fn(),
      cancelTask: jest.fn(),
      reopenTask: jest.fn(),
      archiveTask: jest.fn(),
      unarchiveTask: jest.fn()
    } as unknown as jest.Mocked<TaskCommandService>
    controller = new TaskCommandGrpcController(service)
  })

  it('rejects command requests that omit audit context', async () => {
    await expect(
      controller.createTask({
        tenantId: TENANT_ID,
        operatorContext: { accountId: ACCOUNT_ID, userId: 'user-1', tenantId: TENANT_ID },
        traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
        title: 'Prepare handoff'
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(service.createTask).not.toHaveBeenCalled()
  })

  it('maps CreateTask into the application command and presents the saved task', async () => {
    service.createTask.mockResolvedValue(buildTask())

    const response = await controller.createTask({
      tenantId: TENANT_ID,
      operatorContext: { accountId: ACCOUNT_ID, userId: 'user-1', tenantId: TENANT_ID },
      traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
      auditContext: { auditId: AUDIT_ID, reason: 'manual', source: 'tenant-web' },
      title: 'Prepare handoff',
      description: 'shift note',
      assigneeAccountId: 'account-2',
      priority: ProtoTaskPriority.TASK_PRIORITY_HIGH,
      dueAt: '2026-06-15T10:00:00.000Z'
    })

    expect(service.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        operatorAccountId: ACCOUNT_ID,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        title: 'Prepare handoff',
        description: 'shift note',
        assigneeAccountId: 'account-2',
        priority: TaskPriority.HIGH,
        dueAt: new Date('2026-06-15T10:00:00.000Z')
      })
    )
    expect(response.task).toMatchObject({
      taskId: 'task-1',
      visibility: ProtoTaskVisibility.TASK_VISIBILITY_ASSIGNMENT_PARTICIPANTS,
      status: ProtoTaskStatus.TASK_STATUS_OPEN,
      priority: ProtoTaskPriority.TASK_PRIORITY_HIGH
    })
  })
})

/** buildTask creates one aggregate returned by mocked command handlers. */
function buildTask(overrides: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}) {
  return new TaskEntity({
    id: 'task-1',
    tenantId: TENANT_ID,
    title: 'Prepare handoff',
    description: 'shift note',
    createdByAccountId: ACCOUNT_ID,
    assigneeAccountId: 'account-2',
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
