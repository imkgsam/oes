import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  ArchiveCrmAccountResponse,
  CheckLeadDuplicateResponse,
  ClaimCrmAccountResponse,
  ConvertLeadToProspectCustomerResponse,
  CreateDraftLeadResponse,
  CreateLeadResponse,
  CrmAccountP1,
  DeleteDraftLeadResponse,
  GetCrmAccountResponse,
  ListCrmAccountsResponse,
  ListSourceRecordsResponse,
  ReleaseCrmAccountResponse,
  SubmitDraftLeadResponse,
  UpdateCrmAccountIdentifiersResponse,
  UpdateDraftLeadResponse
} from '@oes/common/generated/crm_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { CustomerManagementGrpcAdapter } from './adapters/customer-management-grpc.adapter'
import { CustomerQueryGrpcAdapter } from './adapters/customer-query-grpc.adapter'

@Injectable()
// Builds the tenant-scoped CRM customer-management BFF model without widening CRM contract ownership boundaries.
export class CustomerManagementService {
  constructor(
    private readonly customerQueryAdapter: CustomerQueryGrpcAdapter,
    private readonly customerManagementAdapter: CustomerManagementGrpcAdapter,
    private readonly identityQueryAdapter: IdentityQueryGrpcAdapter
  ) {}

  /** listCrmAccounts returns the paged CRM P1 workspace account model. */
  async listCrmAccounts(
    tenantId: string,
    query: {
      keyword?: string
      lifecycleStage?: string
      lifecycleStages?: string[]
      ownerAccountId?: string
      createdBy?: string
      ownerless?: boolean
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
        lifecycleStages: normalizeStringArray(query.lifecycleStages),
        recordStatus: normalize(query.recordStatus),
        ownerAccountId: normalize(query.ownerAccountId),
        createdBy: normalize(query.createdBy),
        ownerless: Boolean(query.ownerless),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return this.withAccountDisplayNamesInPage(mapCrmAccountP1Page(result), source)
  }

  /** getCrmAccount returns one CRM P1 account for the workspace detail panel. */
  async getCrmAccount(tenantId: string, crmAccountId: string, source: DownstreamRequestSource) {
    const result = await this.customerQueryAdapter.getCrmAccount(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId')
      },
      source
    )

    return this.withAccountDisplayNames(mapCrmAccountP1Detail(result), source)
  }

  /** listSourceRecords returns read-only CRM source evidence for the account detail tab. */
  async listSourceRecords(tenantId: string, crmAccountId: string, source: DownstreamRequestSource) {
    const result = await this.customerQueryAdapter.listSourceRecords(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId')
      },
      source
    )

    return this.withSourceRecordDisplayNames(mapListSourceRecordsResponse(result), source)
  }

  /** createLead creates one active CRM P1 lead with its primary source record. */
  async createLead(
    tenantId: string,
    input: {
      displayName: string
      duplicateWarningAcknowledged?: boolean
      leadLegalName?: string
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
      profileItems?: CrmAccountProfileItemInputModel[]
      leadPersonName?: string
      leadPhone?: string
      leadWhatsapp?: string
      nextFollowUpAt?: string
      partyTypeHint?: string
      priority?: string
      claimForCurrentUser?: boolean
      assignmentIntent?: string
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
        leadLegalName: normalize(input.leadLegalName),
        leadCompanyName: normalize(input.leadCompanyName),
        leadPersonName: normalize(input.leadPersonName),
        leadDomain: normalize(input.leadDomain),
        leadEmail: normalize(input.leadEmail),
        leadPhone: normalize(input.leadPhone),
        leadWhatsapp: normalize(input.leadWhatsapp),
        leadCountry: normalize(input.leadCountry),
        leadIdentifiers: normalizeLeadIdentifiers(input.leadIdentifiers),
        profileItems: normalizeProfileItems(input.profileItems),
        ownerAccountId: undefined,
        claimForCurrentUser: Boolean(input.claimForCurrentUser),
        assignmentIntent: resolveCreateLeadAssignmentIntent(
          input.assignmentIntent,
          input.sourceType
        ),
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

    return this.withAccountDisplayNamesInResponse(mapCreateLeadResponse(result), source)
  }

  /** createDraftLead saves one CRM P1 draft lead without entering active lead views. */
  async createDraftLead(
    tenantId: string,
    input: {
      displayName: string
      leadLegalName?: string
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
      profileItems?: CrmAccountProfileItemInputModel[]
      leadPersonName?: string
      leadPhone?: string
      leadWhatsapp?: string
      nextFollowUpAt?: string
      partyTypeHint?: string
      priority?: string
      sourceCapturedAt?: string
      sourceCapturedByAccountId?: string
      sourceExternalReference?: string
      sourceName?: string
      sourceNote?: string
      sourceRawPayload?: Record<string, unknown>
      sourceType?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.createDraftLead(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        ...mapLeadDraftInput(input),
        sourceType: normalize(input.sourceType),
        sourceName: normalize(input.sourceName),
        sourceCapturedAt: normalize(input.sourceCapturedAt),
        sourceCapturedByAccountId: normalize(input.sourceCapturedByAccountId),
        sourceExternalReference: normalize(input.sourceExternalReference),
        sourceRawPayloadJson: stringifyRawPayload(input.sourceRawPayload),
        sourceNote: normalize(input.sourceNote)
      },
      source
    )

    return this.withAccountDisplayNames(mapDraftLeadResponse(result), source)
  }

  /** updateDraftLead updates one draft lead before formal submit. */
  async updateDraftLead(
    tenantId: string,
    crmAccountId: string,
    input: Parameters<CustomerManagementService['createDraftLead']>[1],
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.updateDraftLead(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId'),
        ...mapLeadDraftInput(input)
      },
      source
    )

    return this.withAccountDisplayNames(mapDraftLeadResponse(result), source)
  }

  /** submitDraftLead promotes one draft lead to ACTIVE + LEAD after duplicate checks. */
  async submitDraftLead(
    tenantId: string,
    crmAccountId: string,
    input: {
      duplicateWarningAcknowledged?: boolean
      claimForCurrentUser?: boolean
      assignmentIntent?: string
      sourceCapturedAt?: string
      sourceCapturedByAccountId?: string
      sourceExternalReference?: string
      sourceName?: string
      sourceNote?: string
      sourceRawPayload?: Record<string, unknown>
      sourceType?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.submitDraftLead(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId'),
        duplicateWarningAcknowledged: Boolean(input.duplicateWarningAcknowledged),
        claimForCurrentUser: Boolean(input.claimForCurrentUser),
        assignmentIntent: resolveSubmitDraftLeadAssignmentIntent(input.assignmentIntent),
        sourceType: normalize(input.sourceType),
        sourceName: normalize(input.sourceName),
        sourceCapturedAt: normalize(input.sourceCapturedAt),
        sourceCapturedByAccountId: normalize(input.sourceCapturedByAccountId),
        sourceExternalReference: normalize(input.sourceExternalReference),
        sourceRawPayloadJson: stringifyRawPayload(input.sourceRawPayload),
        sourceNote: normalize(input.sourceNote)
      },
      source
    )

    return this.withAccountDisplayNamesInResponse(mapSubmitDraftLeadResponse(result), source)
  }

  /** deleteDraftLead hard-deletes one draft lead and its source records. */
  async deleteDraftLead(tenantId: string, crmAccountId: string, source: DownstreamRequestSource) {
    const result = await this.customerManagementAdapter.deleteDraftLead(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId')
      },
      source
    )

    return mapDeleteDraftLeadResponse(result)
  }

  /** claimCrmAccount assigns one ownerless Pool account to the current operator. */
  async claimCrmAccount(tenantId: string, crmAccountId: string, source: DownstreamRequestSource) {
    const result = await this.customerManagementAdapter.claimCrmAccount(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId')
      },
      source
    )

    return this.withAccountDisplayNames(mapClaimCrmAccountResponse(result), source)
  }

  /** releaseCrmAccount clears ownership so one CRM P1 account returns to the Pool. */
  async releaseCrmAccount(tenantId: string, crmAccountId: string, source: DownstreamRequestSource) {
    const result = await this.customerManagementAdapter.releaseCrmAccount(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId')
      },
      source
    )

    return this.withAccountDisplayNames(mapReleaseCrmAccountResponse(result), source)
  }

  /** archiveCrmAccount delegates CRM-owned archive reason semantics to crm-service. */
  async archiveCrmAccount(
    tenantId: string,
    crmAccountId: string,
    input: { archiveReason: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.archiveCrmAccount(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId'),
        archiveReason: requireNonBlank(input.archiveReason, 'archiveReason')
      },
      source
    )

    return this.withAccountDisplayNames(mapArchiveCrmAccountResponse(result), source)
  }

  /** updateCrmAccountIdentifiers replaces CRM-owned strong identifiers for eligible Lead or Prospect Customer records. */
  async updateCrmAccountIdentifiers(
    tenantId: string,
    crmAccountId: string,
    input: {
      leadIdentifiers?: Array<{
        identifierType: string
        normalizedValue: string
        rawValue?: string
        issuerCountryOrRegion?: string
      }>
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.updateCrmAccountIdentifiers(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId'),
        leadIdentifiers: normalizeLeadIdentifiers(input.leadIdentifiers)
      },
      source
    )

    return this.withAccountDisplayNames(mapUpdateCrmAccountIdentifiersResponse(result), source)
  }

  /** checkLeadDuplicate exposes the CRM duplicate check before create or submit decisions. */
  async checkLeadDuplicate(
    tenantId: string,
    input: {
      displayName?: string
      leadLegalName?: string
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
      profileItems?: CrmAccountProfileItemInputModel[]
      leadPersonName?: string
      leadPhone?: string
      leadWhatsapp?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerQueryAdapter.checkLeadDuplicate(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        displayName: normalize(input.displayName),
        leadLegalName: normalize(input.leadLegalName),
        leadCompanyName: normalize(input.leadCompanyName),
        leadPersonName: normalize(input.leadPersonName),
        leadDomain: normalize(input.leadDomain),
        leadEmail: normalize(input.leadEmail),
        leadPhone: normalize(input.leadPhone),
        leadWhatsapp: normalize(input.leadWhatsapp),
        leadCountry: normalize(input.leadCountry),
        leadIdentifiers: normalizeLeadIdentifiers(input.leadIdentifiers),
        profileItems: normalizeProfileItems(input.profileItems)
      },
      source
    )

    return mapCheckLeadDuplicateResponse(result)
  }

  /** convertLeadToProspectCustomer formalizes one CRM P1 lead through crm-service and party-service rules. */
  async convertLeadToProspectCustomer(
    tenantId: string,
    crmAccountId: string,
    input: {
      legalName: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.convertLeadToProspectCustomer(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        crmAccountId: requireNonBlank(crmAccountId, 'crmAccountId'),
        legalName: requireNonBlank(input.legalName, 'legalName'),
        allowOwnerlessConversion: hasPermission(source, 'crm.account.manage')
      },
      source
    )

    return this.withAccountDisplayNamesInResponse(
      mapConvertLeadToProspectCustomerResponse(result),
      source
    )
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

  /** withAccountDisplayNamesInPage attaches identity-service account labels to one CRM account page. */
  private async withAccountDisplayNamesInPage(
    page: CrmAccountP1PageModel,
    source: DownstreamRequestSource
  ): Promise<CrmAccountP1PageModel> {
    const accountNames = await this.loadAccountDisplayNames(page.crmAccounts, source)
    return {
      ...page,
      crmAccounts: page.crmAccounts.map((account) =>
        this.withAccountDisplayNamesFromMap(account, accountNames)
      )
    }
  }

  /** withAccountDisplayNames attaches display-only account labels to a CRM account view. */
  private async withAccountDisplayNames(
    account: CrmAccountP1Model | null,
    source: DownstreamRequestSource
  ): Promise<CrmAccountP1Model | null> {
    const accountNames = await this.loadAccountDisplayNames(account ? [account] : [], source)
    return this.withAccountDisplayNamesFromMap(account, accountNames)
  }

  /** withAccountDisplayNamesInResponse enriches command responses that carry one CRM account view. */
  private async withAccountDisplayNamesInResponse<
    T extends { crmAccount: CrmAccountP1Model | null }
  >(response: T, source: DownstreamRequestSource): Promise<T> {
    return {
      ...response,
      crmAccount: await this.withAccountDisplayNames(response.crmAccount, source)
    }
  }

  /** loadAccountDisplayNames resolves display-only account names without changing CRM ownership semantics. */
  private async loadAccountDisplayNames(
    accounts: Array<CrmAccountP1Model | null>,
    source: DownstreamRequestSource
  ): Promise<Map<string, string | undefined>> {
    const accountIds = [
      ...new Set(
        accounts
          .flatMap((account) => [normalize(account?.ownerAccountId), normalize(account?.createdBy)])
          .filter(Boolean)
      )
    ] as string[]
    return this.loadDisplayNameMap(accountIds, source)
  }

  /** loadDisplayNameMap resolves display-only account names for arbitrary CRM account references. */
  private async loadDisplayNameMap(
    accountIds: string[],
    source: DownstreamRequestSource
  ): Promise<Map<string, string | undefined>> {
    const entries = await Promise.all(
      [...new Set(accountIds)].map(async (accountId) => {
        const result = await this.identityQueryAdapter.getAccountById(accountId, source)
        return [accountId, normalize(result.account?.displayName)] as const
      })
    )
    return new Map(entries)
  }

  /** withSourceRecordDisplayNames attaches captured-by labels without changing source-record truth. */
  private async withSourceRecordDisplayNames(
    result: CrmSourceRecordListModel,
    source: DownstreamRequestSource
  ): Promise<CrmSourceRecordListModel> {
    const accountNames = await this.loadDisplayNameMap(
      result.sourceRecords
        .map((record) => normalize(record.capturedByAccountId))
        .filter((accountId): accountId is string => Boolean(accountId)),
      source
    )

    return {
      sourceRecords: result.sourceRecords.map((record) => ({
        ...record,
        capturedByDisplayName: record.capturedByAccountId
          ? (accountNames.get(record.capturedByAccountId) ?? '')
          : ''
      }))
    }
  }

  /** withAccountDisplayNamesFromMap adds display-only account names when identity-service returned them. */
  private withAccountDisplayNamesFromMap(
    account: CrmAccountP1Model | null,
    accountNames: Map<string, string | undefined>
  ): CrmAccountP1Model | null {
    if (!account) {
      return null
    }
    const ownerAccountId = normalize(account.ownerAccountId)
    const createdBy = normalize(account.createdBy)
    return {
      ...account,
      createdByDisplayName: createdBy ? (accountNames.get(createdBy) ?? '') : '',
      ownerDisplayName: ownerAccountId ? (accountNames.get(ownerAccountId) ?? '') : ''
    }
  }
}

type CrmAccountP1Model = NonNullable<ReturnType<typeof mapCrmAccountP1>> & {
  createdByDisplayName?: string
  ownerDisplayName?: string
}

type CrmAccountP1PageModel = ReturnType<typeof mapCrmAccountP1Page> & {
  crmAccounts: CrmAccountP1Model[]
}

type CrmSourceRecordListModel = ReturnType<typeof mapListSourceRecordsResponse>

interface CrmAccountProfileItemInputModel {
  itemType?: string
  normalizedValue?: string
  rawValue?: string
  label?: string
  role?: string
}

/** mapLeadDraftInput normalizes editable lead fields shared by draft create and update commands. */
function mapLeadDraftInput(input: {
  displayName: string
  leadLegalName?: string
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
  profileItems?: CrmAccountProfileItemInputModel[]
  leadPersonName?: string
  leadPhone?: string
  leadWhatsapp?: string
  nextFollowUpAt?: string
  partyTypeHint?: string
  priority?: string
}) {
  return {
    displayName: requireNonBlank(input.displayName, 'displayName'),
    partyTypeHint: normalize(input.partyTypeHint) ?? 'UNKNOWN',
    leadLegalName: normalize(input.leadLegalName),
    leadCompanyName: normalize(input.leadCompanyName),
    leadPersonName: normalize(input.leadPersonName),
    leadDomain: normalize(input.leadDomain),
    leadEmail: normalize(input.leadEmail),
    leadPhone: normalize(input.leadPhone),
    leadWhatsapp: normalize(input.leadWhatsapp),
    leadCountry: normalize(input.leadCountry),
    leadIdentifiers: normalizeLeadIdentifiers(input.leadIdentifiers),
    profileItems: normalizeProfileItems(input.profileItems),
    priority: normalize(input.priority) ?? 'C',
    nextFollowUpAt: normalize(input.nextFollowUpAt)
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

/** mapDraftLeadResponse converts one CRM draft mutation result into BFF JSON. */
function mapDraftLeadResponse(result: CreateDraftLeadResponse | UpdateDraftLeadResponse) {
  return mapCrmAccountP1(result.crmAccount)
}

/** mapSubmitDraftLeadResponse converts one draft submit result into the same BFF shape as active lead creation. */
function mapSubmitDraftLeadResponse(result: SubmitDraftLeadResponse) {
  return {
    resultType: result.resultType ?? '',
    crmAccount: mapCrmAccountP1(result.crmAccount),
    duplicateResult: mapDuplicateResult(result.duplicateResult)
  }
}

/** mapDeleteDraftLeadResponse exposes the hard-delete acknowledgement without leaking persistence details. */
function mapDeleteDraftLeadResponse(result: DeleteDraftLeadResponse) {
  return {
    deleted: Boolean(result.deleted),
    crmAccountId: result.crmAccountId ?? ''
  }
}

/** mapClaimCrmAccountResponse converts one claim command response into a CRM account view model. */
function mapClaimCrmAccountResponse(result: ClaimCrmAccountResponse) {
  return mapCrmAccountP1(result.crmAccount)
}

/** mapReleaseCrmAccountResponse converts one release command response into a CRM account view model. */
function mapReleaseCrmAccountResponse(result: ReleaseCrmAccountResponse) {
  return mapCrmAccountP1(result.crmAccount)
}

/** mapArchiveCrmAccountResponse converts one CRM archive command response into a CRM account view model. */
function mapArchiveCrmAccountResponse(result: ArchiveCrmAccountResponse) {
  return mapCrmAccountP1(result.crmAccount)
}

/** mapUpdateCrmAccountIdentifiersResponse converts one identifier update response into a CRM account view model. */
function mapUpdateCrmAccountIdentifiersResponse(result: UpdateCrmAccountIdentifiersResponse) {
  return mapCrmAccountP1(result.crmAccount)
}

/** mapCheckLeadDuplicateResponse converts one explicit duplicate check response into BFF JSON. */
function mapCheckLeadDuplicateResponse(result: CheckLeadDuplicateResponse) {
  return {
    duplicateResult: mapDuplicateResult(result.duplicateResult)
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

/** mapDuplicateResult converts CRM duplicate candidates into stable tenant-web JSON. */
function mapDuplicateResult(result: CreateLeadResponse['duplicateResult']) {
  return {
    resultType: result?.resultType ?? '',
    candidates: (result?.candidates ?? []).map((candidate) => ({
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

/** mapCrmAccountP1Detail converts one generated CRM P1 detail response into BFF JSON. */
function mapCrmAccountP1Detail(result: GetCrmAccountResponse) {
  return mapCrmAccountP1(result.crmAccount)
}

/** mapListSourceRecordsResponse converts CRM source evidence into tenant-web friendly JSON. */
function mapListSourceRecordsResponse(result: ListSourceRecordsResponse) {
  return {
    sourceRecords: (result.sourceRecords ?? []).map((source) => ({
      sourceRecordId: source.sourceRecordId ?? '',
      crmAccountId: source.crmAccountId ?? '',
      sourceType: source.sourceType ?? '',
      sourceName: source.sourceName ?? '',
      capturedAt: source.capturedAt ?? '',
      capturedByAccountId: source.capturedByAccountId ?? '',
      capturedByDisplayName: '',
      externalReference: source.externalReference ?? '',
      rawPayload: parseRawPayload(source.rawPayloadJson),
      note: source.note ?? '',
      isPrimary: Boolean(source.isPrimary),
      createdAt: source.createdAt ?? '',
      updatedAt: source.updatedAt ?? ''
    }))
  }
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
    archiveReason: account.archiveReason ?? '',
    partyTypeHint: account.partyTypeHint ?? '',
    displayName: account.displayName ?? '',
    leadLegalName: account.leadLegalName ?? '',
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
    profileItems: (account.profileItems ?? []).map((profileItem) => ({
      profileItemId: profileItem.profileItemId ?? '',
      itemType: profileItem.itemType ?? '',
      normalizedValue: profileItem.normalizedValue ?? '',
      rawValue: profileItem.rawValue ?? '',
      label: profileItem.label ?? '',
      role: profileItem.role ?? '',
      status: profileItem.status ?? '',
      sourceRecordId: profileItem.sourceRecordId ?? '',
      promotedTargetType: profileItem.promotedTargetType ?? '',
      promotedTargetId: profileItem.promotedTargetId ?? '',
      promotedAt: profileItem.promotedAt ?? '',
      createdAt: profileItem.createdAt ?? '',
      updatedAt: profileItem.updatedAt ?? ''
    })),
    ownerAccountId: account.ownerAccountId ?? '',
    createdByDisplayName: '',
    ownerDisplayName: '',
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

/** normalizeProfileItems trims CRM account-level profile item inputs before they cross the BFF boundary. */
function normalizeProfileItems(values?: CrmAccountProfileItemInputModel[]) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((value) => ({
      itemType: normalize(value.itemType) ?? '',
      normalizedValue: normalize(value.normalizedValue) ?? '',
      rawValue: normalize(value.rawValue),
      label: normalize(value.label),
      role: normalize(value.role)
    }))
    .filter((value) => value.itemType && value.normalizedValue)
}

/** stringifyRawPayload serializes optional source payloads for the CRM gRPC contract. */
function stringifyRawPayload(value?: Record<string, unknown>): string | undefined {
  if (!value) {
    return undefined
  }

  return JSON.stringify(value)
}

/** parseRawPayload restores optional CRM source payload JSON for display-only BFF responses. */
function parseRawPayload(value?: string): Record<string, unknown> | null {
  const normalized = normalize(value)
  if (!normalized) {
    return null
  }

  try {
    const parsed = JSON.parse(normalized)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** resolveCreateLeadAssignmentIntent maps BFF entry context into CRM's explicit owner assignment contract. */
function resolveCreateLeadAssignmentIntent(
  requestedIntent: string | undefined,
  sourceType: string | undefined
): string {
  const normalizedIntent = normalize(requestedIntent)
  if (normalizedIntent === 'POOL') {
    return 'POOL'
  }
  if (normalizedIntent === 'OWNED_BY_OPERATOR') {
    return 'OWNED_BY_OPERATOR'
  }
  if (normalize(sourceType) === 'WEBSITE_FORM') {
    return 'POOL'
  }

  return 'OWNED_BY_OPERATOR'
}

/** resolveSubmitDraftLeadAssignmentIntent keeps draft submit ownerful unless Pool is explicit. */
function resolveSubmitDraftLeadAssignmentIntent(requestedIntent: string | undefined): string {
  return normalize(requestedIntent) === 'POOL' ? 'POOL' : 'OWNED_BY_OPERATOR'
}

/** hasPermission checks the action codes embedded in the downstream source session. */
function hasPermission(source: DownstreamRequestSource, code: string): boolean {
  return source.user?.permissions?.includes(code) ?? false
}
