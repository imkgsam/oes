import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import { WMS_UNAUTHENTICATED } from '../../common/errors/wms.errors'
import {
  WmsAuditContext,
  WmsOperatorContext,
  WmsTraceContext
} from '../../domain/models/wms-records'

const RETIRED_AUTHORITY_FIELDS = [
  'tenantId',
  'tenant_id',
  'orgId',
  'org_id',
  'operatorContext',
  'operator_context',
  'traceContext',
  'trace_context',
  'auditContext',
  'audit_context'
] as const

export interface WmsQueryContext {
  tenantId: string
  operatorContext: WmsOperatorContext
  traceContext: WmsTraceContext
}

export interface WmsManagementContext extends WmsQueryContext {
  auditContext: WmsAuditContext
}

/** Maps only guard-verified ET and transport facts into WMS application context. */
@Injectable()
export class WmsRpcContextValidator implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    WmsRpcContextValidator.assertQueryContext(context.switchToRpc().getData())
    return true
  }

  /** Derives tenant, operator, org, trace, and request identity without body authority. */
  static assertQueryContext(request: object): WmsQueryContext {
    const trusted = requireTrustedContext(request)
    return {
      tenantId: trusted.tenantId,
      operatorContext: {
        operatorId: trusted.subject,
        operatorType: 'HUMAN',
        orgId: trusted.orgId ?? null
      },
      traceContext: { traceId: trusted.traceId, requestId: trusted.requestId }
    }
  }

  /** Derives the mutation audit envelope solely from verified token and transport facts. */
  static assertManagementContext(request: object): WmsManagementContext {
    const trusted = requireTrustedContext(request)
    return {
      tenantId: trusted.tenantId,
      operatorContext: {
        operatorId: trusted.subject,
        operatorType: 'HUMAN',
        orgId: trusted.orgId ?? null
      },
      traceContext: { traceId: trusted.traceId, requestId: trusted.requestId },
      auditContext: {
        auditId: trusted.tokenId,
        reason: 'verified WMS command',
        source: trusted.workload
      }
    }
  }
}

/** Validates private verified context and rejects every retired authority carrier. */
function requireTrustedContext(request: object) {
  if (!request || typeof request !== 'object')
    throw unauthenticated('WMS gRPC request payload is missing')
  if (
    RETIRED_AUTHORITY_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(request, field))
  ) {
    throw unauthenticated('retired WMS request authority is forbidden')
  }
  const context = getAuthenticatedGrpcRequestContext(request)
  const transport = context as
    | (typeof context & { requestId?: string; traceId?: string })
    | undefined
  const execution = context?.verifiedExecutionToken
  const tenantId = execution?.tenantId
  const workload = context?.verifiedWorkloadIdentity?.spiffeId
  if (
    execution?.principalType !== 'HUMAN' ||
    !tenantId ||
    tenantId.trim() !== tenantId ||
    tenantId === 'SYSTEM' ||
    tenantId === '*' ||
    !execution.subject?.trim() ||
    !execution.tokenId?.trim() ||
    !transport?.requestId?.trim() ||
    !transport.traceId?.trim() ||
    !workload?.trim()
  )
    throw unauthenticated('verified WMS HUMAN execution context is missing')
  return Object.freeze({
    tenantId,
    subject: execution.subject,
    orgId: execution.orgId,
    tokenId: execution.tokenId,
    workload,
    requestId: transport.requestId,
    traceId: transport.traceId
  })
}

/** Creates one stable WMS authentication-context failure without echoing caller material. */
function unauthenticated(reason: string) {
  return ExceptionFactory.application(WMS_UNAUTHENTICATED, { reason })
}
