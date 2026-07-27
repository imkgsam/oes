import {
  ArchiveCrmAccountResponse,
  ClaimCrmAccountResponse,
  ConvertLeadToProspectCustomerResponse,
  CreateDraftLeadResponse,
  CreateLeadResponse,
  CrmAccountP1,
  CrmAccountProfileItem as GrpcCrmAccountProfileItem,
  CrmDuplicateCandidate,
  CrmLeadDuplicateResult,
  CrmPartyCandidate,
  CrmSourceRecord as GrpcCrmSourceRecord,
  DeleteDraftLeadResponse,
  GetCrmAccountResponse,
  ListCrmAccountsResponse,
  ListSourceRecordsResponse,
  ReleaseCrmAccountResponse,
  SubmitDraftLeadResponse,
  UpdateCrmAccountIdentifiersResponse,
  UpdateDraftLeadResponse
} from '@oes/common/generated/crm_service'
import {
  CrmAccountRecord,
  CrmLeadConversionResultType,
  CrmLeadCreateResultType,
  CrmSourceRecord
} from '../../domain/models/crm-records'
import { ArchiveCrmAccountResult } from '../../application/commands/archive-crm-account.handler'
import { ClaimCrmAccountResult } from '../../application/commands/claim-crm-account.handler'
import { ConvertLeadToProspectCustomerResult } from '../../application/commands/convert-lead-to-prospect-customer.handler'
import { CreateDraftLeadResult } from '../../application/commands/create-draft-lead.handler'
import { CreateLeadResult } from '../../application/commands/create-lead.handler'
import { DeleteDraftLeadResult } from '../../application/commands/delete-draft-lead.handler'
import { ReleaseCrmAccountResult } from '../../application/commands/release-crm-account.handler'
import { SubmitDraftLeadResult } from '../../application/commands/submit-draft-lead.handler'
import { UpdateCrmAccountIdentifiersResult } from '../../application/commands/update-crm-account-identifiers.handler'
import { UpdateDraftLeadResult } from '../../application/commands/update-draft-lead.handler'
import { GetCrmAccountResult } from '../../application/queries/get-crm-account.handler'
import { ListCrmAccountsResult } from '../../application/queries/list-crm-accounts.handler'
import { ListSourceRecordsResult } from '../../application/queries/list-source-records.handler'
import { CrmAccountDuplicateCandidate } from '../../domain/repositories/crm-account.repository'

/** CustomerGrpcPresenter maps CRM domain records into the frozen phase 1 gRPC response shapes. */
export class CustomerGrpcPresenter {
  /** toCrmAccountP1 renders one CRM v2 account shell for P1 lead/customer workflows. */
  static toCrmAccountP1(account: CrmAccountRecord): CrmAccountP1 {
    return {
      crmAccountId: account.id,
      tenantId: account.tenantId,
      tenantPartyId: account.tenantPartyId ?? '',
      recordStatus: account.recordStatus,
      lifecycleStage: account.lifecycleStage,
      partyTypeHint: account.partyTypeHint,
      displayName: account.displayName,
      leadLegalName: account.leadLegalName ?? '',
      leadCompanyName: account.leadCompanyName ?? '',
      leadPersonName: account.leadPersonName ?? '',
      leadDomain: account.leadDomain ?? '',
      leadEmail: account.leadEmail ?? '',
      leadPhone: account.leadPhone ?? '',
      leadWhatsapp: account.leadWhatsapp ?? '',
      leadCountry: account.leadCountry ?? '',
      leadIdentifiers: account.leadIdentifiers.map((identifier) => ({
        identifierType: identifier.identifierType,
        normalizedValue: identifier.normalizedValue,
        rawValue: identifier.rawValue ?? '',
        issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? ''
      })),
      ownerAccountId: account.ownerAccountId ?? '',
      priority: account.priority,
      lastActivityAt: toIsoString(account.lastActivityAt),
      nextFollowUpAt: toIsoString(account.nextFollowUpAt),
      createdBy: account.createdBy,
      createdAt: toIsoString(account.createdAt),
      updatedAt: toIsoString(account.updatedAt),
      archivedAt: toIsoString(account.archivedAt),
      archiveReason: account.archiveReason ?? '',
      profileItems: (account.profileItems ?? []).map(toCrmAccountProfileItem)
    }
  }

  /** toCreateLeadResponse renders one P1 CreateLead use-case result. */
  static toCreateLeadResponse(result: CreateLeadResult): CreateLeadResponse {
    return {
      resultType: result.resultType,
      crmAccount: result.account ? this.toCrmAccountP1(result.account) : undefined,
      duplicateResult: {
        resultType: result.duplicateResult.resultType,
        candidates: result.duplicateResult.candidates.map(toCrmDuplicateCandidate)
      }
    }
  }

  /** toConvertLeadToProspectCustomerResponse renders one P1 formalization result. */
  static toConvertLeadToProspectCustomerResponse(
    result: ConvertLeadToProspectCustomerResult
  ): ConvertLeadToProspectCustomerResponse {
    return {
      resultType: result.resultType,
      crmAccount: result.account ? this.toCrmAccountP1(result.account) : undefined,
      candidates: result.candidates.map(
        (candidate): CrmPartyCandidate => ({
          tenantPartyId: candidate.tenantPartyId,
          displayName: candidate.displayName,
          confidence: candidate.confidence,
          matchedFields: candidate.matchedFields,
          conflictFlags: candidate.conflictFlags
        })
      ),
      existingCrmAccountId: result.existingCrmAccountId ?? ''
    }
  }

  /** toCreateDraftLeadResponse renders one saved draft lead. */
  static toCreateDraftLeadResponse(result: CreateDraftLeadResult): CreateDraftLeadResponse {
    return {
      crmAccount: this.toCrmAccountP1(result.account)
    }
  }

  /** toUpdateDraftLeadResponse renders one updated draft lead. */
  static toUpdateDraftLeadResponse(result: UpdateDraftLeadResult): UpdateDraftLeadResponse {
    return {
      crmAccount: this.toCrmAccountP1(result.account)
    }
  }

  /** toUpdateCrmAccountIdentifiersResponse renders one CRM strong identifier update result. */
  static toUpdateCrmAccountIdentifiersResponse(
    result: UpdateCrmAccountIdentifiersResult
  ): UpdateCrmAccountIdentifiersResponse {
    return {
      crmAccount: this.toCrmAccountP1(result.account)
    }
  }

  /** toSubmitDraftLeadResponse renders one draft submit result with duplicate classification. */
  static toSubmitDraftLeadResponse(result: SubmitDraftLeadResult): SubmitDraftLeadResponse {
    return {
      resultType: result.resultType,
      crmAccount: result.account ? this.toCrmAccountP1(result.account) : undefined,
      duplicateResult: {
        resultType: result.duplicateResult.resultType,
        candidates: result.duplicateResult.candidates.map(toCrmDuplicateCandidate)
      }
    }
  }

  /** toDeleteDraftLeadResponse renders one hard delete acknowledgement. */
  static toDeleteDraftLeadResponse(result: DeleteDraftLeadResult): DeleteDraftLeadResponse {
    return {
      deleted: result.deleted,
      crmAccountId: result.crmAccountId
    }
  }

  /** toClaimCrmAccountResponse renders one claimed Pool record. */
  static toClaimCrmAccountResponse(result: ClaimCrmAccountResult): ClaimCrmAccountResponse {
    return {
      crmAccount: this.toCrmAccountP1(result.account)
    }
  }

  /** toReleaseCrmAccountResponse renders one released Pool record. */
  static toReleaseCrmAccountResponse(result: ReleaseCrmAccountResult): ReleaseCrmAccountResponse {
    return {
      crmAccount: this.toCrmAccountP1(result.account)
    }
  }

  /** toArchiveCrmAccountResponse renders one archived CRM account with its CRM-owned reason. */
  static toArchiveCrmAccountResponse(result: ArchiveCrmAccountResult): ArchiveCrmAccountResponse {
    return {
      crmAccount: this.toCrmAccountP1(result.account)
    }
  }

  /** toListCrmAccountsResponse renders one P1 CRM account page. */
  static toListCrmAccountsResponse(result: ListCrmAccountsResult): ListCrmAccountsResponse {
    return {
      crmAccounts: result.crmAccounts.map((account) => this.toCrmAccountP1(account)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toGetCrmAccountResponse renders one P1 CRM account lookup result. */
  static toGetCrmAccountResponse(result: GetCrmAccountResult): GetCrmAccountResponse {
    return {
      crmAccount: result.crmAccount ? this.toCrmAccountP1(result.crmAccount) : undefined
    }
  }

  /** toListSourceRecordsResponse renders CRM source evidence in a read-only gRPC shape. */
  static toListSourceRecordsResponse(result: ListSourceRecordsResult): ListSourceRecordsResponse {
    return {
      sourceRecords: result.sourceRecords.map(toCrmSourceRecord)
    }
  }
}

/** toCrmDuplicateCandidate renders one CRM-local duplicate candidate for P1 duplicate results. */
function toCrmDuplicateCandidate(candidate: CrmAccountDuplicateCandidate): CrmDuplicateCandidate {
  return {
    crmAccountId: candidate.crmAccountId,
    tenantId: candidate.tenantId,
    displayName: candidate.displayName,
    ownerAccountId: candidate.ownerAccountId ?? '',
    recordStatus: candidate.recordStatus,
    lifecycleStage: candidate.lifecycleStage,
    matchedFields: candidate.matchedFields,
    confidence: candidate.confidence
  }
}

/** toCrmAccountProfileItem renders one account-owned profile item into the gRPC response shape. */
function toCrmAccountProfileItem(
  profileItem: NonNullable<CrmAccountRecord['profileItems']>[number]
): GrpcCrmAccountProfileItem {
  return {
    profileItemId: profileItem.id,
    itemType: profileItem.itemType,
    normalizedValue: profileItem.normalizedValue,
    rawValue: profileItem.rawValue,
    label: profileItem.label ?? '',
    role: profileItem.role ?? '',
    status: profileItem.status,
    sourceRecordId: profileItem.sourceRecordId ?? '',
    promotedTargetType: profileItem.promotedTargetType ?? '',
    promotedTargetId: profileItem.promotedTargetId ?? '',
    promotedAt: toIsoString(profileItem.promotedAt),
    createdAt: toIsoString(profileItem.createdAt),
    updatedAt: toIsoString(profileItem.updatedAt)
  }
}

/** toIsoString serializes optional date values into protobuf-friendly strings. */
function toIsoString(value?: Date | null): string {
  return value ? value.toISOString() : ''
}

/** toCrmSourceRecord renders one CRM source record without exposing domain internals. */
function toCrmSourceRecord(source: CrmSourceRecord): GrpcCrmSourceRecord {
  return {
    sourceRecordId: source.id,
    crmAccountId: source.crmAccountId,
    sourceType: source.sourceType,
    sourceName: source.sourceName ?? '',
    capturedAt: toIsoString(source.capturedAt),
    capturedByAccountId: source.capturedByAccountId ?? '',
    externalReference: source.externalReference ?? '',
    rawPayloadJson: source.rawPayload ? JSON.stringify(source.rawPayload) : '',
    note: source.note ?? '',
    isPrimary: source.isPrimary,
    createdAt: toIsoString(source.createdAt),
    updatedAt: toIsoString(source.updatedAt)
  }
}
