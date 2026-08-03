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
import { Metadata } from '@grpc/grpc-js'
import { attachVerifiedExecution } from '@oes/common/authorization'

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

  it('derives delegated HUMAN authority from verified execution and carries ActionGrant only from metadata', async () => {
    service.createTask.mockResolvedValue(buildTask({ createdByAccountId: 'human-1' }))
    const request = {
      tenantId: TENANT_ID,
      operatorContext: { accountId: 'body-spoof', userId: 'user-1', tenantId: TENANT_ID },
      traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
      auditContext: { auditId: AUDIT_ID, reason: 'delegated', source: 'ai-platform' },
      title: 'Prepare handoff',
      assigneeAccountId: 'account-2',
      idempotencyKey: 'idem-1'
    }
    attachVerifiedExecution(request, {
      verifiedExecutionToken: {
        issuer: 'https://auth.local.oes.example',
        audience: 'urn:oes:service:collaboration-service',
        subject: 'agent-1',
        principalType: 'DELEGATED',
        clientId: 'spiffe://local.oes/ai-platform',
        tenantId: TENANT_ID,
        permissionCodes: ['collaboration.task.assign'],
        tokenId: 'execution-1',
        issuedAt: 1,
        notBefore: 1,
        expiresAt: 300,
        certificateThumbprint: 'A'.repeat(43),
        actor: 'human-1',
        delegationId: 'delegation-1'
      },
      verifiedWorkloadIdentity: {
        spiffeId: 'spiffe://local.oes/ai-platform',
        certificateThumbprint: 'A'.repeat(43)
      }
    })
    const metadata = new Metadata()
    metadata.set('x-oes-action-grant', 'a.b.c')

    await controller.createTask(request, metadata)

    expect(service.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        operatorAccountId: 'human-1',
        idempotencyKey: 'idem-1',
        delegatedExecution: expect.objectContaining({ actionGrant: 'a.b.c' })
      })
    )
  })

  it('projects delegated execution onto AI-forbidden Task mutations for application enforcement', async () => {
    service.startTask.mockResolvedValue(buildTask())
    const request = {
      tenantId: TENANT_ID,
      operatorContext: { accountId: 'body-spoof', userId: 'user-1', tenantId: TENANT_ID },
      traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
      auditContext: { auditId: AUDIT_ID, reason: 'delegated', source: 'ai-platform' },
      taskId: 'task-1'
    }
    attachVerifiedExecution(request, {
      verifiedExecutionToken: {
        issuer: 'https://auth.local.oes.example',
        audience: 'urn:oes:service:collaboration-service',
        subject: 'agent-1',
        principalType: 'DELEGATED',
        clientId: 'spiffe://local.oes/ai-platform',
        tenantId: TENANT_ID,
        permissionCodes: [],
        tokenId: 'execution-1',
        issuedAt: 1,
        notBefore: 1,
        expiresAt: 300,
        certificateThumbprint: 'A'.repeat(43),
        actor: 'human-1',
        delegationId: 'delegation-1'
      },
      verifiedWorkloadIdentity: {
        spiffeId: 'spiffe://local.oes/ai-platform',
        certificateThumbprint: 'A'.repeat(43)
      }
    })
    await controller.startTask(request, new Metadata())
    expect(service.startTask).toHaveBeenCalledWith(
      expect.objectContaining({
        operatorAccountId: 'human-1',
        delegatedExecution: expect.any(Object)
      })
    )
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
