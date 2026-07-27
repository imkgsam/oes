import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
  CrmAccountProfileItemRecord,
  CrmAccountProfileItemStatus,
  CrmAccountProfileItemType,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmLeadConversionResultType
} from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import {
  TenantPartyResolutionCandidate,
  TenantPartyResolutionPort,
  TenantPartyResolutionResultType
} from '../ports/tenant-party-resolution.port'
import { ConvertLeadToProspectCustomerCommand } from './convert-lead-to-prospect-customer.command'

export interface ConvertLeadToProspectCustomerResult {
  resultType: CrmLeadConversionResultType
  account: CrmAccountRecord | null
  existingCrmAccountId?: string | null
  candidates: TenantPartyResolutionCandidate[]
}

/** ConvertLeadToProspectCustomerHandler formalizes a CRM lead through party-service subject resolution. */
@Injectable()
@CommandHandler(ConvertLeadToProspectCustomerCommand)
export class ConvertLeadToProspectCustomerHandler implements ICommandHandler<
  ConvertLeadToProspectCustomerCommand,
  ConvertLeadToProspectCustomerResult
> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository,
    @Inject(TOKENS.TENANT_PARTY_RESOLUTION_PORT)
    private readonly tenantPartyResolution: TenantPartyResolutionPort
  ) {}

  /** execute converts an active lead to prospect customer when CRM and Party evidence allow it. */
  async execute(
    command: ConvertLeadToProspectCustomerCommand
  ): Promise<ConvertLeadToProspectCustomerResult> {
    const account = await this.accountRepository.findAccountById(
      command.props.tenantId,
      command.props.crmAccountId
    )
    if (!account) {
      throw new Error('CrmAccount was not found')
    }

    const profileItems = await this.listAccountProfileItems(account)
    const legalName = formalizationLegalName(account, command.props.legalName)

    if (!canAttemptFormalization(account, profileItems, legalName)) {
      return emptyConversionResult(CrmLeadConversionResultType.INSUFFICIENT_INFO)
    }
    if (!account.ownerAccountId && !command.props.allowOwnerlessConversion) {
      throw new BadRequestException('Ownerless Pool leads must be claimed before conversion')
    }

    const resolution = await this.tenantPartyResolution.resolveTenantPartyForConsumer({
      tenantId: account.tenantId,
      typeHint: account.partyTypeHint,
      name: legalName,
      country: account.leadCountry,
      identifiers: account.leadIdentifiers,
      profileItems
    })

    if (resolution.resultType === TenantPartyResolutionResultType.IDENTITY_CONFLICT) {
      return {
        resultType: CrmLeadConversionResultType.IDENTITY_CONFLICT,
        account: null,
        candidates: resolution.candidates
      }
    }

    if (resolution.resultType === TenantPartyResolutionResultType.CANDIDATES_FOUND) {
      return {
        resultType: CrmLeadConversionResultType.USER_CHOICE_REQUIRED,
        account: null,
        candidates: resolution.candidates
      }
    }

    const tenantPartyId =
      resolution.resultType === TenantPartyResolutionResultType.EXACT_MATCH &&
      resolution.tenantPartyId
        ? resolution.tenantPartyId
        : await this.createTenantPartyForAccount(account, profileItems, legalName)

    const existingAccount = await this.accountRepository.findActiveFormalByTenantPartyId(
      account.tenantId,
      tenantPartyId
    )
    if (existingAccount && existingAccount.id !== account.id) {
      return {
        resultType: CrmLeadConversionResultType.EXISTING_CRM_ACCOUNT_FOUND,
        account: null,
        existingCrmAccountId: existingAccount.id,
        candidates: []
      }
    }

    const saved = await this.accountRepository.saveAccount({
      ...account,
      leadLegalName: legalName,
      tenantPartyId,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER
    })

    return {
      resultType: CrmLeadConversionResultType.CONVERTED,
      account: saved,
      candidates: []
    }
  }

  /** createTenantPartyForAccount registers a new TenantParty using CRM lead evidence after Party reports no match. */
  private async createTenantPartyForAccount(
    account: CrmAccountRecord,
    profileItems: CrmAccountProfileItemRecord[],
    legalName: string
  ): Promise<string> {
    const registered = await this.tenantPartyResolution.registerTenantParty({
      tenantId: account.tenantId,
      typeHint: account.partyTypeHint,
      legalName,
      displayName: account.displayName,
      country: account.leadCountry,
      identifiers: account.leadIdentifiers,
      profileItems: buildPartyProfileItems(profileItems)
    })

    return registered.tenantPartyId
  }

  /** listAccountProfileItems reads account-level profile data for Party candidate resolution and registration. */
  private async listAccountProfileItems(
    account: CrmAccountRecord
  ): Promise<CrmAccountProfileItemRecord[]> {
    return this.accountRepository.listAccountProfileItems(account.tenantId, account.id)
  }
}

/** canAttemptFormalization checks the CRM-side minimum evidence before calling party-service. */
function canAttemptFormalization(
  account: CrmAccountRecord,
  profileItems: CrmAccountProfileItemRecord[],
  legalName: string
): boolean {
  return (
    account.recordStatus === CrmAccountRecordStatus.ACTIVE &&
    account.lifecycleStage === CrmAccountLifecycleStage.LEAD &&
    hasText(legalName) &&
    (account.leadIdentifiers.length > 0 ||
      profileItems.some(isActiveFormalizationProfileItem))
  )
}

/** formalizationLegalName returns the explicit registration-name evidence accepted at formalization time. */
function formalizationLegalName(account: CrmAccountRecord, submittedLegalName?: string | null): string {
  return submittedLegalName?.trim() || account.leadLegalName?.trim() || ''
}

/** buildPartyProfileItems converts account-level CRM profile items into Party profile item registration inputs. */
function buildPartyProfileItems(profileItems: CrmAccountProfileItemRecord[]) {
  return profileItems
    .filter(isActivePromotablePartyProfileItem)
    .map((profileItem) => ({
      itemType: profileItem.itemType as
        | 'EMAIL'
        | 'PHONE'
        | 'WHATSAPP'
        | 'WECHAT'
        | 'DOMAIN'
        | 'WEBSITE'
        | 'SOCIAL_PROFILE'
        | 'MARKETPLACE_STORE',
      normalizedValue: profileItem.normalizedValue,
      rawValue: profileItem.rawValue,
      label: profileItem.label ?? undefined,
      role: profileItem.role ?? undefined
    }))
}

/** isActiveFormalizationProfileItem checks if an account profile item can support formalization. */
function isActiveFormalizationProfileItem(profileItem: CrmAccountProfileItemRecord): boolean {
  return (
    profileItem.status === CrmAccountProfileItemStatus.ACTIVE &&
    hasText(profileItem.normalizedValue)
  )
}

/** isActivePromotablePartyProfileItem filters CRM profile items that map to Party profile items. */
function isActivePromotablePartyProfileItem(profileItem: CrmAccountProfileItemRecord): boolean {
  return (
    isActiveFormalizationProfileItem(profileItem) &&
    [
      CrmAccountProfileItemType.DOMAIN,
      CrmAccountProfileItemType.WEBSITE,
      CrmAccountProfileItemType.EMAIL,
      CrmAccountProfileItemType.PHONE,
      CrmAccountProfileItemType.WHATSAPP,
      CrmAccountProfileItemType.WECHAT,
      CrmAccountProfileItemType.SOCIAL_PROFILE,
      CrmAccountProfileItemType.MARKETPLACE_STORE
    ].includes(profileItem.itemType as CrmAccountProfileItemType)
  )
}

/** emptyConversionResult creates a no-mutation conversion result. */
function emptyConversionResult(
  resultType: CrmLeadConversionResultType
): ConvertLeadToProspectCustomerResult {
  return {
    resultType,
    account: null,
    candidates: []
  }
}

/** hasText checks whether optional text contains non-whitespace content. */
function hasText(value?: string | null): boolean {
  return Boolean(value?.trim())
}
