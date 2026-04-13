import { randomUUID } from 'node:crypto'

export type AuditResult = 'SUCCEEDED' | 'REJECTED' | 'FAILED'

export type AuditOperatorType = 'HUMAN' | 'SYSTEM'

export interface AuditOperator {
  operatorId: string | null
  operatorType: AuditOperatorType
}

export interface AuditScope {
  tenantId: string | null
  orgId: string | null
}

export interface AuditTrace {
  traceId: string | null
}

export interface AuditResource {
  resourceType: string
  resourceId: string | null
}

export interface AuditEnvelope<
  TService extends string = string,
  TModule extends string = string,
  TEventType extends string = string,
  TDetails extends Record<string, unknown> = Record<string, unknown>
> {
  eventId: string
  service: TService
  module: TModule
  eventType: TEventType
  occurredAt: Date
  result: AuditResult
  operator: AuditOperator
  scope: AuditScope
  trace: AuditTrace
  resource: AuditResource
  details: TDetails
}

export interface BuildAuditEnvelopeInput<
  TService extends string,
  TModule extends string,
  TEventType extends string,
  TDetails extends Record<string, unknown>
> {
  eventId?: string
  service: TService
  module: TModule
  eventType: TEventType
  occurredAt?: Date
  result?: AuditResult
  operator: AuditOperator
  scope: AuditScope
  trace: AuditTrace
  resource: AuditResource
  details: TDetails
}

export function buildAuditEnvelope<
  TService extends string,
  TModule extends string,
  TEventType extends string,
  TDetails extends Record<string, unknown>
>(
  input: BuildAuditEnvelopeInput<TService, TModule, TEventType, TDetails>
): AuditEnvelope<TService, TModule, TEventType, TDetails> {
  return {
    eventId: input.eventId ?? randomUUID(),
    service: input.service,
    module: input.module,
    eventType: input.eventType,
    occurredAt: input.occurredAt ?? new Date(),
    result: input.result ?? 'SUCCEEDED',
    operator: input.operator,
    scope: input.scope,
    trace: input.trace,
    resource: input.resource,
    details: input.details
  }
}

export interface FlatAuditEnvelopeRecord {
  eventId: string
  service: string
  module: string
  eventType: string
  occurredAt: Date
  result: AuditResult
  operatorId: string | null
  operatorType: AuditOperatorType
  tenantId: string | null
  orgId: string | null
  traceId: string | null
  resourceType: string
  resourceId: string | null
  details: Record<string, unknown>
}

export function flattenAuditEnvelope(
  envelope: AuditEnvelope<string, string, string, Record<string, unknown>>
): FlatAuditEnvelopeRecord {
  return {
    eventId: envelope.eventId,
    service: envelope.service,
    module: envelope.module,
    eventType: envelope.eventType,
    occurredAt: envelope.occurredAt,
    result: envelope.result,
    operatorId: envelope.operator.operatorId,
    operatorType: envelope.operator.operatorType,
    tenantId: envelope.scope.tenantId,
    orgId: envelope.scope.orgId,
    traceId: envelope.trace.traceId,
    resourceType: envelope.resource.resourceType,
    resourceId: envelope.resource.resourceId,
    details: envelope.details
  }
}
