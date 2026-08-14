# SRM、Procurement、Party 与 Item Master 协同蓝图

Last Updated: 2026-08-14

## 1. 目标

定义 `srm-service`、`procurement-service`、`party-service` 与 `item-master-service` 围绕供应商主档、供应商采购信息、标准 Item 与采购执行如何协同，并明确哪些事实归 SRM、Party、Item Master 与 Procurement。

Item Master 概念以以下文件为唯一真相源：

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)

## 2. 参与服务

- `srm-service`
- `procurement-service`
- `party-service`
- `item-master-service`

## 3. 协同分工

- `srm-service`
  - 负责 `SupplierProfile`、`SupplierAddressUsage`、`SupplierContactUsage`、`SupplierTaxProfile`、`SupplierStatus`、`SupplierCategory`、`SupplierTag` 与当前最小 `SupplierOffering` 关系。
- `party-service`
  - 负责当前租户内 `TenantParty` 主体事实；核心对象、地址 / 联系人正文与 owner 边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `item-master-service`
  - 负责 `ItemModel`、`Item`、capability、`SupplierItemMapping` 与基础分类真相。
- `procurement-service`
  - 负责采购申请、采购订单、收货预期、采购商业条款与采购执行语义。

## 4. 稳定协同规则

### 4.1 SRM 与 Party 边界

- `SupplierProfile` 的正式主体引用统一使用 `tenantPartyId`。
- `ACTIVE SupplierProfile` 必须绑定 `tenantPartyId`。
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`。
- 创建供应商时必须先通过 `party-service` 在当前租户内 register / select `TenantParty`；identifier 复用规则以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `TenantParty Selector` 只用于当前租户内主体选择；`Supplier Selector` 只返回可被采购采用的 `SupplierProfile`。
- `party-service` 继续拥有当前租户内主体名称、证照标识与主体基础事实。
- SRM 不复制 Party 注册信息为自己的长期真相，只保存受控引用与供应商业务语义。

### 4.2 SRM 与 Item Master 边界

- 当前 SRM 已维护 exact `supplierId + itemId` 的最小 active/inactive `SupplierOffering` 关系；它不扩展到 `ItemModel` 范围。
- 标准 Item 进入 PO 前，Procurement 必须确认 active SupplierProfile 与 exact active SupplierOffering；非标准文本采购不适用 offering 规则。
- `SupplierOffering` 不承载默认价格、币种、MOQ、lead time、供应商料号引用或交易条款。
- `item-master-service` 继续拥有 `SupplierItemMapping`，只表达：
  - `supplierId + supplierItemCode / supplierItemName -> itemId`
- `SupplierItemMapping` 指向执行层 `Item`，不指向 `ItemModel`。
- `SupplierItemMapping` 不是 `SupplierOffering`，不表达价格、MOQ、lead time 或采购准入；它只回答供应商如何标识我方 `Item`。
- 正式 RFQ、PO、成交价、历史采购价格、收货与履约事实继续归 Procurement。

### 4.3 SRM 与 Procurement 边界

- `procurement-service` 只受控引用 SRM 的正式供应商主档与 exact active offering；不能把它们当成 PO 或商业条款事实。
- Procurement 标准采购最终引用 active + purchasable `Item`。
- Procurement 可以从 `ItemModel + AttributeOption` 解析到 purchasable `Item`，也可以直接选择 `Item`。
- 标准 Item 采购保存时强制校验 `SupplierProfile.status = ACTIVE`、exact active `SupplierOffering` 与 `Item.active + purchasable`。
- RFQ、采购单、实际成交价、历史采购价格、收货与履约继续归 `procurement-service`；`PaymentTerm` 主数据归 `finance-service`，采购交易只保存 payment term snapshot。
- 本蓝图不冻结 procurement 的 PO / RFQ 对象名，只冻结 SRM 应提供的稳定主档边界。
- 更复杂的 approved supplier / 供应准入能力仍需独立设计，不能把当前 active offering 或 `SupplierItemMapping` 擅自升级为通用准入模型。

### 4.4 Supplier address / contact / tax / terms snapshot 口径

- `party-service` 的主体地址 / 联系人正文边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `srm-service` owns `SupplierAddressUsage / SupplierContactUsage`，表达该地址或联系人在供应商上下文中的用途、默认值、状态与备注。
- `srm-service` owns `SupplierTaxProfile`，只表达供应商交易税务默认配置；supplier invoice、进项税、认证、抵扣、付款与 AP 归 `finance-service`。
- `SupplierProfile.defaultCurrency / defaultPaymentTermId` 只是采购默认值。
- Procurement 创建采购订单时必须保存 address / contact / tax / payment term / currency snapshot；历史交易不能依赖回查当前 SRM / Party / Finance 主数据解释。

### 4.5 RFQ / PO 表单第一阶段采用口径

- RFQ / PO 表单中供应商与 Item 可以任意先后填写。
- 标准采购行最终必须引用公司内部 active + purchasable `Item`；`ItemModel` 只是配置或选择入口，不能作为 PO line 最终执行对象。
- 供应商 item / supplier catalog 只作为搜索、映射、显示和交易 snapshot；最终采购执行对象仍是内部 `Item`。
- 先选供应商时，Item selector 可以显示 active + purchasable Items；`SupplierItemMapping` 或 active `SupplierOffering` 只用于受控匹配与推荐。
- 先选 Item 时，Supplier selector 显示 ACTIVE suppliers；active `SupplierOffering` 用于 exact 标准 Item 可供应关系过滤。
- 标准 Item 保存时必须校验 exact active `SupplierOffering`；非标准文本采购不适用该规则。

## 5. 同步 / 异步边界

- 第一阶段优先同步校验：
  - `srm-service -> party-service` 校验当前租户内 `tenantPartyId`。
  - `srm-service -> item-master-service` 校验 `itemId` 与 purchasable 能力。
  - `procurement-service -> item-master-service` 查询或解析采购 Item。
  - `procurement-service -> srm-service.ResolveActiveSupplier / ResolveActiveSupplierOffering` 查询 active Supplier 与 exact active offering；这两个 `INTERNAL / HUMAN_OBO` RPC 只允许 Procurement actor，不能复用 Gateway BUSINESS 目录查询。
- 第一阶段不冻结必须事件集：
  - 如后续需要主档变更事件、offering 变更事件或采购侧缓存同步事件，应在 `SRM-CONTRACT` / `PROCUREMENT-CONTRACT` 阶段单独冻结。

## 6. 真相归属

- `SupplierProfile`、联系人 usage、地址 usage、`SupplierTaxProfile`、分类、标签、状态、最小 `SupplierOffering` 关系：`srm-service`
- 供应商正式主体、租户主体引用、主体标识、主体地址 / 联系人正文与主体关系：以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- `ItemModel`、`Item`、capability、`SupplierItemMapping`：`item-master-service`
- RFQ、采购单、实际成交价、历史采购价格、收货、采购商业条款 snapshot：`procurement-service`
- `PaymentTerm`、supplier invoice、AP、payment、allocation、payment control：`finance-service`

## 7. 明确禁止

- 不把 `SupplierItemMapping` 扩成采购商业档。
- 不把 first-stage SRM 主档扩成 RFQ、PO 或采购履约系统。
- 不复制 Party 注册信息为 SRM 真相。
- 不让 Procurement 直接把采购商业条款塞回 SRM 主档。
- 不在本蓝图中冻结 procurement 的 PO / RFQ 对象名。
- 不让 SRM 或 Procurement 自行定义 Item 主数据概念。
- 不把 CRM/SRM 第一阶段实现阻塞在 payment account / bank account 设计上。

## 8. Deferred

- `SupplierOffering` 的价格/MOQ/lead time 等商业字段、事件目录与更复杂管理能力。
- approved supplier / 供应准入是否由 `SupplierOffering` 承担，后续单独冻结。
- Procurement 后台无 HUMAN subject 的服务调用模式。
- Supplier qualification / onboarding workflow。
- Supplier performance / score / quality remediation。
- RFQ、实际成交价、历史采购价格与采购商业条款 snapshot 的 owner model。

## 9. 关联文档

- [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
- [docs/contracts/item-master-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/README.md)
