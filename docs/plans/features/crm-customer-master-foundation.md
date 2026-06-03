# CRM Customer Master Foundation

## 1. Feature Status

Current status: `implemented / hardening pending`

本 feature packet 记录 `crm-service` customer master phase 1 的执行状态。稳定服务设计唯一真相源为：

- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)

本文不重新定义 CRM 核心对象、owner 边界或长期命名。若本文与服务真相源冲突，以服务真相源为准。

## 2. Goal

建立 CRM phase 1 最小客户主档闭环：

- `CustomerAccount`
- `CustomerPartyBinding`
- phase 1 `CustomerContact`，按长期 `CustomerContactUsage` 语义理解
- phase 1 `CustomerAddress`，按长期 `CustomerAddressUsage` 语义理解
- `CustomerStatus`
- `CustomerCategory`
- customer `tags`
- Sales selector eligibility

核心业务原则：

- `CustomerAccount` 是客户关系外壳，不是 Party 主体真相。
- active primary `tenantPartyId` 是 Sales / Pricing / Agreement 的稳定主体引用。
- Sales 必须通过 CRM customer selector 采用客户，不应长期绕过 CRM 直接把 Party selector 当 customer selector。

## 3. Current Delivered Scope

### 3.1 Architecture / Design

已完成：

- `crm-service` 唯一真相源已收口到 [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)。
- `Sales / CRM / Party / Item Master` 协同规则已记录在 [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)。
- CRM 设计工作台已降级为历史记录和开放问题入口：[crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)。

### 3.2 Contracts

已完成 phase 1 customer master 黑盒契约：

- [customer-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/crm-service/customer-management.md)
- [customer-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/crm-service/customer-query.md)

已实现 proto surface：

- `src/common/src/contracts/crm_service/crm.proto`

### 3.3 crm-service Runtime

已实现：

- `CustomerManagementService`
  - `CreateCustomerAccount`
  - `UpdateCustomerAccountBasics`
  - `BindCustomerAccountToTenantParty`
  - `UpsertCustomerContact`
  - `UpsertCustomerAddress`
  - `ChangeCustomerStatus`
- `CustomerQueryService`
  - `SearchSelectableCustomers`
  - `GetCustomerAccount`
  - `SearchCustomerAccounts`
  - `ListCustomerContacts`
  - `ListCustomerAddresses`
- Prisma 持久化：
  - `CustomerAccount`
  - `CustomerPartyBinding`
  - `CustomerContact`
  - `CustomerAddress`
  - `CrmAuditEnvelope`
- `party-service` lookup adapter for `tenantPartyId` binding validation。
- command audit envelope。

### 3.4 Gateway / Tenant Web

已实现：

- api-gateway customer-management BFF。
- tenant-web customer-management API client。
- tenant-web customer list / create / detail / binding / contact / address / status pages。
- Gateway 入口级 CRM permission code 校验。

## 4. Stable Phase 1 Rules

phase 1 已冻结规则：

- 一条 `CustomerAccount` 最多一个 active primary `tenantPartyId`。
- 同一 `tenantId + tenantPartyId` 最多对应一个 active / non-archived `CustomerAccount`。
- `BindCustomerAccountToTenantParty` 成功前必须校验 `tenantPartyId` 在当前租户存在且可绑定。
- `SearchSelectableCustomers` 只返回 `ACTIVE_CUSTOMER + active primary binding`。
- `BLOCKED / ARCHIVED` customer 不得进入 customer selector。
- 未绑定 active primary `tenantPartyId` 的 customer 不得进入 customer selector。
- Sales 采用 customer selector 后，必须保存 `customer_tenant_party_id` 与 customer snapshot。
- `PublishQuote` 必须复制 customer snapshot 到 `QuoteVersion`。
- `ConvertQuoteVersionToOrder` 必须复制 `QuoteVersion` 中的 customer snapshot 到 `SalesOrder`，不重新回源 CRM / Party。

## 5. Current Hardening Gaps

以下 gap 是 customer master phase 1 继续推进前的优先收口项：

1. `ChangeCustomerStatus` enum 校验需与 contract 对齐，非法 / unspecified status 不得默认为 `ACTIVE_CUSTOMER`。
2. customer 创建仍缺少 Party resolve / create / select + CustomerAccount 创建 + binding 的完整业务编排。
3. tenant-web binding 体验仍偏向手填 `tenantPartyId`，需要 Party selector。
4. phase 1 `CustomerContact / CustomerAddress` 与长期 `CustomerContactUsage / CustomerAddressUsage` 的 contract 命名和语义需在后续演进中收敛。
5. primary contact / primary address 唯一性、inactive 关系与自动降级规则尚未冻结。
6. `CustomerTaxProfile / defaultCurrency / defaultPaymentTermId` 尚未进入 contract / proto / schema / UI。
7. 服务内资源级 owner / team / query scope 授权尚未形成闭环。
8. Sales selector 采用链路仍需做 Quote / QuoteVersion / SalesOrder snapshot 联调验收。

## 6. Deferred

以下能力不属于当前 customer master phase 1 已交付范围：

- 完整 `Intake`
- 完整 `Prospecting`
- formal `Lead`
- formal `Opportunity`
- formal `Activity`
- `Customer 360 / BI`
- `AR / credit / payment`
- 一客多主体模型
- 多 legal entity、bill-to / ship-to 地址矩阵
- 完整 `CustomerItemMapping / customer SKU`
- customer dedup / merge 全流程治理
- 完整 `CustomerStatus` 状态机
- 完整 `CustomerCategory` taxonomy
- CRM integration events

## 7. Thread Ownership

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| CRM-MINIMAL architecture write-back thread | 回写 `crm-service` 最小客户主档真相源与 feature packet | `docs/architecture/services/crm-service.md`, `docs/architecture/collaborations/sales-crm-party-item-master.md`, `docs/plans/features/crm-customer-master-foundation.md` | CRM design workspace、Sales contracts | 服务职责、协同蓝图、feature packet | completed |
| CRM-TRUTH-SOURCE consolidation thread | 收口完整 CRM 边界到唯一服务真相源，并降级 design workspace | `docs/architecture/services/crm-service.md`, `docs/plans/designs/crm-service-design.md`, `docs/plans/features/crm-customer-master-foundation.md` | 既有 design / feature / contract / implementation 状态 | 唯一真相源与状态校正 | completed |
| CRM-CONTRACT thread | 冻结 customer master phase 1 query / management 黑盒契约 | `docs/contracts/crm-service/**`, `src/common/src/contracts/crm_service/**` | feature packet、服务职责、协同蓝图 | query / management contracts and proto surface | completed for phase 1 |
| CRM-IMPL thread | 实现 customer master phase 1 runtime、Gateway、tenant-web 基础闭环 | `src/services/**/crm-service/**`, `src/common/**`, `app/web/apps/tenant-web/**` | contracts、feature packet、服务职责 | 可运行服务、BFF、页面与测试 | implemented / hardening pending |
| CRM-HARDENING thread | 修正 contract-code 偏差、Party selector、primary 规则、Sales selector 联调 | CRM service / Gateway / tenant-web / Sales selector 相关路径 | 当前实现与 hardening gaps | 可验收 customer master foundation | pending |

## 8. Acceptance Criteria For Hardening Completion

customer master phase 1 hardening 完成条件：

- `ChangeCustomerStatus` 非法状态严格返回 `INVALID_ARGUMENT`。
- tenant-web 通过 Party selector 完成 customer primary binding，不要求用户手填 `tenantPartyId`。
- primary contact / primary address 规则已冻结并实现。
- `SearchSelectableCustomers` 已被 Sales 创建报价链路采用。
- blocked / archived / unbound customer 无法进入新报价 selector。
- Quote / QuoteVersion / SalesOrder customer snapshot 复制链通过测试或 smoke 验收。
- 当前 feature packet 与服务真相源、contract、实现状态一致。

## 9. Suggested Next Implementation Order

1. `ChangeCustomerStatus` contract-code hardening。
2. Party selector customer binding。
3. primary contact / address 规则冻结与实现。
4. Sales selector integration smoke。
5. `CustomerTaxProfile / defaultCurrency / defaultPaymentTermId` contract。
6. Customer tax / default terms runtime implementation。
7. resource owner / team / query scope 授权设计与 contract。

## 10. Notes

- 本 packet 只覆盖 customer master foundation，不替代完整 CRM 子域设计。
- 完整 CRM 长期边界见 [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)。
- 既有 `prospecting` slice 仍归 `crm-service`，但 formal `LeadDraft -> Lead` 契约尚未冻结。
