import type { OperatorContextPayload } from '@oes/common/authorization'
import type { ExecutionTokenExchangeContextPort } from '../../application/ports/execution-token-exchange-context.port'
import type {
  ExchangeExecutionTokenInput,
  VerifiedExecutionWorkload
} from '../../application/services/execution-token-exchange.service'

type VerifiedWorkloadResolver = {
  getVerifiedWorkloadIdentity(call: unknown): Promise<VerifiedExecutionWorkload>
}

/** Resolves STS principals only from Common-attached signed operator facts and Common's mTLS workload provider. */
export class VerifiedExecutionTokenContextProvider implements ExecutionTokenExchangeContextPort {
  constructor(private readonly workloadResolver: VerifiedWorkloadResolver) {}

  /** Produces execution facts from verified runtime context and never reconstructs them from the exchange proto fields. */
  async resolve(
    call: unknown,
    _request: Pick<ExchangeExecutionTokenInput, 'targetAudience' | 'requestedPermissionCodes'>
  ): Promise<Omit<ExchangeExecutionTokenInput, 'targetAudience' | 'requestedPermissionCodes'>> {
    const workloadIdentity = await this.workloadResolver.getVerifiedWorkloadIdentity(call)
    const operatorContext = readVerifiedOperatorContext(readRpcData(call))
    if (!operatorContext) throw new Error('verified execution context is unavailable')
    const principalType = asPrincipalType(operatorContext.operator_type)
    const permissionCodes = operatorContext.operator_roles?.filter(
      (code): code is string => typeof code === 'string' && code.length > 0
    )
    if (
      !operatorContext.operator_id ||
      !operatorContext.tenant_id ||
      !principalType ||
      !permissionCodes?.length
    )
      throw new Error('verified execution permission context is unavailable')
    return Object.freeze({
      workloadIdentity,
      execution: Object.freeze({
        subject: operatorContext.operator_id,
        principalType,
        tenantId: operatorContext.tenant_id,
        ...(operatorContext.org_id ? { orgId: operatorContext.org_id } : {}),
        permissionCodes: Object.freeze([...new Set(permissionCodes)])
      })
    })
  }
}

/** Reads the opaque Common-attached operator fact while refusing any DTO field as an identity source. */
function readVerifiedOperatorContext(rpcData: unknown): OperatorContextPayload | undefined {
  if (!rpcData || typeof rpcData !== 'object') return undefined
  const authenticated = (rpcData as { __oesOperatorContext?: { operatorContext?: unknown } })
    .__oesOperatorContext
  return authenticated?.operatorContext as OperatorContextPayload | undefined
}

/** Reads only the rpc data object that Common guards mutate after signature verification, never controller request fields. */
function readRpcData(call: unknown): unknown {
  if (!call || typeof call !== 'object' || !('request' in call))
    throw new Error('verified execution context is unavailable')
  return (call as { request: unknown }).request
}

/** Narrows a Common-verified operator type to the frozen STS principal kinds. */
function asPrincipalType(value: string): 'HUMAN' | 'MACHINE' | 'DELEGATED' | undefined {
  return value === 'HUMAN' || value === 'MACHINE' || value === 'DELEGATED' ? value : undefined
}
