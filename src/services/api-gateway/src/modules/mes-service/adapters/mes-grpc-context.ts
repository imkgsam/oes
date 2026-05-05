import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

export interface MesAuditContextPayload {
  auditId: string
  reason: string
  source: string
}

export interface MesOperatorContextPayload {
  operatorId: string
  operatorType: string
  orgId?: string
}

export interface MesTraceContextPayload {
  requestId: string
  traceId: string
}

/** buildMesOperatorContext derives the explicit MES contract operator payload from the authenticated gateway source. */
export function buildMesOperatorContext(source: DownstreamRequestSource): MesOperatorContextPayload {
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

/** buildMesTraceContext derives the explicit MES contract trace payload from the current gateway request. */
export function buildMesTraceContext(source: DownstreamRequestSource): MesTraceContextPayload {
  return {
    requestId: normalize(source.requestId) ?? 'api-gateway-request',
    traceId: normalize(source.traceId) ?? normalize(source.requestId) ?? 'api-gateway-trace'
  }
}

/** buildMesAuditContext derives the explicit MES contract audit payload for one management command. */
export function buildMesAuditContext(
  source: DownstreamRequestSource,
  reason: string
): MesAuditContextPayload {
  return {
    auditId: normalize(source.requestId) ?? normalize(source.traceId) ?? 'api-gateway-audit',
    reason: normalize(reason) ?? 'mes command triggered from api-gateway',
    source: 'api-gateway'
  }
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
