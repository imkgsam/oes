import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { GrpcRequestContextStore } from '@oes/common/authorization'

const GATEWAY_SERVICE_NAME = 'api-gateway'
const EXTERNAL_API_KEY_EXCHANGE_PERMISSION = 'auth.internal.external_api_key.exchange'
const AUTH_SERVICE_AUDIENCE = 'urn:oes:service:auth-service'

/** Derives API-key management/exchange authority solely from the authenticated gRPC runtime context. */
export function resolveExternalApiKeyContext(rpcData: unknown): { trustedHuman: boolean; tenantId: string; operatorId: string; verifiedGatewayExchange: boolean; requestId?: string; traceId?: string } {
  const context: any = getAuthenticatedGrpcRequestContext(rpcData)
  return fromRuntimeContext(context)
}

/** Reads verified request facts from Common's async-local store for every API-key RPC decision. */
export class ExternalApiKeyRequestContextAdapter {
  constructor(private readonly store: GrpcRequestContextStore) {}
  resolve(): { trustedHuman: boolean; tenantId: string; operatorId: string; verifiedGatewayExchange: boolean; requestId?: string; traceId?: string } {
    const context: any = this.store.getContext()
    if (!context) return { trustedHuman: false, tenantId: '', operatorId: '', verifiedGatewayExchange: false }
    return fromRuntimeContext(context)
  }
}

/** Normalizes the trusted Common runtime context so API-key decisions stay aligned with signed metadata semantics. */
function fromRuntimeContext(context: any) {
  const operator = context?.operatorContext
  const verifiedExecution = context?.verifiedExecutionToken
  const verifiedWorkload = context?.verifiedWorkloadIdentity
  const tenantId = operator?.tenant_id?.trim() ?? ''
  const operatorId = operator?.operator_id?.trim() ?? ''
  const operatorType = operator?.operator_type?.trim() ?? operator?.principal_type?.trim() ?? ''
  const base = {
    trustedHuman: Boolean(operatorId && tenantId && operatorType === 'HUMAN'),
    tenantId,
    operatorId,
    verifiedGatewayExchange:
      verifiedExecution?.audience === AUTH_SERVICE_AUDIENCE &&
      verifiedExecution?.principalType === 'MACHINE' &&
      verifiedExecution?.subject === GATEWAY_SERVICE_NAME &&
      verifiedExecution?.clientId === verifiedWorkload?.spiffeId &&
      Array.isArray(verifiedExecution?.permissionCodes) &&
      verifiedExecution.permissionCodes.includes(EXTERNAL_API_KEY_EXCHANGE_PERMISSION),
  }
  const requestId = operator?.request_id?.trim() || context?.requestId?.trim() || undefined
  const traceId = operator?.trace_id?.trim() || context?.traceId?.trim() || undefined
  return {
    ...base,
    ...(requestId ? { requestId } : {}),
    ...(traceId ? { traceId } : {})
  }
}
