import { Controller, UseFilters } from '@nestjs/common'
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
  ListCrmAccountsResponse
} from '@oes/common/generated/crm_service'
import { CheckLeadDuplicateQuery } from '../../application/queries/check-lead-duplicate.query'
import { GetCrmAccountQuery } from '../../application/queries/get-crm-account.query'
import { ListCrmAccountsQuery } from '../../application/queries/list-crm-accounts.query'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'
import { CustomerGrpcPresenter } from './customer-grpc.presenter'
import { CustomerRpcContextValidator } from './customer-rpc-context.validator'

/** CustomerQueryGrpcController exposes the phase 1 CRM read-only query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@CustomerQueryServiceControllerMethods()
export class CustomerQueryGrpcController implements CustomerQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async listCrmAccounts(request: ListCrmAccountsRequest): Promise<ListCrmAccountsResponse> {
    CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListCrmAccountsQuery({
        tenantId: request.tenantId ?? '',
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

  async getCrmAccount(request: GetCrmAccountRequest): Promise<GetCrmAccountResponse> {
    CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new GetCrmAccountQuery(request.tenantId ?? '', request.crmAccountId ?? '')
    )

    return CustomerGrpcPresenter.toGetCrmAccountResponse(result)
  }

  async checkLeadDuplicate(request: CheckLeadDuplicateRequest): Promise<CheckLeadDuplicateResponse> {
    const context = CustomerRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new CheckLeadDuplicateQuery({
        tenantId: request.tenantId ?? '',
        operatorAccountId: context.operatorContext.operatorId,
        displayName: request.displayName,
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
  return undefined
}
