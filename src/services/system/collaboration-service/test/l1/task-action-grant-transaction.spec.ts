import { TaskEntity } from '../../src/domain/entities/task.entity'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../src/domain/value-objects/task.enums'
import { PrismaTaskCommandTransaction } from '../../src/infrastructure/prisma/prisma-task-command-transaction.repository'

const receipt = {
  tenantId: 'tenant-1',
  operatorAccountId: 'human-1',
  operationKey: 'collaboration.task.create-assigned.v1',
  idempotencyKey: 'idem-1',
  descriptorDigest: 'D'.repeat(43),
  actionGrantJti: '11111111-1111-4111-8111-111111111111',
  taskId: '22222222-2222-4222-8222-222222222222',
  resultReference: '22222222-2222-4222-8222-222222222222',
  delegationReference: '33333333-3333-4333-8333-333333333333',
  agentPrincipalId: 'agent-1',
  toolContractId: 'oes.ai.task-assistant.collaboration-task',
  toolContractVersion: '1.0.0',
  authorizationDecisionReference: 'decision-1'
}

describe('PrismaTaskCommandTransaction ActionGrant consumption', () => {
  it('returns the established Task for an identical idempotency retry without a second write', async () => {
    const existingTask = taskRow()
    const tx = transactionClient({
      receiptByIdempotency: { ...receipt, createdAt: new Date(), updatedAt: new Date() },
      existingTask
    })
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }
    const result = await new PrismaTaskCommandTransaction(prisma as never).commit(command())
    expect(result.id).toBe(existingTask.id)
    expect(tx.collaborationTask.create).not.toHaveBeenCalled()
    expect(tx.collaborationTaskAuditEnvelope.create).not.toHaveBeenCalled()
    expect(tx.collaborationTaskOutbox.create).not.toHaveBeenCalled()
  })

  it('ignores the fresh provisional Task id when resolving an identical retry', async () => {
    const existingTask = taskRow()
    const tx = transactionClient({
      receiptByIdempotency: { ...receipt, createdAt: new Date(), updatedAt: new Date() },
      existingTask
    })
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }

    const result = await new PrismaTaskCommandTransaction(prisma as never).commit(
      command('55555555-5555-4555-8555-555555555555')
    )

    expect(result.id).toBe(existingTask.id)
    expect(tx.collaborationTask.create).not.toHaveBeenCalled()
  })

  it('returns the established Task when the same descriptor is retried with a newly issued JTI', async () => {
    const existingTask = taskRow()
    const tx = transactionClient({
      receiptByIdempotency: { ...receipt, createdAt: new Date(), updatedAt: new Date() },
      existingTask
    })
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }
    const retried = command()
    retried.receipt.actionGrantJti = '66666666-6666-4666-8666-666666666666'

    const result = await new PrismaTaskCommandTransaction(prisma as never).commit(retried)

    expect(result.id).toBe(existingTask.id)
    expect(tx.collaborationTask.create).not.toHaveBeenCalled()
  })

  it('fails closed when the same idempotency key carries a changed descriptor', async () => {
    const tx = transactionClient({
      receiptByIdempotency: {
        ...receipt,
        descriptorDigest: 'X'.repeat(43),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      existingTask: taskRow()
    })
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }
    await expect(
      new PrismaTaskCommandTransaction(prisma as never).commit(command())
    ).rejects.toThrow('ACTION_GRANT_DESCRIPTOR_MISMATCH')
    expect(tx.collaborationTask.create).not.toHaveBeenCalled()
  })

  it('rejects reuse of the same ActionGrant JTI under another idempotency key', async () => {
    const tx = transactionClient({
      receiptByGrant: {
        ...receipt,
        idempotencyKey: 'other-idem',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      existingTask: taskRow()
    })
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }
    await expect(
      new PrismaTaskCommandTransaction(prisma as never).commit(command())
    ).rejects.toThrow('ACTION_GRANT_REPLAYED')
    expect(tx.collaborationTask.create).not.toHaveBeenCalled()
  })

  it('writes Task, existing audit/outbox, receipt and consumption in one local transaction', async () => {
    const tx = transactionClient({ existingTask: taskRow() })
    const prisma = {
      $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    }
    await new PrismaTaskCommandTransaction(prisma as never).commit(command())
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.collaborationTask.create).toHaveBeenCalledTimes(1)
    expect(tx.collaborationTaskAuditEnvelope.create).toHaveBeenCalledTimes(1)
    expect(tx.collaborationTaskOutbox.create).toHaveBeenCalledTimes(1)
    expect(tx.collaborationTaskCommandReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionGrantJti: receipt.actionGrantJti,
          descriptorDigest: receipt.descriptorDigest
        })
      })
    )
  })

  it('resolves a concurrent identical unique-key race to the committed idempotent result', async () => {
    const existingTask = taskRow()
    const prisma = {
      $transaction: jest.fn().mockRejectedValue({ code: 'P2002' }),
      collaborationTaskCommandReceipt: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ ...receipt, createdAt: new Date(), updatedAt: new Date() })
      },
      collaborationTask: { findUnique: jest.fn().mockResolvedValue(existingTask) }
    }
    const result = await new PrismaTaskCommandTransaction(prisma as never).commit(command())
    expect(result.id).toBe(existingTask.id)
    expect(prisma.collaborationTaskCommandReceipt.findUnique).toHaveBeenCalledTimes(1)
  })
})

/** Creates one Prisma-shaped transaction mock with configurable receipt lookup state. */
function transactionClient(input: {
  receiptByIdempotency?: unknown
  receiptByGrant?: unknown
  existingTask: ReturnType<typeof taskRow>
}) {
  return {
    collaborationTaskCommandReceipt: {
      findUnique: jest
        .fn()
        .mockImplementation(({ where }) =>
          where.actionGrantJti
            ? (input.receiptByGrant ?? null)
            : (input.receiptByIdempotency ?? null)
        ),
      create: jest.fn().mockResolvedValue({})
    },
    collaborationTask: {
      findUnique: jest.fn().mockResolvedValue(input.existingTask),
      create: jest.fn().mockResolvedValue(input.existingTask),
      update: jest.fn().mockResolvedValue(input.existingTask)
    },
    collaborationTaskAuditEnvelope: { create: jest.fn().mockResolvedValue({}) },
    collaborationTaskOutbox: { create: jest.fn().mockResolvedValue({}) }
  }
}

/** Builds one complete CREATE command retaining the existing TaskAssigned outbox fact. */
function command(taskId = receipt.taskId) {
  const task = new TaskEntity({
    id: taskId,
    tenantId: 'tenant-1',
    title: 'Assigned',
    description: null,
    createdByAccountId: 'human-1',
    assigneeAccountId: 'human-2',
    visibility: TaskVisibility.ASSIGNMENT_PARTICIPANTS,
    status: TaskStatus.OPEN,
    priority: TaskPriority.NORMAL,
    dueAt: null,
    startedAt: null,
    completedAt: null,
    completedByAccountId: null,
    completionNote: null,
    cancelledAt: null,
    cancelledByAccountId: null,
    cancelReason: null,
    archivedAt: null,
    archivedByAccountId: null,
    createdAt: new Date('2026-08-03T00:00:00Z'),
    updatedAt: new Date('2026-08-03T00:00:00Z')
  })
  return {
    operation: 'CREATE' as const,
    task,
    audit: {
      tenantId: 'tenant-1',
      taskId: task.id,
      action: 'TASK_CREATED' as const,
      result: 'SUCCEEDED' as const,
      operatorAccountId: 'human-1',
      createdByAccountId: 'human-1',
      assigneeAccountId: 'human-2',
      traceId: 'trace-1'
    },
    publicEvent: {
      id: '44444444-4444-4444-8444-444444444444',
      type: 'collaboration.task.assigned',
      source: 'urn:oes:service:collaboration-service',
      specversion: '1.0',
      time: '2026-08-03T00:00:00.000Z',
      datacontenttype: 'application/json',
      oeseventversion: 1,
      oestenantid: 'tenant-1',
      oesaggregatetype: 'TASK',
      oesaggregateid: task.id,
      oestraceid: 'trace-1',
      data: {}
    } as never,
    receipt: { ...receipt, taskId, resultReference: taskId }
  }
}

/** Builds the Prisma row returned for both first write and replay lookup. */
function taskRow() {
  return {
    id: receipt.taskId,
    tenantId: 'tenant-1',
    title: 'Assigned',
    description: null,
    createdByAccountId: 'human-1',
    assigneeAccountId: 'human-2',
    visibility: 'ASSIGNMENT_PARTICIPANTS',
    status: 'OPEN',
    priority: 'NORMAL',
    dueAt: null,
    startedAt: null,
    completedAt: null,
    completedByAccountId: null,
    completionNote: null,
    cancelledAt: null,
    cancelledByAccountId: null,
    cancelReason: null,
    archivedAt: null,
    archivedByAccountId: null,
    createdAt: new Date('2026-08-03T00:00:00Z'),
    updatedAt: new Date('2026-08-03T00:00:00Z')
  }
}
