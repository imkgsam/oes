import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Global,
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
  TrustedExecutionGuard,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { IdentityPartyTrustedGrpcClient } from '../infrastructure/adaptors/party-trusted-grpc.client'
import { IdentityPartyMachineSourceCredentialClient } from '../infrastructure/adaptors/identity-party-machine-source-credential.client'
import { IdentityPartyMachineSourceCredentialProvider } from '../infrastructure/adaptors/identity-party-machine-source-credential.provider'
import { IdentityPartyExecutionTokenExchangeClient } from '../infrastructure/adaptors/identity-party-execution-token-exchange.client'
import { IdentityPartyTrustedGrpcExecutionProducer } from '../infrastructure/adaptors/identity-party-trusted-grpc-execution.producer'
import {
  IdentityHrTrustedGrpcClient,
  IdentityTenantOrgTrustedGrpcClient
} from '../infrastructure/adaptors/foundation-trusted-grpc.clients'

export const IDENTITY_AUDIENCE = 'urn:oes:service:identity-service'
export const IDENTITY_MACHINE_BOOTSTRAP_KEY = 'oes:identity:machine-bootstrap'
export const IDENTITY_PUBLIC_ENTRY_OWNER_FACT_KEY = 'oes:identity:public-entry-owner-fact'
export const AuthorizeIdentityMachineBootstrap = () =>
  SetMetadata(IDENTITY_MACHINE_BOOTSTRAP_KEY, true)
export const AuthorizeIdentityPublicEntryOwnerFact = () =>
  SetMetadata(IDENTITY_PUBLIC_ENTRY_OWNER_FACT_KEY, true)
const runtime = createLazyTrustedExecutionRuntime(IDENTITY_AUDIENCE)
const CALLERS = new Set([
  'api-gateway',
  'auth-service',
  'permission-service',
  'hr-service',
  'tenant-org-service',
  'collaboration-service',
  'public-entry-service'
])

/** Narrows Identity's verified baseline calls to the frozen direct, OBO and pre-auth workloads. */
@Injectable()
export class IdentityFoundationTrustedExecutionGuard
  extends TrustedExecutionGuard
  implements CanActivate
{
  constructor(
    private readonly authReflector: Reflector,
    verifier: ExecutionTokenVerifier,
    private readonly authIdentity: GrpcWorkloadIdentityProvider
  ) {
    super(authReflector, verifier, authIdentity, IDENTITY_AUDIENCE)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const machineBootstrap = this.authReflector.getAllAndOverride<boolean>(
      IDENTITY_MACHINE_BOOTSTRAP_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (machineBootstrap) {
      const metadata = context.switchToRpc().getContext()
      if (getGrpcMetadataValue(metadata, 'authorization') !== undefined) {
        throw new ForbiddenException('Identity machine bootstrap is mTLS-only')
      }
      const workload = await this.authIdentity.getVerifiedWorkloadIdentity(context.getArgByIndex(2))
      if (readWorkloadName(workload.spiffeId) !== 'auth-service') {
        throw new ForbiddenException('Identity machine bootstrap requires exact Auth workload')
      }
      return true
    }
    await super.canActivate(context)
    const token = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    const workload = readWorkloadName(token?.clientId ?? '')
    const publicEntryOwnerFact = this.authReflector.getAllAndOverride<boolean>(
      IDENTITY_PUBLIC_ENTRY_OWNER_FACT_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (
      publicEntryOwnerFact &&
      !(
        token?.principalType === 'MACHINE' &&
        token.tenantId === undefined &&
        token.orgId === undefined &&
        workload === 'public-entry-service'
      )
    ) {
      throw new ForbiddenException(
        'Identity public-card owner fact requires exact Public Entry workload'
      )
    }
    if (!CALLERS.has(workload))
      throw new ForbiddenException('Identity caller workload is not permitted')
    if (token?.principalType === 'HUMAN' && token.sessionTerminal !== 'WEB')
      throw new ForbiddenException('Identity HUMAN execution requires WEB terminal')
    if (
      token?.principalType === 'MACHINE' &&
      !['auth-service', 'public-entry-service'].includes(workload)
    )
      throw new ForbiddenException('Identity SYSTEM MACHINE caller is not permitted')
    return true
  }
}

/** Binds generic Identity INTERNAL owner resolvers to the Identity audience. */
@Injectable()
export class IdentityAudienceTrustedInternalExecutionGuard extends TrustedInternalExecutionGuard {
  constructor(
    reflector: Reflector,
    verifier: ExecutionTokenVerifier,
    identity: GrpcWorkloadIdentityProvider
  ) {
    super(reflector, verifier, identity, IDENTITY_AUDIENCE)
  }
}

/** Preserves the external-credential bootstrap as exact Auth/Gateway mTLS without fabricating an ET. */
@Injectable()
export class IdentityExternalCredentialAdmissionGuard implements CanActivate {
  constructor(private readonly identity: GrpcWorkloadIdentityProvider) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const workload = await this.identity.getVerifiedWorkloadIdentity(context.getArgByIndex(2))
    if (!['auth-service', 'api-gateway'].includes(readWorkloadName(workload.spiffeId))) {
      throw new ForbiddenException('Identity external credential caller is not permitted')
    }
    return true
  }
}

/** Composes Identity token-only ingress together with its preserved Party MACHINE producer. */
@Global()
@Module({
  providers: [
    IdentityPartyTrustedGrpcClient,
    IdentityPartyMachineSourceCredentialClient,
    IdentityPartyMachineSourceCredentialProvider,
    IdentityPartyExecutionTokenExchangeClient,
    IdentityTenantOrgTrustedGrpcClient,
    IdentityHrTrustedGrpcClient,
    {
      provide: IdentityPartyTrustedGrpcExecutionProducer,
      useFactory: (
        source: IdentityPartyMachineSourceCredentialProvider,
        exchange: IdentityPartyExecutionTokenExchangeClient
      ) => new IdentityPartyTrustedGrpcExecutionProducer(source, exchange),
      inject: [
        IdentityPartyMachineSourceCredentialProvider,
        IdentityPartyExecutionTokenExchangeClient
      ]
    },
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    IdentityExternalCredentialAdmissionGuard,
    {
      provide: IdentityFoundationTrustedExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new IdentityFoundationTrustedExecutionGuard(reflector, verifier, identity),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    },
    {
      provide: IdentityAudienceTrustedInternalExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new IdentityAudienceTrustedInternalExecutionGuard(reflector, verifier, identity),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    }
  ],
  exports: [
    IdentityPartyTrustedGrpcClient,
    IdentityPartyTrustedGrpcExecutionProducer,
    IdentityTenantOrgTrustedGrpcClient,
    IdentityHrTrustedGrpcClient,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    IdentityFoundationTrustedExecutionGuard,
    IdentityAudienceTrustedInternalExecutionGuard,
    IdentityExternalCredentialAdmissionGuard
  ]
})
export class IdentityTrustedExecutionModule {}

/** Extracts one canonical direct workload name from a verified SPIFFE URI. */
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
