import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  BindExistingPartyToTenantInput,
  CreateOrganizationPartyInput,
  CreatePersonPartyInput,
  DeactivateTenantPartyInput,
  PARTY_IDENTIFIER_REPOSITORY,
  PARTY_REPOSITORY,
  PartyIdentifierRepository,
  PartyRepository,
  PARTY_REPOSITORY as PARTY_REPOSITORY_TOKEN,
  PARTY_IDENTIFIER_REPOSITORY as PARTY_IDENTIFIER_REPOSITORY_TOKEN,
  TENANT_PARTY_REPOSITORY,
  TenantPartyRepository
} from '../../domain/repositories'

/** PartyRegistrationService coordinates canonical party creation, strong-match reuse, and tenant binding writes. */
@Injectable()
export class PartyRegistrationService {
  constructor(
    @Inject(PARTY_REPOSITORY_TOKEN)
    private readonly partyRepository: PartyRepository,
    @Inject(TENANT_PARTY_REPOSITORY)
    private readonly tenantPartyRepository: TenantPartyRepository,
    @Inject(PARTY_IDENTIFIER_REPOSITORY_TOKEN)
    private readonly partyIdentifierRepository: PartyIdentifierRepository
  ) {}

  async registerPersonParty(input: CreatePersonPartyInput) {
    const canonicalName = this.normalizeRequiredName(input.canonicalName)
    const strongMatch = await this.partyIdentifierRepository.findStrongMatch(input.identifiers)

    if (strongMatch) {
      const tenantParty = await this.createTenantBinding(input.tenantId, strongMatch.id, input.localDisplayName, input.localCode)
      return { party: strongMatch, tenantParty, matchResult: 'STRONG_MATCH_REUSED' }
    }

    const party = await this.partyRepository.createPersonParty({
      canonicalName,
      displayName: input.localDisplayName ?? canonicalName
    })
    await this.partyIdentifierRepository.createMany(party.id, input.identifiers)
    const tenantParty = await this.tenantPartyRepository.create({
      tenantId: input.tenantId,
      partyId: party.id,
      localDisplayName: input.localDisplayName,
      localCode: input.localCode
    })
    return { party, tenantParty, matchResult: 'CREATED' }
  }

  async registerOrganizationParty(input: CreateOrganizationPartyInput) {
    const canonicalName = this.normalizeRequiredName(input.canonicalName)
    const strongMatch = await this.partyIdentifierRepository.findStrongMatch(input.identifiers)

    if (strongMatch) {
      const tenantParty = await this.createTenantBinding(input.tenantId, strongMatch.id, input.localDisplayName, input.localCode)
      return { party: strongMatch, tenantParty, matchResult: 'STRONG_MATCH_REUSED' }
    }

    const party = await this.partyRepository.createOrganizationParty({
      canonicalName,
      displayName: input.localDisplayName ?? canonicalName,
      registeredCountry: input.registeredCountry
    })
    await this.partyIdentifierRepository.createMany(party.id, input.identifiers)
    const tenantParty = await this.tenantPartyRepository.create({
      tenantId: input.tenantId,
      partyId: party.id,
      localDisplayName: input.localDisplayName,
      localCode: input.localCode
    })
    return { party, tenantParty, matchResult: 'CREATED' }
  }

  async bindExistingPartyToTenant(input: BindExistingPartyToTenantInput) {
    const existing = await this.tenantPartyRepository.findByTenantAndPartyId(input.tenantId, input.partyId)
    if (existing) {
      throw new ConflictException(`Tenant ${input.tenantId} already bound party ${input.partyId}`)
    }

    const party = await this.partyRepository.findById(input.partyId)
    if (!party) {
      throw new NotFoundException(`Party ${input.partyId} not found`)
    }

    const tenantParty = await this.tenantPartyRepository.create({
      tenantId: input.tenantId,
      partyId: input.partyId,
      localDisplayName: input.localDisplayName,
      localCode: input.localCode,
      tags: input.tags
    })

    return { party, tenantParty }
  }

  async deactivateTenantParty(input: DeactivateTenantPartyInput) {
    return this.tenantPartyRepository.deactivate(input)
  }

  private normalizeRequiredName(value: string): string {
    const canonicalName = value.trim()
    if (!canonicalName) {
      throw new BadRequestException('canonicalName is required')
    }
    return canonicalName
  }

  private async createTenantBinding(
    tenantId: string,
    partyId: string,
    localDisplayName?: string,
    localCode?: string,
    tags?: string[]
  ) {
    const existing = await this.tenantPartyRepository.findByTenantAndPartyId(tenantId, partyId)
    if (existing) {
      throw new ConflictException(`Tenant ${tenantId} already bound party ${partyId}`)
    }

    return this.tenantPartyRepository.create({
      tenantId,
      partyId,
      localDisplayName,
      localCode,
      tags
    })
  }
}
