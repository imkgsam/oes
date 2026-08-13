import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, ExecutionTokenVerifier, getAuthenticatedGrpcRequestContext, RPC_AUTHORIZATION_MODE_METADATA_KEY, TrustedInternalExecutionGuard } from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'

export const PARTY_AUDIENCE = 'urn:oes:service:party-service'
export const PARTY_INTERNAL_PERMISSION_CODES = {
  REGISTER_TENANT_PARTY: 'party.internal.register_tenant_party',
  DEACTIVATE_TENANT_PARTY: 'party.internal.deactivate_tenant_party',
  GET_TENANT_PARTY_BY_ID: 'party.internal.get_tenant_party_by_id',
  RESOLVE_TENANT_PARTY_BY_IDENTIFIER: 'party.internal.resolve_tenant_party_by_identifier',
  RESOLVE_TENANT_PARTY_FOR_CONSUMER: 'party.internal.resolve_tenant_party_for_consumer',
  SEARCH_TENANT_PARTY_CANDIDATES: 'party.internal.search_tenant_party_candidates'
} as const
const runtime = createLazyTrustedExecutionRuntime(PARTY_AUDIENCE)

/** Frozen Party INTERNAL Code-to-workload issuance matrix. Empty entries are intentionally unavailable. */
export const PARTY_INTERNAL_WORKLOAD_ALLOWLIST: Readonly<Record<string, readonly string[]>> = Object.freeze({
  [PARTY_INTERNAL_PERMISSION_CODES.REGISTER_TENANT_PARTY]: ['identity-service', 'hr-service', 'tenant-org-service', 'crm-service'],
  [PARTY_INTERNAL_PERMISSION_CODES.DEACTIVATE_TENANT_PARTY]: ['tenant-org-service'],
  [PARTY_INTERNAL_PERMISSION_CODES.GET_TENANT_PARTY_BY_ID]: ['api-gateway', 'hr-service', 'tenant-org-service', 'crm-service', 'srm-service'],
  [PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_BY_IDENTIFIER]: [],
  [PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_FOR_CONSUMER]: ['crm-service'],
  [PARTY_INTERNAL_PERMISSION_CODES.SEARCH_TENANT_PARTY_CANDIDATES]: []
})

/** Narrows Party's INTERNAL boundary to a tenant-scoped SYSTEM MACHINE ET after Common verifies transport and Code binding. */
@Injectable()
export class PartyTrustedExecutionGuard extends TrustedInternalExecutionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(context.switchToRpc().getData())?.verifiedExecutionToken
    if (verified?.principalType !== 'MACHINE' || !verified.tenantId?.trim()) {
      throw new ForbiddenException('Party INTERNAL execution requires a tenant-scoped MACHINE principal')
    }
    const declaration = Reflect.getMetadata(RPC_AUTHORIZATION_MODE_METADATA_KEY, context.getHandler()) as
      | { mode?: string; permissions?: { all?: readonly string[] } }
      | undefined
    const requiredCodes = declaration?.mode === 'INTERNAL' ? declaration.permissions?.all ?? [] : []
    if (!requiredCodes.length || requiredCodes.some((code) => !PARTY_INTERNAL_WORKLOAD_ALLOWLIST[code]?.includes(verified.clientId))) {
      throw new ForbiddenException('Party INTERNAL workload is not permitted for this RPC')
    }
    return true
  }
}

@Module({
  providers: [
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    { provide: String, useValue: PARTY_AUDIENCE },
    {
      provide: PartyTrustedExecutionGuard,
      useFactory: (reflector: Reflector, verifier: ExecutionTokenVerifier, identity: GrpcWorkloadIdentityProvider, audience: string) =>
        new PartyTrustedExecutionGuard(reflector, verifier, identity, audience),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String]
    }
  ],
  exports: [ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String, PartyTrustedExecutionGuard]
})
export class PartyTrustedExecutionModule {}
