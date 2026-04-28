import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

export interface ProcurementAuditContextPayload {
  auditId: string
  reason: string
  source: string
}

export interface ProcurementOperatorContextPayload {
  operatorId: string
  operatorType: string
  orgId?: string
}

export interface ProcurementTraceContextPayload {
  requestId: string
  traceId: string
}

/** buildProcurementOperatorContext derives the explicit procurement contract operator payload from the authenticated gateway source. */
export function buildProcurementOperatorContext(
  source: DownstreamRequestSource
): ProcurementOperatorContextPayload {
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

/** buildProcurementTraceContext derives the explicit procurement contract trace payload from the current gateway request. */
export function buildProcurementTraceContext(
  source: DownstreamRequestSource
): ProcurementTraceContextPayload {
  return {
    requestId: normalize(source.requestId) ?? 'api-gateway-request',
    traceId: normalize(source.traceId) ?? normalize(source.requestId) ?? 'api-gateway-trace'
  }
}

/** buildProcurementAuditContext derives the explicit procurement contract audit payload for one management command. */
export function buildProcurementAuditContext(
  source: DownstreamRequestSource,
  reason: string
): ProcurementAuditContextPayload {
  return {
    auditId: normalize(source.requestId) ?? normalize(source.traceId) ?? 'api-gateway-audit',
    reason: normalize(reason) ?? 'procurement command triggered from api-gateway',
    source: 'api-gateway'
  }
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
