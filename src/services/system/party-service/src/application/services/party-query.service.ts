import { Inject, Injectable } from '@nestjs/common'
import {
  IdentifierInput,
  PARTY_REPOSITORY,
  PartyRepository,
  SearchPartyCandidatesInput,
  TENANT_PARTY_REPOSITORY,
  TenantPartyRepository
} from '../../domain/repositories'

/** PartyQueryService provides the read-only canonical and tenant-scoped party lookup APIs. */
@Injectable()
export class PartyQueryService {
  constructor(
    @Inject(PARTY_REPOSITORY)
    private readonly partyRepository: PartyRepository,
    @Inject(TENANT_PARTY_REPOSITORY)
    private readonly tenantPartyRepository: TenantPartyRepository
  ) {}

  async getPartyById(partyId: string) {
    return this.partyRepository.findById(partyId)
  }

  async getTenantPartyById(tenantId: string, tenantPartyId: string) {
    return this.tenantPartyRepository.findById(tenantId, tenantPartyId)
  }

  async resolvePartyByIdentifier(input: IdentifierInput) {
    return this.partyRepository.resolveByIdentifier(input)
  }

  async searchPartyCandidates(input: SearchPartyCandidatesInput) {
    return this.partyRepository.findCandidates(input)
  }

  async listPartyRelationships(partyId: string, relationshipType?: string) {
    return this.partyRepository.findRelationships(partyId, relationshipType as never)
  }
}
