# CRM Customer Master Foundation

## 1. 目标

- 将 `crm-service` 最小客户主档闭环的已冻结结论回写为可执行 feature packet，作为后续 `CRM-CONTRACT` 的唯一主线入口。
- 建立 CRM phase 1 最小闭环：
  - `CustomerAccount`
  - `CustomerContact`
  - `CustomerAddress`
  - `CustomerStatus`
  - `CustomerCategory`
  - customer `tags`
  - `CustomerPartyBinding`
- 明确 `CustomerAccount` 只是客户关系外壳，`tenantPartyId` 才是 Sales / Pricing / Agreement 的稳定主体引用。

## 2. 不做什么

- 不在本 packet 中进入代码实现、proto 字段设计、数据库结构设计或 UI 设计。
- 不在本 packet 中扩展完整 `Opportunity / Activity / Customer 360 / BI`。
- 不在本 packet 中把 Party 主体主数据复制成 CRM 真相。
- 不在本 packet 中把 `Quote / QuoteVersion / SalesOrder` 真相并入 CRM。
- 不在本 packet 中把 `AR / credit / payment` 并入 CRM。
- 不在本 packet 中扩展一客多主体、多 bill-to / ship-to / legal entity 模型。
- 不在本 packet 中交付完整 `CustomerItemMapping / customer SKU` 目录。

## 3. 上游依赖

- services:
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- collaborations:
  - [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
- contracts:
  - [README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/README.md)
  - [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/query.md)
  - [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/management.md)
- plans:
  - [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)

## 4. 当前结论

- `crm-service` owns：
  - `CustomerAccount`
  - `CustomerContact`
  - `CustomerAddress`
  - `CustomerStatus`
  - `CustomerCategory`
  - customer `tags`
  - `CustomerPartyBinding`
- `crm-service` does-not-own：
  - `party-service` 主体真相
  - `sales-service Quote / QuoteVersion / SalesOrder` 真相
  - `AR / credit / payment`
  - `Customer 360 / BI`
  - 完整 `Opportunity / Activity`
- `CustomerAccount` 是客户关系外壳；`tenantPartyId` 是 Sales / Pricing / Agreement 的稳定主体引用。
- phase 1 一条 `CustomerAccount` 只有一个 active primary `tenantPartyId`。
- 同一 `tenantId + tenantPartyId` 最多对应一个 active `CustomerAccount`。
- 只有 `ACTIVE_CUSTOMER + active primary binding` 才可进入 Sales selector。
- Sales 必须通过 CRM selector 选择客户，但 `sales-service` 真相仍保存：
  - `customer_tenant_party_id`
  - customer snapshot
- `PublishQuote` 必须复制 customer snapshot 到 `QuoteVersion`。
- `ConvertQuoteVersionToOrder` 必须把 `QuoteVersion` 中的 customer snapshot 复制到 `SalesOrder`，不重新回源 CRM。
- `CustomerItemMapping / customer SKU` 目录 deferred；phase 1 仅使用 `SalesOrderLine.customerItemSnapshot`。

## 5. 契约真相位置

- 稳定服务职责：
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- 稳定协同蓝图：
  - [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
- 当前 Sales contract 参考：
  - [README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/README.md)
  - [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/query.md)
  - [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/management.md)
- 下一步 contract 入口：
  - future `docs/contracts/crm-service/**`

## 6. 当前 slice

- slice:
  - `crm-service` customer master foundation
- status:
  - ready-for-crm-contract
- scope:
  - `CustomerAccount` 关系外壳
  - active primary `CustomerPartyBinding`
  - `CustomerContact / CustomerAddress`
  - `CustomerStatus / CustomerCategory / tags`
  - Sales selector eligibility boundary
  - Sales customer snapshot handoff rules
- ready definition:
  - 服务职责已回写
  - `Sales / CRM / Party` 协同蓝图已冻结 minimum 口径
  - 后续 contract 线程可以在不重新讨论 customer owner 边界的前提下继续推进

## 7. 最小模型

### 7.1 CustomerAccount

- 表达客户在 CRM 中的关系外壳，而不是交易 / 法律主体真相。
- 负责承接客户状态、分类、标签、联系人、地址和 party binding 关系。
- `ACTIVE_CUSTOMER` 是当前 phase 1 唯一明确进入 Sales selector 的客户状态门槛。
- 完整 `CustomerStatus` 状态机与 `CustomerCategory` taxonomy deferred。

### 7.2 CustomerPartyBinding

- 表达 `CustomerAccount` 与 `tenantPartyId` 的受控绑定关系。
- phase 1 一条 `CustomerAccount` 只有一个 active primary binding。
- 同一 `tenantId + tenantPartyId` 最多只能对应一个 active `CustomerAccount`。
- 绑定目标主体真相仍归 `party-service`；CRM 不复制 Party 主数据。

### 7.3 CustomerContact

- 表达客户关系中的业务联系人语义、可联络状态与与账户的业务关系。
- phase 1 只冻结其 owner 边界，不冻结完整联系人角色枚举或 person-party 细化映射。

### 7.4 CustomerAddress

- 表达客户关系侧需要管理的地址与地址摘要。
- phase 1 不扩展多 bill-to / ship-to / legal entity 地址矩阵。

### 7.5 Sales Selector

- 只返回 `ACTIVE_CUSTOMER + active primary binding` 的客户账户。
- selector 结果用于选择“哪个客户关系对象可进入报价 / 订单链”，不转移 customer truth owner。
- `sales-service` 在采用 selector 结果后，必须保存 `customer_tenant_party_id` 与 customer snapshot。
- customer snapshot 的后续复制链是：
  - `Quote`
  - `QuoteVersion`
  - `SalesOrder`

## 8. 主线范围

- 本线程主线：
  - 冻结 `CustomerAccount / CustomerContact / CustomerAddress / CustomerPartyBinding` 的最小 owner 边界
  - 冻结 CRM selector 与 Sales customer snapshot 协同规则
- 本线程不做：
  - proto、数据库、运行时状态机、UI、full text search、Customer 360、财务协同
- 偏移返回条件：
  - 如需新增跨服务公共契约、事件模型、租户模型或 operator context 结构，必须先升级 architecture / ADR

## 9. 阻塞 / 依赖

- `CRM-CONTRACT` 线程需要基于本 packet 冻结 customer selector、customer master query / management contract，而不是回到 design workspace 重谈 owner 边界。
- `sales-service` 现有 contracts 已冻结 customer snapshot 复制方向，这使 CRM contract 可以只聚焦 selector 与 customer master owner，而无需重开 Quote / Order 真相边界。
- Party merge、customer dedup 与长期多主体模型仍未冻结，但不阻塞当前 minimum customer master foundation 进入 contract 阶段。

## 10. Deferred 清单

- 完整 `Opportunity` 模型
- 完整 `Activity` 模型
- `Customer 360 / BI`
- `AR / credit / payment`
- 一客多主体模型
- 多 bill-to / ship-to / legal entity 模型
- 完整 `CustomerItemMapping / customer SKU` 目录
- customer dedup / merge 全流程治理
- 完整 `CustomerStatus` 状态机与 `CustomerCategory` taxonomy

## 11. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| CRM-MINIMAL architecture write-back thread | 回写 `crm-service` 最小客户主档真相源与 feature packet | `docs/architecture/services/crm-service.md`, `docs/architecture/collaborations/sales-crm-party-item-master.md`, `docs/plans/features/crm-customer-master-foundation.md`, 必要索引页 | 当前冻结结论、Sales contracts、CRM design workspace | 服务职责、协同蓝图、feature packet | completed |
| CRM-CONTRACT thread | 冻结 `crm-service` customer master 黑盒契约 | future `docs/contracts/crm-service/**` | 本 feature packet、服务职责、协同蓝图 | selector / query / management contracts | pending |
| CRM-IMPL thread | 在已冻结边界内实现最小 customer master 闭环 | future `src/services/**/crm-service/**` | feature packet、contracts | 可运行服务、测试与验证结果 | pending |

## 12. 验收标准

- `crm-service` 职责卡已明确最小 customer master owns / does-not-own / phase 1 范围。
- `Sales / CRM / Party` 协同蓝图已冻结 selector、binding 与 customer snapshot 规则。
- feature packet 已能直接作为 `CRM-CONTRACT` 输入，而不需要继续引用 design workspace 重谈主边界。
- 已明确 `CustomerItemMapping`、多主体模型与财务对象不属于本阶段 CRM owner。

## 13. 关闭条件

- `docs/contracts/crm-service/**` 已建立并承接本 packet。
- 后续 contract 线程无需再次讨论 `CustomerAccount` 是否等于 Party truth。
- Sales selector 入口、active primary binding 约束与 customer snapshot 复制链在 contract 阶段未被重新打开。

## 14. 备注

- 本 packet 只覆盖 minimum customer master foundation，不替代未来完整 CRM 子域设计。
- 既有 `prospecting` slice 仍归 `crm-service`，但不在本 packet 中展开其完整后续模型。
