import type {
  TrustedExecutionContext,
  TrustedExecutionContextAccessor
} from '@oes/common/authorization'
import type { ExecutionTokenExchangeContextPort } from '../../application/ports/execution-token-exchange-context.port'
import type {
  ExchangeExecutionTokenInput,
  VerifiedExecutionWorkload
} from '../../application/services/execution-token-exchange.service'
import { resolveApiKeyRootExecutionContext } from './api-key-root-execution-context'

type VerifiedWorkloadResolver = {
  getVerifiedWorkloadIdentity(call: unknown): Promise<VerifiedExecutionWorkload>
}

/** Resolves STS principals only from Common's verified execution root and mTLS workload provider. */
export class VerifiedExecutionTokenContextProvider implements ExecutionTokenExchangeContextPort {
  constructor(
    private readonly workloadResolver: VerifiedWorkloadResolver,
    private readonly executionContextAccessor: TrustedExecutionContextAccessor
  ) {}

  /** Produces execution facts from verified runtime context and never reconstructs them from the exchange proto fields. */
  async resolve(
    call: unknown,
    request: Pick<ExchangeExecutionTokenInput, 'targetAudience' | 'requestedPermissionCodes'>
  ): Promise<Omit<ExchangeExecutionTokenInput, 'targetAudience' | 'requestedPermissionCodes'>> {
    const workloadIdentity = await this.workloadResolver.getVerifiedWorkloadIdentity(call)
    const executionContext = this.readVerifiedExecutionContext()
    if (!executionContext) {
      const rootExecution = resolveApiKeyRootExecutionContext(workloadIdentity, request)
      if (!rootExecution) throw new Error('verified execution context is unavailable')
      return Object.freeze({
        workloadIdentity,
        execution: rootExecution
      })
    }
    if (!executionContext.tenantId)
      throw new Error('verified execution tenant context is unavailable')
    return Object.freeze({
      workloadIdentity,
      execution: Object.freeze({
        subject: executionContext.subject,
        principalType: executionContext.principalType,
        tenantId: executionContext.tenantId,
        ...(executionContext.orgId === undefined ? {} : { orgId: executionContext.orgId }),
        permissionCodes: Object.freeze([...request.requestedPermissionCodes]),
        ...(executionContext.sessionId === undefined
          ? {}
          : { sessionId: executionContext.sessionId }),
        ...(executionContext.delegationId === undefined
          ? {}
          : { delegationId: executionContext.delegationId }),
        ...(executionContext.actor === undefined ? {} : { actor: executionContext.actor }),
        ...(executionContext.authzVersion === undefined
          ? {}
          : { authzVersion: executionContext.authzVersion })
      })
    })
  }

  /** Reads the immutable Common execution root without interpreting request data or metadata as authority. */
  private readVerifiedExecutionContext(): TrustedExecutionContext | undefined {
    try {
      return this.executionContextAccessor.requireCurrent()
    } catch {
      return undefined
    }
  }
}
