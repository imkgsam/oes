# Finance AR Credit Core

## 1. 目标

- 将 `finance-service` phase 1 已冻结结论回写为可执行 feature packet，作为后续 `FINANCE-CONTRACT` 的唯一主线入口。
- 建立经营财务第一阶段最小闭环：
  - `AR`
  - `invoice`
  - `collection`
  - `allocation`
  - customer credit
  - finance release
  - standard `FX`
- 明确 `finance-service` 是独立粗粒度服务，但 phase 1 不一次性落成完整 accounting core。

## 2. 不做什么

- 不在本 packet 中进入代码实现、proto 字段设计、数据库结构设计或 UI 设计。
- 不在本 packet 中把 `finance-service` 拆成 `fx-service / credit-service / expense-service`。
- 不在本 packet 中交付完整 `GL / voucher / statutory accounting / closing / bank reconciliation / expense / AP`。
- 不在本 packet 中把 `Quote / SalesOrder / commercial snapshot / customer commitment` 真相并入 Finance。
- 不在本 packet 中让 Finance 直接改写 `SalesOrder` gate。
- 不在本 packet 中展开 order profitability。

## 3. 上游依赖

- services:
  - [finance-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/finance-service.md)
  - [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- collaborations:
  - [sales-finance-order-to-cash.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-finance-order-to-cash.md)
  - [sales-fulfillment-mes-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-fulfillment-mes-wms-finance.md)
- plans:
  - [erp-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/erp-service-design.md)

## 4. 当前结论

- `finance-service` 是独立粗粒度服务，不拆分 `fx-service / credit-service / expense-service`。
- phase 1 `finance-service` owns：
  - `Receivable`
  - `Invoice`
  - `Collection`
  - `CollectionAllocation`
  - `CustomerCreditProfile`
  - `FinanceRelease`
  - `StandardExchangeRate`
- Finance owns：
  - receivable truth
  - invoice truth
  - collection / payment truth
  - allocation truth
  - customer credit truth
  - standard exchange rate truth
- `sales-service` owns：
  - `Quote`
  - `SalesOrder`
  - commercial snapshot
  - customer commitment
- Sales 只保存 exchange rate snapshot，不拥有标准汇率真相。
- Finance 不直接改 `SalesOrder` gate，只提供 finance release signal。
- phase 1 只做经营财务闭环，不做完整 `GL / voucher / statutory accounting / closing / bank reconciliation / expense / AP`。
- double-entry accounting 是 phase 2 目标态，需要在设计上兼容，但不是本 packet 的必做交付。
- future accounting core 至少预留：
  - `ChartOfAccount`
  - `Journal`
  - `JournalEntry`
  - `JournalEntryLine`
  - `FiscalPeriod`
  - `PostingRule`
- order profitability 后置，不进入 phase 1。
- expense 属于 Finance 域族，但 deferred。

## 5. 契约真相位置

- 稳定服务职责：
  - [finance-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/finance-service.md)
- 稳定协同蓝图：
  - [sales-finance-order-to-cash.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-finance-order-to-cash.md)
  - [sales-fulfillment-mes-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-fulfillment-mes-wms-finance.md)
- 下一步 contract 入口：
  - [finance-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/finance-service/README.md)

## 6. 当前 slice

- slice:
  - `finance-service` AR credit core
- status:
  - implementation-present / fresh-verification-needed
- scope:
  - `Receivable`
  - `Invoice`
  - `Collection`
  - `CollectionAllocation`
  - `CustomerCreditProfile`
  - `FinanceRelease`
  - `StandardExchangeRate`
  - sales-facing finance summary / release boundary
  - accounting core compatibility boundary
- ready definition:
  - 服务职责已回写
  - `Sales / Finance` 协同蓝图已冻结 minimum 口径
  - finance-service 黑盒 contract 已建立
  - finance-service runtime 已存在；本次状态校准未重跑 fresh verification

### 6.1 状态校准记录

Status, 2026-06-07:

- `docs/contracts/finance-service/**` 已存在并承接 Finance phase 1 account、receivable、payable、payment 与 integration contract。
- `src/services/business/finance-service/**` 已存在 service runtime、Prisma schema、repository、gRPC controller、tests 与 smoke script。
- 本次校准只修正文档状态；未重跑 `finance-service` test / build / smoke，因此当前状态不得写成 fresh verified 或 fully closed。

## 7. 最小模型

### 7.1 Receivable

- 表达客户应收责任与当前余额语义。
- phase 1 只冻结 owner 边界，不冻结完整账龄分层算法、核销策略或法定账务字段。

### 7.2 Invoice

- 表达 Finance 侧面向客户的开票对象与其状态流转。
- 发票状态与对应应收余额变化归 `finance-service` 管理。

### 7.3 Collection

- 表达客户回款 / 到账登记事实。
- phase 1 不把 bank reconciliation 与回款登记混为同一能力。

### 7.4 CollectionAllocation

- 表达某笔回款如何分配到具体 invoice / receivable。
- Sales 不拥有 allocation 真相。

### 7.5 CustomerCreditProfile

- 表达客户信用额度、信用占用、可用额度与风险摘要。
- phase 1 只冻结 owner 边界，不冻结完整 risk scoring 或 policy engine。

### 7.6 FinanceRelease

- 表达财务侧“是否允许继续推进”的受控结果。
- 该结果是 Sales gate 的输入之一，但不转移 gate owner。

### 7.7 StandardExchangeRate

- 表达 Finance 维护的标准汇率真相。
- `sales-service` 只在自己的快照链中保存 `ExchangeRateSnapshot`。

### 7.8 Future Accounting Core Boundary

- 只预留：
  - `ChartOfAccount`
  - `Journal`
  - `JournalEntry`
  - `JournalEntryLine`
  - `FiscalPeriod`
  - `PostingRule`
- 这些对象在 phase 1 不进入 contract / schema / implementation 承诺。

## 8. 主线范围

- 本线程主线：
  - 冻结 `AR / invoice / collection / allocation / customer credit / finance release / standard FX` 的 owner 边界
  - 冻结 Sales 与 Finance 的 order-to-cash 协同口径
  - 预留 future accounting core 的稳定边界占位
- 本线程不做：
  - proto、数据库、运行时状态机、UI、完整会计对象实现、盈利分析
- 偏移返回条件：
  - 如需新增跨服务公共契约、事件模型、租户模型、operator context 结构或会计核心正式语义，必须先升级 architecture / ADR

## 9. 阻塞 / 依赖

- `FINANCE-CONTRACT` 线程需要基于本 packet 冻结 finance query / management / integration contract，而不是回到 design workspace 重谈 Finance 是否独立成服务。
- `sales-service` 现有汇率快照与 commercial gate 语义已冻结，这使 `FINANCE-CONTRACT` 可以只聚焦 Finance owner 对象与 release / summary 边界。
- statutory accounting、bank integration、expense、AP 与 accounting core 详细 contract 仍未冻结，但不阻塞当前 AR credit core 进入 contract 阶段。

## 10. Deferred 清单

- 完整 `GL`
- voucher
- statutory accounting
- closing
- `AP`
- bank reconciliation
- expense 闭环
- order profitability
- accounting core 详细 contract / schema
- 完整 posting rule engine
- tax engine 与法定报表体系
- 完整资金 / treasury / cash forecasting

## 11. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| FINANCE-ARCH-WRITEBACK thread | 回写 `finance-service` 稳定真相源与 feature packet | `docs/architecture/services/finance-service.md`, `docs/architecture/collaborations/sales-finance-order-to-cash.md`, `docs/plans/features/finance-ar-credit-core.md`, 必要索引页 | `erp-service-design`、Sales 稳定边界与本轮冻结结论 | 服务职责、协同蓝图、feature packet | completed |
| FINANCE-CONTRACT thread | 冻结 `finance-service` 黑盒契约 | `docs/contracts/finance-service/**` | 本 feature packet、服务职责、协同蓝图 | finance query / management / integration contracts | completed |
| FINANCE-REALIZATION thread | 在已冻结边界内实现 `finance-service` phase 1 骨架与验证 | `src/services/business/finance-service/**` | feature packet、contracts | 可运行服务、测试与验证结果 | implementation-present / fresh-verification-needed |

## 12. 验收标准

- `finance-service` 职责卡已明确 owns / does-not-own / phase 1 范围。
- `Sales / Finance` 协同蓝图已冻结 finance release、AR、invoice、collection、credit 与 standard FX 的协同口径。
- feature packet 已能直接作为 `FINANCE-CONTRACT` 输入，而不需要继续引用 design workspace 重谈 Finance owner 边界。
- 已明确 future accounting core 只做边界预留，不被误写成 phase 1 承诺。

## 13. 关闭条件

- `docs/contracts/finance-service/**` 已建立并承接本 packet。
- 后续 contract 线程无需再次讨论 `finance-service` 是否还应拆成多个细服务。
- `FinanceRelease`、standard FX owner、AR / invoice / collection / allocation / credit 边界在 contract 阶段未被重新打开。
- 若需要关闭本 packet，应先重跑 finance-service 相关 test / build / smoke，并把 fresh verification 结果回写到本文。
