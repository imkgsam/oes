import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Module
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  getAuthenticatedGrpcRequestContext,
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  type RpcAuthorizationModeDeclaration,
  TrustedExecutionGuard,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { PermissionIdentityTrustedGrpcClient } from '../../infrastructure/adaptors/foundation-trusted-grpc.clients'

export const PERMISSION_AUDIENCE = 'urn:oes:service:permission-service'
const runtime = createLazyTrustedExecutionRuntime(PERMISSION_AUDIENCE)
const ALLOWED_CALLERS = new Set([
  'api-gateway',
  'auth-service',
  'hr-service',
  'tenant-org-service',
  'collaboration-service',
  'public-entry-service'
])
const PDA_FOUNDATION_INTERNAL_PERMISSIONS = new Set([
  'permission.internal.account_access_summary.resolve',
  'permission.internal.account_navigation.resolve'
])

/** Enforces Permission BUSINESS/INTERNAL caller shape after Common verifies audience, Code, time and certificate binding. */
@Injectable()
export class PermissionFoundationTrustedExecutionGuard
  extends TrustedExecutionGuard
  implements CanActivate
{
  constructor(
    reflector: Reflector,
    verifier: ExecutionTokenVerifier,
    identity: GrpcWorkloadIdentityProvider
  ) {
    super(reflector, verifier, identity, PERMISSION_AUDIENCE)
    this.permissionReflector = reflector
  }

  private readonly permissionReflector: Reflector

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const token = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    const workload = readWorkloadName(token?.clientId ?? '')
    if (!ALLOWED_CALLERS.has(workload))
      throw new ForbiddenException('Permission caller workload is not permitted')
    if (token?.principalType === 'HUMAN') {
      const declaration =
        this.permissionReflector.getAllAndOverride<RpcAuthorizationModeDeclaration>(
          RPC_AUTHORIZATION_MODE_METADATA_KEY,
          [context.getHandler(), context.getClass()]
        )
      const terminal = token.sessionTerminal ?? ''
      const pdaFoundationAdmission =
        terminal === 'PDA' &&
        workload === 'api-gateway' &&
        isExactPdaFoundationInternalDeclaration(declaration)
      if (terminal !== 'WEB' && !pdaFoundationAdmission)
        throw new ForbiddenException('Permission HUMAN execution terminal is not permitted')
    }
    if (
      token?.principalType === 'MACHINE' &&
      !['auth-service', 'public-entry-service'].includes(workload)
    )
      throw new ForbiddenException('Permission SYSTEM MACHINE caller is not permitted')
    return true
  }
}

/** Admits PDA only to one of the two exact read-only foundation INTERNAL permissions. */
function isExactPdaFoundationInternalDeclaration(
  declaration: RpcAuthorizationModeDeclaration | undefined
): boolean {
  if (declaration?.mode !== 'INTERNAL') return false
  const permissions = declaration.permissions.all
  return permissions.length === 1 && PDA_FOUNDATION_INTERNAL_PERMISSIONS.has(permissions[0] ?? '')
}

/** Supplies Permission's exact audience verifier for all baseline RPCs while preserving the bootstrap guard. */
@Module({
  providers: [
    PermissionIdentityTrustedGrpcClient,
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    {
      provide: PermissionFoundationTrustedExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new PermissionFoundationTrustedExecutionGuard(reflector, verifier, identity),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    },
    {
      provide: TrustedInternalExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new TrustedInternalExecutionGuard(reflector, verifier, identity, PERMISSION_AUDIENCE),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    }
  ],
  exports: [
    PermissionIdentityTrustedGrpcClient,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    PermissionFoundationTrustedExecutionGuard,
    TrustedInternalExecutionGuard
  ]
})
export class PermissionTrustedExecutionModule {}

/** Extracts the direct workload name from a Common-verified SPIFFE URI. */
function readWorkloadName(spiffeId: string): string {
  try {
    const value = new URL(spiffeId)
    return value.protocol === 'spiffe:'
      ? (value.pathname.split('/').filter(Boolean).at(-1) ?? '')
      : ''
  } catch {
    return ''
  }
}
