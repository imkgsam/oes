import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  CRM_MANAGEMENT_PERMISSION_CODES,
  GrpcRequestContextInterceptor
} from '@oes/common/authorization'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ArchiveCrmAccountRequest,
  ArchiveCrmAccountResponse,
  ClaimCrmAccountRequest,
  ClaimCrmAccountResponse,
  ConvertLeadToProspectCustomerRequest,
  ConvertLeadToProspectCustomerResponse,
  CreateDraftLeadRequest,
  CreateDraftLeadResponse,
  CreateLeadRequest,
  CreateLeadResponse,
  CustomerManagementServiceController,
  CustomerManagementServiceControllerMethods,
  DeleteDraftLeadRequest,
  DeleteDraftLeadResponse,
  ReleaseCrmAccountRequest,
  ReleaseCrmAccountResponse,
  SubmitDraftLeadRequest,
  SubmitDraftLeadResponse,
  UpdateCrmAccountIdentifiersRequest,
  UpdateCrmAccountIdentifiersResponse,
  UpdateDraftLeadRequest,
  UpdateDraftLeadResponse
} from '@oes/common/generated/crm_service'
import { ArchiveCrmAccountCommand } from '../../application/commands/archive-crm-account.command'
import { ClaimCrmAccountCommand } from '../../application/commands/claim-crm-account.command'
import { ConvertLeadToProspectCustomerCommand } from '../../application/commands/convert-lead-to-prospect-customer.command'
import { CreateDraftLeadCommand } from '../../application/commands/create-draft-lead.command'
import { CreateLeadCommand } from '../../application/commands/create-lead.command'
import { DeleteDraftLeadCommand } from '../../application/commands/delete-draft-lead.command'
import { ReleaseCrmAccountCommand } from '../../application/commands/release-crm-account.command'
import { SubmitDraftLeadCommand } from '../../application/commands/submit-draft-lead.command'
import { UpdateCrmAccountIdentifiersCommand } from '../../application/commands/update-crm-account-identifiers.command'
import { UpdateDraftLeadCommand } from '../../application/commands/update-draft-lead.command'
import { CrmAuditService } from '../../application/services/crm-audit.service'
import { normalizeOptionalString } from '../../application/support/crm-assertions'
import {
  CrmAccountTypeHint,
  CrmArchiveReason,
  CrmLeadAssignmentIntent,
  CrmPriority,
  CrmSourceType
} from '../../domain/models/crm-records'
import { CustomerGrpcPresenter } from './customer-grpc.presenter'
import { CustomerRpcContextValidator } from './customer-rpc-context.validator'
import { CrmTrustedBusinessExecutionGuard } from '../../modules/crm-trusted-execution.module'

/** CustomerManagementGrpcController exposes the CRM phase 1 command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(CrmTrustedBusinessExecutionGuard, CustomerRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@CustomerManagementServiceControllerMethods()
export class CustomerManagementGrpcController implements CustomerManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: CrmAuditService
  ) {}

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB', 'BROWSER_EXTENSION'] }
  )
  async createDraftLead(request: CreateDraftLeadRequest): Promise<CreateDraftLeadResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateDraftLead',
        resourceType: 'crm_account',
        targetId: null,
        requestSummary: {
          displayName: request.displayName ?? '',
          sourceType: request.sourceType ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreateDraftLeadCommand({
            tenantId: context.tenantId,
            operatorAccountId: context.operatorContext.operatorId,
            displayName: request.displayName ?? '',
            partyTypeHint: toCrmAccountTypeHint(request.partyTypeHint),
            leadLegalName: normalizeOptionalString(request.leadLegalName),
            leadCompanyName: normalizeOptionalString(request.leadCompanyName),
            leadPersonName: normalizeOptionalString(request.leadPersonName),
            leadDomain: normalizeOptionalString(request.leadDomain),
            leadEmail: normalizeOptionalString(request.leadEmail),
            leadPhone: normalizeOptionalString(request.leadPhone),
            leadWhatsapp: normalizeOptionalString(request.leadWhatsapp),
            leadCountry: normalizeOptionalString(request.leadCountry),
            leadIdentifiers: toCrmLeadIdentifiers(request.leadIdentifiers),
            profileItems: toCrmAccountProfileItemDrafts(request.profileItems),
            priority: toCrmPriority(request.priority),
            nextFollowUpAt: parseOptionalDate(request.nextFollowUpAt),
            source: toOptionalCrmSourceInput({
              sourceType: request.sourceType,
              sourceName: request.sourceName,
              sourceCapturedAt: request.sourceCapturedAt,
              sourceCapturedByAccountId: request.sourceCapturedByAccountId,
              sourceExternalReference: request.sourceExternalReference,
              sourceRawPayloadJson: request.sourceRawPayloadJson,
              sourceNote: request.sourceNote
            })
          })
        )

        return CustomerGrpcPresenter.toCreateDraftLeadResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async updateDraftLead(request: UpdateDraftLeadRequest): Promise<UpdateDraftLeadResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpdateDraftLead',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new UpdateDraftLeadCommand({
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId,
            displayName: request.displayName ?? '',
            partyTypeHint: toCrmAccountTypeHint(request.partyTypeHint),
            leadLegalName: normalizeOptionalString(request.leadLegalName),
            leadCompanyName: normalizeOptionalString(request.leadCompanyName),
            leadPersonName: normalizeOptionalString(request.leadPersonName),
            leadDomain: normalizeOptionalString(request.leadDomain),
            leadEmail: normalizeOptionalString(request.leadEmail),
            leadPhone: normalizeOptionalString(request.leadPhone),
            leadWhatsapp: normalizeOptionalString(request.leadWhatsapp),
            leadCountry: normalizeOptionalString(request.leadCountry),
            leadIdentifiers: toCrmLeadIdentifiers(request.leadIdentifiers),
            profileItems: toCrmAccountProfileItemDrafts(request.profileItems),
            priority: toCrmPriority(request.priority),
            nextFollowUpAt: parseOptionalDate(request.nextFollowUpAt)
          })
        )

        return CustomerGrpcPresenter.toUpdateDraftLeadResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async updateCrmAccountIdentifiers(
    request: UpdateCrmAccountIdentifiersRequest
  ): Promise<UpdateCrmAccountIdentifiersResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpdateCrmAccountIdentifiers',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? '',
          identifierCount: request.leadIdentifiers?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new UpdateCrmAccountIdentifiersCommand({
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId,
            leadIdentifiers: toCrmLeadIdentifiers(request.leadIdentifiers)
          })
        )

        return CustomerGrpcPresenter.toUpdateCrmAccountIdentifiersResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async submitDraftLead(request: SubmitDraftLeadRequest): Promise<SubmitDraftLeadResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'SubmitDraftLead',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new SubmitDraftLeadCommand({
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId,
            assignmentIntent: toCrmLeadAssignmentIntent(request.assignmentIntent),
            duplicateWarningAcknowledged: request.duplicateWarningAcknowledged ?? false,
            source: toOptionalCrmSourceInput({
              sourceType: request.sourceType,
              sourceName: request.sourceName,
              sourceCapturedAt: request.sourceCapturedAt,
              sourceCapturedByAccountId: request.sourceCapturedByAccountId,
              sourceExternalReference: request.sourceExternalReference,
              sourceRawPayloadJson: request.sourceRawPayloadJson,
              sourceNote: request.sourceNote
            })
          })
        )

        return CustomerGrpcPresenter.toSubmitDraftLeadResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async deleteDraftLead(request: DeleteDraftLeadRequest): Promise<DeleteDraftLeadResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'DeleteDraftLead',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new DeleteDraftLeadCommand({
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId
          })
        )

        return CustomerGrpcPresenter.toDeleteDraftLeadResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB', 'BROWSER_EXTENSION'] }
  )
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
            tenantId: context.tenantId,
            operatorAccountId: context.operatorContext.operatorId,
            displayName: request.displayName ?? '',
            partyTypeHint: toCrmAccountTypeHint(request.partyTypeHint),
            leadLegalName: normalizeOptionalString(request.leadLegalName),
            leadCompanyName: normalizeOptionalString(request.leadCompanyName),
            leadPersonName: normalizeOptionalString(request.leadPersonName),
            leadDomain: normalizeOptionalString(request.leadDomain),
            leadEmail: normalizeOptionalString(request.leadEmail),
            leadPhone: normalizeOptionalString(request.leadPhone),
            leadWhatsapp: normalizeOptionalString(request.leadWhatsapp),
            leadCountry: normalizeOptionalString(request.leadCountry),
            leadIdentifiers: toCrmLeadIdentifiers(request.leadIdentifiers),
            profileItems: toCrmAccountProfileItemDrafts(request.profileItems),
            assignmentIntent: toCrmLeadAssignmentIntent(request.assignmentIntent),
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

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
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
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId,
            legalName: normalizeOptionalString(request.legalName),
            allowOwnerlessConversion: context.permissionCodes.includes(
              CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT
            )
          })
        )

        return CustomerGrpcPresenter.toConvertLeadToProspectCustomerResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB', 'BROWSER_EXTENSION'] }
  )
  async claimCrmAccount(request: ClaimCrmAccountRequest): Promise<ClaimCrmAccountResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ClaimCrmAccount',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ClaimCrmAccountCommand({
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId
          })
        )

        return CustomerGrpcPresenter.toClaimCrmAccountResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.RELEASE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async releaseCrmAccount(request: ReleaseCrmAccountRequest): Promise<ReleaseCrmAccountResponse> {
    const context = CustomerRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ReleaseCrmAccount',
        resourceType: 'crm_account',
        targetId: request.crmAccountId ?? null,
        requestSummary: {
          crmAccountId: request.crmAccountId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ReleaseCrmAccountCommand({
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId
          })
        )

        return CustomerGrpcPresenter.toReleaseCrmAccountResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
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
          crmAccountId: request.crmAccountId ?? '',
          archiveReason: request.archiveReason ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ArchiveCrmAccountCommand({
            tenantId: context.tenantId,
            crmAccountId: request.crmAccountId ?? '',
            operatorAccountId: context.operatorContext.operatorId,
            archiveReason: toCrmArchiveReason(request.archiveReason)
          })
        )

        return CustomerGrpcPresenter.toArchiveCrmAccountResponse(result)
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
  if (
    value === CrmPriority.A ||
    value === CrmPriority.B ||
    value === CrmPriority.C ||
    value === CrmPriority.D
  ) {
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

/** toCrmLeadAssignmentIntent maps entry-context ownership intent into the CRM domain enum. */
function toCrmLeadAssignmentIntent(value?: string): CrmLeadAssignmentIntent {
  return value === CrmLeadAssignmentIntent.POOL
    ? CrmLeadAssignmentIntent.POOL
    : CrmLeadAssignmentIntent.OWNED_BY_OPERATOR
}

/** toCrmArchiveReason maps one required archive reason string into the CRM domain enum. */
function toCrmArchiveReason(value?: string): CrmArchiveReason {
  return Object.values(CrmArchiveReason).includes(value as CrmArchiveReason)
    ? (value as CrmArchiveReason)
    : CrmArchiveReason.OTHER
}

/** toCrmLeadIdentifiers maps generated proto identifier payloads into domain records. */
function toCrmLeadIdentifiers(
  identifiers: Array<{
    identifierType?: string
    normalizedValue?: string
    rawValue?: string
    issuerCountryOrRegion?: string
  }> = []
) {
  return identifiers.map((identifier) => ({
    identifierType: identifier.identifierType ?? '',
    normalizedValue: identifier.normalizedValue ?? '',
    rawValue: normalizeOptionalString(identifier.rawValue),
    issuerCountryOrRegion: normalizeOptionalString(identifier.issuerCountryOrRegion)
  }))
}

/** toCrmAccountProfileItemDrafts maps gRPC profile item inputs into CRM account-level evidence drafts. */
function toCrmAccountProfileItemDrafts(
  profileItems: Array<{
    itemType?: string
    normalizedValue?: string
    rawValue?: string
    label?: string
    role?: string
  }> = []
) {
  return profileItems.map((profileItem) => ({
    itemType: profileItem.itemType ?? '',
    normalizedValue: profileItem.normalizedValue ?? '',
    rawValue: normalizeOptionalString(profileItem.rawValue),
    label: normalizeOptionalString(profileItem.label),
    role: normalizeOptionalString(profileItem.role)
  }))
}

/** toOptionalCrmSourceInput maps optional draft/submit source fields without inventing OTHER sources. */
function toOptionalCrmSourceInput(input: {
  sourceType?: string
  sourceName?: string
  sourceCapturedAt?: string
  sourceCapturedByAccountId?: string
  sourceExternalReference?: string
  sourceRawPayloadJson?: string
  sourceNote?: string
}) {
  if (!input.sourceType?.trim()) {
    return null
  }

  return {
    sourceType: toCrmSourceType(input.sourceType),
    sourceName: normalizeOptionalString(input.sourceName),
    capturedAt: parseOptionalDate(input.sourceCapturedAt),
    capturedByAccountId: normalizeOptionalString(input.sourceCapturedByAccountId),
    externalReference: normalizeOptionalString(input.sourceExternalReference),
    rawPayload: parseRawPayload(input.sourceRawPayloadJson),
    note: normalizeOptionalString(input.sourceNote)
  }
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
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : { value: parsed }
  } catch {
    return { raw: value }
  }
}
