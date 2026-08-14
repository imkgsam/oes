# Procurement、SRM、Item Master、WMS 与 Finance 协同蓝图

> 涉及 permission-service 的权限、scope、policy 或授权判定边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只描述采购、供应商、物料、仓储与财务之间的业务协同。

## 1. 目标

定义 OES 中 `procurement-service` 如何围绕 `PR + PO` 最小闭环，与 `srm-service`、`item-master-service`、`wms-service` 与 `finance-service` 协同，并明确哪些事实归 Procurement、哪些事实继续归 SRM、Item Master、WMS 与 Finance。

## 2. 参与服务

- `procurement-service`
- `srm-service`
- `item-master-service`
- `wms-service`
- `finance-service`
- `api-gateway`
- future `workflow-service`，当采购审批或差异处理需要升级成人工流程时

## 3. 协同分工

- `procurement-service`
  - 负责 `PurchaseRequest`、`PurchaseRequestLine`、`PurchaseRequestApprovalSnapshot`
  - 负责 `PurchaseOrder`、`PurchaseOrderLine`、`PurchaseOrderLineAllocation`
  - 负责 `PurchaseOrderChange`
  - 负责 `ReceivingExpectation`、`ReceivingDiscrepancy`
  - 负责采购交易事实与历史采购价格事实
- `srm-service`
  - 负责 `SupplierProfile`；future `SupplierOffering` / supplier purchasing info 后续可作为采购默认信息来源
- `item-master-service`
  - 负责 `ItemModel`、`Item`、执行层 capability 与 `SupplierItemMapping`
- `wms-service`
  - 负责实际收货、库位、库存、破损 / 受限库存真相
- `finance-service`
  - 负责 `AP`、supplier invoice、payment 与 allocation 真相
- `api-gateway`
  - 承担采购工作台与跨域页面的同步聚合入口
- future `workflow-service`
  - 承接超额审批、例外采购或复杂差异处理的长流程；不是 phase 1 必选依赖

## 4. 稳定协同规则

### 4.1 Procurement 统一采购入口

- `procurement-service` 是统一采购需求入口，不再按“部门采购 / 销售专采 / 生产物料 / 包装 / 维修 / 样品”拆成多套 owner truth。
- phase 1 的采购类支出正常路径必须先进入 `PR / PO`；`Non-PO purchase` 不作为正常主线。
- `PurchaseRequestLine` 必须支持：
  - 标准 `Item` 采购需求
  - 非标准 / 文本型采购需求

### 4.2 Procurement 与 SRM 边界

- `srm-service` 继续 owns `SupplierProfile`；future `SupplierOffering` / supplier purchasing info 由 SRM 承接，但不是 phase 1 采购准入前置。
- 标准 `Item` 转 `PO` 时，phase 1 只强制校验 `SupplierProfile.status = ACTIVE` 与 `Item.active + purchasable`，不强制要求 `ACTIVE SupplierOffering`。
- 日常非标准采购可不要求标准 `Item` 或 `SupplierOffering`，但必须标记为非标准 / 文本型采购需求。
- Procurement 不把 RFQ、PO、实际成交价、历史采购价格、收货或履约事实塞回 `SRM`；`PaymentTerm` 主数据归 `finance-service`。
- future `SupplierOffering` 如启用，定位更接近 Odoo supplierinfo，可作为默认价格、MOQ、lead time 等采购参考信息来源，而不是 phase 1 采购准入前置。

### 4.3 Procurement 与 Item Master 边界

- `item-master-service` 继续 owns `ItemModel`、`Item`、执行层 capability 与 `SupplierItemMapping`。
- 标准采购需求最终必须引用 active + purchasable `Item`，并通过受控查询完成存在性 / 状态 / capability 校验。
- Procurement 可以直接选择 `Item`，也可以从 `ItemModel + AttributeOption` 解析到 purchasable `Item`。
- `SupplierItemMapping` 只表达供应商如何标识某个 `Item`，不等于 `PO` 行、不等于供应关系、不等于采购商业档。
- 非标准 / 文本型采购需求可以不要求先建标准 `Item`，但不能因此把文本采购反向沉淀成 Item 主数据真相。
- Procurement 对标准 Item 的存在性、active 与 purchasable 校验只调用 `item-master-service.ResolvePurchasableItem`；该 INTERNAL RPC 同时允许准确 `procurement-service` 与 `srm-service` workload，不允许通过 HUMAN `GetItem` 或通用 capability 参数替代。

### 4.4 Procurement 内部交易边界

- `PurchaseRequest` 表达采购需求成立与归因。
- `PurchaseRequestApprovalSnapshot` 只表达采购侧冻结的审批结论快照与审计引用，不代表 phase 1 已引入完整 workflow engine。
- `PurchaseOrder` 表达正式采购承诺。
- 当多个 `PR` 合并生成同一个 `PO` 时：
  - 不创建新的 `PR`
  - 不删除旧的 `PR / PR line`
  - 源 `PR / PR line` 保留，并进入 `PARTIALLY_CONVERTED / CONVERTED`
- `PurchaseOrderLineAllocation` 必须支持把同一行数量拆分为：
  - source = `PurchaseRequestLine`
  - source = `SalesOrderLine`
  - source = `FulfillmentDemand`
  - general stock
- `PR` 发起人应能通过 Procurement query 看到：
  - 已并入哪个 `PO`
  - 当前预计到货
  - 当前到货状态摘要
- `PurchaseOrder` header 可保留 `payment_terms_snapshot` 与 supplier commercial terms snapshot，但它们只属于本次采购交易快照。
- `PurchaseOrderChange` 在 phase 1 只要求记录已应用变更事实；后续再升级为变更申请 / 审批 / 供应商确认闭环。

### 4.5 Procurement 与 WMS 边界

- `ReceivingExpectation` 是采购侧预期，不是 `WMS receipt` truth。
- `wms-service` 才是实际收货、上架、库存、破损 / 受限库存的唯一真相 owner。
- 当同一 `PO line` 的 allocation 指向不同目标仓 / 收货地址 / allocation grouping 时，Procurement 必须拆分多个 `ReceivingExpectation`。
- Procurement 可以参考 Odoo 风格“先有预期收货，再根据差异处理”，但 OES 必须显式拥有：
  - `ReceivingDiscrepancy`
  - resolution options
- `ReceivingDiscrepancy` 表达的是采购侧“预期与实收不一致”的差异摘要，不替代 `WMS` 的仓储动作真相。
- 差异处理不能被简化成“自动补单”单一路径；至少必须覆盖：
  - `SHORT_RECEIVED`
  - `OVER_RECEIVED`
  - `DAMAGED`
  - `WRONG_ITEM`
  - `QUALITY_HOLD`
- `ReceivingDiscrepancy resolution` 只记录采购侧处置选择与引用，不直接修改库存真相。
- 若要关闭剩余未收数量，必须通过 `PurchaseOrderChange` 留痕，而不是由 discrepancy resolution 隐式修改 open quantity。
- phase 1 的 return / claim 只保留 resolution 类型与引用，不展开完整 `SupplierReturn / claim workflow`。

### 4.6 Procurement 与 Finance 边界

- `finance-service` 继续 owns `AP / supplier invoice / payment / allocation`。
- Procurement 不维护付款真相，也不承担 supplier invoice owner。
- Finance 已支付定金 / 尾款后，Procurement 只消费 payment summary 与 attachment refs。
- 付款凭证由 Finance 通过 `asset-service attachmentRef` 管理，Procurement 只展示摘要与引用。
- phase 1 只要求 Procurement 发布稳定的采购订单、收货预期、收货差异与交易事实口径，为 future `AP` matching / invoice checking 预留输入。
- 历史采购价格第一阶段归 Procurement 交易事实；future `Costing / BI` 只消费分析，不拥有原始采购交易事实。

## 5. 同步 / 异步边界

- 同步：
  - `procurement-service -> srm-service` 查询 `SupplierProfile` 当前状态；future 可查询 `SupplierOffering` / supplier purchasing info 作为默认采购信息
  - `procurement-service -> item-master-service.ResolvePurchasableItem` 校验标准 `Item` 的 `active + purchasable`；其他 Item 查询/解析仍须使用其各自已冻结契约，不扩大该 INTERNAL RPC
  - `api-gateway -> procurement-service` 查询 `PR / PO / discrepancy` 当前摘要
  - `procurement-service -> permission-service` 的权限、scope 与操作校验
- 异步：
  - `procurement-service -> downstream consumers` 的 `PR / PO / PO change / expectation / discrepancy` 已发生事实扩散
  - `wms-service -> procurement-service` 的实际收货结果回流，用于更新采购侧 expectation / discrepancy 视图
  - `procurement-service -> finance-service` 的采购交易与收货事实扩散，供 future `AP` / invoice matching 使用
- 阶段约束：
  - phase 1 冻结协同方向与 owner 边界，不冻结完整事件目录、payload 字段或 proto 细节；这些内容进入 future `PROCUREMENT-CONTRACT`

## 6. 真相归属

- `PurchaseRequest`、`PurchaseRequestLine`、`PurchaseRequestApprovalSnapshot`：`procurement-service`
- `PurchaseOrder`、`PurchaseOrderLine`、`PurchaseOrderLineAllocation`：`procurement-service`
- `PurchaseOrderChange`：`procurement-service`
- `ReceivingExpectation`、`ReceivingDiscrepancy`：`procurement-service`
- `SupplierProfile`、future `SupplierOffering` / supplier purchasing info：`srm-service`
- `ItemModel`、`Item`、执行层 capability、`SupplierItemMapping`：`item-master-service`
- 实际收货、区位、库存、破损 / 受限库存：`wms-service`
- `AP`、supplier invoice、payment、allocation：`finance-service`

## 7. 明确禁止

- 不把 RFQ、PO、实际成交价、收货与履约事实塞进 `SRM`
- 不把库存真相塞进 Procurement
- 不把付款真相塞进 Procurement
- 不把 first-stage procurement 强依赖 `SupplierOffering`
- 不为了 `Non-PO purchase` 设计复杂正常路径
- 不引入完整 `workflow-service` 作为 phase 1 前置
- 不引入 `costing-service`
- 不在本蓝图中实现 `RFQ / SupplierQuote / safety stock / auto replenishment`

## 8. Deferred

- `RFQ / SupplierQuote`
- 安全库存
- 自动补货
- 采购变更申请 / 审批 / 供应商确认完整闭环
- `AP / supplier invoice / payment / allocation` 的正式采购财务协同 contract
- 完整付款凭证管理
- 完整 `SupplierReturn / claim workflow`
- 完整事件目录、payload 与 proto 契约
- 完整 workflow / process manager 编排

## 9. 关联文档

- [procurement-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/procurement-service.md)
- [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
- [finance-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/finance-service.md)
- [srm-procurement-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/srm-procurement-party-item-master.md)
