import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory } from '../../core/exceptions'
import { AUTHORIZATION_METADATA_KEY } from '../constants'
import { RpcAuthorizationModeDeclaration, RPC_AUTHORIZATION_MODE_METADATA_KEY } from '../trusted-execution/declarations'
import { ExecutionTokenVerifier } from '../trusted-execution'
import { attachVerifiedExecution, getGrpcAuthorizationBearer } from '../utils'
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
    if (declaration === undefined) return true
    const rpc = context.switchToRpc()
    const token = getGrpcAuthorizationBearer(rpc.getContext<Metadata>(), AUTHORIZATION_METADATA_KEY)
    if (!token) throw denied('trusted execution token is missing')
    const verified = await this.verifier.verify({
      token,
      targetAudience: this.targetAudience,
      workloadIdentity: await this.workloadIdentityProvider.getVerifiedWorkloadIdentity(context.getArgByIndex(2))
    })
    authorize(declaration, verified.principalType, verified.permissionCodes)
    attachVerifiedExecution(rpc.getData(), {
      verifiedExecutionToken: verified,
      verifiedWorkloadIdentity: await this.workloadIdentityProvider.getVerifiedWorkloadIdentity(context.getArgByIndex(2))
    })
    return true
  }
}

/** Applies exact mode declarations without interpreting legacy body identity or signed operator metadata. */
function authorize(declaration: RpcAuthorizationModeDeclaration, principalType: string, codes: readonly string[]): void {
  if (declaration.mode === 'SELF_SERVICE') {
    if (principalType !== 'HUMAN' && !(declaration.allowDelegated && principalType === 'DELEGATED')) {
      throw denied('self-service execution principal is not allowed')
    }
    return
  }
  const requirement = declaration.permissions
  const allowed = 'all' in requirement
    ? requirement.all.every((code) => codes.includes(code))
    : requirement.any.some((code) => codes.includes(code))
  if (!allowed) throw denied('trusted execution token is missing required permission codes')
}

/** Creates a stable denial without returning caller-controlled bearer material. */
function denied(reason: string) {
  return ExceptionFactory.application(ACCESS_DENIED, { reason })
}
