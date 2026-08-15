import { CanActivate, ExecutionContext, ForbiddenException, Global, Injectable, Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, ExecutionTokenVerifier, getAuthenticatedGrpcRequestContext, TrustedExecutionGuard } from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { TenantOrgPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { TenantOrgPartyMachineSourceCredentialClient } from '../infrastructure/adapters/tenant-org-party-machine-source-credential.client'
import { TenantOrgPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/tenant-org-party-machine-source-credential.provider'
import { TenantOrgPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/tenant-org-party-execution-token-exchange.client'
import { TenantOrgPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/tenant-org-party-trusted-grpc-execution.producer'

export const TENANT_ORG_AUDIENCE = 'urn:oes:service:tenant-org-service'
const runtime = createLazyTrustedExecutionRuntime(TENANT_ORG_AUDIENCE)

/** Restricts TenantOrg calls to Gateway HUMAN, foundation OBO and exact public/pre-session MACHINE workloads. */
@Injectable()
export class TenantOrgFoundationTrustedExecutionGuard extends TrustedExecutionGuard implements CanActivate {
  constructor(reflector: Reflector, verifier: ExecutionTokenVerifier, identity: GrpcWorkloadIdentityProvider) {
    super(reflector, verifier, identity, TENANT_ORG_AUDIENCE)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const token = getAuthenticatedGrpcRequestContext(context.switchToRpc().getData())?.verifiedExecutionToken
    const workload = readWorkloadName(token?.clientId ?? '')
    const allowed = token?.principalType === 'MACHINE'
      ? ['auth-service', 'public-entry-service'].includes(workload)
      : token?.principalType === 'HUMAN' && token.sessionTerminal === 'WEB' && ['api-gateway', 'auth-service', 'identity-service', 'hr-service'].includes(workload)
    if (!allowed) throw new ForbiddenException('TenantOrg trusted caller is not permitted')
    return true
  }
}

/** Composes TenantOrg token-only ingress together with its preserved Party producer. */
@Global()
@Module({
  providers: [
    TenantOrgPartyTrustedGrpcClient, TenantOrgPartyMachineSourceCredentialClient, TenantOrgPartyMachineSourceCredentialProvider, TenantOrgPartyExecutionTokenExchangeClient,
    { provide: TenantOrgPartyTrustedGrpcExecutionProducer, useFactory: (source: TenantOrgPartyMachineSourceCredentialProvider, exchange: TenantOrgPartyExecutionTokenExchangeClient) => new TenantOrgPartyTrustedGrpcExecutionProducer(source, exchange), inject: [TenantOrgPartyMachineSourceCredentialProvider, TenantOrgPartyExecutionTokenExchangeClient] },
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    { provide: TenantOrgFoundationTrustedExecutionGuard, useFactory: (reflector: Reflector, verifier: ExecutionTokenVerifier, identity: GrpcWorkloadIdentityProvider) => new TenantOrgFoundationTrustedExecutionGuard(reflector, verifier, identity), inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider] }
  ],
  exports: [TenantOrgPartyTrustedGrpcClient, TenantOrgPartyTrustedGrpcExecutionProducer, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, TenantOrgFoundationTrustedExecutionGuard]
})
export class TenantOrgTrustedExecutionModule {}

/** Extracts one canonical workload name from a verified SPIFFE URI. */
function readWorkloadName(spiffeId: string): string { try { const value = new URL(spiffeId); return value.protocol === 'spiffe:' ? value.pathname.split('/').filter(Boolean).at(-1) ?? '' : '' } catch { return '' } }
