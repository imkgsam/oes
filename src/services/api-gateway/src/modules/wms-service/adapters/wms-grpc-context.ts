import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

export interface WmsAuditContextPayload {
  auditId: string
  reason: string
  source: string
}

export interface WmsOperatorContextPayload {
  operatorId: string
  operatorType: string
  orgId?: string
}

export interface WmsTraceContextPayload {
  requestId: string
  traceId: string
}

/** buildWmsOperatorContext derives the explicit WMS contract operator payload from the authenticated gateway source. */
export function buildWmsOperatorContext(source: DownstreamRequestSource): WmsOperatorContextPayload {
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

/** buildWmsTraceContext derives the explicit WMS contract trace payload from the current gateway request. */
export function buildWmsTraceContext(source: DownstreamRequestSource): WmsTraceContextPayload {
  return {
    requestId: normalize(source.requestId) ?? 'api-gateway-request',
    traceId: normalize(source.traceId) ?? normalize(source.requestId) ?? 'api-gateway-trace'
  }
}

/** buildWmsAuditContext derives the explicit WMS contract audit payload for one management command. */
export function buildWmsAuditContext(
  source: DownstreamRequestSource,
  reason: string
): WmsAuditContextPayload {
  return {
    auditId: normalize(source.requestId) ?? normalize(source.traceId) ?? 'api-gateway-audit',
    reason: normalize(reason) ?? 'wms command triggered from api-gateway',
    source: 'api-gateway'
  }
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
