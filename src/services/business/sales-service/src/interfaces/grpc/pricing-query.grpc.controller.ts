import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetActiveCustomerPriceAgreementRequest,
  GetActiveCustomerPriceAgreementResponse,
  GetCustomerPriceAgreementRequest,
  GetCustomerPriceAgreementResponse,
  GetPriceListLinesRequest,
  GetPriceListLinesResponse,
  GetPriceListRequest,
  GetPriceListResponse,
  ListCustomerPriceAgreementVersionsRequest,
  ListCustomerPriceAgreementVersionsResponse,
  PreviewQuoteLinePricingRequest,
  PreviewQuoteLinePricingResponse,
  PricingQueryServiceController,
  PricingQueryServiceControllerMethods,
  SearchPriceListsRequest,
  SearchPriceListsResponse
} from '@oes/common/generated/sales_service'
import { GetActiveCustomerPriceAgreementQuery } from '../../application/queries/get-active-customer-price-agreement.query'
import { GetCustomerPriceAgreementQuery } from '../../application/queries/get-customer-price-agreement.query'
import { GetPriceListLinesQuery } from '../../application/queries/get-price-list-lines.query'
import { GetPriceListQuery } from '../../application/queries/get-price-list.query'
import { ListCustomerPriceAgreementVersionsQuery } from '../../application/queries/list-customer-price-agreement-versions.query'
import { PreviewQuoteLinePricingQuery } from '../../application/queries/preview-quote-line-pricing.query'
import { SearchPriceListsQuery } from '../../application/queries/search-price-lists.query'
import { PricingGrpcPresenter } from './pricing-grpc.presenter'
import { SalesRpcContextValidator } from './sales-rpc-context.validator'

/** PricingQueryGrpcController exposes the phase 1 read-only pricing query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@PricingQueryServiceControllerMethods()
export class PricingQueryGrpcController implements PricingQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async searchPriceLists(request: SearchPriceListsRequest): Promise<SearchPriceListsResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchPriceListsQuery({
        tenantId: request.tenantId ?? '',
        keyword: request.keyword ?? undefined,
        priceListType: toDomainPriceListType(request.priceListType),
        status: toDomainPriceListStatus(request.status),
        currencyCode: (request.currencyCode as 'USD' | 'CNY' | undefined) ?? undefined,
        effectiveAt: request.effectiveAt ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return PricingGrpcPresenter.toSearchPriceListsResponse(result)
  }

  async getPriceList(request: GetPriceListRequest): Promise<GetPriceListResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new GetPriceListQuery(request.tenantId ?? '', request.priceListId ?? '')
    )
    return PricingGrpcPresenter.toGetPriceListResponse(result)
  }

  async getPriceListLines(request: GetPriceListLinesRequest): Promise<GetPriceListLinesResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new GetPriceListLinesQuery({
        tenantId: request.tenantId ?? '',
        priceListId: request.priceListId ?? '',
        itemId: request.itemId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return PricingGrpcPresenter.toGetPriceListLinesResponse(result)
  }

  async getActiveCustomerPriceAgreement(
    request: GetActiveCustomerPriceAgreementRequest
  ): Promise<GetActiveCustomerPriceAgreementResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new GetActiveCustomerPriceAgreementQuery({
        tenantId: request.tenantId ?? '',
        customerTenantPartyId: request.customerTenantPartyId ?? '',
        currencyCode: (request.currencyCode ?? 'USD') as 'USD' | 'CNY'
      })
    )

    return PricingGrpcPresenter.toGetActiveCustomerPriceAgreementResponse(result)
  }

  async getCustomerPriceAgreement(
    request: GetCustomerPriceAgreementRequest
  ): Promise<GetCustomerPriceAgreementResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new GetCustomerPriceAgreementQuery({
        tenantId: request.tenantId ?? '',
        customerPriceAgreementId: request.customerPriceAgreementId ?? '',
        versionNo: request.versionNo ?? undefined
      })
    )

    return PricingGrpcPresenter.toGetCustomerPriceAgreementResponse(result)
  }

  async listCustomerPriceAgreementVersions(
    request: ListCustomerPriceAgreementVersionsRequest
  ): Promise<ListCustomerPriceAgreementVersionsResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListCustomerPriceAgreementVersionsQuery({
        tenantId: request.tenantId ?? '',
        customerPriceAgreementId: request.customerPriceAgreementId ?? '',
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return PricingGrpcPresenter.toListCustomerPriceAgreementVersionsResponse(result)
  }

  async previewQuoteLinePricing(
    request: PreviewQuoteLinePricingRequest
  ): Promise<PreviewQuoteLinePricingResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new PreviewQuoteLinePricingQuery({
        tenantId: request.tenantId ?? '',
        customerTenantPartyId: request.customerTenantPartyId ?? '',
        itemId: request.itemId ?? '',
        brandKey: request.brandKey ?? undefined,
        currencyCode: (request.currencyCode ?? 'USD') as 'USD' | 'CNY',
        requestedQuantity: request.requestedQuantity ?? '',
        quantityUomCode: request.quantityUomCode ?? '',
        selectedPriceListId: request.selectedPriceListId ?? undefined,
        manualUnitPriceAmount: request.manualUnitPriceAmount ?? undefined,
        pricingAt: request.pricingAt ?? undefined,
        exchangeRateTargetCurrencyCode: (request.exchangeRateTargetCurrencyCode ?? undefined) as
          | 'USD'
          | 'CNY'
          | undefined
      })
    )

    return PricingGrpcPresenter.toPreviewQuoteLinePricingResponse(result)
  }
}

function toDomainPriceListType(value?: number): 'STANDARD' | 'ACTIVITY' | 'EXHIBITION' | undefined {
  if (value === 2) {
    return 'ACTIVITY'
  }
  if (value === 3) {
    return 'EXHIBITION'
  }
  if (value === 1) {
    return 'STANDARD'
  }
  return undefined
}

function toDomainPriceListStatus(value?: number): 'DRAFT' | 'ACTIVE' | 'INACTIVE' | undefined {
  if (value === 2) {
    return 'ACTIVE'
  }
  if (value === 3) {
    return 'INACTIVE'
  }
  if (value === 1) {
    return 'DRAFT'
  }
  return undefined
}
