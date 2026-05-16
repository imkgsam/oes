# SRM、Procurement、Party 与 Item Master 协同蓝图

Last Updated: 2026-05-13

## 1. 目标

定义 `srm-service`、future `procurement-service`、`party-service` 与 `item-master-service` 围绕供应商主档、可供应关系、标准 Item 与采购执行如何协同，并明确哪些事实归 SRM、Party、Item Master 与 Procurement。

Item Master 概念以以下文件为唯一真相源：

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)

## 2. 参与服务

- `srm-service`
- future `procurement-service`
- `party-service`
- `item-master-service`

## 3. 协同分工

- `srm-service`
  - 负责 `SupplierProfile`、`SupplierAddressUsage`、`SupplierContactUsage`、`SupplierTaxProfile`、`SupplierStatus`、`SupplierCategory`、`SupplierTag`、`SupplierOffering`。
- `party-service`
  - 负责供应商正式主体相关事实；核心对象、地址 / 联系人正文与 owner 边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `item-master-service`
  - 负责 `ItemModel`、`Item`、capability、`SupplierItemMapping` 与基础分类真相。
- future `procurement-service`
  - 负责采购申请、采购订单、收货预期、采购商业条款与采购执行语义。

## 4. 稳定协同规则

### 4.1 SRM 与 Party 边界

- `SupplierProfile` 的正式主体引用统一使用 `tenantPartyId`。
- `ACTIVE SupplierProfile` 必须绑定 `tenantPartyId`。
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`。
- 创建供应商时必须先通过 `party-service` resolve / create 主体事实与租户主体引用；强标识命中与复用规则以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `Party Selector` 只用于主体去重 / 复用；`Supplier Selector` 只返回可被采购采用的 `SupplierProfile`。
- `party-service` 继续拥有主体注册信息、证照、canonical 名称与主体关系真相。
- SRM 不复制 Party 注册信息为自己的长期真相，只保存受控引用与供应商业务语义。

### 4.2 SRM 与 Item Master 边界

- `SupplierOffering` 表达 `supplierId + itemId` 的“可供应关系事实”。
- `ACTIVE SupplierOffering` 只允许挂在 `ACTIVE SupplierProfile` 下。
- `ACTIVE SupplierOffering` 只允许指向 active + purchasable `Item`。
- `item-master-service` 继续拥有 `SupplierItemMapping`，只表达：
  - `supplierId + supplierItemCode / supplierItemName -> itemId`
- `SupplierItemMapping` 指向执行层 `Item`，不指向 `ItemModel`。
- `SupplierItemMapping` 不是 `SupplierOffering`，也不是采购商业档。
- `SupplierOffering` 不承载价格、MOQ、payment term snapshot、lead time、供应表现。

### 4.3 SRM 与 Procurement 边界

- future `procurement-service` 只受控引用 SRM 的正式供应商主档与 `SupplierOffering`。
- Procurement 标准采购最终引用 active + purchasable `Item`。
- Procurement 可以从 `ItemModel + AttributeOption` 解析到 purchasable `Item`，也可以直接选择 `Item`。
- 采购价格、MOQ、lead time、RFQ、采购单、收货与履约继续归 future `procurement-service`；`PaymentTerm` 主数据归 `finance-service`，采购交易只保存 payment term snapshot。
- 本蓝图不冻结 procurement 的 PO / RFQ 对象名，只冻结 SRM 应提供的稳定主档边界。
- 如果 future procurement 需要“某供应商是否可供应某 Item”的正式事实，应优先引用 `SupplierOffering`，而不是反向扩写 `SupplierItemMapping`。

### 4.4 Supplier address / contact / tax / terms snapshot 口径

- `party-service` 的主体地址 / 联系人正文边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `srm-service` owns `SupplierAddressUsage / SupplierContactUsage`，表达该地址或联系人在供应商上下文中的用途、默认值、状态与备注。
- `srm-service` owns `SupplierTaxProfile`，只表达供应商交易税务默认配置；supplier invoice、进项税、认证、抵扣、付款与 AP 归 `finance-service`。
- `SupplierProfile.defaultCurrency / defaultPaymentTermId` 只是采购默认值。
- Procurement 创建采购订单时必须保存 address / contact / tax / payment term / currency snapshot；历史交易不能依赖回查当前 SRM / Party / Finance 主数据解释。

## 5. 同步 / 异步边界

- 第一阶段优先同步校验：
  - `srm-service -> party-service` 校验 `tenantPartyId`。
  - `srm-service -> item-master-service` 校验 `itemId` 与 purchasable 能力。
  - future `procurement-service -> item-master-service` 查询或解析采购 Item。
  - future `procurement-service -> srm-service` 查询供应商主档与 offering 状态。
- 第一阶段不冻结必须事件集：
  - 如后续需要主档变更事件、offering 变更事件或采购侧缓存同步事件，应在 `SRM-CONTRACT` / `PROCUREMENT-CONTRACT` 阶段单独冻结。

## 6. 真相归属

- `SupplierProfile`、联系人 usage、地址 usage、`SupplierTaxProfile`、分类、标签、状态、`SupplierOffering`：`srm-service`
- 供应商正式主体、租户主体引用、主体标识、主体地址 / 联系人正文与主体关系：以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- `ItemModel`、`Item`、capability、`SupplierItemMapping`：`item-master-service`
- RFQ、采购价格、MOQ、lead time、采购单、收货、采购商业条款 snapshot：future `procurement-service`
- `PaymentTerm`、supplier invoice、AP、payment、allocation、payment control：`finance-service`

## 7. 明确禁止

- 不把 `SupplierItemMapping` 扩成采购商业档。
- 不把 `SupplierOffering` 扩成价格表。
- 不复制 Party 注册信息为 SRM 真相。
- 不让 future procurement 直接把采购商业条款塞回 SRM 主档。
- 不在本蓝图中冻结 procurement 的 PO / RFQ 对象名。
- 不让 SRM 或 Procurement 自行定义 Item 主数据概念。
- 不把 CRM/SRM 第一阶段实现阻塞在 payment account / bank account 设计上。

## 8. Deferred

- `SupplierOffering` 的后续事件目录。
- SRM 与 Procurement 的正式 gRPC contract。
- Supplier qualification / onboarding workflow。
- Supplier performance / score / quality remediation。
- 采购价格、MOQ、lead time 与采购商业条款 snapshot 的 owner model。

## 9. 关联文档

- [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
- [docs/contracts/item-master-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/README.md)
