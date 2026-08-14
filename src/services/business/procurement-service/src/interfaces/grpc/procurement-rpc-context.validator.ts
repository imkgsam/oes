import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PROCUREMENT_UNAUTHENTICATED } from '../../common/errors/procurement.errors'
import {
  ProcurementAuditContext,
  ProcurementOperatorContext,
  ProcurementTraceContext
} from '../../domain/models/procurement-records'

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

export interface ProcurementQueryContext {
  tenantId: string
  operatorContext: ProcurementOperatorContext
  traceContext: ProcurementTraceContext
}

export interface ProcurementManagementContext extends ProcurementQueryContext {
  auditContext: ProcurementAuditContext
}

/** Maps only guard-verified ET and transport facts into Procurement application context. */
@Injectable()
export class ProcurementRpcContextValidator implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    ProcurementRpcContextValidator.assertQueryContext(context.switchToRpc().getData())
    return true
  }

  /** Derives tenant, operator, org, trace, and request identity without request-body authority. */
  static assertQueryContext(request: object): ProcurementQueryContext {
    const trusted = requireTrustedContext(request)
    return {
      tenantId: trusted.tenantId,
      operatorContext: {
        operatorId: trusted.subject,
        operatorType: 'HUMAN',
        orgId: trusted.orgId ?? null
      },
      traceContext: {
        traceId: trusted.traceId,
        requestId: trusted.requestId
      }
    }
  }

  /** Derives the mutation audit envelope solely from the verified token and current transport. */
  static assertManagementContext(request: object): ProcurementManagementContext {
    const trusted = requireTrustedContext(request)
    return {
      tenantId: trusted.tenantId,
      operatorContext: {
        operatorId: trusted.subject,
        operatorType: 'HUMAN',
        orgId: trusted.orgId ?? null
      },
      traceContext: {
        traceId: trusted.traceId,
        requestId: trusted.requestId
      },
      auditContext: {
        auditId: trusted.tokenId,
        reason: 'verified procurement command',
        source: trusted.workload
      }
    }
  }
}

/** Validates the private verified context and rejects every retired authority carrier. */
function requireTrustedContext(request: object) {
  if (!request || typeof request !== 'object') {
    throw unauthenticated('Procurement gRPC request payload is missing')
  }
  if (
    RETIRED_AUTHORITY_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(request, field))
  ) {
    throw unauthenticated('retired Procurement request authority is forbidden')
  }
  const context = getAuthenticatedGrpcRequestContext(request)
  const transportContext = context as
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
    !transportContext?.requestId?.trim() ||
    !transportContext.traceId?.trim() ||
    !workload?.trim()
  ) {
    throw unauthenticated('verified Procurement HUMAN execution context is missing')
  }
  return Object.freeze({
    tenantId,
    subject: execution.subject,
    orgId: execution.orgId,
    tokenId: execution.tokenId,
    workload,
    requestId: transportContext.requestId,
    traceId: transportContext.traceId
  })
}

/** Creates one stable Procurement authentication-context failure without echoing caller material. */
function unauthenticated(reason: string) {
  return ExceptionFactory.application(PROCUREMENT_UNAUTHENTICATED, { reason })
}
