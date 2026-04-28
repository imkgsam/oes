# finance-service 职责卡

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
- customer financial exposure、aging 与 credit consumption 的财务真相
- 面向 `sales-service` 的 finance release signal 与财务侧摘要回流口径
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
- `party-service` 的 `Party / TenantParty` 主体主数据真相
- 完整 `GL / voucher / statutory accounting / closing`
- `AP`
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
- `party-service`
  - 提供 `tenantPartyId` 与主体摘要引用真相。
  - `finance-service` 不自建客户主体主档。
- `permission-service`
  - 提供发票开立、回款登记、信用调整、finance release 等动作的授权判定能力。
- `tenant-org-service`
  - 提供租户 / 组织上下文，用于财务操作范围隔离与 org 维度可见性裁剪。
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
- future accounting core 可采用的 posting source candidate facts

## 8. Non-goals

- 不把 `finance-service` 在 phase 1 拆成 `fx-service`、`credit-service`、`expense-service`。
- 不在 phase 1 一次性落成完整会计平台。
- 不在 phase 1 承诺完整 double-entry accounting、总账、凭证、结账与法定财务核算。
- 不在 phase 1 承诺 expense、AP、bank reconciliation 或 order profitability。
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
- phase 1 不做：
  - 完整 `GL`
  - voucher
  - statutory accounting
  - closing
  - bank reconciliation
  - expense
  - `AP`
- Finance owns standard exchange rate truth；Sales 只保存 exchange rate snapshot。
- Finance owns receivable / invoice / collection / payment / credit truth。
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
