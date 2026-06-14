import {
  ConvertLeadToProspectCustomerResponse,
  CreateLeadResponse,
  CrmAccountP1,
  CrmDuplicateCandidate,
  CrmLeadDuplicateResult,
  CrmPartyCandidate,
  GetCrmAccountResponse,
  ListCrmAccountsResponse
} from '@oes/common/generated/crm_service'
import {
  CrmAccountRecord,
  CrmLeadConversionResultType,
  CrmLeadCreateResultType
} from '../../domain/models/crm-records'
import { ConvertLeadToProspectCustomerResult } from '../../application/commands/convert-lead-to-prospect-customer.handler'
import { CreateLeadResult } from '../../application/commands/create-lead.handler'
import { GetCrmAccountResult } from '../../application/queries/get-crm-account.handler'
import { ListCrmAccountsResult } from '../../application/queries/list-crm-accounts.handler'
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
      archivedAt: toIsoString(account.archivedAt)
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
      candidates: result.candidates.map((candidate): CrmPartyCandidate => ({
        tenantPartyId: candidate.tenantPartyId,
        displayName: candidate.displayName,
        confidence: candidate.confidence,
        matchedFields: candidate.matchedFields,
        conflictFlags: candidate.conflictFlags
      })),
      existingCrmAccountId: result.existingCrmAccountId ?? ''
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

/** toIsoString serializes optional date values into protobuf-friendly strings. */
function toIsoString(value?: Date | null): string {
  return value ? value.toISOString() : ''
}
