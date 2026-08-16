import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory } from '../../core/exceptions'
import { AUTHORIZATION_METADATA_KEY } from '../constants'
import {
  RpcAuthorizationModeDeclaration,
  RPC_AUTHORIZATION_MODE_METADATA_KEY
} from '../trusted-execution/declarations'
import { ExecutionTokenVerifier } from '../trusted-execution'
import { inboundExecutionTokenCredentialScope } from '../trusted-execution/inbound-execution-token-credential.scope'
import {
  attachOperatorContext,
  attachVerifiedExecution,
  getGrpcAuthorizationBearer,
  getGrpcMetadataValue
} from '../utils'
import { GrpcWorkloadIdentityProvider } from '../../transport'

/** Enforces the frozen three-mode ExecutionToken contract before an Asset RPC can consume request data. */
@Injectable()
export class TrustedExecutionGuard implements CanActivate {
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
    if (declaration === undefined) throw denied('trusted execution authorization mode is missing')
    const rpc = context.switchToRpc()
    const token = getGrpcAuthorizationBearer(rpc.getContext<Metadata>(), AUTHORIZATION_METADATA_KEY)
    if (!token) throw denied('trusted execution token is missing')
    const workloadIdentity = await this.workloadIdentityProvider.getVerifiedWorkloadIdentity(
      context.getArgByIndex(2)
    )
    const verified = await this.verifier.verify({
      token,
      targetAudience: this.targetAudience,
      workloadIdentity
    })
    authorize(
      declaration,
      verified.principalType,
      verified.permissionCodes,
      verified.sessionTerminal
    )
    attachVerifiedOperatorContext(rpc.getData(), verified)
    const attached = attachVerifiedExecution(rpc.getData(), {
      verifiedExecutionToken: verified,
      verifiedWorkloadIdentity: workloadIdentity
    })
    if (rpc.getData() && typeof rpc.getData() === 'object') {
      const requestId = getGrpcMetadataValue(rpc.getContext<Metadata>(), 'x-request-id')
      const traceparent = getGrpcMetadataValue(rpc.getContext<Metadata>(), 'traceparent')
      if (!requestId || !traceparent) {
        throw denied('trusted execution correlation is missing')
      }
      inboundExecutionTokenCredentialScope.prepare(rpc.getData(), token, verified, {
        requestId,
        traceparent,
        ...(getGrpcMetadataValue(rpc.getContext<Metadata>(), 'tracestate')
          ? { tracestate: getGrpcMetadataValue(rpc.getContext<Metadata>(), 'tracestate') }
          : {})
      })
    }
    if (attached) {
      Object.assign(attached as object, {
        requestId: getGrpcMetadataValue(rpc.getContext<Metadata>(), 'x-request-id'),
        traceId: getGrpcMetadataValue(rpc.getContext<Metadata>(), 'x-trace-id')
      })
    }
    return true
  }
}

/** Projects locally verified ET claims into the existing application-facing operator context without accepting signed metadata. */
function attachVerifiedOperatorContext(
  rpcData: unknown,
  verified: Awaited<ReturnType<ExecutionTokenVerifier['verify']>>
): void {
  attachOperatorContext(rpcData, {
    operator_id: verified.subject,
    operator_type: verified.principalType,
    ...(verified.tenantId === undefined ? {} : { tenant_id: verified.tenantId }),
    ...(verified.orgId === undefined ? {} : { org_id: verified.orgId }),
    issued_at: new Date(verified.issuedAt * 1000).toISOString(),
    expires_at: new Date(verified.expiresAt * 1000).toISOString(),
    issuer: verified.issuer,
    signature: 'verified-execution-token'
  })
}

/** Applies exact mode declarations without interpreting legacy body identity or signed operator metadata. */
function authorize(
  declaration: RpcAuthorizationModeDeclaration,
  principalType: string,
  codes: readonly string[],
  sessionTerminal?: string
): void {
  if (
    'sessionTerminals' in declaration &&
    declaration.sessionTerminals !== undefined &&
    (sessionTerminal === undefined ||
      !declaration.sessionTerminals.includes(sessionTerminal as never))
  ) {
    throw denied('trusted execution token has an invalid session terminal')
  }
  if (declaration.mode === 'SELF_SERVICE') {
    const principalAllowed =
      principalType === 'HUMAN' || (principalType === 'DELEGATED' && declaration.allowDelegated)
    if (!principalAllowed || codes.length !== 0) {
      throw denied('self-service execution principal is not allowed')
    }
    return
  }
  if (
    declaration.mode === 'BUSINESS' &&
    declaration.principalType !== undefined &&
    declaration.principalType !== principalType
  ) {
    throw denied('trusted execution token has an invalid principal type')
  }
  const requirement = declaration.permissions
  const allowed =
    'all' in requirement
      ? requirement.all.every((code) => codes.includes(code))
      : requirement.any.some((code) => codes.includes(code))
  if (!allowed) throw denied('trusted execution token is missing required permission codes')
}

/** Creates a stable denial without returning caller-controlled bearer material. */
function denied(reason: string) {
  return ExceptionFactory.application(ACCESS_DENIED, { reason })
}
