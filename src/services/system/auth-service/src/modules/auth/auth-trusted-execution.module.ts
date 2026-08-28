import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Module,
  SetMetadata
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  getGrpcMetadataValue,
  getAuthenticatedGrpcRequestContext,
  inboundExecutionTokenCredentialScope,
  TrustedExecutionGuard,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import {
  AuthHrTrustedGrpcClient,
  AuthIdentityTrustedGrpcClient,
  AuthPermissionTrustedGrpcClient,
  AuthTenantOrgTrustedGrpcClient
} from '../../infrastructure/adaptors/foundation-trusted-grpc.clients'

export const AUTH_AUDIENCE = 'urn:oes:service:auth-service'
export const AUTH_PUBLIC_ADMISSION_KEY = 'oes:auth:public-admission'
const runtime = createLazyTrustedExecutionRuntime(AUTH_AUDIENCE)

/** Declares one Auth-owned pre-execution admission without manufacturing an ExecutionToken. */
export const AuthorizeAuthPublicAdmission = (
  kind: 'PUBLIC_CREDENTIAL' | 'PUBLIC_CONTINUATION' | 'PUBLIC_SESSION_SOURCE_VALIDATION'
) => SetMetadata(AUTH_PUBLIC_ADMISSION_KEY, kind)

/** Enforces exact Gateway mTLS for public Auth flows and Token-only HUMAN admission for protected methods. */
@Injectable()
export class AuthTrustedExecutionGuard extends TrustedExecutionGuard implements CanActivate {
  constructor(
    reflector: Reflector,
    verifier: ExecutionTokenVerifier,
    identity: GrpcWorkloadIdentityProvider
  ) {
    super(reflector, verifier, identity, AUTH_AUDIENCE)
    this.authReflector = reflector
    this.authIdentity = identity
  }

  private readonly authReflector: Reflector
  private readonly authIdentity: GrpcWorkloadIdentityProvider

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publicAdmission = this.authReflector.getAllAndOverride<string>(
      AUTH_PUBLIC_ADMISSION_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (publicAdmission) {
      const workload = await this.authIdentity.getVerifiedWorkloadIdentity(context.getArgByIndex(2))
      if (readWorkloadName(workload.spiffeId) !== 'api-gateway') {
        throw new ForbiddenException('Auth public admission requires exact api-gateway mTLS')
      }
      const rpc = context.switchToRpc()
      const requestId = getGrpcMetadataValue(rpc.getContext(), 'x-request-id')
      const traceparent = getGrpcMetadataValue(rpc.getContext(), 'traceparent')
      if (!requestId || !traceparent || !rpc.getData() || typeof rpc.getData() !== 'object') {
        throw new ForbiddenException('Auth public admission correlation is required')
      }
      inboundExecutionTokenCredentialScope.preparePublicCorrelation(rpc.getData(), {
        requestId,
        traceparent,
        ...(getGrpcMetadataValue(rpc.getContext(), 'tracestate')
          ? { tracestate: getGrpcMetadataValue(rpc.getContext(), 'tracestate') }
          : {})
      })
      return true
    }

    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    const workload = readWorkloadName(verified?.clientId ?? '')
    if (verified?.principalType !== 'HUMAN' || verified.sessionTerminal !== 'WEB') {
      throw new ForbiddenException('Auth protected execution requires HUMAN WEB context')
    }
    const allowed = verified.actor
      ? ['hr-service', 'tenant-org-service'].includes(workload)
      : workload === 'api-gateway'
    if (!allowed) throw new ForbiddenException('Auth protected caller workload is not permitted')
    return true
  }
}

/** Binds generic Auth INTERNAL methods to the Auth audience without constructor string injection. */
@Injectable()
export class AuthAudienceTrustedInternalExecutionGuard extends TrustedInternalExecutionGuard {
  constructor(reflector: Reflector, verifier: ExecutionTokenVerifier, identity: GrpcWorkloadIdentityProvider) {
    super(reflector, verifier, identity, AUTH_AUDIENCE)
  }
}

/** Supplies Auth's exact audience verifier and dual public/protected admission guard. */
@Module({
  providers: [
    AuthIdentityTrustedGrpcClient,
    AuthPermissionTrustedGrpcClient,
    AuthHrTrustedGrpcClient,
    AuthTenantOrgTrustedGrpcClient,
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    {
      provide: AuthTrustedExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new AuthTrustedExecutionGuard(reflector, verifier, identity),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    },
    {
      provide: AuthAudienceTrustedInternalExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new AuthAudienceTrustedInternalExecutionGuard(reflector, verifier, identity),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    }
  ],
  exports: [
    AuthTrustedExecutionGuard,
    AuthAudienceTrustedInternalExecutionGuard,
    AuthIdentityTrustedGrpcClient,
    AuthPermissionTrustedGrpcClient,
    AuthHrTrustedGrpcClient,
    AuthTenantOrgTrustedGrpcClient
  ]
})
export class AuthTrustedExecutionModule {}

/** Extracts only a canonical workload name from a verified SPIFFE URI. */
function readWorkloadName(spiffeId: string): string {
  try {
    const parsed = new URL(spiffeId)
    return parsed.protocol === 'spiffe:'
      ? (parsed.pathname.split('/').filter(Boolean).at(-1) ?? '')
      : ''
  } catch {
    return ''
  }
}
