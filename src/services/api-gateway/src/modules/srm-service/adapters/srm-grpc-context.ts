import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

export interface SrmAuditContextPayload {
  auditId: string
  reason: string
  source: string
}

export interface SrmOperatorContextPayload {
  operatorId: string
  operatorType: string
  orgId?: string
}

export interface SrmTraceContextPayload {
  requestId: string
  traceId: string
}

/** buildSrmOperatorContext derives the explicit SRM contract operator payload from the authenticated gateway source. */
export function buildSrmOperatorContext(source: DownstreamRequestSource): SrmOperatorContextPayload {
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

/** buildSrmTraceContext derives the explicit SRM contract trace payload from the current gateway request. */
export function buildSrmTraceContext(source: DownstreamRequestSource): SrmTraceContextPayload {
  return {
    requestId: normalize(source.requestId) ?? 'api-gateway-request',
    traceId: normalize(source.traceId) ?? normalize(source.requestId) ?? 'api-gateway-trace'
  }
}

/** buildSrmAuditContext derives the explicit SRM contract audit payload for one management command. */
export function buildSrmAuditContext(
  source: DownstreamRequestSource,
  reason: string
): SrmAuditContextPayload {
  return {
    auditId: normalize(source.requestId) ?? normalize(source.traceId) ?? 'api-gateway-audit',
    reason: normalize(reason) ?? 'srm supplier management command triggered from api-gateway',
    source: 'api-gateway'
  }
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
