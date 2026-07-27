import { createHash } from 'crypto'
import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common'
import {
  DeactivateTenantPartyInput,
  PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY,
  PartyRegistrationIdempotencyRepository,
  RegisterTenantPartyInput,
  TENANT_PARTY_REPOSITORY,
  TenantPartyRepository
} from '../../domain/repositories'
import { PartyType } from '../../domain/value-objects'

/** PartyRegistrationService coordinates tenant-scoped TenantParty registration and lifecycle writes. */
@Injectable()
export class PartyRegistrationService {
  constructor(
    @Inject(TENANT_PARTY_REPOSITORY)
    private readonly tenantPartyRepository: TenantPartyRepository,
    @Optional()
    @Inject(PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY)
    private readonly idempotencyRepository?: PartyRegistrationIdempotencyRepository
  ) {}

  async registerTenantParty(input: RegisterTenantPartyInput) {
    const tenantId = this.normalizeRequiredTenantId(input.tenantId)
    const legalName = this.normalizeRequiredName(input.legalName)
    const type = this.normalizeRequiredType(input.type)
    const identifiers = input.identifiers ?? []
    const profileItems = input.profileItems ?? []
    const idempotency = await this.resolveIdempotency(
      'REGISTER_TENANT_PARTY',
      {
        tenantId,
        type,
        legalName,
        registeredCountry: input.registeredCountry ?? '',
        displayName: input.displayName ?? '',
        localCode: input.localCode ?? '',
        identifiers,
        profileItems
      },
      input.idempotencyKey
    )
    if (idempotency.record) {
      return this.fromIdempotencyRecord(idempotency.record)
    }

    const strongMatch = await this.tenantPartyRepository.findByTenantAndIdentifier(tenantId, identifiers)
    if (strongMatch) {
      return this.saveIdempotentResult(idempotency, {
        tenantParty: strongMatch,
        matchResult: 'STRONG_MATCH_REUSED'
      })
    }

    const tenantParty = await this.tenantPartyRepository.create({
      tenantId,
      type,
      legalName,
      displayName: input.displayName,
      localCode: input.localCode,
      registeredCountry: input.registeredCountry,
      identifiers,
      profileItems,
      idempotencyKey: input.idempotencyKey
    })
    return this.saveIdempotentResult(idempotency, { tenantParty, matchResult: 'CREATED' })
  }

  async deactivateTenantParty(input: DeactivateTenantPartyInput) {
    return this.tenantPartyRepository.deactivate(input)
  }

  private normalizeRequiredTenantId(value: string): string {
    const tenantId = value.trim()
    if (!tenantId) {
      throw new BadRequestException('tenantId is required')
    }
    return tenantId
  }

  private normalizeRequiredName(value: string): string {
    const legalName = value.trim()
    if (!legalName) {
      throw new BadRequestException('legalName is required')
    }
    return legalName
  }

  private normalizeRequiredType(value: PartyType): PartyType {
    if (value !== PartyType.PERSON && value !== PartyType.ORGANIZATION) {
      throw new BadRequestException('type must be PERSON or ORGANIZATION')
    }
    return value
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
      throw new BadRequestException(`Idempotency key ${normalizedKey} was already used with a different request`)
    }

    return { key: normalizedKey, requestHash, operation, record }
  }

  /** saveIdempotentResult records a completed TenantParty registration result when the caller supplied an idempotency key. */
  private async saveIdempotentResult<T extends { tenantParty: { id: string }; matchResult?: string }>(
    idempotency: { key?: string; requestHash?: string; operation?: string },
    result: T
  ): Promise<T> {
    if (idempotency.key && idempotency.requestHash && this.idempotencyRepository) {
      await this.idempotencyRepository.saveCompleted({
        idempotencyKey: idempotency.key,
        requestHash: idempotency.requestHash,
        operation: idempotency.operation ?? 'REGISTER_TENANT_PARTY',
        tenantPartyId: result.tenantParty.id,
        matchResult: result.matchResult
      })
    }

    return result
  }

  /** fromIdempotencyRecord maps a stored TenantParty registration outcome back to the service result shape. */
  private fromIdempotencyRecord(record: {
    tenantParty: {
      id: string
      tenantId: string
      type: string
      legalName: string
      displayName?: string | null
      localCode?: string | null
      registeredCountry?: string | null
      status: string
    }
    matchResult?: string | null
  }) {
    return {
      tenantParty: {
        ...record.tenantParty,
        type: record.tenantParty.type as PartyType
      },
      matchResult: record.matchResult ?? undefined
    }
  }

  /** hashFingerprint produces a stable SHA-256 fingerprint for idempotency conflict checks. */
  private hashFingerprint(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex')
  }
}
