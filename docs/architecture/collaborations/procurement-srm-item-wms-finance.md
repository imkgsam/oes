# Procurement、SRM、Item Master、WMS 与 Finance 协同蓝图

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
  - 负责 `SupplierProfile` 与 `SupplierOffering`
- `item-master-service`
  - 负责 `Item`、`ItemCapability` 与 `SupplierItemMapping`
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

- `srm-service` 继续 owns `SupplierProfile / SupplierOffering`。
- 标准 `Item` 转 `PO` 时，`procurement-service` 必须校验目标供应商存在有效 `ACTIVE SupplierOffering`。
- 日常非标准采购可不强制依赖 `ACTIVE SupplierOffering`，但这不改变 `SupplierOffering` 的 owner 归属。
- Procurement 不把采购价格、`MOQ`、lead time、账期等商业条款塞回 `SRM`。

### 4.3 Procurement 与 Item Master 边界

- `item-master-service` 继续 owns `Item` 与 `SupplierItemMapping`。
- 标准采购需求必须引用 `purchasable Item`，并通过受控查询完成存在性 / 状态校验。
- `SupplierItemMapping` 只表达供应商如何标识某个 `Item`，不等于 `PO` 行、不等于供应关系、不等于采购商业档。
- 非标准 / 文本型采购需求可以不要求先建标准 `Item`，但不能因此把文本采购反向沉淀成 Item 主数据真相。

### 4.4 Procurement 内部交易边界

- `PurchaseRequest` 表达采购需求成立与归因。
- `PurchaseRequestApprovalSnapshot` 只表达采购侧冻结的审批结论快照与审计引用，不代表 phase 1 已引入完整 workflow engine。
- `PurchaseOrder` 表达正式采购承诺。
- `PurchaseOrderLineAllocation` 必须支持把同一行数量拆分为：
  - dedicated to `SalesOrderLine` / `FulfillmentDemand`
  - general stock
- `PurchaseOrderChange` 在 phase 1 只要求记录已应用变更事实；后续再升级为变更申请 / 审批 / 供应商确认闭环。

### 4.5 Procurement 与 WMS 边界

- `ReceivingExpectation` 是采购侧预期，不是 `WMS receipt` truth。
- `wms-service` 才是实际收货、上架、库存、破损 / 受限库存的唯一真相 owner。
- Procurement 可以参考 Odoo 风格“先有预期收货，再根据差异处理”，但 OES 必须显式拥有：
  - `ReceivingDiscrepancy`
  - resolution options
- `ReceivingDiscrepancy` 表达的是采购侧“预期与实收不一致”的差异摘要，不替代 `WMS` 的仓储动作真相。
- 差异处理不能被简化成“自动补单”单一路径；short / over / damaged / restricted 等差异都应能进入受控处理决策。

### 4.6 Procurement 与 Finance 边界

- `finance-service` 继续 owns `AP / supplier invoice / payment / allocation`。
- Procurement 不维护付款真相，也不承担 supplier invoice owner。
- phase 1 只要求 Procurement 发布稳定的采购订单、收货预期、收货差异与交易事实口径，为 future `AP` matching / invoice checking 预留输入。
- 历史采购价格第一阶段归 Procurement 交易事实；future `Costing / BI` 只消费分析，不拥有原始采购交易事实。

## 5. 同步 / 异步边界

- 同步：
  - `procurement-service -> srm-service` 查询 `SupplierProfile / SupplierOffering` 当前状态
  - `procurement-service -> item-master-service` 查询 `Item`、`purchasable` 能力与 `SupplierItemMapping`
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
- `SupplierProfile`、`SupplierOffering`：`srm-service`
- `Item`、`ItemCapability`、`SupplierItemMapping`：`item-master-service`
- 实际收货、区位、库存、破损 / 受限库存：`wms-service`
- `AP`、supplier invoice、payment、allocation：`finance-service`

## 7. 明确禁止

- 不把采购商业条款塞进 `SRM`
- 不把库存真相塞进 Procurement
- 不把付款真相塞进 Procurement
- 不把 `SupplierOffering` 扩成价格 / `MOQ` / lead time 对象
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
- 完整事件目录、payload 与 proto 契约
- 完整 workflow / process manager 编排

## 9. 关联文档

- [procurement-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/procurement-service.md)
- [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
- [finance-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/finance-service.md)
- [srm-procurement-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/srm-procurement-party-item-master.md)
