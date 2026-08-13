import { Injectable, OnModuleInit } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceClient,
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { safeGrpcCall } from '@oes/common/transport'
import { CrmPartyTrustedGrpcExecutionProducer } from './crm-party-trusted-grpc-execution.producer'
import { PartyTrustedGrpcClient } from './party-trusted-grpc.client'
import {
  TenantPartyLookupPort,
  TenantPartyLookupResult
} from '../../application/ports/tenant-party-lookup.port'
import {
  RegisterTenantPartyFromCrmInput,
  RegisterTenantPartyFromCrmResult,
  ResolveTenantPartyForConsumerInput,
  ResolveTenantPartyForConsumerResult,
  TenantPartyResolutionPort,
  TenantPartyResolutionResultType
} from '../../application/ports/tenant-party-resolution.port'

/** PartyQueryGrpcAdapter validates and resolves tenant-scoped parties through party-service gRPC contracts. */
@Injectable()
export class PartyQueryGrpcAdapter
  implements TenantPartyLookupPort, TenantPartyResolutionPort, OnModuleInit
{
  private partyQueryService!: PartyQueryServiceClient
  private partyRegistrationService!: PartyRegistrationServiceClient

  constructor(
    private readonly partyClient: PartyTrustedGrpcClient,
    private readonly producer: CrmPartyTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.partyQueryService = this.partyClient.query()
    this.partyRegistrationService = this.partyClient.registration()
  }

  async getTenantPartyById(
    tenantId: string,
    tenantPartyId: string
  ): Promise<TenantPartyLookupResult | null> {
    const response = await safeGrpcCall(
      this.partyQueryService.getTenantPartyById(
        {
          tenantPartyId
        },
        await this.buildMetadata('party.internal.get_tenant_party_by_id')
      ),
      {
        caller: SERVICE_NAMES.CRM,
        method: 'PartyQueryService.getTenantPartyById'
      }
    )

    const tenantParty = response.tenantParty
    if (!tenantParty?.id?.trim()) {
      return null
    }

    return {
      tenantId: tenantParty.tenantId ?? tenantId,
      tenantPartyId: tenantParty.id,
      status: tenantParty.status ?? '',
      partyDisplayName: tenantParty.displayName ?? ''
    }
  }

  /** resolveTenantPartyForConsumer asks party-service to classify tenant-local subject evidence. */
  async resolveTenantPartyForConsumer(
    input: ResolveTenantPartyForConsumerInput
  ): Promise<ResolveTenantPartyForConsumerResult> {
    const response = await safeGrpcCall(
      this.partyQueryService.resolveTenantPartyForConsumer(
        {
          typeHint: input.typeHint,
          name: input.name,
          country: input.country ?? '',
          domain: firstProfileValue(input.profileItems, 'DOMAIN'),
          email: firstProfileValue(input.profileItems, 'EMAIL'),
          phone: firstProfileValue(input.profileItems, 'PHONE'),
          whatsapp: firstProfileValue(input.profileItems, 'WHATSAPP'),
          identifiers: input.identifiers.map((identifier) => ({
            identifierType: identifier.identifierType,
            normalizedValue: identifier.normalizedValue,
            rawValue: identifier.rawValue ?? '',
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
            status: 'ACTIVE'
          }))
        },
        await this.buildMetadata('party.internal.resolve_tenant_party_for_consumer')
      ),
      {
        caller: SERVICE_NAMES.CRM,
        method: 'PartyQueryService.resolveTenantPartyForConsumer'
      }
    )

    return {
      resultType: toTenantPartyResolutionResultType(response.result),
      tenantPartyId: response.tenantParty?.id ?? null,
      displayName: response.tenantParty?.displayName ?? null,
      candidates: (response.candidates ?? []).map((candidate) => ({
        tenantPartyId: candidate.tenantParty?.id ?? '',
        displayName: candidate.tenantParty?.displayName ?? '',
        confidence: candidate.confidence ?? 0,
        matchedFields: candidate.matchedFields ?? [],
        conflictFlags: candidate.conflictFlags ?? []
      })),
      matchedFields: response.matchedFields ?? []
    }
  }

  /** registerTenantParty creates a tenant-scoped party only after CRM has accepted formalization. */
  async registerTenantParty(
    input: RegisterTenantPartyFromCrmInput
  ): Promise<RegisterTenantPartyFromCrmResult> {
    const response = await safeGrpcCall(
      this.partyRegistrationService.registerTenantParty(
        {
          type: input.typeHint,
          legalName: input.legalName,
          displayName: input.displayName,
          localCode: '',
          registeredCountry: input.country ?? '',
          identifiers: input.identifiers.map((identifier) => ({
            identifierType: identifier.identifierType,
            normalizedValue: identifier.normalizedValue,
            rawValue: identifier.rawValue ?? '',
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
            status: 'ACTIVE'
          })),
          idempotencyKey: `crm:${input.tenantId}:${input.legalName}`,
          profileItems: (input.profileItems ?? []).map((profileItem) => ({
            itemType: profileItem.itemType,
            normalizedValue: profileItem.normalizedValue,
            rawValue: profileItem.rawValue ?? profileItem.normalizedValue,
            label: profileItem.label ?? 'CRM account profile',
            role: profileItem.role ?? '',
            status: 'ASSERTED'
          }))
        },
        await this.buildMetadata('party.internal.register_tenant_party')
      ),
      {
        caller: SERVICE_NAMES.CRM,
        method: 'PartyRegistrationService.registerTenantParty'
      }
    )

    return {
      tenantPartyId: response.tenantParty?.id ?? '',
      displayName: response.tenantParty?.displayName ?? input.displayName
    }
  }

  /** buildMetadata forwards trace/request context while keeping party lookup on the internal-service boundary. */
  private async buildMetadata(code: string) {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata(code, current?.requestId, current?.traceId)
  }
}

/** toTenantPartyResolutionResultType maps party-service string results into CRM application enum values. */
function toTenantPartyResolutionResultType(result?: string): TenantPartyResolutionResultType {
  if (result === TenantPartyResolutionResultType.EXACT_MATCH) {
    return TenantPartyResolutionResultType.EXACT_MATCH
  }
  if (result === TenantPartyResolutionResultType.CANDIDATES_FOUND) {
    return TenantPartyResolutionResultType.CANDIDATES_FOUND
  }
  if (result === TenantPartyResolutionResultType.IDENTITY_CONFLICT) {
    return TenantPartyResolutionResultType.IDENTITY_CONFLICT
  }

  return TenantPartyResolutionResultType.NO_MATCH
}

/** firstProfileValue derives Party query evidence from CRM account profile items instead of lead field snapshots. */
function firstProfileValue(
  profileItems: ResolveTenantPartyForConsumerInput['profileItems'] = [],
  itemType: string
): string {
  return profileItems.find(
    (profileItem) => profileItem.itemType === itemType && profileItem.normalizedValue.trim()
  )?.normalizedValue ?? ''
}
