import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  CRM_MANAGEMENT_PERMISSION_CODES,
  GrpcRequestContextInterceptor
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  CheckLeadDuplicateRequest,
  CheckLeadDuplicateResponse,
  CustomerQueryServiceController,
  CustomerQueryServiceControllerMethods,
  GetCrmAccountRequest,
  GetCrmAccountResponse,
  ListCrmAccountsRequest,
  ListCrmAccountsResponse,
  ListSourceRecordsRequest,
  ListSourceRecordsResponse
} from '@oes/common/generated/crm_service'
import { CheckLeadDuplicateQuery } from '../../application/queries/check-lead-duplicate.query'
import { GetCrmAccountQuery } from '../../application/queries/get-crm-account.query'
import { ListCrmAccountsQuery } from '../../application/queries/list-crm-accounts.query'
import { ListSourceRecordsQuery } from '../../application/queries/list-source-records.query'
import { CrmAccountLifecycleStage, CrmAccountRecordStatus } from '../../domain/models/crm-records'
import { CustomerGrpcPresenter } from './customer-grpc.presenter'
import { CustomerRpcContextValidator } from './customer-rpc-context.validator'
import { CrmTrustedBusinessExecutionGuard } from '../../modules/crm-trusted-execution.module'

/** CustomerQueryGrpcController exposes the phase 1 CRM read-only query contract. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(CrmTrustedBusinessExecutionGuard, CustomerRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@CustomerQueryServiceControllerMethods()
export class CustomerQueryGrpcController implements CustomerQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async listCrmAccounts(request: ListCrmAccountsRequest): Promise<ListCrmAccountsResponse> {
    const context = CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListCrmAccountsQuery({
        tenantId: context.tenantId,
        createdBy: request.createdBy || undefined,
        keyword: request.keyword || undefined,
        lifecycleStage: toCrmAccountLifecycleStage(request.lifecycleStage),
        lifecycleStages: (request.lifecycleStages ?? [])
          .map((stage) => toCrmAccountLifecycleStage(stage))
          .filter((stage): stage is CrmAccountLifecycleStage => Boolean(stage)),
        recordStatus: toCrmAccountRecordStatus(request.recordStatus),
        ownerAccountId: request.ownerAccountId || undefined,
        ownerless: request.ownerless ?? false,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return CustomerGrpcPresenter.toListCrmAccountsResponse(result)
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB', 'BROWSER_EXTENSION'] }
  )
  async getCrmAccount(request: GetCrmAccountRequest): Promise<GetCrmAccountResponse> {
    const context = CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new GetCrmAccountQuery(context.tenantId, request.crmAccountId ?? '')
    )

    return CustomerGrpcPresenter.toGetCrmAccountResponse(result)
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async listSourceRecords(request: ListSourceRecordsRequest): Promise<ListSourceRecordsResponse> {
    const context = CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListSourceRecordsQuery(context.tenantId, request.crmAccountId ?? '')
    )

    return CustomerGrpcPresenter.toListSourceRecordsResponse(result)
  }

  @AuthorizeBusinessRpc(
    { all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB', 'BROWSER_EXTENSION'] }
  )
  async checkLeadDuplicate(
    request: CheckLeadDuplicateRequest
  ): Promise<CheckLeadDuplicateResponse> {
    const context = CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new CheckLeadDuplicateQuery({
        tenantId: context.tenantId,
        operatorAccountId: context.operatorContext.operatorId,
        displayName: request.displayName,
        leadLegalName: request.leadLegalName,
        leadCompanyName: request.leadCompanyName,
        leadPersonName: request.leadPersonName,
        leadDomain: request.leadDomain,
        leadEmail: request.leadEmail,
        leadPhone: request.leadPhone,
        leadWhatsapp: request.leadWhatsapp,
        leadCountry: request.leadCountry,
        leadIdentifiers: (request.leadIdentifiers ?? []).map((identifier) => ({
          identifierType: identifier.identifierType ?? '',
          normalizedValue: identifier.normalizedValue ?? '',
          issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? ''
        })),
        profileItems: (request.profileItems ?? []).map((profileItem) => ({
          itemType: profileItem.itemType ?? '',
          normalizedValue: profileItem.normalizedValue ?? '',
          rawValue: profileItem.rawValue ?? '',
          label: profileItem.label ?? '',
          role: profileItem.role ?? ''
        }))
      })
    )

    return {
      duplicateResult: {
        resultType: result.resultType,
        candidates: result.candidates.map((candidate) => ({
          crmAccountId: candidate.crmAccountId,
          tenantId: candidate.tenantId,
          displayName: candidate.displayName,
          ownerAccountId: candidate.ownerAccountId ?? '',
          recordStatus: candidate.recordStatus,
          lifecycleStage: candidate.lifecycleStage,
          matchedFields: candidate.matchedFields,
          confidence: candidate.confidence
        }))
      }
    }
  }
}

/** toCrmAccountLifecycleStage maps P1 string lifecycle filters into domain enum values. */
function toCrmAccountLifecycleStage(value?: string): CrmAccountLifecycleStage | undefined {
  if (value === CrmAccountLifecycleStage.LEAD) {
    return CrmAccountLifecycleStage.LEAD
  }
  if (value === CrmAccountLifecycleStage.PROSPECT_CUSTOMER) {
    return CrmAccountLifecycleStage.PROSPECT_CUSTOMER
  }
  if (value === CrmAccountLifecycleStage.CUSTOMER) {
    return CrmAccountLifecycleStage.CUSTOMER
  }
  return undefined
}

/** toCrmAccountRecordStatus maps P1 string record-status filters into domain enum values. */
function toCrmAccountRecordStatus(value?: string): CrmAccountRecordStatus | undefined {
  if (value === CrmAccountRecordStatus.DRAFT) {
    return CrmAccountRecordStatus.DRAFT
  }
  if (value === CrmAccountRecordStatus.ACTIVE) {
    return CrmAccountRecordStatus.ACTIVE
  }
  if (value === CrmAccountRecordStatus.ARCHIVED) {
    return CrmAccountRecordStatus.ARCHIVED
  }
  return undefined
}
