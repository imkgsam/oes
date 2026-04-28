# crm-service Contracts

## 1. 目的

本目录用于冻结 `crm-service` phase 1 最小客户主档的黑盒契约文档。

这些文档面向：

- `api-gateway` / future BFF
- `sales-service`
- future pricing / agreement contract threads
- 后续承担 `crm-service` proto / runtime 实现的线程

这些文档不是 proto 副本，不展开数据库结构，不承诺运行时实现细节。

本目录只回写已经冻结的 `CRM-CONTRACT` 结论。

## 2. Phase 1 Contract Surface

phase 1 只冻结两组内部 gRPC 服务面：

- [customer-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/crm-service/customer-query.md)
  - `CustomerQueryService`
  - `SearchSelectableCustomers`
  - `GetCustomerAccount`
  - `SearchCustomerAccounts`
  - `ListCustomerContacts`
  - `ListCustomerAddresses`
- [customer-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/crm-service/customer-management.md)
  - `CustomerManagementService`
  - `CreateCustomerAccount`
  - `UpdateCustomerAccountBasics`
  - `BindCustomerAccountToTenantParty`
  - `UpsertCustomerContact`
  - `UpsertCustomerAddress`
  - `ChangeCustomerStatus`

phase 1 不在本目录中冻结：

- proto message 全量定义
- integration event catalog
- 外部 HTTP / BFF surface
- UI / selector 组件 contract
- `Opportunity / Activity / Customer 360`
- `AR / credit / payment`
- 完整 `CustomerItemMapping`

## 3. Owner Boundary

phase 1 contract 明确围绕以下 owner 边界展开：

- `CustomerAccount`
- `CustomerContact`
- `CustomerAddress`
- `CustomerStatus`
- `CustomerCategory`
- customer `tags`
- `CustomerPartyBinding`
- Sales selector eligibility fact

说明：

- `CustomerAccount` 是客户关系外壳，不是 `party-service` 的主体真相
- `CustomerContact / CustomerAddress` 是 CRM 业务关系信息，不是 Party 注册信息真相
- `CustomerPartyBinding` 由 `crm-service` 拥有，但其绑定目标 `tenantPartyId` 真相仍归 `party-service`
- `sales-service`、future pricing、future agreement 的稳定主体引用仍是 `tenantPartyId`
- `SearchSelectableCustomers` 只返回 `ACTIVE_CUSTOMER + active primary binding`
- `BLOCKED` 与 `ARCHIVED` 客户不得进入 selectable customer 结果
- phase 1 一条 `CustomerAccount` 只有一个 active primary `tenantPartyId`
- 同一 `tenantId + tenantPartyId` 最多对应一个 active `CustomerAccount`
- Sales phase 1 必须通过 CRM selector 选择客户，不得长期绕过 CRM selector 直接把 Party 当成 customer entry

## 4. Does Not Own

`crm-service` phase 1 contract 明确不承载以下真相：

- `party-service` 的 `Party / TenantParty`
- `sales-service` 的 `Quote / QuoteVersion / SalesOrder`
- `Opportunity / Activity / Customer 360`
- `AR / credit / payment`
- 一客多主体、多 legal entity、多 bill-to / ship-to 复杂模型
- 完整 `CustomerItemMapping / customer SKU` 目录

进一步约束：

- 不把 Party 主体字段复制成 CRM customer truth
- 不让 CRM contract 反向接管 Sales transaction snapshot
- 不在 phase 1 冻结多主体绑定历史治理、merge 或 dedup 全流程

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
- `BindCustomerAccountToTenantParty` 必须校验 `tenantPartyId` 存在且当前可绑定
- management command 必须按 command 语义使用，不得以 query 方式绕过写边界
- phase 1 不冻结 integration events，只允许列出 deferred 候选能力

## 6. Deferred

以下能力明确 deferred，不得写成 phase 1 已承诺 contract：

- 完整 `Opportunity`
- 完整 `Activity`
- `Customer 360 / BI`
- `AR / credit / payment`
- 一客多主体模型
- 多 legal entity、bill-to / ship-to 地址矩阵
- `CustomerItemMapping / customer SKU` 完整目录
- customer dedup / merge 全流程治理
- 完整 `CustomerStatus` 状态机
- 完整 `CustomerCategory` taxonomy
- integration events

## 7. 关联真相源

本目录以上游稳定文档为准：

- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
- [crm-customer-master-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/crm-customer-master-foundation.md)
