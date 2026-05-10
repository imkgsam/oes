# procurement-service 职责卡

## 1. Purpose

`procurement-service` 是 OES 的统一采购需求入口与采购交易执行服务，负责回答“为什么要买、要买什么、由谁提出、采购承诺到了哪里、哪些预期收货尚未兑现、采购侧应如何处理收货差异”。

当前职责卡只冻结 `procurement-service` phase 1 的 `PR + PO` 最小闭环，不展开 RFQ、SupplierQuote、安全库存、自动补货、AP、供应商发票、付款、完整 workflow 或 proto / schema / UI 实现。

## 2. Owns

- `PurchaseRequest`
- `PurchaseRequestLine`
- `PurchaseRequestApprovalSnapshot`
- `PurchaseOrder`
- `PurchaseOrderLine`
- `PurchaseOrderLineAllocation`
- `PurchaseOrderChange`
- `ReceivingExpectation`
- `ReceivingDiscrepancy`
- 采购交易事实与历史采购价格事实
- 采购侧需求归因、采购承诺、变更留痕与差异处理摘要

补充冻结规则：

- `procurement-service` 是统一采购需求入口，覆盖：
  - 部门日常采购
  - 销售专采
  - 生产 / 包装需求
  - 维修需求
  - 样品采购
- 采购类支出在 phase 1 的正常路径必须先经过 `PR / PO`；`Non-PO purchase` 不是正常主线。
- `PurchaseRequestLine` 必须同时支持：
  - 标准 `Item`
  - 非标准 / 文本型采购需求
- 标准 `Item` 转 `PO` 时，必须校验 `ACTIVE SupplierOffering`。
- 日常非标准采购可不强制依赖 `ACTIVE SupplierOffering` 才能下单。
- `PurchaseOrderLineAllocation` 必须支持同一行同时表达：
  - dedicated to `SalesOrderLine` / `FulfillmentDemand`
  - general stock
- `PurchaseOrderChange` 在 phase 1 只要求轻量 `APPLIED` 变更记录；后续才升级为变更申请 / 审批 / 供应商确认闭环。
- `ReceivingExpectation` 是采购侧对“应收什么、预计何时到、还有多少未到”的预期真相，不是实际收货真相。
- `ReceivingDiscrepancy` 是采购侧对收货差异的摘要与处理入口，不替代 `WMS` 的实际收货、破损或受限库存真相。
- 历史采购价格在第一阶段归 `procurement-service` 交易事实所有；future `Costing / BI` 只消费分析，不拥有原始采购交易事实。

## 3. Does Not Own

- `srm-service` 的供应商主档与可供应关系真相：
  - `SupplierProfile`
  - `SupplierOffering`
- `item-master-service` 的 Item 主数据与供应商型号映射真相：
  - `ItemModel`
  - `Item`
  - Item execution capability
  - `SupplierItemMapping`
- `wms-service` 的实际收货、区位、库存、破损库存、受限库存真相
- `finance-service` 的 `AP`、supplier invoice、payment、payment allocation 真相
- `party-service` 的主体主数据真相
- `RFQ`
- `SupplierQuote`
- 安全库存
- 自动补货
- 完整审批流程引擎与完整 `workflow-service`
- `costing-service`

## 4. Core Responsibilities

- 作为统一入口承接采购需求，并把不同来源的采购诉求收敛到受控 `PR` 语义下。
- 在受控校验后将采购需求转为正式 `PO`，维护采购承诺、行级分配与已发单后的变更留痕。
- 对标准 `Item` 采购执行供应商有效性校验，而不是把商业条款或供应商主档扩写到 Procurement。
- 为 dedicated procurement 与 general stock procurement 提供统一 `PO line allocation` 口径。
- 在采购侧维护“应收未收”的 `ReceivingExpectation` 与“实收偏离预期”的 `ReceivingDiscrepancy` 摘要。
- 对下游页面、Gateway、BI 与 future Finance / Costing 集成提供稳定的采购交易事实引用口径。

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway`
  - future procurement workspace / buyer workspace pages
  - future sales / production / maintenance 发起采购需求的受控入口
- 典型下游消费者：
  - `wms-service`
  - `finance-service`
  - future `BI / costing / analytics`
  - future approval / notification / collaboration entrypoints
- 当前跨服务协同真相：
  - [srm-procurement-party-item-master.md](../collaborations/srm-procurement-party-item-master.md)
  - [procurement-srm-item-wms-finance.md](../collaborations/procurement-srm-item-wms-finance.md)

## 6. Upstream Dependencies

- `srm-service`
  - 提供正式供应商主档与 `SupplierOffering` 可供应关系。
  - Procurement 不把采购商业条款塞回 `SRM`。
- `item-master-service`
  - 提供 `ItemModel`、attribute 到 active + purchasable `Item` 的解析能力，以及 `SupplierItemMapping` 引用基础。
  - Procurement 不复制 Item 主数据或接管供应商型号映射真相。
- `wms-service`
  - 提供实际收货结果、收货数量、破损 / 受限库存结果与仓储侧收货事实。
  - Procurement 只消费其结果来更新 expectation / discrepancy 视图。
- `finance-service`
  - future 接手 `AP / supplier invoice / payment` 闭环。
  - Procurement 不自建付款真相，只向 Finance 暴露采购交易与收货事实。
- `permission-service`
  - 提供采购请求、下单、变更、差异处理的授权判定能力。
- `identity-service` / `tenant-org-service`
  - 提供 `tenant / org / operator` 上下文，用于采购范围隔离、审批快照与审计追踪。

## 7. Downstream / Published Facts

- `PurchaseRequest` / `PurchaseOrder` 状态与摘要
- `PurchaseOrderLineAllocation` dedicated / general stock 分配结果
- `PurchaseOrderChange` 已应用变更留痕
- `ReceivingExpectation` 未到货预期摘要
- `ReceivingDiscrepancy` 差异摘要与处理状态
- 历史采购价格与采购交易事实摘要

## 8. Non-goals

- 不把采购商业条款塞进 `SRM`
- 不把库存、库位、破损 / 受限库存真相塞进 Procurement
- 不把付款、应付、供应商发票真相塞进 Procurement
- 不把 `SupplierOffering` 扩成价格 / `MOQ` / lead time 对象
- 不为了 `Non-PO purchase` 设计复杂正常路径
- 不在 phase 1 引入完整 `workflow-service`
- 不在 phase 1 引入 `costing-service`
- 不在 phase 1 实现 `RFQ / SupplierQuote / safety stock / auto replenishment`

## 9. Current Stage

当前阶段只冻结 `procurement-service` phase 1 的 `PR + PO` 最小闭环：

- `procurement-service` owns 统一采购需求入口与采购交易执行。
- `PurchaseRequest / PurchaseRequestLine / PurchaseRequestApprovalSnapshot` 归 `procurement-service`。
- `PurchaseOrder / PurchaseOrderLine / PurchaseOrderLineAllocation` 归 `procurement-service`。
- `PurchaseOrderChange` 是已发 `PO` 的变更留痕对象。
- `ReceivingExpectation / ReceivingDiscrepancy` 归采购侧拥有，但只表达采购预期与差异摘要。
- `WMS` owns 实际收货、区位、库存、破损 / 受限库存。
- `Finance` owns `AP / supplier invoice / payment / allocation`。
- `SRM` owns `SupplierProfile / SupplierOffering`。
- `Item Master` owns `ItemModel / Item / SupplierItemMapping`。
- phase 1 正常支出路径必须先 `PR / PO`；`Non-PO purchase` 不作为正常路径。
- `PR` 同时支持标准 `Item` 与非标准 / 文本型采购需求。
- 标准 `Item` 转 `PO` 时必须校验 `ACTIVE SupplierOffering`；日常非标准采购可不强制。
- `PO line` 必须支持 allocation，以同时表达 dedicated to `SalesOrderLine / FulfillmentDemand` 与 general stock。
- `PurchaseOrderChange` 在 phase 1 可以是轻量 `APPLIED` 变更记录。
- 安全库存 / 自动补货 deferred。
- `RFQ / SupplierQuote` deferred。
- 历史采购价格第一阶段归 Procurement 交易事实所有；future `Costing / BI` 只消费分析。
- 收货协同可参考 Odoo 风格“先有预期，再根据差异处理”，但 OES 第一阶段必须显式表达 `ReceivingDiscrepancy + resolution options`，而不是只支持自动补单。
