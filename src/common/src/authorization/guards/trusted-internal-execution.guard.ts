import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory } from '../../core/exceptions'
import { AUTHORIZATION_METADATA_KEY } from '../constants'
import {
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  type InternalRpcAuthorizationDeclaration,
  type RpcAuthorizationModeDeclaration
} from '../trusted-execution/declarations'
import { ExecutionTokenVerifier } from '../trusted-execution'
import {
  attachOperatorContext,
  attachVerifiedExecution,
  getGrpcAuthorizationBearer,
  getGrpcMetadataValue
} from '../utils'
import { GrpcWorkloadIdentityProvider } from '../../transport'
import { inboundExecutionTokenCredentialScope } from '../trusted-execution/inbound-execution-token-credential.scope'

export const TRUSTED_EXECUTION_TARGET_AUDIENCE = 'TrustedExecutionTargetAudience'

@Injectable()
/** Enforces exact INTERNAL ExecutionToken validation from verified transport identity with no legacy fallback. */
export class TrustedInternalExecutionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: ExecutionTokenVerifier,
    private readonly workloadIdentityProvider: GrpcWorkloadIdentityProvider,
    private readonly targetAudience: string
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const declaration = this.reflector.getAllAndOverride<RpcAuthorizationModeDeclaration>(
      RPC_AUTHORIZATION_MODE_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (declaration?.mode !== 'INTERNAL') {
      return true
    }

    const rpcContext = context.switchToRpc()
    const metadata = rpcContext.getContext<Metadata>()
    const call = context.getArgByIndex(2)
    const token = getGrpcAuthorizationBearer(metadata, AUTHORIZATION_METADATA_KEY)
    if (!token) {
      throw ExceptionFactory.application(ACCESS_DENIED, {
        reason: 'trusted internal execution token is missing'
      })
    }

    const workloadIdentity = await this.workloadIdentityProvider.getVerifiedWorkloadIdentity(call)
    const verifiedExecutionToken = await this.verifier.verify({
      token,
      targetAudience: this.targetAudience,
      workloadIdentity
    })

    assertRequiredPermissionCodes(declaration, verifiedExecutionToken.permissionCodes)
    attachVerifiedExecution(rpcContext.getData(), {
      verifiedExecutionToken,
      verifiedWorkloadIdentity: workloadIdentity
    })
    attachOperatorContext(rpcContext.getData(), {
      operator_id: verifiedExecutionToken.subject,
      operator_type: verifiedExecutionToken.principalType,
      ...(verifiedExecutionToken.tenantId === undefined
        ? {}
        : { tenant_id: verifiedExecutionToken.tenantId }),
      ...(verifiedExecutionToken.orgId === undefined
        ? {}
        : { org_id: verifiedExecutionToken.orgId }),
      issued_at: new Date(verifiedExecutionToken.issuedAt * 1000).toISOString(),
      expires_at: new Date(verifiedExecutionToken.expiresAt * 1000).toISOString(),
      issuer: verifiedExecutionToken.issuer,
      signature: 'verified-execution-token',
      request_id: getGrpcMetadataValue(metadata, 'x-request-id'),
      trace_id: getGrpcMetadataValue(metadata, 'x-trace-id')
    })
    if (rpcContext.getData() && typeof rpcContext.getData() === 'object') {
      const requestId = getGrpcMetadataValue(metadata, 'x-request-id')
      const traceparent = getGrpcMetadataValue(metadata, 'traceparent')
      if (!requestId || !traceparent) {
        throw ExceptionFactory.application(ACCESS_DENIED, {
          reason: 'trusted internal execution correlation is missing'
        })
      }
      inboundExecutionTokenCredentialScope.prepare(
        rpcContext.getData(),
        token,
        verifiedExecutionToken,
        {
          requestId,
          traceparent,
          ...(getGrpcMetadataValue(metadata, 'tracestate')
            ? { tracestate: getGrpcMetadataValue(metadata, 'tracestate') }
            : {})
        }
      )
    }
    return true
  }
}

function assertRequiredPermissionCodes(
  declaration: InternalRpcAuthorizationDeclaration,
  grantedPermissionCodes: readonly string[]
): void {
  const missing = declaration.permissions.all.filter(
    (code) => !grantedPermissionCodes.includes(code)
  )
  if (missing.length > 0) {
    throw ExceptionFactory.application(ACCESS_DENIED, {
      reason: 'trusted internal execution token is missing required permission codes',
      missingPermissionCodes: missing
    })
  }
}
