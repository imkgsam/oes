import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { GrpcRequestContextStore } from '@oes/common/authorization'

const GATEWAY_SERVICE_NAME = 'api-gateway'
const SECURITY_OPERATIONS_RUNNER_SERVICE_NAME = 'security-operations-runner'
const EXTERNAL_API_KEY_EXCHANGE_PERMISSION = 'auth.internal.external_api_key.exchange'
const EXTERNAL_API_KEY_VERIFIER_COMPROMISE_PERMISSION =
  'auth.internal.external_api_key.verifier_version.compromise'
const AUTH_SERVICE_AUDIENCE = 'urn:oes:service:auth-service'

export type ResolvedExternalApiKeyContext = {
  trustedHuman: boolean
  tenantId: string
  operatorId: string
  verifiedGatewayExchange: boolean
  verifiedSecurityOperationsCompromise: boolean
  workloadSubject?: string
  workloadClientId?: string
  requestId?: string
  traceId?: string
}

/** Derives API-key management, exchange, and compromise authority solely from the authenticated gRPC runtime context. */
export function resolveExternalApiKeyContext(rpcData: unknown): ResolvedExternalApiKeyContext {
  const context: any = getAuthenticatedGrpcRequestContext(rpcData)
  return fromRuntimeContext(context)
}

/** Reads verified request facts from Common's async-local store for every API-key RPC decision. */
export class ExternalApiKeyRequestContextAdapter {
  constructor(private readonly store: GrpcRequestContextStore) {}

  resolve(): ResolvedExternalApiKeyContext {
    const context: any = this.store.getContext()
    if (!context) {
      return {
        trustedHuman: false,
        tenantId: '',
        operatorId: '',
        verifiedGatewayExchange: false,
        verifiedSecurityOperationsCompromise: false
      }
    }
    return fromRuntimeContext(context)
  }
}

/** Normalizes the trusted Common runtime context so API-key decisions stay aligned with signed metadata semantics. */
function fromRuntimeContext(context: any): ResolvedExternalApiKeyContext {
  const operator = context?.operatorContext
  const verifiedExecution = context?.verifiedExecutionToken
  const verifiedWorkload = context?.verifiedWorkloadIdentity
  const tenantId = operator?.tenant_id?.trim() ?? ''
  const operatorId = operator?.operator_id?.trim() ?? ''
  const operatorType = operator?.operator_type?.trim() ?? operator?.principal_type?.trim() ?? ''
  const workloadClientId = verifiedWorkload?.spiffeId?.trim() || undefined
  const workloadSubject = verifiedExecution?.subject?.trim() || undefined
  const base = {
    trustedHuman: Boolean(operatorId && tenantId && operatorType === 'HUMAN'),
    tenantId,
    operatorId,
    verifiedGatewayExchange:
      verifiedExecution?.audience === AUTH_SERVICE_AUDIENCE &&
      verifiedExecution?.principalType === 'MACHINE' &&
      workloadSubject === GATEWAY_SERVICE_NAME &&
      verifiedExecution?.clientId === workloadClientId &&
      Array.isArray(verifiedExecution?.permissionCodes) &&
      verifiedExecution.permissionCodes.includes(EXTERNAL_API_KEY_EXCHANGE_PERMISSION),
    verifiedSecurityOperationsCompromise:
      verifiedExecution?.audience === AUTH_SERVICE_AUDIENCE &&
      verifiedExecution?.principalType === 'MACHINE' &&
      workloadSubject === SECURITY_OPERATIONS_RUNNER_SERVICE_NAME &&
      verifiedExecution?.clientId === workloadClientId &&
      Array.isArray(verifiedExecution?.permissionCodes) &&
      verifiedExecution.permissionCodes.length === 1 &&
      verifiedExecution.permissionCodes.includes(EXTERNAL_API_KEY_VERIFIER_COMPROMISE_PERMISSION)
  }
  const requestId = operator?.request_id?.trim() || context?.requestId?.trim() || undefined
  const traceId = operator?.trace_id?.trim() || context?.traceId?.trim() || undefined
  return {
    ...base,
    ...(workloadSubject ? { workloadSubject } : {}),
    ...(workloadClientId ? { workloadClientId } : {}),
    ...(requestId ? { requestId } : {}),
    ...(traceId ? { traceId } : {})
  }
}
