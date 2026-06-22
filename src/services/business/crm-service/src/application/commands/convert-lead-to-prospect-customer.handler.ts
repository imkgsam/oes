import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  CrmAccountLifecycleStage,
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
export class ConvertLeadToProspectCustomerHandler
  implements ICommandHandler<ConvertLeadToProspectCustomerCommand, ConvertLeadToProspectCustomerResult>
{
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository,
    @Inject(TOKENS.TENANT_PARTY_RESOLUTION_PORT)
    private readonly tenantPartyResolution: TenantPartyResolutionPort
  ) {}

  /** execute converts an active lead to prospect customer when CRM and Party evidence allow it. */
  async execute(command: ConvertLeadToProspectCustomerCommand): Promise<ConvertLeadToProspectCustomerResult> {
    const account = await this.accountRepository.findAccountById(
      command.props.tenantId,
      command.props.crmAccountId
    )
    if (!account) {
      throw new Error('CrmAccount was not found')
    }

    if (!canAttemptFormalization(account)) {
      return emptyConversionResult(CrmLeadConversionResultType.INSUFFICIENT_INFO)
    }
    if (
      !account.ownerAccountId &&
      !command.props.allowOwnerlessConversion
    ) {
      throw new BadRequestException('Ownerless Pool leads must be claimed before conversion')
    }

    const resolution = await this.tenantPartyResolution.resolveTenantPartyForConsumer({
      tenantId: account.tenantId,
      typeHint: account.partyTypeHint,
      name: formalizationName(account),
      country: account.leadCountry,
      domain: account.leadDomain,
      email: account.leadEmail,
      phone: account.leadPhone,
      whatsapp: account.leadWhatsapp,
      identifiers: account.leadIdentifiers
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
      resolution.resultType === TenantPartyResolutionResultType.EXACT_MATCH && resolution.tenantPartyId
        ? resolution.tenantPartyId
        : await this.createTenantPartyForAccount(account)

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
  private async createTenantPartyForAccount(account: CrmAccountRecord): Promise<string> {
    const registered = await this.tenantPartyResolution.registerTenantParty({
      tenantId: account.tenantId,
      typeHint: account.partyTypeHint,
      displayName: formalizationName(account),
      country: account.leadCountry,
      identifiers: account.leadIdentifiers,
      contactPoints: buildContactPoints(account)
    })

    return registered.tenantPartyId
  }
}

/** canAttemptFormalization checks the CRM-side minimum evidence before calling party-service. */
function canAttemptFormalization(account: CrmAccountRecord): boolean {
  return (
    account.recordStatus === CrmAccountRecordStatus.ACTIVE &&
    account.lifecycleStage === CrmAccountLifecycleStage.LEAD &&
    hasText(formalizationName(account)) &&
    (hasText(account.leadDomain) ||
      hasText(account.leadEmail) ||
      hasText(account.leadPhone) ||
      hasText(account.leadWhatsapp) ||
      account.leadIdentifiers.length > 0)
  )
}

/** formalizationName returns the strongest CRM-side name evidence for Party resolution. */
function formalizationName(account: CrmAccountRecord): string {
  return account.leadCompanyName || account.leadPersonName || account.displayName
}

/** buildContactPoints converts CRM lead evidence into Party contact point registration inputs. */
function buildContactPoints(account: CrmAccountRecord) {
  return [
    account.leadDomain
      ? {
          contactPointType: 'DOMAIN' as const,
          normalizedValue: account.leadDomain,
          rawValue: account.leadDomain
        }
      : null,
    account.leadEmail
      ? {
          contactPointType: 'EMAIL' as const,
          normalizedValue: account.leadEmail,
          rawValue: account.leadEmail
        }
      : null,
    account.leadPhone
      ? {
          contactPointType: 'PHONE' as const,
          normalizedValue: account.leadPhone,
          rawValue: account.leadPhone
        }
      : null,
    account.leadWhatsapp
      ? {
          contactPointType: 'WHATSAPP' as const,
          normalizedValue: account.leadWhatsapp,
          rawValue: account.leadWhatsapp
        }
      : null
  ].filter((contactPoint): contactPoint is NonNullable<typeof contactPoint> => contactPoint !== null)
}

/** emptyConversionResult creates a no-mutation conversion result. */
function emptyConversionResult(resultType: CrmLeadConversionResultType): ConvertLeadToProspectCustomerResult {
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
