# sales-service Contracts

## 1. 目的

本目录用于冻结 `sales-service` phase 1 的黑盒契约文档。

这些文档面向：

- `api-gateway` / future BFF
- `crm-service`
- `party-service`
- `item-master-service`
- future fulfillment boundary
- 后续承担 `sales-service` proto / runtime 实现的线程

这些文档不是 proto 副本，不展开数据库结构，不承诺运行时实现细节。

本目录只回写已经冻结的 `SALES-CONTRACT-DOC` 结论。

## 2. Phase 1 Contract Surface

phase 1 只冻结四组内部 gRPC 服务面：

- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/query.md)
  - `SalesQueryService`
  - `GetQuote`
  - `SearchQuotes`
  - `GetQuoteVersion`
  - `ListQuoteVersions`
  - `GetSalesOrder`
  - `SearchSalesOrders`
- [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/management.md)
  - `SalesManagementService`
  - `CreateQuote`
  - `UpdateQuoteDraft`
  - `PublishQuote`
  - `ConvertQuoteVersionToOrder`
  - `SetOrderCommercialGate`
  - `SubmitFulfillmentHandoff`
- [pricing-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/pricing-query.md)
  - `PricingQueryService`
  - `SearchPriceLists`
  - `GetPriceList`
  - `GetPriceListLines`
  - `GetActiveCustomerPriceAgreement`
  - `GetCustomerPriceAgreement`
  - `ListCustomerPriceAgreementVersions`
  - `PreviewQuoteLinePricing`
- [pricing-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/pricing-management.md)
  - `PricingManagementService`
  - `CreatePriceList`
  - `UpdatePriceList`
  - `ReplacePriceListLines`
  - `ChangePriceListStatus`
  - `CreateCustomerPriceAgreement`
  - `UpdateCustomerPriceAgreementDraft`
  - `PublishCustomerPriceAgreementVersion`
  - `CreateCustomerPriceAgreementFromSalesOrderLine`

phase 1 不在本目录中冻结：

- proto message 全量定义
- integration event catalog
- 外部 HTTP / BFF surface
- UI / print / export contract
- workflow、campaign engine、rebate 或 commission contract

## 3. Owner Boundary

phase 1 contract 明确围绕以下 owner 边界展开：

- `Quote`
- `QuoteVersion`
- `SalesOrder`
- `SalesOrderLine`
- `PriceList`
- `PriceListLine`
- `CustomerPriceAgreement`
- `CustomerPriceAgreementLine`
- transaction snapshot
- customer commitment
- order-level commercial gate summary
- sales-side fulfillment handoff summary

说明：

- `Quote` 草稿可反复修改；只有显式 `PublishQuote` 才生成 `QuoteVersion`
- 下载、预览、打印、导出不生成 `QuoteVersion`
- `SalesOrder` 只能通过显式 `ConvertQuoteVersionToOrder` 创建
- `SalesOrderLine` 必须保存稳定引用 + 冻结快照：
  - `itemId`
  - `itemSnapshot`
  - `salesConfigSnapshot`
  - `packagingRequirementSnapshot`
  - `priceQuantityDeliverySnapshot`
  - `customerItemSnapshot`
- `PriceList` 表达标准价、活动价、展会价，不展开 campaign engine
- `CustomerPriceAgreement` 表达客户长期价格；phase 1 不拆独立 `pricing-service`
- 同一 `customer_tenant_party_id + currency_code` 在同一租户下最多只有一个 active `CustomerPriceAgreement`
- `QuoteLine / QuoteVersionLine / SalesOrderLine` 必须冻结：
  - `priceSnapshot`
  - `moqSnapshot`
  - `exchangeRateSnapshot`
  - `exceptionPlaceholders[]`
- `customerItemSnapshot` 用于客户自有 `SKU / 型号 / 标签显示名`
- `CommercialGateSummary` 至少区分：
  - `order_established`
  - `production_gate`
  - `stocking_gate`
  - `shipping_gate`

## 4. Does Not Own

`sales-service` phase 1 contract 明确不承载以下真相：

- `crm-service` 的 `opportunity`
- `party-service` 的 `Party / TenantParty`
- `item-master-service` 的 `Item`
- `wms-service` 的库存、占用、包装转换与仓储执行
- `mes-service` 的制造执行、WIP、工序与放行执行
- future `finance-service` 或外部财务系统的 `AR / AP / invoice / payment`
- `Contract / CLM` 生命周期

进一步约束：

- 不把 WMS / MES / Finance 真相塞进 Sales contract
- `sales-service` 只拥有商业前提与 fulfillment handoff
- physical release 与执行推进真相归 future fulfillment boundary

## 5. Security / Context Baseline

所有 phase 1 RPC 统一遵循以下基线：

- 全部为内部 gRPC 契约，不直接对外部客户端开放
- 所有 RPC 显式携带 `tenant_id`
- 所有 query RPC 都要求：
  - operator context
  - trace context
- 所有 management command 都要求：
  - operator context
  - trace context
  - audit context

补充说明：

- 本目录只冻结“必须可观察到的上下文与行为边界”，不展开 metadata header、guard 或 tracing 实现
- management command 必须按 command 语义使用，不得以 query 方式绕过写边界
- phase 1 不冻结 integration events，只允许列出 deferred candidate events

## 6. Deferred

以下能力明确 deferred，不得写成 phase 1 已承诺 contract：

- 完整 pricing engine
- special price stacking / campaign engine
- low-price / low-MOQ workflow
- rebate / commission
- CustomerPriceAgreement 完整合同生命周期
- packaging master
- `CustomerItemMapping` 完整目录
- `Contract / CLM`
- fulfillment boundary contract
- finance integration
- one quote version -> split / partial order
- integration events

## 7. Deferred Candidate Events

phase 1 只允许把下列事件列为候选，不得视为已冻结 event catalog：

- `QuotePublished`
- `SalesOrderEstablished`
- `SalesOrderCommercialGateUpdated`
- `SalesOrderFulfillmentHandoffSubmitted`

## 8. 关联真相源

本目录以上游稳定文档为准：

- [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
- [sales-fulfillment-mes-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-fulfillment-mes-wms-finance.md)
- [sales-quote-order-core.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/sales-quote-order-core.md)
