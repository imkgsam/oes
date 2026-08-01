import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'

/** Derives API-key management/exchange authority solely from the authenticated gRPC runtime context. */
export function resolveExternalApiKeyContext(rpcData: unknown): { trustedHuman: boolean; tenantId: string; operatorId: string; verifiedGatewayExchange: boolean } {
  const context: any = getAuthenticatedGrpcRequestContext(rpcData)
  const operator = context?.operatorContext
  const tenantId = operator?.tenant_id?.trim() ?? ''
  const operatorId = operator?.operator_id?.trim() ?? ''
  const workload = context?.verifiedWorkloadIdentity?.serviceName ?? context?.workloadIdentity?.serviceName
  const internalCodes: readonly string[] = context?.executionContext?.permissionCodes ?? []
  return { trustedHuman: Boolean(operatorId && tenantId && context?.operatorContext?.principal_type === 'HUMAN'), tenantId, operatorId, verifiedGatewayExchange: workload === 'api-gateway' && internalCodes.includes('auth.internal.external_api_key.exchange') }
}
