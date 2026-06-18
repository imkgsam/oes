import { AuditResult, buildAuditEnvelope } from '@oes/common'

export interface BuildSiteAuditEnvelopeInput {
  module: string
  eventType: string
  result: AuditResult
  operatorId: string | null
  tenantId: string | null
  orgId: string | null
  traceId: string | null
  resourceType: string
  resourceId: string | null
  details: Record<string, unknown>
  occurredAt?: Date
}

/** buildSiteAuditEnvelope creates the site-service audit envelope used by command audit writers. */
export function buildSiteAuditEnvelope(input: BuildSiteAuditEnvelopeInput) {
  return buildAuditEnvelope({
    service: 'site-service',
    module: input.module,
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    result: input.result,
    operator: {
      operatorId: input.operatorId,
      operatorType: input.operatorId ? 'HUMAN' : 'SYSTEM'
    },
    scope: {
      tenantId: input.tenantId,
      orgId: input.orgId
    },
    trace: {
      traceId: input.traceId
    },
    resource: {
      resourceType: input.resourceType,
      resourceId: input.resourceId
    },
    details: input.details
  })
}
