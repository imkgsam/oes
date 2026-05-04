import { Observable } from "rxjs";
export declare enum QuoteStatus {
    QUOTE_STATUS_UNSPECIFIED = 0,
    QUOTE_STATUS_DRAFT = 1,
    QUOTE_STATUS_PUBLISHED = 2
}
export declare enum CommercialGateName {
    COMMERCIAL_GATE_NAME_UNSPECIFIED = 0,
    COMMERCIAL_GATE_NAME_PRODUCTION_GATE = 1,
    COMMERCIAL_GATE_NAME_STOCKING_GATE = 2,
    COMMERCIAL_GATE_NAME_SHIPPING_GATE = 3
}
export declare enum FulfillmentHandoffStatusCode {
    FULFILLMENT_HANDOFF_STATUS_CODE_UNSPECIFIED = 0,
    FULFILLMENT_HANDOFF_STATUS_CODE_NOT_SUBMITTED = 1,
    FULFILLMENT_HANDOFF_STATUS_CODE_SUBMITTED = 2
}
export declare enum PriceListType {
    PRICE_LIST_TYPE_UNSPECIFIED = 0,
    PRICE_LIST_TYPE_STANDARD = 1,
    PRICE_LIST_TYPE_ACTIVITY = 2,
    PRICE_LIST_TYPE_EXHIBITION = 3
}
export declare enum PriceListStatus {
    PRICE_LIST_STATUS_UNSPECIFIED = 0,
    PRICE_LIST_STATUS_DRAFT = 1,
    PRICE_LIST_STATUS_ACTIVE = 2,
    PRICE_LIST_STATUS_INACTIVE = 3
}
export declare enum PricingSourceType {
    PRICING_SOURCE_TYPE_UNSPECIFIED = 0,
    PRICING_SOURCE_TYPE_CUSTOMER_PRICE_AGREEMENT = 1,
    PRICING_SOURCE_TYPE_PRICE_LIST = 2,
    PRICING_SOURCE_TYPE_MANUAL = 3
}
export declare enum CustomerPriceAgreementStatus {
    CUSTOMER_PRICE_AGREEMENT_STATUS_UNSPECIFIED = 0,
    CUSTOMER_PRICE_AGREEMENT_STATUS_DRAFT = 1,
    CUSTOMER_PRICE_AGREEMENT_STATUS_ACTIVE = 2,
    CUSTOMER_PRICE_AGREEMENT_STATUS_SUPERSEDED = 3
}
export declare enum PricingExceptionType {
    PRICING_EXCEPTION_TYPE_UNSPECIFIED = 0,
    PRICING_EXCEPTION_TYPE_LOW_PRICE = 1,
    PRICING_EXCEPTION_TYPE_LOW_MOQ = 2
}
export declare enum PricingExceptionStatus {
    PRICING_EXCEPTION_STATUS_UNSPECIFIED = 0,
    PRICING_EXCEPTION_STATUS_NOT_REQUIRED = 1,
    PRICING_EXCEPTION_STATUS_REQUIRED = 2
}
export interface OperatorContext {
    operatorId?: string | undefined;
    operatorType?: string | undefined;
    orgId?: string | undefined;
}
export interface TraceContext {
    traceId?: string | undefined;
    requestId?: string | undefined;
}
export interface AuditContext {
    auditId?: string | undefined;
    reason?: string | undefined;
    source?: string | undefined;
}
export interface OpportunityRefSummary {
    opportunityId?: string | undefined;
    opportunityNo?: string | undefined;
    opportunityName?: string | undefined;
}
export interface ItemSnapshot {
    itemCode?: string | undefined;
    itemName?: string | undefined;
}
export interface SalesConfigSnapshot {
    salesUom?: string | undefined;
    salesUnitLabel?: string | undefined;
    notes?: string | undefined;
}
export interface PackagingRequirementSnapshot {
    packageMode?: string | undefined;
    packageLabel?: string | undefined;
    specialInstructions?: string | undefined;
}
export interface PriceSnapshot {
    currencyCode?: string | undefined;
    unitPriceAmount?: string | undefined;
    sourceType?: PricingSourceType | undefined;
    sourceRefId?: string | undefined;
    sourceLineRefId?: string | undefined;
    sourceVersionNo?: number | undefined;
    resolvedAt?: string | undefined;
}
export interface MoqSnapshot {
    moqQuantity?: string | undefined;
    quantityUomCode?: string | undefined;
    sourceType?: PricingSourceType | undefined;
    sourceRefId?: string | undefined;
    sourceLineRefId?: string | undefined;
    sourceVersionNo?: number | undefined;
    resolvedAt?: string | undefined;
}
export interface ExchangeRateSnapshot {
    fromCurrencyCode?: string | undefined;
    toCurrencyCode?: string | undefined;
    exchangeRateValue?: string | undefined;
    financeRateRef?: string | undefined;
    effectiveAt?: string | undefined;
    snapshottedAt?: string | undefined;
}
export interface ExceptionPlaceholder {
    exceptionType?: PricingExceptionType | undefined;
    status?: PricingExceptionStatus | undefined;
    baselineSourceType?: PricingSourceType | undefined;
    baselineValue?: string | undefined;
    actualValue?: string | undefined;
    currencyCode?: string | undefined;
    quantityUomCode?: string | undefined;
    detectedAt?: string | undefined;
}
export interface PriceQuantityDeliverySnapshot {
    currencyCode?: string | undefined;
    unitPrice?: string | undefined;
    quantity?: string | undefined;
    deliveryTerm?: string | undefined;
    requestedDeliveryDate?: string | undefined;
    priceSnapshot?: PriceSnapshot | undefined;
    moqSnapshot?: MoqSnapshot | undefined;
    exchangeRateSnapshot?: ExchangeRateSnapshot | undefined;
    exceptionPlaceholders?: ExceptionPlaceholder[] | undefined;
}
export interface CustomerItemSnapshot {
    customerSku?: string | undefined;
    customerModel?: string | undefined;
    customerDisplayName?: string | undefined;
}
export interface QuoteLineInput {
    lineNo?: number | undefined;
    itemId?: string | undefined;
    itemSnapshot?: ItemSnapshot | undefined;
    salesConfigSnapshot?: SalesConfigSnapshot | undefined;
    packagingRequirementSnapshot?: PackagingRequirementSnapshot | undefined;
    priceQuantityDeliverySnapshot?: PriceQuantityDeliverySnapshot | undefined;
    customerItemSnapshot?: CustomerItemSnapshot | undefined;
}
export interface QuoteLine {
    quoteLineId?: string | undefined;
    lineNo?: number | undefined;
    itemId?: string | undefined;
    itemSnapshot?: ItemSnapshot | undefined;
    salesConfigSnapshot?: SalesConfigSnapshot | undefined;
    packagingRequirementSnapshot?: PackagingRequirementSnapshot | undefined;
    priceQuantityDeliverySnapshot?: PriceQuantityDeliverySnapshot | undefined;
    customerItemSnapshot?: CustomerItemSnapshot | undefined;
}
export interface Quote {
    quoteId?: string | undefined;
    quoteNo?: string | undefined;
    tenantId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    opportunityRef?: OpportunityRefSummary | undefined;
    status?: QuoteStatus | undefined;
    latestPublishedVersionId?: string | undefined;
    lines?: QuoteLine[] | undefined;
}
export interface QuoteVersion {
    quoteVersionId?: string | undefined;
    quoteId?: string | undefined;
    quoteNo?: string | undefined;
    versionNo?: number | undefined;
    tenantId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    publishedAt?: string | undefined;
    lines?: QuoteLine[] | undefined;
}
export interface CommercialGateSummary {
    orderEstablished?: boolean | undefined;
    productionGate?: boolean | undefined;
    stockingGate?: boolean | undefined;
    shippingGate?: boolean | undefined;
}
export interface FulfillmentHandoffSummary {
    status?: FulfillmentHandoffStatusCode | undefined;
    submittedAt?: string | undefined;
}
export interface SalesOrderLine {
    salesOrderLineId?: string | undefined;
    lineNo?: number | undefined;
    itemId?: string | undefined;
    itemSnapshot?: ItemSnapshot | undefined;
    salesConfigSnapshot?: SalesConfigSnapshot | undefined;
    packagingRequirementSnapshot?: PackagingRequirementSnapshot | undefined;
    priceQuantityDeliverySnapshot?: PriceQuantityDeliverySnapshot | undefined;
    customerItemSnapshot?: CustomerItemSnapshot | undefined;
}
export interface SalesOrder {
    salesOrderId?: string | undefined;
    salesOrderNo?: string | undefined;
    tenantId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    quoteId?: string | undefined;
    quoteVersionId?: string | undefined;
    commercialGateSummary?: CommercialGateSummary | undefined;
    fulfillmentHandoffStatus?: FulfillmentHandoffSummary | undefined;
    lines?: SalesOrderLine[] | undefined;
}
export interface QuoteDraftMutation {
    customerTenantPartyId?: string | undefined;
    opportunityRef?: OpportunityRefSummary | undefined;
    lines?: QuoteLineInput[] | undefined;
}
export interface PriceListLineInput {
    itemId?: string | undefined;
    brandKey?: string | undefined;
    unitPriceAmount?: string | undefined;
    moqQuantity?: string | undefined;
    quantityUomCode?: string | undefined;
}
export interface PriceListLine {
    priceListLineId?: string | undefined;
    lineNo?: number | undefined;
    itemId?: string | undefined;
    brandKey?: string | undefined;
    priceSnapshot?: PriceSnapshot | undefined;
    moqSnapshot?: MoqSnapshot | undefined;
}
export interface PriceList {
    priceListId?: string | undefined;
    tenantId?: string | undefined;
    priceListName?: string | undefined;
    priceListType?: PriceListType | undefined;
    status?: PriceListStatus | undefined;
    currencyCode?: string | undefined;
    effectiveFrom?: string | undefined;
    effectiveTo?: string | undefined;
}
export interface CustomerPriceAgreementLineInput {
    itemId?: string | undefined;
    brandKey?: string | undefined;
    unitPriceAmount?: string | undefined;
    moqQuantity?: string | undefined;
    quantityUomCode?: string | undefined;
}
export interface CustomerPriceAgreementLineRemoval {
    itemId?: string | undefined;
    brandKey?: string | undefined;
}
export interface CustomerPriceAgreementDraftMutation {
    upserts?: CustomerPriceAgreementLineInput[] | undefined;
    removals?: CustomerPriceAgreementLineRemoval[] | undefined;
}
export interface CustomerPriceAgreementLine {
    customerPriceAgreementLineId?: string | undefined;
    lineNo?: number | undefined;
    itemId?: string | undefined;
    brandKey?: string | undefined;
    priceSnapshot?: PriceSnapshot | undefined;
    moqSnapshot?: MoqSnapshot | undefined;
}
export interface CustomerPriceAgreement {
    customerPriceAgreementId?: string | undefined;
    tenantId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    currencyCode?: string | undefined;
    versionNo?: number | undefined;
    status?: CustomerPriceAgreementStatus | undefined;
    publishedAt?: string | undefined;
    lines?: CustomerPriceAgreementLine[] | undefined;
}
export interface CustomerPriceAgreementVersionSummary {
    customerPriceAgreementId?: string | undefined;
    versionNo?: number | undefined;
    status?: CustomerPriceAgreementStatus | undefined;
    publishedAt?: string | undefined;
    lineCount?: number | undefined;
}
export interface GetQuoteRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    quoteId?: string | undefined;
}
export interface GetQuoteResponse {
    quote?: Quote | undefined;
}
export interface SearchQuotesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    keyword?: string | undefined;
    customerTenantPartyId?: string | undefined;
    status?: QuoteStatus | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchQuotesResponse {
    quotes?: Quote[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetQuoteVersionRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    quoteVersionId?: string | undefined;
}
export interface GetQuoteVersionResponse {
    quoteVersion?: QuoteVersion | undefined;
}
export interface ListQuoteVersionsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    quoteId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListQuoteVersionsResponse {
    quoteVersions?: QuoteVersion[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetSalesOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    salesOrderId?: string | undefined;
}
export interface GetSalesOrderResponse {
    salesOrder?: SalesOrder | undefined;
}
export interface SearchSalesOrdersRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    keyword?: string | undefined;
    customerTenantPartyId?: string | undefined;
    quoteVersionId?: string | undefined;
    productionGate?: boolean | undefined;
    stockingGate?: boolean | undefined;
    shippingGate?: boolean | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchSalesOrdersResponse {
    salesOrders?: SalesOrder[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreateQuoteRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerTenantPartyId?: string | undefined;
    opportunityRef?: OpportunityRefSummary | undefined;
    draftLines?: QuoteLineInput[] | undefined;
}
export interface CreateQuoteResponse {
    quote?: Quote | undefined;
}
export interface UpdateQuoteDraftRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    quoteId?: string | undefined;
    draftMutation?: QuoteDraftMutation | undefined;
}
export interface UpdateQuoteDraftResponse {
    quote?: Quote | undefined;
}
export interface PublishQuoteRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    quoteId?: string | undefined;
}
export interface PublishQuoteResponse {
    quoteVersion?: QuoteVersion | undefined;
    quote?: Quote | undefined;
}
export interface ConvertQuoteVersionToOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    quoteVersionId?: string | undefined;
}
export interface ConvertQuoteVersionToOrderResponse {
    salesOrder?: SalesOrder | undefined;
}
export interface SetOrderCommercialGateRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    salesOrderId?: string | undefined;
    gateName?: CommercialGateName | undefined;
    allowed?: boolean | undefined;
}
export interface SetOrderCommercialGateResponse {
    salesOrderId?: string | undefined;
    commercialGateSummary?: CommercialGateSummary | undefined;
}
export interface SubmitFulfillmentHandoffRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    salesOrderId?: string | undefined;
}
export interface SubmitFulfillmentHandoffResponse {
    salesOrderId?: string | undefined;
    commercialGateSummary?: CommercialGateSummary | undefined;
    fulfillmentHandoffStatus?: FulfillmentHandoffSummary | undefined;
}
export interface SearchPriceListsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    keyword?: string | undefined;
    priceListType?: PriceListType | undefined;
    status?: PriceListStatus | undefined;
    currencyCode?: string | undefined;
    effectiveAt?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPriceListsResponse {
    priceLists?: PriceList[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetPriceListRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    priceListId?: string | undefined;
}
export interface GetPriceListResponse {
    priceList?: PriceList | undefined;
}
export interface GetPriceListLinesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    priceListId?: string | undefined;
    itemId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetPriceListLinesResponse {
    priceListLines?: PriceListLine[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetActiveCustomerPriceAgreementRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    customerTenantPartyId?: string | undefined;
    currencyCode?: string | undefined;
}
export interface GetActiveCustomerPriceAgreementResponse {
    customerPriceAgreement?: CustomerPriceAgreement | undefined;
}
export interface GetCustomerPriceAgreementRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    customerPriceAgreementId?: string | undefined;
    versionNo?: number | undefined;
}
export interface GetCustomerPriceAgreementResponse {
    customerPriceAgreement?: CustomerPriceAgreement | undefined;
}
export interface ListCustomerPriceAgreementVersionsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    customerPriceAgreementId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListCustomerPriceAgreementVersionsResponse {
    versions?: CustomerPriceAgreementVersionSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface PreviewQuoteLinePricingRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    customerTenantPartyId?: string | undefined;
    itemId?: string | undefined;
    brandKey?: string | undefined;
    currencyCode?: string | undefined;
    requestedQuantity?: string | undefined;
    quantityUomCode?: string | undefined;
    selectedPriceListId?: string | undefined;
    manualUnitPriceAmount?: string | undefined;
    pricingAt?: string | undefined;
    exchangeRateTargetCurrencyCode?: string | undefined;
}
export interface PreviewQuoteLinePricingResponse {
    priceSnapshot?: PriceSnapshot | undefined;
    moqSnapshot?: MoqSnapshot | undefined;
    exchangeRateSnapshot?: ExchangeRateSnapshot | undefined;
    exceptionPlaceholders?: ExceptionPlaceholder[] | undefined;
}
export interface CreatePriceListRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    priceListName?: string | undefined;
    priceListType?: PriceListType | undefined;
    currencyCode?: string | undefined;
    effectiveFrom?: string | undefined;
    effectiveTo?: string | undefined;
    initialLines?: PriceListLineInput[] | undefined;
}
export interface CreatePriceListResponse {
    priceList?: PriceList | undefined;
}
export interface UpdatePriceListRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    priceListId?: string | undefined;
    priceListName?: string | undefined;
    effectiveFrom?: string | undefined;
    effectiveTo?: string | undefined;
}
export interface UpdatePriceListResponse {
    priceList?: PriceList | undefined;
}
export interface ReplacePriceListLinesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    priceListId?: string | undefined;
    lines?: PriceListLineInput[] | undefined;
}
export interface ReplacePriceListLinesResponse {
    priceList?: PriceList | undefined;
    priceListLines?: PriceListLine[] | undefined;
}
export interface ChangePriceListStatusRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    priceListId?: string | undefined;
    targetStatus?: PriceListStatus | undefined;
}
export interface ChangePriceListStatusResponse {
    priceList?: PriceList | undefined;
}
export interface CreateCustomerPriceAgreementRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerTenantPartyId?: string | undefined;
    currencyCode?: string | undefined;
    initialLines?: CustomerPriceAgreementLineInput[] | undefined;
}
export interface CreateCustomerPriceAgreementResponse {
    customerPriceAgreement?: CustomerPriceAgreement | undefined;
}
export interface UpdateCustomerPriceAgreementDraftRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerPriceAgreementId?: string | undefined;
    draftMutation?: CustomerPriceAgreementDraftMutation | undefined;
}
export interface UpdateCustomerPriceAgreementDraftResponse {
    customerPriceAgreement?: CustomerPriceAgreement | undefined;
}
export interface PublishCustomerPriceAgreementVersionRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerPriceAgreementId?: string | undefined;
}
export interface PublishCustomerPriceAgreementVersionResponse {
    customerPriceAgreement?: CustomerPriceAgreement | undefined;
}
export interface CreateCustomerPriceAgreementFromSalesOrderLineRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    salesOrderLineId?: string | undefined;
}
export interface CreateCustomerPriceAgreementFromSalesOrderLineResponse {
    customerPriceAgreement?: CustomerPriceAgreement | undefined;
}
export interface SalesQueryServiceClient {
    getQuote(request: GetQuoteRequest, ...rest: any): Observable<GetQuoteResponse>;
    searchQuotes(request: SearchQuotesRequest, ...rest: any): Observable<SearchQuotesResponse>;
    getQuoteVersion(request: GetQuoteVersionRequest, ...rest: any): Observable<GetQuoteVersionResponse>;
    listQuoteVersions(request: ListQuoteVersionsRequest, ...rest: any): Observable<ListQuoteVersionsResponse>;
    getSalesOrder(request: GetSalesOrderRequest, ...rest: any): Observable<GetSalesOrderResponse>;
    searchSalesOrders(request: SearchSalesOrdersRequest, ...rest: any): Observable<SearchSalesOrdersResponse>;
}
export interface SalesQueryServiceController {
    getQuote(request: GetQuoteRequest, ...rest: any): Promise<GetQuoteResponse> | Observable<GetQuoteResponse> | GetQuoteResponse;
    searchQuotes(request: SearchQuotesRequest, ...rest: any): Promise<SearchQuotesResponse> | Observable<SearchQuotesResponse> | SearchQuotesResponse;
    getQuoteVersion(request: GetQuoteVersionRequest, ...rest: any): Promise<GetQuoteVersionResponse> | Observable<GetQuoteVersionResponse> | GetQuoteVersionResponse;
    listQuoteVersions(request: ListQuoteVersionsRequest, ...rest: any): Promise<ListQuoteVersionsResponse> | Observable<ListQuoteVersionsResponse> | ListQuoteVersionsResponse;
    getSalesOrder(request: GetSalesOrderRequest, ...rest: any): Promise<GetSalesOrderResponse> | Observable<GetSalesOrderResponse> | GetSalesOrderResponse;
    searchSalesOrders(request: SearchSalesOrdersRequest, ...rest: any): Promise<SearchSalesOrdersResponse> | Observable<SearchSalesOrdersResponse> | SearchSalesOrdersResponse;
}
export declare function SalesQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const SALES_QUERY_SERVICE_NAME = "SalesQueryService";
export interface SalesManagementServiceClient {
    createQuote(request: CreateQuoteRequest, ...rest: any): Observable<CreateQuoteResponse>;
    updateQuoteDraft(request: UpdateQuoteDraftRequest, ...rest: any): Observable<UpdateQuoteDraftResponse>;
    publishQuote(request: PublishQuoteRequest, ...rest: any): Observable<PublishQuoteResponse>;
    convertQuoteVersionToOrder(request: ConvertQuoteVersionToOrderRequest, ...rest: any): Observable<ConvertQuoteVersionToOrderResponse>;
    setOrderCommercialGate(request: SetOrderCommercialGateRequest, ...rest: any): Observable<SetOrderCommercialGateResponse>;
    submitFulfillmentHandoff(request: SubmitFulfillmentHandoffRequest, ...rest: any): Observable<SubmitFulfillmentHandoffResponse>;
}
export interface SalesManagementServiceController {
    createQuote(request: CreateQuoteRequest, ...rest: any): Promise<CreateQuoteResponse> | Observable<CreateQuoteResponse> | CreateQuoteResponse;
    updateQuoteDraft(request: UpdateQuoteDraftRequest, ...rest: any): Promise<UpdateQuoteDraftResponse> | Observable<UpdateQuoteDraftResponse> | UpdateQuoteDraftResponse;
    publishQuote(request: PublishQuoteRequest, ...rest: any): Promise<PublishQuoteResponse> | Observable<PublishQuoteResponse> | PublishQuoteResponse;
    convertQuoteVersionToOrder(request: ConvertQuoteVersionToOrderRequest, ...rest: any): Promise<ConvertQuoteVersionToOrderResponse> | Observable<ConvertQuoteVersionToOrderResponse> | ConvertQuoteVersionToOrderResponse;
    setOrderCommercialGate(request: SetOrderCommercialGateRequest, ...rest: any): Promise<SetOrderCommercialGateResponse> | Observable<SetOrderCommercialGateResponse> | SetOrderCommercialGateResponse;
    submitFulfillmentHandoff(request: SubmitFulfillmentHandoffRequest, ...rest: any): Promise<SubmitFulfillmentHandoffResponse> | Observable<SubmitFulfillmentHandoffResponse> | SubmitFulfillmentHandoffResponse;
}
export declare function SalesManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const SALES_MANAGEMENT_SERVICE_NAME = "SalesManagementService";
export interface PricingQueryServiceClient {
    searchPriceLists(request: SearchPriceListsRequest, ...rest: any): Observable<SearchPriceListsResponse>;
    getPriceList(request: GetPriceListRequest, ...rest: any): Observable<GetPriceListResponse>;
    getPriceListLines(request: GetPriceListLinesRequest, ...rest: any): Observable<GetPriceListLinesResponse>;
    getActiveCustomerPriceAgreement(request: GetActiveCustomerPriceAgreementRequest, ...rest: any): Observable<GetActiveCustomerPriceAgreementResponse>;
    getCustomerPriceAgreement(request: GetCustomerPriceAgreementRequest, ...rest: any): Observable<GetCustomerPriceAgreementResponse>;
    listCustomerPriceAgreementVersions(request: ListCustomerPriceAgreementVersionsRequest, ...rest: any): Observable<ListCustomerPriceAgreementVersionsResponse>;
    previewQuoteLinePricing(request: PreviewQuoteLinePricingRequest, ...rest: any): Observable<PreviewQuoteLinePricingResponse>;
}
export interface PricingQueryServiceController {
    searchPriceLists(request: SearchPriceListsRequest, ...rest: any): Promise<SearchPriceListsResponse> | Observable<SearchPriceListsResponse> | SearchPriceListsResponse;
    getPriceList(request: GetPriceListRequest, ...rest: any): Promise<GetPriceListResponse> | Observable<GetPriceListResponse> | GetPriceListResponse;
    getPriceListLines(request: GetPriceListLinesRequest, ...rest: any): Promise<GetPriceListLinesResponse> | Observable<GetPriceListLinesResponse> | GetPriceListLinesResponse;
    getActiveCustomerPriceAgreement(request: GetActiveCustomerPriceAgreementRequest, ...rest: any): Promise<GetActiveCustomerPriceAgreementResponse> | Observable<GetActiveCustomerPriceAgreementResponse> | GetActiveCustomerPriceAgreementResponse;
    getCustomerPriceAgreement(request: GetCustomerPriceAgreementRequest, ...rest: any): Promise<GetCustomerPriceAgreementResponse> | Observable<GetCustomerPriceAgreementResponse> | GetCustomerPriceAgreementResponse;
    listCustomerPriceAgreementVersions(request: ListCustomerPriceAgreementVersionsRequest, ...rest: any): Promise<ListCustomerPriceAgreementVersionsResponse> | Observable<ListCustomerPriceAgreementVersionsResponse> | ListCustomerPriceAgreementVersionsResponse;
    previewQuoteLinePricing(request: PreviewQuoteLinePricingRequest, ...rest: any): Promise<PreviewQuoteLinePricingResponse> | Observable<PreviewQuoteLinePricingResponse> | PreviewQuoteLinePricingResponse;
}
export declare function PricingQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const PRICING_QUERY_SERVICE_NAME = "PricingQueryService";
export interface PricingManagementServiceClient {
    createPriceList(request: CreatePriceListRequest, ...rest: any): Observable<CreatePriceListResponse>;
    updatePriceList(request: UpdatePriceListRequest, ...rest: any): Observable<UpdatePriceListResponse>;
    replacePriceListLines(request: ReplacePriceListLinesRequest, ...rest: any): Observable<ReplacePriceListLinesResponse>;
    changePriceListStatus(request: ChangePriceListStatusRequest, ...rest: any): Observable<ChangePriceListStatusResponse>;
    createCustomerPriceAgreement(request: CreateCustomerPriceAgreementRequest, ...rest: any): Observable<CreateCustomerPriceAgreementResponse>;
    updateCustomerPriceAgreementDraft(request: UpdateCustomerPriceAgreementDraftRequest, ...rest: any): Observable<UpdateCustomerPriceAgreementDraftResponse>;
    publishCustomerPriceAgreementVersion(request: PublishCustomerPriceAgreementVersionRequest, ...rest: any): Observable<PublishCustomerPriceAgreementVersionResponse>;
    createCustomerPriceAgreementFromSalesOrderLine(request: CreateCustomerPriceAgreementFromSalesOrderLineRequest, ...rest: any): Observable<CreateCustomerPriceAgreementFromSalesOrderLineResponse>;
}
export interface PricingManagementServiceController {
    createPriceList(request: CreatePriceListRequest, ...rest: any): Promise<CreatePriceListResponse> | Observable<CreatePriceListResponse> | CreatePriceListResponse;
    updatePriceList(request: UpdatePriceListRequest, ...rest: any): Promise<UpdatePriceListResponse> | Observable<UpdatePriceListResponse> | UpdatePriceListResponse;
    replacePriceListLines(request: ReplacePriceListLinesRequest, ...rest: any): Promise<ReplacePriceListLinesResponse> | Observable<ReplacePriceListLinesResponse> | ReplacePriceListLinesResponse;
    changePriceListStatus(request: ChangePriceListStatusRequest, ...rest: any): Promise<ChangePriceListStatusResponse> | Observable<ChangePriceListStatusResponse> | ChangePriceListStatusResponse;
    createCustomerPriceAgreement(request: CreateCustomerPriceAgreementRequest, ...rest: any): Promise<CreateCustomerPriceAgreementResponse> | Observable<CreateCustomerPriceAgreementResponse> | CreateCustomerPriceAgreementResponse;
    updateCustomerPriceAgreementDraft(request: UpdateCustomerPriceAgreementDraftRequest, ...rest: any): Promise<UpdateCustomerPriceAgreementDraftResponse> | Observable<UpdateCustomerPriceAgreementDraftResponse> | UpdateCustomerPriceAgreementDraftResponse;
    publishCustomerPriceAgreementVersion(request: PublishCustomerPriceAgreementVersionRequest, ...rest: any): Promise<PublishCustomerPriceAgreementVersionResponse> | Observable<PublishCustomerPriceAgreementVersionResponse> | PublishCustomerPriceAgreementVersionResponse;
    createCustomerPriceAgreementFromSalesOrderLine(request: CreateCustomerPriceAgreementFromSalesOrderLineRequest, ...rest: any): Promise<CreateCustomerPriceAgreementFromSalesOrderLineResponse> | Observable<CreateCustomerPriceAgreementFromSalesOrderLineResponse> | CreateCustomerPriceAgreementFromSalesOrderLineResponse;
}
export declare function PricingManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const PRICING_MANAGEMENT_SERVICE_NAME = "PricingManagementService";
