import { createOesCloudEvent, decodeCloudEvent } from '../../events'
import {
  COLLABORATION_SERVICE_EVENT_OWNER,
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
  COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT,
  COLLABORATION_TASK_EVENT_CONTRACTS,
  type CollaborationTaskAssignedEventData,
} from './events'

/** Verifies the frozen Collaboration Task event descriptors shared by producers and consumers. */
describe('Collaboration Task event contracts', () => {
  const assignedData: CollaborationTaskAssignedEventData = {
    taskId: 'task-1',
    createdByAccountId: 'account-creator',
    assigneeAccountId: 'account-assignee',
    status: 'OPEN',
    previousStatus: null,
    priority: 'HIGH',
    dueAt: null,
    titleSnapshot: 'Frozen task title',
  }

  it('exposes exactly the three frozen owner descriptors with CloudEvents business version 1', () => {
    expect(COLLABORATION_SERVICE_EVENT_OWNER).toBe('collaboration-service')
    expect(COLLABORATION_TASK_EVENT_CONTRACTS).toEqual([
      COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT,
      COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
    ])
    expect(COLLABORATION_TASK_EVENT_CONTRACTS.map((contract) => [contract.eventType, contract.eventVersion, contract.ownerService])).toEqual([
      ['collaboration.task.assigned', 1, 'collaboration-service'],
      ['collaboration.task.completed', 1, 'collaboration-service'],
      ['collaboration.task.cancelled', 1, 'collaboration-service'],
    ])
  })

  it('lets a producer build and a consumer decode the same typed assigned contract', () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: 'event-1',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: assignedData.taskId,
      actorAccountId: 'account-creator',
      traceId: 'trace-1',
      data: assignedData,
    })

    expect(decodeCloudEvent(Buffer.from(JSON.stringify(event)), COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT)).toEqual(event)
  })

  it('rejects an embedded .v1 type and schema_version payload substitute', () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: 'event-2',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: assignedData.taskId,
      traceId: 'trace-1',
      data: assignedData,
    })

    expect(() => decodeCloudEvent(Buffer.from(JSON.stringify({ ...event, type: 'collaboration.task.assigned.v1' })), COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT)).toThrow('EVENT_TYPE_MISMATCH')
    expect(COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT.validateData({ ...assignedData, schema_version: 1 })).toBe(false)
  })

  it('accepts only the frozen completed and cancelled transition data', () => {
    expect(COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT.validateData({
      ...assignedData,
      status: 'COMPLETED',
      previousStatus: 'IN_PROGRESS',
      completedByAccountId: 'account-assignee',
      completedAt: '2026-07-26T08:00:00.000Z',
    })).toBe(true)
    expect(COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT.validateData({
      ...assignedData,
      status: 'CANCELLED',
      previousStatus: 'OPEN',
      cancelledByAccountId: 'account-creator',
      cancelledAt: '2026-07-26T08:00:00.000Z',
      cancelReasonSnapshot: null,
    })).toBe(true)
    expect(COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT.validateData({
      ...assignedData,
      status: 'COMPLETED',
      previousStatus: null,
      completedByAccountId: 'account-assignee',
      completedAt: '2026-07-26T08:00:00.000Z',
    })).toBe(false)
  })
})
