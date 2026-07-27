import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  createOesCloudEvent,
  type SafeRedeliveryRequest
} from '@oes/common'
import { NotificationEventOperationsService } from '../../src/infrastructure/events/operations/notification-event-operations.service'
import { NotificationSafeRedeliveryJob } from '../../src/infrastructure/events/operations/notification-safe-redelivery.job'

/** Verifies the one-off replay job reuses Notification's typed handler and never gains a business-event publish path. */
describe('NotificationSafeRedeliveryJob L1', () => {
  it('passes the three exact frozen subjects and the existing typed handler to the shared run-scoped runtime', async () => {
    const audits: string[] = []
    const repository: any = {
      ensureReplay: async (record: any) => ({ record, created: true }),
      recordReplayPull: async (_record: any, outcome: string) => audits.push(outcome),
      completeReplay: async () => audits.push('COMPLETE'),
      failReplay: async () => undefined
    }
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: 'evt-replay-1',
      occurredAt: '2026-07-27T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'creator-1',
        assigneeAccountId: 'assignee-1',
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Replay handler reuse'
      }
    })
    const handlerCalls: string[] = []
    const runtimeCalls: any[] = []
    const runner = {
      runOnce: async (input: any) => {
        runtimeCalls.push(input)
        if (runtimeCalls.length === 1) await input.handle(event)
        return { kind: runtimeCalls.length === 1 ? 'ACKED' : 'EMPTY' }
      }
    }
    const job = new NotificationSafeRedeliveryJob(
      new NotificationEventOperationsService(repository),
      runner as any,
      { handle: async (received: any) => { handlerCalls.push(received.id); return { kind: 'DUPLICATE' as const } } } as any
    )

    await job.execute({
      trustedOperator: { accountId: 'operator-1', authorizedTenantIds: ['tenant-1'] },
      request: replayRequest(),
      maximumPulls: 8
    })

    expect(handlerCalls).toEqual(['evt-replay-1'])
    expect(runtimeCalls[0]).toMatchObject({
      stream: 'OES_BUSINESS_EVENTS',
      approvedSubjects: [
        'oes.events.collaboration.task.assigned',
        'oes.events.collaboration.task.completed',
        'oes.events.collaboration.task.cancelled'
      ]
    })
    expect(audits).toEqual(['ACKED', 'EMPTY', 'EMPTY', 'EMPTY', 'COMPLETE'])
  })
})

/** Builds the accepted request shape used by the operations-only runner. */
function replayRequest(): SafeRedeliveryRequest {
  return {
    replayRunId: 'run-job-1',
    requestedBy: 'operator-1',
    approvedByConsumerOwner: 'notification-owner-1',
    approvedByPlatformOperator: 'platform-operator-1',
    platformApprovalRef: 'approval-1',
    consumerName: 'notification-service__collaboration-task__v1',
    tenantScope: ['tenant-1'],
    eventFilter: {
      eventTypes: [
        'collaboration.task.assigned',
        'collaboration.task.completed',
        'collaboration.task.cancelled'
      ],
      fromSequence: 1
    },
    mode: 'SAFE_REDELIVERY',
    reason: 'operator-approved repair',
    allowExternalSideEffects: false
  }
}
