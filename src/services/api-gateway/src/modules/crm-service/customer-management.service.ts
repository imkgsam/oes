import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  ConvertLeadToProspectCustomerResponse,
  CreateLeadResponse,
  CrmAccountP1,
  GetCrmAccountResponse,
  ListCrmAccountsResponse
} from '@oes/common/generated/crm_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { CustomerManagementGrpcAdapter } from './adapters/customer-management-grpc.adapter'
import { CustomerQueryGrpcAdapter } from './adapters/customer-query-grpc.adapter'

@Injectable()
// Builds the tenant-scoped CRM customer-management BFF model without widening CRM contract ownership boundaries.
export class CustomerManagementService {
  constructor(
    private readonly customerQueryAdapter: CustomerQueryGrpcAdapter,
    private readonly customerManagementAdapter: CustomerManagementGrpcAdapter
  ) {}

  /** listCrmAccounts returns the paged CRM P1 workspace account model. */
  async listCrmAccounts(
    tenantId: string,
    query: {
      keyword?: string
      lifecycleStage?: string
      ownerAccountId?: string
      page?: number
      pageSize?: number
      recordStatus?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerQueryAdapter.listCrmAccounts(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        lifecycleStage: normalize(query.lifecycleStage),
        recordStatus: normalize(query.recordStatus),
        ownerAccountId: normalize(query.ownerAccountId),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return mapCrmAccountP1Page(result)
  }

  /** getCrmAccount returns one CRM P1 account for the workspace detail panel. */
  async getCrmAccount(
    tenantId: string,
    crmAccountId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.customerQueryAdapter.getCrmAccount(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId')
      },
      source
    )

    return mapCrmAccountP1Detail(result)
  }

  /** createLead creates one active CRM P1 lead with its primary source record. */
  async createLead(
    tenantId: string,
    input: {
      displayName: string
      duplicateWarningAcknowledged?: boolean
      leadCompanyName?: string
      leadCountry?: string
      leadDomain?: string
      leadEmail?: string
      leadIdentifiers?: Array<{
        identifierType: string
        normalizedValue: string
        rawValue?: string
        issuerCountryOrRegion?: string
      }>
      leadPersonName?: string
      leadPhone?: string
      leadWhatsapp?: string
      nextFollowUpAt?: string
      ownerAccountId?: string
      partyTypeHint?: string
      priority?: string
      sourceCapturedAt?: string
      sourceCapturedByAccountId?: string
      sourceExternalReference?: string
      sourceName?: string
      sourceNote?: string
      sourceRawPayload?: Record<string, unknown>
      sourceType: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.createLead(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        displayName: requireNonBlank(input.displayName, 'displayName'),
        partyTypeHint: normalize(input.partyTypeHint) ?? 'UNKNOWN',
        leadCompanyName: normalize(input.leadCompanyName),
        leadPersonName: normalize(input.leadPersonName),
        leadDomain: normalize(input.leadDomain),
        leadEmail: normalize(input.leadEmail),
        leadPhone: normalize(input.leadPhone),
        leadWhatsapp: normalize(input.leadWhatsapp),
        leadCountry: normalize(input.leadCountry),
        leadIdentifiers: normalizeLeadIdentifiers(input.leadIdentifiers),
        ownerAccountId: normalize(input.ownerAccountId),
        priority: normalize(input.priority) ?? 'C',
        nextFollowUpAt: normalize(input.nextFollowUpAt),
        duplicateWarningAcknowledged: Boolean(input.duplicateWarningAcknowledged),
        sourceType: requireNonBlank(input.sourceType, 'sourceType'),
        sourceName: normalize(input.sourceName),
        sourceCapturedAt: normalize(input.sourceCapturedAt),
        sourceCapturedByAccountId: normalize(input.sourceCapturedByAccountId),
        sourceExternalReference: normalize(input.sourceExternalReference),
        sourceRawPayloadJson: stringifyRawPayload(input.sourceRawPayload),
        sourceNote: normalize(input.sourceNote)
      },
      source
    )

    return mapCreateLeadResponse(result)
  }

  /** convertLeadToProspectCustomer formalizes one CRM P1 lead through crm-service and party-service rules. */
  async convertLeadToProspectCustomer(
    tenantId: string,
    crmAccountId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.convertLeadToProspectCustomer(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId')
      },
      source
    )

    return mapConvertLeadToProspectCustomerResponse(result)
  }

  /** resolveTenantId keeps tenant-scoped CRM requests pinned to the operator tenant unless the operator is at system scope. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage CRM customer accounts in their current tenant'
      )
    }

    return operatorTenantId
  }
}

/** mapCreateLeadResponse converts one CRM P1 create lead response into tenant-web friendly JSON. */
function mapCreateLeadResponse(result: CreateLeadResponse) {
  return {
    resultType: result.resultType ?? '',
    crmAccount: mapCrmAccountP1(result.crmAccount),
    duplicateResult: {
      resultType: result.duplicateResult?.resultType ?? '',
      candidates: (result.duplicateResult?.candidates ?? []).map((candidate) => ({
        crmAccountId: candidate.crmAccountId ?? '',
        tenantId: candidate.tenantId ?? '',
        displayName: candidate.displayName ?? '',
        ownerAccountId: candidate.ownerAccountId ?? '',
        recordStatus: candidate.recordStatus ?? '',
        lifecycleStage: candidate.lifecycleStage ?? '',
        matchedFields: normalizeStringArray(candidate.matchedFields),
        confidence: candidate.confidence ?? ''
      }))
    }
  }
}

/** mapConvertLeadToProspectCustomerResponse converts one CRM P1 formalization response into tenant-web friendly JSON. */
function mapConvertLeadToProspectCustomerResponse(result: ConvertLeadToProspectCustomerResponse) {
  return {
    resultType: result.resultType ?? '',
    crmAccount: mapCrmAccountP1(result.crmAccount),
    candidates: (result.candidates ?? []).map((candidate) => ({
      tenantPartyId: candidate.tenantPartyId ?? '',
      displayName: candidate.displayName ?? '',
      confidence: Number(candidate.confidence ?? 0),
      matchedFields: normalizeStringArray(candidate.matchedFields),
      conflictFlags: normalizeStringArray(candidate.conflictFlags)
    })),
    existingCrmAccountId: result.existingCrmAccountId ?? ''
  }
}

/** mapCrmAccountP1Page converts one generated CRM P1 workspace page into BFF JSON. */
function mapCrmAccountP1Page(result: ListCrmAccountsResponse) {
  return {
    crmAccounts: (result.crmAccounts ?? []).map((account) => mapCrmAccountP1(account)),
    total: Number(result.total ?? 0),
    page: Number(result.page ?? 1),
    pageSize: Number(result.pageSize ?? 20)
  }
}

/** mapCrmAccountP1Detail converts one generated CRM P1 detail response into BFF JSON. */
function mapCrmAccountP1Detail(result: GetCrmAccountResponse) {
  return mapCrmAccountP1(result.crmAccount)
}

/** mapCrmAccountP1 flattens one CRM P1 account generated payload into BFF JSON. */
function mapCrmAccountP1(account?: CrmAccountP1) {
  if (!account) {
    return null
  }

  return {
    crmAccountId: account.crmAccountId ?? '',
    tenantId: account.tenantId ?? '',
    tenantPartyId: account.tenantPartyId ?? '',
    recordStatus: account.recordStatus ?? '',
    lifecycleStage: account.lifecycleStage ?? '',
    partyTypeHint: account.partyTypeHint ?? '',
    displayName: account.displayName ?? '',
    leadCompanyName: account.leadCompanyName ?? '',
    leadPersonName: account.leadPersonName ?? '',
    leadDomain: account.leadDomain ?? '',
    leadEmail: account.leadEmail ?? '',
    leadPhone: account.leadPhone ?? '',
    leadWhatsapp: account.leadWhatsapp ?? '',
    leadCountry: account.leadCountry ?? '',
    leadIdentifiers: (account.leadIdentifiers ?? []).map((identifier) => ({
      identifierType: identifier.identifierType ?? '',
      normalizedValue: identifier.normalizedValue ?? '',
      rawValue: identifier.rawValue ?? '',
      issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? ''
    })),
    ownerAccountId: account.ownerAccountId ?? '',
    priority: account.priority ?? '',
    lastActivityAt: account.lastActivityAt ?? '',
    nextFollowUpAt: account.nextFollowUpAt ?? '',
    createdBy: account.createdBy ?? '',
    createdAt: account.createdAt ?? '',
    updatedAt: account.updatedAt ?? '',
    archivedAt: account.archivedAt ?? ''
  }
}

/** requireNonBlank trims one required string input and rejects blank values before they reach the downstream contract. */
function requireNonBlank(value: string | undefined, field: string): string {
  const normalized = normalize(value)
  if (!normalized) {
    throw new Error(`${field} is required`)
  }

  return normalized
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/** normalizeStringArray trims optional string arrays and drops blank values. */
function normalizeStringArray(values?: string[]): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values.map((value) => value.trim()).filter(Boolean)
}

/** normalizeLeadIdentifiers trims CRM lead identifier inputs before they cross the BFF boundary. */
function normalizeLeadIdentifiers(
  values?: Array<{
    identifierType: string
    normalizedValue: string
    rawValue?: string
    issuerCountryOrRegion?: string
  }>
) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((value) => ({
      identifierType: normalize(value.identifierType) ?? '',
      normalizedValue: normalize(value.normalizedValue) ?? '',
      rawValue: normalize(value.rawValue),
      issuerCountryOrRegion: normalize(value.issuerCountryOrRegion)
    }))
    .filter((value) => value.identifierType && value.normalizedValue)
}

/** stringifyRawPayload serializes optional source payloads for the CRM gRPC contract. */
function stringifyRawPayload(value?: Record<string, unknown>): string | undefined {
  if (!value) {
    return undefined
  }

  return JSON.stringify(value)
}
