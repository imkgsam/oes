import type { OesCloudEvent } from '../cloud-events/types'
import type { EventConsumeOutcome } from '../contracts/ports'

/** Defines the only P1 replay mode accepted by common operations helpers. */
export type ReplayMode = 'SAFE_REDELIVERY'

/** Defines a consumer-owned, dual-approved, tenant-bounded replay request. */
export interface SafeRedeliveryRequest {
  readonly replayRunId: string
  readonly requestedBy: string
  readonly approvedByConsumerOwner: string
  readonly approvedByPlatformOperator: string
  readonly platformApprovalRef: string
  readonly consumerName: string
  readonly tenantScope: readonly string[]
  readonly eventFilter: { readonly eventTypes?: readonly string[]; readonly eventIds?: readonly string[]; readonly fromSequence?: number; readonly fromTime?: string }
  readonly mode: ReplayMode
  readonly reason: string
  readonly allowExternalSideEffects: false
}

/** Defines the frozen Notification Task subjects that need independent JetStream replay progress. */
const NOTIFICATION_TASK_REPLAY_BINDINGS = [
  { eventType: 'collaboration.task.assigned', suffix: 'assigned' },
  { eventType: 'collaboration.task.completed', suffix: 'completed' },
  { eventType: 'collaboration.task.cancelled', suffix: 'cancelled' }
] as const

/** Builds three single-subject run durables so broker ACLs can constrain each approved Task fact. */
export function createSafeRedeliveryConsumerSpecs(request: SafeRedeliveryRequest): readonly { readonly durableName: string; readonly filterSubjects: readonly [string]; readonly start: { readonly sequence?: number; readonly time?: string } }[] {
  validateSafeRedeliveryRequest(request)
  assertNotificationTaskReplayRequest(request)
  const start = { sequence: request.eventFilter.fromSequence, time: request.eventFilter.fromTime }
  return NOTIFICATION_TASK_REPLAY_BINDINGS.map(({ eventType, suffix }) => ({
    durableName: `notification-service__replay__${request.replayRunId}__${suffix}`,
    filterSubjects: [`oes.events.${eventType}`] as [string],
    start
  }))
}

/** Runs a bounded SAFE_REDELIVERY input through the existing typed handler without any republish path. */
export async function runSafeRedelivery<TData>(input: {
  readonly request: SafeRedeliveryRequest
  readonly messages: readonly OesCloudEvent<TData>[]
  readonly handle: (event: OesCloudEvent<TData>) => Promise<EventConsumeOutcome>
}): Promise<{ readonly scanned: number; readonly handled: number; readonly skipped: number; readonly outcomes: readonly EventConsumeOutcome['kind'][] }> {
  validateSafeRedeliveryRequest(input.request)
  let handled = 0
  const outcomes: EventConsumeOutcome['kind'][] = []
  for (const event of input.messages) {
    if (!matchesReplayFilter(event, input.request)) continue
    outcomes.push((await input.handle(event)).kind)
    handled += 1
  }
  return { scanned: input.messages.length, handled, skipped: input.messages.length - handled, outcomes }
}

/** Rejects global, unapproved, rebuild-mode, or external-side-effect replay requests before provider work begins. */
export function validateSafeRedeliveryRequest(request: SafeRedeliveryRequest): void {
  for (const value of [request.replayRunId, request.requestedBy, request.approvedByConsumerOwner, request.approvedByPlatformOperator, request.platformApprovalRef, request.consumerName, request.reason]) {
    if (!value?.trim()) throw new Error('REPLAY_REQUIRED_FIELD_MISSING')
  }
  if (request.mode !== 'SAFE_REDELIVERY' || request.allowExternalSideEffects !== false) throw new Error('REPLAY_MODE_NOT_ALLOWED')
  if (request.tenantScope.length === 0 || request.tenantScope.some((tenantId) => !tenantId.trim())) throw new Error('REPLAY_TENANT_SCOPE_REQUIRED')
  const filter = request.eventFilter
  if (!(filter.eventTypes?.length || filter.eventIds?.length || filter.fromSequence || filter.fromTime)) throw new Error('REPLAY_EVENT_FILTER_REQUIRED')
  if (filter.fromSequence !== undefined && (!Number.isInteger(filter.fromSequence) || filter.fromSequence < 1)) throw new Error('REPLAY_SEQUENCE_INVALID')
}

/** Limits replay to approved tenant and event filters before the consumer's normal typed handler runs. */
function matchesReplayFilter(event: OesCloudEvent, request: SafeRedeliveryRequest): boolean {
  const filter = request.eventFilter
  return request.tenantScope.includes(event.oestenantid)
    && (!filter.eventTypes?.length || filter.eventTypes.includes(event.type))
    && (!filter.eventIds?.length || filter.eventIds.includes(event.id))
}

/** Rejects a partial or generic replay shape because P1 ACLs authorize exactly the frozen Task triple. */
function assertNotificationTaskReplayRequest(request: SafeRedeliveryRequest): void {
  if (request.consumerName !== 'notification-service__collaboration-task__v1')
    throw new Error('REPLAY_CONSUMER_NOT_APPROVED')
  const eventTypes = request.eventFilter.eventTypes ?? []
  if (
    eventTypes.length !== NOTIFICATION_TASK_REPLAY_BINDINGS.length ||
    eventTypes.some((eventType, index) => eventType !== NOTIFICATION_TASK_REPLAY_BINDINGS[index].eventType)
  ) {
    throw new Error('REPLAY_SUBJECTS_NOT_APPROVED')
  }
}
