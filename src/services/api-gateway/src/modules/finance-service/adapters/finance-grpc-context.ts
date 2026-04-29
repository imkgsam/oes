import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

export interface FinanceAuditContextPayload {
  auditId: string
  reason: string
  source: string
}

export interface FinanceOperatorContextPayload {
  operatorId: string
  operatorType: string
  orgId?: string
}

export interface FinanceTraceContextPayload {
  requestId: string
  traceId: string
}

/** buildFinanceOperatorContext derives the explicit finance contract operator payload from the authenticated gateway source. */
export function buildFinanceOperatorContext(
  source: DownstreamRequestSource
): FinanceOperatorContextPayload {
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

/** buildFinanceTraceContext derives the explicit finance contract trace payload from the current gateway request. */
export function buildFinanceTraceContext(
  source: DownstreamRequestSource
): FinanceTraceContextPayload {
  return {
    requestId: normalize(source.requestId) ?? 'api-gateway-request',
    traceId: normalize(source.traceId) ?? normalize(source.requestId) ?? 'api-gateway-trace'
  }
}

/** buildFinanceAuditContext derives the explicit finance contract audit payload for one management command. */
export function buildFinanceAuditContext(
  source: DownstreamRequestSource,
  reason: string
): FinanceAuditContextPayload {
  return {
    auditId: normalize(source.requestId) ?? normalize(source.traceId) ?? 'api-gateway-audit',
    reason: normalize(reason) ?? 'finance command triggered from api-gateway',
    source: 'api-gateway'
  }
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
