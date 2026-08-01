import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { GrpcRequestContextStore } from '@oes/common/authorization'

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

/** Reads verified request facts from Common's async-local store for every API-key RPC decision. */
export class ExternalApiKeyRequestContextAdapter {
  constructor(private readonly store: GrpcRequestContextStore) {}
  resolve(): { trustedHuman: boolean; tenantId: string; operatorId: string; verifiedGatewayExchange: boolean } {
    const context: any = this.store.getContext()
    if (!context) return { trustedHuman: false, tenantId: '', operatorId: '', verifiedGatewayExchange: false }
    const operator = context.operatorContext; const tenantId = operator?.tenant_id?.trim() ?? ''; const operatorId = operator?.operator_id?.trim() ?? ''
    const workload = context.verifiedWorkloadIdentity?.serviceName ?? context.workloadIdentity?.serviceName
    const codes: readonly string[] = context.executionContext?.permissionCodes ?? []
    return { trustedHuman: Boolean(operatorId && tenantId && operator?.principal_type === 'HUMAN'), tenantId, operatorId, verifiedGatewayExchange: workload === 'api-gateway' && codes.includes('auth.internal.external_api_key.exchange') }
  }
}
