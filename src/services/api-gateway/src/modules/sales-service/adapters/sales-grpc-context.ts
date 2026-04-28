import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

export interface SalesAuditContextPayload {
  auditId: string
  reason: string
  source: string
}

export interface SalesOperatorContextPayload {
  operatorId: string
  operatorType: string
  orgId?: string
}

export interface SalesTraceContextPayload {
  requestId: string
  traceId: string
}

/** buildSalesOperatorContext derives the explicit sales contract operator payload from the authenticated gateway source. */
export function buildSalesOperatorContext(
  source: DownstreamRequestSource
): SalesOperatorContextPayload {
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

/** buildSalesTraceContext derives the explicit sales contract trace payload from the current gateway request. */
export function buildSalesTraceContext(
  source: DownstreamRequestSource
): SalesTraceContextPayload {
  return {
    requestId: normalize(source.requestId) ?? 'api-gateway-request',
    traceId: normalize(source.traceId) ?? normalize(source.requestId) ?? 'api-gateway-trace'
  }
}

/** buildSalesAuditContext derives the explicit sales contract audit payload for one management command. */
export function buildSalesAuditContext(
  source: DownstreamRequestSource,
  reason: string
): SalesAuditContextPayload {
  return {
    auditId: normalize(source.requestId) ?? normalize(source.traceId) ?? 'api-gateway-audit',
    reason: normalize(reason) ?? 'sales command triggered from api-gateway',
    source: 'api-gateway'
  }
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
