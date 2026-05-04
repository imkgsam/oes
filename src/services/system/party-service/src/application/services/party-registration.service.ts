import { createHash } from 'crypto'
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common'
import {
  BindExistingPartyToTenantInput,
  CreateOrganizationPartyInput,
  CreatePersonPartyInput,
  DeactivateTenantPartyInput,
  PartyRegistrationIdempotencyRepository,
  PARTY_IDENTIFIER_REPOSITORY,
  PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY,
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
    private readonly partyIdentifierRepository: PartyIdentifierRepository,
    @Optional()
    @Inject(PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY)
    private readonly idempotencyRepository?: PartyRegistrationIdempotencyRepository
  ) {}

  async registerPersonParty(input: CreatePersonPartyInput) {
    const legalName = this.normalizeRequiredName(input.legalName)
    const idempotency = await this.resolveIdempotency('REGISTER_PERSON_PARTY', {
      tenantId: this.normalizeOptionalTenantId(input.tenantId) ?? '',
      legalName,
      localDisplayName: input.localDisplayName ?? '',
      localCode: input.localCode ?? '',
      identifiers: input.identifiers
    }, input.idempotencyKey)
    if (idempotency.record) {
      return this.fromIdempotencyRecord(idempotency.record)
    }

    const strongMatch = await this.partyIdentifierRepository.findStrongMatch(input.identifiers)
    const tenantId = this.normalizeOptionalTenantId(input.tenantId)

    if (strongMatch) {
      const tenantParty = tenantId
        ? await this.createTenantBinding(tenantId, strongMatch.id, input.localDisplayName, input.localCode)
        : undefined
      return this.saveIdempotentResult(idempotency, {
        party: strongMatch,
        tenantParty,
        matchResult: 'STRONG_MATCH_REUSED'
      })
    }

    const party = await this.partyRepository.createPersonParty({
      legalName
    })
    await this.partyIdentifierRepository.createMany(party.id, input.identifiers)
    const tenantParty = tenantId
      ? await this.tenantPartyRepository.create({
          tenantId,
          partyId: party.id,
          localDisplayName: input.localDisplayName,
          localCode: input.localCode
        })
      : undefined
    return this.saveIdempotentResult(idempotency, { party, tenantParty, matchResult: 'CREATED' })
  }

  async registerOrganizationParty(input: CreateOrganizationPartyInput) {
    const legalName = this.normalizeRequiredName(input.legalName)
    const idempotency = await this.resolveIdempotency('REGISTER_ORGANIZATION_PARTY', {
      tenantId: this.normalizeOptionalTenantId(input.tenantId) ?? '',
      legalName,
      registeredCountry: input.registeredCountry ?? '',
      localDisplayName: input.localDisplayName ?? '',
      localCode: input.localCode ?? '',
      identifiers: input.identifiers
    }, input.idempotencyKey)
    if (idempotency.record) {
      return this.fromIdempotencyRecord(idempotency.record)
    }

    const strongMatch = await this.partyIdentifierRepository.findStrongMatch(input.identifiers)
    const tenantId = this.normalizeOptionalTenantId(input.tenantId)

    if (strongMatch) {
      const tenantParty = tenantId
        ? await this.createTenantBinding(tenantId, strongMatch.id, input.localDisplayName, input.localCode)
        : undefined
      return this.saveIdempotentResult(idempotency, {
        party: strongMatch,
        tenantParty,
        matchResult: 'STRONG_MATCH_REUSED'
      })
    }

    const party = await this.partyRepository.createOrganizationParty({
      legalName,
      registeredCountry: input.registeredCountry
    })
    await this.partyIdentifierRepository.createMany(party.id, input.identifiers)
    const tenantParty = tenantId
      ? await this.tenantPartyRepository.create({
          tenantId,
          partyId: party.id,
          localDisplayName: input.localDisplayName,
          localCode: input.localCode
        })
      : undefined
    return this.saveIdempotentResult(idempotency, { party, tenantParty, matchResult: 'CREATED' })
  }

  async bindExistingPartyToTenant(input: BindExistingPartyToTenantInput) {
    const idempotency = await this.resolveIdempotency('BIND_EXISTING_PARTY_TO_TENANT', {
      tenantId: input.tenantId,
      partyId: input.partyId,
      localDisplayName: input.localDisplayName ?? '',
      localCode: input.localCode ?? '',
      tags: input.tags ?? []
    }, input.idempotencyKey)
    if (idempotency.record) {
      return this.fromIdempotencyRecord(idempotency.record)
    }

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

    return this.saveIdempotentResult(idempotency, { party, tenantParty })
  }

  async deactivateTenantParty(input: DeactivateTenantPartyInput) {
    return this.tenantPartyRepository.deactivate(input)
  }

  private normalizeRequiredName(value: string): string {
    const legalName = value.trim()
    if (!legalName) {
      throw new BadRequestException('legalName is required')
    }
    return legalName
  }

  private normalizeOptionalTenantId(value: string): string | undefined {
    const tenantId = value.trim()
    return tenantId ? tenantId : undefined
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

  /** resolveIdempotency validates a caller idempotency key and returns any completed prior result. */
  private async resolveIdempotency(operation: string, fingerprintSource: unknown, idempotencyKey?: string) {
    const normalizedKey = idempotencyKey?.trim()
    if (!normalizedKey || !this.idempotencyRepository) {
      return { key: undefined, requestHash: undefined, operation, record: null }
    }

    const requestHash = this.hashFingerprint({ operation, fingerprintSource })
    const record = await this.idempotencyRepository.findByKey(normalizedKey)
    if (record && record.requestHash !== requestHash) {
      throw new ConflictException(`Idempotency key ${normalizedKey} was already used with a different request`)
    }

    return { key: normalizedKey, requestHash, operation, record }
  }

  /** saveIdempotentResult records a completed registration result when the caller supplied an idempotency key. */
  private async saveIdempotentResult<T extends { party: { id: string }; tenantParty?: { id: string }; matchResult?: string }>(
    idempotency: { key?: string; requestHash?: string; operation?: string },
    result: T
  ): Promise<T> {
    if (idempotency.key && idempotency.requestHash && this.idempotencyRepository) {
      await this.idempotencyRepository.saveCompleted({
        idempotencyKey: idempotency.key,
        requestHash: idempotency.requestHash,
        operation: idempotency.operation ?? 'PARTY_REGISTRATION',
        partyId: result.party.id,
        tenantPartyId: result.tenantParty?.id,
        matchResult: result.matchResult
      })
    }

    return result
  }

  /** fromIdempotencyRecord maps a stored registration outcome back to the application service result shape. */
  private fromIdempotencyRecord(record: {
    party: { id: string; type: string; status: string; legalName: string }
    tenantParty?: {
      id: string
      tenantId: string
      partyId: string
      localDisplayName?: string | null
      localCode?: string | null
      status: string
    } | null
    matchResult?: string | null
  }) {
    return {
      party: record.party,
      tenantParty: record.tenantParty ?? undefined,
      matchResult: record.matchResult ?? undefined
    }
  }

  /** hashFingerprint produces a stable SHA-256 fingerprint for idempotency conflict checks. */
  private hashFingerprint(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex')
  }
}
