import {
  ChangePriceListStatusResponse,
  CreateCustomerPriceAgreementFromSalesOrderLineResponse,
  CreateCustomerPriceAgreementResponse,
  CreatePriceListResponse,
  CustomerPriceAgreement,
  CustomerPriceAgreementLine,
  CustomerPriceAgreementStatus,
  CustomerPriceAgreementVersionSummary,
  ExceptionPlaceholder as ProtoExceptionPlaceholder,
  ExchangeRateSnapshot as ProtoExchangeRateSnapshot,
  GetActiveCustomerPriceAgreementResponse,
  GetCustomerPriceAgreementResponse,
  GetPriceListLinesResponse,
  GetPriceListResponse,
  ListCustomerPriceAgreementVersionsResponse,
  MoqSnapshot as ProtoMoqSnapshot,
  PreviewQuoteLinePricingResponse,
  PriceList,
  PriceListLine,
  PriceListStatus,
  PriceListType,
  PriceSnapshot as ProtoPriceSnapshot,
  PublishCustomerPriceAgreementVersionResponse,
  ReplacePriceListLinesResponse,
  SearchPriceListsResponse,
  UpdateCustomerPriceAgreementDraftResponse,
  UpdatePriceListResponse
} from '@oes/common/generated/sales_service'
import {
  CustomerPriceAgreementVersionRecord,
  ExceptionPlaceholder,
  ExchangeRateSnapshot,
  MoqSnapshot,
  PreviewQuoteLinePricingResult,
  PriceListRecord,
  PriceSnapshot
} from '../../domain/models/pricing-records'
import { GetPriceListLinesResult } from '../../application/queries/get-price-list-lines.handler'
import { ListCustomerPriceAgreementVersionsResult } from '../../application/queries/list-customer-price-agreement-versions.handler'
import { SearchPriceListsResult } from '../../application/queries/search-price-lists.handler'

/** PricingGrpcPresenter maps sales pricing domain records into the frozen phase 1 pricing gRPC response shapes. */
export class PricingGrpcPresenter {
  /** toPriceList renders one price list head into the pricing query and management response shape. */
  static toPriceList(record: PriceListRecord): PriceList {
    return {
      priceListId: record.id,
      tenantId: record.tenantId,
      priceListName: record.priceListName,
      priceListType:
        record.priceListType === 'ACTIVITY'
          ? PriceListType.PRICE_LIST_TYPE_ACTIVITY
          : record.priceListType === 'EXHIBITION'
            ? PriceListType.PRICE_LIST_TYPE_EXHIBITION
            : PriceListType.PRICE_LIST_TYPE_STANDARD,
      status:
        record.status === 'ACTIVE'
          ? PriceListStatus.PRICE_LIST_STATUS_ACTIVE
          : record.status === 'INACTIVE'
            ? PriceListStatus.PRICE_LIST_STATUS_INACTIVE
            : PriceListStatus.PRICE_LIST_STATUS_DRAFT,
      currencyCode: record.currencyCode,
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo ?? ''
    }
  }

  /** toPriceListLine renders one line-level price list baseline row. */
  static toPriceListLine(record: PriceListRecord['lines'][number]): PriceListLine {
    return {
      priceListLineId: record.priceListLineId,
      lineNo: record.lineNo,
      itemId: record.itemId,
      brandKey: record.brandKey ?? '',
      priceSnapshot: this.toPriceSnapshot(record.priceSnapshot),
      moqSnapshot: this.toMoqSnapshot(record.moqSnapshot)
    }
  }

  /** toCustomerPriceAgreement renders one versioned customer agreement record. */
  static toCustomerPriceAgreement(record: CustomerPriceAgreementVersionRecord): CustomerPriceAgreement {
    return {
      customerPriceAgreementId: record.customerPriceAgreementId,
      tenantId: record.tenantId,
      customerTenantPartyId: record.customerTenantPartyId,
      currencyCode: record.currencyCode,
      versionNo: record.versionNo,
      status:
        record.status === 'ACTIVE'
          ? CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_ACTIVE
          : record.status === 'SUPERSEDED'
            ? CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_SUPERSEDED
            : CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_DRAFT,
      publishedAt: record.publishedAt ?? '',
      lines: record.lines.map((line) => this.toCustomerPriceAgreementLine(line))
    }
  }

  /** toSearchPriceListsResponse renders one paged price list catalog result. */
  static toSearchPriceListsResponse(result: SearchPriceListsResult): SearchPriceListsResponse {
    return {
      priceLists: result.items.map((item) => this.toPriceList(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toGetPriceListResponse renders one point-read price list payload. */
  static toGetPriceListResponse(record: PriceListRecord): GetPriceListResponse {
    return {
      priceList: this.toPriceList(record)
    }
  }

  /** toGetPriceListLinesResponse renders one paged price list line payload. */
  static toGetPriceListLinesResponse(result: GetPriceListLinesResult): GetPriceListLinesResponse {
    return {
      priceListLines: result.items.map((item) => this.toPriceListLine(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toGetActiveCustomerPriceAgreementResponse renders the active customer agreement lookup payload. */
  static toGetActiveCustomerPriceAgreementResponse(
    record: CustomerPriceAgreementVersionRecord
  ): GetActiveCustomerPriceAgreementResponse {
    return {
      customerPriceAgreement: this.toCustomerPriceAgreement(record)
    }
  }

  /** toGetCustomerPriceAgreementResponse renders the head-or-version customer agreement lookup payload. */
  static toGetCustomerPriceAgreementResponse(
    record: CustomerPriceAgreementVersionRecord
  ): GetCustomerPriceAgreementResponse {
    return {
      customerPriceAgreement: this.toCustomerPriceAgreement(record)
    }
  }

  /** toListCustomerPriceAgreementVersionsResponse renders one paged agreement version history payload. */
  static toListCustomerPriceAgreementVersionsResponse(
    result: ListCustomerPriceAgreementVersionsResult
  ): ListCustomerPriceAgreementVersionsResponse {
    return {
      versions: result.items.map((item) => this.toVersionSummary(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toPreviewQuoteLinePricingResponse renders one non-mutating pricing preview payload. */
  static toPreviewQuoteLinePricingResponse(
    result: PreviewQuoteLinePricingResult
  ): PreviewQuoteLinePricingResponse {
    return {
      priceSnapshot: this.toPriceSnapshot(result.priceSnapshot),
      moqSnapshot: this.toMoqSnapshot(result.moqSnapshot),
      exchangeRateSnapshot: this.toExchangeRateSnapshot(result.exchangeRateSnapshot),
      exceptionPlaceholders: result.exceptionPlaceholders.map((item) => this.toExceptionPlaceholder(item))
    }
  }

  /** toCreatePriceListResponse renders one create-price-list success payload. */
  static toCreatePriceListResponse(record: PriceListRecord): CreatePriceListResponse {
    return {
      priceList: this.toPriceList(record)
    }
  }

  /** toUpdatePriceListResponse renders one update-price-list success payload. */
  static toUpdatePriceListResponse(record: PriceListRecord): UpdatePriceListResponse {
    return {
      priceList: this.toPriceList(record)
    }
  }

  /** toReplacePriceListLinesResponse renders one replace-lines success payload. */
  static toReplacePriceListLinesResponse(record: PriceListRecord): ReplacePriceListLinesResponse {
    return {
      priceList: this.toPriceList(record),
      priceListLines: record.lines.map((line) => this.toPriceListLine(line))
    }
  }

  /** toChangePriceListStatusResponse renders one price list lifecycle change success payload. */
  static toChangePriceListStatusResponse(record: PriceListRecord): ChangePriceListStatusResponse {
    return {
      priceList: this.toPriceList(record)
    }
  }

  /** toCreateCustomerPriceAgreementResponse renders one create-agreement success payload. */
  static toCreateCustomerPriceAgreementResponse(
    record: CustomerPriceAgreementVersionRecord
  ): CreateCustomerPriceAgreementResponse {
    return {
      customerPriceAgreement: this.toCustomerPriceAgreement(record)
    }
  }

  /** toUpdateCustomerPriceAgreementDraftResponse renders one draft-mutation success payload. */
  static toUpdateCustomerPriceAgreementDraftResponse(
    record: CustomerPriceAgreementVersionRecord
  ): UpdateCustomerPriceAgreementDraftResponse {
    return {
      customerPriceAgreement: this.toCustomerPriceAgreement(record)
    }
  }

  /** toPublishCustomerPriceAgreementVersionResponse renders one publish-agreement success payload. */
  static toPublishCustomerPriceAgreementVersionResponse(
    record: CustomerPriceAgreementVersionRecord
  ): PublishCustomerPriceAgreementVersionResponse {
    return {
      customerPriceAgreement: this.toCustomerPriceAgreement(record)
    }
  }

  /** toCreateCustomerPriceAgreementFromSalesOrderLineResponse renders one copy-from-order-line success payload. */
  static toCreateCustomerPriceAgreementFromSalesOrderLineResponse(
    record: CustomerPriceAgreementVersionRecord
  ): CreateCustomerPriceAgreementFromSalesOrderLineResponse {
    return {
      customerPriceAgreement: this.toCustomerPriceAgreement(record)
    }
  }

  private static toCustomerPriceAgreementLine(
    record: CustomerPriceAgreementVersionRecord['lines'][number]
  ): CustomerPriceAgreementLine {
    return {
      customerPriceAgreementLineId: record.customerPriceAgreementLineId,
      lineNo: record.lineNo,
      itemId: record.itemId,
      brandKey: record.brandKey ?? '',
      priceSnapshot: this.toPriceSnapshot(record.priceSnapshot),
      moqSnapshot: this.toMoqSnapshot(record.moqSnapshot)
    }
  }

  private static toVersionSummary(
    record: CustomerPriceAgreementVersionRecord
  ): CustomerPriceAgreementVersionSummary {
    return {
      customerPriceAgreementId: record.customerPriceAgreementId,
      versionNo: record.versionNo,
      status:
        record.status === 'ACTIVE'
          ? CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_ACTIVE
          : record.status === 'SUPERSEDED'
            ? CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_SUPERSEDED
            : CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_DRAFT,
      publishedAt: record.publishedAt ?? '',
      lineCount: record.lines.length
    }
  }

  private static toPriceSnapshot(snapshot: PriceSnapshot): ProtoPriceSnapshot {
    return {
      currencyCode: snapshot.currencyCode,
      unitPriceAmount: snapshot.unitPriceAmount,
      sourceType: snapshot.sourceType === 'PRICE_LIST' ? 2 : snapshot.sourceType === 'MANUAL' ? 3 : 1,
      sourceRefId: snapshot.sourceRefId,
      sourceLineRefId: snapshot.sourceLineRefId,
      sourceVersionNo: snapshot.sourceVersionNo,
      resolvedAt: snapshot.resolvedAt
    }
  }

  private static toMoqSnapshot(snapshot: MoqSnapshot): ProtoMoqSnapshot {
    return {
      moqQuantity: snapshot.moqQuantity,
      quantityUomCode: snapshot.quantityUomCode,
      sourceType: snapshot.sourceType === 'PRICE_LIST' ? 2 : 1,
      sourceRefId: snapshot.sourceRefId,
      sourceLineRefId: snapshot.sourceLineRefId,
      sourceVersionNo: snapshot.sourceVersionNo,
      resolvedAt: snapshot.resolvedAt
    }
  }

  private static toExchangeRateSnapshot(snapshot: ExchangeRateSnapshot): ProtoExchangeRateSnapshot {
    return {
      fromCurrencyCode: snapshot.fromCurrencyCode,
      toCurrencyCode: snapshot.toCurrencyCode,
      exchangeRateValue: snapshot.exchangeRateValue,
      financeRateRef: snapshot.financeRateRef ?? '',
      effectiveAt: snapshot.effectiveAt,
      snapshottedAt: snapshot.snapshottedAt
    }
  }

  private static toExceptionPlaceholder(snapshot: ExceptionPlaceholder): ProtoExceptionPlaceholder {
    return {
      exceptionType: snapshot.exceptionType === 'LOW_MOQ' ? 2 : 1,
      status: snapshot.status === 'REQUIRED' ? 2 : 1,
      baselineSourceType: snapshot.baselineSourceType === 'PRICE_LIST' ? 2 : 1,
      baselineValue: snapshot.baselineValue,
      actualValue: snapshot.actualValue,
      currencyCode: snapshot.currencyCode ?? '',
      quantityUomCode: snapshot.quantityUomCode ?? '',
      detectedAt: snapshot.detectedAt
    }
  }
}
