# finance-service 职责卡

Last Updated: 2026-05-13

## 1. Purpose

`finance-service` 是 OES 的经营财务与 order-to-cash 财务控制服务，负责回答“这笔客户应收是什么、发票与回款到了哪里、哪些回款已分配、客户信用是否允许继续推进，以及标准汇率应以什么口径为准”。

当前职责卡只冻结 `finance-service` 的 phase 1 最小稳定边界：建立经营财务闭环，而不是一次性落成完整会计平台。future accounting core 作为 phase 2 目标态被预留边界，但不作为本阶段交付承诺。

## 2. Owns

- `Receivable`
- `Invoice`
- `Collection`
- `CollectionAllocation`
- `CustomerCreditProfile`
- `FinanceRelease`
- `StandardExchangeRate`
- `PaymentTerm`
- customer financial exposure、aging 与 credit consumption 的财务真相
- 面向 `sales-service` 的 finance release signal 与财务侧摘要回流口径
- 多币种经营财务处理所需的 base currency、transaction currency、exchange rate snapshot 与同币种核销边界
- future `AP / supplier invoice / payment control / AR-AP netting` 的财务边界占位
- future accounting core 的边界占位：
  - `ChartOfAccount`
  - `Journal`
  - `JournalEntry`
  - `JournalEntryLine`
  - `FiscalPeriod`
  - `PostingRule`

## 3. Does Not Own

- `sales-service` 的 `Quote`、`SalesOrder`、commercial snapshot 与 customer commitment 真相
- `crm-service` 的客户关系外壳、联系人、地址与客户开发真相
- `party-service` 的主体主数据与租户主体引用；具体核心对象与 owner 边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- 完整 `GL / voucher / statutory accounting / closing`
- `AP`
- `AR / AP netting` phase 1 实现
- 跨币种收款、付款、抵扣与汇兑损益 phase 1 实现
- payment account / bank account / PSP account phase 1 主线设计
- bank reconciliation
- expense phase 1 运行闭环
- order profitability phase 1 分析真相
- `wms-service` 的库存 / 占用 / 发运执行真相
- `mes-service` 的制造执行与放行真相
- 直接改写 `sales-service` 的 commercial gate

## 4. Core Responsibilities

- 基于已成立销售交易与受控财务输入，维护客户应收、发票、回款与回款分配闭环。
- 管理客户信用额度、信用占用、逾期暴露与相关财务风控摘要。
- 以显式 `FinanceRelease` 结果对外发布“财务允许继续推进”的信号，但不接管 `SalesOrder` gate owner。
- 维护标准汇率真相，供销售定价预览、交易快照与后续财务处理采用。
- 维护 `PaymentTerm` 主数据；CRM / SRM 只保存默认引用，Sales / Procurement / Finance 单据必须保存付款条款 snapshot。
- 对多币种交易保存交易币种金额、本位币金额与汇率快照；第一阶段只要求同币种收付款与同币种核销，跨币种结算与汇兑损益后置。
- 同一 `TenantParty` 同时作为客户与供应商时，Finance 未来可以识别其客户 / 供应商角色并支持 AR/AP 抵扣；第一阶段不实现抵扣。
- 向上游页面、Gateway 与销售域提供受控的 AR / invoice / collection / credit / finance release 查询摘要。
- 为 future accounting core 预留可追溯的 posting source 边界，但 phase 1 不要求完成 double-entry posting。

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway`
  - future finance workspace / AR workspace pages
  - future collection import / finance operations tools through BFF only
- 当前设计输入：
  - [erp-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/erp-service-design.md)
  - [finance-ar-credit-core.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/finance-ar-credit-core.md)

## 6. Upstream Dependencies

- `sales-service`
  - 提供已成立订单、commercial snapshot、customer commitment 与 sales-side exchange rate snapshot 消费场景。
  - `finance-service` 不回写销售订单真相，只消费受控交易事实并回流 finance release signal / finance summary。
- `crm-service`
  - 提供可进入交易链的客户关系入口与客户选择语义。
  - `finance-service` 不复制 CRM customer relationship truth。
- `srm-service`
  - 提供供应商角色入口与 supplier default payment term 引用场景。
  - `finance-service` 不复制 SRM supplier relationship truth。
- `party-service`
  - 提供 `tenantPartyId` 与主体摘要引用真相。
  - `finance-service` 不自建客户主体主档。
- `permission-service`
  - 提供发票开立、回款登记、信用调整、finance release 等动作的授权判定能力；permission 侧核心对象与 owner 边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- `tenant-org-service`
  - 提供租户 / 组织上下文，用于财务操作范围隔离与 org 维度可见性裁剪。
  - `Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准，Finance 只消费引用与范围裁剪结果。
- external bank / PSP / statutory accounting systems, future
  - phase 1 可以作为受控输入或下游集成对象存在，但不转移 `finance-service` 的经营财务真相 owner。

## 7. Downstream / Published Facts

- `Receivable` 状态与 aging 摘要
- `Invoice` 开立 / 取消 / 状态摘要
- `Collection` 登记与到账摘要
- `CollectionAllocation` 分配结果摘要
- `CustomerCreditProfile`、credit exposure 与 credit availability 摘要
- `FinanceRelease` 结果摘要
- `StandardExchangeRate` 当前有效值与生效时间摘要
- `PaymentTerm` 摘要
- transaction currency / base currency / exchange rate snapshot 摘要
- future accounting core 可采用的 posting source candidate facts

## 8. Non-goals

- 不把 `finance-service` 在 phase 1 拆成 `fx-service`、`credit-service`、`expense-service`。
- 不在 phase 1 一次性落成完整会计平台。
- 不在 phase 1 承诺完整 double-entry accounting、总账、凭证、结账与法定财务核算。
- 不在 phase 1 承诺 expense、AP、bank reconciliation 或 order profitability。
- 不在 phase 1 承诺 AR/AP 抵扣、跨币种结算、汇兑损益自动核算或 payment account / bank account 闭环。
- 不让 `finance-service` 直接改写 `SalesOrder` 的 commercial gate。
- 不让 Sales 拥有应收、发票、回款、回款分配、客户信用或标准汇率真相。
- 不把 future accounting core 的边界占位写成 phase 1 已承诺交付。

## 9. Current Stage

当前阶段只冻结 `finance-service` 的 phase 1 最小稳定边界：

- `finance-service` 是独立粗粒度服务，不拆分 `fx-service / credit-service / expense-service`。
- phase 1 聚焦经营财务闭环：
  - `AR`
  - `invoice`
  - `collection`
  - `allocation`
  - customer credit
  - finance release
  - standard `FX`
  - `PaymentTerm`
- phase 1 不做：
  - 完整 `GL`
  - voucher
  - statutory accounting
  - closing
  - bank reconciliation
  - expense
  - `AP`
  - AR/AP 抵扣
  - 跨币种收付款、付款、抵扣与汇兑损益自动处理
  - payment account / bank account / PSP account 闭环
- Finance owns standard exchange rate truth；Sales 只保存 exchange rate snapshot。
- Finance owns receivable / invoice / collection / credit truth；payment / account 能力属于 Finance 域族但不是 CRM/SRM 第一阶段前置依赖。
- `Party` 不保存币种；CRM / SRM 的 default currency 只是订单默认值。
- SalesOrder / PurchaseOrder / Invoice / Receivable / Payable 应保存实际 transaction currency。
- Finance 单据应保存 transaction amount、base currency、base amount 与 exchange rate snapshot。
- 第一阶段只支持同币种收付款与同币种核销；跨币种能力后置但对象设计不得堵死。
- 同公司同时是客户和供应商时，Finance future 可以基于 `tenantPartyId / partyId` 识别同一 counterparty；第一阶段不实现 AR/AP 抵扣。
- `sales-service` owns `Quote / SalesOrder / commercial snapshot / customer commitment`。
- `finance-service` 只发布 finance release signal，不直接成为 `SalesOrder` gate owner。
- order profitability 后置，不进入 phase 1。
- expense 仍属于 Finance 域族，但 deferred。

## 10. Future Accounting Core Boundary

future accounting core 是 `finance-service` 的 phase 2 目标态，不是 phase 1 必做项；当前只冻结其边界占位，供后续 contract 与 realization 线程避免把 phase 1 对象设计死到无法过渡。

最低预留边界如下：

- `ChartOfAccount`
  - 表达会计科目体系与分类口径。
- `Journal`
  - 表达记账日记账入口与来源分类。
- `JournalEntry`
  - 表达一笔完整分录头。
- `JournalEntryLine`
  - 表达借贷分录行。
- `FiscalPeriod`
  - 表达会计期间与开闭状态。
- `PostingRule`
  - 表达经营财务对象到会计分录的受控映射规则。

阶段约束：

- phase 2 目标态要求兼容 double-entry accounting。
- phase 1 的 `Receivable / Invoice / Collection / CollectionAllocation / StandardExchangeRate` 应被视为 future posting source，而不是提前伪装成总账分录。
- 未冻结 accounting core contract 之前，不得把上述对象写成已定 proto、数据库结构或实现承诺。
