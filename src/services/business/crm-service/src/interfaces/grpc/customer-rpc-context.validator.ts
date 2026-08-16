import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CRM_UNAUTHENTICATED } from '../../common/errors/crm.errors'
import {
  CrmAuditContext,
  CrmOperatorContext,
  CrmTraceContext
} from '../../domain/models/crm-records'

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
  'audit_context',
  'claimForCurrentUser',
  'claim_for_current_user',
  'allowOwnerlessConversion',
  'allow_ownerless_conversion'
] as const

export interface CrmQueryContext {
  tenantId: string
  operatorContext: CrmOperatorContext
  traceContext: CrmTraceContext
  permissionCodes: readonly string[]
}

export interface CrmManagementContext extends CrmQueryContext {
  auditContext: CrmAuditContext
}

/** Maps only locally verified ET and mTLS facts into CRM application context. */
@Injectable()
export class CustomerRpcContextValidator implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    CustomerRpcContextValidator.assertQueryContext(context.switchToRpc().getData())
    return true
  }

  /** Derives tenant, operator, org, trace, and Code facts without request-body authority. */
  static assertQueryContext(request: object): CrmQueryContext {
    const trusted = requireTrustedContext(request)
    return {
      tenantId: trusted.tenantId,
      operatorContext: {
        operatorId: trusted.subject,
        operatorType: 'HUMAN',
        orgId: trusted.orgId ?? null
      },
      traceContext: { traceId: trusted.traceId, requestId: trusted.requestId },
      permissionCodes: trusted.permissionCodes
    }
  }

  /** Derives the mutation audit envelope solely from verified token and transport facts. */
  static assertManagementContext(request: object): CrmManagementContext {
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
        reason: 'verified CRM command',
        source: trusted.workload
      },
      permissionCodes: trusted.permissionCodes
    }
  }
}

/** Validates private verified context and rejects every retired authority carrier. */
function requireTrustedContext(request: object) {
  if (!request || typeof request !== 'object') {
    throw unauthenticated('CRM gRPC request payload is missing')
  }
  if (
    RETIRED_AUTHORITY_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(request, field))
  ) {
    throw unauthenticated('retired CRM request authority is forbidden')
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
  ) {
    throw unauthenticated('verified CRM HUMAN execution context is missing')
  }
  return Object.freeze({
    tenantId,
    subject: execution.subject,
    orgId: execution.orgId,
    tokenId: execution.tokenId,
    permissionCodes: Object.freeze([...(execution.permissionCodes ?? [])]),
    workload,
    requestId: transport.requestId,
    traceId: transport.traceId
  })
}

/** Creates one stable CRM authentication-context failure without echoing caller material. */
function unauthenticated(reason: string) {
  return ExceptionFactory.application(CRM_UNAUTHENTICATED, { reason })
}
