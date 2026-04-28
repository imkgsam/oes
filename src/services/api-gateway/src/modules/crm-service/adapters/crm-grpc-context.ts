import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

export interface CrmAuditContextPayload {
  auditId: string
  reason: string
  source: string
}

export interface CrmOperatorContextPayload {
  operatorId: string
  operatorType: string
  orgId?: string
}

export interface CrmTraceContextPayload {
  requestId: string
  traceId: string
}

/** buildCrmOperatorContext derives the explicit CRM contract operator payload from the authenticated gateway source. */
export function buildCrmOperatorContext(source: DownstreamRequestSource): CrmOperatorContextPayload {
  const operatorId = normalize(
    source.user?.holderId ?? source.user?.aid ?? source.user?.id ?? source.user?.sub
  )

  if (!operatorId) {
    throw new UnauthorizedException('authenticated operator context is missing operator id')
  }

  return {
    operatorId,
    operatorType: normalize(source.user?.typ) ?? 'USER',
    orgId: normalize(source.user?.orgId)
  }
}

/** buildCrmTraceContext derives the explicit CRM contract trace payload from the current gateway request. */
export function buildCrmTraceContext(source: DownstreamRequestSource): CrmTraceContextPayload {
  return {
    requestId: normalize(source.requestId) ?? 'api-gateway-request',
    traceId: normalize(source.traceId) ?? normalize(source.requestId) ?? 'api-gateway-trace'
  }
}

/** buildCrmAuditContext derives the explicit CRM contract audit payload for one management command. */
export function buildCrmAuditContext(
  source: DownstreamRequestSource,
  reason: string
): CrmAuditContextPayload {
  return {
    auditId: normalize(source.requestId) ?? normalize(source.traceId) ?? 'api-gateway-audit',
    reason: normalize(reason) ?? 'crm customer management command triggered from api-gateway',
    source: 'api-gateway'
  }
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
