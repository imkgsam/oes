import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Global,
  Injectable,
  Module
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  getAuthenticatedGrpcRequestContext,
  TENANT_TARGET_AUDIT_BINDER,
  TenantTargetAdmissionGuard,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { TenantOrgTenantTargetAuditBinder } from '../infrastructure/audit/tenant-target-admission-audit.binder'
import { TenantOrgPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { TenantOrgPartyMachineSourceCredentialClient } from '../infrastructure/adapters/tenant-org-party-machine-source-credential.client'
import { TenantOrgPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/tenant-org-party-machine-source-credential.provider'
import { TenantOrgPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/tenant-org-party-execution-token-exchange.client'
import { TenantOrgPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/tenant-org-party-trusted-grpc-execution.producer'
import {
  TenantOrgAuthTrustedGrpcClient,
  TenantOrgHrTrustedGrpcClient,
  TenantOrgIdentityTrustedGrpcClient,
  TenantOrgPermissionTrustedGrpcClient
} from '../infrastructure/adapters/foundation-trusted-grpc.clients'
import { TenantOrgTenantTargetAdmissionGuard } from './tenant-org-tenant-target-admission.guard'

export const TENANT_ORG_AUDIENCE = 'urn:oes:service:tenant-org-service'
export const TENANT_ORG_GATEWAY_SPIFFE_ID = resolveTenantOrgGatewaySpiffeId()
const runtime = createLazyTrustedExecutionRuntime(TENANT_ORG_AUDIENCE)

/** Restricts TenantOrg calls to Gateway HUMAN, foundation OBO and exact public/pre-session MACHINE workloads. */
@Injectable()
export class TenantOrgFoundationTrustedExecutionGuard
  extends TrustedExecutionGuard
  implements CanActivate
{
  constructor(
    reflector: Reflector,
    verifier: ExecutionTokenVerifier,
    identity: GrpcWorkloadIdentityProvider
  ) {
    super(reflector, verifier, identity, TENANT_ORG_AUDIENCE)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const token = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    const workload = readWorkloadName(token?.clientId ?? '')
    const allowed =
      token?.principalType === 'MACHINE'
        ? ['auth-service', 'public-entry-service'].includes(workload)
        : token?.principalType === 'HUMAN' &&
          token.sessionTerminal === 'WEB' &&
          ['api-gateway', 'auth-service', 'identity-service', 'hr-service'].includes(workload)
    if (!allowed) throw new ForbiddenException('TenantOrg trusted caller is not permitted')
    return true
  }
}

/** Composes TenantOrg token-only ingress together with its preserved Party producer. */
@Global()
@Module({
  providers: [
    TenantOrgAuthTrustedGrpcClient,
    TenantOrgHrTrustedGrpcClient,
    TenantOrgIdentityTrustedGrpcClient,
    TenantOrgPermissionTrustedGrpcClient,
    TenantOrgPartyTrustedGrpcClient,
    TenantOrgPartyMachineSourceCredentialClient,
    TenantOrgPartyMachineSourceCredentialProvider,
    TenantOrgPartyExecutionTokenExchangeClient,
    {
      provide: TenantOrgPartyTrustedGrpcExecutionProducer,
      useFactory: (
        source: TenantOrgPartyMachineSourceCredentialProvider,
        exchange: TenantOrgPartyExecutionTokenExchangeClient
      ) => new TenantOrgPartyTrustedGrpcExecutionProducer(source, exchange),
      inject: [
        TenantOrgPartyMachineSourceCredentialProvider,
        TenantOrgPartyExecutionTokenExchangeClient
      ]
    },
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    TenantOrgTenantTargetAuditBinder,
    {
      provide: TENANT_TARGET_AUDIT_BINDER,
      useExisting: TenantOrgTenantTargetAuditBinder
    },
    TenantTargetAdmissionGuard,
    TenantOrgTenantTargetAdmissionGuard,
    {
      provide: TenantOrgFoundationTrustedExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new TenantOrgFoundationTrustedExecutionGuard(reflector, verifier, identity),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    }
  ],
  exports: [
    TenantOrgAuthTrustedGrpcClient,
    TenantOrgHrTrustedGrpcClient,
    TenantOrgIdentityTrustedGrpcClient,
    TenantOrgPermissionTrustedGrpcClient,
    TenantOrgPartyTrustedGrpcClient,
    TenantOrgPartyTrustedGrpcExecutionProducer,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    TenantOrgFoundationTrustedExecutionGuard,
    TenantOrgTenantTargetAuditBinder,
    TENANT_TARGET_AUDIT_BINDER,
    TenantTargetAdmissionGuard,
    TenantOrgTenantTargetAdmissionGuard
  ]
})
export class TenantOrgTrustedExecutionModule {}

/** Resolves the deployment-owned Gateway identity and permits only the canonical local test default. */
function resolveTenantOrgGatewaySpiffeId(): string {
  const configured = process.env.TENANT_ORG_GATEWAY_SPIFFE_ID
  if (configured !== undefined) {
    if (configured.length > 0 && configured.trim() === configured) return configured
    throw new Error('TenantOrg Gateway SPIFFE identity is invalid')
  }
  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    return 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
  }
  throw new Error('TenantOrg Gateway SPIFFE identity is required')
}

/** Extracts one canonical workload name from a verified SPIFFE URI. */
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
