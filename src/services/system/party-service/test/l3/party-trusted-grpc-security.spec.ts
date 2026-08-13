import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import { PARTY_INTERNAL_PERMISSION_CODES, PARTY_INTERNAL_WORKLOAD_ALLOWLIST, PartyTrustedExecutionGuard } from '../../src/modules/party-trusted-execution.module'
import { PartyQueryGrpcController } from '../../src/interfaces/grpc/party-query.grpc.controller'
import { PartyRegistrationGrpcController } from '../../src/interfaces/grpc/party-registration.grpc.controller'

describe('Party trusted gRPC security declarations', () => {
  const declarations = [
    [PartyRegistrationGrpcController, 'registerTenantParty', PARTY_INTERNAL_PERMISSION_CODES.REGISTER_TENANT_PARTY],
    [PartyRegistrationGrpcController, 'deactivateTenantParty', PARTY_INTERNAL_PERMISSION_CODES.DEACTIVATE_TENANT_PARTY],
    [PartyQueryGrpcController, 'getTenantPartyById', PARTY_INTERNAL_PERMISSION_CODES.GET_TENANT_PARTY_BY_ID],
    [PartyQueryGrpcController, 'resolveTenantPartyByIdentifier', PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_BY_IDENTIFIER],
    [PartyQueryGrpcController, 'resolveTenantPartyForConsumer', PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_FOR_CONSUMER],
    [PartyQueryGrpcController, 'searchTenantPartyCandidates', PARTY_INTERNAL_PERMISSION_CODES.SEARCH_TENANT_PARTY_CANDIDATES]
  ] as const

  it('declares exactly six INTERNAL RPCs with one exact Code each', () => {
    expect(declarations).toHaveLength(6)
    for (const [controller, method, code] of declarations) {
      expect(getRpcAuthorizationModeDeclaration(controller.prototype, method)).toEqual({
        mode: 'INTERNAL',
        permissions: { all: [code] }
      })
    }
  })

  it('guards both controller owners before handler execution', () => {
    expect(Reflect.getMetadata('__guards__', PartyRegistrationGrpcController)).toContain(PartyTrustedExecutionGuard)
    expect(Reflect.getMetadata('__guards__', PartyQueryGrpcController)).toContain(PartyTrustedExecutionGuard)
  })

  it('freezes the exact Code-to-workload matrix and preserves unavailable future RPCs', () => {
    expect(PARTY_INTERNAL_WORKLOAD_ALLOWLIST).toEqual({
      'party.internal.register_tenant_party': ['identity-service', 'hr-service', 'tenant-org-service', 'crm-service'],
      'party.internal.deactivate_tenant_party': ['tenant-org-service'],
      'party.internal.get_tenant_party_by_id': ['api-gateway', 'hr-service', 'tenant-org-service', 'crm-service', 'srm-service'],
      'party.internal.resolve_tenant_party_by_identifier': [],
      'party.internal.resolve_tenant_party_for_consumer': ['crm-service'],
      'party.internal.search_tenant_party_candidates': []
    })
  })
})
