import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ArchiveCrmAccountRequest,
  ArchiveCrmAccountResponse,
  ConvertLeadToProspectCustomerRequest,
  ConvertLeadToProspectCustomerResponse,
  CreateLeadRequest,
  CreateLeadResponse,
  CustomerManagementServiceController,
  CustomerManagementServiceControllerMethods,
  RestoreCrmAccountRequest,
  RestoreCrmAccountResponse,
} from '@oes/common/generated/crm_service'
import { ArchiveCrmAccountCommand } from '../../application/commands/archive-crm-account.command'
import { ConvertLeadToProspectCustomerCommand } from '../../application/commands/convert-lead-to-prospect-customer.command'
import { CreateLeadCommand } from '../../application/commands/create-lead.command'
import { RestoreCrmAccountCommand } from '../../application/commands/restore-crm-account.command'
import { CrmAuditService } from '../../application/services/crm-audit.service'
import { normalizeOptionalString } from '../../application/support/crm-assertions'
import {
  CrmAccountTypeHint,
  CrmPriority,
  CrmSourceType
} from '../../domain/models/crm-records'
import { CustomerGrpcPresenter } from './customer-grpc.presenter'
import { CustomerRpcContextValidator } from './customer-rpc-context.validator'

/** CustomerManagementGrpcController exposes the CRM phase 1 command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@CustomerManagementServiceControllerMethods()
export class CustomerManagementGrpcController implements CustomerManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: CrmAuditService
  ) {}

  async createLead(request: CreateLeadRequest): Promise<CreateLeadResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateLead',
        resourceType: 'crm_account',
        targetId: null,
        requestSummary: {
          displayName: request.displayName ?? '',
          sourceType: request.sourceType ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreateLeadCommand({
            tenantId: request.tenantId ?? '',
            operatorAccountId: context.operatorContext.operatorId,
            displayName: request.displayName ?? '',
            partyTypeHint: toCrmAccountTypeHint(request.partyTypeHint),
            leadCompanyName: normalizeOptionalString(request.leadCompanyName),
            leadPersonName: normalizeOptionalString(request.leadPersonName),
            leadDomain: normalizeOptionalString(request.leadDomain),
            leadEmail: normalizeOptionalString(request.leadEmail),
            leadPhone: normalizeOptionalString(request.leadPhone),
            leadWhatsapp: normalizeOptionalString(request.leadWhatsapp),
            leadCountry: normalizeOptionalString(request.leadCountry),
            leadIdentifiers: (request.leadIdentifiers ?? []).map((identifier) => ({
              identifierType: identifier.identifierType ?? '',
              normalizedValue: identifier.normalizedValue ?? '',
              rawValue: normalizeOptionalString(identifier.rawValue),
              issuerCountryOrRegion: normalizeOptionalString(identifier.issuerCountryOrRegion)
            })),
            ownerAccountId: normalizeOptionalString(request.ownerAccountId),
            priority: toCrmPriority(request.priority),
            nextFollowUpAt: parseOptionalDate(request.nextFollowUpAt),
            duplicateWarningAcknowledged: request.duplicateWarningAcknowledged ?? false,
            source: {
              sourceType: toCrmSourceType(request.sourceType),
              sourceName: normalizeOptionalString(request.sourceName),
              capturedAt: parseOptionalDate(request.sourceCapturedAt),
              capturedByAccountId: normalizeOptionalString(request.sourceCapturedByAccountId),
              externalReference: normalizeOptionalString(request.sourceExternalReference),
              rawPayload: parseRawPayload(request.sourceRawPayloadJson),
              note: normalizeOptionalString(request.sourceNote)
            }
          })
        )

        return CustomerGrpcPresenter.toCreateLeadResponse(result)
      }
    )
  }

  async convertLeadToProspectCustomer(
    request: ConvertLeadToProspectCustomerRequest
  ): Promise<ConvertLeadToProspectCustomerResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ConvertLeadToProspectCustomer',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ConvertLeadToProspectCustomerCommand({
            tenantId: request.tenantId ?? '',
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId
          })
        )

        return CustomerGrpcPresenter.toConvertLeadToProspectCustomerResponse(result)
      }
    )
  }

  async archiveCrmAccount(request: ArchiveCrmAccountRequest): Promise<ArchiveCrmAccountResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ArchiveCrmAccount',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ArchiveCrmAccountCommand({
            tenantId: request.tenantId ?? '',
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId
          })
        )

        return CustomerGrpcPresenter.toArchiveCrmAccountResponse(result)
      }
    )
  }

  async restoreCrmAccount(request: RestoreCrmAccountRequest): Promise<RestoreCrmAccountResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'RestoreCrmAccount',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new RestoreCrmAccountCommand({
            tenantId: request.tenantId ?? '',
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId
          })
        )

        return CustomerGrpcPresenter.toRestoreCrmAccountResponse(result)
      }
    )
  }
}

/** toCrmAccountTypeHint maps one P1 string request value into the domain type hint enum. */
function toCrmAccountTypeHint(value?: string): CrmAccountTypeHint {
  if (value === CrmAccountTypeHint.PERSON) {
    return CrmAccountTypeHint.PERSON
  }
  if (value === CrmAccountTypeHint.ORGANIZATION) {
    return CrmAccountTypeHint.ORGANIZATION
  }
  return CrmAccountTypeHint.UNKNOWN
}

/** toCrmPriority maps one P1 string request value into the domain priority enum. */
function toCrmPriority(value?: string): CrmPriority {
  if (value === CrmPriority.A || value === CrmPriority.B || value === CrmPriority.C || value === CrmPriority.D) {
    return value
  }
  return CrmPriority.C
}

/** toCrmSourceType maps one P1 string request value into a known CRM source type. */
function toCrmSourceType(value?: string): CrmSourceType {
  return Object.values(CrmSourceType).includes(value as CrmSourceType)
    ? (value as CrmSourceType)
    : CrmSourceType.OTHER
}

/** parseOptionalDate converts optional ISO date strings into Date values for application commands. */
function parseOptionalDate(value?: string): Date | null {
  if (!value?.trim()) {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** parseRawPayload parses source raw payload JSON while preserving malformed payloads for traceability. */
function parseRawPayload(value?: string): Record<string, unknown> | null {
  if (!value?.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : { value: parsed }
  } catch {
    return { raw: value }
  }
}
