import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SRM_UNAUTHENTICATED } from '../../common/errors/srm.errors'

const RETIRED_AUTHORITY_FIELDS = [
  'tenantId',
  'tenant_id',
  'operatorContext',
  'operator_context',
  'traceContext',
  'trace_context',
  'auditContext',
  'audit_context'
] as const

/** SupplierRpcContextValidator maps only guard-verified ET tenant authority into SRM application input. */
@Injectable()
export class SupplierRpcContextValidator implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const data = context.switchToRpc().getData()
    if (!data || typeof data !== 'object') {
      throw unauthenticated('SRM gRPC request payload is missing')
    }
    if (
      RETIRED_AUTHORITY_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(data, field))
    ) {
      throw unauthenticated('retired SRM request authority is forbidden')
    }

    const execution = getAuthenticatedGrpcRequestContext(data)?.verifiedExecutionToken
    const tenantId = execution?.tenantId
    if (
      execution?.principalType !== 'HUMAN' ||
      !tenantId ||
      tenantId.trim() !== tenantId ||
      tenantId === 'SYSTEM' ||
      tenantId === '*'
    ) {
      throw unauthenticated('verified SRM HUMAN tenant execution context is missing')
    }

    Object.assign(data, { tenantId })
    return true
  }
}

/** Reads the trusted tenant injected by the context guard without accepting request-body authority. */
export function trustedTenantId(request: object): string {
  const value = (request as { tenantId?: unknown }).tenantId
  if (
    typeof value !== 'string' ||
    !value ||
    value.trim() !== value ||
    value === 'SYSTEM' ||
    value === '*'
  ) {
    throw unauthenticated('verified SRM tenant execution context is unavailable')
  }
  return value
}

/** Creates one stable SRM authentication-context failure without echoing caller material. */
function unauthenticated(reason: string) {
  return ExceptionFactory.application(SRM_UNAUTHENTICATED, { reason })
}
